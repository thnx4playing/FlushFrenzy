// src/services/BlowDetector.ts
// Detects blowing into the microphone using expo-av audio metering.
// Usage:
//   const detector = new BlowDetector({ onBlow: () => { ... } });
//   await detector.start();
//   // later:
//   await detector.stop();

import { Audio } from 'expo-av';

export interface BlowDetectorOptions {
  /** Called once when a blow is first detected (rising edge). */
  onBlow: () => void;
  /** dB threshold above which counts as a blow. Default: -18 */
  threshold?: number;
  /** Milliseconds the signal must stay above threshold to count. Default: 120 */
  holdMs?: number;
  /** Milliseconds between metering polls. Default: 50 (~20 fps) */
  pollIntervalMs?: number;
  /** Cooldown in ms after a successful blow before another can trigger. Default: 600 */
  cooldownMs?: number;
}

export class BlowDetector {
  private recording: Audio.Recording | null = null;
  private pollTimer: ReturnType<typeof setInterval> | null = null;
  private aboveStart: number = 0;
  private blown: boolean = false;
  private lastBlowTime: number = 0;
  private opts: Required<BlowDetectorOptions>;
  private _started: boolean = false;
  private _retryCount: number = 0;
  private _startTime: number = 0;
  private _gotRealReading: boolean = false;

  private static readonly MAX_RETRIES = 3;
  private static readonly SILENCE_CHECK_MS = 3000;

  constructor(options: BlowDetectorOptions) {
    this.opts = {
      threshold: options.threshold ?? -18,
      holdMs: options.holdMs ?? 120,
      pollIntervalMs: options.pollIntervalMs ?? 50,
      cooldownMs: options.cooldownMs ?? 600,
      onBlow: options.onBlow,
    };
  }

  get isRunning(): boolean {
    return this._started;
  }

  async start(): Promise<void> {
    if (this._started) return;

    try {
      // Request microphone permission (triggers iOS prompt on first launch)
      const permResult = await Audio.requestPermissionsAsync();
      if (permResult.status !== 'granted') {
        return;
      }

      await this.startRecording();
    } catch (error) {
      this._started = false;
    }
  }

  private async startRecording(): Promise<void> {
    // Tear down any existing recording first
    await this.teardownRecording();

    try {
      // Small delay to let the audio session settle
      await new Promise(resolve => setTimeout(resolve, 500));

      // Configure audio session for recording
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        interruptionModeIOS: 0,        // MIX_WITH_OTHERS — keeps game music playing
        shouldDuckAndroid: false,
        interruptionModeAndroid: 2,    // DoNotMix on Android
        playThroughEarpieceAndroid: false,
      });

      // Create and prepare recording with metering enabled
      this.recording = new Audio.Recording();
      await this.recording.prepareToRecordAsync({
        isMeteringEnabled: true,
        android: {
          extension: '.m4a',
          outputFormat: Audio.AndroidOutputFormat.MPEG_4,
          audioEncoder: Audio.AndroidAudioEncoder.AAC,
          sampleRate: 22050,
          numberOfChannels: 1,
          bitRate: 64000,
        },
        ios: {
          extension: '.m4a',
          outputFormat: Audio.IOSOutputFormat.MPEG4AAC,
          audioQuality: Audio.IOSAudioQuality.LOW,
          sampleRate: 22050,
          numberOfChannels: 1,
          bitRate: 64000,
          linearPCMBitDepth: 16,
          linearPCMIsBigEndian: false,
          linearPCMIsFloat: false,
        },
        web: {},
      });

      await this.recording.startAsync();
      this._started = true;
      this._startTime = Date.now();
      this._gotRealReading = false;

      // Start polling metering data
      this.pollTimer = setInterval(() => this.poll(), this.opts.pollIntervalMs);
    } catch (error) {
      this._started = false;
    }
  }

  private async teardownRecording(): Promise<void> {
    if (this.pollTimer) {
      clearInterval(this.pollTimer);
      this.pollTimer = null;
    }

    if (this.recording) {
      try {
        await this.recording.stopAndUnloadAsync();
      } catch (e) {
        // Already stopped, ignore
      }
      this.recording = null;
    }
  }

  private async restart(): Promise<void> {
    if (this._retryCount >= BlowDetector.MAX_RETRIES) return;
    this._retryCount++;
    this._started = false;

    await this.teardownRecording();

    // Force a full audio session category cycle (false → true).
    // On first-time permission grant, AudioManager already set
    // allowsRecordingIOS: true before permission was granted, so iOS
    // didn't actually enable recording. Setting to false first forces
    // iOS to re-establish the category on the next true.
    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
      });
    } catch (e) {
      // Best effort
    }

    await new Promise(resolve => setTimeout(resolve, 500));

    await this.startRecording();
  }

  async stop(): Promise<void> {
    if (!this._started) return;
    this._started = false;

    await this.teardownRecording();

    // Restore audio mode for playback
    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
      });
    } catch (e) {
      // Best effort
    }

    this.aboveStart = 0;
    this.blown = false;
  }

  private async poll(): Promise<void> {
    if (!this.recording || !this._started) return;

    try {
      const status = await this.recording.getStatusAsync();
      if (!status.isRecording) return;

      const metering = status.metering ?? -160;
      const now = Date.now();

      // Track whether we've received any real audio data (not silence)
      if (metering > -160) {
        this._gotRealReading = true;
      }

      // Self-healing: if we've been getting only silence for too long,
      // the recording pipeline likely didn't initialize properly (common
      // on first-time permission grant). Tear down and retry.
      if (
        !this._gotRealReading &&
        now - this._startTime > BlowDetector.SILENCE_CHECK_MS
      ) {
        this.restart();
        return;
      }

      if (metering > this.opts.threshold) {
        // Signal is above threshold
        if (this.aboveStart === 0) {
          this.aboveStart = now;
        }

        const held = now - this.aboveStart;
        if (
          held >= this.opts.holdMs &&
          !this.blown &&
          now - this.lastBlowTime > this.opts.cooldownMs
        ) {
          // Blow detected!
          this.blown = true;
          this.lastBlowTime = now;
          this.opts.onBlow();
        }
      } else {
        // Signal dropped below threshold — reset
        this.aboveStart = 0;
        this.blown = false;
      }
    } catch (e) {
      // Metering read failed, skip this tick
    }
  }
}

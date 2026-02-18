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
      // Request microphone permission first (this triggers the iOS prompt)
      const permResult = await Audio.requestPermissionsAsync();
      console.log('[BlowDetector] Mic permission status:', permResult.status);
      if (permResult.status !== 'granted') {
        console.warn('[BlowDetector] Microphone permission not granted');
        return;
      }

      // Small delay to ensure any competing audio mode changes have settled
      await new Promise(resolve => setTimeout(resolve, 300));

      // Configure audio session for recording — this MUST run after permission is granted
      // and must override any previous setAudioModeAsync calls
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
        interruptionModeIOS: 1, // DO_NOT_MIX
        shouldDuckAndroid: true,
        interruptionModeAndroid: 1,
        playThroughEarpieceAndroid: false,
      });
      console.log('[BlowDetector] Audio mode set for recording');

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
      console.log('[BlowDetector] Recording started, polling metering');

      // Start polling metering data
      this.pollTimer = setInterval(() => this.poll(), this.opts.pollIntervalMs);
    } catch (error) {
      console.warn('[BlowDetector] Failed to start:', error);
      this._started = false;
    }
  }

  async stop(): Promise<void> {
    if (!this._started) return;
    this._started = false;

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

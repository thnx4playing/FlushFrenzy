// Path: src/audio/AudioManager.js
import { Audio } from 'expo-av';
import { useAudioStore } from './AudioStore';

// Singleton audio manager
class AudioManagerClass {
  constructor() {
    this._initialized = false;
    this._silenceHolds = new Set();
    this._musicWanted = false;
    this._music = null;
    this._musicKind = null;
    this._sfx = {};
    this._unsub = null;
  }

  async init() {
    if (this._initialized) return;
    try {
      // MUSIC FIX: Prime the audio session for BOTH recording and playback from the start.
      // If we start with allowsRecordingIOS: false, BlowDetector later changes the category
      // to PlayAndRecord which triggers an iOS interruption that kills the music.
      // Starting with allowsRecordingIOS: true + MixWithOthers means BlowDetector's
      // setAudioModeAsync call won't change the category, so no interruption fires.
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        staysActiveInBackground: false,
        playsInSilentModeIOS: true,
        interruptionModeIOS: 0,        // MIX_WITH_OTHERS — keep music playing during recording
        shouldDuckAndroid: false,
        interruptionModeAndroid: 2,
        playThroughEarpieceAndroid: false,
      });

      const { sound: menu } = await Audio.Sound.createAsync(
        require('../../assets/jingle.m4a'),
        { shouldPlay: false, isLooping: true }
      );
      this._music = menu;
      this._musicKind = 'menu';

      const { sound: ding } = await Audio.Sound.createAsync(
        require('../../assets/ding.mp3'),
        { shouldPlay: false, isLooping: false }
      );
      const { sound: water } = await Audio.Sound.createAsync(
        require('../../assets/water-drop.caf'),
        { shouldPlay: false, isLooping: false }
      );
      this._sfx.ding = ding;
      this._sfx.water_drop = water;

      const store = useAudioStore.getState();
      this._applyState(store);
      this._unsub = useAudioStore.subscribe((s) => {
        this._applyState(s);
      });

      this._initialized = true;
    } catch (e) {}
  }

  // Silence only the game's sound objects. Never disable the shared iOS
  // audio session: the WebView still needs its microphone and call audio.
  acquireSilence() {
    const hold = Symbol('webview');
    this._silenceHolds.add(hold);
    const ready = this._applyState(useAudioStore.getState());
    return {
      ready,
      release: () => {
        if (!this._silenceHolds.delete(hold)) return;
        void this._applyState(useAudioStore.getState());
      },
    };
  }

  _applyState(state) {
    const silenced = this._silenceHolds.size > 0;
    const updates = [];
    if (this._music) {
      updates.push(this._music.setStatusAsync({
        volume: silenced || state.musicMuted ? 0 : state.musicVolume ?? 1,
        isMuted: silenced || state.musicMuted,
        shouldPlay: !silenced && !state.musicMuted && this._musicWanted,
      }).catch(() => {}));
    }
    for (const snd of Object.values(this._sfx)) {
      if (!snd) continue;
      updates.push(snd.setStatusAsync({
        volume: silenced || state.sfxMuted ? 0 : state.sfxVolume ?? 1,
        isMuted: silenced || state.sfxMuted,
        ...(silenced ? { shouldPlay: false } : {}),
      }).catch(() => {}));
    }
    return Promise.all(updates);
  }

  async _ensureInit() {
    if (!this._initialized && !this._silenceHolds.size) await this.init();
  }

  async playMenuMusic() {
    this._musicWanted = true;
    if (this._silenceHolds.size) return;
    await this._ensureInit();
    if (!this._music || this._musicKind !== 'menu') {
      try {
        if (this._music) await this._music.unloadAsync().catch(() => {});
        const { sound } = await Audio.Sound.createAsync(
          require('../../assets/jingle.m4a'),
          { shouldPlay: false, isLooping: true }
        );
        this._music = sound;
        this._musicKind = 'menu';
        this._applyState(useAudioStore.getState());
      } catch (error) {
        this._music = null;
        this._musicKind = null;
        return;
      }
    }
    if (this._music && this._musicWanted && !this._silenceHolds.size) {
      await this._music.stopAsync().catch(() => {});
    }
    await this._applyState(useAudioStore.getState());
  }

  async playGameMusic({ loop = true } = {}) {
    this._musicWanted = true;
    if (this._silenceHolds.size) return;
    await this._ensureInit();
    if (!this._music || this._musicKind !== 'game') {
      if (this._music) await this._music.unloadAsync().catch(() => {});
      const { sound } = await Audio.Sound.createAsync(
        require('../../assets/jingle.m4a'),
        { shouldPlay: false, isLooping: loop }
      );
      this._music = sound;
      this._musicKind = 'game';
      this._applyState(useAudioStore.getState());
    }
    if (this._music && this._musicWanted && !this._silenceHolds.size) {
      await this._music.stopAsync().catch(() => {});
    }
    await this._applyState(useAudioStore.getState());
  }

  async stopMusic() {
    this._musicWanted = false;
    if (this._music) await this._music.stopAsync().catch(() => {});
  }

  async pauseMusic() {
    this._musicWanted = false;
    await this._applyState(useAudioStore.getState());
  }

  async resumeMusic() {
    this._musicWanted = true;
    if (this._silenceHolds.size) return;
    await this._ensureInit();
    await this._applyState(useAudioStore.getState());
  }

  async playSfx(name) {
    if (this._silenceHolds.size) return;
    await this._ensureInit();
    const { sfxMuted } = useAudioStore.getState();
    if (sfxMuted || this._silenceHolds.size) return;
    const snd = this._sfx[name];
    if (snd) {
      await snd.stopAsync().catch(() => {});
      if (this._silenceHolds.size || useAudioStore.getState().sfxMuted) return;
      await snd.replayAsync().catch(() => {});
    }
  }

  async dispose() {
    if (this._unsub) this._unsub();
    this._unsub = null;
    if (this._music) await this._music.unloadAsync().catch(() => {});
    for (const key of Object.keys(this._sfx)) {
      await this._sfx[key]?.unloadAsync().catch(() => {});
    }
    this._initialized = false;
  }
}

export const AudioManager = new AudioManagerClass();

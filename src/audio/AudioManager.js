import { Audio } from 'expo-av';
import { useAudioStore } from './AudioStore';

// Singleton audio manager
class AudioManagerClass {
  constructor() {
    this._initialized = false;
    this._music = null;       // Audio.Sound
    this._musicKind = null;   // 'menu' | 'game'
    this._sfx = {};           // { ding, water_drop }
    this._unsub = null;
  }

  async init() {
    if (this._initialized) return;
    try {
      console.log('AudioManager: Initializing...');
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        staysActiveInBackground: false,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });
      console.log('AudioManager: Audio mode set successfully');

      // Preload music + sfx
      // NOTE: Replace these with different tracks if you have them
      const { sound: menu } = await Audio.Sound.createAsync(
        require('../../assets/jingle.m4a'),
        { shouldPlay: false, isLooping: true }
      );
      this._music = menu;
      this._musicKind = 'menu';
      console.log('AudioManager: Menu music loaded');

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
      console.log('AudioManager: SFX loaded');

      // React to global state changes (mute/volume)
      const store = useAudioStore.getState();
      console.log('AudioManager: Initial store state:', store);
      this._applyState(store);
      this._unsub = useAudioStore.subscribe((s) => {
        console.log('AudioManager: Store state changed:', s);
        this._applyState(s);
      });

      this._initialized = true;
      console.log('AudioManager: Initialization complete');
    } catch (e) {
      console.log('AudioManager init error:', e);
    }
  }

  _applyState(state) {
    console.log('AudioManager: Applying state:', state);
    // Music volume/mute
    if (this._music) {
      // Add state verification to catch audio desync
      this._music.getStatusAsync().then(status => {
        if (!status.isLoaded) {
          console.warn('AudioManager: Music not loaded, reinitializing');
          this._music = null;
          this._musicKind = null;
          this.init();
          return;
        }
        
        try {
          const mv = state.musicMuted ? 0 : state.musicVolume ?? 1;
          console.log('AudioManager: Setting music volume to:', mv);
          this._music.setVolumeAsync(mv).catch((e) => console.log('AudioManager: Volume set error:', e));
          if (state.musicMuted) {
            console.log('AudioManager: Muting music');
            this._music.setIsMutedAsync(true).catch((e) => console.log('AudioManager: Mute set error:', e));
            this._music.stopAsync().catch((e) => console.log('AudioManager: Stop error:', e));
          } else {
            console.log('AudioManager: Unmuting music');
            this._music.setIsMutedAsync(false).catch((e) => console.log('AudioManager: Unmute set error:', e));
            
            // If we're unmuting and have music loaded, start playing based on current music kind
            if (this._musicKind === 'menu') {
              console.log('AudioManager: Restarting menu music after unmute');
              this._music.replayAsync().catch((e) => console.log('AudioManager: Replay error:', e));
            } else if (this._musicKind === 'game') {
              console.log('AudioManager: Restarting game music after unmute');
              this._music.playAsync().catch((e) => console.log('AudioManager: Play error:', e));
            }
          }
        } catch (error) {
          console.log('AudioManager: Error in _applyState for music:', error);
          // Reset music instance if there's an error
          this._music = null;
          this._musicKind = null;
        }
      }).catch(e => {
        console.warn('AudioManager: Audio status check failed:', e);
        this._music = null; // Force reinit
        this._musicKind = null;
      });
    } else {
      console.log('AudioManager: No music instance available');
    }
    // SFX volume/mute
    const sv = state.sfxMuted ? 0 : state.sfxVolume ?? 1;
    for (const key of Object.keys(this._sfx)) {
      const snd = this._sfx[key];
      if (snd) {
        try {
          snd.setVolumeAsync(sv).catch(() => {});
        } catch (error) {
          console.log('AudioManager: Error setting SFX volume for', key, ':', error);
          // Remove problematic SFX instance
          this._sfx[key] = null;
        }
      }
    }
  }

  async _ensureInit() {
    if (!this._initialized) await this.init();
  }

  async playMenuMusic() {
    await this._ensureInit();
    const { musicMuted } = useAudioStore.getState();
    console.log('AudioManager: musicMuted state:', musicMuted);
    if (!this._music || this._musicKind !== 'menu') {
      console.log('AudioManager: Loading menu music');
      try {
        // unload previous and load menu track (using jingle as menu here)
        if (this._music) await this._music.unloadAsync().catch(() => {});
        const { sound } = await Audio.Sound.createAsync(
          require('../../assets/jingle.m4a'),
          { shouldPlay: false, isLooping: true }
        );
        this._music = sound;
        this._musicKind = 'menu';
        this._applyState(useAudioStore.getState());
      } catch (error) {
        console.log('AudioManager: Error loading menu music:', error);
        this._music = null;
        this._musicKind = null;
        return;
      }
    }
    if (!musicMuted && this._music) {
      console.log('AudioManager: Playing menu music');
      try {
        // Ensure mute flag is cleared before playing
        await this._music.setIsMutedAsync(false).catch(() => {});
        await this._music.stopAsync().catch(() => {});
        await this._music.replayAsync().catch(() => {});
      } catch (error) {
        console.log('AudioManager: Error playing menu music:', error);
      }
    } else {
      console.log('AudioManager: Menu music muted, not playing');
    }
  }

  async playGameMusic({ loop = true } = {}) {
    await this._ensureInit();
    const { musicMuted } = useAudioStore.getState();
    if (!this._music || this._musicKind !== 'game') {
      if (this._music) await this._music.unloadAsync().catch(() => {});
      // reuse jingle as a placeholder; swap to your real game track if you have it
      const { sound } = await Audio.Sound.createAsync(
        require('../../assets/jingle.m4a'),
        { shouldPlay: false, isLooping: loop }
      );
      this._music = sound;
      this._musicKind = 'game';
      this._applyState(useAudioStore.getState());
    }
    if (!musicMuted) {
      // Ensure mute flag is cleared before playing
      await this._music.setIsMutedAsync(false).catch(() => {});
      await this._music.stopAsync().catch(() => {});
      await this._music.playAsync().catch(() => {});
    }
  }

  async stopMusic() {
    await this._ensureInit();
    if (this._music) {
      await this._music.stopAsync().catch(() => {});
    }
  }

  async pauseMusic() {
    await this._ensureInit();
    if (this._music) {
      try {
        await this._music.pauseAsync();
        console.log('AudioManager: Music paused');
      } catch (error) {
        console.log('AudioManager: Error pausing music:', error);
      }
    }
  }

  async resumeMusic() {
    await this._ensureInit();
    if (this._music) {
      try {
        await this._music.playAsync();
        console.log('AudioManager: Music resumed');
      } catch (error) {
        console.log('AudioManager: Error resuming music:', error);
      }
    }
  }

  async playSfx(name) {
    await this._ensureInit();
    const { sfxMuted } = useAudioStore.getState();
    if (sfxMuted) return;
    const snd = this._sfx[name];
    if (snd) {
      await snd.stopAsync().catch(() => {});
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

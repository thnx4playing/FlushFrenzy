import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export const useAudioStore = create(
  persist(
    (set, get) => ({
      musicMuted: false,
      sfxMuted: false,
      musicVolume: 1.0, // 0..1
      sfxVolume: 1.0,   // 0..1
      setMusicMuted: (muted) => set({ musicMuted: muted }),
      setSfxMuted: (muted) => set({ sfxMuted: muted }),
      toggleMusic: () => set({ musicMuted: !get().musicMuted }),
      toggleSfx: () => set({ sfxMuted: !get().sfxMuted }),
      setMusicVolume: (v) => set({ musicVolume: Math.max(0, Math.min(1, v)) }),
      setSfxVolume: (v) => set({ sfxVolume: Math.max(0, Math.min(1, v)) }),
      // Reset to unmuted on fresh app launch
      resetToDefaults: () => set({ 
        musicMuted: false, 
        sfxMuted: false, 
        musicVolume: 1.0, 
        sfxVolume: 1.0 
      }),
    }),
    {
      name: 'audio_settings_v2',
      storage: createJSONStorage(() => AsyncStorage),
      version: 1,
      migrate: (persisted) => persisted, // simple
    }
  )
);

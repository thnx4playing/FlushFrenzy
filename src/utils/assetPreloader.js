import { useState, useEffect, useRef } from 'react';
import { Audio } from 'expo-av';
import { Image } from 'react-native';
import { Asset } from 'expo-asset';

// Implement lazy loading for game assets
export const useAssetPreloader = () => {
  const [assetsLoaded, setAssetsLoaded] = useState(false);
  
  useEffect(() => {
    const preloadAssets = async () => {
      try {
        const audioAssets = [
          require('../../assets/ding.mp3'),
          require('../../assets/water-drop.caf'),
          require('../../assets/perk-sound.caf'),
          require('../../assets/jingle.mp3'),
          require('../../assets/win.caf'),
        ];

        const imageAssets = [
          require('../../assets/tp.png'),
          require('../../assets/tp-blue.png'),
          require('../../assets/tp-green.png'),
          require('../../assets/tp-orange.png'),
          require('../../assets/tp-pink.png'),
          require('../../assets/tp-purple.png'),
          require('../../assets/tp-rainbow.png'),
          require('../../assets/tp-red.png'),
          require('../../assets/toilet.png'),
          require('../../assets/plunger.png'),
          require('../../assets/duck.png'),
          require('../../assets/game_background.png'),
        ];

        // Preload audio files
        const audioPromises = audioAssets.map(asset => 
          Audio.Sound.createAsync(asset, { shouldPlay: false, isLooping: false })
            .then(({ sound }) => sound)
            .catch(() => null) // Continue if audio fails to load
        );

        // Preload image assets
        const imagePromises = imageAssets.map(asset => 
          Asset.fromModule(asset).downloadAsync().catch(() => null)
        );

        await Promise.allSettled([...audioPromises, ...imagePromises]);
        setAssetsLoaded(true);
      } catch (error) {
        console.warn('Asset preloading failed:', error);
        setAssetsLoaded(true); // Continue anyway
      }
    };
    
    preloadAssets();
  }, []);
  
  return assetsLoaded;
};

// Add cleanup for sound effects
export const useSoundCleanup = (sounds) => {
  useEffect(() => {
    return () => {
      // Clean up all sounds on unmount
      sounds.forEach(sound => {
        if (sound) {
          sound.unloadAsync().catch(() => {});
        }
      });
    };
  }, [sounds]);
};

// Add physics interpolation
export const interpolatePosition = (current, target, alpha = 0.1) => {
  if (!current || !target) return target || current || { x: 0, y: 0 };
  
  return {
    x: current.x + (target.x - current.x) * alpha,
    y: current.y + (target.y - current.y) * alpha
  };
};

// Add FPS monitoring for debugging
export const useFPSCounter = () => {
  const [fps, setFps] = useState(60);
  const frameCount = useRef(0);
  const lastTime = useRef(Date.now());
  
  useEffect(() => {
    const updateFPS = () => {
      frameCount.current++;
      const now = Date.now();
      if (now - lastTime.current >= 1000) {
        setFps(frameCount.current);
        frameCount.current = 0;
        lastTime.current = now;
      }
      requestAnimationFrame(updateFPS);
    };
    updateFPS();
  }, []);
  
  return fps;
};

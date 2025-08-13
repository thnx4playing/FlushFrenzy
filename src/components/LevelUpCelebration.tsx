import React, { useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import ConfettiCannon from 'react-native-confetti-cannon';
import * as Haptics from 'expo-haptics';
import { Audio } from 'expo-av';

type Props = {
  visible: boolean;
  round?: number;
  onDone?: () => void;
  onStart?: () => void; // Called when celebration starts
  topOffset?: number; // safe-area or HUD height (px)
  sound?: any;        // require('.../win.mp3') if you want a different clip
};

export default function LevelUpCelebration({
  visible,
  round,
  onDone,
  onStart,
  topOffset = 0,
  sound,
}: Props) {
  // force ConfettiCannon to re-mount every time we show
  const instanceKey = useMemo(() => (visible ? `${Date.now()}` : 'off'), [visible]);

  useEffect(() => {
    let soundObj: Audio.Sound | null = null;
    let timeoutId: NodeJS.Timeout | null = null;

    const play = async () => {
      if (!visible) return;

      // Notify that celebration is starting
      onStart?.();

      // Gentle success bump
      try { await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); } catch {}

      // Confetti + sound (only play once)
      try {
        const src = sound ?? require('../../assets/ding.mp3');
        const { sound: s } = await Audio.Sound.createAsync(src, { volume: 0.9, shouldPlay: true });
        soundObj = s;
      } catch {}

      // Auto-hide after the confetti settles
      timeoutId = setTimeout(() => onDone?.(), 2200);
    };

    play();

    return () => {
      if (soundObj) {
        soundObj.unloadAsync().catch(() => {});
      }
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [visible, onDone, sound]);

  if (!visible) return null;

  return (
    <View pointerEvents="none" style={[StyleSheet.absoluteFill, { zIndex: 999 }]}>
      {/* Confetti rains from the HUD down */}
      <ConfettiCannon
        key={instanceKey}
        autoStart
        count={120} // Reduced for better performance
        fadeOut
        origin={{ x: -10, y: topOffset + 20 }} // Start from HUD area, shoot down
        explosionSpeed={Platform.OS === 'ios' ? 350 : 300}
        fallSpeed={Platform.OS === 'ios' ? 2000 : 1800}
        colors={['#FF5DA2', '#6EEB83', '#55C1FF', '#FFD166', '#B388FF', '#FF9B85']}
        onAnimationEnd={onDone}
      />

      {/* Fun "LEVEL UP" pill positioned lower to avoid icons */}
      <View style={[styles.banner, { marginTop: topOffset + 120 }]}>
        <Text style={styles.bannerText}>LEVEL UP!</Text>
        {typeof round === 'number' && (
          <Text style={styles.roundText}>Round {round}</Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    alignSelf: 'center',
    backgroundColor: '#2ee59d',
    paddingHorizontal: 22,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 4,
    borderColor: '#1ea06d',
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  bannerText: {
    fontSize: 22,
    fontWeight: '900',
    color: '#0e4a2f',
    textShadowColor: 'rgba(255,255,255,0.6)',
    textShadowRadius: 6,
  },
  roundText: {
    marginTop: 2,
    fontSize: 14,
    fontWeight: '800',
    color: '#0e4a2f',
    opacity: 0.8,
    textAlign: 'center',
  },
});

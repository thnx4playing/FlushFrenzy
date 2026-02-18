// src/components/HUDBar.tsx
// REDESIGNED: Minimal floating HUD - less intrusive, smaller footprint

import React, { useEffect, useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Easing,
} from 'react-native';

type Props = {
  round: number;
  points: number;
  pointsNeeded: number;
  timeLeft: number;
  total: number;
  criticalTime?: number;
  timeFlash?: boolean;
  timerFrozen?: boolean;
};

const HUDBar: React.FC<Props> = ({
  round,
  points,
  pointsNeeded,
  timeLeft,
  total,
  criticalTime = 10,
  timeFlash = false,
  timerFrozen = false,
}) => {
  const timePulse = useRef(new Animated.Value(0)).current;
  const frozenPulse = useRef(new Animated.Value(0)).current;

  // Critical time pulsing
  useEffect(() => {
    if (timeLeft <= criticalTime && !timerFrozen) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(timePulse, { toValue: 1, duration: 400, easing: Easing.out(Easing.quad), useNativeDriver: true }),
          Animated.timing(timePulse, { toValue: 0, duration: 400, easing: Easing.in(Easing.quad), useNativeDriver: true }),
        ])
      ).start();
    } else {
      timePulse.stopAnimation();
      timePulse.setValue(0);
    }
  }, [timeLeft, criticalTime, timerFrozen]);

  // Frozen effect
  useEffect(() => {
    if (timerFrozen) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(frozenPulse, { toValue: 1, duration: 1500, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
          Animated.timing(frozenPulse, { toValue: 0, duration: 1500, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        ])
      ).start();
    } else {
      frozenPulse.stopAnimation();
      frozenPulse.setValue(0);
    }
  }, [timerFrozen]);

  // Cleanup
  useEffect(() => {
    return () => {
      timePulse.stopAnimation();
      frozenPulse.stopAnimation();
    };
  }, []);

  const timeScale = timePulse.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.15],
  });

  const frozenScale = frozenPulse.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.05],
  });

  const isCritical = timeLeft <= criticalTime && !timerFrozen;

  return (
    <View style={styles.container}>
      {/* Left: Round */}
      <View style={styles.leftSection}>
        <View style={styles.pillSmall}>
          <Text style={styles.pillLabel}>R{round}</Text>
        </View>
      </View>

      {/* Center: Points & Time */}
      <View style={styles.centerSection}>
        <View style={[styles.pillCenter, isCritical && styles.pillCritical, timerFrozen && styles.pillFrozen]}>
          <View style={styles.centerContent}>
            <Text style={styles.pointsText}>{points}/{pointsNeeded}</Text>
            <View style={styles.timeDivider} />
            <Animated.Text 
              style={[
                styles.timeText,
                isCritical && styles.timeTextCritical,
                timerFrozen && styles.timeTextFrozen,
                { transform: [{ scale: timerFrozen ? frozenScale : (isCritical ? timeScale : 1) }] }
              ]}
            >
              {timerFrozen ? '❄️' : ''}{timeLeft}s
            </Animated.Text>
          </View>
        </View>
      </View>

      {/* Right: Total */}
      <View style={styles.rightSection}>
        <View style={styles.pillSmall}>
          <Text style={styles.totalValue}>{total}</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    width: '100%',
  },
  leftSection: {
    flex: 1,
    alignItems: 'flex-start',
  },
  centerSection: {
    flex: 2,
    alignItems: 'center',
  },
  rightSection: {
    flex: 1,
    alignItems: 'flex-end',
  },
  pillSmall: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  pillLabel: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  totalValue: {
    fontSize: 16,
    fontWeight: '900',
    color: '#FFD700',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  pillCenter: {
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.25)',
  },
  pillCritical: {
    backgroundColor: 'rgba(220, 53, 69, 0.7)',
    borderColor: 'rgba(255, 100, 100, 0.5)',
  },
  pillFrozen: {
    backgroundColor: 'rgba(135, 206, 235, 0.4)',
    borderColor: 'rgba(135, 206, 235, 0.6)',
  },
  centerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  pointsText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  timeDivider: {
    width: 1,
    height: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  timeText: {
    fontSize: 16,
    fontWeight: '900',
    color: '#FFFFFF',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
    minWidth: 40,
    textAlign: 'center',
  },
  timeTextCritical: {
    color: '#FFCCCC',
  },
  timeTextFrozen: {
    color: '#87CEEB',
  },
});

export default HUDBar;

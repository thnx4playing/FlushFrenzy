// src/components/HUDBar.tsx
import React, { useEffect, useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Easing,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

type Props = {
  round: number;
  points: number;
  pointsNeeded: number;
  timeLeft: number;
  total: number;
  style?: ViewStyle;
  criticalTime?: number;
  criticalNeeded?: number;
  primary?: string;
  secondary?: string;
  accent?: string;
  timeFlash?: boolean;
  timerFrozen?: boolean;
};

const HUDBar: React.FC<Props> = ({
  round,
  points,
  pointsNeeded,
  timeLeft,
  total,
  style,
  criticalTime = 10,
  criticalNeeded = 2,
  // Updated to blue tones
  primary = '#4DA8FF',    // Lighter sky blue
  secondary = '#0077CC',  // Rich ocean blue
  accent = '#A8D8FF',     // Soft blue highlight
  timeFlash = false,
  timerFrozen = false,
}) => {
  const timePulse = useRef(new Animated.Value(0)).current;
  const dangerPulse = useRef(new Animated.Value(0)).current;
  const frozenPulse = useRef(new Animated.Value(0)).current;
  const iceEffect = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (timeLeft <= criticalTime) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(timePulse, { toValue: 1, duration: 450, easing: Easing.out(Easing.quad), useNativeDriver: true }),
          Animated.timing(timePulse, { toValue: 0, duration: 450, easing: Easing.in(Easing.quad), useNativeDriver: true }),
        ])
      ).start();
    } else {
      timePulse.stopAnimation();
      timePulse.setValue(0);
    }
  }, [timeLeft, criticalTime]);

  // Frozen effect animation
  useEffect(() => {
    if (timerFrozen) {
      // Start ice effect animation
      iceEffect.setValue(1);
      
      // Start slow pulsing animation for frozen state
      Animated.loop(
        Animated.sequence([
          Animated.timing(frozenPulse, { 
            toValue: 1, 
            duration: 2000, 
            easing: Easing.inOut(Easing.sine), 
            useNativeDriver: true 
          }),
          Animated.timing(frozenPulse, { 
            toValue: 0, 
            duration: 2000, 
            easing: Easing.inOut(Easing.sine), 
            useNativeDriver: true 
          }),
        ])
      ).start();
    } else {
      // Stop frozen animations
      iceEffect.setValue(0);
      frozenPulse.stopAnimation();
      frozenPulse.setValue(0);
    }
  }, [timerFrozen]);

  useEffect(() => {
    if (timeLeft <= criticalTime) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(dangerPulse, { toValue: 1, duration: 500, useNativeDriver: false }),
          Animated.timing(dangerPulse, { toValue: 0, duration: 500, useNativeDriver: false }),
        ])
      ).start();
    } else {
      dangerPulse.stopAnimation();
      dangerPulse.setValue(0);
    }
  }, [timeLeft, criticalTime]);

  const timeStyle: TextStyle = useMemo(
    () => ({
      transform: [
        {
          scale: timePulse.interpolate({
            inputRange: [0, 1],
            outputRange: [1, 1.12],
          }),
        },
      ],
    }),
    []
  );

  const frozenTimeStyle: TextStyle = useMemo(
    () => ({
      color: iceEffect.interpolate({
        inputRange: [0, 1],
        outputRange: ['#FFFFFF', '#87CEEB'], // White to light blue
      }),
      transform: [
        {
          scale: frozenPulse.interpolate({
            inputRange: [0, 1],
            outputRange: [1, 1.05],
          }),
        },
      ],
      textShadowColor: iceEffect.interpolate({
        inputRange: [0, 1],
        outputRange: ['rgba(0,0,0,0.7)', '#87CEEB'],
      }),
      textShadowOffset: { width: 0, height: 2 },
      textShadowRadius: iceEffect.interpolate({
        inputRange: [0, 1],
        outputRange: [3, 6],
      }),
    }),
    []
  );



  const bgPrimary = dangerPulse.interpolate({
    inputRange: [0, 1],
    outputRange: [primary, '#FF4C4C'],
  });

  const bgSecondary = dangerPulse.interpolate({
    inputRange: [0, 1],
    outputRange: [secondary, '#CC0000'],
  });

  return (
    <View style={[styles.wrap, style]}>
      <AnimatedLinearGradient
        colors={[bgPrimary, bgSecondary]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={styles.card}
      >
         <LinearGradient
          colors={[accent, 'transparent']}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={styles.gloss}
        />
        {timerFrozen && (
          <Animated.View 
            style={[
              styles.iceOverlay,
              {
                opacity: iceEffect,
              }
            ]}
          />
        )}

                 <View style={styles.row}>
           <Stat label="ROUND" value={round} />
           <Divider />
           <Stat label="POINTS" value={`${points}/${pointsNeeded}`} />
           <Divider />
           <Stat
             label="TIME"
             value={
               <Animated.Text style={[
                 styles.valueBig, 
                 timerFrozen ? frozenTimeStyle : timeStyle
               ]}>
                 {timerFrozen ? '❄️' : ''}{timeLeft}s
               </Animated.Text>
             }
           />
           <Divider />
           <Stat label="TOTAL" value={total} />
         </View>
      </AnimatedLinearGradient>
    </View>
  );
};

const AnimatedLinearGradient = Animated.createAnimatedComponent(LinearGradient);

const Stat = ({ label, value }: { label: string; value: React.ReactNode }) => (
  <View style={styles.stat}>
    <Text style={styles.label}>{label}</Text>
    {typeof value === 'string' || typeof value === 'number' ? (
      <Text style={styles.valueBig}>{value}</Text>
    ) : (
      value
    )}
  </View>
);

const Divider = () => <View style={styles.divider} />;

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: 8,
    paddingTop: 2,
    width: '95%',
    maxWidth: 500,
  },
  card: {
    borderRadius: 22,
    paddingVertical: 12,
    paddingHorizontal: 8,
    overflow: 'hidden',
    borderWidth: 3,
    borderColor: 'rgba(0,0,0,0.25)',
    shadowColor: '#000',
    shadowOpacity: 0.35,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 10,
  },
  gloss: {
    position: 'absolute',
    left: 8,
    right: 8,
    top: 6,
    height: 18,
    borderRadius: 18,
    opacity: 0.55,
  },
  iceOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: 'rgba(135, 206, 235, 0.15)', // Light blue ice tint
    borderRadius: 22,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'stretch',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
  stat: {
    flex: 1,
    minWidth: 70,
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 4,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 14,
    marginHorizontal: 2,
  },
  label: {
    fontSize: 11,
    letterSpacing: 0.5,
    color: '#FFFFFF',
    fontWeight: '800',
    marginBottom: 2,
    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 3,
  },
  valueBig: {
    fontSize: 18,
    color: '#FFFFFF',
    fontWeight: '900',
    textShadowColor: 'rgba(0,0,0,0.7)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 3,
  },
  valueGood: {
    color: '#fff',
    textShadowColor: '#0f7',
  },
  divider: {
    width: 1,
    marginHorizontal: 1,
    backgroundColor: 'rgba(0,0,0,0.18)',
    borderRightWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
    shadowOpacity: 0.6,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 2,
  },
});

export default HUDBar;

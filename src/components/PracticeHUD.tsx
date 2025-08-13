// src/components/PracticeHUD.tsx
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

type Props = {
  totalPoints: number;
  style?: ViewStyle;
  primary?: string;
  secondary?: string;
  accent?: string;
};

const PracticeHUD: React.FC<Props> = ({
  totalPoints,
  style,
  primary = '#4DA8FF',    // Lighter sky blue
  secondary = '#0077CC',  // Rich ocean blue
  accent = '#A8D8FF',     // Soft blue highlight
}) => {
  return (
    <View style={[styles.wrap, style]}>
      <LinearGradient
        colors={[primary, secondary]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={styles.card}
      >
        {/* glossy top highlight */}
        <LinearGradient
          colors={[accent, 'transparent']}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={styles.gloss}
        />

        {/* CONTENT */}
        <View style={styles.content}>
          <Text style={styles.label}>TOTAL POINTS</Text>
          <Text style={styles.value}>{totalPoints}</Text>
        </View>

        {/* SLIME DRIP BOTTOM */}
        <View style={styles.dripRow} pointerEvents="none">
          <View style={[styles.drip, { backgroundColor: secondary, width: 24, height: 10 }]} />
          <View style={[styles.drip, { backgroundColor: primary, width: 36, height: 14 }]} />
          <View style={[styles.drip, { backgroundColor: secondary, width: 18, height: 8 }]} />
          <View style={[styles.drip, { backgroundColor: primary, width: 30, height: 12 }]} />
          <View style={[styles.drip, { backgroundColor: secondary, width: 22, height: 9 }]} />
          <View style={[styles.drip, { backgroundColor: primary, width: 28, height: 12 }]} />
          <View style={[styles.drip, { backgroundColor: secondary, width: 20, height: 8 }]} />
        </View>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: 8,
    paddingTop: -35,
    width: '60%',
    maxWidth: 200,
  },
  card: {
    borderRadius: 22,
    paddingVertical: 12,
    paddingHorizontal: 16,
    overflow: 'hidden',
    borderWidth: 3,
    borderColor: 'rgba(0,0,0,0.25)',
    shadowColor: '#000',
    shadowOpacity: 0.35,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 10,
    alignItems: 'center',
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
  content: {
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 8,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 14,
    minWidth: 120,
  },
  label: {
    fontSize: 11,
    letterSpacing: 0.5,
    color: '#FFFFFF',
    fontWeight: '800',
    marginBottom: 4,
    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 3,
  },
  value: {
    fontSize: 24,
    color: '#FFFFFF',
    fontWeight: '900',
    textShadowColor: 'rgba(0,0,0,0.7)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 3,
  },
  dripRow: {
    position: 'absolute',
    bottom: -2,
    left: 10,
    right: 10,
    height: 16,
    flexDirection: 'row',
    justifyContent: 'space-around',
    opacity: 0.9,
  },
  drip: {
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
});

export default PracticeHUD;

// src/components/PracticeHUD.tsx
// REDESIGNED: Minimal floating score pill

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ViewStyle,
} from 'react-native';

type Props = {
  totalPoints: number;
  style?: ViewStyle;
};

const PracticeHUD: React.FC<Props> = ({
  totalPoints,
  style,
}) => {
  return (
    <View style={[styles.container, style]}>
      <View style={styles.pill}>
        <Text style={styles.label}>SCORE</Text>
        <Text style={styles.value}>{totalPoints}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    gap: 10,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.7)',
    letterSpacing: 0.5,
  },
  value: {
    fontSize: 20,
    fontWeight: '900',
    color: '#FFD700',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
});

export default PracticeHUD;

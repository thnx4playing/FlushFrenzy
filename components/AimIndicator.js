import React from 'react';
import { View, StyleSheet } from 'react-native';

export default function AimIndicator({ origin, target, visible, maxLen = 160 }) {
  if (!visible || !origin || !target) return null;

  const dx = target.x - origin.x;
  const dy = target.y - origin.y;
  const dist = Math.hypot(dx, dy);
  const length = Math.min(dist, maxLen);
  const angle = Math.atan2(dy, dx);

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <View style={[
        styles.line,
        {
          width: length,
          left: origin.x,
          top: origin.y,
          transform: [{ translateY: -2 }, { rotateZ: `${angle}rad` }]
        }
      ]} />
      <View style={[
        styles.tip,
        {
          left: origin.x + Math.cos(angle) * length - 6,
          top: origin.y + Math.sin(angle) * length - 6,
          transform: [{ rotateZ: `${angle}rad` }]
        }
      ]} />
    </View>
  );
}

const styles = StyleSheet.create({
  line: {
    position: 'absolute',
    height: 4,
    backgroundColor: '#ffe680',
    borderRadius: 2,
  },
  tip: {
    position: 'absolute',
    width: 12,
    height: 12,
    borderLeftWidth: 2,
    borderTopWidth: 2,
    borderColor: '#ffe680',
    transform: [{ rotateZ: '45deg' }],
  },
});

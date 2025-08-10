import React from 'react';
import { View } from 'react-native';

export default function PowerBar({ value = 0 }) {
  const pct = Math.max(0, Math.min(1, value));
  return (
    <View
      pointerEvents="none"
      style={{
        position: 'absolute',
        right: 16,
        top: '50%',
        transform: [{ translateY: -90 }],
        width: 16,
        height: 180,
        borderRadius: 8,
        borderWidth: 2,
        borderColor: 'rgba(255,255,255,0.7)',
        backgroundColor: 'rgba(0,0,0,0.2)',
        overflow: 'hidden',
      }}
    >
      <View
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: `${pct * 100}%`,
          backgroundColor: '#ffffff',
        }}
      />
    </View>
  );
}



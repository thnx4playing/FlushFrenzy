import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function ChargeBar({ value = 0, visible }) {
  if (!visible) return null;
  const pct = Math.max(0, Math.min(100, value));

  return (
    <View style={styles.wrap} pointerEvents="none">
      <Text style={styles.label}>CHARGE</Text>
      <View style={styles.bar}>
        <View style={[styles.fill, { width: `${pct.toFixed(0)}%` }]} />
      </View>
      <Text style={styles.pct}>{pct.toFixed(0)}%</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', left: 16, right: 16, bottom: 28, alignItems: 'center' },
  label: { color: '#fff', fontSize: 12, marginBottom: 6 },
  bar: { width: '100%', height: 12, borderRadius: 6, backgroundColor: '#1f2430', overflow: 'hidden', borderWidth: 1, borderColor: '#333' },
  fill: { height: '100%', backgroundColor: '#5bff89' },
  pct: { color: '#cdd6f4', marginTop: 6, fontVariant: ['tabular-nums'] },
});

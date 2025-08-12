import React, { useEffect, useState } from 'react';
import { Text, StyleSheet } from 'react-native';
import { getHighScore } from '../utils/highScore';

export function HighScoreLabel({ mode = 'default', style }) {
  const [score, setScore] = useState(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const rec = await getHighScore(mode);
      if (mounted) setScore(rec?.score ?? 0);
    })();
    return () => { mounted = false; };
  }, [mode]);

  return (
    <Text style={[styles.highScoreText, style]}>
      {score ?? 0}
    </Text>
  );
}

const styles = StyleSheet.create({
  highScoreText: {
    fontWeight: '700',
    fontSize: 13,
    color: '#FFFFFF',
  },
});

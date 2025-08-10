import React, { useMemo } from 'react';
import { Svg, Circle } from 'react-native-svg';
import { StyleSheet } from 'react-native';

export default function TrajectoryOverlay({ origin, vel, gravityY = 1.4, steps = 24, dt = 1 / 30, visible = false }) {
  const points = useMemo(() => {
    if (!origin || !vel || !visible) return [];
    const pts = [];
    let x = origin.x, y = origin.y;
    let vx = vel.x, vy = vel.y;
    for (let i = 0; i < steps; i++) {
      x += vx * dt;
      y += vy * dt + 0.5 * gravityY * dt * dt;
      vy += gravityY * dt;
      pts.push({ x, y });
    }
    return pts;
  }, [origin, vel, gravityY, steps, dt, visible]);

  if (!visible || points.length === 0) return null;

  return (
    <Svg style={StyleSheet.absoluteFill} pointerEvents="none">
      {points.map((p, i) => (
        <Circle key={i} cx={p.x} cy={p.y} r={3} fill="#FFFFFF" opacity={0.9} />
      ))}
    </Svg>
  );
}



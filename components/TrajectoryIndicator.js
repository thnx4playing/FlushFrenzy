import React, { useMemo } from 'react';
import { StyleSheet } from 'react-native';
import { Svg, Path } from 'react-native-svg';

/**
 * TrajectoryIndicator
 * Renders a cartoony, dashed parabolic arc preview for a projectile.
 *
 * Props:
 * - origin: { x, y }  // current toilet paper position (pixels)
 * - aim: { dx, dy }   // slingshot vector = (dragStart - dragCurrent)
 * - chargePct: number // 0..100
 * - visible: boolean
 * - maxAimLen?: number  (default 160)
 * - gravityY?: number   (matches your Matter gravity, default 1.2)
 * - velScale?: number   (pixel velocity per unit power, default 50)
 * - steps?: number      (path samples, default 30)
 * - dt?: number         (time slice in frames, default 1)
 *
 * Notes:
 * We approximate initial velocity from your aim length, charge%, and a tunable velScale
 * so it *looks* like the flight you'll get once launched. Tweak velScale to taste.
 */
export default function TrajectoryIndicator({
  origin,
  aim,
  chargePct,
  visible,
  maxAimLen = 160,
  gravityY = 1.2,
  velScale = 50,
  steps = 30,
  dt = 1
}) {
  const pathD = useMemo(() => {
    if (!visible || !origin || !aim) return '';

    // Clamp aim length and compute normalized direction (slingshot: start - current)
    const len = Math.min(Math.hypot(aim.dx, aim.dy), maxAimLen);
    if (len < 2) return '';

    const nx = aim.dx / (len || 1);
    const ny = aim.dy / (len || 1);

    // Convert 0..100 charge to 0..1
    const c = Math.max(0, Math.min(100, chargePct || 0)) / 100;

    // Project an initial velocity in pixels/frame — tweak velScale if needed
    const vMag = (len / maxAimLen) * c * velScale;
    let vx = nx * vMag;
    let vy = ny * vMag;

    // Sample the path forward in "frames"
    let x = origin.x;
    let y = origin.y;
    const points = [`M ${x.toFixed(2)},${y.toFixed(2)}`];

    for (let i = 0; i < steps; i++) {
      x += vx * dt;
      y += vy * dt;
      vy += gravityY * dt; // gravity bends the arc down

      points.push(`L ${x.toFixed(2)},${y.toFixed(2)}`);
    }

    return points.join(' ');
  }, [origin, aim, chargePct, visible, maxAimLen, gravityY, velScale, steps, dt]);

  if (!pathD) return null;

  return (
    <Svg style={StyleSheet.absoluteFill} pointerEvents="none">
      {/* Cartoon style: thick, dashed, warm color */}
      <Path
        d={pathD}
        stroke="#FFC94A"
        strokeWidth={5}
        strokeLinecap="round"
        fill="none"
        strokeDasharray="12,8"
      />
    </Svg>
  );
}

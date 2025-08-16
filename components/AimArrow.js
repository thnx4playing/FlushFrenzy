import React from 'react';
import { View, StyleSheet, Text } from 'react-native';

function pickDirection(raw) {
  // Accept {dx,dy}, {x,y}, or {dir:{dx,dy}}; coerce to numbers
  const d = raw?.dir ?? raw ?? {};
  const vx = Number(d.dx ?? d.x);
  const vy = Number(d.dy ?? d.y);
  if (!Number.isFinite(vx) || !Number.isFinite(vy)) return null;
  return { vx, vy };
}

/**
 * Arrow starts at `origin` (aimpad center), points along `direction`,
 * grows with `power`, and has a triangular tip.
 */
export default function AimArrow({
  visible,
  direction,
  power = 0,
  origin,
  radius = 60,
}) {


  if (!visible || !origin) {
    return null;
  }

  const picked = pickDirection(direction);
  if (!picked) {
    return null;
  }

  // Normalize
  const { vx, vy } = picked;

  // Match doLaunch: launch goes along (-dx, -dy) in physics space.
  // Convert to screen (y-down): screen vector = (-dx, dy)
  const sx = -vx;
  const sy =  vy;

  const mag = Math.hypot(sx, sy);
  if (mag === 0) {
    return null;
  }
  const ux = sx / mag;
  const uy = sy / mag;

  // Power -> length
  const clamped = Math.max(0, Math.min(1, power));
  const shaftBase = radius * 0.7;
  const shaftExtra = radius * 1.4;
  const shaftLen = shaftBase + shaftExtra * clamped;

  const shaftThickness = Math.max(4, Math.round(radius * 0.18));
  const tipLen = Math.max(8, Math.round(shaftThickness * 1.2));  // triangle length
  const totalLen = shaftLen + tipLen;

  // Angle in degrees
  const angleDeg = (Math.atan2(uy, ux) * 180) / Math.PI;

  const { x: ox, y: oy } = origin;

  // Calculate the end point of the line based on direction and power
  const endX = ox + (ux * shaftLen);
  const endY = oy + (uy * shaftLen);



  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      

                                                                                                                                                                                     {/* Simple line from center to calculated end point */}
        <View
          style={{
            position: 'absolute',
            left: ox,
            top: oy - shaftThickness / 2,
            width: shaftLen,
            height: shaftThickness,
            backgroundColor: 'rgba(0,255,0,0.5)',
            borderRadius: shaftThickness / 2,
            transformOrigin: 'left center',
            transform: [{ rotate: `${-angleDeg + 180}deg` }],
            zIndex: 998,
          }}
        />
    </View>
  );
}

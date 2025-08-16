import React, { useCallback, useMemo, useRef, useState } from 'react';
import { LayoutChangeEvent, View, ViewStyle } from 'react-native';
import { AxisPad, AxisPadTouchEvent } from '@fustaro/react-native-axis-pad';

// Generate unique IDs for each AxisPad instance
let aimpadCounter = 0;
const generateAimpadId = () => `aimpad-${++aimpadCounter}`;

export interface AxisAimPadProps {
  size?: number;              // diameter in px
  deadZone?: number;          // 0..1
  powerCurve?: number;        // 0..N (1=linear)
  snapBackOnRelease?: boolean;
  showPowerBar?: boolean;
  disabled?: boolean;
  style?: ViewStyle;

  // Fires every frame while dragging (like the Snack's onChange)
  onVector?: (v: { dx: number; dy: number; power: number; angle: number; origin: { x: number; y: number } }) => void;

  // Fires once on release (like the Snack's "Launch" button)
  onLaunch?: (v: { dx: number; dy: number; power: number; angle: number; origin: { x: number; y: number } }) => void;
}

const AxisAimPadWrapper: React.FC<AxisAimPadProps> = ({
  size = 180,
  deadZone = 0.08,
  powerCurve = 1.0,
  snapBackOnRelease = true,
  showPowerBar = true,
  disabled = false,
  style,
  onVector,
  onLaunch,
}) => {
  // Generate unique ID for this instance
  const aimpadId = useMemo(() => generateAimpadId(), []);
  const [layout, setLayout] = useState<{ x: number; y: number; w: number; h: number } | null>(null);
  const latestVec = useRef<{ dx: number; dy: number; power: number; angle: number } | null>(null);

  const onLayout = useCallback((e: LayoutChangeEvent) => {
    const { x, y, width, height } = e.nativeEvent.layout;
    setLayout({ x, y, w: width, h: height });
  }, []);

  const origin = useMemo(() => {
    if (!layout) return { x: 0, y: 0 };
    return { x: layout.x + layout.w / 2, y: layout.y + layout.h / 2 };
  }, [layout]);

  const handleTouchEvent = useCallback(
    (e: AxisPadTouchEvent) => {
      // e.ratio is normalized: x right+, y down+
      const { x, y } = e.ratio;
      const mag = Math.min(1, Math.hypot(x, y));
      const currentPower = mag <= deadZone ? 0 : (mag - deadZone) / (1 - deadZone);

      // Convert to game coords (up positive)
      const dx = x;
      const dy = -y;
      const angle = Math.atan2(dy, dx); // 0 = right, +π/2 = up

      const payload = { dx, dy, power: currentPower, angle };

      if (e.eventType === 'pan') {
        latestVec.current = payload;
        if (onVector) onVector({ ...payload, origin });
      } else if (e.eventType === 'end') {
        if (onLaunch && latestVec.current) {
          onLaunch({ ...latestVec.current, origin });
        }
        if (snapBackOnRelease) {
          latestVec.current = null;
        }
      }
    },
    [onVector, onLaunch, origin, deadZone, snapBackOnRelease]
  );

  return (
    <View
      onLayout={onLayout}
      style={[
        {
          width: size,
          height: size,
          alignItems: 'center',
          justifyContent: 'center',
        },
        style,
      ]}
      pointerEvents={disabled ? 'none' : 'auto'}
    >
      <AxisPad
        id={aimpadId}
        size={size}
        onTouchEvent={handleTouchEvent}
        resetOnRelease={snapBackOnRelease}
        initialTouchType="visual-snap-to-center"
        ignoreTouchDownInPadArea={false}
        padBackgroundStyle={{
          backgroundColor: 'rgba(0, 140, 255, 0.25)',
          borderRadius: 9999,
          borderWidth: 3,
          borderColor: 'rgba(0,0,0,0.3)',
        }}
        controlStyle={{
          borderWidth: 4,
          borderColor: 'rgba(0,0,0,0.4)',
          backgroundColor: 'rgba(255,255,255,0.15)',
        }}
        stickStyle={{
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          borderColor: 'rgba(0,0,0,0.4)',
          borderWidth: 2,
          width: 60,
        }}
      />
    </View>
  );
};

export default AxisAimPadWrapper;

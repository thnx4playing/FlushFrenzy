// components/AimPad.js
import React, { useImperativeHandle, forwardRef, useRef, useState } from 'react';
import { View, PanResponder } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

const RADIUS = 90;

const clamp = (v, max) => Math.max(-max, Math.min(max, v));

const AimPad = forwardRef(function AimPad(
  { onAimingChanged, onRelease },
  ref
) {
  const wrapRef = useRef(null);
  const centerRef = useRef({ x: 0, y: 0 });
  const [isReady, setReady] = useState(false);



  // Always compute center from onLayout (no measureInWindow races)
  const onLayout = e => {
    const { x, y, width, height } = e.nativeEvent.layout;
    centerRef.current = { x: x + width / 2, y: y + height / 2 };
    setReady(true);

  };

  useImperativeHandle(ref, () => ({
    getCenter: () => {
      const center = centerRef.current;

      return center;
    },
  }));

  const responder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => {
        return true;
      },
      onMoveShouldSetPanResponder: () => {
        return true;
      },
      onPanResponderGrant: e => {
        if (!isReady) {
          return;
        }
        const { pageX, pageY } = e.nativeEvent;
        const dx = pageX - centerRef.current.x;
        const dy = pageY - centerRef.current.y;
        const mag = Math.hypot(dx, dy);
        const power = Math.min(mag / RADIUS, 1);
        const ndx = mag ? dx / mag : 0;
        const ndy = mag ? dy / mag : 0;
        

        
        onAimingChanged?.({ origin: centerRef.current, direction: { dx: ndx, dy: ndy }, power });
      },
      onPanResponderMove: (_, g) => {
        if (!isReady) {
          return;
        }
        const dx = clamp(g.moveX - centerRef.current.x, RADIUS);
        const dy = clamp(g.moveY - centerRef.current.y, RADIUS);
        const mag = Math.hypot(dx, dy);
        const power = Math.min(mag / RADIUS, 1);
        const ndx = mag ? dx / mag : 0;
        const ndy = mag ? dy / mag : 0;
        

        
        onAimingChanged?.({ origin: centerRef.current, direction: { dx: ndx, dy: ndy }, power });
      },
      onPanResponderRelease: (_, g) => {
        if (!isReady) {
          return;
        }
        const dx = clamp(g.moveX - centerRef.current.x, RADIUS);
        const dy = clamp(g.moveY - centerRef.current.y, RADIUS);
        const mag = Math.hypot(dx, dy);
        const power = Math.min(mag / RADIUS, 1);
        const ndx = mag ? dx / mag : 0;
        const ndy = mag ? dy / mag : 0;
        

        
        onRelease?.({ origin: centerRef.current, direction: { dx: ndx, dy: ndy }, power });
        // Don't push a "zero vector" back into the parent—just stop sending updates.
      },
    })
  ).current;

  

  return (
    <View
      ref={wrapRef}
      onLayout={onLayout}
      {...responder.panHandlers}
      style={{ position: 'absolute', bottom: 24, alignSelf: 'center', width: RADIUS * 2, height: RADIUS * 2 }}
      pointerEvents="box-only"
    >
      <Svg width={RADIUS * 2} height={RADIUS * 2}>
        <Circle cx={RADIUS} cy={RADIUS} r={RADIUS} fill="rgba(0,0,0,0.15)" />
        <Circle cx={RADIUS} cy={RADIUS} r={10} fill="#fff" />
      </Svg>
    </View>
  );
});

export default AimPad;



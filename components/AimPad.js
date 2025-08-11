import React, { useRef, useState, useEffect } from "react";
import { View, Dimensions, InteractionManager } from "react-native";

export default function AimPad({ radius = 90, onAim, onRelease }) {
  const ref = useRef(null);
  const [center, setCenter] = useState(null); // {x,y} in screen coords
  const [stick, setStick] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);

  const measureCenter = () => {
    if (!ref.current) return;
    ref.current.measureInWindow((x, y, w, h) => {
      const cx = x + w / 2;
      const cy = y + h / 2;
      if (cx && cy) setCenter({ x: cx, y: cy });
      else requestAnimationFrame(measureCenter); // retry next frame
    });
  };

  useEffect(() => {
    // let layout settle fully before measuring
    InteractionManager.runAfterInteractions(() => {
      requestAnimationFrame(measureCenter);
    });
  }, []);

  const clampCircle = (dx, dy) => {
    const len = Math.hypot(dx, dy);
    if (len <= radius) return { x: dx, y: dy, len };
    const s = radius / (len || 1);
    return { x: dx * s, y: dy * s, len: radius };
  };

  const updateFromPage = (pageX, pageY, active) => {
    if (!center) return; // ignore until measured
    const dx = pageX - center.x;
    const dy = pageY - center.y;
    const { x, y, len } = clampCircle(dx, dy);
    setStick({ x, y });

    const L = Math.hypot(x, y) || 1;
    const dir = { x: x / L, y: -(y / L) }; // portrait: up = -Y
    onAim?.({ dir, active, origin: center });
  };

  const grant = (e) => {
    if (!center) {
      // first touch too early — measure now and start next frame
      measureCenter();
      requestAnimationFrame(() => {
        const { pageX, pageY } = e.nativeEvent;
        setDragging(true);
        updateFromPage(pageX, pageY, true);
      });
      return;
    }
    setDragging(true);
    updateFromPage(e.nativeEvent.pageX, e.nativeEvent.pageY, true);
  };

  const move = (e) => dragging && updateFromPage(e.nativeEvent.pageX, e.nativeEvent.pageY, true);

  const release = () => {
    setDragging(false);
    setStick({ x: 0, y: 0 });
    if (center) onRelease?.({ dir: { x: 0, y: 0 }, origin: center });
  };

  const { width: W } = Dimensions.get("window");
  const padLeft = W / 2 - radius; // avoid left:"50%"

  return (
    <View
      ref={ref}
      onLayout={measureCenter}
      onStartShouldSetResponder={() => true}
      onMoveShouldSetResponder={() => true}
      onResponderGrant={grant}
      onResponderMove={move}
      onResponderRelease={release}
      style={{
        position: "absolute",
        left: padLeft,
        bottom: 24,
        width: radius * 2,
        height: radius * 2,
        borderRadius: radius,
        borderWidth: 3,
        borderColor: "rgba(255,255,255,0.7)",
        backgroundColor: "rgba(0,0,0,0.25)",
      }}
    >
      <View
        pointerEvents="none"
        style={{
          position: "absolute",
          left: radius - 14 + stick.x,
          top:  radius - 14 + stick.y,
          width: 28, height: 28, borderRadius: 14,
          backgroundColor: "rgba(255,255,255,0.95)",
        }}
      />
    </View>
  );
}



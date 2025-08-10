import React from "react";
import { View } from "react-native";

export default function DebugDot({ x, y }) {
  return (
    <View
      style={{
        position: 'absolute',
        left: x - 2,
        top: y - 2,
        width: 4,
        height: 4,
        borderRadius: 4,
        backgroundColor: 'lime',
        zIndex: 9999,
      }}
    />
  );
}

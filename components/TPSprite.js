import React, { useEffect, useState } from "react";
import { View, Image } from "react-native";

export default function TPSprite({ x, y, visible, src, r = 28, z = 50 }) {
  const [ok, setOk] = useState(true);

  if (!visible || !ok) return null;
  if (!(Number.isFinite(x) && Number.isFinite(y))) return null;
  if (x < -9000 || y < -9000) return null;

  return (
    <View
      style={{
        position: 'absolute',
        left: x - r,
        top: y - r,
        width: r * 2,
        height: r * 2,
        zIndex: z,
      }}
    >
      <Image
        source={src}
        style={{
          width: '100%',
          height: '100%',
          borderRadius: r,
        }}
        resizeMode="contain"
        onLoad={() => setOk(true)}
        onError={() => {
          setOk(false);
          console.warn("TP image failed to load:", src);
        }}
      />
    </View>
  );
}

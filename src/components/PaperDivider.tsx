// src/components/PaperDivider.tsx
import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Svg, { Rect, Line, G, Circle, Path, Defs, LinearGradient, Stop } from 'react-native-svg';

const { width: W } = Dimensions.get('window');

type Props = {
  width?: number;
  height?: number;
  /** Seam spacing (smaller = closer seams) */
  sheetWidth?: number;
  /** Perforation dash style */
  dash?: number;
  gap?: number;
  /** 'left' | 'right' | 'none' — where to hang the roll */
  rollSide?: 'left' | 'right' | 'none';
  /** Size of the roll (auto if not set) */
  rollRadius?: number;
  style?: any;
};

export default function PaperDivider({
  width = W * 0.86,
  height = 26,
  sheetWidth = 28, // tighter seams
  dash = 3,
  gap = 5,
  rollSide = 'right',
  rollRadius, // if omitted we compute below
  style,
}: Props) {
  const r = 12;
  const padX = 10;
  const padY = 6;

  // positions for vertical seams
  const seams: number[] = [];
  for (let x = padX + sheetWidth; x < width - padX; x += sheetWidth) seams.push(x);

  const rollR = rollRadius ?? Math.min(height * 0.9, 20);
  const rollCx = rollSide === 'left' ? -rollR * 0.35 : width + rollR * 0.35;
  const rollCy = height * 0.5;

  // small "torn" flap where the paper meets the roll
  const flapW = 10;
  const flapH = 7;
  const flapLeft = rollSide === 'left';
  const flapX0 = flapLeft ? padX : width - padX;
  const flapSign = flapLeft ? -1 : 1; // direction for the tooth

  const tornFlapPath = `
    M ${flapX0} ${height - padY}
    c ${flapSign * 2} ${-flapH * 0.2}, ${flapSign * 4} ${-flapH * 0.7}, ${flapSign * flapW} ${-flapH}
    c ${flapSign * -3} ${flapH * 0.3}, ${flapSign * -6} ${flapH * 0.7}, ${flapSign * -10} ${flapH}
    z
  `;

  return (
    <View style={[styles.wrap, { width }, style]}>
      <View style={[styles.shadow, { width, height }]} />
      <Svg width={width} height={height} pointerEvents="none">
        <Defs>
          {/* gentle top→bottom paper gradient */}
          <LinearGradient id="paperGrad" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor="#FFFFFF" />
            <Stop offset="100%" stopColor="#FAF7ED" />
          </LinearGradient>
          {/* subtle roll highlight */}
          <LinearGradient id="rollGrad" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0%" stopColor="#FFFFFF" />
            <Stop offset="100%" stopColor="#F3EFE6" />
          </LinearGradient>
        </Defs>

        {/* paper base */}
        <Rect
          x={0}
          y={0}
          width={width}
          height={height}
          rx={r}
          ry={r}
          fill="url(#paperGrad)"
          stroke="#E3DED1"
          strokeWidth={1.5}
        />

        {/* bottom shading for depth */}
        <Rect x={0} y={height - 8} width={width} height={8} rx={r} ry={r} fill="rgba(0,0,0,0.05)" />

        {/* vertical perforations */}
        <G>
          {seams.map((x) => (
            <Line
              key={`seam-${x}`}
              x1={x}
              y1={padY}
              x2={x}
              y2={height - padY}
              stroke="#CFC9BB"
              strokeWidth={2}
              strokeDasharray={`${dash},${gap}`}
              strokeLinecap="round"
              opacity={0.95}
            />
          ))}
        </G>

        {/* small torn flap so the bar looks like it's unrolling from the roll */}
        {rollSide !== 'none' && (
          <Path d={tornFlapPath} fill="#F2EEE4" stroke="#D8D1C3" strokeWidth={1} />
        )}
      </Svg>

      {/* TP roll hanging off the side (vector, no asset needed) */}
      {rollSide !== 'none' && (
        <Svg
          width={rollR * 2.6}
          height={rollR * 2.6}
          style={{
            position: 'absolute',
            left: rollSide === 'left' ? -rollR * 1.2 : undefined,
            right: rollSide === 'right' ? -rollR * 1.2 : undefined,
            top: rollCy - rollR * 1.3,
          }}
          pointerEvents="none"
        >
          {/* drop shadow */}
          <Circle cx={rollR * 1.3} cy={rollR * 1.35} r={rollR * 1.1} fill="rgba(0,0,0,0.22)" />
          {/* outer roll */}
          <Circle cx={rollR * 1.2} cy={rollR * 1.2} r={rollR} fill="url(#rollGrad)" stroke="#DCD6C8" strokeWidth={2} />
          {/* inner layers hint */}
          <Circle cx={rollR * 1.2} cy={rollR * 1.2} r={rollR * 0.77} fill="none" stroke="#EAE5DA" strokeWidth={2} />
          <Circle cx={rollR * 1.2} cy={rollR * 1.2} r={rollR * 0.54} fill="none" stroke="#EFEAE0" strokeWidth={2} />
          {/* cardboard core */}
          <Circle cx={rollR * 1.2} cy={rollR * 1.2} r={rollR * 0.22} fill="#C9AC7A" stroke="#B18F5E" strokeWidth={1.5} />
          {/* little curl to imply the sheet is pulling from the roll */}
          <Path
            d={(() => {
              const startX = rollSide === 'left' ? rollR * 2.1 : rollR * 0.3;
              const dir = rollSide === 'left' ? 1 : -1;
              const y = rollR * 1.2;
              return `M ${startX} ${y}
                      q ${dir * 10} -6, ${dir * 22} 0`;
            })()}
            stroke="#D8D2C5"
            strokeWidth={2}
            fill="none"
            strokeLinecap="round"
          />
        </Svg>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignSelf: 'center' },
  shadow: {
    position: 'absolute',
    left: 6,
    top: 8,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.15)',
    borderRadius: 14,
    transform: [{ scaleX: 0.96 }, { scaleY: 0.9 }],
    filter: 'blur(6px)' as any,
  },
});

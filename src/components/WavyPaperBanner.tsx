// src/components/WavyPaperBanner.tsx
import React, { memo, useMemo } from 'react';
import { View, StyleSheet, Dimensions, Platform } from 'react-native';
import Svg, {
  Defs,
  LinearGradient,
  Stop,
  Path,
  Rect,
  Line,
  G,
  Image as SvgImage,
} from 'react-native-svg';

const { width: W } = Dimensions.get('window');

type Props = {
  width?: number;
  height?: number;
  amplitude?: number;
  wavelength?: number;
  rollSide?: 'left' | 'right' | 'none';
  perforationSpacing?: number;
  rollSrc?: any;
  /** set to false to remove the wave rib entirely */
  showWave?: boolean;
};

const COLORS = {
  paperTop: '#FFFFFF',
  paperBottom: '#F7F3EA',
  outline: '#0B69B6',         // brandy-blue outline
  outlineSoft: '#8FB8E6',     // lighter accent for seams
  shadow: 'rgba(0,0,0,0.12)',
  capFill: '#FBF8F0',
};

export default memo(function WavyPaperBanner({
  width = Math.min(300, W * 0.7),
  height = 32,
  amplitude = 5,                     // much smaller wave
  wavelength = 180,
  rollSide = 'left',
  perforationSpacing = 22,           // closer perforations
  rollSrc = require('../../assets/tp.png'),
  showWave = true,
}: Props) {
  const pad = 8;
  const rRect = 12;

  const paperPath = useMemo(() => {
    const midY = height / 2;
    const top = (x: number) => midY - amplitude * Math.sin((2 * Math.PI * x) / wavelength);
    const bot = (x: number) => midY + amplitude * Math.sin((2 * Math.PI * x) / wavelength);
    const steps = 28, dx = width / steps;
    let d = `M 0 ${top(0).toFixed(2)}`;
    for (let i = 1; i <= steps; i++) {
      const x = i * dx; d += ` L ${x.toFixed(2)} ${top(x).toFixed(2)}`;
    }
    d += ` L ${width.toFixed(2)} ${bot(width).toFixed(2)}`;
    for (let i = steps - 1; i >= 0; i--) {
      const x = i * dx; d += ` L ${x.toFixed(2)} ${bot(x).toFixed(2)}`;
    }
    return (d += ' Z');
  }, [width, height, amplitude, wavelength]);

  const capPath = useMemo(() => {
    const capW = 12, rr = 7;
    const x0 = rollSide === 'left' ? width - capW : 0;
    const x1 = rollSide === 'left' ? width : capW;
    return `
      M ${x0} ${pad}
      L ${x1 - rr} ${pad}
      Q ${x1} ${pad} ${x1} ${pad + rr}
      L ${x1} ${height - pad - rr}
      Q ${x1} ${height - pad} ${x1 - rr} ${height - pad}
      L ${x0} ${height - pad}
      Z
    `;
  }, [width, height, rollSide]);

  const seams = useMemo(() => {
    const xs: number[] = [];
    for (let x = perforationSpacing; x < width; x += perforationSpacing) xs.push(x);
    return xs;
  }, [width, perforationSpacing]);

  const rollW = height * 1.25;
  const rollH = height * 1.25;

  return (
    <View style={[styles.wrap, styles.shadow, { width, height }]}>
      <Svg width={width} height={height}>
        <Defs>
          <LinearGradient id="paperGrad" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor={COLORS.paperTop} />
            <Stop offset="100%" stopColor={COLORS.paperBottom} />
          </LinearGradient>
        </Defs>

        {/* base rounded rect to soften the look */}
        <Rect
          x={0} y={0}
          width={width} height={height}
          rx={rRect} ry={rRect}
          fill="url(#paperGrad)"
          stroke={COLORS.outline}
          strokeWidth={2}
        />

        {/* wavy silhouette (very light stroke) */}
        <Path d={paperPath} fill="url(#paperGrad)" stroke={COLORS.outline} strokeWidth={1.25} />

        {/* rounded end cap */}
        <Path d={capPath} fill={COLORS.capFill} stroke={COLORS.outline} strokeWidth={1.25} />

        {/* optional subtle inner wave rib (thin + translucent) */}
        {showWave && (
          <Path
            d={paperPath}
            fill="none"
            stroke={COLORS.outlineSoft}
            strokeWidth={2}
            opacity={0.25}
          />
        )}

        {/* perforations — lighter & shorter */}
        <G opacity={0.7}>
          {seams.map((x) => (
            <Line
              key={`seam-${x}`}
              x1={x}
              y1={pad + 3}
              x2={x}
              y2={height - pad - 3}
              stroke={COLORS.outlineSoft}
              strokeWidth={1.6}
              strokeDasharray="2,6"
              strokeLinecap="round"
            />
          ))}
        </G>

        {/* TP roll (small, tucked in) */}
        {rollSide !== 'none' && (
          <SvgImage
            href={rollSrc}
            width={rollW}
            height={rollH}
            x={rollSide === 'left' ? -rollW * 0.38 : width - rollW * 0.62}
            y={(height - rollH) / 2}
            preserveAspectRatio="xMidYMid slice"
            opacity={0.98}
          />
        )}
      </Svg>
    </View>
  );
});

const styles = StyleSheet.create({
  wrap: { alignSelf: 'center' },
  shadow: Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOpacity: 0.16,
      shadowRadius: 8,
      shadowOffset: { width: 0, height: 4 },
    },
    android: { elevation: 4 },
    default: {},
  }),
});

import React, { forwardRef, useImperativeHandle, useRef, useEffect } from 'react';
import { View, StyleSheet, Animated, Easing } from 'react-native';
import { TRAIL_PRESETS } from './trails';
import type { TPTrail } from '../types/practice';

type Particle = {
  id: number;
  x: number;
  y: number;
  color: string;
  size: number;
  lifeMs: number;
  fade: Animated.Value;
  scale: Animated.Value;
};

export type TrailRendererRef = {
  configure: (type: TPTrail) => void;
  emit: (x: number, y: number) => void; // call from your game loop
  clear: () => void;
};

let NEXT_ID = 1;

const TrailRenderer = forwardRef<TrailRendererRef, { initialType?: TPTrail }>(
  ({ initialType = 'none' }, ref) => {
    const trailRef = useRef<TPTrail>(initialType);
    const cfgRef = useRef(TRAIL_PRESETS[initialType]);
    const lastSpawnRef = useRef(0);
    const particlesRef = useRef<Particle[]>([]);
    const mountedRef = useRef(true);

    // Cleanup on unmount
    useEffect(() => {
      return () => {
        mountedRef.current = false;
        // Clear all particles and stop animations
        particlesRef.current.forEach(p => {
          p.fade.stopAnimation();
          p.scale.stopAnimation();
        });
        particlesRef.current = [];
      };
    }, []);

    useImperativeHandle(ref, () => ({
      configure: (type) => {
        trailRef.current = type;
        cfgRef.current = TRAIL_PRESETS[type];
      },
      emit: (x, y) => {
        if (!mountedRef.current) return;
        
        const cfg = cfgRef.current;
        if (trailRef.current === 'none') return;
        const now = Date.now();
        if (now - lastSpawnRef.current < cfg.spawnMs) return;

        lastSpawnRef.current = now;
        // cap particles
        if (particlesRef.current.length >= cfg.maxParticles) {
          const removed = particlesRef.current.splice(0, particlesRef.current.length - cfg.maxParticles + 1);
          removed.forEach(p => {
            p.fade.stopAnimation();
            p.scale.stopAnimation();
          });
        }

        const jitter = (v: number) => (Math.random() * 2 - 1) * v;
        const color = cfg.colors[Math.floor(Math.random() * cfg.colors.length)];
        const fade = new Animated.Value(1);
        const scale = new Animated.Value(1);

        const p: Particle = {
          id: NEXT_ID++,
          x: x + jitter(cfg.jitter),
          y: y + jitter(cfg.jitter),
          color,
          size: cfg.size + Math.random() * 3,
          lifeMs: cfg.lifeMs,
          fade,
          scale,
        };
        particlesRef.current.push(p);

        // animate out
        const anims: Animated.CompositeAnimation[] = [];
        if (cfg.fadeOut) {
          anims.push(Animated.timing(fade, { toValue: 0, duration: cfg.lifeMs, easing: Easing.out(Easing.quad), useNativeDriver: true }));
        }
        if (cfg.scaleOut) {
          anims.push(Animated.timing(scale, { toValue: 1.6, duration: cfg.lifeMs, easing: Easing.out(Easing.quad), useNativeDriver: true }));
        }
        Animated.parallel(anims).start(() => {
          if (!mountedRef.current) return;
          const idx = particlesRef.current.findIndex(q => q.id === p.id);
          if (idx !== -1) {
            particlesRef.current.splice(idx, 1);
          }
        });
      },
      clear: () => {
        if (!mountedRef.current) return;
        particlesRef.current.forEach(p => {
          p.fade.stopAnimation();
          p.scale.stopAnimation();
        });
        particlesRef.current = [];
      },
    }));

    return (
      <View pointerEvents="none" style={styles.container}>
        {particlesRef.current.map(p => (
          <Animated.View
            key={p.id}
            style={[
              styles.dot,
              {
                left: p.x - p.size / 2,
                top: p.y - p.size / 2,
                width: p.size,
                height: p.size,
                backgroundColor: p.color,
                opacity: p.fade,
                transform: [{ scale: p.scale }],
              },
            ]}
          />
        ))}
      </View>
    );
  }
);

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    pointerEvents: 'none',
    zIndex: 15, // Make sure it's above the background but below UI elements
  },
  dot: {
    position: 'absolute',
    borderRadius: 999,
  },
});

export default TrailRenderer;


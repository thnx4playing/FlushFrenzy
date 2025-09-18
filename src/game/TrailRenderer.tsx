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

// Object pooling for better performance
const particlePool: Particle[] = [];

const getParticle = (): Particle => {
  const pooled = particlePool.pop();
  if (pooled) {
    // Reset pooled particle values
    pooled.id = NEXT_ID++;
    pooled.x = 0;
    pooled.y = 0;
    pooled.color = '';
    pooled.size = 0;
    pooled.lifeMs = 0;
    // Ensure animated values exist and are reset
    if (!pooled.fade) pooled.fade = new Animated.Value(1);
    if (!pooled.scale) pooled.scale = new Animated.Value(1);
    pooled.fade.setValue(1);
    pooled.scale.setValue(1);
    return pooled;
  }
  
  // Create new particle if pool is empty
  return {
    id: NEXT_ID++,
    x: 0, y: 0, color: '', size: 0, lifeMs: 0,
    fade: new Animated.Value(1),
    scale: new Animated.Value(1)
  };
};

const releaseParticle = (particle: Particle) => {
  if (!particle) return;
  
  // Stop any running animations before releasing
  if (particle.fade) {
    particle.fade.stopAnimation();
    particle.fade.setValue(1);
  }
  if (particle.scale) {
    particle.scale.stopAnimation();
    particle.scale.setValue(1);
  }
  
  // Only add to pool if we have room (prevent memory leaks)
  if (particlePool.length < 50) {
    particlePool.push(particle);
  }
};

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
        // cap particles - more efficient cleanup
        if (particlesRef.current.length >= cfg.maxParticles) {
          const toRemove = particlesRef.current.length - cfg.maxParticles + 1;
          const removed = particlesRef.current.splice(0, toRemove);
          removed.forEach(p => {
            p.fade.stopAnimation();
            p.scale.stopAnimation();
          });
        }

        const jitter = (v: number) => (Math.random() * 2 - 1) * v;
        const color = cfg.colors[Math.floor(Math.random() * cfg.colors.length)];
        
        // Use object pooling instead of creating new particles
        const p = getParticle();
        p.x = x + jitter(cfg.jitter);
        p.y = y + jitter(cfg.jitter);
        p.color = color;
        p.size = cfg.size + Math.random() * 3;
        p.lifeMs = cfg.lifeMs;
        particlesRef.current.push(p);

        // animate out
        const anims: Animated.CompositeAnimation[] = [];
        if (cfg.fadeOut && p.fade) {
          anims.push(Animated.timing(p.fade, { toValue: 0, duration: cfg.lifeMs, easing: Easing.out(Easing.quad), useNativeDriver: true }));
        }
        if (cfg.scaleOut && p.scale) {
          anims.push(Animated.timing(p.scale, { toValue: 1.6, duration: cfg.lifeMs, easing: Easing.out(Easing.quad), useNativeDriver: true }));
        }
        Animated.parallel(anims).start(() => {
          if (!mountedRef.current) return;
          const idx = particlesRef.current.findIndex(q => q.id === p.id);
          if (idx !== -1) {
            const particle = particlesRef.current.splice(idx, 1)[0];
            releaseParticle(particle); // Return to pool
          }
        });
        
        // Force cleanup after animation duration to prevent memory leaks
        setTimeout(() => {
          if (!mountedRef.current) return;
          const idx = particlesRef.current.findIndex(q => q.id === p.id);
          if (idx !== -1) {
            const particle = particlesRef.current.splice(idx, 1)[0];
            releaseParticle(particle); // Return to pool
          }
        }, cfg.lifeMs + 100);
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
        {particlesRef.current.slice(-50).map(p => ( // Only render last 50 particles for performance
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


import type { TPTrail } from '../types/practice';

export type TrailConfig = {
  spawnMs: number;      // throttle between spawns
  lifeMs: number;       // particle lifetime
  size: number;         // base size
  jitter: number;       // random position jitter
  colors: string[];     // cycle or pick randomly
  fadeOut: boolean;
  scaleOut: boolean;
  maxParticles: number; // safety cap
};

export const TRAIL_PRESETS: Record<TPTrail, TrailConfig> = {
  none: {
    spawnMs: 999999, lifeMs: 0, size: 0, jitter: 0,
    colors: [], fadeOut: true, scaleOut: true, maxParticles: 1,
  },
  sparkles: {
    spawnMs: 15, lifeMs: 400, size: 4, jitter: 2,
    colors: ['#ffffff','#ffff00','#ffd700'], fadeOut: true, scaleOut: true, maxParticles: 80,
  },
  rainbow: {
    spawnMs: 20, lifeMs: 600, size: 6, jitter: 3,
    colors: ['#ff3b30','#ff9500','#ffcc00','#34c759','#007aff','#af52de'],
    fadeOut: true, scaleOut: true, maxParticles: 100,
  },
  bubbles: {
    spawnMs: 35, lifeMs: 650, size: 10, jitter: 6,
    colors: ['rgba(255,255,255,0.85)'], fadeOut: true, scaleOut: false, maxParticles: 90,
  },
  confetti: {
    spawnMs: 40, lifeMs: 800, size: 12, jitter: 8,
    colors: ['#ff3b30','#ff9500','#ffcc00','#34c759','#007aff','#af52de','#ff69b4','#00ced1'],
    fadeOut: true, scaleOut: false, maxParticles: 60,
  },
  glow: {
    spawnMs: 28, lifeMs: 500, size: 9, jitter: 2,
    colors: ['#b3e5fc','#e3f2fd','#90caf9'], fadeOut: true, scaleOut: true, maxParticles: 100,
  },
};


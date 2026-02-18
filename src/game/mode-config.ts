// src/game/mode-config.ts
export type GameMode = 'endless-plunge' | 'quick-flush' | 'touchless-toss';

export type ModeConfig = {
  // physics
  gravityY: number;            // e.g. 1.0 is RN/Matter default-ish
  airFriction: number;         // TP body air friction
  restitution: number;         // bounciness
  haveWalls: boolean;          // practice can toggle this

  // gameplay
  roundTimeSec?: number;       // endless uses timer, practice may ignore
  pointsToAdvance?: number;    // endless requirement
  movingToiletSpeed: number;   // base horizontal movement
  aimPadRadius: number;        // for UI/arrow scaling
  arrowMaxLength: number;      // visual power indicator length

  // visuals / assets
  tpAsset: string;             // 'tp.png' etc
};

const BASE: ModeConfig = {
      gravityY: 0.3, // Light gravity for nice arc
  airFriction: 0.012, // Match TP body frictionAir
  restitution: 0.45, // Match TP body restitution
  haveWalls: true,
  roundTimeSec: undefined,
  pointsToAdvance: undefined,
  movingToiletSpeed: 1.0,
  aimPadRadius: 90,
  arrowMaxLength: 120,
  tpAsset: 'tp.png',
};

export const PRESETS: Record<GameMode, ModeConfig> = {
  'endless-plunge': {
    ...BASE,
    roundTimeSec: 30,
    pointsToAdvance: 10,
    movingToiletSpeed: 1.0,
  },
  'quick-flush': {
    ...BASE,
    // quick-flush ignores round timer by default and allows UI sliders to mutate these:
    roundTimeSec: undefined,
    pointsToAdvance: undefined,
    movingToiletSpeed: 1.0,
  },
  'touchless-toss': {
    ...BASE,
    // Touchless mode: no timer, moderate toilet speed, accessibility-focused
    roundTimeSec: undefined,
    pointsToAdvance: undefined,
    movingToiletSpeed: 0.6, // Slower toilet for accessibility
  },
};

// Deep merge helper (so practice sliders can override safely)
export function makeModeConfig(
  mode: GameMode,
  overrides?: Partial<ModeConfig>
): ModeConfig {
  return { ...PRESETS[mode], ...(overrides ?? {}) };
}

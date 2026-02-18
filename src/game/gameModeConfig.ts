// Make config per mode immutable and never mutate these at runtime.
export type GameMode = 'endless-plunge' | 'quick-flush' | 'touchless-toss';

export type ModeConfig = {
  gravityY: number;
  walls: boolean;
  movingToilet: boolean;
  timerSecs: number;
  aimPad: { radius: number; bottomInset: number };
  // add anything else you tweak per mode…
};

export const CONFIG: Readonly<Record<GameMode, Readonly<ModeConfig>>> = {
  'endless-plunge': Object.freeze({
    gravityY: 0.3, // Light gravity for nice arc
    walls: true,
    movingToilet: true,
    timerSecs: 5, // Temporarily reduced for testing
    aimPad: { radius: 90, bottomInset: 24 },
  }),
  'quick-flush': Object.freeze({
    gravityY: 0.3, // Light gravity for nice arc
    walls: true,
    movingToilet: true,
    timerSecs: 60, // 60 second challenge
    aimPad: { radius: 90, bottomInset: 24 },
  }),
  'touchless-toss': Object.freeze({
    gravityY: 0.3,
    walls: true,
    movingToilet: true,
    timerSecs: 0, // No timer — practice/accessibility mode
    aimPad: { radius: 90, bottomInset: 24 },
  }),
};

function deepClone<T>(obj: T): T {
  // Prefer structuredClone when available (RN Hermes supports it)
  // otherwise fall back to JSON clone.
  try {
    // @ts-ignore
    if (typeof structuredClone === 'function') return structuredClone(obj);
  } catch {}
  return JSON.parse(JSON.stringify(obj));
}

export function freshConfig(
  mode?: GameMode,
  overrides: Partial<ModeConfig> = {}
): ModeConfig {
  const fallback: GameMode = 'quick-flush';
  const chosen: GameMode = (mode && (CONFIG as any)[mode]) ? mode : fallback;

  if (!mode || !(CONFIG as any)[mode]) {
    console.warn(
      `[gameModeConfig] freshConfig: unknown/empty mode "${mode}", defaulting to "${fallback}"`
    );
  }

  const base = deepClone(CONFIG[chosen]);
  // shallow merge is OK for our shape; add a deep merge later if you add nested objects
  return { ...base, ...overrides };
}

// src/utils/safeJSON.ts
export const safeParse = <T = any>(raw: unknown, fallback: T): T => {
  if (typeof raw !== 'string') return fallback;
  try { return JSON.parse(raw) as T; } catch { return fallback; }
};




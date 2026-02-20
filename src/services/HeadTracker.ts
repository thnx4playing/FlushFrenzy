// Path: src/services/HeadTracker.ts

export interface HeadTrackerCallbacks {
  onYawUpdate: (yaw: number) => void;
}

// ±15° maps to full ±1 range (was 30°) — doubles sensitivity.
// User now only needs to turn their head 15° for full slider travel.
const MAX_YAW_DEGREES = 10;  // ±10° = full slider range (was 15°); lower = less head turn needed

// Smoothing: 0.72 = smooth EMA. Increase toward 0.85 for more glide,
// decrease toward 0.55 for snappier response.
const SMOOTHING = 0.82;  // higher = smoother (was 0.72); range 0.7–0.92

let smoothedYaw = 0;

let _frameCount      = 0;
let _fpsWindowStart  = 0;
let _lastCallTime    = 0;
let _stallWarnedAt   = 0;

const STALL_THRESHOLD_MS = 500;
const FPS_WINDOW_MS      = 1000;

export const headTrackerStats = {
  fps:         0,
  lastCallMs:  0,
  totalFrames: 0,
  rawYawDeg:   0,
  smoothedYaw: 0,
  isStale:     false,
};

export function tickHeadTrackerStats(): void {
  const now = Date.now();
  const msSinceUpdate = _lastCallTime > 0 ? now - _lastCallTime : 0;
  headTrackerStats.lastCallMs = msSinceUpdate;
  headTrackerStats.isStale    = _lastCallTime > 0 && msSinceUpdate > STALL_THRESHOLD_MS;

  if (headTrackerStats.isStale && now - _stallWarnedAt > 2000) {
    _stallWarnedAt = now;
    smoothedYaw = 0;
    console.warn(`[HeadTracker] STALE — no yaw update for ${Math.round(msSinceUpdate)}ms`);
  }
}

export function processYaw(
  rawYawDegrees: number,
  callbacks: HeadTrackerCallbacks
): void {
  const now = Date.now();
  _lastCallTime = now;

  _frameCount++;
  headTrackerStats.totalFrames++;
  if (_fpsWindowStart === 0) _fpsWindowStart = now;
  const elapsed = now - _fpsWindowStart;
  if (elapsed >= FPS_WINDOW_MS) {
    headTrackerStats.fps = Math.round((_frameCount / elapsed) * 1000);
    _frameCount     = 0;
    _fpsWindowStart = now;
  }

  const clamped    = Math.max(-MAX_YAW_DEGREES, Math.min(MAX_YAW_DEGREES, rawYawDegrees));
  const normalized = clamped / MAX_YAW_DEGREES;
  smoothedYaw      = smoothedYaw * SMOOTHING + normalized * (1 - SMOOTHING);

  headTrackerStats.rawYawDeg   = rawYawDegrees;
  headTrackerStats.smoothedYaw = smoothedYaw;
  headTrackerStats.isStale     = false;
  headTrackerStats.lastCallMs  = 0;

  callbacks.onYawUpdate(smoothedYaw);
}

export function resetYaw(): void {
  smoothedYaw = 0;
  _frameCount = 0; _fpsWindowStart = 0; _lastCallTime = 0; _stallWarnedAt = 0;
  headTrackerStats.fps = 0; headTrackerStats.lastCallMs = 0;
  headTrackerStats.totalFrames = 0; headTrackerStats.rawYawDeg = 0;
  headTrackerStats.smoothedYaw = 0; headTrackerStats.isStale = false;
}

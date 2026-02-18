// src/services/HeadTracker.ts
// Processes face yaw angle from react-native-vision-camera-face-detector (MLKit)
// into a normalized [-1, +1] range for controlling the aim direction.
//
// Returns yaw in range [-1, +1]:
//   -1 = head turned fully left
//    0 = looking straight ahead
//   +1 = head turned fully right

export interface HeadTrackerCallbacks {
  /** Called every frame with the normalized yaw value [-1, +1]. */
  onYawUpdate: (yaw: number) => void;
}

// Maximum yaw angle (degrees) that maps to full aim deflection.
// ~30° head turn = full aim. MLKit yaw range is typically -45 to +45.
// Tune this for comfort — lower = more sensitive.
const MAX_YAW_DEGREES = 30;

// Exponential moving average smoothing factor.
// 0 = no smoothing (raw/jittery), 1 = maximum smoothing (very laggy).
// 0.3 is responsive enough for a game while filtering out noise.
const SMOOTHING = 0.15;

let smoothedYaw = 0;

/**
 * Process a raw yaw angle from MLKit face detection into a smoothed,
 * clamped [-1, +1] value. Call this from the frame processor callback.
 *
 * @param rawYawDegrees - The yawAngle from the detected face (degrees)
 * @param callbacks - Object with onYawUpdate callback
 */
export function processYaw(
  rawYawDegrees: number,
  callbacks: HeadTrackerCallbacks
): void {
  // Clamp raw yaw to our max range
  const clamped = Math.max(-MAX_YAW_DEGREES, Math.min(MAX_YAW_DEGREES, rawYawDegrees));

  // Normalize to [-1, +1]
  const normalized = clamped / MAX_YAW_DEGREES;

  // Apply exponential moving average smoothing
  smoothedYaw = smoothedYaw * SMOOTHING + normalized * (1 - SMOOTHING);

  callbacks.onYawUpdate(smoothedYaw);
}

/**
 * Reset the smoothing state (call when entering/leaving touchless mode
 * or when resetting after a launch).
 */
export function resetYaw(): void {
  smoothedYaw = 0;
}

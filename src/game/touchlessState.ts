// Path: src/game/touchlessState.ts
//
// Module-level singleton — the ONLY correct bridge between VisionCamera's
// worklet runtime and the JS thread.
//
// WHY THIS EXISTS:
//   VisionCamera frame processors run in react-native-worklets-core's worklet
//   runtime. Reanimated useSharedValue lives in Reanimated's OWN separate
//   worklet runtime. They do NOT share memory. Writing sharedValue.value from
//   inside a frame processor writes to worklets-core memory; reading .value
//   from JS reads Reanimated memory — always returns 0. This is why the last
//   approach (SharedValue) broke head tracking.
//
//   createRunOnJS IS the only correct bridge. But the callback must be
//   near-free: write two numbers to this plain object (~500ns). Done.
//   All actual work (processYaw, cursor update, face indicator) happens in
//   a requestAnimationFrame loop inside TouchlessControls.

export const touchlessState = {
  yawDeg:   0,       // raw yaw degrees from camera (sign-flipped for direction)
  detected: false,   // whether a face is currently visible
  smoothedYaw: 0,    // post-EMA smoothed yaw (-1..1), read at launch time
};

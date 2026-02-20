// Path: src/components/input/TouchlessControls.tsx
//
// ARCHITECTURE (final, correct):
//
//   Camera frame (worklet thread)
//     → detectFaces()
//     → handleFaceJS(yawDeg, detected)   ← createRunOnJS, ONLY writes touchlessState
//
//   requestAnimationFrame loop (JS thread, inside TouchlessControls)
//     → reads touchlessState.yawDeg / touchlessState.detected
//     → calls processYaw() → EMA smoothing
//     → cursorXAnim.setValue()           ← native layer, no re-render
//     → throttled setFaceDetected / setDebugInfo (low frequency state)
//
//   Game engine RAF (JS thread, react-native-game-engine)
//     → runs MovingToiletSystem (but skipped for touchless-toss — static toilet)
//     → no competition from camera pipeline
//
// WHY createRunOnJS AND NOT SharedValue:
//   VisionCamera worklet runtime ≠ Reanimated worklet runtime.
//   SharedValue.value written from frame processor is NOT readable from JS.
//   createRunOnJS is the only correct cross-runtime bridge.
//   It is fast ONLY when the callback does ~nothing. Writing two fields to a
//   plain object is ~500ns. All actual work happens in our own RAF loop.
//
// WHY requestAnimationFrame OVER setInterval:
//   RAF is cooperative with the game engine's RAF — both get scheduled in the
//   same 16ms frame budget and take turns. setInterval fires independently and
//   can land mid-frame, interrupting the game engine's tick.
//   Our RAF callback costs ~0.5ms (processYaw + setValue). Negligible.

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Animated,
  Easing,
} from 'react-native';
import {
  Camera,
  useCameraDevice,
  useCameraPermission,
  useFrameProcessor,
} from 'react-native-vision-camera';
import { useFaceDetector } from 'react-native-vision-camera-face-detector';
import { Worklets } from 'react-native-worklets-core';
import { Audio } from 'expo-av';
import { BlowDetector } from '../../services/BlowDetector';
import { processYaw, resetYaw } from '../../services/HeadTracker';
import { touchlessState } from '../../game/touchlessState';

const { width: WIDTH, height: HEIGHT } = Dimensions.get('window');

const LAUNCH_X = WIDTH / 2;
const LAUNCH_Y = HEIGHT - 24 - 56;

const MIN_ANGLE = Math.PI * 0.15;
const MAX_ANGLE = Math.PI * 0.85;

const TRACK_PADDING  = 130;  // increase to narrow bar; e.g. 100=wider, 150=narrower
const TRACK_WIDTH    = WIDTH - TRACK_PADDING * 2;
const TRACK_Y        = HEIGHT - 24 - 56 - 20;
const CURSOR_SIZE    = 20;

const POWER_BAR_HEIGHT = 180;
const POWER_BAR_WIDTH  = 24;
const POWER_CYCLE_MS   = 2200;

// Face indicator / debug text update rate — only setState at this frequency
const UI_UPDATE_MS = 150;

const yawToCursorX = (yaw: number) =>
  TRACK_PADDING + ((yaw + 1) / 2) * TRACK_WIDTH;

interface TouchlessControlsProps {
  onLaunch: (v: {
    dx: number; dy: number; power: number; angle: number;
    origin: { x: number; y: number };
  }) => void;
  onVector?: (v: {
    dx: number; dy: number; power: number; angle: number;
    origin: { x: number; y: number };
  }) => void;
  disabled?: boolean;
}

type Phase = 'aiming' | 'launching';

// ─── HORIZONTAL AIM CURSOR ───────────────────────────────────────────────────
const HorizontalAimCursor: React.FC<{
  cursorXAnim: Animated.Value;
  phase: Phase;
}> = React.memo(({ cursorXAnim, phase }) => {
  const color   = phase === 'aiming' ? '#4ECDC4' : '#FFD700';
  const trackBg = phase === 'aiming'
    ? 'rgba(78,205,196,0.2)'
    : 'rgba(255,215,0,0.2)';

  const triangleLeft = Animated.subtract(cursorXAnim, CURSOR_SIZE / 2);
  const stemLeft     = Animated.subtract(cursorXAnim, 1);

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {/* Track bar */}
      <View style={{
        position: 'absolute', left: TRACK_PADDING, top: TRACK_Y - 3,
        width: TRACK_WIDTH, height: 6, borderRadius: 3,
        backgroundColor: trackBg, borderWidth: 1, borderColor: color, zIndex: 51,
      }} />
      {/* Edge arrows */}
      <Text style={{ position: 'absolute', left: TRACK_PADDING - 18, top: TRACK_Y - 10, fontSize: 14, color, opacity: 0.6, zIndex: 51 }}>◀</Text>
      <Text style={{ position: 'absolute', left: TRACK_PADDING + TRACK_WIDTH + 4, top: TRACK_Y - 10, fontSize: 14, color, opacity: 0.6, zIndex: 51 }}>▶</Text>
      {/* Center tick */}
      <View style={{
        position: 'absolute',
        left: TRACK_PADDING + TRACK_WIDTH / 2 - 1,
        top: TRACK_Y - 8, width: 2, height: 16,
        backgroundColor: 'rgba(255,255,255,0.3)', zIndex: 51,
      }} />
      {/* Cursor triangle (pointing down onto the track) */}
      <Animated.View style={{
        position: 'absolute', left: triangleLeft, top: TRACK_Y - CURSOR_SIZE - 2,
        width: 0, height: 0,
        borderLeftWidth:  CURSOR_SIZE / 2,
        borderRightWidth: CURSOR_SIZE / 2,
        borderTopWidth:   CURSOR_SIZE,
        borderLeftColor:  'transparent',
        borderRightColor: 'transparent',
        borderTopColor:   color,
        zIndex: 52,
      }} />
      {/* Cursor stem */}
      <Animated.View style={{
        position: 'absolute', left: stemLeft, top: TRACK_Y - 2,
        width: 2, height: 8, backgroundColor: color, zIndex: 52,
      }} />
    </View>
  );
});

// ─────────────────────────────────────────────────────────────────────────────

const TouchlessControls: React.FC<TouchlessControlsProps> = ({
  onLaunch,
  onVector,
  disabled = false,
}) => {
  const {
    hasPermission: hasCamPermission,
    requestPermission: requestCamPermission,
  } = useCameraPermission();
  const device = useCameraDevice('front');

  const { detectFaces } = useFaceDetector({
    performanceMode: 'fast',
    landmarkMode:     'none',
    classificationMode: 'none',
  });

  const [micReady,          setMicReady]          = useState(false);
  const [permissionsReady,  setPermissionsReady]  = useState(false);
  const [phase,             setPhase]             = useState<Phase>('aiming');
  const [faceDetected,      setFaceDetected]      = useState(false);
  const [debugInfo,         setDebugInfo]         = useState('Initializing...');
  const [displayYaw,        setDisplayYaw]        = useState(0); // trajectory arc only

  // Animated.Value driven directly by our RAF loop — no re-render on move
  const cursorXAnim = useRef(new Animated.Value(yawToCursorX(0))).current;

  const powerAnim    = useRef(new Animated.Value(0)).current;
  const powerRef     = useRef(0);
  const powerAnimRef = useRef<Animated.CompositeAnimation | null>(null);

  const blowDetectorRef  = useRef<BlowDetector | null>(null);
  const phaseRef         = useRef<Phase>('aiming');
  const currentYawRef    = useRef(0);   // smoothed target yaw from processYaw
  const displayYawRef    = useRef(0);   // interpolated display yaw, updated every RAF tick
  const onLaunchRef      = useRef(onLaunch);
  const faceEverDetected = useRef(false);
  const rafRef           = useRef<number>(0);

  // How fast the cursor chases the target yaw each frame (0-1).
  // 0.18 = smooth 60fps glide even with 12fps face updates.
  // Raise toward 0.35 for snappier response, lower toward 0.10 for more glide.
  const LERP_SPEED = 0.10;  // lower = more glide (was 0.18); range 0.08–0.25

  // Throttle refs (avoid setState every RAF tick)
  const lastUIUpdateRef   = useRef(0);
  const lastVectorUpdate  = useRef(0);
  const lastFaceDetected  = useRef(false);

  useEffect(() => { phaseRef.current = phase; },       [phase]);
  useEffect(() => { onLaunchRef.current = onLaunch; }, [onLaunch]);

  const origin = useMemo(() => ({ x: LAUNCH_X, y: LAUNCH_Y }), []);

  const yawToAngle = useCallback((yaw: number): number => {
    const t = (yaw + 1) / 2;
    return MAX_ANGLE - t * (MAX_ANGLE - MIN_ANGLE);
  }, []);

  // =============================================
  // createRunOnJS callback — writes ONLY to touchlessState.
  // ~500ns. Does not call processYaw, setState, or any Animated method.
  // This is the ONLY thing that should happen on the JS thread per camera frame.
  // =============================================
  const handleFaceJS = useRef(
    Worklets.createRunOnJS((yawDeg: number, detected: boolean) => {
      touchlessState.yawDeg   = yawDeg;
      touchlessState.detected = detected;
    })
  ).current;

  // =============================================
  // Frame processor — worklet thread only.
  // Calls detectFaces and immediately dispatches to handleFaceJS.
  // =============================================
  const frameProcessor = useFrameProcessor((frame) => {
    'worklet';
    const faces = detectFaces(frame);
    if (faces.length > 0) {
      handleFaceJS(-(faces[0].yawAngle ?? 0), true);
    } else {
      handleFaceJS(0, false);
    }
  }, [detectFaces, handleFaceJS]);

  // =============================================
  // requestAnimationFrame loop — ALL JS work happens here.
  //
  // Cooperative with game engine's RAF: both are scheduled in the same
  // 16ms frame budget. Ours costs ~0.5ms (processYaw + setValue).
  //
  // Per tick:
  //   1. Read touchlessState (plain object read, ~10ns)
  //   2. processYaw() — EMA smoothing (~50ns)
  //   3. cursorXAnim.setValue() — native write, no React re-render
  //   4. Every UI_UPDATE_MS: setState for face indicator + debug text
  //   5. Every 200ms: setDisplayYaw for trajectory arc
  // =============================================
  useEffect(() => {
    if (!permissionsReady) return;

    const tick = () => {
      const now      = Date.now();
      const detected = touchlessState.detected;
      const yawDeg   = touchlessState.yawDeg;

      // ── Face indicator (low frequency setState) ──
      if (now - lastUIUpdateRef.current >= UI_UPDATE_MS) {
        lastUIUpdateRef.current = now;

        if (detected !== lastFaceDetected.current) {
          lastFaceDetected.current = detected;
          setFaceDetected(detected);
          if (detected && !faceEverDetected.current) {
            faceEverDetected.current = true;
            setDebugInfo('Face detected! Aim & blow to launch!');
          } else if (!detected && faceEverDetected.current) {
            setDebugInfo('Face lost — look at camera');
          }
        }
      }

      // ── Yaw processing: update EMA target (runs only when face present) ──
      if (detected && phaseRef.current === 'aiming') {
        processYaw(yawDeg, {
          onYawUpdate: (yaw) => {
            currentYawRef.current      = yaw;
            touchlessState.smoothedYaw = yaw;
          },
        });
      }

      // ── Cursor: lerp display value toward target every RAF tick (60fps) ──
      // Face detection fires at ~12fps. Without lerp the cursor snaps/jumps.
      // With lerp it glides smoothly between sparse updates.
      // LERP_SPEED = 0.18 → ~5 frames to close 60% of the gap at 60fps.
      // Raise toward 0.35 for snappier feel, lower to 0.10 for more glide.
      const target  = currentYawRef.current;
      const current = displayYawRef.current;
      const next    = current + (target - current) * LERP_SPEED;
      displayYawRef.current = next;
      cursorXAnim.setValue(yawToCursorX(next));

      // Trajectory arc — 200ms updates are plenty for a dotted arc
      if (now - lastVectorUpdate.current >= 200) {
        lastVectorUpdate.current = now;
        setDisplayYaw(next);
      }

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [permissionsReady]);

  // Trajectory overlay — driven by displayYaw state (200ms updates)
  useEffect(() => {
    if (phase === 'aiming' && onVector) {
      const angle = yawToAngle(currentYawRef.current);
      onVector({
        dx: Math.cos(angle), dy: Math.sin(angle),
        power: 0.5, angle, origin,
      });
    }
  }, [displayYaw, phase, onVector, origin, yawToAngle]);

  // =============================================
  // Permissions
  // =============================================
  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      try {
        if (!hasCamPermission) {
          setDebugInfo('Requesting camera...');
          const granted = await requestCamPermission();
          if (!granted) {
            setDebugInfo('Camera denied');
            setPermissionsReady(true);
            return;
          }
        }
        if (cancelled) return;
        setDebugInfo('Camera ready — requesting mic...');
        await new Promise(r => setTimeout(r, 800));
        if (cancelled) return;
        const mic = await Audio.requestPermissionsAsync();
        if (cancelled) return;
        if (mic.status === 'granted') {
          setMicReady(true);
          setDebugInfo('Look at camera to aim, blow to launch!');
        } else {
          setDebugInfo('Mic denied — blow detection unavailable');
        }
        setPermissionsReady(true);
      } catch (e) {
        console.error('[TouchlessControls] Permission error:', e);
        setPermissionsReady(true);
      }
    };
    run();
    return () => { cancelled = true; };
  }, []);

  // =============================================
  // Power bar
  // =============================================
  useEffect(() => {
    const listenerId = powerAnim.addListener(({ value }) => {
      powerRef.current = value;
    });
    powerAnimRef.current = Animated.loop(
      Animated.sequence([
        Animated.timing(powerAnim, {
          toValue: 1, duration: POWER_CYCLE_MS / 2,
          easing: Easing.inOut(Easing.sin), useNativeDriver: false,
        }),
        Animated.timing(powerAnim, {
          toValue: 0.1, duration: POWER_CYCLE_MS / 2,
          easing: Easing.inOut(Easing.sin), useNativeDriver: false,
        }),
      ])
    );
    powerAnim.setValue(0.1);
    powerAnimRef.current.start();
    return () => {
      powerAnim.removeListener(listenerId);
      powerAnimRef.current?.stop();
    };
  }, []);

  // =============================================
  // Blow detection
  // =============================================
  useEffect(() => {
    if (disabled || !micReady) return;

    const detector = new BlowDetector({
      onBlow: () => {
        if (phaseRef.current !== 'aiming') return;
        setPhase('launching');
        phaseRef.current = 'launching';

        const yaw   = currentYawRef.current;
        const angle = yawToAngle(yaw);
        const power = Math.max(0.15, powerRef.current);

        onLaunchRef.current({
          dx: Math.cos(angle), dy: Math.sin(angle),
          power, angle, origin,
        });

        setTimeout(() => {
          resetYaw();
          touchlessState.yawDeg      = 0;
          touchlessState.detected    = false;
          touchlessState.smoothedYaw = 0;
          currentYawRef.current = 0;
          displayYawRef.current = 0;
          cursorXAnim.setValue(yawToCursorX(0));
          setDisplayYaw(0);
          setPhase('aiming');
          phaseRef.current = 'aiming';
          setDebugInfo('Aim & blow to launch!');
        }, 800);
      },
      threshold:      -35,  // more sensitive (was -20); raise toward -20 to require harder blow, lower toward -45 for even lighter
      holdMs:          50,
      cooldownMs:    1500,
      pollIntervalMs: 250,
    });

    detector.start().then(() => {
      setDebugInfo(
        detector.isRunning
          ? 'Ready! Turn head to aim, blow to launch'
          : 'Blow detector failed to start'
      );
    });
    blowDetectorRef.current = detector;

    return () => {
      detector.stop();
      blowDetectorRef.current = null;
    };
  }, [disabled, micReady, yawToAngle, origin]);

  // ─────────────────────────────────────────────────────────────────────────────
  // Derived animated values for power bar
  const powerBarFill  = powerAnim.interpolate({
    inputRange: [0, 1], outputRange: [0, POWER_BAR_HEIGHT - 4],
  });
  const powerBarColor = powerAnim.interpolate({
    inputRange:  [0,        0.3,       0.6,       1       ],
    outputRange: ['#4ECDC4','#FFD700', '#FF6B35', '#FF2D55'],
  });

  if (!hasCamPermission && permissionsReady) {
    return (
      <View style={styles.permissionContainer}>
        <Text style={styles.permissionText}>
          Camera permission required for Touchless Mode
        </Text>
        <Text style={styles.permissionSubtext}>
          Go to Settings → Flush Frenzy → Camera
        </Text>
      </View>
    );
  }
  if (!device) {
    return (
      <View style={styles.permissionContainer}>
        <Text style={styles.permissionText}>No front camera available</Text>
      </View>
    );
  }

  return (
    <View style={styles.container} pointerEvents="none">

      {/* Camera preview (small, bottom-left) */}
      <View style={styles.cameraPreview}>
        {hasCamPermission && device && (
          <Camera
            style={styles.camera}
            device={device}
            isActive={!disabled}
            frameProcessor={frameProcessor}
            pixelFormat="yuv"
          />
        )}
        <View style={[
          styles.faceIndicator,
          { backgroundColor: faceDetected ? '#4ECDC4' : '#FF6B6B' },
        ]} />
      </View>

      {/* Instruction bar — positioned below header buttons */}
      <View style={styles.debugContainer}>
        <Text style={styles.debugText}>Turn your head to aim, blow to launch</Text>
      </View>


      {/* Horizontal aim slider */}
      <HorizontalAimCursor cursorXAnim={cursorXAnim} phase={phase} />

      {/* Power bar */}
      <View style={[
        styles.powerBarContainer,
        phase === 'launching' && { opacity: 0 },
      ]}>
        <View style={styles.powerBarTrack}>
          <Animated.View style={[
            styles.powerBarFill,
            { height: powerBarFill, backgroundColor: powerBarColor },
          ]} />
        </View>
        <Text style={styles.powerLabel}>POWER</Text>
      </View>

    </View>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 50,
  },
  cameraPreview: {
    position: 'absolute', bottom: 30, left: 15,
    width: 80, height: 100, borderRadius: 12, overflow: 'hidden',
    borderWidth: 2, borderColor: 'rgba(255,255,255,0.6)', zIndex: 60,
  },
  camera: { flex: 1 },
  faceIndicator: {
    position: 'absolute', top: 6, right: 6,
    width: 10, height: 10, borderRadius: 5,
    borderWidth: 1, borderColor: 'rgba(0,0,0,0.3)',
  },
  debugContainer: {
    position: 'absolute', top: 160, left: 20, right: 20,
    backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 8, padding: 8, zIndex: 99,
  },
  debugText: {
    color: '#4ECDC4', fontSize: 11, fontWeight: '600', textAlign: 'center',
  },
  phaseIndicator: {
    position: 'absolute', bottom: 160, left: 0, right: 0,
    alignItems: 'center', zIndex: 55,
  },
  phaseText: {
    color: '#FFFFFF', fontSize: 16, fontWeight: '700', textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowOffset: { width: 1, height: 1 }, textShadowRadius: 3,
  },
  phaseSubtext: {
    color: 'rgba(255,255,255,0.8)', fontSize: 12, fontWeight: '500',
    textAlign: 'center', marginTop: 4,
    textShadowColor: 'rgba(0,0,0,0.4)',
    textShadowOffset: { width: 1, height: 1 }, textShadowRadius: 2,
  },
  powerBarContainer: {
    position: 'absolute', right: 20, bottom: 100,
    alignItems: 'center', zIndex: 55,
  },
  powerBarTrack: {
    width: POWER_BAR_WIDTH, height: POWER_BAR_HEIGHT,
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderRadius: POWER_BAR_WIDTH / 2,
    borderWidth: 2, borderColor: 'rgba(255,255,255,0.5)',
    overflow: 'hidden', justifyContent: 'flex-end',
  },
  powerBarFill: { width: '100%', borderRadius: POWER_BAR_WIDTH / 2 - 2 },
  powerLabel: {
    color: '#FFFFFF', fontSize: 10, fontWeight: '800',
    marginTop: 6, letterSpacing: 1,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 1, height: 1 }, textShadowRadius: 2,
  },
  permissionContainer: {
    position: 'absolute', bottom: 40, left: 20, right: 20,
    backgroundColor: 'rgba(0,0,0,0.7)', borderRadius: 12,
    padding: 20, alignItems: 'center', zIndex: 60,
  },
  permissionText: {
    color: '#FFFFFF', fontSize: 14, fontWeight: '700',
    textAlign: 'center', marginBottom: 8,
  },
  permissionSubtext: {
    color: 'rgba(255,255,255,0.7)', fontSize: 12, textAlign: 'center',
  },
});

export default TouchlessControls;

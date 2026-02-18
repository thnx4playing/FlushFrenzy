// src/components/input/TouchlessControls.tsx
// Touchless Mode: head yaw → aim direction, blow → lock/launch.
// Uses react-native-vision-camera + MLKit for face detection.
// Falls back to auto-sweep if face detection is unavailable.

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Animated,
  Easing,
  Platform,
} from 'react-native';
import {
  Camera,
  useCameraDevice,
  useCameraPermission,
  useFrameProcessor,
} from 'react-native-vision-camera';
import { useFaceDetector } from 'react-native-vision-camera-face-detector';
// import { Worklets } from 'react-native-worklets-core'; // Disabled until worklets threading resolved
import { Audio } from 'expo-av';
import { BlowDetector } from '../../services/BlowDetector';
import { processYaw, resetYaw } from '../../services/HeadTracker';

const { width: WIDTH, height: HEIGHT } = Dimensions.get('window');

// === Aim arc constants ===
const ARC_CENTER_X = WIDTH / 2;
const ARC_CENTER_Y = HEIGHT - 24 - 56;
const ARROW_LENGTH = 60;
const MIN_ANGLE = Math.PI * 0.15;
const MAX_ANGLE = Math.PI * 0.85;

// === Power bar constants ===
const POWER_BAR_HEIGHT = 180;
const POWER_BAR_WIDTH = 24;
const POWER_CYCLE_DURATION = 1200;

// === Auto-sweep fallback ===
const SWEEP_SPEED = 0.015; // radians per frame

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

type Phase = 'aiming' | 'power' | 'launching';

const TouchlessControls: React.FC<TouchlessControlsProps> = ({
  onLaunch,
  onVector,
  disabled = false,
}) => {
  // =============================================
  // Vision Camera setup
  // =============================================
  const { hasPermission: hasCamPermission, requestPermission: requestCamPermission } = useCameraPermission();
  const device = useCameraDevice('front');

  // MLKit face detection setup
  const { detectFaces } = useFaceDetector({
    performanceMode: 'fast',
    landmarkMode: 'none',
    classificationMode: 'none',
  });

  // Mic permission
  const [micReady, setMicReady] = useState(false);
  const [permissionsChecked, setPermissionsChecked] = useState(false);

  // Game state
  const [phase, setPhase] = useState<Phase>('aiming');
  const [lockedAngle, setLockedAngle] = useState<number>(Math.PI / 2);
  const [currentYaw, setCurrentYaw] = useState<number>(0);
  const [faceDetected, setFaceDetected] = useState(false);
  const [debugInfo, setDebugInfo] = useState('Initializing...');

  // Face detection availability
  const [useFaceDetection, setUseFaceDetection] = useState(false); // Force auto-sweep (frame processor disabled)
  const faceDetectionTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const faceEverDetected = useRef(false);

  // Auto-sweep fallback state
  const sweepAngle = useRef(Math.PI / 2);
  const sweepDirection = useRef(1);
  const sweepTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  // Power bar animation
  const powerAnim = useRef(new Animated.Value(0)).current;
  const powerRef = useRef(0);
  const powerAnimRef = useRef<Animated.CompositeAnimation | null>(null);

  // Blow detector
  const blowDetectorRef = useRef<BlowDetector | null>(null);

  // Refs for latest state in callbacks (avoids stale closures)
  const phaseRef = useRef<Phase>('aiming');
  const lockedAngleRef = useRef<number>(Math.PI / 2);
  const currentYawRef = useRef<number>(0);
  const onLaunchRef = useRef(onLaunch);
  const useFaceDetectionRef = useRef(true);

  useEffect(() => { phaseRef.current = phase; }, [phase]);
  useEffect(() => { lockedAngleRef.current = lockedAngle; }, [lockedAngle]);
  useEffect(() => { currentYawRef.current = currentYaw; }, [currentYaw]);
  useEffect(() => { onLaunchRef.current = onLaunch; }, [onLaunch]);
  useEffect(() => { useFaceDetectionRef.current = useFaceDetection; }, [useFaceDetection]);

  const origin = useMemo(() => ({ x: ARC_CENTER_X, y: ARC_CENTER_Y }), []);

  // =============================================
  // STEP 1: Request permissions SEQUENTIALLY
  // =============================================
  useEffect(() => {
    let cancelled = false;

    const requestPermissions = async () => {
      try {
        // --- Camera ---
        setDebugInfo('Requesting camera...');
        if (!hasCamPermission) {
          const granted = await requestCamPermission();
          console.log('[Touchless] Camera permission:', granted);
          if (!granted) {
            setDebugInfo('Camera denied');
            setPermissionsChecked(true);
            return;
          }
        }
        console.log('[Touchless] Camera granted');

        if (cancelled) return;

        // --- Wait 1 second before requesting mic ---
        setDebugInfo('Camera ready. Requesting mic in 1s...');
        await new Promise(resolve => setTimeout(resolve, 1000));
        if (cancelled) return;

        // --- Microphone ---
        setDebugInfo('Requesting microphone...');
        const micResult = await Audio.requestPermissionsAsync();
        console.log('[Touchless] Mic permission:', micResult.status);

        if (cancelled) return;

        if (micResult.status === 'granted') {
          setDebugInfo('Mic granted. Starting blow detector...');
          setMicReady(true);
        } else {
          setDebugInfo('Mic denied — blow detection unavailable');
        }

        setPermissionsChecked(true);
      } catch (error) {
        console.error('[Touchless] Permission error:', error);
        setDebugInfo(`Permission error: ${error}`);
        setPermissionsChecked(true);
      }
    };

    requestPermissions();
    return () => { cancelled = true; };
  }, []);

  // Face detection fallback timer removed — auto-sweep is now the default

  // =============================================
  // STEP 3: Auto-sweep fallback
  // =============================================
  useEffect(() => {
    if (useFaceDetection) return;
    if (phase !== 'aiming') {
      if (sweepTimer.current) { clearInterval(sweepTimer.current); sweepTimer.current = null; }
      return;
    }

    sweepTimer.current = setInterval(() => {
      sweepAngle.current += SWEEP_SPEED * sweepDirection.current;

      if (sweepAngle.current >= MAX_ANGLE) {
        sweepAngle.current = MAX_ANGLE;
        sweepDirection.current = -1;
      } else if (sweepAngle.current <= MIN_ANGLE) {
        sweepAngle.current = MIN_ANGLE;
        sweepDirection.current = 1;
      }

      const t = (sweepAngle.current - MIN_ANGLE) / (MAX_ANGLE - MIN_ANGLE);
      const yaw = (1 - t) * 2 - 1;
      setCurrentYaw(yaw);
      currentYawRef.current = yaw;
    }, 16);

    return () => {
      if (sweepTimer.current) { clearInterval(sweepTimer.current); sweepTimer.current = null; }
    };
  }, [useFaceDetection, phase]);

  // =============================================
  // Head yaw → aim angle conversion
  // =============================================
  const yawToAngle = useCallback((yaw: number): number => {
    const t = (yaw + 1) / 2;
    return MAX_ANGLE - t * (MAX_ANGLE - MIN_ANGLE);
  }, []);

  const aimAngle = phase === 'aiming' ? yawToAngle(currentYaw) : lockedAngle;

  // Update trajectory overlay while aiming
  useEffect(() => {
    if (phase === 'aiming' && onVector) {
      const angle = yawToAngle(currentYaw);
      const dx = Math.cos(angle);
      const dy = Math.sin(angle);
      onVector({ dx, dy, power: 0.5, angle, origin });
    }
  }, [currentYaw, phase, onVector, origin]);

  // Power bar cycles continuously from mount
  useEffect(() => {
    const listenerId = powerAnim.addListener(({ value }) => {
      powerRef.current = value;
    });

    powerAnimRef.current = Animated.loop(
      Animated.sequence([
        Animated.timing(powerAnim, {
          toValue: 1,
          duration: POWER_CYCLE_DURATION / 2,
          easing: Easing.inOut(Easing.sine),
          useNativeDriver: false,
        }),
        Animated.timing(powerAnim, {
          toValue: 0.1,
          duration: POWER_CYCLE_DURATION / 2,
          easing: Easing.inOut(Easing.sine),
          useNativeDriver: false,
        }),
      ])
    );

    powerAnim.setValue(0.1);
    powerAnimRef.current.start();

    return () => {
      powerAnim.removeListener(listenerId);
      if (powerAnimRef.current) powerAnimRef.current.stop();
    };
  }, []);

  // =============================================
  // Blow detection — single blow = launch
  // =============================================
  useEffect(() => {
    if (disabled || !micReady) {
      console.log('[Touchless] Blow detector skipped — disabled:', disabled, 'micReady:', micReady);
      return;
    }

    console.log('[Touchless] Starting blow detector (once)...');
    setDebugInfo('Blow detector starting...');

    const detector = new BlowDetector({
      onBlow: () => {
        if (phaseRef.current !== 'aiming') {
          console.log('[Touchless] Ignoring blow — not in aiming phase');
          return;
        }

        console.log('[Touchless] BLOW! Launching...');
        setPhase('launching');

        const angle = yawToAngle(currentYawRef.current);
        const power = Math.max(0.15, powerRef.current);
        const dx = Math.cos(angle);
        const dy = Math.sin(angle);

        onLaunchRef.current({ dx, dy, power, angle, origin });
        setDebugInfo(`Launched! Power: ${Math.round(power * 100)}%`);

        // Reset for next throw
        setTimeout(() => {
          resetYaw();
          setCurrentYaw(0);
          sweepAngle.current = Math.PI / 2;
          setPhase('aiming');
          setDebugInfo(useFaceDetectionRef.current ? 'Turn your head to aim' : 'Auto-sweep — blow to lock');
        }, 800);
      },
      threshold: -15,
      holdMs: 100,
      cooldownMs: 1200, // Longer cooldown since one blow = full launch
    });

    detector.start().then(() => {
      console.log('[Touchless] Blow detector running:', detector.isRunning);
      setDebugInfo(detector.isRunning
        ? (useFaceDetection ? 'Ready! Turn head to aim, blow to launch' : 'Ready! Blow to launch')
        : 'Blow detector failed to start');
    });

    blowDetectorRef.current = detector;

    return () => {
      console.log('[Touchless] Stopping blow detector');
      detector.stop();
      blowDetectorRef.current = null;
    };
  }, [disabled, micReady]);

  // Frame processor disabled — using auto-sweep until worklets threading is resolved
  const frameProcessor = undefined;

  // =============================================
  // Arrow visuals
  // =============================================
  const powerBarFill = powerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, POWER_BAR_HEIGHT - 4],
  });

  const powerBarColor = powerAnim.interpolate({
    inputRange: [0, 0.3, 0.6, 1],
    outputRange: ['#4ECDC4', '#FFD700', '#FF6B35', '#FF2D55'],
  });

  // =============================================
  // Permission / device gate
  // =============================================
  if (!hasCamPermission && permissionsChecked) {
    return (
      <View style={styles.permissionContainer}>
        <Text style={styles.permissionText}>Camera permission required for Touchless Mode</Text>
        <Text style={styles.permissionSubtext}>Go to Settings → Flush Frenzy → Camera</Text>
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
      {/* Front camera preview with frame processor */}
      <View style={styles.cameraPreview}>
        {hasCamPermission && device && (
          <Camera
            style={styles.camera}
            device={device}
            isActive={true}
          />
        )}
        <View style={[
          styles.faceIndicator,
          { backgroundColor: faceDetected ? '#4ECDC4' : (useFaceDetection ? '#FF6B6B' : '#FFD700') }
        ]} />
      </View>

      {/* Debug info (remove for production) */}
      <View style={styles.debugContainer}>
        <Text style={styles.debugText}>{debugInfo}</Text>
      </View>

      {/* Phase indicator */}
      <View style={styles.phaseIndicator}>
        <Text style={styles.phaseText}>
          {phase === 'aiming'
            ? (useFaceDetection ? '🎯 Aim & blow to launch!' : '🎯 Watch & blow to launch!')
            : '🚀 Launching!'}
        </Text>
        <Text style={styles.phaseSubtext}>
          {phase === 'aiming' ? 'Time the power bar!' : ''}
        </Text>
      </View>

      {/* Direction arrow — vertical bar that rotates from its base (the origin dot) */}
      <View
        style={{
          position: 'absolute',
          left: ARC_CENTER_X - 3,
          top: ARC_CENTER_Y - ARROW_LENGTH,
          width: 6,
          height: ARROW_LENGTH,
          transformOrigin: '50% 100%', // Rotate from bottom-center (the aim origin)
          transform: [{ rotate: `${90 - (aimAngle * 180 / Math.PI)}deg` }],
          zIndex: 52,
        }}
      >
        {/* Arrow shaft */}
        <View style={{
          flex: 1,
          backgroundColor: phase === 'aiming' ? '#4ECDC4' : '#FFD700',
          borderRadius: 3,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.3,
          shadowRadius: 3,
        }} />
        {/* Arrowhead triangle at top */}
        <View style={{
          position: 'absolute',
          top: -10,
          alignSelf: 'center',
          width: 0,
          height: 0,
          borderLeftWidth: 8,
          borderRightWidth: 8,
          borderBottomWidth: 12,
          borderLeftColor: 'transparent',
          borderRightColor: 'transparent',
          borderBottomColor: phase === 'aiming' ? '#4ECDC4' : '#FFD700',
        }} />
      </View>

      {/* Aim origin dot */}
      <View style={{
        position: 'absolute',
        left: ARC_CENTER_X - 6,
        top: ARC_CENTER_Y - 6,
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: 'rgba(255,255,255,0.9)',
        borderWidth: 2,
        borderColor: 'rgba(0,0,0,0.3)',
        zIndex: 53,
      }} />

      {/* Power bar */}
      {phase !== 'launching' && (
        <View style={styles.powerBarContainer}>
          <View style={styles.powerBarTrack}>
            <Animated.View
              style={[
                styles.powerBarFill,
                { height: powerBarFill, backgroundColor: powerBarColor },
              ]}
            />
          </View>
          <Text style={styles.powerLabel}>POWER</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    zIndex: 50,
  },
  cameraPreview: {
    position: 'absolute',
    bottom: 30, left: 15,
    width: 80, height: 100,
    borderRadius: 12, overflow: 'hidden',
    borderWidth: 2, borderColor: 'rgba(255,255,255,0.6)',
    zIndex: 60,
  },
  camera: { flex: 1 },
  faceIndicator: {
    position: 'absolute', top: 6, right: 6,
    width: 10, height: 10, borderRadius: 5,
    borderWidth: 1, borderColor: 'rgba(0,0,0,0.3)',
  },
  debugContainer: {
    position: 'absolute',
    top: 100, left: 10, right: 10,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 8, padding: 8,
    zIndex: 99,
  },
  debugText: {
    color: '#4ECDC4', fontSize: 11, fontWeight: '600',
    textAlign: 'center',
  },
  phaseIndicator: {
    position: 'absolute',
    bottom: 160, left: 0, right: 0,
    alignItems: 'center', zIndex: 55,
  },
  phaseText: {
    color: '#FFFFFF', fontSize: 16, fontWeight: '700',
    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3, textAlign: 'center',
  },
  phaseSubtext: {
    color: 'rgba(255,255,255,0.8)', fontSize: 12, fontWeight: '500',
    textShadowColor: 'rgba(0,0,0,0.4)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2, marginTop: 4, textAlign: 'center',
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
  powerBarFill: {
    width: '100%', borderRadius: POWER_BAR_WIDTH / 2 - 2,
  },
  powerLabel: {
    color: '#FFFFFF', fontSize: 10, fontWeight: '800',
    marginTop: 6, letterSpacing: 1,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  permissionContainer: {
    position: 'absolute', bottom: 40, left: 20, right: 20,
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: 12, padding: 20,
    alignItems: 'center', zIndex: 60,
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

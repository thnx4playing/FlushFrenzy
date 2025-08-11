// ToiletPaperToss.js
// Expo React Native + react-native-game-engine + matter-js starter for the Toilet Paper Toss game
// Features:
// - Slingshot-style aiming (drag back like Angry Birds)
// - Ping-pong charge bar (0→100→0 while holding)
// - Toilet paper (circle body) bounces off walls/ceiling/toilet
// - Touching the ground ends the turn and resets the paper
// - Tunable physics so the paper actually FLIES

import React, { useRef, useState, useEffect } from 'react';
import { StyleSheet, View, Dimensions, Text, Image, ImageBackground, TouchableOpacity, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { GameEngine } from 'react-native-game-engine';
import Matter from 'matter-js';
import { Audio } from 'expo-av';
import AimPad from '../../components/AimPad';
import TrajectoryOverlay from '../../components/TrajectoryOverlay';
import PowerBar from '../../components/PowerBar';

const { width: WIDTH, height: HEIGHT } = Dimensions.get('window');

// Sound effects
let dingSound = null;

const loadSounds = async () => {
  try {
    const { sound } = await Audio.Sound.createAsync(
      require('../../assets/ding.mp3')
    );
    dingSound = sound;
  } catch (error) {
    console.log('Could not load sound effect:', error);
  }
};

const playDingSound = async () => {
  if (dingSound) {
    try {
      await dingSound.replayAsync();
    } catch (error) {
      console.log('Could not play sound:', error);
    }
  }
};

/******************** Utility Renderers ********************/
const Circle = ({ body, color = '#ffffff', radius = 16, imageSource, hidden }) => {
  if (hidden) return null;
  const x = body.position.x - radius;
  const y = body.position.y - radius;
  return (
    <View style={[{
      position: 'absolute',
      left: x,
      top: y,
      width: radius * 2,
      height: radius * 2,
      borderRadius: radius,
      backgroundColor: color,
      borderWidth: 2,
      borderColor: '#222'
    }]}>
      {imageSource && (
        <Image
          source={imageSource}
          style={{
            width: '100%',
            height: '100%',
            borderRadius: radius,
          }}
          resizeMode="contain"
        />
      )}
    </View>
  );
};

const Box = ({ body, color = '#888' }) => {
  const { min, max } = body.bounds;
  const w = max.x - min.x;
  const h = max.y - min.y;
  const x = min.x;
  const y = min.y;
  return (
    <View style={[{
      position: 'absolute',
      left: x,
      top: y,
      width: w,
      height: h,
      backgroundColor: color,
      borderWidth: 1,
      borderColor: '#333'
    }]} />
  );
};

// AimIndicator and ChargeBar now imported from components/

// Toilet sprite bound to physics body
const ToiletSprite = ({ body }) => {
  const { min, max } = body.bounds;
  const w = max.x - min.x;
  const h = max.y - min.y;
  const x = min.x;
  const y = min.y;
  return (
    <View style={{ position: 'absolute', left: x, top: y, width: w, height: h }}>
      <Image source={require('../../assets/toilet.png')} style={{ width: '100%', height: '100%' }} resizeMode="contain" />
    </View>
  );
};

// Debug: Visualize static bodies to find invisible walls
const StaticBodiesOverlay = ({ engine }) => {
  if (!engine) return null;
  const bodies = Matter.Composite.allBodies(engine.world).filter(b => b.isStatic);
  return (
    <>
      {bodies.map((b, i) => {
        const bb = b.bounds;
        const left = bb.min.x, top = bb.min.y;
        const width = bb.max.x - bb.min.x, height = bb.max.y - bb.min.y;
        // Skip huge offscreen parking rects if you have any
        if (!isFinite(left) || !isFinite(top) || width <= 0 || height <= 0) return null;
        return (
          <View key={i} style={{
            position: "absolute",
            left, top, width, height,
            borderWidth: 2,
            borderColor: "rgba(255,0,0,0.8)",
            backgroundColor: "rgba(255,0,0,0.15)",
            zIndex: 999,
          }} />
        );
      })}
    </>
  );
};

// Bottom-center Press button used to start charging/aiming
const ShootButton = ({ held, onLayoutRect, onPressIn, onDrag, onRelease }) => {
  const size = 96;
  const viewRef = React.useRef(null);

  const reportLayout = () => {
    if (viewRef.current && typeof viewRef.current.measureInWindow === 'function') {
      viewRef.current.measureInWindow((x, y, width, height) => {
        const rect = { x, y, w: width, h: height };
        const anchor = { x: x + width / 2, y: y }; // top-center of button
        onLayoutRect && onLayoutRect(rect, anchor);
      });
    }
  };

  return (
    <View
      ref={viewRef}
      style={styles.shootButton}
      onLayout={reportLayout}
      onStartShouldSetResponder={() => true}
      onResponderGrant={(e) => {
        reportLayout();
        const { pageX: x, pageY: y } = e.nativeEvent;
        onPressIn && onPressIn({ x, y });
      }}
      onResponderMove={(e) => {
        const { pageX: x, pageY: y } = e.nativeEvent;
        onDrag && onDrag({ x, y });
      }}
      onResponderRelease={() => onRelease && onRelease()}
    >
      <Image
        source={held ? require('../../assets/button_depressed.png') : require('../../assets/button.png')}
        style={{ width: size, height: size }}
        resizeMode="contain"
      />
    </View>
  );
};

/******************** Constants ********************/
const CONSTANTS = {
  TP_RADIUS: 18,
  START_X: WIDTH * 0.50, // Start center horizontally
  START_Y: HEIGHT - 24 - 56 - 50, // Above the AimPad
  MAX_AIM_LEN: 160, // px drag clamp
  MAX_IMPULSE: 0.12, // scale for Matter.applyForce (tune 0.04..0.14)
  CHARGE_SPEED: 170, // percent per second
  GRAVITY_Y: 0.8, // Reduced from 1.4 to 0.8 for higher arcs
};

/******************** World Factory ********************/

// Clean arena builder
const buildArena = (engine, W, H, tpBody) => {
  const world = engine.world;

  // Remove all bodies except TP
  Matter.Composite.allBodies(world).forEach(b => {
    if (b !== tpBody) Matter.World.remove(world, b);
  });

  // Add floor, ceiling, left wall, right wall
  const wall = { isStatic: true, label: "BOUNDARY" };
  const walls = [
    Matter.Bodies.rectangle(W / 2, H + 40, W, 80, wall),   // floor
    Matter.Bodies.rectangle(W / 2, -40, W, 80, wall),      // ceiling
    Matter.Bodies.rectangle(-40, H / 2, 80, H, wall),      // left
    Matter.Bodies.rectangle(W + 40, H / 2, 80, H, wall),   // right
  ];
  Matter.World.add(world, walls);
};

// Add toilet bowl as scoring sensor
const addBowl = (engine, W, H) => {
  const world = engine.world;
  
  const bowlX = W / 2;
  const bowlY = H * 0.35;   // moved up from 0.52 to 0.35 (35% of screen height)
  const bowlR = 42;         // adjust to hole size in px

  const bowlSensor = Matter.Bodies.circle(bowlX, bowlY, bowlR, {
    isStatic: true,
    isSensor: true,
    label: "BOWL_SENSOR",
  });

  const rim = Matter.Bodies.circle(bowlX, bowlY, bowlR + 4, {
    isStatic: true,
    label: "BOWL_RIM",
  });

  Matter.World.add(world, [bowlSensor, rim]);

  Matter.Events.on(engine, "collisionStart", (e) => {
    e.pairs.forEach(({ bodyA, bodyB }) => {
      const names = new Set([bodyA.label, bodyB.label]);
      if (names.has("BOWL_SENSOR") && names.has("TP")) {
        console.log("SCORE! TP hit the bowl!");
        // score point here
      }
    });
  });
};

// Create TP body
const createTP = () => {
  return Matter.Bodies.circle(-9999, -9999, CONSTANTS.TP_RADIUS, {
    label: "TP",
    restitution: 0.45,
    friction: 0.05,
    frictionAir: 0.012,
    density: 0.0016,
    isStatic: true, // keep the roll fixed until launch
  });
};

const setupWorld = () => {
  const engine = Matter.Engine.create({ enableSleeping: false });
  const world = engine.world;
  world.gravity.y = CONSTANTS.GRAVITY_Y;

  // Create TP first
  const tp = createTP();

  // Build clean arena
  buildArena(engine, WIDTH, HEIGHT, tp);
  
  // Add toilet bowl
  addBowl(engine, WIDTH, HEIGHT);

  // Remove any old debug colliders
  Matter.Composite.allBodies(engine.world).forEach(b => {
    if (!["BOUNDARY", "BOWL_SENSOR", "BOWL_RIM", "TP"].includes(b.label)) {
      Matter.World.remove(engine.world, b);
    }
  });

  // Verify the arena
  const logStatics = (engine) => {
    const statics = Matter.Composite.allBodies(engine.world).filter(b => b.isStatic);
    console.log("CLEAN STATIC BODIES:", statics.map(b => ({
      label: b.label,
      x: b.position.x.toFixed(1),
      y: b.position.y.toFixed(1),
      w: (b.bounds.max.x - b.bounds.min.x).toFixed(1),
      h: (b.bounds.max.y - b.bounds.min.y).toFixed(1),
    })));
  };
  logStatics(engine);

  return { engine, world, bodies: { tp } };
};

/******************** Systems ********************/
// Fixed-step physics
const Physics = (entities, { time }) => {
  const engine = entities.physics.engine;
  Matter.Engine.update(engine, time?.delta || 16.666);
  return entities;
};

// ChargeSystem now imported from systems/ChargeSystem.js

// Handle end-turn when touching ground
const CollisionSystem = (entities, { events }) => {
  // We subscribe to Matter collision events once in App; here just read flags from entities.state
  return entities;
};

/******************** Main Component ********************/
export default function ToiletPaperToss({ onGameComplete, gameMode }) {
  const gameRef = useRef(null);
  const [ready, setReady] = useState(false);
  const [score, setScore] = useState(0);
  const [misses, setMisses] = useState(0);
  const [timeLeft, setTimeLeft] = useState(gameMode === 'quick-flush' ? 60 : 0);

  const [isMuted, setIsMuted] = useState(false);
  const [settingsVisible, setSettingsVisible] = useState(false);
  const [tpPos, setTpPos] = useState({ x: -9999, y: -9999 });
  const [tpVisible, setTpVisible] = useState(false);

  const [enginePkg] = useState(() => setupWorld());
  const { engine, world, bodies } = enginePkg;

  // Debug: Dump static bodies to find invisible walls
  const dumpStatics = (engine) => {
    const bodies = Matter.Composite.allBodies(engine.world);
    const statics = bodies.filter(b => b.isStatic);
    console.log("STATIC BODIES:", statics.length);
    statics.forEach((b, i) => {
      const bb = b.bounds;
      console.log(
        `#${i} label=${b.label || "(none)"} x=${b.position.x.toFixed(1)} y=${b.position.y.toFixed(1)} ` +
        `w=${(bb.max.x - bb.min.x).toFixed(1)} h=${(bb.max.y - bb.min.y).toFixed(1)}`
      );
    });
  };

  // Keep last aim from AimPad
  const lastAimRef = useRef(null);

  // Bulletproof launch function
  const doLaunch = () => {
    const a = lastAimRef.current;
    const tp = bodies?.tp;                           // stick to ONE body reference
    if (!a || !tp) { console.log('No aim/body'); return; }

    // spawn at pad center (with fallback)
    const spawn = { 
      x: a.origin?.x || WIDTH / 2, 
      y: a.origin?.y || HEIGHT - 24 - 90 
    };

    console.log('DEBUG LAUNCH:', {
      aimData: a,
      origin: a.origin,
      spawn: spawn,
      tpBody: tp.position
    });

    // Ensure spawn coordinates are valid numbers
    if (!Number.isFinite(spawn.x) || !Number.isFinite(spawn.y)) {
      console.log('Invalid spawn coordinates:', spawn);
      return;
    }

    // wake + place
    Matter.Body.setStatic(tp, false);
    Matter.Sleeping.set(tp, false);
    Matter.Body.setPosition(tp, spawn);
    Matter.Body.setVelocity(tp, { x: 0, y: 0 });
    Matter.Body.setAngularVelocity(tp, 0);

    // Verify the body position was set correctly
    const newPos = tp.position;
    if (!Number.isFinite(newPos.x) || !Number.isFinite(newPos.y)) {
      console.log('Failed to set body position, creating new body');
      // Create a new body if the current one is corrupted
      const newTp = Matter.Bodies.circle(spawn.x, spawn.y, CONSTANTS.TP_RADIUS, {
        restitution: 0.45,
        friction: 0.05,
        frictionAir: 0.012,
        density: 0.0016,
        label: 'toiletPaper'
      });
      
      // Remove old body and add new one
      Matter.World.remove(world, tp);
      Matter.World.add(world, newTp);
      
      // Update the reference
      bodies.tp = newTp;
      
      // Set velocity on the new body
      const charged = (stateRef.current?.charge ?? 0) / 100;
      const rawP = charged || a.power || 0;
      const p = Math.max(0.25, Math.min(1, rawP));
      const SPEED = 35;  // Increased back up with reduced gravity
      const vx = (a.dir?.x || 0) * SPEED * p;
      const vy = -(Math.abs(a.dir?.y || 0)) * SPEED * p;
      
      Matter.Body.setVelocity(newTp, { x: vx, y: vy });
      Matter.Body.setAngularVelocity(newTp, 0.2 * p);
      
      setTpPos(spawn);
      setTpVisible(true);
      
      console.log('LAUNCH with new body', { spawn, vx, vy, p });
      return;
    }

    // power (use charge if available, else stick distance); add a safe minimum
    const charged = (stateRef.current?.charge ?? 0) / 100;
    const rawP = charged || a.power || 0;
    const p = Math.max(0.25, Math.min(1, rawP));     // TEMP min power 25%
    const SPEED = 35;  // Increased back up with reduced gravity

    // portrait: up is negative Y
    const vx = (a.dir?.x || 0) * SPEED * p;
    const vy = -(Math.abs(a.dir?.y || 0)) * SPEED * p;

    Matter.Body.setVelocity(tp, { x: vx, y: vy });
    Matter.Body.setAngularVelocity(tp, 0.2 * p);

    // FIRST-FRAME SYNC + show sprite in the SAME component that renders it
    // Force immediate sync to prevent afterUpdate from overwriting
    setTpPos(spawn);
    setTpVisible(true);

    console.log('LAUNCH', { spawn, vx, vy, p });
  };

  const stateRef = useRef({
    isCharging: false,
    charge: 0,
    chargeDir: 1,
    aiming: false,
    dragStart: { x: CONSTANTS.START_X, y: CONSTANTS.START_Y },
    dragCurrent: { x: CONSTANTS.START_X, y: CONSTANTS.START_Y },
    turnOver: false,
    // AimPad controls
    padActive: false,
    padPower: 0,
    padOrigin: null,
    padVel: null,
  });

  // Load sounds
  useEffect(() => {
    loadSounds();
    return () => {
      if (dingSound) {
        dingSound.unloadAsync();
      }
    };
  }, []);

  // Apply mute state to loaded sounds
  useEffect(() => {
    const applyVolume = async () => {
      if (dingSound) {
        try {
          await dingSound.setVolumeAsync(isMuted ? 0 : 1);
        } catch (e) {
          // ignore
        }
      }
      try {
        await Audio.setIsEnabledAsync(!isMuted);
      } catch {}
    };
    applyVolume();
  }, [isMuted]);

  // Game timer
  useEffect(() => {
    let timer;
    if (gameMode === 'quick-flush' && timeLeft > 0) {
      timer = setTimeout(() => {
        setTimeLeft(timeLeft - 1);
      }, 1000);
    } else if (gameMode === 'quick-flush' && timeLeft === 0) {
      onGameComplete(score);
    } else if (gameMode === 'endless-plunge' && misses >= 3) {
      onGameComplete(score);
    }
    return () => clearTimeout(timer);
  }, [timeLeft, misses, gameMode, score]);

  // Collision handling: if tp hits ground, mark turn over
  useEffect(() => {
    const onCollide = (e) => {
      const pairs = e.pairs || [];
      for (const p of pairs) {
        const labels = [p.bodyA.label, p.bodyB.label];
        if (labels.includes('toiletPaper') && labels.includes('ground')) {
          stateRef.current.turnOver = true;
          setMisses(prev => prev + 1);
        }
        if (labels.includes('toiletPaper') && labels.includes('toilet')) {
          setScore(prev => prev + 3);
          if (!isMuted) {
            playDingSound();
          }
          // Let TP fall naturally after scoring
          // No position reset - let physics handle it
        }
      }
    };
    Matter.Events.on(engine, 'collisionStart', onCollide);
    return () => Matter.Events.off(engine, 'collisionStart', onCollide);
  }, [engine, bodies.tp]);

  // After a turn ends, reset the paper
  useEffect(() => {
    let raf;
    const loop = () => {
      if (stateRef.current.turnOver) {
        // Let TP fall naturally, just reset UI state
        stateRef.current.turnOver = false;
        stateRef.current.isCharging = false;
        stateRef.current.aiming = false;
        stateRef.current.charge = 0;
        stateRef.current.chargeDir = 1;
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [bodies.tp]);

  // Oscillating charge system for power meter
  useEffect(() => {
    let raf;
    const step = () => {
      // run on RAF/timer; ONLY mutate while isCharging
      if (stateRef.current.isCharging) {
        let c = (stateRef.current.charge ?? 0) + (stateRef.current.chargeDir ?? 1) * 120 * (1/60);
        if (c >= 100) { c = 100; stateRef.current.chargeDir = -1; }
        if (c <= 0)   { c = 0;   stateRef.current.chargeDir =  1; }
        stateRef.current.charge = c;
      }
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, []);

  // Physics runner and position mirroring
  useEffect(() => {
    const engine = enginePkg.engine;
    const runner = Matter.Runner.create();
    Matter.Runner.run(runner, engine);

    engine.world.gravity.x = 0;
    engine.world.gravity.y = CONSTANTS.GRAVITY_Y;

    Matter.Events.on(engine, "afterUpdate", () => {
      const tp = bodies?.tp;
      if (!tp) return;
      const p = tp.position;
      
      // Only update tpPos if the body has moved from its initial off-screen position
      if (p.x > -9000 && p.y > -9000) {
        setTpPos({ x: p.x, y: p.y });
      }
      
      // Hide TP when it falls off screen or stops moving
      if (tpVisible && tp.position.y > HEIGHT + 100) {
        setTpVisible(false);
      }
    });

    return () => {
      Matter.Events.off(engine, "afterUpdate");
      Matter.Engine.clear(engine);
    };
  }, [enginePkg, bodies.tp]);

  // Input handled via AimPad
  const systems = [Physics, CollisionSystem];

  const [tick, setTick] = useState(0);
  useEffect(() => {
    // Force a slow UI refresh for HUD ~30fps without spamming state
    const id = setInterval(() => setTick((t) => t + 1), 33);
    setReady(true);
    
    // Debug: Dump static bodies to find invisible walls
    setTimeout(() => {
      dumpStatics(engine);
    }, 1000);
    
    return () => clearInterval(id);
  }, []);

  const state = stateRef.current;

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <View style={styles.container}>
      {/* Game UI */}
      <View style={styles.gameUI}>
        <View style={styles.actionsRow}>
          <TouchableOpacity accessibilityLabel="Settings" onPress={() => setSettingsVisible(true)} style={styles.iconButton}>
            <Ionicons name="settings-sharp" size={22} color="#343a40" />
          </TouchableOpacity>
          <View style={styles.actionsCenter}>
            <View style={styles.scoreContainer}>
              <Text style={styles.scoreLabel}>Score</Text>
              <Text style={styles.scoreValue}>{score}</Text>
            </View>
            {gameMode === 'quick-flush' && (
              <View style={styles.timeContainer}>
                <Text style={styles.timeLabel}>Time</Text>
                <Text style={styles.timeValue}>{formatTime(timeLeft)}</Text>
              </View>
            )}
            {gameMode === 'endless-plunge' && (
              <View style={styles.missesContainer}>
                <Text style={styles.missesLabel}>Misses</Text>
                <Text style={styles.missesValue}>{misses}/3</Text>
              </View>
            )}
          </View>
          <TouchableOpacity accessibilityLabel="Toggle sound" onPress={() => setIsMuted(m => !m)} style={styles.iconButton}>
            <Ionicons name={isMuted ? 'volume-mute' : 'volume-high'} size={22} color={isMuted ? '#adb5bd' : '#343a40'} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Game Area */}
      <ImageBackground 
        source={require('../../assets/game_background.png')} 
        style={styles.gameArea}
        resizeMode="stretch"
      >
        <GameEngine
          ref={gameRef}
          style={styles.game}
          systems={systems}
          entities={{
            physics: { engine, world },
            state,
            tp: { body: bodies.tp, renderer: null }, // TP now rendered separately
          }}
        >
          {/* HUD removed: old charge bar + trajectory indicator */}
        </GameEngine>

        {/* New overlay + AimPad */}
        <TrajectoryOverlay
          origin={state.padOrigin || { x: WIDTH / 2, y: HEIGHT - 24 - 56 }}
          vel={state.padVel || null}
          gravityY={CONSTANTS.GRAVITY_Y}
          visible={!!state.padActive}
          steps={26}
          dt={1/30}
        />

        <AimPad
          radius={90}
          onAim={({ dir, power, active, origin }) => {
            lastAimRef.current = { dir, power, origin };
            stateRef.current.padActive = !!active;

            // start charge only while aiming
            if (active && !stateRef.current.isCharging) {
              stateRef.current.isCharging = true;
              stateRef.current.charge = 0;        // start from 0 each aim
              stateRef.current.chargeDir = 1;     // ping-pong up first
            }
          }}
          onRelease={() => {
            stateRef.current.isCharging = false;  // <-- stop the meter
            stateRef.current.charge = 0;          // reset for next shot
            doLaunch();                            // call your launch fn (below)
          }}
        />

        <PowerBar value={(state.charge || 0) / 100} />

        {/* Debug: Visualize static bodies (temporarily disabled) */}
        {/* <StaticBodiesOverlay engine={engine} /> */}

        {/* Toilet sprite (visual only, no physics) */}
        <View style={{
          position: 'absolute',
          left: WIDTH * 0.5 - 160,
          top: HEIGHT * 0.35 - 160,
          width: 320,
          height: 320,
          zIndex: 10,
        }}>
          <Image
            source={require('../../assets/toilet.png')}
            style={{ width: '100%', height: '100%' }}
            resizeMode="contain"
          />
        </View>

        {/* TP sprite — bulletproof rendering */}
        {tpVisible && Number.isFinite(tpPos.x) && Number.isFinite(tpPos.y) && (
          <Image
            source={require('../../assets/tp.png')}   // verify path!
            style={{ position:'absolute', left: tpPos.x - 28, top: tpPos.y - 28, width:56, height:56, zIndex:20 }}
            resizeMode="contain"
            onLoad={() => console.log('TP image loaded successfully')}
            onError={(error) => console.error('TP image failed to load:', error)}
          />
        )}
        
        {/* Debug: Show TP position as a simple colored circle if image fails */}
        {tpVisible && Number.isFinite(tpPos.x) && Number.isFinite(tpPos.y) && (
          <View
            style={{
              position: 'absolute',
              left: tpPos.x - 28,
              top: tpPos.y - 28,
              width: 56,
              height: 56,
              borderRadius: 28,
              backgroundColor: '#FF6B6B',
              borderWidth: 2,
              borderColor: '#fff',
              zIndex: 19
            }}
          />
        )}


      </ImageBackground>

      <Modal
        transparent
        animationType="fade"
        visible={settingsVisible}
        onRequestClose={() => setSettingsVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Settings</Text>
            <Text style={styles.modalText}>Coming soon.</Text>
            <TouchableOpacity onPress={() => setSettingsVisible(false)} style={styles.modalButton}>
              <Text style={styles.modalButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

/******************** Styles ********************/
const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#0e0f12' 
  },
  gameUI: {
    flexDirection: 'column',
    justifyContent: 'flex-start',
    padding: 20,
    paddingTop: 80,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  actionsCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    gap: 24,
  },
  scoreContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 80,
  },
  timeContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 100,
  },
  actionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconButton: {
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  scoreLabel: {
    fontSize: 14,
    color: '#6c757d',
    fontWeight: '600',
  },
  scoreValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4ECDC4',
  },

  timeLabel: {
    fontSize: 14,
    color: '#6c757d',
    fontWeight: '600',
  },
  timeValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FF6B6B',
  },
  missesContainer: {
    alignItems: 'center',
  },
  missesLabel: {
    fontSize: 14,
    color: '#6c757d',
    fontWeight: '600',
  },
  missesValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FF6B6B',
  },
  gameArea: {
    flex: 1,
    position: 'relative',
  },
  game: { 
    flex: 1, 
    backgroundColor: 'transparent' 
  },
  shootWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shootButton: {
    width: 110,
    height: 110,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toiletContainer: {
    position: 'absolute',
    width: 270,
    height: 240,
    zIndex: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toiletImage: {
    width: 270,
    height: 240,
  },
  titleWrap: { 
    position: 'absolute', 
    top: 20, 
    width: '100%', 
    alignItems: 'center' 
  },
  title: { 
    color: '#fff', 
    fontSize: 22, 
    fontWeight: '700' 
  },
  subtitle: { 
    color: '#9aa3b2', 
    fontSize: 12, 
    marginTop: 4 
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCard: {
    width: '80%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
    color: '#212529',
  },
  modalText: {
    fontSize: 14,
    color: '#495057',
    marginBottom: 16,
  },
  modalButton: {
    backgroundColor: '#4ECDC4',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  modalButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  // Old aim and charge styles removed - now using imported components
});

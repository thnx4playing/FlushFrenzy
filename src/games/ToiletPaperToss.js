// FlushFrenzy.js
// Expo React Native + react-native-game-engine + matter-js starter for the Flush Frenzy game
// Features:
// - Slingshot-style aiming (drag back like Angry Birds)

// - TP roll (circle body) bounces off walls/ceiling/toilet
// - Touching the ground ends the turn and resets the paper
// - Tunable physics so the paper actually FLIES

import React, { useRef, useState, useEffect } from "react";
import {
  StyleSheet,
  View,
  Dimensions,
  Text,
  Image,
  ImageBackground,
  TouchableOpacity,
  Modal,
  Animated,
} from "react-native";
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Easing } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { GameEngine } from "react-native-game-engine";
import Matter from "matter-js";
import { Audio } from "expo-av";
import Svg, { Polygon, Circle as SvgCircle, Rect } from "react-native-svg";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import AxisAimPad from "../components/input/AxisAimPad";
import TrajectoryOverlay from "../../components/TrajectoryOverlay";
import GameHUD from "../ui/GameHUD";
import LevelUpBanner from "../components/LevelUpBanner";
import PracticeCustomizationModal from "../components/PracticeCustomizationModal";
import { saveHighScore, loadHighScore } from "../utils/highScore";
import { freshConfig } from "../game/gameModeConfig";
import { makeModeConfig } from "../game/mode-config";
import TrailRenderer from "../game/TrailRenderer";
import { useAudioStore } from '../audio/AudioStore';
import { loadPracticeConfig, savePracticeConfig } from "../state/practiceConfig";

// Set up poly-decomp for Matter.js concave shapes
import decomp from "poly-decomp";
Matter.Common.setDecomp(decomp);

const { width: WIDTH, height: HEIGHT } = Dimensions.get("window");



// Perk system constants
const PERK_TYPES = {
  CLOCK: 'clock',
  RAINBOW: 'rainbow',
  BUBBLE: 'bubble'
};

// Sound effects
let dingSound = null;
let waterDropSound = null;
let perkSound = null;
let soundEffectsVolume = 1.0; // Default volume

const loadSounds = async () => {
  try {
    const { sound: ding } = await Audio.Sound.createAsync(
      require("../../assets/ding.mp3"),
      { shouldPlay: false, isLooping: false }
    );
    dingSound = ding;

    const { sound: water } = await Audio.Sound.createAsync(
      require("../../assets/water-drop.caf"),
      { shouldPlay: false, isLooping: false }
    );
    waterDropSound = water;

    const { sound: perk } = await Audio.Sound.createAsync(
      require("../../assets/perk-sound.caf"),
      { shouldPlay: false, isLooping: false }
    );
    perkSound = perk;
  } catch (error) {
    console.log("Could not load sound effect:", error);
  }
};

const playDingSound = async () => {
  if (dingSound) {
    try {
      const { sfxMuted, sfxVolume } = useAudioStore.getState();
      if (!sfxMuted) {
        console.log('Playing ding sound with volume:', sfxVolume);
        await dingSound.setVolumeAsync(sfxVolume);
        await dingSound.replayAsync();
      }
    } catch (error) {
      console.log("Could not play sound:", error);
    }
  }
};

const playWaterDropSound = async () => {
  if (waterDropSound) {
    try {
      const { sfxMuted, sfxVolume } = useAudioStore.getState();
      if (!sfxMuted) {
        console.log('Playing water drop sound with volume:', sfxVolume);
        await waterDropSound.setVolumeAsync(sfxVolume);
        
        // Check if sound is already playing and stop it first
        const status = await waterDropSound.getStatusAsync();
        if (status.isLoaded && status.isPlaying) {
          await waterDropSound.stopAsync();
        }
        
        await waterDropSound.replayAsync();
      }
    } catch (error) {
      console.log("Could not play water drop sound:", error);
      // Try to reload the sound if it's in a bad state
      try {
        const { sound: newWater } = await Audio.Sound.createAsync(
          require("../../assets/water-drop.caf"),
          { shouldPlay: false, isLooping: false }
        );
        waterDropSound = newWater;
      } catch (reloadError) {
        console.log("Could not reload water drop sound:", reloadError);
      }
    }
  }
};

const playPerkSound = async () => {
  if (perkSound) {
    try {
      const { sfxMuted, sfxVolume } = useAudioStore.getState();
      if (!sfxMuted) {
        console.log('Playing perk sound with volume:', sfxVolume);
        await perkSound.setVolumeAsync(sfxVolume);
        
        // Check if sound is already playing and stop it first
        const status = await perkSound.getStatusAsync();
        if (status.isLoaded && status.isPlaying) {
          await perkSound.stopAsync();
        }
        
        await perkSound.replayAsync();
      }
    } catch (error) {
      console.log("Could not play perk sound:", error);
      // Try to reload the sound if it's in a bad state
      try {
        const { sound: newPerk } = await Audio.Sound.createAsync(
          require("../../assets/perk-sound.caf"),
          { shouldPlay: false, isLooping: false }
        );
        perkSound = newPerk;
      } catch (reloadError) {
        console.log("Could not reload perk sound:", reloadError);
      }
    }
  }
};

/******************** Utility Renderers ********************/
const Circle = ({
  body,
  color = "#ffffff",
  radius = 16,
  imageSource,
  hidden,
}) => {
  if (hidden) return null;
  const x = body.position.x - radius;
  const y = body.position.y - radius;
  return (
    <View
      style={[
        {
          position: "absolute",
          left: x,
          top: y,
          width: radius * 2,
          height: radius * 2,
          borderRadius: radius,
          backgroundColor: color,
          borderWidth: 2,
          borderColor: "#222",
        },
      ]}
    >
      {imageSource && (
        <Image
          source={imageSource}
          style={{
            width: "100%",
            height: "100%",
            borderRadius: radius,
          }}
          resizeMode="contain"
        />
      )}
    </View>
  );
};

const Box = ({ body, color = "#888" }) => {
  const { min, max } = body.bounds;
  const w = max.x - min.x;
  const h = max.y - min.y;
  const x = min.x;
  const y = min.y;
  return (
    <View
      style={[
        {
          position: "absolute",
          left: x,
          top: y,
          width: w,
          height: h,
          backgroundColor: color,
          borderWidth: 1,
          borderColor: "#333",
        },
      ]}
    />
  );
};

// Toilet sprite bound to physics body
const ToiletSprite = ({ body }) => {
  const { min, max } = body.bounds;
  const w = max.x - min.x;
  const h = max.y - min.y;
  const x = min.x;
  const y = min.y;
  return (
    <View
      style={{ position: "absolute", left: x, top: y, width: w, height: h }}
    >
      <Image
        source={require("../../assets/toilet.png")}
        style={{ width: "100%", height: "100%" }}
        resizeMode="contain"
      />
    </View>
  );
};


const StaticBodiesOverlay = ({ engine }) => {
  if (!engine) return null;
  const bodies = Matter.Composite.allBodies(engine.world).filter(
    (b) => b.isStatic,
  );
  return (
    <>
      {bodies.map((b, i) => {
        const bb = b.bounds;
        const left = bb.min.x,
          top = bb.min.y;
        const width = bb.max.x - bb.min.x,
          height = bb.max.y - bb.min.y;
        // Skip huge offscreen parking rects if you have any
        if (!isFinite(left) || !isFinite(top) || width <= 0 || height <= 0)
          return null;
        return (
          <View
            key={i}
            style={{
              position: "absolute",
              left,
              top,
              width,
              height,
              borderWidth: 2,
              borderColor: "rgba(255,0,0,0.8)",
              backgroundColor: "rgba(255,0,0,0.15)",
              zIndex: 999,
            }}
          />
        );
      })}
    </>
  );
};


const BowlHitboxOverlay = ({ engine }) => {
  if (!engine) return null;

  const bowlBodies = Matter.Composite.allBodies(engine.world).filter(
    (b) =>
      b.label === "BOWL_SIDE_L" ||
      b.label === "BOWL_SIDE_R" ||
      b.label === "BOWL_BOTTOM" ||
      b.label === "BOWL_SENSOR",
  );

  
  if (bowlBodies.length === 0) {
  }

  if (bowlBodies.length === 0) return null;

  return (
    <View
      style={{
        position: "absolute",
        left: 0,
        top: 0,
        width: WIDTH,
        height: HEIGHT,
        zIndex: 998,
        pointerEvents: "none", // Allow touch events to pass through
      }}
    >
      <Svg width={WIDTH} height={HEIGHT}>
        {bowlBodies.map((body, index) => {
          if (body.label === "BOWL_MAIN") {
            // Circle for main bowl
            return (
              <SvgCircle
                key={index}
                cx={body.position.x}
                cy={body.position.y}
                r={body.circleRadius}
                fill="rgba(255,0,0,0.2)"
                stroke="rgba(255,0,0,1)"
                strokeWidth="3"
              />
            );
          } else {
            // Rectangle for walls and top
            const bounds = body.bounds;
            const width = bounds.max.x - bounds.min.x;
            const height = bounds.max.y - bounds.min.y;
            return (
              <Rect
                key={index}
                x={bounds.min.x}
                y={bounds.min.y}
                width={width}
                height={height}
                fill="rgba(255,0,0,0.2)"
                stroke="rgba(255,0,0,1)"
                strokeWidth="3"
              />
            );
          }
        })}
      </Svg>
    </View>
  );
};

// Bottom-center Press button used to start charging/aiming
const ShootButton = ({ held, onLayoutRect, onPressIn, onDrag, onRelease }) => {
  const size = 96;
  const viewRef = React.useRef(null);

  const reportLayout = () => {
    if (
      viewRef.current &&
      typeof viewRef.current.measureInWindow === "function"
    ) {
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
        source={
          held
            ? require("../../assets/button_depressed.png")
            : require("../../assets/button.png")
        }
        style={{ width: size, height: size }}
        resizeMode="contain"
      />
    </View>
  );
};

/******************** Constants ********************/
const CONSTANTS = {
  TP_RADIUS: 18,
  START_X: WIDTH * 0.5, // Start center horizontally
  START_Y: HEIGHT - 24 - 56 - 50, // Above the AimPad
  MAX_AIM_LEN: 160, // px drag clamp
  MAX_IMPULSE: 0.12, // scale for Matter.applyForce (tune 0.04..0.14)
  GRAVITY_Y: 0.3, // Light gravity for nice arc
};

// Mode-specific configuration system
const getModeConstants = (gameMode) => {
  const baseConfig = freshConfig(gameMode);
  const modeConfig = makeModeConfig(gameMode);
  
  return {
    ...CONSTANTS,
    // Override with mode-specific settings
    GRAVITY_Y: baseConfig.gravityY,
    // Add mode-specific speed
    SPEED: gameMode === 'endless-plunge' ? 19 : 19, // Both modes use same speed for now
  };
};

/******************** World Factory ********************/

// Clean arena builder
const buildArena = (engine, W, H, tpBody) => {
  const world = engine.world;

  // Remove all bodies except TP
  Matter.Composite.allBodies(world).forEach((b) => {
    if (b !== tpBody) Matter.World.remove(world, b);
  });

  // Add floor, ceiling, left wall, right wall
  const wall = { isStatic: true, label: "BOUNDARY" };
  const walls = [
    Matter.Bodies.rectangle(W / 2, H + 40, W, 80, wall), // floor
    Matter.Bodies.rectangle(W / 2, -40, W, 80, wall), // ceiling
    Matter.Bodies.rectangle(-40, H / 2, 80, H, wall), // left
    Matter.Bodies.rectangle(W + 40, H / 2, 80, H, wall), // right
  ];
  Matter.World.add(world, walls);
};

// Remove any old rim that blocks the opening
const removeOldRims = (engine) => {
  const world = engine.world;
  Matter.Composite.allBodies(world).forEach((b) => {
    if (["BOWL_RIM", "BOWL", "BOWL_RING"].includes(b.label)) {
      Matter.World.remove(world, b);
    }
  });
};

// Add an open-top bowl (left + right + curved bottom + sensor)
const addOpenBowl = (engine, bx, by, r = 42) => {
  const world = engine.world;
  const thickness = 16; // wall thickness (px)
  const tilt = 0.35; // wall inward tilt (radians ~20°)

  // Material tuned to "slide in", not bounce out
  const mat = {
    isStatic: true,
    restitution: 0.05,
    friction: 0.25,
    frictionStatic: 0.9,
  };

  // Left inner wall (tilted inward)
  const left = Matter.Bodies.rectangle(
    bx - r * 0.9,
    by + r * 0.1,
    thickness,
    r * 1.6,
    {
      ...mat,
      angle: -tilt,
      label: "BOWL_SIDE_L",
    },
  );

  // Right inner wall (tilted inward)
  const right = Matter.Bodies.rectangle(
    bx + r * 0.9,
    by + r * 0.1,
    thickness,
    r * 1.6,
    {
      ...mat,
      angle: tilt,
      label: "BOWL_SIDE_R",
    },
  );

  // Curved bottom (a circle placed below the hole)
  // This gives a smooth slide; top is OPEN because we don't add any top collider.
  const bottom = Matter.Bodies.circle(bx, by + r * 0.8, r * 0.475, {
    // Moved up from 0.6 to 0.8 to bring top edge down
    ...mat,
    label: "BOWL_BOTTOM",
  });

  // Scoring sensor (no physical push) — smaller than the visual hole
  const sensor = Matter.Bodies.circle(bx, by + r * 0.2, r * 0.55, {
    isStatic: true,
    isSensor: true,
    label: "BOWL_SENSOR",
  });

  Matter.World.add(world, [left, right, bottom, sensor]);

  // Return the bowl bodies for movement control
  return { left, right, bottom, sensor, centerX: bx, centerY: by, radius: r };
};

// Enhanced collision feedback function
const triggerScreenShake = (intensity) => {
  // Simple screen shake implementation - can be enhanced with Animated.Value
  // For now, we'll just trigger haptic feedback
  try {
    if (typeof require !== 'undefined') {
      const { Haptics } = require('expo-haptics');
      if (intensity > 0.5) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      } else {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    }
  } catch (error) {
    // Haptics not available, continue silently
  }
};

// Wire up scoring when the roll enters the bowl
const wireScoring = (engine, addScoreCallback, spawnImpactParticles = null) => {
  Matter.Events.on(engine, "collisionStart", (e) => {
    e.pairs.forEach(({ bodyA, bodyB }) => {
      const a = bodyA.label,
        b = bodyB.label;
      
      // Calculate collision impact velocity
      const velocity = Math.hypot(
        bodyA.velocity.x - bodyB.velocity.x,
        bodyA.velocity.y - bodyB.velocity.y
      );
      
      // Screen shake based on impact
      if (velocity > 5) {
        triggerScreenShake(Math.min(velocity / 10, 1));
      }
      
      // Particle effects on wall hits
      if (((a === "TP" && b === "BOUNDARY") || (b === "TP" && a === "BOUNDARY")) && spawnImpactParticles) {
        const tpBody = a === "TP" ? bodyA : bodyB;
        spawnImpactParticles(tpBody.position, velocity);
      }
      
      if (
        (a === "BOWL_SENSOR" && b === "TP") ||
        (b === "BOWL_SENSOR" && a === "TP")
      ) {
        // Hide the TP sprite by setting it to off-screen
        const tpBody = a === "TP" ? bodyA : bodyB;
        Matter.Body.setPosition(tpBody, { x: -9999, y: -9999 });

        // Play water drop sound effect
        playWaterDropSound(1);

        // Add point
        addScoreCallback();
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

const setupWorld = (addScoreCallback, modeConstants = CONSTANTS) => {
  const engine = Matter.Engine.create({ enableSleeping: false });
  const world = engine.world;
  // Set initial gravity - this should be the only place gravity is set initially
  world.gravity.x = 0;
  world.gravity.y = modeConstants.GRAVITY_Y;

  // Create TP first
  const tp = createTP();

  // Build clean arena
  buildArena(engine, WIDTH, HEIGHT, tp);

  // Remove any old rim that blocks the opening
  removeOldRims(engine);

  // Add open-top toilet bowl and store the bodies for movement
  const bowlBodies = addOpenBowl(engine, WIDTH / 2, HEIGHT * 0.45, 42); // Physics colliders positioned lower than visual

  // Wire up scoring
  wireScoring(engine, addScoreCallback);

  // Add TP body to the world
  Matter.World.add(world, tp);

  
  Matter.Composite.allBodies(engine.world).forEach((b) => {
    if (
      ![
        "BOUNDARY",
        "BOWL_SIDE_L",
        "BOWL_SIDE_R",
        "BOWL_BOTTOM",
        "BOWL_SENSOR",
        "TP",
      ].includes(b.label)
    ) {
      Matter.World.remove(engine.world, b);
    }
  });

  // Ensure boundary walls are always present
  const boundaryWalls = Matter.Composite.allBodies(engine.world).filter(
    (b) => b.label === "BOUNDARY",
  );
  if (boundaryWalls.length < 4) {
    console.warn("Missing boundary walls! Rebuilding arena...");
    buildArena(engine, WIDTH, HEIGHT, tp);
  }

  return { engine, world, bodies: { tp, bowlBodies } };
};

/******************** Systems ********************/
// Fixed-step physics
const Physics = (entities, { time }) => {
  const engine = entities.physics.engine;
  Matter.Engine.update(engine, time?.delta || 16.666);
  return entities;
};

// Handle end-turn when touching ground and perk collection
const CollisionSystem = (entities, { events }) => {
  const { state, physics, gameMode } = entities;
  
  // Check for perk collection
  if (state.perks && state.perks.length > 0 && physics.bodies.tp) {
    const tpBody = physics.bodies.tp;
    const tpPos = tpBody.position;
    
    state.perks.forEach((perk, index) => {
      if (!perk.collected) {
        // Simple distance-based collision detection
        const distance = Math.sqrt(
          Math.pow(tpPos.x - perk.x, 2) + Math.pow(tpPos.y - perk.y, 2)
        );
        
        if (distance < 30) { // 30px collision radius
          // Collect the perk
          perk.collected = true;
          
          // Play perk sound
          playPerkSound();
          
          // Apply perk effect
          switch (perk.type) {
            case PERK_TYPES.CLOCK:
              if (state.onClockPerk) state.onClockPerk();
              break;
              
            case PERK_TYPES.RAINBOW:
              if (state.onRainbowPerk) state.onRainbowPerk();
              break;
              
            case PERK_TYPES.BUBBLE:
              if (state.onBubblePerk) state.onBubblePerk();
              break;
          }
          
          // Remove the perk from the array
          state.perks.splice(index, 1);
        }
      }
    });
  }
  
  // We subscribe to Matter collision events once in App; here just read flags from entities.state
  return entities;
};

// Moving toilet system
const MovingToiletSystem = (entities, { time }) => {
  const { engine, world, bodies } = entities.physics;
  const bowlBodies = bodies?.bowlBodies;

  if (!bowlBodies) {
    return entities;
  }

  // Initialize movement state if not exists
  if (!entities.toiletMovement) {
    const centerX = WIDTH / 2; // Start exactly in the center
    entities.toiletMovement = {
      direction: -1, // Start moving left first
      speed: 0.8, // pixels per frame
      leftBound: centerX - 150, // 150 pixels left from center
      rightBound: centerX + 150, // 150 pixels right from center
      currentX: centerX,
      frameCount: 0,
    };
  }

  const movement = entities.toiletMovement;

  // Apply speed multiplier for endless plunge
  const speedMul = entities.endlessRef?.current?.toiletSpeedMul || 1;
  const effSpeed = movement.speed * speedMul;

  // Update position
  movement.currentX += movement.direction * effSpeed;

  // Check bounds and reverse direction
  if (movement.currentX <= movement.leftBound) {
    movement.currentX = movement.leftBound;
    movement.direction = 1; // start moving right
  } else if (movement.currentX >= movement.rightBound) {
    movement.currentX = movement.rightBound;
    movement.direction = -1; // start moving left
  }

  // Move all bowl bodies together
  const newCenterX = movement.currentX;
  const centerY = bowlBodies.centerY;
  const r = bowlBodies.radius;

  // Update left wall position
  Matter.Body.setPosition(bowlBodies.left, {
    x: newCenterX - r * 0.9,
    y: centerY + r * 0.1,
  });

  // Update right wall position
  Matter.Body.setPosition(bowlBodies.right, {
    x: newCenterX + r * 0.9,
    y: centerY + r * 0.1,
  });

  // Update bottom position
  Matter.Body.setPosition(bowlBodies.bottom, {
    x: newCenterX,
    y: centerY + r * 0.8,
  });

  // Update sensor position
  Matter.Body.setPosition(bowlBodies.sensor, {
    x: newCenterX,
    y: centerY + r * 0.2,
  });

  // Update the stored center position
  bowlBodies.centerX = newCenterX;

  // Increment frame count
  entities.toiletMovement.frameCount++;

  return entities;
};

// === Gold Outline Perk (drop-in replacement) ===

// === Gold Outline Perk (drop-in replacement) ===
const GoldOutline = ({ size = 52 }) => {
  const rot = React.useRef(new Animated.Value(0)).current;
  const pulse = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.loop(
      Animated.timing(rot, { toValue: 1, duration: 6000, easing: Easing.linear, useNativeDriver: true })
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 750, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 900, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const rotate = rot.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "360deg"] });
  const glowScale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1.0, 1.06] });
  // Use a static opacity since native driver doesn't support opacity animations
  const glowOpacity = 0.29; // Average of 0.18 and 0.40

  const ring = size * 1.1;       // outer ring diameter (much tighter)
  const glowSize = size * 0.95;  // soft glow diameter (inside the ring)

  return (
    <>
      {/* Soft breathing gold glow (behind) - Separate Animated.View for JS driver */}
      <Animated.View
        pointerEvents="none"
        style={{
          position: "absolute",
          left: (size - glowSize) / 2,
          top: (size - glowSize) / 2,
          width: glowSize,
          height: glowSize,
          borderRadius: glowSize / 2,
          backgroundColor: "#FFD54A", // warm gold
          opacity: glowOpacity,
          transform: [{ scale: glowScale }],
        }}
      />

      {/* Solid crisp gold ring */}
      <View
        pointerEvents="none"
        style={{
          position: "absolute",
          left: (size - ring) / 2,
          top: (size - ring) / 2,
          width: ring,
          height: ring,
          borderRadius: ring / 2,
          borderWidth: 3,
          borderColor: "#FFC107", // amber
          shadowColor: "#FFD54A",  // iOS soft bloom
          shadowOpacity: 0.9,
          shadowRadius: 6,
          shadowOffset: { width: 0, height: 0 },
        }}
      />

      {/* Rotating dashed ring for subtle "flow" - Separate Animated.View for native driver */}
      <Animated.View
        pointerEvents="none"
        style={{
          position: "absolute",
          left: (size - ring) / 2,
          top: (size - ring) / 2,
          width: ring,
          height: ring,
          borderRadius: ring / 2,
          borderWidth: 2,
          borderStyle: "dashed",
          borderColor: "rgba(255, 234, 0, 0.95)", // brighter gold
          transform: [{ rotate: rotate }],
          opacity: 0.95,
        }}
      />
    </>
  );
};

const PerkSprite = ({ x, y, type, size = 52 }) => {
  let src;
  if (type === "clock") {
    src = require("../../assets/clock-perk.png");
  } else if (type === "rainbow") {
    src = require("../../assets/rainbow-perk.png");
  } else if (type === "bubble") {
    src = require("../../assets/bubble-perk.png");
  } else {
    // Fallback
    src = null;
  }

  return (
    <View style={{ position: "absolute", left: x - size / 2, top: y - size / 2, width: size, height: size }}>
      <GoldOutline size={size} />
      {src ? (
        <Image source={src} style={{ width: size, height: size }} resizeMode="contain" />
      ) : (
        <View
          style={{
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: "rgba(173, 216, 230, 0.92)",
            borderWidth: 2,
            borderColor: "rgba(255,255,255,0.95)",
          }}
        />
      )}
    </View>
  );
};

/******************** Main Component ********************/
export default function ToiletPaperToss({
  onGameComplete,
  gameMode,
  sheetRef,
}) {
  // Get mode-specific configuration
  const modeConstants = getModeConstants(gameMode);
  const gameRef = useRef(null);
  const [ready, setReady] = useState(false);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [persistentHighScore, setPersistentHighScore] = useState(0);

  const [timeLeft, setTimeLeft] = useState(0);
  const [gameOverVisible, setGameOverVisible] = useState(false);


  const [tpPos, setTpPos] = useState({ x: -9999, y: -9999 });
  const [tpVisible, setTpVisible] = useState(false);
  const [toiletPos, setToiletPos] = useState({ x: WIDTH / 2, y: HEIGHT * 0.4 });
  // Single Runner/Listener refs to prevent stacking
  const runnerRef = useRef(null);
  const afterUpdateRef = useRef(null);
  // Ref to track tpVisible state to avoid stale closures
  const tpVisibleRef = useRef(false);
  
  // Get audio state from global store
  const { sfxMuted, sfxVolume } = useAudioStore();

  // ===== Endless Plunge Round State =====
  const [epRound, setEpRound] = useState(1); // starts at Round 1
  const [epTimeLeft, setEpTimeLeft] = useState(30); // seconds remaining in current round
  const [epTarget, setEpTarget] = useState(10); // points required this round
  const [epRoundPoints, setEpRoundPoints] = useState(0);
  const [toiletSpeedMul, setToiletSpeedMul] = useState(1); // 1.0 -> 1.5 (capped)
  const [tpSkin, setTpSkin] = useState("tp.png");

  // ===== Level Up Banner State =====
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [isTimerPaused, setIsTimerPaused] = useState(false);
  const prevRound = useRef(1);
  const insets = useSafeAreaInsets();

  // ===== Time Flash State =====
  const [timeFlash, setTimeFlash] = useState(false);

  // ===== Practice Mode Customization State =====
  const [practiceCustomizationVisible, setPracticeCustomizationVisible] =
    useState(false);
  const [practiceSettings, setPracticeSettings] = useState({
    tpSkin: "tp.png",
    toiletSpeed: 5,
    gravity: 5,
    tpTrail: "none",
  });
  

  const [practiceGameStarted, setPracticeGameStarted] = useState(false);





  // Load practice settings from storage
  useEffect(() => {
    if (gameMode === "quick-flush") {
      loadPracticeConfig().then((config) => {
        setPracticeSettings(config);
      }).catch((error) => {
        // Silent fallback to defaults
      });
    }
  }, [gameMode]);

  // Note: Jingle is only loaded and played on the splash screen (HomeScreen)
  // Game modes don't need to load the jingle since it's not used here

  // Removed dynamic gravity and speed state - using constants only

  // convenience ref so physics/tickers can read latest values without stale closures
  const endlessRef = useRef({
    round: 1,
    timeLeft: 30,
    target: 10,
    roundPoints: 0,
    toiletSpeedMul: 1,
    tpSkin: "tp.png",
    running: false, // is a round currently active
  });

  // Use ref to store scoring callback
  const addScoreRef = useRef(null);
  
  // Trail renderer ref for practice mode
  const trailRendererRef = useRef(null);



  const [enginePkg] = useState(() => {
    const worldSetup = setupWorld(() => {
      if (addScoreRef.current) {
        addScoreRef.current();
      }
    }, modeConstants);

    return worldSetup;
  });
  const { engine, world, bodies } = enginePkg;

  // Simple scoring functions (no persistent storage for now)
  const addScore = () => {
    const newScore = score + 1;
    setScore(newScore);

    // Update high score if needed (session only)
    if (newScore > highScore) {
      setHighScore(newScore);
    }

    // Save high score periodically to ensure it's tracked
    if (newScore > persistentHighScore) {
      saveHighScore(newScore, gameMode)
        .then(() => {
          setPersistentHighScore(newScore);
        })
        .catch((error) => {
          console.log("Error saving high score:", error);
        });
    }

    // Endless Plunge round scoring
    if (gameMode === "endless-plunge" && endlessRef.current.running) {
      setEpRoundPoints((p) => {
        const newPoints = p + 1;
        console.log(
          "Round points updated:",
          newPoints,
          "/",
          endlessRef.current.target,
        );

        // Don't auto-advance - let the level up banner handle it
        // The banner will trigger and pause the game, then advance when complete

        return newPoints;
      });
    }
  };

  // Update the ref when addScore changes
  useEffect(() => {
    addScoreRef.current = addScore;
  }, [score, highScore]);

  // Keep endless ref in sync with state
  useEffect(() => {
    endlessRef.current.round = epRound;
  }, [epRound]);
  
  // Keep tpVisible ref in sync with state
  useEffect(() => {
    tpVisibleRef.current = tpVisible;
  }, [tpVisible]);
  useEffect(() => {
    endlessRef.current.timeLeft = epTimeLeft;
  }, [epTimeLeft]);
  useEffect(() => {
    endlessRef.current.target = epTarget;
  }, [epTarget]);
  useEffect(() => {
    endlessRef.current.roundPoints = epRoundPoints;
  }, [epRoundPoints]);
  useEffect(() => {
    // Pause toilet movement during level up celebration
    endlessRef.current.toiletSpeedMul = isTimerPaused ? 0 : toiletSpeedMul;
  }, [toiletSpeedMul, isTimerPaused]);
  useEffect(() => {
    endlessRef.current.tpSkin = tpSkin;
  }, [tpSkin]);

  // Detect when points reach target and trigger level up banner
  const levelUpTriggeredRef = useRef(false);

  useEffect(() => {
    if (
      epRoundPoints >= epTarget &&
      epRoundPoints > 0 &&
      !levelUpTriggeredRef.current
    ) {
      // Points reached target - trigger level up!
      levelUpTriggeredRef.current = true;
      setShowLevelUp(true);
    }
  }, [epRoundPoints, epTarget]);

  // Reset trigger when round changes
  useEffect(() => {
    levelUpTriggeredRef.current = false;
  }, [epRound]);

  // Show practice customization modal when Practice Mode is selected
  useEffect(() => {
    if (gameMode === "quick-flush" && !practiceGameStarted) {
      setPracticeCustomizationVisible(true);
    }
  }, [gameMode]);

  // Round math helpers
  const TP_SKINS = [
    "tp.png",
    "halloween1.png",
    "halloween2.png",
    "halloween3.png",
    "halloween4.png",
    "halloween5.png",
  ];

  function pickRandomSkin(exclude) {
    const pool = TP_SKINS.filter((s) => s !== exclude && s !== "tp.png"); // Exclude default skin from random selection
    return pool[Math.floor(Math.random() * pool.length)];
  }

  // Dynamic difficulty scaling for endless plunge mode
  function getRoundConfig(round, playerPerformance = null) {
    const baseConfig = {
      time: 30 + (round - 1) * 5,
      target: 10 + (round - 1) * 2,
      speedMul: 1.0 + Math.min((round - 1) * 0.05, 0.5)
    };
    
    // Adjust based on player performance if available
    if (playerPerformance && playerPerformance.attempts > 0) {
      const avgAccuracy = playerPerformance.hits / playerPerformance.attempts;
      
      if (avgAccuracy > 0.8) {
        // Player is doing well, increase challenge slightly
        baseConfig.speedMul *= 1.1;
        baseConfig.target += 1;
      } else if (avgAccuracy < 0.4) {
        // Player struggling, ease up slightly
        baseConfig.speedMul *= 0.9;
        baseConfig.time += 5;
      }
    }
    
    return baseConfig;
  }

  // Kick off Endless Plunge session (Round 1)
  function startEndlessPlungeSession() {

    setEpRound(1);
    const cfg = getRoundConfig(1);

    setEpTimeLeft(cfg.time);
    setEpTarget(cfg.target);
    setEpRoundPoints(0);
    setToiletSpeedMul(cfg.speedMul);
    setTpSkin(pickRandomSkin(undefined));
    endlessRef.current.running = true;
    // ensure any miss counters stop affecting endless mode; your code may already do this
  }

  // Advance to next round (after win) or end game (after fail)
  async function advanceOrEndRound(won) {
    console.log(
      "advanceOrEndRound called with won:",
      won,
      "current round:",
      epRound,
    );

    if (!won) {
      // Show your existing game over modal
      showGameOver();
      endlessRef.current.running = false;
      return;
    }

    // Next round setup
    const next = epRound + 1;
    const cfg = getRoundConfig(next);


    setEpRound(next);
    setEpTimeLeft(cfg.time);
    setEpTarget(cfg.target);
    setEpRoundPoints(0);
    setToiletSpeedMul(cfg.speedMul);
    setTpSkin((prev) => pickRandomSkin(prev));
    endlessRef.current.running = true;

    // Clear perks and trails at round end
    state.perks = [];
    state.activeTrails.rainbow = false;
    state.activeTrails.bubble = false;
    
    // Clear trail renderer
    if (trailRendererRef.current) {
      trailRendererRef.current.clear();
    }

    // Note: The level up celebration will be triggered by the useEffect that watches epRound
  }

  const showGameOver = () => {
    // Clear perks and trails when game ends
    state.perks = [];
    state.activeTrails.rainbow = false;
    state.activeTrails.bubble = false;
    
    // Clear trail renderer
    if (trailRendererRef.current) {
      trailRendererRef.current.clear();
    }
    
    // Just show the game over modal - let the buttons handle navigation
    setGameOverVisible(true);
  };

  // Use mode-specific speed
  const getAdjustedSpeed = () => {
    return modeConstants.SPEED;
  };

  // Practice Mode Customization Handlers
  const handlePracticePlay = (settings) => {

    setPracticeSettings(settings);
    setPracticeCustomizationVisible(false);
    setPracticeGameStarted(true);

    // Save practice settings to storage
    savePracticeConfig(settings).catch((error) => {
      console.log("Error saving practice config:", error);
    });

    // Apply practice settings
    setTpSkin(settings.tpSkin);

    // Update toilet speed for practice mode
    const toiletSpeedMultiplier = settings.toiletSpeed / 5; // Convert 0-10 to 0-2x multiplier
    setToiletSpeedMul(toiletSpeedMultiplier);

    // Gravity is now configurable in practice mode
  };

  const handlePracticeClose = () => {
    setPracticeCustomizationVisible(false);
    
    // Save high score for practice mode when closing
    if (gameMode === "quick-flush" && score > persistentHighScore) {
      saveHighScore(score, gameMode)
        .then(() => {
          setPersistentHighScore(score);
        })
        .catch((error) => {
          console.log("Error saving practice high score:", error);
        });
    }
    
    // Navigate back to home screen or handle as needed
    if (onGameComplete) {
      onGameComplete();
    }
  };

  // Keep last aim from AimPad
  const lastAimRef = useRef(null);

  // Bulletproof launch function
  const doLaunch = () => {
    const a = lastAimRef.current;
    if (!a) {
      return;
    }

    // Despawn any existing TP first
    if (bodies?.tp) {
      Matter.World.remove(world, bodies.tp);
      bodies.tp = null;
    }
    
    // Clear trails when launching new TP
    if (gameMode === "quick-flush" && trailRendererRef.current) {
      trailRendererRef.current.clear();
    }

    // Create a new TP body (not static initially)
    const newTp = Matter.Bodies.circle(-9999, -9999, CONSTANTS.TP_RADIUS, {
      restitution: 0.45,
      friction: 0.05,
      frictionAir: 0.012,
      density: 0.0016,
      label: "TP",
      isStatic: false, // Make sure it's not static
    });

    // Add to world
    Matter.World.add(world, newTp);
    bodies.tp = newTp;

    // spawn at the visual center of the aimpad
    const spawn = {
      x: WIDTH / 2, // Center horizontally
      y: HEIGHT - 24 - 74.25, // Bottom: 24, aimpad radius: 74.25
    };

    // Ensure spawn coordinates are valid numbers
    if (!Number.isFinite(spawn.x) || !Number.isFinite(spawn.y)) {
      return;
    }

    // Place the TP at spawn position
    Matter.Body.setPosition(newTp, spawn);
    
    // power from AimPad drag distance; add a safe minimum
    const rawP = a.power || 0;
    const p = Math.max(0.25, Math.min(1, rawP));
    const SPEED = getAdjustedSpeed(); // Use gravity-adjusted speed

    // Apply velocity - AxisAimPad provides dy where up is negative, so we need to negate it
    let vx = (a.dir?.x || 0) * SPEED * p;
    let vy = -(a.dir?.y || 0) * SPEED * p; // Negate dy so up becomes positive
    
    // Fallback: if velocity is too small, add a minimum upward velocity
    if (Math.abs(vx) < 0.1 && Math.abs(vy) < 0.1) {
      vy = -SPEED * 0.5; // Add some upward velocity
    }

    // Apply velocity immediately
    Matter.Body.setVelocity(newTp, { x: vx, y: vy });
    
    // Apply spin if available, otherwise use default angular velocity
    const spinVelocity = (a.spin || 0) * p * 0.4 || 0.2 * p;
    Matter.Body.setAngularVelocity(newTp, spinVelocity);
    
    // Make sure the body is not static and awake
    Matter.Body.setStatic(newTp, false);
    Matter.Sleeping.set(newTp, false);
    


    // FIRST-FRAME SYNC + show sprite in the SAME component that renders it
    // Force immediate sync to prevent afterUpdate from overwriting
    setTpPos(spawn);
    setTpVisible(true);

    // Reset turn state for new TP roll
    stateRef.current.turnOver = false;
    stateRef.current.missCounted = false;
  };

  const stateRef = useRef({
    aiming: false,
    dragStart: { x: CONSTANTS.START_X, y: CONSTANTS.START_Y },
    dragCurrent: { x: CONSTANTS.START_X, y: CONSTANTS.START_Y },
    turnOver: false,
    // AimPad controls
    padActive: false,
    padPower: 0,
    padOrigin: null,
    padVel: null,
    // Perk system state
    perks: [],
    activeTrails: {
      rainbow: false,
      bubble: false
    },
    // Perk callbacks
    onClockPerk: null,
    onRainbowPerk: null,
    onBubblePerk: null
  });

  // Load sounds
  useEffect(() => {
    loadSounds();
    return () => {
      if (dingSound) {
        dingSound.unloadAsync();
      }
      if (waterDropSound) {
        waterDropSound.unloadAsync();
      }
      if (perkSound) {
        perkSound.unloadAsync();
      }
    };
  }, []);

  // Load persistent high score on mount
  useEffect(() => {
    const loadHighScoreData = async () => {
      try {
        const highScoreRecord = await loadHighScore(gameMode);
        if (highScoreRecord && highScoreRecord.highScore > 0) {
          setPersistentHighScore(highScoreRecord.highScore);
          setHighScore(highScoreRecord.highScore); // Also set session high score
        }
      } catch (error) {
        console.log("Error loading high score:", error);
      }
    };
    loadHighScoreData();
  }, [gameMode]);

  // Initialize endless plunge session when game mode changes
  useEffect(() => {
    if (gameMode === "endless-plunge") {
      startEndlessPlungeSession();
    }
  }, [gameMode]);

  // Handle game completion and save high score
  const handleGameComplete = async (finalScore) => {
    try {
      if (finalScore > persistentHighScore) {
        // New high score achieved!
        await saveHighScore(finalScore, gameMode);
        setPersistentHighScore(finalScore);
        setHighScore(finalScore);
      }
    } catch (error) {
      console.log("Error saving high score:", error);
    }

    // Call the original onGameComplete callback
    if (onGameComplete) {
      onGameComplete(finalScore);
    }
  };

  // Apply mute state to loaded sounds
  useEffect(() => {
    const setupAudio = async () => {
      try {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
          staysActiveInBackground: false,
          playsInSilentModeIOS: true,
          shouldDuckAndroid: true,
          playThroughEarpieceAndroid: false,
          interruptionModeIOS: Audio.INTERRUPTION_MODE_IOS_DO_NOT_MIX,
          interruptionModeAndroid: Audio.INTERRUPTION_MODE_ANDROID_DO_NOT_MIX,
        });
      } catch {}
    };
    setupAudio();
  }, []);

  // Game timer (removed for Practice Mode - game only ends on user action)

  // Endless Plunge timer ticker (1 Hz)
  useEffect(() => {
    if (gameMode !== "endless-plunge") return;
    let id = null;

    const tick = () => {
      if (!endlessRef.current.running || isTimerPaused) return; // Don't tick when paused
      setEpTimeLeft((t) => {
        if (t <= 1) {
          // time is up -> win if target met, else lose
          // Use current state values instead of ref to avoid stale closure issues
          const won = epRoundPoints >= epTarget;
          console.log(
            "Time up! Round points:",
            epRoundPoints,
            "Target:",
            epTarget,
            "Won:",
            won,
          );
          // stop this round before advancing
          endlessRef.current.running = false;
          // small delay so UI can show 0
          setTimeout(() => advanceOrEndRound(won), 100);
          return 0;
        }
        return t - 1;
      });
    };

    id = setInterval(tick, 1000);
    return () => {
      if (id) clearInterval(id);
    };
  }, [gameMode, epRoundPoints, epTarget, isTimerPaused]); // Include dependencies to avoid stale closures

  // Collision handling: if tp hits ground, mark turn over
  useEffect(() => {
    const onCollide = (e) => {
      const pairs = e.pairs || [];
      for (const p of pairs) {
        const labels = [p.bodyA.label, p.bodyB.label];

        // Note: Bowl scoring is handled by wireScoring function, so we don't duplicate it here
        // Miss detection is now handled in afterUpdate loop for more precise control
      }
    };
    Matter.Events.on(engine, "collisionStart", onCollide);
    return () => Matter.Events.off(engine, "collisionStart", onCollide);
  }, [engine, bodies.tp, tpVisible, gameMode]);

  // Reset turn state when a new TP roll is launched
  useEffect(() => {
    if (!stateRef.current.turnOver) {
      // Reset UI state when turn is active
      stateRef.current.aiming = false;
    }
  }, [stateRef.current.turnOver]);

  // Physics runner and position mirroring
  useEffect(() => {
    const engine = enginePkg.engine;

    // Stop any previous runner and afterUpdate listener
    if (runnerRef.current) {
      try {
        Matter.Runner.stop(runnerRef.current);
      } catch {}
      runnerRef.current = null;
    }
    if (afterUpdateRef.current) {
      try {
        Matter.Events.off(engine, "afterUpdate", afterUpdateRef.current);
      } catch {}
      afterUpdateRef.current = null;
    }

    // Create and start one runner
    runnerRef.current = Matter.Runner.create();
    Matter.Runner.run(runnerRef.current, engine);

         // afterUpdate handler (preserving your existing logic)
     let updateCount = 0;
     let lastPositionUpdate = 0;
     const POSITION_UPDATE_INTERVAL = 16; // ~60fps throttling
     
     const handleAfterUpdate = (evt) => {
       updateCount++;
       
       const now = Date.now();
       if (now - lastPositionUpdate < POSITION_UPDATE_INTERVAL) {
         return;
       }
       lastPositionUpdate = now;

      const tp = bodies?.tp;
      if (!tp) {
        return;
      }
      const p = tp.position;
      
      


      // Always update tpPos if TP is visible
      if (tpVisibleRef.current) {
        setTpPos({ x: p.x, y: p.y });
        
        // Emit trail particles for practice mode
        if (gameMode === "quick-flush" && trailRendererRef.current && practiceSettings.tpTrail !== "none") {
          trailRendererRef.current.emit(p.x, p.y);
        }
        
        // Emit trail particles for endless plunge perks
        if (gameMode === "endless-plunge" && trailRendererRef.current) {
          if (state.activeTrails.rainbow || state.activeTrails.bubble) {
            // Frame rate limiting: only emit every 3 frames (20 times per second instead of 60)
            if (!state.trailFrameCounter) state.trailFrameCounter = 0;
            state.trailFrameCounter++;
            
            if (state.trailFrameCounter >= 3) {
              state.trailFrameCounter = 0;
              trailRendererRef.current.emit(p.x, p.y);
            }
          }
        }
      }

      // Hide and despawn TP if it falls below the aimpad or too far below the screen
      if (
        tpVisibleRef.current &&
        (tp.position.y > HEIGHT - 24 || tp.position.y > HEIGHT + 100)
      ) {
        setTpVisible(false);
        // Remove the TP body from the world
        if (bodies?.tp) {
          Matter.World.remove(world, bodies.tp);
          bodies.tp = null;
        }
        
        // Clear trails when TP despawns
        if (trailRendererRef.current) {
          trailRendererRef.current.clear();
        }
      }

      // Update toilet position to match bowl colliders (only if bowlBodies exists)
      const bowlBodies = bodies?.bowlBodies;
      if (bowlBodies && Number.isFinite(bowlBodies.centerX)) {
        setToiletPos({
          x: bowlBodies.centerX,
          y: HEIGHT * 0.4,
        });
      }
    };
    afterUpdateRef.current = handleAfterUpdate;
    Matter.Events.on(engine, "afterUpdate", handleAfterUpdate);

    return () => {
      if (afterUpdateRef.current) {
        try {
          Matter.Events.off(engine, "afterUpdate", afterUpdateRef.current);
        } catch {}
        afterUpdateRef.current = null;
      }
      if (runnerRef.current) {
        try {
          Matter.Runner.stop(runnerRef.current);
        } catch {}
        runnerRef.current = null;
      }
      // Do not Engine.clear here; engine is shared across renders
    };
           }, [enginePkg, practiceSettings]);

  // Set gravity once and keep it fixed
  useEffect(() => {
    if (engine) {
      engine.world.gravity.x = 0;
      // Use practice settings gravity for practice mode, otherwise use mode-specific gravity
      const gravityY = gameMode === "quick-flush" && practiceSettings.gravity 
        ? practiceSettings.gravity / 10 * 0.6 // Convert 1-10 slider to 0.06-0.6 gravity range
        : modeConstants.GRAVITY_Y;
      engine.world.gravity.y = gravityY;
    }
  }, [engine, modeConstants.GRAVITY_Y, gameMode, practiceSettings.gravity]);

           // Configure trail renderer when practice settings change
         useEffect(() => {
           if (gameMode === "quick-flush" && trailRendererRef.current && practiceSettings.tpTrail) {
             trailRendererRef.current.configure(practiceSettings.tpTrail);
           }
         }, [gameMode, practiceSettings.tpTrail]);

           // Configure trail renderer when it's first mounted
         useEffect(() => {
           if (gameMode === "quick-flush" && trailRendererRef.current) {
             trailRendererRef.current.configure(practiceSettings.tpTrail);
           }
         }, [gameMode, trailRendererRef.current]);

  // Perk system for endless plunge
  const PerkSystem = (entities, { time }) => {
    const { state, gameMode } = entities;
    
    // Only spawn perks in endless plunge mode
    if (gameMode !== 'endless-plunge') {
      return entities;
    }

    // Initialize spawn timer if not exists
    if (!state.perkSpawnTimer) {
      state.perkSpawnTimer = 0;
    }
    
    // Only spawn if no perks currently exist
    if (state.perks && state.perks.length === 0) {
      state.perkSpawnTimer += time.delta;
      
      if (state.perkSpawnTimer > (3000 + Math.random() * 2000)) { // 3-5 seconds (was 5-8)
        state.perkSpawnTimer = 0;
        
        // 60% chance to spawn a perk (was 35%)
        if (Math.random() < 0.60) {
          // Weighted spawn chance: Clock (50%), Rainbow (25%), Bubble (25%)
          const rand = Math.random();
          let randomType;
          
          if (rand < 0.50) {
            randomType = PERK_TYPES.CLOCK; // 50% chance
          } else if (rand < 0.75) {
            randomType = PERK_TYPES.RAINBOW; // 25% chance
          } else {
            randomType = PERK_TYPES.BUBBLE; // 25% chance
          }
          
          // Spawn from bottom of HUD to above aimpad, avoiding right side buttons and toilet area
          const hudBottom = 120; // Approximate bottom of HUD
          const aimpadTop = HEIGHT - 24 - 56 - 148.5; // Above aimpad (bottom - padding - aimpad size)
          const rightPadding = 80; // Keep away from right side buttons
          
          // Toilet exclusion zone (toilet is 320x320, centered at toiletPos)
          const toiletLeft = toiletPos.x - 160;
          const toiletRight = toiletPos.x + 160;
          const toiletTop = toiletPos.y - 160;
          const toiletBottom = toiletPos.y + 160;
          
          // Generate random position, but exclude toilet area
          let x, y;
          let attempts = 0;
          const maxAttempts = 50;
          
          do {
            x = Math.random() * (WIDTH - rightPadding - 40) + 20; // 20px from left, rightPadding from right
            y = hudBottom + Math.random() * (aimpadTop - hudBottom - 40); // Between HUD and aimpad
            attempts++;
          } while (
            attempts < maxAttempts && 
            x >= toiletLeft && x <= toiletRight && 
            y >= toiletTop && y <= toiletBottom
          );
          
          const newPerk = {
            id: Date.now() + Math.random(),
            type: randomType,
            x: x,
            y: y,
            collected: false
          };
          
          state.perks.push(newPerk);
        }
      }
    }
    

    
    return entities;
  };

  // Input handled via AimPad
  const systems = [Physics, CollisionSystem, MovingToiletSystem, PerkSystem];

  const [tick, setTick] = useState(0);
  useEffect(() => {
    // Force a slow UI refresh for HUD ~30fps without spamming state
    const id = setInterval(() => setTick((t) => t + 1), 33);
    setReady(true);

    return () => clearInterval(id);
  }, []);

  const state = stateRef.current;
  
  // Set up perk callbacks
  state.onClockPerk = () => {
    if (gameMode === 'endless-plunge') {
      setEpTimeLeft(prev => Math.min(prev + 5, 60)); // Cap at 60 seconds
      // Trigger green flash effect
      setTimeFlash(true);
      setTimeout(() => setTimeFlash(false), 1200); // Reset after animation completes
    }
  };
  state.onRainbowPerk = () => {
    state.activeTrails.rainbow = true;
    // Configure trail renderer for rainbow effect
    if (trailRendererRef.current) {
      trailRendererRef.current.configure('rainbow');
    }
  };
  state.onBubblePerk = () => {
    state.activeTrails.bubble = true;
    // Configure trail renderer for bubble effect
    if (trailRendererRef.current) {
      trailRendererRef.current.configure('bubbles');
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };



  return (
    <View style={styles.container}>
      {/* New GameHUD Component */}
      {gameMode === "endless-plunge" && (
        <GameHUD
          gameMode={gameMode}
          round={epRound}
          points={epRoundPoints}
          timeLeft={epTimeLeft}
          pointsRemaining={Math.max(0, epTarget - epRoundPoints)}
          totalScore={score}
          roundTarget={epTarget}
          onEndGame={() => {
            endlessRef.current.running = false;
            showGameOver();
          }}
          timeFlash={timeFlash}
        />
      )}

      {/* Level Up Banner */}
      {gameMode === "endless-plunge" && (
        <LevelUpBanner
          visible={showLevelUp}
          round={epRound + 1} // Show the round we're advancing to
          onStart={() => setIsTimerPaused(true)} // Pause timer when celebration starts
          onComplete={() => {
            setShowLevelUp(false);
            setIsTimerPaused(false); // Resume timer after celebration
            // Advance to next round after celebration
            advanceOrEndRound(true);
          }}
        />
      )}

      {/* Quick Flush HUD - simplified version */}
      {gameMode === "quick-flush" && (
        <GameHUD
          gameMode={gameMode}
          round={1}
          points={score}
          timeLeft={0}
          pointsRemaining={0}
          totalScore={score}
          roundTarget={0}
          onEndGame={() => {
            showGameOver();
          }}
        />
      )}

      {/* Game Area */}
      <ImageBackground
        source={require("../../assets/game_background_halloween.png")}
        style={styles.gameArea}
        resizeMode="stretch"
      >
        <GameEngine
          ref={gameRef}
          style={styles.game}
          systems={systems}
          entities={{
            physics: { engine, world, bodies },
            state,
            endlessRef, // Pass the ref so systems can access endless plunge state
            tp: { body: bodies.tp, renderer: null }, // TP now rendered separately
            gameMode, // Pass game mode to systems
          }}
        >
          {/* HUD removed: old trajectory indicator */}
        </GameEngine>

        {/* New overlay + AimPad */}
        <TrajectoryOverlay
          origin={state.padOrigin || { x: WIDTH / 2, y: HEIGHT - 24 - 56 }}
          vel={state.padVel || null}
          gravityY={gameMode === "quick-flush" && practiceSettings.gravity 
            ? practiceSettings.gravity / 10 * 0.6 // Convert 1-10 slider to 0.06-0.6 gravity range
            : modeConstants.GRAVITY_Y}
          visible={!!state.padActive}
          steps={26}
          dt={1 / 30}
        />

        <View
          style={{
            position: "absolute",
            bottom: 24,
            left: 0,
            right: 0,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <AxisAimPad
            size={148.5} // AxisPad takes diameter (74.25 * 2)
            deadZone={0.08} // matches your previous dead zone
            powerCurve={1.0} // linear like the Snack
            snapBackOnRelease // center stick on release (Snack behavior)
            showPowerBar // enable the built-in aim/power bar
            onVector={({ dx, dy, power, angle, origin }) => {
              // keep all your existing state logic intact
              stateRef.current.padActive = true;
              stateRef.current.padPower = power;
              stateRef.current.padOrigin = origin; // keep origin for trajectory overlay
              const PAD_SPEED = 12; // your existing constant
              stateRef.current.padVel = {
                x: dx * PAD_SPEED,
                y: dy * PAD_SPEED,
              };

              // Update lastAimRef for doLaunch
              lastAimRef.current = {
                dir: { x: dx, y: dy },
                power,
                origin,
              };
            }}
            onLaunch={({ dx, dy, power, angle, origin }) => {
              stateRef.current.padActive = false;
              // Your doLaunch() uses stateRef.current.padVel/power already,
              // so just ensure those are final before calling.
              const PAD_SPEED = 12;
              stateRef.current.padVel = {
                x: dx * PAD_SPEED,
                y: dy * PAD_SPEED,
              };
              stateRef.current.padPower = power;
              stateRef.current.padOrigin = origin;

              // Update lastAimRef for doLaunch
              lastAimRef.current = {
                dir: { x: dx, y: dy },
                power,
                origin,
              };

              doLaunch();
            }}
          />
        </View>


        {/* <StaticBodiesOverlay engine={engine} /> */}


        {/* <BowlHitboxOverlay engine={engine} /> */}

        {/* Toilet sprite (visual only, no physics) */}
        <View
          style={{
            position: "absolute",
            left: toiletPos.x - 160,
            top: toiletPos.y - 160,
            width: 320,
            height: 320,
            zIndex: 10,
          }}
        >
          <Image
            source={require("../../assets/toilet.png")}
            style={{ width: "100%", height: "100%" }}
            resizeMode="contain"
          />
        </View>


        
        {/* TP sprite — bulletproof rendering with rotation */}
        {tpVisible &&
          bodies.tp &&
          Number.isFinite(tpPos.x) &&
          Number.isFinite(tpPos.y) && (
            <Image
              source={(() => {
                const skinMap = {
                  "tp.png": require("../../assets/tp.png"),
                  "halloween1.png": require("../../assets/halloween1.png"),
                  "halloween2.png": require("../../assets/halloween2.png"),
                  "halloween3.png": require("../../assets/halloween3.png"),
                  "halloween4.png": require("../../assets/halloween4.png"),
                  "halloween5.png": require("../../assets/halloween5.png"),
                };
                return skinMap[tpSkin] || skinMap["tp.png"];
              })()}
              style={{
                position: "absolute",
                left: tpPos.x - 28,
                top: tpPos.y - 28,
                width: 56,
                height: 56,
                zIndex: 20,
                transform: [
                  { rotate: `${bodies.tp?.angle * (180 / Math.PI) || 0}deg` },
                ], // Convert radians to degrees
              }}
              resizeMode="contain"
              onLoad={() => {}}
              onError={(error) => {
                console.error("TP image failed to load:", error);
                // Only show red circle if image fails to load
              }}
            />
          )}

        {/* === Sparkly Perk Visuals (drop-in replacement) === */}
        {gameMode === "endless-plunge" && state.perks && state.perks.map((perk) => (
          <PerkSprite
            key={perk.id}
            x={perk.x}
            y={perk.y}
            type={perk.type}
            size={52}
          />
        ))}

        {/* Trail Renderer for Practice Mode */}
        {gameMode === "quick-flush" && practiceSettings.tpTrail && (
          <TrailRenderer
                               ref={(ref) => {
                     trailRendererRef.current = ref;
                   }}
            initialType={practiceSettings.tpTrail}
          />
        )}

        {/* Trail Renderer for Endless Plunge Perks */}
        {gameMode === "endless-plunge" && (
          <TrailRenderer
            ref={(ref) => {
              trailRendererRef.current = ref;
            }}
            initialType="none"
          />
        )}


        {/* {tpVisible && Number.isFinite(tpPos.x) && Number.isFinite(tpPos.y) && (
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
        )} */}
      </ImageBackground>



      {/* Practice Customization Modal */}
      <PracticeCustomizationModal
        visible={practiceCustomizationVisible}
        onPlay={handlePracticePlay}
        onClose={handlePracticeClose}
        availableTpSkins={TP_SKINS}
      />

      {/* Game Over Modal */}
      <Modal
        transparent
        animationType="fade"
        visible={gameOverVisible}
        presentationStyle="overFullScreen"
        statusBarTranslucent
        onRequestClose={() => setGameOverVisible(false)}
      >
        <GestureHandlerRootView style={{flex:1}}>
        <View style={styles.modalOverlay}>
          <View style={styles.gameOverModalCard}>
            {/* Background gradient effect */}
            <View style={styles.modalBackgroundGradient} />

            {/* Header with game mode icon */}
            <View style={styles.gameOverHeader}>
              <View style={styles.headerIconContainer}>
                <Ionicons
                  name={
                    gameMode === "quick-flush" ? "flash" : "game-controller"
                  }
                  size={14}
                  color="#3B82F6"
                />
              </View>
              <Text style={styles.gameOverTitle}>
                {gameMode === "endless-plunge"
                  ? "Plunge Complete!"
                  : "Game Complete!"}
              </Text>
            </View>

            {/* Endless Plunge specific stats */}
            {gameMode === "endless-plunge" ? (
              <View style={styles.endlessStatsSection}>
                {/* Round reached */}
                <View style={styles.statCard}>
                  <View
                    style={[
                      styles.statIconContainer,
                      {
                        backgroundColor: "rgba(59, 130, 246, 0.15)",
                        borderColor: "#3B82F6",
                      },
                    ]}
                  >
                    <Ionicons name="infinite" size={14} color="#3B82F6" />
                  </View>
                  <View style={styles.statContent}>
                    <Text style={styles.statLabel}>Round</Text>
                    <Text style={styles.statValue}>{epRound}</Text>
                  </View>
                </View>

                {/* Total score */}
                <View style={styles.statCard}>
                  <View
                    style={[
                      styles.statIconContainer,
                      {
                        backgroundColor: "rgba(245, 158, 11, 0.15)",
                        borderColor: "#F59E0B",
                      },
                    ]}
                  >
                    <Ionicons name="star" size={14} color="#F59E0B" />
                  </View>
                  <View style={styles.statContent}>
                    <Text style={styles.statLabel}>Score</Text>
                    <Text style={styles.statValue}>{score}</Text>
                  </View>
                </View>

                {/* High score */}
                <View style={styles.statCard}>
                  <View
                    style={[
                      styles.statIconContainer,
                      {
                        backgroundColor: "rgba(239, 68, 68, 0.15)",
                        borderColor: "#EF4444",
                      },
                    ]}
                  >
                    <Ionicons name="trophy" size={14} color="#EF4444" />
                  </View>
                  <View style={styles.statContent}>
                    <Text style={styles.statLabel}>Best</Text>
                    <Text style={styles.statValue}>{persistentHighScore}</Text>
                  </View>
                </View>
              </View>
            ) : (
              /* Quick Flush stats (original design) */
              <View style={styles.scoreSection}>
                <View style={styles.scoreCard}>
                  <View style={styles.scoreCardHeader}>
                    <Ionicons name="star" size={14} color="#FFD700" />
                    <Text style={styles.scoreCardTitle}>Your Score</Text>
                  </View>
                  <Text style={styles.finalScoreValue}>{score}</Text>
                </View>

                <View style={styles.scoreCard}>
                  <View style={styles.scoreCardHeader}>
                    <Ionicons name="trophy" size={14} color="#E91E63" />
                    <Text style={styles.scoreCardTitle}>Best Score</Text>
                  </View>
                  <Text style={styles.highScoreValue}>
                    {persistentHighScore}
                  </Text>
                </View>
              </View>
            )}

            {/* New record celebration */}
            {score === persistentHighScore && score > 0 && (
              <View style={styles.newRecordContainer}>
                <Ionicons name="sparkles" size={14} color="#E91E63" />
                <Text style={styles.newRecordText}>NEW RECORD!</Text>
                <Ionicons name="sparkles" size={14} color="#E91E63" />
              </View>
            )}

            {/* Action buttons */}
            <View style={styles.actionButtonsContainer}>
              <TouchableOpacity
                onPress={() => {
                  setGameOverVisible(false);
                  // Restart the same game mode
                  onGameComplete && onGameComplete(score, true);
                }}
                style={styles.playAgainButton}
              >
                <Ionicons name="play" size={14} color="#FFFFFF" />
                <Text style={styles.playAgainButtonText}>Play Again</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => {
                  setGameOverVisible(false);
                  // Go to main menu
                  onGameComplete && onGameComplete(score, false);
                }}
                style={styles.menuButton}
              >
                <Ionicons name="home" size={14} color="#4A5568" />
                <Text style={styles.menuButtonText}>Main Menu</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
              </GestureHandlerRootView>
      </Modal>
    </View>
  );
}

/******************** Styles ********************/
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },

  gameArea: {
    flex: 1,
    position: "relative",
  },
  game: {
    flex: 1,
    backgroundColor: "transparent",
  },
  shootWrap: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  shootButton: {
    width: 110,
    height: 110,
    alignItems: "center",
    justifyContent: "center",
  },
  toiletContainer: {
    position: "absolute",
    width: 270,
    height: 240,
    zIndex: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  toiletImage: {
    width: 270,
    height: 240,
  },
  titleWrap: {
    position: "absolute",
    top: 20,
    width: "100%",
    alignItems: "center",
  },
  title: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "700",
  },
  subtitle: {
    color: "#9aa3b2",
    fontSize: 12,
    marginTop: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    alignItems: "center",
    justifyContent: "center",
  },
  modalCard: {
    width: "80%",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    alignItems: "center",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 8,
    color: "#212529",
  },
  modalText: {
    fontSize: 14,
    color: "#495057",
    marginBottom: 16,
  },
  modalButton: {
    backgroundColor: "#4ECDC4",
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  modalButtonText: {
    color: "#fff",
    fontWeight: "600",
  },
  // Game Over Modal Styles
  gameOverModalCard: {
    width: "85%",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
    position: "relative",
    overflow: "hidden",
  },
  modalBackgroundGradient: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(74, 85, 104, 0.1)",
    borderRadius: 24,
  },
  gameOverHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    gap: 8,
  },
  headerIconContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(59, 130, 246, 0.2)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: "#3B82F6",
  },
  gameOverTitle: {
    fontSize: 16,
    fontWeight: "900",
    color: "#2D3748",
    textTransform: "uppercase",
    letterSpacing: 0.3,
    textShadowColor: "rgba(0, 0, 0, 0.1)",
    textShadowOffset: { width: 0.5, height: 0.5 },
    textShadowRadius: 1,
  },
  scoreSection: {
    width: "100%",
    marginBottom: 16,
    gap: 8,
  },
  endlessStatsSection: {
    width: "100%",
    marginBottom: 12,
    gap: 8,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  statCard: {
    flex: 1,
    alignItems: "center",
    backgroundColor: "#F7FAFC",
    borderRadius: 8,
    padding: 8,
    borderWidth: 2,
    borderColor: "#000000",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
    marginHorizontal: 2,
  },
  statIconContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(74, 144, 226, 0.1)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#4A90E2",
  },
  statContent: {
    alignItems: "center",
    marginTop: 4,
  },
  statLabel: {
    fontSize: 8,
    fontWeight: "700",
    color: "#4A5568",
    textTransform: "uppercase",
    letterSpacing: 0.2,
    marginBottom: 1,
  },
  statValue: {
    fontSize: 16,
    fontWeight: "900",
    color: "#2D3748",
    textShadowColor: "rgba(0, 0, 0, 0.05)",
    textShadowOffset: { width: 0.25, height: 0.25 },
    textShadowRadius: 0.5,
  },
  scoreCard: {
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    borderRadius: 10,
    padding: 12,
    borderWidth: 2,
    borderColor: "#E2E8F0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  scoreCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
    gap: 4,
  },
  scoreCardTitle: {
    fontSize: 10,
    fontWeight: "700",
    color: "#4A5568",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  finalScoreValue: {
    fontSize: 20,
    fontWeight: "900",
    color: "#4A90E2",
    textAlign: "center",
    textShadowColor: "rgba(0, 0, 0, 0.2)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  highScoreValue: {
    fontSize: 20,
    fontWeight: "900",
    color: "#E91E63",
    textAlign: "center",
    textShadowColor: "rgba(0, 0, 0, 0.2)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  newRecordContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(233, 30, 99, 0.15)",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: "#E91E63",
    gap: 4,
  },
  newRecordText: {
    color: "#E91E63",
    fontSize: 12,
    fontWeight: "800",
    textAlign: "center",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    textShadowColor: "rgba(0, 0, 0, 0.5)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  actionButtonsContainer: {
    flexDirection: "row",
    gap: 8,
    width: "100%",
  },
  playAgainButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#4ECDC4",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 2,
    borderColor: "#2d3748",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
    gap: 4,
  },
  playAgainButtonText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  menuButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 2,
    borderColor: "#4a5568",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
    gap: 4,
  },
  menuButtonText: {
    color: "#4A5568",
    fontWeight: "700",
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  // Old aim styles removed - now using imported components
});

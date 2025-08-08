// ToiletPaperToss.js
// Expo React Native + react-native-game-engine + matter-js starter for the Toilet Paper Toss game
// Features:
// - Slingshot-style aiming (drag back like Angry Birds)
// - Ping-pong charge bar (0→100→0 while holding)
// - Toilet paper (circle body) bounces off walls/ceiling/toilet
// - Touching the ground ends the turn and resets the paper
// - Tunable physics so the paper actually FLIES

import React, { useRef, useState, useEffect } from 'react';
import { StyleSheet, View, Dimensions, Text, Image, ImageBackground } from 'react-native';
import { GameEngine } from 'react-native-game-engine';
import Matter from 'matter-js';
import { Audio } from 'expo-av';
import Input from '../../systems/Input';
import ChargeSystem from '../../systems/ChargeSystem';
import AimIndicator from '../../components/AimIndicator';
import ChargeBar from '../../components/ChargeBar';

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
const Circle = ({ body, color = '#ffffff', radius = 16, imageSource }) => {
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

/******************** Constants ********************/
const CONSTANTS = {
  TP_RADIUS: 18,
  START_X: WIDTH * 0.18,
  START_Y: HEIGHT * 0.6,
  MAX_AIM_LEN: 160, // px drag clamp
  MAX_IMPULSE: 0.12, // scale for Matter.applyForce (tune 0.04..0.14)
  CHARGE_SPEED: 170, // percent per second
  GRAVITY_Y: 1.4,
};

/******************** World Factory ********************/
const setupWorld = () => {
  const engine = Matter.Engine.create({ enableSleeping: false });
  const world = engine.world;
  world.gravity.y = CONSTANTS.GRAVITY_Y;

  // Bodies
  const tp = Matter.Bodies.circle(CONSTANTS.START_X, CONSTANTS.START_Y, CONSTANTS.TP_RADIUS, {
    restitution: 0.6,
    friction: 0.2,
    frictionAir: 0.02,
    label: 'toiletPaper'
  });

  // Walls & ceiling (static, bouncy)
  const thickness = 30;
  const wallLeft = Matter.Bodies.rectangle(-thickness/2, HEIGHT/2, thickness, HEIGHT, { isStatic: true, restitution: 0.9, label: 'wall' });
  const wallRight = Matter.Bodies.rectangle(WIDTH + thickness/2, HEIGHT/2, thickness, HEIGHT, { isStatic: true, restitution: 0.9, label: 'wall' });
  const ceiling = Matter.Bodies.rectangle(WIDTH/2, -thickness/2, WIDTH, thickness, { isStatic: true, restitution: 0.9, label: 'ceiling' });

  // Ground (static, ends turn)
  const ground = Matter.Bodies.rectangle(WIDTH/2, HEIGHT + thickness/2 - 2, WIDTH, thickness, { isStatic: true, restitution: 0.0, label: 'ground' });

  // Toilet (static block to bounce off). Position matches the visual toilet image.
  const toilet = Matter.Bodies.rectangle(WIDTH * 0.5, HEIGHT * 0.65, 90, 80, { isStatic: true, restitution: 0.6, label: 'toilet' });

  Matter.World.add(world, [tp, wallLeft, wallRight, ceiling, ground, toilet]);

  return { engine, world, bodies: { tp, wallLeft, wallRight, ceiling, ground, toilet } };
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

  const [enginePkg] = useState(() => setupWorld());
  const { engine, world, bodies } = enginePkg;

  const stateRef = useRef({
    isCharging: false,
    charge: 0,
    chargeDir: 1,
    aiming: false,
    dragStart: { x: CONSTANTS.START_X, y: CONSTANTS.START_Y },
    dragCurrent: { x: CONSTANTS.START_X, y: CONSTANTS.START_Y },
    turnOver: false,
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
          playDingSound();
          // Reset position after scoring
          Matter.Body.setVelocity(bodies.tp, { x: 0, y: 0 });
          Matter.Body.setAngularVelocity(bodies.tp, 0);
          Matter.Body.setPosition(bodies.tp, { x: CONSTANTS.START_X, y: CONSTANTS.START_Y });
          stateRef.current.isCharging = false;
          stateRef.current.aiming = false;
          stateRef.current.charge = 0;
          stateRef.current.chargeDir = 1;
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
        // Freeze & teleport back
        Matter.Body.setVelocity(bodies.tp, { x: 0, y: 0 });
        Matter.Body.setAngularVelocity(bodies.tp, 0);
        Matter.Body.setPosition(bodies.tp, { x: CONSTANTS.START_X, y: CONSTANTS.START_Y });
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

  // Input system now handles all touch events
  const systems = [Input, ChargeSystem, Physics, CollisionSystem];

  const [tick, setTick] = useState(0);
  useEffect(() => {
    // Force a slow UI refresh for HUD ~30fps without spamming state
    const id = setInterval(() => setTick((t) => t + 1), 33);
    setReady(true);
    return () => clearInterval(id);
  }, []);

  const state = stateRef.current;
  const aimOrigin = { x: bodies.tp.position.x, y: bodies.tp.position.y };
  const aimTarget = state.dragCurrent;

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <View style={styles.container}>
      {/* Game UI */}
      <View style={styles.gameUI}>
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

      {/* Game Area */}
      <ImageBackground 
        source={require('../../assets/game_background.png')} 
        style={styles.gameArea}
        resizeMode="stretch"
      >
        {/* Toilet Image */}
        <View style={[styles.toiletContainer, { left: WIDTH * 0.5 - 135, bottom: HEIGHT * 0.35 }]}>
          <Image 
            source={require('../../assets/toilet.png')} 
            style={styles.toiletImage}
            resizeMode="contain"
          />
        </View>

        <GameEngine
          ref={gameRef}
          style={styles.game}
          systems={systems}
          entities={{
            physics: { engine, world },
            state,

            tp: { 
              body: bodies.tp, 
              renderer: (p) => <Circle {...p} color="#fff" radius={CONSTANTS.TP_RADIUS} imageSource={require('../../assets/tp.png')} /> 
            },
            left: { body: bodies.wallLeft, renderer: null },
            right: { body: bodies.wallRight, renderer: null },
            ceiling: { body: bodies.ceiling, renderer: null },
            ground: { body: bodies.ground, renderer: null },
            toilet: { body: bodies.toilet, renderer: null },
          }}
        >
          {/* HUD */}
          <ChargeBar value={state.charge} visible={state.isCharging} />
          <AimIndicator origin={aimOrigin} target={aimTarget} visible={state.aiming} />
        </GameEngine>
      </ImageBackground>
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
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 20,
    paddingTop: 80,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  scoreContainer: {
    alignItems: 'center',
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
  timeContainer: {
    alignItems: 'center',
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
  // Old aim and charge styles removed - now using imported components
});

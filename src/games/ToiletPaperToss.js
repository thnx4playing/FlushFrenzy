import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  PanResponder,
  Image,
} from 'react-native';

const { width, height } = Dimensions.get('window');

export default function ToiletPaperToss({ onGameComplete, gameMode }) {
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(gameMode === 'quick-flush' ? 60 : 0);
  const [gameActive, setGameActive] = useState(false);
  const [misses, setMisses] = useState(0);
  const [tosses, setTosses] = useState([]);
  const [nextTossId, setNextTossId] = useState(0);

  // Animated values
  const paperPosition = useRef(new Animated.ValueXY({ 
    x: width / 2 - 30, 
    y: height - 150
  })).current;
  const paperScale = useRef(new Animated.Value(1)).current;
  const toiletPosition = { x: width / 2 - 60, y: height / 2 - 100 };

  // Game mode specific logic
  const isQuickFlush = gameMode === 'quick-flush';
  const isEndlessPlunge = gameMode === 'endless-plunge';
  const maxMisses = 3;

  useEffect(() => {
    let timer;
    if (gameActive && isQuickFlush && timeLeft > 0) {
      timer = setTimeout(() => {
        setTimeLeft(timeLeft - 1);
      }, 1000);
    } else if (isQuickFlush && timeLeft === 0) {
      endGame();
    } else if (isEndlessPlunge && misses >= maxMisses) {
      endGame();
    }
    return () => clearTimeout(timer);
  }, [gameActive, timeLeft, misses, isQuickFlush, isEndlessPlunge]);

  useEffect(() => {
    if (gameMode) {
      setGameActive(true);
      setScore(0);
      setMisses(0);
      setTosses([]);
      setNextTossId(0);
      if (isQuickFlush) {
        setTimeLeft(60);
      }
    }
  }, [gameMode]);

  const endGame = () => {
    setGameActive(false);
    onGameComplete(score);
  };

  const calculateScore = (distance) => {
    const centerDistance = Math.abs(distance);
    if (centerDistance < 25) return 100; // Center hit
    if (centerDistance < 50) return 50;  // Outer ring
    return 0; // Miss
  };

  const createToss = (startX, startY, velocityX, velocityY) => {
    const tossId = nextTossId;
    setNextTossId(nextTossId + 1);
    
    const toss = {
      id: tossId,
      x: startX,
      y: startY,
      velocityX,
      velocityY,
      gravity: 0.8,
      time: 0,
    };
    
    setTosses(prev => [...prev, toss]);
    
    // Animate the toss
    const animateToss = () => {
      toss.time += 0.016; // 60fps
      toss.x += toss.velocityX * 0.016;
      toss.y += toss.velocityY * 0.016;
      toss.velocityY += toss.gravity;
      
      // Check if hit toilet (adjusted for new toilet position)
      const distanceFromCenter = Math.sqrt(
        Math.pow(toss.x - (toiletPosition.x + 60), 2) + 
        Math.pow(toss.y - (toiletPosition.y + 80), 2)
      );
      
      if (distanceFromCenter < 50) {
        const points = calculateScore(distanceFromCenter);
        if (points > 0) {
          setScore(prev => prev + points);
        } else {
          setMisses(prev => prev + 1);
        }
        setTosses(prev => prev.filter(t => t.id !== tossId));
        return;
      }
      
      // Check if out of bounds
      if (toss.y > height || toss.x < 0 || toss.x > width) {
        setMisses(prev => prev + 1);
        setTosses(prev => prev.filter(t => t.id !== tossId));
        return;
      }
      
      requestAnimationFrame(animateToss);
    };
    
    requestAnimationFrame(animateToss);
  };

  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderGrant: () => {
      paperScale.setValue(0.8);
    },
    onPanResponderMove: (evt, gestureState) => {
      const newX = Math.max(0, Math.min(width - 60, gestureState.moveX - 30));
      const newY = Math.max(height - 200, Math.min(height - 100, gestureState.moveY - 30));
      paperPosition.setValue({ x: newX, y: newY });
    },
    onPanResponderRelease: (evt, gestureState) => {
      if (!gameActive) return;
      
      paperScale.setValue(1);
      
      // Calculate velocity based on gesture
      const velocityX = gestureState.vx * 1000;
      const velocityY = gestureState.vy * 1000;
      
      // Create toss
      createToss(
        paperPosition.x._value + 30,
        paperPosition.y._value + 30,
        velocityX,
        velocityY
      );
      
      // Reset paper position
      Animated.spring(paperPosition, {
        toValue: { x: width / 2 - 30, y: height - 150 },
        useNativeDriver: false,
      }).start();
    },
  });

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
        
        {isQuickFlush && (
          <View style={styles.timeContainer}>
            <Text style={styles.timeLabel}>Time</Text>
            <Text style={styles.timeValue}>{formatTime(timeLeft)}</Text>
          </View>
        )}
        
        {isEndlessPlunge && (
          <View style={styles.missesContainer}>
            <Text style={styles.missesLabel}>Misses</Text>
            <Text style={styles.missesValue}>{misses}/{maxMisses}</Text>
          </View>
        )}
      </View>

      {/* Game Area */}
      <View style={styles.gameArea}>
        {/* Tiled Background */}
        <View style={styles.background}>
          {/* Wall tiles */}
          <View style={styles.wallTiles} />
          
          {/* Floor tiles */}
          <View style={styles.floorTiles} />
        </View>

        {/* Rubber Duck - positioned on floor by toilet */}
        <View style={styles.rubberDuck}>
          <View style={styles.duckBody}>
            <View style={styles.duckBeak} />
            <View style={styles.duckEye} />
            <View style={styles.duckWing} />
          </View>
        </View>

        {/* Plunger - positioned on floor by toilet */}
        <View style={styles.plunger}>
          <View style={styles.plungerHandle} />
          <View style={styles.plungerCup} />
        </View>

        {/* Expressive Toilet */}
        <View style={[styles.toilet, { left: toiletPosition.x, top: toiletPosition.y }]}>
          {/* Toilet Tank */}
          <View style={styles.toiletTank}>
            {/* Flush Handle */}
            <View style={styles.flushHandle} />
            
            {/* Face on the lid */}
            <View style={styles.toiletFace}>
              {/* Eyes */}
              <View style={styles.eyeContainer}>
                <View style={styles.eye}>
                  <View style={styles.pupil} />
                </View>
                <View style={styles.eye}>
                  <View style={styles.pupil} />
                </View>
              </View>
              
              {/* Eyebrows */}
              <View style={styles.eyebrowContainer}>
                <View style={styles.eyebrow} />
                <View style={styles.eyebrow} />
              </View>
              
              {/* Smile */}
              <View style={styles.smile} />
              
              {/* Lid bolts */}
              <View style={styles.boltContainer}>
                <View style={styles.bolt} />
                <View style={styles.bolt} />
              </View>
            </View>
          </View>
          
          {/* Toilet Bowl */}
          <View style={styles.toiletBowl}>
            <View style={styles.bowlInterior} />
          </View>
          
          {/* Scoring rings */}
          <View style={styles.scoringRings}>
            <View style={styles.outerRing} />
            <View style={styles.innerRing} />
          </View>
        </View>

        {/* Flying toilet paper */}
        {tosses.map((toss) => (
          <View
            key={toss.id}
            style={[
              styles.flyingPaper,
              {
                left: toss.x,
                top: toss.y,
              },
            ]}
          >
            <View style={styles.paperRoll}>
              {/* Main white body */}
              <View style={styles.paperBody} />
              {/* Brown cardboard core */}
              <View style={styles.paperCore} />
              {/* Shading on right side */}
              <View style={styles.paperShading} />
              {/* Highlight on top */}
              <View style={styles.paperHighlight} />
              {/* Peeled flap */}
              <View style={styles.paperFlap} />
            </View>
          </View>
        ))}

        {/* Draggable toilet paper */}
        <Animated.View
          style={[
            styles.paper,
            {
              transform: [
                { translateX: paperPosition.x },
                { translateY: paperPosition.y },
                { scale: paperScale },
              ],
            },
          ]}
          {...panResponder.panHandlers}
        >
          <View style={styles.paperRoll}>
            {/* Main white body */}
            <View style={styles.paperBody} />
            {/* Brown cardboard core */}
            <View style={styles.paperCore} />
            {/* Shading on right side */}
            <View style={styles.paperShading} />
            {/* Highlight on top */}
            <View style={styles.paperHighlight} />
            {/* Peeled flap */}
            <View style={styles.paperFlap} />
          </View>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#E8F4FD',
  },
  gameUI: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 20,
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
  background: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  wallTiles: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: height * 0.6,
    backgroundColor: '#87CEEB', // Light blue tiles
    opacity: 0.8,
  },
  floorTiles: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: height * 0.4,
    backgroundColor: '#FFB347', // Orange-yellow tiles
    opacity: 0.8,
  },
  rubberDuck: {
    position: 'absolute',
    bottom: 60,
    left: 40,
    zIndex: 10,
  },
  plunger: {
    position: 'absolute',
    bottom: 50,
    right: 50,
    zIndex: 10,
  },
  toilet: {
    position: 'absolute',
    width: 120,
    height: 160,
    zIndex: 5,
  },
  toiletTank: {
    position: 'absolute',
    top: 0,
    left: 20,
    width: 80,
    height: 60,
    backgroundColor: '#fff',
    borderRadius: 15,
    borderWidth: 3,
    borderColor: '#ddd',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  flushHandle: {
    position: 'absolute',
    left: -8,
    top: 15,
    width: 16,
    height: 30,
    backgroundColor: '#888',
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#666',
  },
  toiletFace: {
    position: 'absolute',
    top: 5,
    left: 5,
    right: 5,
    bottom: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  eyeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: 5,
  },
  eye: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pupil: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#fff',
  },
  eyebrowContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: 3,
  },
  eyebrow: {
    width: 12,
    height: 3,
    backgroundColor: '#000',
    borderRadius: 2,
  },
  smile: {
    width: 20,
    height: 10,
    borderBottomWidth: 3,
    borderBottomColor: '#000',
    borderRadius: 20,
  },
  boltContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    position: 'absolute',
    top: -5,
  },
  bolt: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#87CEEB',
    borderWidth: 1,
    borderColor: '#fff',
  },
  toiletBowl: {
    position: 'absolute',
    top: 60,
    left: 15,
    width: 90,
    height: 80,
    backgroundColor: '#fff',
    borderRadius: 45,
    borderWidth: 3,
    borderColor: '#ddd',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  bowlInterior: {
    position: 'absolute',
    top: 5,
    left: 5,
    right: 5,
    bottom: 5,
    backgroundColor: '#1E3A8A', // Dark blue interior
    borderRadius: 40,
  },
  scoringRings: {
    position: 'absolute',
    top: 60,
    left: 15,
    width: 90,
    height: 80,
  },
  outerRing: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderWidth: 3,
    borderColor: '#FFD700',
    borderRadius: 45,
    opacity: 0.6,
  },
  innerRing: {
    position: 'absolute',
    top: 15,
    left: 15,
    right: 15,
    bottom: 15,
    borderWidth: 3,
    borderColor: '#FF6B6B',
    borderRadius: 30,
    opacity: 0.8,
  },
  paper: {
    position: 'absolute',
    width: 60,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  flyingPaper: {
    position: 'absolute',
    width: 60,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
  },
  paperEmoji: {
    fontSize: 40,
  },
  paperRoll: {
    width: 60,
    height: 60,
    position: 'relative',
  },
  paperBody: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#fff',
    borderRadius: 30,
    borderWidth: 2,
    borderColor: '#000',
  },
  paperCore: {
    position: 'absolute',
    top: 10,
    left: 10,
    right: 10,
    bottom: 10,
    backgroundColor: '#8B4513', // Brown cardboard core
    borderRadius: 25,
    borderWidth: 2,
    borderColor: '#000',
  },
  paperShading: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    width: 10,
    backgroundColor: '#888', // Shading
    borderRadius: 5,
  },
  paperHighlight: {
    position: 'absolute',
    top: -5,
    left: 20,
    width: 20,
    height: 10,
    backgroundColor: '#fff', // Highlight
    borderRadius: 10,
  },
  paperFlap: {
    position: 'absolute',
    top: 20,
    left: 10,
    width: 40,
    height: 10,
    backgroundColor: '#000', // Black outline
    borderRadius: 5,
    borderWidth: 2,
    borderColor: '#fff',
  },
  duckBody: {
    width: 50,
    height: 45,
    backgroundColor: '#FFD700', // Bright yellow
    borderRadius: 25,
    borderWidth: 2,
    borderColor: '#000',
    position: 'relative',
  },
  duckBeak: {
    position: 'absolute',
    top: 8,
    left: 20,
    width: 12,
    height: 8,
    backgroundColor: '#FF8C00', // Orange beak
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#000',
  },
  duckEye: {
    position: 'absolute',
    top: 12,
    left: 15,
    width: 10,
    height: 10,
    backgroundColor: '#000',
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#fff',
  },
  duckWing: {
    position: 'absolute',
    top: 18,
    right: 5,
    width: 18,
    height: 15,
    backgroundColor: '#FFD700',
    borderRadius: 9,
    borderWidth: 1,
    borderColor: '#000',
    transform: [{ rotate: '-20deg' }],
  },
  plungerHandle: {
    position: 'absolute',
    top: 0,
    left: 15,
    width: 12,
    height: 35,
    backgroundColor: '#8B4513', // Wooden brown
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#654321',
  },
  plungerCup: {
    position: 'absolute',
    top: 35,
    left: 8,
    width: 26,
    height: 15,
    backgroundColor: '#FF0000', // Vibrant red
    borderRadius: 13,
    borderWidth: 2,
    borderColor: '#000',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
});

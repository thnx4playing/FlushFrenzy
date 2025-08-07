import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  PanResponder,
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
    y: height - 150 // Moved up to be more accessible
  })).current;
  const paperScale = useRef(new Animated.Value(1)).current;
  const toiletPosition = { x: width / 2 - 50, y: 120 };

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
    if (centerDistance < 30) return 100; // Center hit
    if (centerDistance < 60) return 50;  // Outer ring
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
      
      // Check if hit toilet
      const distanceFromCenter = Math.sqrt(
        Math.pow(toss.x - (toiletPosition.x + 50), 2) + 
        Math.pow(toss.y - (toiletPosition.y + 40), 2)
      );
      
      if (distanceFromCenter < 60) {
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
        {/* Background */}
        <View style={styles.background}>
          {/* Bathroom tiles */}
          <View style={styles.tiles} />
          
          {/* Rubber duck */}
          <View style={styles.rubberDuck}>
            <Text style={styles.duckEmoji}>🦆</Text>
          </View>
          
          {/* Plunger scoreboard */}
          <View style={styles.plungerScoreboard}>
            <Text style={styles.plungerEmoji}>🪠</Text>
          </View>
        </View>

        {/* Toilet */}
        <View style={[styles.toilet, { left: toiletPosition.x, top: toiletPosition.y }]}>
          <View style={styles.toiletBody}>
            <View style={styles.toiletSeat}>
              <View style={styles.toiletSeatInner} />
            </View>
            <View style={styles.toiletBowl}>
              <View style={styles.toiletWater} />
            </View>
            <View style={styles.toiletTank} />
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
            <Text style={styles.paperEmoji}>🧻</Text>
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
          <Text style={styles.paperEmoji}>🧻</Text>
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
  tiles: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#F8F9FA',
    opacity: 0.3,
  },
  rubberDuck: {
    position: 'absolute',
    top: 50,
    right: 30,
  },
  duckEmoji: {
    fontSize: 40,
  },
  plungerScoreboard: {
    position: 'absolute',
    top: 100,
    right: 30,
  },
  plungerEmoji: {
    fontSize: 40,
  },
  toilet: {
    position: 'absolute',
    width: 100,
    height: 120,
  },
  toiletBody: {
    position: 'relative',
    width: 100,
    height: 120,
  },
  toiletSeat: {
    position: 'absolute',
    top: 0,
    left: 10,
    width: 80,
    height: 20,
    backgroundColor: '#8B4513',
    borderRadius: 10,
    borderWidth: 3,
    borderColor: '#654321',
  },
  toiletSeatInner: {
    position: 'absolute',
    top: 3,
    left: 3,
    right: 3,
    bottom: 3,
    backgroundColor: '#A0522D',
    borderRadius: 7,
  },
  toiletBowl: {
    position: 'absolute',
    top: 20,
    left: 15,
    width: 70,
    height: 60,
    backgroundColor: '#fff',
    borderRadius: 35,
    borderWidth: 3,
    borderColor: '#ddd',
  },
  toiletWater: {
    position: 'absolute',
    top: 5,
    left: 5,
    right: 5,
    bottom: 5,
    backgroundColor: '#87CEEB',
    borderRadius: 30,
    opacity: 0.7,
  },
  toiletTank: {
    position: 'absolute',
    top: 80,
    left: 20,
    width: 60,
    height: 40,
    backgroundColor: '#fff',
    borderRadius: 10,
    borderWidth: 3,
    borderColor: '#ddd',
  },
  scoringRings: {
    position: 'absolute',
    top: 20,
    left: 15,
    width: 70,
    height: 60,
  },
  outerRing: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderWidth: 2,
    borderColor: '#FFD700',
    borderRadius: 35,
    opacity: 0.6,
  },
  innerRing: {
    position: 'absolute',
    top: 15,
    left: 15,
    right: 15,
    bottom: 15,
    borderWidth: 2,
    borderColor: '#FF6B6B',
    borderRadius: 20,
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
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
  },
  paperEmoji: {
    fontSize: 40,
  },
});

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
  ImageBackground,
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
    y: height - 120
  })).current;
  const paperScale = useRef(new Animated.Value(1)).current;
  
  // Toilet position (center of screen, on floor)
  const toiletPosition = { x: width / 2 - 60, y: height - 170 };

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

  const calculateScore = (hitType) => {
    if (hitType === 'direct') return 3;
    if (hitType === 'bounce') return 1;
    return 0;
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
      gravity: 0.3,
      time: 0,
      hasHitWall: false,
      hasHitToilet: false,
      bounces: 0,
      maxBounces: 3,
    };
    
    setTosses(prev => [...prev, toss]);
    
    // Animate the toss
    const animateToss = () => {
      toss.time += 0.016; // 60fps
      
      // Apply gravity
      toss.velocityY += toss.gravity;
      
      // Update position with current velocity
      const nextX = toss.x + toss.velocityX * 0.016;
      const nextY = toss.y + toss.velocityY * 0.016;
      
      // Check wall collisions
      if (nextX <= 0 || nextX >= width - 60) {
        toss.velocityX = -toss.velocityX * 0.7; // Bounce off side walls
        toss.bounces++;
      }
      
      if (nextY <= 0) {
        toss.velocityY = Math.abs(toss.velocityY * 0.7); // Bounce off ceiling
        toss.bounces++;
      }
      
      if (nextY >= height - 60) {
        toss.velocityY = -Math.abs(toss.velocityY * 0.7); // Bounce off floor
        toss.bounces++;
      }
      
      // Apply position updates after bounce checks
      toss.x = Math.max(0, Math.min(width - 60, nextX));
      toss.y = Math.max(0, Math.min(height - 60, nextY));
      
      // Check if hit toilet bowl (direct hit)
      const toiletCenterX = width / 2;
      const toiletCenterY = height * 0.55; // Matches the bottom: height * 0.45 position
      
      const distanceFromToilet = Math.sqrt(
        Math.pow(toss.x - toiletCenterX, 2) + 
        Math.pow(toss.y - toiletCenterY, 2)
      );
      
      if (distanceFromToilet < 90 && !toss.hasHitToilet && toss.y > height * 0.45 && toss.y < height * 0.65) {
        const points = calculateScore('direct');
        if (points > 0) {
          setScore(prev => prev + points);
        }
        setTosses(prev => prev.filter(t => t.id !== tossId));
        return;
      }
      
      // Check if hit toilet back wall (bounce)
      if (toss.y > height * 0.45 && toss.y < height * 0.55 && 
          Math.abs(toss.x - toiletCenterX) < 90 && 
          !toss.hasHitWall && toss.bounces < toss.maxBounces) {
        toss.hasHitWall = true;
        toss.bounces++;
        toss.velocityX = -toss.velocityX * 0.8; // Bounce back
        toss.velocityY = -Math.abs(toss.velocityY * 0.6); // Bounce upward
      }
      
      // Check if bounced into toilet
      if (toss.hasHitWall && distanceFromToilet < 90 && !toss.hasHitToilet && toss.y > height * 0.45 && toss.y < height * 0.65) {
        toss.hasHitToilet = true;
        const points = calculateScore('bounce');
        if (points > 0) {
          setScore(prev => prev + points);
        }
        setTosses(prev => prev.filter(t => t.id !== tossId));
        return;
      }
      
      // Check wall bounces (left and right walls)
      if (toss.x <= 0 || toss.x >= width - 60) {
        if (toss.bounces < toss.maxBounces) {
          toss.bounces++;
          toss.velocityX = -toss.velocityX * 0.8;
        } else {
          setMisses(prev => prev + 1);
          setTosses(prev => prev.filter(t => t.id !== tossId));
          return;
        }
      }
      
      // Check ceiling bounce
      if (toss.y <= 0) {
        if (toss.bounces < toss.maxBounces) {
          toss.bounces++;
          toss.velocityY = -toss.velocityY * 0.8;
        } else {
          setMisses(prev => prev + 1);
          setTosses(prev => prev.filter(t => t.id !== tossId));
          return;
        }
      }
      
      // Check if out of bounds or hit floor
      if (toss.y > height - 50 || toss.x < -60 || toss.x > width) {
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
      // Allow movement anywhere on screen
      const newX = Math.max(0, Math.min(width - 60, gestureState.moveX - 30));
      const newY = Math.max(0, Math.min(height - 60, gestureState.moveY - 30));
      paperPosition.setValue({ x: newX, y: newY });
    },
    onPanResponderRelease: (evt, gestureState) => {
      if (!gameActive) return;
      
      paperScale.setValue(1);
      
      // Calculate velocity based on gesture (increased for better throwing)
      const velocityX = gestureState.vx * 2500;
      const velocityY = gestureState.vy * 2500;
      
      // Create toss
      createToss(
        paperPosition.x._value + 30,
        paperPosition.y._value + 30,
        velocityX,
        velocityY
      );
      
      // Reset paper position
      Animated.spring(paperPosition, {
        toValue: { x: width / 2 - 30, y: height - 120 },
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

      {/* Game Area - New Background */}
      <ImageBackground 
        source={require('../../assets/game_background.png')} 
        style={styles.gameArea}
        resizeMode="stretch"
      >
        {/* Toilet positioned further back in room */}
        <View style={[styles.toiletContainer, { left: width / 2 - 90, bottom: height * 0.45 }]}>
          <Image 
            source={require('../../assets/toilet.png')} 
            style={styles.toiletImage}
            resizeMode="contain"
          />
        </View>

        {/* Flying toilet paper */}
        {tosses.map((toss) => (
          <Image
            key={toss.id}
            source={require('../../assets/tp.png')}
            style={[
              styles.flyingPaper,
              {
                left: toss.x,
                top: toss.y,
                transform: [{ rotate: `${toss.time * 360}deg` }],
              },
            ]}
            resizeMode="contain"
          />
        ))}

        {/* Draggable toilet paper */}
        <Animated.Image
          source={require('../../assets/tp.png')}
          style={[
            styles.paper,
            {
              transform: [
                { translateX: paperPosition.x },
                { translateY: paperPosition.y },
                { scale: paperScale },
                { rotate: '0deg' },
              ],
            },
          ]}
          resizeMode="contain"
          {...panResponder.panHandlers}
        />
      </ImageBackground>
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
    paddingTop: 60,
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
  toiletContainer: {
    position: 'absolute',
    width: 180,
    height: 180,
    zIndex: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toiletImage: {
    width: 180,
    height: 180,
  },
  paper: {
    position: 'absolute',
    width: 80,
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  flyingPaper: {
    position: 'absolute',
    width: 80,
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
  },
});

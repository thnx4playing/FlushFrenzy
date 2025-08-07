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
    y: height - 200
  })).current;
  const paperScale = useRef(new Animated.Value(1)).current;
  
  // Toilet position (center of back wall)
  const toiletPosition = { x: width / 2 - 60, y: height * 0.3 };

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
      toss.x += toss.velocityX * 0.016;
      toss.y += toss.velocityY * 0.016;
      toss.velocityY += toss.gravity;
      
      // Check if hit toilet bowl (direct hit)
      const distanceFromToilet = Math.sqrt(
        Math.pow(toss.x - (toiletPosition.x + 60), 2) + 
        Math.pow(toss.y - (toiletPosition.y + 80), 2)
      );
      
      if (distanceFromToilet < 50 && !toss.hasHitToilet) {
        const points = calculateScore('direct');
        if (points > 0) {
          setScore(prev => prev + points);
        }
        setTosses(prev => prev.filter(t => t.id !== tossId));
        return;
      }
      
      // Check if hit toilet back wall (bounce)
      if (toss.y < toiletPosition.y + 100 && toss.y > toiletPosition.y + 60 && 
          toss.x > toiletPosition.x + 20 && toss.x < toiletPosition.x + 100 && 
          !toss.hasHitWall && toss.bounces < toss.maxBounces) {
        toss.hasHitWall = true;
        toss.bounces++;
        toss.velocityX = -toss.velocityX * 0.8; // Bounce back
        toss.velocityY = toss.velocityY * 0.6;
      }
      
      // Check if bounced into toilet
      if (toss.hasHitWall && distanceFromToilet < 50 && !toss.hasHitToilet) {
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
      const newX = Math.max(0, Math.min(width - 60, gestureState.moveX - 30));
      const newY = Math.max(height - 250, Math.min(height - 100, gestureState.moveY - 30));
      paperPosition.setValue({ x: newX, y: newY });
    },
    onPanResponderRelease: (evt, gestureState) => {
      if (!gameActive) return;
      
      paperScale.setValue(1);
      
      // Calculate velocity based on gesture (increased for longer throws)
      const velocityX = gestureState.vx * 1200;
      const velocityY = gestureState.vy * 1200;
      
      // Create toss
      createToss(
        paperPosition.x._value + 30,
        paperPosition.y._value + 30,
        velocityX,
        velocityY
      );
      
      // Reset paper position
      Animated.spring(paperPosition, {
        toValue: { x: width / 2 - 30, y: height - 200 },
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
        source={require('../../assets/background_.png')} 
        style={styles.gameArea}
        resizeMode="stretch"
      >
        {/* Toilet at the back wall */}
        <View style={[styles.toiletContainer, { left: toiletPosition.x, top: toiletPosition.y }]}>
          <Image 
            source={require('../../assets/icon.png')} 
            style={styles.toiletImage}
            resizeMode="contain"
          />
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
              <View style={styles.paperBody} />
              <View style={styles.paperCore} />
              <View style={styles.paperShading} />
              <View style={styles.paperHighlight} />
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
            <View style={styles.paperBody} />
            <View style={styles.paperCore} />
            <View style={styles.paperShading} />
            <View style={styles.paperHighlight} />
            <View style={styles.paperFlap} />
          </View>
        </Animated.View>
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
    width: 120,
    height: 120,
    zIndex: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toiletImage: {
    width: 120,
    height: 120,
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
    backgroundColor: '#8B4513',
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
    backgroundColor: '#888',
    borderRadius: 5,
  },
  paperHighlight: {
    position: 'absolute',
    top: -5,
    left: 20,
    width: 20,
    height: 10,
    backgroundColor: '#fff',
    borderRadius: 10,
  },
  paperFlap: {
    position: 'absolute',
    top: 20,
    left: 10,
    width: 40,
    height: 10,
    backgroundColor: '#000',
    borderRadius: 5,
    borderWidth: 2,
    borderColor: '#fff',
  },
});

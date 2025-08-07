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
    y: height - 250
  })).current;
  const paperScale = useRef(new Animated.Value(1)).current;
  const toiletPosition = { x: width / 2 - 80, y: height / 2 - 120 };

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
      
      // Check if hit toilet (adjusted for new toilet position and size)
      const distanceFromCenter = Math.sqrt(
        Math.pow(toss.x - (toiletPosition.x + 80), 2) + 
        Math.pow(toss.y - (toiletPosition.y + 140), 2)
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
      const newY = Math.max(height - 300, Math.min(height - 150, gestureState.moveY - 30));
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
        toValue: { x: width / 2 - 30, y: height - 250 },
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
      <ImageBackground 
        source={require('../../assets/wall.png')} 
        style={styles.gameArea}
        resizeMode="stretch"
      >

        {/* Rubber Duck Asset */}
        <View style={styles.rubberDuck}>
          <Image 
            source={require('../../assets/duck.png')} 
            style={styles.duckImage}
            resizeMode="contain"
          />
        </View>

        {/* Plunger Asset */}
        <View style={styles.plunger}>
          <Image 
            source={require('../../assets/plunger.png')} 
            style={styles.plungerImage}
            resizeMode="contain"
          />
        </View>

        {/* Toilet Asset */}
        <View style={[styles.toiletContainer, { left: toiletPosition.x, top: toiletPosition.y }]}>
          <Image 
            source={require('../../assets/icon.png')} 
            style={styles.toiletImage}
            resizeMode="contain"
          />
          {/* Scoring rings overlay */}
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

  rubberDuck: {
    position: 'absolute',
    bottom: 80,
    left: 30,
    zIndex: 10,
    width: 80,
    height: 80,
  },
  plunger: {
    position: 'absolute',
    bottom: 70,
    right: 40,
    zIndex: 10,
    width: 60,
    height: 100,
  },
  duckImage: {
    width: 80,
    height: 80,
  },
  plungerImage: {
    width: 60,
    height: 100,
  },
  toiletContainer: {
    position: 'absolute',
    width: 160,
    height: 200,
    zIndex: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toiletImage: {
    width: 160,
    height: 200,
  },
  scoringRings: {
    position: 'absolute',
    top: 80,
    left: 20,
    width: 120,
    height: 100,
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
});

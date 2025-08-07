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
  
  // Toilet position (at the top of the screen)
  const toiletPosition = { x: width / 2 - 60, y: 100 };
  const toiletHolePosition = { x: width / 2 - 40, y: 140 };

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
      gravity: 0.5,
      time: 0,
      hasHitWall: false,
      hasHitToilet: false,
    };
    
    setTosses(prev => [...prev, toss]);
    
    // Animate the toss
    const animateToss = () => {
      toss.time += 0.016; // 60fps
      toss.x += toss.velocityX * 0.016;
      toss.y += toss.velocityY * 0.016;
      toss.velocityY += toss.gravity;
      
      // Check if hit toilet hole (direct hit)
      const distanceFromHole = Math.sqrt(
        Math.pow(toss.x - toiletHolePosition.x, 2) + 
        Math.pow(toss.y - toiletHolePosition.y, 2)
      );
      
      if (distanceFromHole < 30 && !toss.hasHitToilet) {
        const points = calculateScore('direct');
        if (points > 0) {
          setScore(prev => prev + points);
        }
        setTosses(prev => prev.filter(t => t.id !== tossId));
        return;
      }
      
      // Check if hit toilet back wall (bounce)
      if (toss.y < toiletPosition.y + 80 && toss.y > toiletPosition.y + 40 && 
          toss.x > toiletPosition.x + 20 && toss.x < toiletPosition.x + 100 && 
          !toss.hasHitWall) {
        toss.hasHitWall = true;
        toss.velocityX = -toss.velocityX * 0.7; // Bounce back
        toss.velocityY = toss.velocityY * 0.5;
      }
      
      // Check if bounced into hole
      if (toss.hasHitWall && distanceFromHole < 30 && !toss.hasHitToilet) {
        toss.hasHitToilet = true;
        const points = calculateScore('bounce');
        if (points > 0) {
          setScore(prev => prev + points);
        }
        setTosses(prev => prev.filter(t => t.id !== tossId));
        return;
      }
      
      // Check if out of bounds or hit floor
      if (toss.y > height - 50 || toss.x < 0 || toss.x > width) {
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
      
      // Calculate velocity based on gesture
      const velocityX = gestureState.vx * 800;
      const velocityY = gestureState.vy * 800;
      
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

      {/* Game Area - Vertical Bathroom */}
      <View style={styles.gameArea}>
        {/* Wall Tiles Background */}
        <View style={styles.wallTiles}>
          {Array.from({ length: 8 }, (_, row) => (
            <View key={row} style={styles.tileRow}>
              {Array.from({ length: 6 }, (_, col) => (
                <View key={col} style={[styles.tile, { backgroundColor: (row + col) % 2 === 0 ? '#87CEEB' : '#4682B4' }]} />
              ))}
            </View>
          ))}
        </View>

        {/* Floor Tiles */}
        <View style={styles.floorTiles}>
          {Array.from({ length: 3 }, (_, col) => (
            <View key={col} style={[styles.floorTile, { backgroundColor: '#DAA520' }]} />
          ))}
        </View>

        {/* Toilet at the top */}
        <View style={[styles.toiletContainer, { left: toiletPosition.x, top: toiletPosition.y }]}>
          {/* Toilet tank */}
          <View style={styles.toiletTank}>
            <View style={styles.tankTop} />
            <View style={styles.tankBody} />
          </View>
          
          {/* Toilet bowl */}
          <View style={styles.toiletBowl}>
            <View style={styles.bowlTop} />
            <View style={styles.bowlInterior}>
              {/* Toilet hole */}
              <View style={styles.toiletHole} />
            </View>
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
  wallTiles: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 100,
  },
  tileRow: {
    flexDirection: 'row',
    height: 60,
  },
  tile: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#fff',
  },
  floorTiles: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 100,
    flexDirection: 'row',
  },
  floorTile: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#B8860B',
  },
  toiletContainer: {
    position: 'absolute',
    width: 120,
    height: 120,
    zIndex: 10,
  },
  toiletTank: {
    position: 'absolute',
    top: 0,
    left: 20,
    width: 80,
    height: 60,
  },
  tankTop: {
    width: 80,
    height: 10,
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#000',
    borderRadius: 5,
  },
  tankBody: {
    width: 80,
    height: 50,
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#000',
    borderTopWidth: 0,
  },
  toiletBowl: {
    position: 'absolute',
    top: 50,
    left: 10,
    width: 100,
    height: 70,
  },
  bowlTop: {
    width: 100,
    height: 20,
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#000',
    borderRadius: 50,
  },
  bowlInterior: {
    width: 100,
    height: 50,
    backgroundColor: '#f0f0f0',
    borderWidth: 2,
    borderColor: '#000',
    borderTopWidth: 0,
    borderRadius: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toiletHole: {
    width: 60,
    height: 30,
    backgroundColor: '#000',
    borderRadius: 15,
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

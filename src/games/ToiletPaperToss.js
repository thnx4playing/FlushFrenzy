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

export default function ToiletPaperToss({ onGameComplete }) {
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [gameActive, setGameActive] = useState(false);
  const [tosses, setTosses] = useState([]);
  const [nextTossId, setNextTossId] = useState(0);

  // Animated values for toilet paper
  const paperPosition = useRef(new Animated.ValueXY({ x: width / 2 - 25, y: height - 200 })).current;
  const toiletPosition = { x: width / 2 - 40, y: 100 };

  useEffect(() => {
    let timer;
    if (gameActive && timeLeft > 0) {
      timer = setTimeout(() => {
        setTimeLeft(timeLeft - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      endGame();
    }
    return () => clearTimeout(timer);
  }, [gameActive, timeLeft]);

  const startGame = () => {
    setGameActive(true);
    setScore(0);
    setTimeLeft(30);
    setTosses([]);
    resetPaperPosition();
  };

  const endGame = () => {
    setGameActive(false);
    onGameComplete(score);
  };

  const resetPaperPosition = () => {
    paperPosition.setValue({ x: width / 2 - 25, y: height - 200 });
  };

  const calculateDistance = (x1, y1, x2, y2) => {
    return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
  };

  const handleToss = (gestureState) => {
    const { dx, dy, vx, vy } = gestureState;
    const power = Math.min(Math.sqrt(vx * vx + vy * vy) / 10, 20);
    
    // Calculate trajectory
    const targetX = paperPosition.x._value + dx * 2;
    const targetY = Math.max(50, paperPosition.y._value + dy * 2);

    // Animate the toss
    Animated.sequence([
      Animated.timing(paperPosition, {
        toValue: { x: targetX, y: targetY },
        duration: 800,
        useNativeDriver: false,
      }),
      Animated.timing(paperPosition, {
        toValue: { x: targetX, y: height + 100 }, // Fall down
        duration: 400,
        useNativeDriver: false,
      }),
    ]).start(() => {
      // Check if it hit the toilet
      const distance = calculateDistance(
        targetX + 25, // paper center
        targetY + 25, // paper center
        toiletPosition.x + 40, // toilet center
        toiletPosition.y + 60 // toilet center
      );

      let points = 0;
      let message = '';

      if (distance < 50) {
        points = 20;
        message = 'PERFECT! 🎯';
      } else if (distance < 80) {
        points = 15;
        message = 'Great! 👍';
      } else if (distance < 120) {
        points = 10;
        message = 'Good! 👌';
      } else if (distance < 160) {
        points = 5;
        message = 'Close! 😅';
      } else {
        message = 'Miss! 😭';
      }

      if (points > 0) {
        setScore(prev => prev + points);
      }

      // Add toss result to display
      const tossResult = {
        id: nextTossId,
        points,
        message,
        x: targetX,
        y: targetY,
      };
      
      setTosses(prev => [...prev.slice(-2), tossResult]); // Keep only last 3
      setNextTossId(prev => prev + 1);

      // Reset paper position after a short delay
      setTimeout(resetPaperPosition, 500);
    });
  };

  const panResponder = PanResponder.create({
    onMoveShouldSetPanResponder: () => gameActive,
    onPanResponderGrant: () => {
      paperPosition.setOffset({
        x: paperPosition.x._value,
        y: paperPosition.y._value,
      });
    },
    onPanResponderMove: Animated.event(
      [null, { dx: paperPosition.x, dy: paperPosition.y }],
      { useNativeDriver: false }
    ),
    onPanResponderRelease: (evt, gestureState) => {
      paperPosition.flattenOffset();
      handleToss(gestureState);
    },
  });

  if (!gameActive && timeLeft === 30) {
    return (
      <View style={styles.container}>
        <View style={styles.instructionsContainer}>
          <Text style={styles.title}>🧻 Toilet Paper Toss</Text>
          <Text style={styles.instructions}>
            Drag and release to toss toilet paper into the toilet!
          </Text>
          <Text style={styles.instructions}>
            🎯 Closer to the center = More points!
          </Text>
          <Text style={styles.instructions}>
            ⏰ You have 30 seconds!
          </Text>
          
          <TouchableOpacity style={styles.startButton} onPress={startGame}>
            <Text style={styles.startButtonText}>Start Game</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Game UI */}
      <View style={styles.gameUI}>
        <View style={styles.scoreContainer}>
          <Text style={styles.scoreLabel}>Score:</Text>
          <Text style={styles.scoreValue}>{score}</Text>
        </View>
        
        <View style={styles.timerContainer}>
          <Text style={styles.timerLabel}>Time:</Text>
          <Text style={[styles.timerValue, { color: timeLeft <= 10 ? '#E74C3C' : '#2ECC71' }]}>
            {timeLeft}s
          </Text>
        </View>
      </View>

      {/* Game Area */}
      <View style={styles.gameArea}>
        {/* Toilet */}
        <View style={[styles.toilet, { left: toiletPosition.x, top: toiletPosition.y }]}>
          <Text style={styles.toiletText}>🚽</Text>
          <View style={styles.toiletTarget}>
            <View style={styles.targetRing} />
            <View style={styles.targetCenter} />
          </View>
        </View>

        {/* Toilet Paper */}
        <Animated.View
          style={[
            styles.toiletPaper,
            {
              transform: paperPosition.getTranslateTransform(),
            },
          ]}
          {...panResponder.panHandlers}
        >
          <Text style={styles.toiletPaperText}>🧻</Text>
        </Animated.View>

        {/* Toss Results */}
        {tosses.map((toss) => (
          <View
            key={toss.id}
            style={[
              styles.tossResult,
              { left: toss.x, top: toss.y - 30 }
            ]}
          >
            <Text style={styles.tossResultText}>
              {toss.message} {toss.points > 0 ? `+${toss.points}` : ''}
            </Text>
          </View>
        ))}
      </View>

      {/* Instructions */}
      <View style={styles.instructionsBar}>
        <Text style={styles.instructionText}>
          🎯 Drag the toilet paper and release to toss!
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#E8F4FD',
  },
  instructionsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#2E86AB',
    marginBottom: 30,
    textAlign: 'center',
  },
  instructions: {
    fontSize: 18,
    color: '#5A6C7D',
    textAlign: 'center',
    marginBottom: 15,
    lineHeight: 24,
  },
  startButton: {
    backgroundColor: '#4ECDC4',
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 25,
    marginTop: 30,
  },
  startButtonText: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  gameUI: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  scoreContainer: {
    alignItems: 'center',
  },
  scoreLabel: {
    fontSize: 16,
    color: '#5A6C7D',
    marginBottom: 5,
  },
  scoreValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FF6B6B',
  },
  timerContainer: {
    alignItems: 'center',
  },
  timerLabel: {
    fontSize: 16,
    color: '#5A6C7D',
    marginBottom: 5,
  },
  timerValue: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  gameArea: {
    flex: 1,
    position: 'relative',
  },
  toilet: {
    position: 'absolute',
    width: 80,
    height: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toiletText: {
    fontSize: 60,
  },
  toiletTarget: {
    position: 'absolute',
    top: 20,
    left: 20,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  targetRing: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: 'rgba(255, 107, 107, 0.5)',
  },
  targetCenter: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF6B6B',
  },
  toiletPaper: {
    position: 'absolute',
    width: 50,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  toiletPaperText: {
    fontSize: 40,
  },
  tossResult: {
    position: 'absolute',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    padding: 8,
    borderRadius: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  tossResultText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2E86AB',
  },
  instructionsBar: {
    backgroundColor: '#2E86AB',
    padding: 15,
    alignItems: 'center',
  },
  instructionText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

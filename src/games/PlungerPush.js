import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
} from 'react-native';

const { width, height } = Dimensions.get('window');

export default function PlungerPush({ onGameComplete }) {
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [gameActive, setGameActive] = useState(false);
  const [pushPower, setPushPower] = useState(0);
  const [pushCount, setPushCount] = useState(0);

  const plungerAnimation = new Animated.Value(0);

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
    setPushPower(0);
    setPushCount(0);
  };

  const endGame = () => {
    setGameActive(false);
    onGameComplete(score);
  };

  const handlePlungerPush = () => {
    if (!gameActive) return;

    setPushCount(prev => prev + 1);
    setPushPower(prev => Math.min(prev + 10, 100));

    // Animate plunger push
    Animated.sequence([
      Animated.timing(plungerAnimation, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(plungerAnimation, {
        toValue: 0,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();

    // Award points based on power level
    if (pushPower >= 80) {
      setScore(prev => prev + 15);
    } else if (pushPower >= 60) {
      setScore(prev => prev + 10);
    } else if (pushPower >= 40) {
      setScore(prev => prev + 5);
    } else {
      setScore(prev => prev + 2);
    }

    // Decrease power over time
    setTimeout(() => {
      setPushPower(prev => Math.max(prev - 5, 0));
    }, 500);
  };

  if (!gameActive && timeLeft === 30) {
    return (
      <View style={styles.container}>
        <View style={styles.instructionsContainer}>
          <Text style={styles.title}>🪠 Plunger Push</Text>
          <Text style={styles.instructions}>
            Tap the plunger as fast as you can to build power!
          </Text>
          <Text style={styles.instructions}>
            🔥 Higher power = More points!
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

      {/* Power Meter */}
      <View style={styles.powerMeterContainer}>
        <Text style={styles.powerLabel}>Power Level</Text>
        <View style={styles.powerMeter}>
          <View style={[styles.powerFill, { width: `${pushPower}%` }]} />
        </View>
        <Text style={styles.powerValue}>{pushPower}%</Text>
      </View>

      {/* Game Area */}
      <View style={styles.gameArea}>
        <View style={styles.toilet}>
          <Text style={styles.toiletText}>🚽</Text>
        </View>

        <Animated.View
          style={[
            styles.plungerContainer,
            {
              transform: [
                {
                  scale: plungerAnimation.interpolate({
                    inputRange: [0, 1],
                    outputRange: [1, 1.1],
                  }),
                },
                {
                  translateY: plungerAnimation.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, -10],
                  }),
                },
              ],
            },
          ]}
        >
          <TouchableOpacity
            style={styles.plungerButton}
            onPress={handlePlungerPush}
            activeOpacity={0.8}
          >
            <Text style={styles.plungerText}>🪠</Text>
          </TouchableOpacity>
        </Animated.View>

        <View style={styles.statsContainer}>
          <Text style={styles.statsText}>Pushes: {pushCount}</Text>
          <Text style={styles.statsText}>
            Status: {pushPower >= 80 ? '🔥 ON FIRE!' : 
                     pushPower >= 60 ? '💪 STRONG!' :
                     pushPower >= 40 ? '👍 GOOD!' :
                     pushPower >= 20 ? '😅 WEAK' : '💤 SLEEPY'}
          </Text>
        </View>
      </View>

      {/* Instructions */}
      <View style={styles.instructionsBar}>
        <Text style={styles.instructionText}>
          🪠 Tap the plunger rapidly to build power!
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
    backgroundColor: '#45B7D1',
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
  powerMeterContainer: {
    padding: 20,
    backgroundColor: 'white',
    alignItems: 'center',
  },
  powerLabel: {
    fontSize: 16,
    color: '#5A6C7D',
    marginBottom: 10,
  },
  powerMeter: {
    width: width - 40,
    height: 20,
    backgroundColor: '#E0E0E0',
    borderRadius: 10,
    overflow: 'hidden',
    marginBottom: 10,
  },
  powerFill: {
    height: '100%',
    backgroundColor: '#4ECDC4',
    borderRadius: 10,
  },
  powerValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2E86AB',
  },
  gameArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  toilet: {
    marginBottom: 40,
  },
  toiletText: {
    fontSize: 80,
  },
  plungerContainer: {
    marginBottom: 40,
  },
  plungerButton: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  plungerText: {
    fontSize: 60,
  },
  statsContainer: {
    alignItems: 'center',
  },
  statsText: {
    fontSize: 16,
    color: '#5A6C7D',
    marginBottom: 5,
    textAlign: 'center',
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

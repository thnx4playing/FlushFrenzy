import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';

const { width } = Dimensions.get('window');

export default function SoapSlide({ onGameComplete }) {
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [gameActive, setGameActive] = useState(false);

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
  };

  const endGame = () => {
    setGameActive(false);
    onGameComplete(score);
  };

  if (!gameActive && timeLeft === 30) {
    return (
      <View style={styles.container}>
        <View style={styles.instructionsContainer}>
          <Text style={styles.title}>🧼 Soap Slide</Text>
          <Text style={styles.instructions}>
            This game is coming soon!
          </Text>
          <Text style={styles.instructions}>
            Navigate through slippery soap obstacles and collect points!
          </Text>
          <Text style={styles.instructions}>
            🚧 Under construction 🚧
          </Text>
          
          <TouchableOpacity style={styles.startButton} onPress={startGame}>
            <Text style={styles.startButtonText}>Demo Mode</Text>
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
        <View style={styles.comingSoonContainer}>
          <Text style={styles.comingSoonEmoji}>🚧</Text>
          <Text style={styles.comingSoonTitle}>Coming Soon!</Text>
          <Text style={styles.comingSoonText}>
            This awesome soap sliding game is under development.
          </Text>
          <Text style={styles.comingSoonText}>
            Stay tuned for slippery soap adventures!
          </Text>
          
          <View style={styles.demoButtons}>
            <TouchableOpacity
              style={styles.demoButton}
              onPress={() => setScore(prev => prev + 10)}
            >
              <Text style={styles.demoButtonText}>🧼 Collect Soap (+10)</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.demoButton}
              onPress={() => setScore(prev => prev + 25)}
            >
              <Text style={styles.demoButtonText}>🎯 Hit Target (+25)</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Instructions */}
      <View style={styles.instructionsBar}>
        <Text style={styles.instructionText}>
          🧼 Demo mode - Try the buttons above!
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
    backgroundColor: '#FFEAA7',
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 25,
    marginTop: 30,
  },
  startButtonText: {
    color: '#856404',
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
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  comingSoonContainer: {
    alignItems: 'center',
  },
  comingSoonEmoji: {
    fontSize: 80,
    marginBottom: 20,
  },
  comingSoonTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2E86AB',
    marginBottom: 20,
    textAlign: 'center',
  },
  comingSoonText: {
    fontSize: 16,
    color: '#5A6C7D',
    textAlign: 'center',
    marginBottom: 10,
    lineHeight: 22,
  },
  demoButtons: {
    marginTop: 30,
    alignItems: 'center',
  },
  demoButton: {
    backgroundColor: '#4ECDC4',
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 20,
    marginBottom: 15,
  },
  demoButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
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

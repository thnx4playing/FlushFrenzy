import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';

const { width } = Dimensions.get('window');

export default function FlushRush({ onGameComplete }) {
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [gameActive, setGameActive] = useState(false);
  const [toilets, setToilets] = useState([]);
  const [flushCount, setFlushCount] = useState(0);

  useEffect(() => {
    let timer;
    if (gameActive && timeLeft > 0) {
      timer = setTimeout(() => {
        setTimeLeft(timeLeft - 1);
        spawnToilet();
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
    setFlushCount(0);
    setToilets([]);
    spawnInitialToilets();
  };

  const endGame = () => {
    setGameActive(false);
    onGameComplete(score);
  };

  const spawnInitialToilets = () => {
    const initialToilets = [];
    for (let i = 0; i < 6; i++) {
      initialToilets.push({
        id: i,
        needsFlush: Math.random() > 0.5,
        position: i,
      });
    }
    setToilets(initialToilets);
  };

  const spawnToilet = () => {
    setToilets(prev => 
      prev.map(toilet => ({
        ...toilet,
        needsFlush: Math.random() > 0.3, // 70% chance needs flush
      }))
    );
  };

  const flushToilet = (toiletId) => {
    if (!gameActive) return;

    setToilets(prev => 
      prev.map(toilet => {
        if (toilet.id === toiletId && toilet.needsFlush) {
          setScore(prevScore => prevScore + 10);
          setFlushCount(prevCount => prevCount + 1);
          return { ...toilet, needsFlush: false };
        } else if (toilet.id === toiletId && !toilet.needsFlush) {
          // Penalty for flushing clean toilet
          setScore(prevScore => Math.max(0, prevScore - 5));
        }
        return toilet;
      })
    );
  };

  if (!gameActive && timeLeft === 30) {
    return (
      <View style={styles.container}>
        <View style={styles.instructionsContainer}>
          <Text style={styles.title}>🚽 Flush Rush</Text>
          <Text style={styles.instructions}>
            Quickly flush only the dirty toilets!
          </Text>
          <Text style={styles.instructions}>
            💩 Brown toilets need flushing (+10 points)
          </Text>
          <Text style={styles.instructions}>
            ⚠️ Don't flush clean toilets (-5 points)
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

      {/* Stats */}
      <View style={styles.statsContainer}>
        <Text style={styles.statsText}>Flushes: {flushCount}</Text>
        <Text style={styles.statsText}>
          Rate: {timeLeft < 30 ? Math.round((flushCount / (30 - timeLeft)) * 60) : 0} per minute
        </Text>
      </View>

      {/* Game Area */}
      <View style={styles.gameArea}>
        <View style={styles.toiletGrid}>
          {toilets.map((toilet) => (
            <TouchableOpacity
              key={toilet.id}
              style={[
                styles.toiletContainer,
                toilet.needsFlush && styles.dirtyToiletContainer
              ]}
              onPress={() => flushToilet(toilet.id)}
              activeOpacity={0.7}
            >
              <Text style={styles.toiletEmoji}>
                {toilet.needsFlush ? '🚽💩' : '🚽✨'}
              </Text>
              <Text style={styles.toiletStatus}>
                {toilet.needsFlush ? 'FLUSH!' : 'Clean'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Legend */}
      <View style={styles.legendContainer}>
        <View style={styles.legendItem}>
          <Text style={styles.legendEmoji}>🚽💩</Text>
          <Text style={styles.legendText}>Dirty - Flush it! (+10)</Text>
        </View>
        <View style={styles.legendItem}>
          <Text style={styles.legendEmoji}>🚽✨</Text>
          <Text style={styles.legendText}>Clean - Don't flush! (-5)</Text>
        </View>
      </View>

      {/* Instructions */}
      <View style={styles.instructionsBar}>
        <Text style={styles.instructionText}>
          🚽 Tap dirty toilets to flush them!
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
    backgroundColor: '#96CEB4',
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
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    padding: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
  },
  statsText: {
    fontSize: 14,
    color: '#5A6C7D',
    fontWeight: '600',
  },
  gameArea: {
    flex: 1,
    padding: 20,
  },
  toiletGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  toiletContainer: {
    width: (width - 60) / 2,
    aspectRatio: 1,
    backgroundColor: 'white',
    borderRadius: 15,
    margin: 5,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  dirtyToiletContainer: {
    backgroundColor: '#FFE5E5',
    borderWidth: 2,
    borderColor: '#FF6B6B',
  },
  toiletEmoji: {
    fontSize: 40,
    marginBottom: 10,
  },
  toiletStatus: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#5A6C7D',
  },
  legendContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendEmoji: {
    fontSize: 20,
    marginRight: 8,
  },
  legendText: {
    fontSize: 12,
    color: '#5A6C7D',
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

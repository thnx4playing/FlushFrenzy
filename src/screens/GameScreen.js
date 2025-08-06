import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';

// Import individual game components
import ToiletPaperToss from '../games/ToiletPaperToss';
import PlungerPush from '../games/PlungerPush';
import FlushRush from '../games/FlushRush';
import SoapSlide from '../games/SoapSlide';

export default function GameScreen({ route, navigation }) {
  const { gameId } = route.params;
  const [gameComplete, setGameComplete] = useState(false);
  const [score, setScore] = useState(0);

  const gameComponents = {
    'toilet-paper-toss': ToiletPaperToss,
    'plunger-push': PlungerPush,
    'flush-rush': FlushRush,
    'soap-slide': SoapSlide,
  };

  const gameNames = {
    'toilet-paper-toss': 'Toilet Paper Toss',
    'plunger-push': 'Plunger Push',
    'flush-rush': 'Flush Rush',
    'soap-slide': 'Soap Slide',
  };

  const handleGameComplete = (finalScore) => {
    setScore(finalScore);
    setGameComplete(true);
  };

  const handlePlayAgain = () => {
    setGameComplete(false);
    setScore(0);
  };

  const handleBackToMenu = () => {
    navigation.navigate('GameSelect');
  };

  const GameComponent = gameComponents[gameId];

  if (!GameComponent) {
    return (
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>🚫 Game Not Found</Text>
          <Text style={styles.errorText}>
            Sorry, this game is not available yet!
          </Text>
          <TouchableOpacity
            style={styles.backButton}
            onPress={handleBackToMenu}
          >
            <Text style={styles.backButtonText}>Back to Menu</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (gameComplete) {
    return (
      <View style={styles.container}>
        <View style={styles.resultsContainer}>
          <Text style={styles.resultsTitle}>🎉 Game Complete! 🎉</Text>
          <Text style={styles.gameNameText}>{gameNames[gameId]}</Text>
          
          <View style={styles.scoreContainer}>
            <Text style={styles.scoreLabel}>Final Score:</Text>
            <Text style={styles.scoreValue}>{score}</Text>
          </View>

          <View style={styles.buttonsContainer}>
            <TouchableOpacity
              style={[styles.button, styles.playAgainButton]}
              onPress={handlePlayAgain}
            >
              <Text style={styles.buttonText}>🔄 Play Again</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.menuButton]}
              onPress={handleBackToMenu}
            >
              <Text style={styles.buttonText}>🏠 Back to Menu</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.achievementContainer}>
            <Text style={styles.achievementText}>
              {score >= 100 ? '🏆 Toilet Champion!' :
               score >= 75 ? '🥇 Bathroom Master!' :
               score >= 50 ? '🥈 Plumbing Pro!' :
               score >= 25 ? '🥉 Rookie Flusher!' :
               '💩 Keep Practicing!'}
            </Text>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.exitButton}
          onPress={() => {
            Alert.alert(
              'Exit Game',
              'Are you sure you want to exit? Your progress will be lost.',
              [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Exit', onPress: handleBackToMenu },
              ]
            );
          }}
        >
          <Text style={styles.exitButtonText}>✕</Text>
        </TouchableOpacity>
        
        <Text style={styles.headerTitle}>{gameNames[gameId]}</Text>
      </View>

      <GameComponent onGameComplete={handleGameComplete} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2E86AB',
    paddingTop: 50,
    paddingBottom: 15,
    paddingHorizontal: 20,
  },
  exitButton: {
    position: 'absolute',
    left: 20,
    top: 50,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  exitButtonText: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  headerTitle: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#E74C3C',
    marginBottom: 20,
    textAlign: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#5A6C7D',
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 22,
  },
  backButton: {
    backgroundColor: '#2E86AB',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 25,
  },
  backButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  resultsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  resultsTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#2E86AB',
    marginBottom: 10,
    textAlign: 'center',
  },
  gameNameText: {
    fontSize: 20,
    color: '#5A6C7D',
    marginBottom: 40,
    textAlign: 'center',
  },
  scoreContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  scoreLabel: {
    fontSize: 18,
    color: '#5A6C7D',
    marginBottom: 10,
  },
  scoreValue: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#FF6B6B',
  },
  buttonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: 30,
  },
  button: {
    paddingVertical: 15,
    paddingHorizontal: 25,
    borderRadius: 25,
    minWidth: 120,
    alignItems: 'center',
  },
  playAgainButton: {
    backgroundColor: '#4ECDC4',
  },
  menuButton: {
    backgroundColor: '#95A5A6',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  achievementContainer: {
    padding: 20,
    backgroundColor: '#FFF3CD',
    borderRadius: 15,
    borderWidth: 2,
    borderColor: '#FFEAA7',
  },
  achievementText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#856404',
    textAlign: 'center',
  },
});

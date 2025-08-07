import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  SafeAreaView,
  ImageBackground,
} from 'react-native';

// Import individual game components
import ToiletPaperToss from '../games/ToiletPaperToss';

export default function GameScreen({ route, navigation }) {
  const { gameId, gameMode } = route.params;
  const [gameComplete, setGameComplete] = useState(false);
  const [score, setScore] = useState(0);
  const [showTutorial, setShowTutorial] = useState(true);

  const gameNames = {
    'quick-flush': 'Quick Flush',
    'endless-plunge': 'Endless Plunge',
  };

  const getGameModeDescription = () => {
    if (gameMode === 'quick-flush') {
      return 'You have 60 seconds to score as many points as possible!';
    } else {
      return 'Keep tossing until you miss 3 times!';
    }
  };

  const handleGameComplete = (finalScore) => {
    setScore(finalScore);
    setGameComplete(true);
  };

  const handleTutorialStart = () => {
    setShowTutorial(false);
  };

  const handleBackToMenu = () => {
    navigation.navigate('Home');
  };

  const handlePlayAgain = () => {
    setGameComplete(false);
    setScore(0);
    setShowTutorial(true);
  };

  if (showTutorial) {
    return (
      <ImageBackground 
        source={require('../../assets/background_.png')} 
        style={styles.container}
        resizeMode="stretch"
      >
        <View style={styles.tutorialContainer}>
          <View style={styles.tutorialCard}>
            <Text style={styles.tutorialIcon}>🎯</Text>
            <Text style={styles.tutorialTitle}>Ready to Toss?</Text>
            
            <View style={styles.tutorialContent}>
              <Text style={styles.tutorialDescription}>
                <Text style={styles.highlight}>👆 Drag & flick</Text> the toilet paper to throw it!
              </Text>
              
              <Text style={styles.tutorialDescription}>
                <Text style={styles.highlight}>🎯 Direct hit = 3 points</Text> • <Text style={styles.highlight}>Bounce = 1 point</Text>
              </Text>
              
              <Text style={styles.tutorialDescription}>
                <Text style={styles.highlight}>🚀 {gameMode === 'quick-flush' ? '60 seconds to score!' : '3 misses allowed!'}</Text>
              </Text>
            </View>
            
            <TouchableOpacity
              style={styles.tutorialButton}
              onPress={handleTutorialStart}
              activeOpacity={0.8}
            >
              <Text style={styles.tutorialButtonText}>Let's Play! 🚽</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ImageBackground>
    );
  }

  if (gameComplete) {
    return (
      <ImageBackground 
        source={require('../../assets/background_.png')} 
        style={styles.container}
        resizeMode="stretch"
      >
        <View style={styles.resultsContainer}>
          <View style={styles.resultsCard}>
            <Text style={styles.resultsTitle}>Game Complete!</Text>
            <Text style={styles.resultsScore}>Final Score: {score}</Text>
            <Text style={styles.resultsMode}>{gameNames[gameMode]}</Text>
            
            <View style={styles.resultsButtons}>
              <TouchableOpacity
                style={[styles.resultsButton, styles.playAgainButton]}
                onPress={handlePlayAgain}
                activeOpacity={0.8}
              >
                <Text style={styles.playAgainButtonText}>Play Again</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.resultsButton, styles.menuButton]}
                onPress={handleBackToMenu}
                activeOpacity={0.8}
              >
                <Text style={styles.menuButtonText}>Back to Menu</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ImageBackground>
    );
  }

  return (
    <View style={styles.container}>
      <ToiletPaperToss 
        onGameComplete={handleGameComplete}
        gameMode={gameMode}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  tutorialContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  tutorialCard: {
    backgroundColor: '#FF6B9D',
    borderRadius: 25,
    padding: 25,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 12,
    maxWidth: 320,
    borderWidth: 4,
    borderColor: '#FFD700',
  },
  tutorialIcon: {
    fontSize: 48,
    marginBottom: 15,
  },
  tutorialTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 20,
    textAlign: 'center',
    textShadowColor: '#000',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 2,
  },
  tutorialContent: {
    alignItems: 'center',
    marginBottom: 25,
  },
  tutorialDescription: {
    fontSize: 18,
    color: '#fff',
    textAlign: 'center',
    lineHeight: 26,
    marginBottom: 12,
    textShadowColor: '#000',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 1,
  },
  highlight: {
    fontWeight: 'bold',
    color: '#FFD700',
  },
  tutorialButton: {
    backgroundColor: '#4ECDC4',
    paddingVertical: 18,
    paddingHorizontal: 35,
    borderRadius: 30,
    minWidth: 180,
    borderWidth: 3,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 6,
  },
  tutorialButtonText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    textShadowColor: '#000',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 1,
  },
  resultsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  resultsCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 30,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
    maxWidth: 350,
  },
  resultsTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 20,
  },
  resultsScore: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#4ECDC4',
    marginBottom: 10,
  },
  resultsMode: {
    fontSize: 18,
    color: '#6c757d',
    marginBottom: 30,
  },
  resultsButtons: {
    flexDirection: 'row',
    gap: 15,
  },
  resultsButton: {
    paddingVertical: 15,
    paddingHorizontal: 25,
    borderRadius: 25,
    minWidth: 120,
  },
  playAgainButton: {
    backgroundColor: '#4ECDC4',
  },
  playAgainButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  menuButton: {
    backgroundColor: '#6c757d',
  },
  menuButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});

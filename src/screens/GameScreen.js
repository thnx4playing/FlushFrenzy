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
            <Text style={styles.tutorialIcon}>🚽</Text>
            <Text style={styles.tutorialTitle}>How to Play</Text>
            
            <View style={styles.tutorialSection}>
              <Text style={styles.tutorialSubtitle}>👆 Controls</Text>
              <Text style={styles.tutorialDescription}>
                Drag and flick the toilet paper to toss it into the toilet!
              </Text>
            </View>
            
            <View style={styles.tutorialSection}>
              <Text style={styles.tutorialSubtitle}>🎯 Scoring</Text>
              <Text style={styles.tutorialDescription}>
                Hit the center for 100 points, outer ring for 50 points!
              </Text>
            </View>
            
            <View style={styles.tutorialSection}>
              <Text style={styles.tutorialSubtitle}>🚀 Game Mode</Text>
              <Text style={styles.tutorialDescription}>
                {getGameModeDescription()}
              </Text>
            </View>
            
            <TouchableOpacity
              style={styles.tutorialButton}
              onPress={handleTutorialStart}
              activeOpacity={0.8}
            >
              <Text style={styles.tutorialButtonText}>Start Game!</Text>
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
  tutorialIcon: {
    fontSize: 64,
    marginBottom: 20,
  },
  tutorialTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 15,
    textAlign: 'center',
  },
  tutorialDescription: {
    fontSize: 16,
    color: '#6c757d',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 15,
  },
  tutorialSection: {
    marginBottom: 20,
    alignItems: 'center',
  },
  tutorialSubtitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 8,
    textAlign: 'center',
  },
  tutorialButton: {
    backgroundColor: '#4ECDC4',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 25,
    minWidth: 150,
  },
  tutorialButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
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

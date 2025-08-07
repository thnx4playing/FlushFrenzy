import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  SafeAreaView,
} from 'react-native';

// Import individual game components
import ToiletPaperToss from '../games/ToiletPaperToss';

export default function GameScreen({ route, navigation }) {
  const { gameId, gameMode } = route.params;
  const [gameComplete, setGameComplete] = useState(false);
  const [score, setScore] = useState(0);
  const [showTutorial, setShowTutorial] = useState(true);
  const [tutorialStep, setTutorialStep] = useState(0);

  const gameNames = {
    'quick-flush': 'Quick Flush',
    'endless-plunge': 'Endless Plunge',
  };

  const tutorialSteps = [
    {
      title: 'How to Play',
      description: 'Drag and flick the toilet paper to toss it into the toilet!',
      icon: '👆',
    },
    {
      title: 'Scoring',
      description: 'Hit the center for 100 points, outer ring for 50 points!',
      icon: '🎯',
    },
    {
      title: 'Ready to Start!',
      description: gameMode === 'quick-flush' 
        ? 'You have 60 seconds to score as many points as possible!'
        : 'Keep tossing until you miss 3 times!',
      icon: '🚀',
    },
  ];

  const handleGameComplete = (finalScore) => {
    setScore(finalScore);
    setGameComplete(true);
  };

  const handleTutorialNext = () => {
    if (tutorialStep < tutorialSteps.length - 1) {
      setTutorialStep(tutorialStep + 1);
    } else {
      setShowTutorial(false);
    }
  };

  const handleBackToMenu = () => {
    navigation.navigate('GameSelect');
  };

  const handlePlayAgain = () => {
    setGameComplete(false);
    setScore(0);
    setShowTutorial(true);
    setTutorialStep(0);
  };

  if (showTutorial) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.tutorialContainer}>
          <View style={styles.tutorialCard}>
            <Text style={styles.tutorialIcon}>{tutorialSteps[tutorialStep].icon}</Text>
            <Text style={styles.tutorialTitle}>{tutorialSteps[tutorialStep].title}</Text>
            <Text style={styles.tutorialDescription}>
              {tutorialSteps[tutorialStep].description}
            </Text>
            <TouchableOpacity
              style={styles.tutorialButton}
              onPress={handleTutorialNext}
              activeOpacity={0.8}
            >
              <Text style={styles.tutorialButtonText}>
                {tutorialStep < tutorialSteps.length - 1 ? 'Next' : 'Start Game!'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  if (gameComplete) {
    return (
      <SafeAreaView style={styles.container}>
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
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{gameNames[gameMode]}</Text>
      </View>
      
      <ToiletPaperToss 
        onGameComplete={handleGameComplete}
        gameMode={gameMode}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  backButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginRight: 15,
  },
  backButtonText: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2c3e50',
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
    marginBottom: 30,
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

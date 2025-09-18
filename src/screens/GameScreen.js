import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  SafeAreaView,
  ImageBackground,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

// Import individual game components
import ToiletPaperToss from '../games/ToiletPaperToss';
import { AudioManager } from '../audio/AudioManager';


export default function GameScreen({ route, navigation }) {
  const { gameId, gameMode } = route.params;
  const [showTutorial, setShowTutorial] = useState(false);
  const sheetRef = useRef(null);

  // Create a unique key that forces remount when mode changes
  const gameKey = useMemo(() => {
    return `game-${gameMode}-${Date.now()}`;
  }, [gameMode]);

  // Play game music when GameScreen is focused, stop when blurred
  useFocusEffect(
    React.useCallback(() => {
      AudioManager.playGameMusic({ loop: true });
      
      return () => {
        AudioManager.stopMusic();
      };
    }, [])
  );


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

  const handleGameComplete = (finalScore, playAgain = false) => {
    if (playAgain) {
      // For Play Again, navigate back to the same game mode
      navigation.replace('Game', { 
        gameId: 'flush-frenzy',
        gameMode: gameMode 
      });
    } else {
      // For Main Menu, navigate back to home
      navigation.navigate('Home');
    }
  };

  const handleTutorialStart = () => {
    setShowTutorial(false);
  };

  if (showTutorial) {
    return (
      <ImageBackground 
        source={require('../../assets/game_background_halloween.png')} 
        style={styles.container}
        resizeMode="stretch"
      >
                 <View style={styles.tutorialContainer}>
           <View style={styles.tutorialCard}>
             <Text style={styles.tutorialTitle}>Ready to Toss?</Text>
             
             <View style={styles.tutorialContent}>
               <Text style={styles.tutorialDescription}>
                 <Text style={styles.highlight}>👆 Drag & flick</Text>
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

  return (
    <View style={styles.container}>
      <ToiletPaperToss 
        key={gameKey}
        onGameComplete={handleGameComplete}
        gameMode={gameMode}
        sheetRef={sheetRef}
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
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 10,
    maxWidth: 280,
    borderWidth: 3,
    borderColor: '#FFD700',
  },
  tutorialTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 15,
    textAlign: 'center',
    textShadowColor: '#000',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 2,
  },
  tutorialContent: {
    alignItems: 'center',
    marginBottom: 20,
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

});

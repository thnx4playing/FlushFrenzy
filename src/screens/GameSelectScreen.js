import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  SafeAreaView,
} from 'react-native';

const { width, height } = Dimensions.get('window');

const GAME_MODES = [
  {
    id: 'quick-flush',
    title: 'Quick Flush',
    description: '60 second challenge - Score as many points as you can!',
    icon: '⏱️',
    color: '#4ECDC4',
    gradient: ['#4ECDC4', '#44A08D'],
  },
  {
    id: 'endless-plunge',
    title: 'Endless Plunge',
    description: 'Flick toilet paper until you miss 3 times!',
    icon: '♾️',
    color: '#45B7D1',
    gradient: ['#45B7D1', '#96CEB4'],
  },
];

export default function GameSelectScreen({ navigation }) {
  const navigateToGame = (gameMode) => {
    navigation.navigate('Game', { 
      gameId: 'toilet-paper-toss',
      gameMode: gameMode 
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Choose Your Challenge</Text>
      </View>

      <View style={styles.content}>
        <Text style={styles.subtitle}>Toilet Paper Toss</Text>
        <Text style={styles.description}>
          Master the art of toilet paper tossing! Aim carefully and score big!
        </Text>

        <View style={styles.gameModesContainer}>
          {GAME_MODES.map((mode) => (
            <TouchableOpacity
              key={mode.id}
              style={[styles.gameModeCard, { backgroundColor: mode.color }]}
              onPress={() => navigateToGame(mode.id)}
              activeOpacity={0.8}
            >
              <View style={styles.gameModeContent}>
                <Text style={styles.gameModeIcon}>{mode.icon}</Text>
                <Text style={styles.gameModeTitle}>{mode.title}</Text>
                <Text style={styles.gameModeDescription}>{mode.description}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </View>
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
    paddingTop: 10,
    paddingBottom: 20,
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
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2c3e50',
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  subtitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2c3e50',
    textAlign: 'center',
    marginBottom: 10,
  },
  description: {
    fontSize: 16,
    color: '#6c757d',
    textAlign: 'center',
    marginBottom: 40,
    lineHeight: 24,
  },
  gameModesContainer: {
    gap: 20,
  },
  gameModeCard: {
    borderRadius: 20,
    padding: 25,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
    transform: [{ scale: 1 }],
  },
  gameModeContent: {
    alignItems: 'center',
  },
  gameModeIcon: {
    fontSize: 48,
    marginBottom: 15,
  },
  gameModeTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
    textAlign: 'center',
  },
  gameModeDescription: {
    fontSize: 16,
    color: '#fff',
    textAlign: 'center',
    lineHeight: 22,
    opacity: 0.9,
  },
});

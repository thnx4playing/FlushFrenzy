import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  SafeAreaView,
  LinearGradient,
} from 'react-native';

const { width, height } = Dimensions.get('window');

const GAME_MODES = [
  {
    id: 'quick-flush',
    title: 'QUICK FLUSH',
    subtitle: '60 second challenge',
    icon: '⏱️',
    backgroundColor: '#FFB347', // Orange-yellow like the reference
    borderColor: '#8B4513', // Dark brown border
    textColor: '#fff',
    textOutline: '#1E3A8A', // Dark blue outline
  },
  {
    id: 'endless-plunge',
    title: 'ENDLESS PLUNGE',
    subtitle: '3 misses allowed',
    icon: '♾️',
    backgroundColor: '#4ECDC4', // Teal for variety
    borderColor: '#2E8B57', // Dark green border
    textColor: '#fff',
    textOutline: '#1E3A8A', // Dark blue outline
  },
];

export default function HomeScreen({ navigation }) {
  const navigateToGame = (gameMode) => {
    navigation.navigate('Game', { 
      gameId: 'toilet-paper-toss',
      gameMode: gameMode 
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Animated Background */}
      <View style={styles.background}>
        <View style={styles.bubble1} />
        <View style={styles.bubble2} />
        <View style={styles.bubble3} />
        <View style={styles.bubble4} />
      </View>

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Text style={styles.title}>🚽 TOILET OLYMPICS 🚽</Text>
        </View>
        <Text style={styles.subtitle}>The Ultimate Bathroom Challenge!</Text>
      </View>

      {/* Game Modes */}
      <View style={styles.content}>
        <View style={styles.gameModesContainer}>
          {GAME_MODES.map((mode, index) => (
            <TouchableOpacity
              key={mode.id}
              style={[
                styles.gameModeCard,
                { 
                  backgroundColor: mode.backgroundColor,
                  borderColor: mode.borderColor,
                }
              ]}
              onPress={() => navigateToGame(mode.id)}
              activeOpacity={0.8}
            >
              <View style={styles.gameModeContent}>
                <View style={styles.iconContainer}>
                  <Text style={styles.gameModeIcon}>{mode.icon}</Text>
                </View>
                <Text style={[styles.gameModeTitle, { color: mode.textColor, textShadowColor: mode.textOutline }]}>{mode.title}</Text>
                <Text style={[styles.gameModeSubtitle, { color: mode.textColor, textShadowColor: mode.textOutline }]}>{mode.subtitle}</Text>
                <View style={styles.playButton}>
                  <Text style={styles.playButtonText}>PLAY NOW!</Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Fun Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>🎯 Aim for the toilet! 🎯</Text>
          <Text style={styles.footerSubtext}>The more accurate, the higher the score!</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#E8F4FD',
  },
  background: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  bubble1: {
    position: 'absolute',
    top: 100,
    left: 50,
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 107, 107, 0.1)',
  },
  bubble2: {
    position: 'absolute',
    top: 200,
    right: 30,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(78, 205, 196, 0.1)',
  },
  bubble3: {
    position: 'absolute',
    bottom: 150,
    left: 20,
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255, 142, 142, 0.1)',
  },
  bubble4: {
    position: 'absolute',
    bottom: 80,
    right: 60,
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(68, 160, 141, 0.1)',
  },
  header: {
    alignItems: 'center',
    paddingTop: 20,
    paddingBottom: 30,
    paddingHorizontal: 20,
  },
  titleContainer: {
    backgroundColor: '#FF6B6B', // Vibrant red background
    paddingVertical: 15,
    paddingHorizontal: 25,
    borderRadius: 20,
    marginBottom: 15,
    borderWidth: 3,
    borderColor: '#8B0000', // Dark red border
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 6,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    textShadowColor: '#1E3A8A', // Dark blue outline like buttons
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 1,
  },
  subtitle: {
    fontSize: 18,
    color: '#2c3e50',
    textAlign: 'center',
    fontWeight: 'bold',
    textShadowColor: 'rgba(255, 255, 255, 0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 1,
  },
  content: {
    flex: 1,
    padding: 20,
    justifyContent: 'space-between',
  },
  gameModesContainer: {
    gap: 25,
    flex: 1,
    justifyContent: 'center',
  },
  gameModeCard: {
    borderRadius: 20,
    padding: 25,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
    minHeight: 180,
    justifyContent: 'center',
    borderWidth: 3,
  },
  gameModeContent: {
    alignItems: 'center',
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  gameModeIcon: {
    fontSize: 48,
  },
  gameModeTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
    textShadowColor: '#1E3A8A',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 1,
  },
  gameModeSubtitle: {
    fontSize: 14,
    marginBottom: 20,
    textAlign: 'center',
    textShadowColor: '#1E3A8A',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 1,
  },
  playButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  playButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 1,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  footerText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    textAlign: 'center',
    marginBottom: 5,
  },
  footerSubtext: {
    fontSize: 14,
    color: '#6c757d',
    textAlign: 'center',
    fontStyle: 'italic',
  },
});

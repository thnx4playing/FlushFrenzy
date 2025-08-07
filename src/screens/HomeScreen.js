import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  SafeAreaView,
  ImageBackground,
} from 'react-native';

const { width, height } = Dimensions.get('window');

const GAME_MODES = [
  {
    id: 'quick-flush',
    title: 'QUICK FLUSH',
    subtitle: '60 SECOND CHALLENGE',
    backgroundColor: '#FFB347', // Orange-yellow like the reference
    borderColor: '#8B4513', // Dark brown border
    textColor: '#FFFDD0', // Creamy off-white
    textOutline: '#8B4513', // Dark brown outline
    subtitleColor: '#8B4513', // Dark brown for subtitle
  },
  {
    id: 'endless-plunge',
    title: 'ENDLESS PLUNGE',
    subtitle: '3 MISSES ALLOWED',
    backgroundColor: '#FFB347', // Orange-yellow like the reference
    borderColor: '#8B4513', // Dark brown border
    textColor: '#FFFDD0', // Creamy off-white
    textOutline: '#8B4513', // Dark brown outline
    subtitleColor: '#8B4513', // Dark brown for subtitle
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
    <ImageBackground 
      source={require('../../assets/wall.png')} 
      style={styles.container}
      resizeMode="repeat"
    >

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
                <Text style={[styles.gameModeTitle, { color: mode.textColor, textShadowColor: mode.textOutline }]}>{mode.title}</Text>
                <Text style={[styles.gameModeSubtitle, { color: mode.subtitleColor, textShadowColor: mode.textOutline }]}>{mode.subtitle}</Text>
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
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
    borderRadius: 25,
    padding: 30,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
    minHeight: 120,
    justifyContent: 'center',
    borderWidth: 4,
    position: 'relative',
    // Create pot/cauldron shape with rounded top and bottom
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    borderBottomLeftRadius: 35,
    borderBottomRightRadius: 35,
  },
  gameModeContent: {
    alignItems: 'center',
  },
  gameModeTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 1,
    letterSpacing: 1,
  },
  gameModeSubtitle: {
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 1,
    letterSpacing: 0.5,
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

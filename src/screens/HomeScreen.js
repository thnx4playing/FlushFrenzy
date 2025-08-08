import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  SafeAreaView,
  ImageBackground,
  Image,
} from 'react-native';

const { width, height } = Dimensions.get('window');

const GAME_MODES = [
  {
    id: 'quick-flush',
    title: 'QUICK FLUSH',
    subtitle: '60 SECOND CHALLENGE',
    imageSource: require('../../assets/quick_flush.png'),
  },
  {
    id: 'endless-plunge',
    title: 'ENDLESS PLUNGE',
    subtitle: '3 MISSES ALLOWED',
    imageSource: require('../../assets/endless_plunge.png'),
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
      source={require('../../assets/background_.png')} 
      style={styles.container}
      resizeMode="stretch"
    >
      <View style={styles.content}>
        {/* Game Modes - moved to top */}
        <View style={styles.gameModesContainer}>
          {GAME_MODES.map((mode, index) => (
            <TouchableOpacity
              key={mode.id}
              style={styles.gameModeCard}
              onPress={() => navigateToGame(mode.id)}
              activeOpacity={0.8}
            >
              <Image 
                source={mode.imageSource}
                style={mode.id === 'quick-flush' ? styles.quickFlushImage : styles.endlessPlungeImage}
                resizeMode="contain"
              />
            </TouchableOpacity>
          ))}
        </View>

        {/* Header moved to bottom */}
        <View style={styles.header}>
          <Image 
            source={require('../../assets/header.png')} 
            style={styles.headerImage}
            resizeMode="contain"
          />
        </View>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  gameModesContainer: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingTop: 80,
  },
  gameModeCard: {
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
    width: width * 0.95,
    height: 220,
    marginVertical: 0,
  },
  quickFlushImage: {
    width: width * 0.765, // 10% smaller (was 0.85)
    height: 291.6, // 10% smaller (was 324)
    alignSelf: 'center',
  },
  endlessPlungeImage: {
    width: width * 0.95,
    height: 220,
    alignSelf: 'center',
  },
  header: {
    width: '100%',
    height: height * 0.15,
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: 0,
    marginBottom: 0,
  },
  headerImage: {
    width: width,
    height: height * 0.3,
  },
});

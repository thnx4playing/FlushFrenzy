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
        {/* Header at top */}
        <View style={styles.header}>
          <Image 
            source={require('../../assets/header.png')} 
            style={styles.headerImage}
            resizeMode="contain"
          />
        </View>

        {/* Game Modes */}
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
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    width: '100%',
    height: height * 0.35,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 60,
  },
  headerImage: {
    width: width,
    height: height * 0.3,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  gameModesContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
    marginVertical: 10,
  },
  quickFlushImage: {
    width: width * 0.95,
    height: 180,
    alignSelf: 'center',
  },
  endlessPlungeImage: {
    width: width * 0.95,
    height: 220,
    alignSelf: 'center',
  },


});

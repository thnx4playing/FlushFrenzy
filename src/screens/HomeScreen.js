import React, { useState, useEffect } from 'react';
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
import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import { HighScoreLabel } from '../components/HighScoreLabel';

const { width, height } = Dimensions.get('window');

const GAME_MODES = [
  {
    id: 'endless-plunge',
    title: 'ENDLESS PLUNGE',
    subtitle: 'BEAT THE CLOCK',
    imageSource: require('../../assets/endless_plunge.png'),
  },
  {
    id: 'quick-flush',
    title: 'PRACTICE MODE',
    subtitle: '60 SECOND CHALLENGE',
    imageSource: require('../../assets/quick_flush.png'),
  },
];

export default function HomeScreen({ navigation }) {
  const [isMuted, setIsMuted] = useState(false);
  const [settingsVisible, setSettingsVisible] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        await Audio.setIsEnabledAsync(!isMuted);
      } catch {}
    })();
  }, [isMuted]);
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
        {/* Header moved to top with increased size */}
        <View style={styles.header}>
          <Image 
            source={require('../../assets/header.png')} 
            style={styles.headerImage}
            resizeMode="contain"
          />
        </View>

        {/* Game Modes - moved down to allow room for header */}
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
                style={styles.gameModeImage}
                resizeMode="contain"
              />
              <View style={styles.highScoreContainer}>
                <Ionicons name="trophy" size={16} color="#FF6B35" style={styles.trophyIcon} />
                <HighScoreLabel mode={mode.id} style={styles.highScoreText} />
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Bottom corner actions */}
        <View style={styles.bottomBar} pointerEvents="box-none">
          <TouchableOpacity style={styles.bottomLeft} onPress={() => setSettingsVisible(true)}>
            <Ionicons name="settings-sharp" size={26} color="#FFFFFF" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.bottomRight} onPress={() => setIsMuted(m => !m)}>
            <Ionicons name={isMuted ? 'volume-mute' : 'volume-high'} size={26} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* Settings Modal */}
        <View>
          <></>
        </View>
        {settingsVisible && (
          <View pointerEvents="auto" style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <Text style={styles.modalTitle}>Settings</Text>
              <Text style={styles.modalText}>Coming soon.</Text>
              <TouchableOpacity onPress={() => setSettingsVisible(false)} style={styles.modalButton}>
                <Text style={styles.modalButtonText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
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
    paddingBottom: 0,
  },
  header: {
    width: '100%',
    height: height * 0.25,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
  },
  headerImage: {
    width: width * 0.9,
    height: height * 0.3,
  },
  gameModesContainer: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingTop: 60,
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
    marginVertical: -10,
  },
  gameModeImage: {
    width: width * 0.765, // 10% smaller (was 0.85)
    height: 291.6, // 10% smaller (was 324)
    alignSelf: 'center',
  },
  highScoreContainer: {
    position: 'absolute',
    bottom: 15,
    right: 15,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  trophyIcon: {
    marginRight: 2,
  },
  highScoreText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#000000',
  },
  bottomBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 20,
    height: 40,
  },
  bottomLeft: {
    position: 'absolute',
    left: 20,
    bottom: 0,
  },
  bottomRight: {
    position: 'absolute',
    right: 20,
    bottom: 0,
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCard: {
    width: '80%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
    color: '#212529',
  },
  modalText: {
    fontSize: 14,
    color: '#495057',
    marginBottom: 16,
  },
  modalButton: {
    backgroundColor: '#4ECDC4',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  modalButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
});

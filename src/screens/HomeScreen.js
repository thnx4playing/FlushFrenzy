import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  SafeAreaView,
  ImageBackground,
  Image,
  Modal,
  Alert,
  Pressable,
  TextInput,
  AppState,
  InteractionManager,
} from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { HighScoreLabel } from '../components/HighScoreLabel';
import VolumeControlModal from '../components/VolumeControlModal';
import { AudioManager } from '../audio/AudioManager';
import { useAudioStore } from '../audio/AudioStore';

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
  const [volumeModalVisible, setVolumeModalVisible] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [touchResetKey, setTouchResetKey] = useState(0);
  const [squelchTouches, setSquelchTouches] = useState(false);
  
  // Settings and Discord state
  const [settingsVisible, setSettingsVisible] = useState(false);
  const [discordMessage, setDiscordMessage] = useState('');
  const [showDiscordModal, setShowDiscordModal] = useState(false);

  // Bug fixes session timeout
  const BUGFIX_URL = 'https://virtuixtech.com/apps/flushfrenzy/bugfix.html';
  const SESSION_TIMEOUT_MS = 60_000;

  const sessionTimerRef = useRef(null);
  const browserOpenRef = useRef(false);
  const closingRef = useRef(false);
  const resumeResetPendingRef = useRef(false);

  const stopSessionTimer = () => {
    if (sessionTimerRef.current) {
      clearTimeout(sessionTimerRef.current);
      sessionTimerRef.current = null;
    }
  };

  const closeAllOverlays = () => {
    if (closingRef.current) return;
    console.log('🚪 Closing all overlays');
    closingRef.current = true;
    
    // Force close all possible modals
    setShowDiscordModal(false);   // Bug report modal
    setSettingsVisible(false);    // Settings root/modal
    setVolumeModalVisible(false); // Volume modal (defensive)
    
    // On the next tick, remount root so no invisible overlay can keep swallowing touches
    setTimeout(() => {
      console.log('🔄 Touch reset key bump:', touchResetKey + 1);
      setTouchResetKey(k => k + 1);
      closingRef.current = false;
    }, 0);
  };

  // Nuclear option: comprehensive touch system reset
  const forceFullTouchReset = () => {
    console.log('☢️ NUCLEAR TOUCH RESET - forcing complete responder system reset');
    
    // 1. Immediately squelch all touches
    setSquelchTouches(true);
    
    // 2. Force close everything
    setShowDiscordModal(false);
    setSettingsVisible(false);
    setVolumeModalVisible(false);
    
    // 3. Multiple reset waves with different timing strategies
    setTimeout(() => {
      console.log('☢️ Wave 1: Touch reset + squelch off');
      setTouchResetKey(k => k + 1);
      setSquelchTouches(false);
    }, 16); // One frame
    
    setTimeout(() => {
      console.log('☢️ Wave 2: Second touch reset');
      setTouchResetKey(k => k + 1);
    }, 50); // Multiple frames
    
    setTimeout(() => {
      console.log('☢️ Wave 3: Final touch reset');
      setTouchResetKey(k => k + 1);
    }, 200); // Longer delay to ensure everything is settled
  };

  const startSessionTimer = () => {
    stopSessionTimer();
    sessionTimerRef.current = setTimeout(async () => {
      try {
        if (browserOpenRef.current) {
          await WebBrowser.dismissBrowser();
          browserOpenRef.current = false;
        }
      } finally {
        requestAnimationFrame(() => closeAllOverlays());
      }
    }, SESSION_TIMEOUT_MS);
  };

  // Play menu music when HomeScreen is focused, stop when blurred
  useFocusEffect(
    React.useCallback(() => {
      setRefreshKey(prev => prev + 1);
      AudioManager.playMenuMusic();
      
      return () => {
        AudioManager.stopMusic();
      };
    }, [])
  );

  // Close on app background/lock + handle resume from background
  useEffect(() => {
    const sub = AppState.addEventListener('change', (next) => {
      console.log('🔄 AppState changed to:', next);
      
      if (next !== 'active') {
        // Going to background/locked: mark that we owe a post-resume reset
        console.log('📱 App backgrounding - setting reset pending');
        resumeResetPendingRef.current = true;
        if (browserOpenRef.current) {
          console.log('🌐 Dismissing browser on background');
          try { WebBrowser.dismissBrowser(); } catch {}
          browserOpenRef.current = false;
        }
        stopSessionTimer();
        // Close overlays now in case we return immediately (app switcher bounce)
        requestAnimationFrame(() => closeAllOverlays());
        return;
      }

      // Back to ACTIVE: ALWAYS do a reset to be safe
      console.log('🔄 App resuming to active');
      const wasBackgrounded = resumeResetPendingRef.current;
      resumeResetPendingRef.current = false;
      
      console.log('🛡️ Executing comprehensive reset (was backgrounded:', wasBackgrounded, ')');
      
      // Defensive extra dismiss in case the browser/activity was restored by OS
      try { WebBrowser.dismissBrowser(); } catch {}
      
      // Always do a comprehensive reset when returning to active
      InteractionManager.runAfterInteractions(() => {
        console.log('🔧 Running post-interaction reset');
        forceFullTouchReset();
      });
    });
    return () => sub.remove();
  }, []);

  // Start/stop the timer when Settings/Bug Report are visible
  useEffect(() => {
    const sessionActive =
      Boolean(settingsVisible) || Boolean(showDiscordModal) || browserOpenRef.current;
    if (sessionActive) startSessionTimer();
    else stopSessionTimer();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settingsVisible, showDiscordModal]);

  // Navigate to game mode
  const handleGameModeSelect = (mode) => {
    navigation.navigate('Game', { 
      gameId: 'flush-frenzy',
      gameMode: mode 
    });
  };
  const navigateToGame = (gameMode) => {
    handleGameModeSelect(gameMode);
  };

  const getVolumeIcon = () => {
    const { musicMuted, sfxMuted } = useAudioStore.getState();
    
    if (musicMuted && sfxMuted) return 'volume-mute';
    if (musicMuted || sfxMuted) return 'volume-low';
    return 'volume-high';
  };

  // Settings and Discord functions
  const handleSubmitBugReport = () => {
    setSettingsVisible(false);
    setShowDiscordModal(true);
  };

  const handlePrivacyPolicy = async () => {
    try {
      await WebBrowser.openBrowserAsync('https://virtuixtech.com/privacy.html');
    } catch (error) {
      Alert.alert('Error', 'Could not open Privacy Policy. Please check your internet connection.');
    }
  };

  const openBugfixes = async () => {
    try {
      browserOpenRef.current = true;
      // Make sure a session timer is running while the browser is up
      startSessionTimer();
      await WebBrowser.openBrowserAsync(BUGFIX_URL, {
        // keep options minimal for broad compatibility
        showTitle: true,
        enableBarCollapsing: true,
        dismissButtonStyle: 'done',
      });
    } finally {
      // Whether user closed it or we dismissed it, clean up and close settings
      browserOpenRef.current = false;
      stopSessionTimer();
      closeAllOverlays();
    }
  };



  const sendDiscordMessage = async () => {
    if (!discordMessage.trim()) {
      Alert.alert('Error', 'Please enter a message to send');
      return;
    }

    try {
      const response = await fetch("https://7w2qi2iizkwhlpua3yoatym3xe0xdvnz.lambda-url.us-east-1.on.aws/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-bug-report-key": process.env.EXPO_PUBLIC_BUG_REPORT_KEY,
        },
        body: JSON.stringify({
          message: discordMessage,
        }),
      });

      if (response.ok) {
        Alert.alert('Success', 'Bug report submitted successfully!');
        setDiscordMessage('');
        setShowDiscordModal(false);
      } else {
        Alert.alert('Error', 'Failed to submit bug report');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to submit bug report');
    }
  };

  return (
    <ImageBackground 
      source={require('../../assets/background_.png')} 
      style={styles.container}
      resizeMode="stretch"
    >
      <View key={`touch-${touchResetKey}`} style={styles.content} pointerEvents={squelchTouches ? "none" : "auto"}>
        {/* Header moved to top with increased size */}
        <TouchableOpacity 
          style={styles.header}
          onPress={() => {
            console.log('🐛 DEBUG: Manual touch reset triggered');
            forceFullTouchReset();
          }}
          activeOpacity={1}
        >
          <Image 
            source={require('../../assets/header.png')} 
            style={styles.headerImage}
            resizeMode="contain"
          />
        </TouchableOpacity>

        {/* Under header image */}
        <View style={styles.underHeaderContainer}>
          <Image 
            source={require('../../assets/under-header.png')} 
            style={styles.underHeaderImage}
            resizeMode="stretch"
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
                <HighScoreLabel key={`${mode.id}-${refreshKey}`} mode={mode.id} style={styles.highScoreText} />
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Top corner actions */}
        <View style={styles.topBar} pointerEvents="box-none">
          <TouchableOpacity style={styles.topLeft} onPress={() => setVolumeModalVisible(true)}>
            <Ionicons name={getVolumeIcon()} size={26} color="#FFFFFF" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.topRight} onPress={() => setSettingsVisible(true)}>
            <Ionicons name="settings-sharp" size={26} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* Volume Control Modal */}
        <VolumeControlModal
          visible={volumeModalVisible}
          onClose={() => setVolumeModalVisible(false)}
        />

        {/* Settings Modal */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={settingsVisible}
          statusBarTranslucent
          onDismiss={() => setTimeout(() => setTouchResetKey(k => k + 1), 0)}
          onRequestClose={() => setSettingsVisible(false)}
        >
          <View 
            style={styles.modalOverlay}
            pointerEvents={settingsVisible ? 'auto' : 'none'}
          >
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Settings</Text>
              <TouchableOpacity
                style={styles.menuItem}
                onPress={handleSubmitBugReport}
              >
                <Text style={styles.menuItemText}>Submit Bug Report</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.menuItem}
                onPress={openBugfixes}
              >
                <Text style={styles.menuItemText}>Review Bug Fixes</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.menuItem}
                onPress={handlePrivacyPolicy}
              >
                <Text style={styles.menuItemText}>Privacy Policy</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setSettingsVisible(false)}
              >
                <Text style={styles.closeButtonText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* Discord Message Modal */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={showDiscordModal}
          statusBarTranslucent
          onDismiss={() => setTimeout(() => setTouchResetKey(k => k + 1), 0)}
          onRequestClose={() => setShowDiscordModal(false)}
        >
          <View 
            style={styles.modalOverlay}
            pointerEvents={showDiscordModal ? 'auto' : 'none'}
          >
            <View style={styles.modalContent}>
              {/* Buttons at the top */}
              <View style={styles.buttonRow}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={() => setShowDiscordModal(false)}
                >
                  <Text style={styles.modalButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, styles.sendButton]}
                  onPress={sendDiscordMessage}
                >
                  <Text style={styles.modalButtonText}>Send</Text>
                </TouchableOpacity>
              </View>
              
              <Text style={styles.inputLabel}>Message:</Text>
              <TextInput
                style={[styles.textInput, styles.messageInput]}
                placeholder="Send any bug reports or just a thumbs up if you enjoyed Flush Frenzy!"
                placeholderTextColor="#666"
                value={discordMessage}
                onChangeText={setDiscordMessage}
                multiline
                numberOfLines={3}
              />
              <View style={styles.disclaimerContainer}>
                <Text style={styles.disclaimerText}>
                  We do not collect personal information such as your name, email, device ID, or location. Messages are securely transmitted through our server and delivered to our support inbox. We do not log IP addresses or metadata. Please do not include personal information in your message. For complete details, please review our{' '}
                </Text>
                <TouchableOpacity onPress={handlePrivacyPolicy}>
                  <Text style={[styles.disclaimerText, styles.privacyPolicyLink]}>
                    Privacy Policy
                  </Text>
                </TouchableOpacity>
                <Text style={styles.disclaimerText}>.</Text>
              </View>
            </View>
          </View>
        </Modal>
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
    paddingTop: 200,
  },
  headerImage: {
    width: width * 1.397, // Increased by 15% from 1.215
    height: height * 0.466, // Increased by 15% from 0.405
  },
  underHeaderContainer: {
    alignItems: 'center',
    marginTop: 65,
    marginBottom: 5,
  },
  underHeaderImage: {
    width: width * 0.75,
    height: 120,
  },
  gameModesContainer: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingTop: 0,
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
  topBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 20,
    height: 40,
  },
  topLeft: {
    position: 'absolute',
    left: 20,
    top: 0,
  },
  topRight: {
    position: 'absolute',
    right: 20,
    top: 0,
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
    fontWeight: '800',
    marginBottom: 8,
    color: '#FFF8E1',
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.4)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 3,
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
  // Modal styles
  modalContent: {
    backgroundColor: '#ff8107', // Orange background
    borderRadius: 25,
    padding: 35,
    width: width * 0.85,
    maxHeight: height * 0.75,
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#000000', // Black border
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 10,
    marginTop: -180, // Move the modal up closer to the top
  },
  menuItem: {
    backgroundColor: '#3B82F6', // Darker blue buttons
    padding: 18,
    borderRadius: 15,
    marginVertical: 8,
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#000000', // Black border
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
    width: '85%', // Smaller width
    alignSelf: 'center',
  },
  menuItemText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  closeButton: {
    backgroundColor: '#3B82F6', // Darker blue close button
    padding: 18,
    borderRadius: 15,
    marginTop: 50,
    width: '85%', // Smaller width
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#000000', // Black border
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
    alignSelf: 'center',
  },
  closeButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  inputLabel: {
    color: '#FFFFFF', // White text for contrast
    fontSize: 15,
    fontWeight: '700',
    marginTop: 20,
    marginBottom: 8,
    alignSelf: 'flex-start',
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  textInput: {
    backgroundColor: '#FFFFFF', // White background
    borderRadius: 12,
    padding: 15,
    color: '#1E40AF', // Medium blue text
    fontSize: 15,
    borderWidth: 2,
    borderColor: '#60A5FA', // Lighter blue border
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  messageInput: {
    height: 90,
    textAlignVertical: 'top',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 20,
    marginBottom: 20,
  },
  modalButton: {
    flex: 1,
    padding: 18,
    borderRadius: 15,
    marginHorizontal: 8,
    alignItems: 'center',
    borderWidth: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  cancelButton: {
    backgroundColor: '#6B7280', // Gray cancel button
    borderColor: '#4B5563',
  },
  sendButton: {
    backgroundColor: '#3B82F6', // Darker blue send button
    borderColor: '#000000', // Black border
  },
  disclaimerContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 15,
  },
  disclaimerText: {
    fontSize: 11,
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: 14,
    fontStyle: 'italic',
    opacity: 0.8,
  },
  privacyPolicyLink: {
    textDecorationLine: 'underline',
    color: '#4da3ff',
  },
});

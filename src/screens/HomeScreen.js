import React, { useState, useEffect, useRef } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
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
  DevSettings,
} from 'react-native';
import WebViewModal from '../components/WebViewModal';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { HighScoreLabel } from '../components/HighScoreLabel';
import VolumeControlModal from '../components/VolumeControlModal';
import LeaderboardModal from '../leaderboard/LeaderboardModal';
import { AudioManager } from '../audio/AudioManager';
import { useAudioStore } from '../audio/AudioStore';
import { Accelerometer } from 'expo-sensors';

import { 
  isTablet, 
  getResponsiveSize, 
  getResponsivePadding, 
  getResponsiveMargin,
  getContainerWidth,
  getGameModeCardWidth,
  getHeaderImageWidth,
  getHeaderImageHeight,
  responsiveStyles 
} from '../utils/responsiveLayout';

const { width, height } = Dimensions.get('window');

const GAME_MODES = [
  {
    id: 'endless-plunge',
    title: 'ENDLESS PLUNGE',
    subtitle: 'BEAT THE CLOCK',
    imageSource: require('../../assets/button-endless.png'),
  },
  {
    id: 'quick-flush',
    title: 'PRACTICE MODE',
    subtitle: 'FREE PLAY',
    imageSource: require('../../assets/button-practice.png'),
  },
  {
    id: 'touchless-toss',
    title: 'TOUCHLESS TOSS',
    subtitle: 'ACCESSIBILITY MODE',
    imageSource: require('../../assets/button-touchless.png'),
  },
];

export default function HomeScreen({ navigation, registerCleanup }) {
  const [volumeModalVisible, setVolumeModalVisible] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  
  // Settings and Discord state
  const [settingsVisible, setSettingsVisible] = useState(false);
  const [discordMessage, setDiscordMessage] = useState('');
  const [showDiscordModal, setShowDiscordModal] = useState(false);
  
  // WebView modal state
  const [webViewVisible, setWebViewVisible] = useState(false);
  const [webViewUrl, setWebViewUrl] = useState('');
  const [webViewTitle, setWebViewTitle] = useState('');

  // Leaderboard modal state
  const [leaderboardVisible, setLeaderboardVisible] = useState(false);
  const [leaderboardGameMode, setLeaderboardGameMode] = useState('endless-plunge');

  // Add refs to track current state for cleanup (fixes stale closure problem)
  const settingsVisibleRef = useRef(false);
  const showDiscordModalRef = useRef(false);
  const volumeModalVisibleRef = useRef(false);
  const webViewVisibleRef = useRef(false);

  // Bug fixes session timeout
  const BUGFIX_URL = 'https://virtuixtech.com/apps/flushfrenzy/bugfixes.html';
  const BUGFIX_ADMIN_URL = 'https://virtuixtech.com/apps/flushfrenzy/bugfixes_admin.html';
  const SESSION_TIMEOUT_MS = 1_200_000; // 20 min hard cap
  const IDLE_TIMEOUT_MS = 180_000;      // 3 min idle (no motion/touch)
  const ACCEL_MOTION_THRESHOLD = 0.03;  // g-force delta to count as motion

  const sessionTimerRef = useRef(null);
  const idleTimerRef = useRef(null);
  const prevAccelRef = useRef(null);
  const accelSubscriptionRef = useRef(null);

  const stopSessionTimer = () => {
    if (sessionTimerRef.current) {
      clearTimeout(sessionTimerRef.current);
      sessionTimerRef.current = null;
    }
  };

  const closeAllOverlays = () => {
    // Force close regardless of current state
    if (settingsVisibleRef.current) {
      setSettingsVisible(false);
      settingsVisibleRef.current = false;
    }
    
    if (showDiscordModalRef.current) {
      setShowDiscordModal(false);
      showDiscordModalRef.current = false;
    }
    
    if (volumeModalVisibleRef.current) {
      setVolumeModalVisible(false);
      volumeModalVisibleRef.current = false;
    }
    
    if (webViewVisibleRef.current) {
      setWebViewVisible(false);
      webViewVisibleRef.current = false;
    }
    
    setDiscordMessage('');
    
    // Note: No menu music to resume (music only plays in-game)
  };

  const startSessionTimer = () => {
    stopSessionTimer();
    sessionTimerRef.current = setTimeout(() => {
      closeAllOverlays();
    }, SESSION_TIMEOUT_MS);
  };

  // Idle timer (resets on motion or touch)
  const stopIdleTimer = () => {
    if (idleTimerRef.current) {
      clearTimeout(idleTimerRef.current);
      idleTimerRef.current = null;
    }
  };

  const startIdleTimer = () => {
    stopIdleTimer();
    idleTimerRef.current = setTimeout(() => {
      closeAllOverlays();
    }, IDLE_TIMEOUT_MS);
  };

  const resetIdleTimer = () => {
    startIdleTimer();
  };

  // Accelerometer subscription for idle detection
  const startAccelerometer = () => {
    prevAccelRef.current = null;
    Accelerometer.setUpdateInterval(500); // 2 Hz, low battery impact
    accelSubscriptionRef.current = Accelerometer.addListener(({ x, y, z }) => {
      const prev = prevAccelRef.current;
      if (prev) {
        const delta = Math.abs(x - prev.x) + Math.abs(y - prev.y) + Math.abs(z - prev.z);
        if (delta > ACCEL_MOTION_THRESHOLD) {
          resetIdleTimer();
        }
      }
      prevAccelRef.current = { x, y, z };
    });
  };

  const stopAccelerometer = () => {
    if (accelSubscriptionRef.current) {
      accelSubscriptionRef.current.remove();
      accelSubscriptionRef.current = null;
    }
    prevAccelRef.current = null;
  };

  // Touch handler for overlay views — resets idle timer without stealing touches
  const handleOverlayTouchCapture = () => {
    resetIdleTimer();
    return false;
  };

  // Refresh high scores when HomeScreen is focused
  // Note: Menu music disabled - music only plays during gameplay
  useFocusEffect(
    React.useCallback(() => {
      setRefreshKey(prev => prev + 1);
      // AudioManager.playMenuMusic(); // Disabled: music only plays in-game
      
      return () => {
        AudioManager.stopMusic();
      };
    }, [])
  );

  // Register cleanup with App-level handler
  useEffect(() => {
    if (!registerCleanup) return;
    
    const cleanup = () => {
      // Immediate cleanup when app backgrounds
      stopSessionTimer();
      stopIdleTimer();
      stopAccelerometer();

      // Use a fresh closure that accesses current refs (fixes stale closure)
      const forceCloseModals = () => {
        setSettingsVisible(false);
        setShowDiscordModal(false);
        setVolumeModalVisible(false);
        setWebViewVisible(false);
        setDiscordMessage('');
        settingsVisibleRef.current = false;
        showDiscordModalRef.current = false;
        volumeModalVisibleRef.current = false;
        webViewVisibleRef.current = false;
      };
      
      forceCloseModals();
    };
    
    const unregister = registerCleanup(cleanup);
    return unregister;
  }, [registerCleanup]); // Remove dependencies that could cause stale closures

  // Start/stop timers and accelerometer when Settings/Bug Report/WebView are visible
  useEffect(() => {
    const sessionActive =
      Boolean(settingsVisible) || Boolean(showDiscordModal) || Boolean(webViewVisible);
    if (sessionActive) {
      startSessionTimer();
      startIdleTimer();
      startAccelerometer();
    } else {
      stopSessionTimer();
      stopIdleTimer();
      stopAccelerometer();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settingsVisible, showDiscordModal, webViewVisible]);

  // Update refs whenever state changes (fixes stale closure problem)
  useEffect(() => {
    settingsVisibleRef.current = settingsVisible;
  }, [settingsVisible]);
  
  useEffect(() => {
    showDiscordModalRef.current = showDiscordModal;
  }, [showDiscordModal]);
  
  useEffect(() => {
    volumeModalVisibleRef.current = volumeModalVisible;
  }, [volumeModalVisible]);
  
  useEffect(() => {
    webViewVisibleRef.current = webViewVisible;
  }, [webViewVisible]);


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

  const handlePrivacyPolicy = () => {
    setSettingsVisible(false);
    setWebViewUrl('https://virtuixtech.com/privacy.html');
    setWebViewTitle('Privacy Policy');
    setWebViewVisible(true);
  };

  const openBugfixes = () => {
    setSettingsVisible(false);
    setWebViewUrl(BUGFIX_URL);
    setWebViewTitle('Updates & Fixes');
    setWebViewVisible(true);
  };

  const openBugfixesAdmin = () => {
    setSettingsVisible(false);
    setWebViewUrl(BUGFIX_ADMIN_URL);
    setWebViewTitle('Admin - Updates & Fixes');
    setWebViewVisible(true);
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
      style={[styles.container, isTablet && { alignItems: 'center' }]}
      resizeMode="stretch"
    >
      <View style={[styles.content, isTablet && responsiveStyles.content]}>
        {/* Header moved to top with increased size */}
        <View style={styles.header}>
          <Image 
            source={require('../../assets/header.png')} 
            style={[styles.headerImage, isTablet && responsiveStyles.headerImage]}
            resizeMode="contain"
          />
        </View>

        {/* Under header image */}
        <View style={styles.underHeaderContainer}>
          <Image 
            source={require('../../assets/under-header.png')} 
            style={[styles.underHeaderImage, isTablet && responsiveStyles.underHeaderImage]}
            resizeMode="stretch"
          />
        </View>

        {/* Game Modes - moved down to allow room for header */}
        <View style={[styles.gameModesContainer, isTablet && responsiveStyles.gameModesContainer]}>
          {GAME_MODES.map((mode, index) => (
            <TouchableOpacity
              key={mode.id}
              style={[styles.gameModeCard, isTablet && responsiveStyles.gameModeCard]}
              onPress={() => navigateToGame(mode.id)}
              onLongPress={index === GAME_MODES.length - 1 ? openBugfixesAdmin : undefined}
              delayLongPress={1000}
              activeOpacity={0.8}
            >
              <Image 
                source={mode.imageSource}
                style={[styles.gameModeImage, isTablet && responsiveStyles.gameModeImage]}
                resizeMode="contain"
              />
              <View style={[styles.highScoreContainer, isTablet && { 
                bottom: 20, 
                right: 20,
                paddingHorizontal: 16,
                paddingVertical: 12,
                borderRadius: 25 
              }]}>
                <Ionicons 
                  name="trophy" 
                  size={isTablet ? 20 : 16} 
                  color="#FF6B35" 
                  style={styles.trophyIcon} 
                />
                <HighScoreLabel 
                  key={`${mode.id}-${refreshKey}`} 
                  mode={mode.id} 
                  style={[styles.highScoreText, isTablet && { fontSize: 16 }]} 
                />
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Leaderboard Button */}
        <TouchableOpacity
          style={styles.leaderboardButton}
          onPress={() => setLeaderboardVisible(true)}
          activeOpacity={0.8}
        >
          <Ionicons name="trophy" size={20} color="#FFD700" />
          <Text style={styles.leaderboardButtonText}>Leaderboard</Text>
        </TouchableOpacity>

        {/* Top corner actions */}
        <View style={[styles.topBar, isTablet && { 
          left: '50%', 
          transform: [{ translateX: -60 }],
          top: isTablet ? 60 : 40,
          flexDirection: 'row',
          gap: 60,
          width: 'auto'
        }]} pointerEvents="box-none">
          <TouchableOpacity style={[styles.topLeft, isTablet && { position: 'relative', left: 'auto' }]} onPress={() => setVolumeModalVisible(true)}>
            <Ionicons 
              name={getVolumeIcon()} 
              size={isTablet ? 32 : 26} 
              color="#FFFFFF" 
            />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.topRight, isTablet && { position: 'relative', right: 'auto' }]} onPress={() => {
            setSettingsVisible(true);
          }}>
            <Ionicons 
              name="settings-sharp" 
              size={isTablet ? 32 : 26} 
              color="#FFFFFF" 
            />
          </TouchableOpacity>
        </View>

        {/* Volume Control Modal */}
        <VolumeControlModal
          visible={volumeModalVisible}
          onClose={() => setVolumeModalVisible(false)}
        />

        {/* Settings Custom Overlay - Replace Modal to fix touch issues */}
        {settingsVisible && (
          <View style={[StyleSheet.absoluteFill, { zIndex: 9999 }]} onStartShouldSetResponderCapture={handleOverlayTouchCapture}>
            <View style={styles.modalOverlay}>
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>Settings</Text>
                <TouchableOpacity
                  style={[styles.menuItem, isTablet && { width: '95%', paddingHorizontal: 30 }]}
                  onPress={handleSubmitBugReport}
                >
                  <Text style={[styles.menuItemText, isTablet && { fontSize: 19 }]}>Submit Bug Report</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.menuItem, isTablet && { width: '98%', paddingHorizontal: 35 }]}
                  onPress={openBugfixes}
                  onLongPress={openBugfixesAdmin}
                  delayLongPress={1000}
                >
                  <Text style={[styles.menuItemText, isTablet && { fontSize: 18 }]}>Review Updates & Fixes</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.menuItem, isTablet && { width: '95%', paddingHorizontal: 30 }]}
                  onPress={handlePrivacyPolicy}
                >
                  <Text style={[styles.menuItemText, isTablet && { fontSize: 19 }]}>Privacy Policy</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={() => {
                    setSettingsVisible(false);
                  }}
                >
                  <Text style={styles.closeButtonText}>Close</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}

        {/* Discord Message Custom Overlay - Replace Modal to fix touch issues */}
        {showDiscordModal && (
            <View style={[StyleSheet.absoluteFill, { zIndex: 9999 }]} onStartShouldSetResponderCapture={handleOverlayTouchCapture}>
            <GestureHandlerRootView style={StyleSheet.absoluteFill}>
              <View style={styles.modalOverlay}>
              <View style={styles.modalContent}>
                {/* Buttons at the top */}
                <View style={styles.buttonRow}>
                  <TouchableOpacity
                    style={[styles.modalButton, styles.cancelButton]}
                    onPress={() => {
                      setShowDiscordModal(false);
                    }}
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
            </GestureHandlerRootView>
          </View>
        )}

        {/* WebView Modal for Privacy Policy and Bug Fixes */}
        <WebViewModal
          visible={webViewVisible}
          url={webViewUrl}
          title={webViewTitle}
          onClose={() => {
            setWebViewVisible(false);
          }}
          onActivity={resetIdleTimer}
        />

        {/* Leaderboard Modal with Game Mode Tabs */}
        {leaderboardVisible && (
          <View style={[StyleSheet.absoluteFill, { zIndex: 9998 }]}>
            {/* Game Mode Tabs */}
            <View style={styles.leaderboardTabsContainer}>
              <TouchableOpacity
                style={[
                  styles.leaderboardTab,
                  leaderboardGameMode === 'endless-plunge' && styles.leaderboardTabActive
                ]}
                onPress={() => setLeaderboardGameMode('endless-plunge')}
              >
                <Text style={[
                  styles.leaderboardTabText,
                  leaderboardGameMode === 'endless-plunge' && styles.leaderboardTabTextActive
                ]}>Endless Plunge</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.leaderboardTab,
                  leaderboardGameMode === 'quick-flush' && styles.leaderboardTabActive
                ]}
                onPress={() => setLeaderboardGameMode('quick-flush')}
              >
                <Text style={[
                  styles.leaderboardTabText,
                  leaderboardGameMode === 'quick-flush' && styles.leaderboardTabTextActive
                ]}>Practice</Text>
              </TouchableOpacity>
            </View>
            <LeaderboardModal
              visible={true}
              onClose={() => setLeaderboardVisible(false)}
              gameMode={leaderboardGameMode}
            />
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
    paddingTop: 200,
  },
  headerImage: {
    width: width * 1.397, // Increased by 15% from 1.215
    height: height * 0.466, // Increased by 15% from 0.405
  },
  underHeaderContainer: {
    alignItems: 'center',
    marginTop: 45,
    marginBottom: 0,
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
    height: 140,
    marginVertical: -14,
  },
  gameModeImage: {
    width: width * 0.65,
    height: 210,
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
  leaderboardButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(45, 27, 78, 0.95)',
    borderRadius: 25,
    paddingHorizontal: 24,
    paddingVertical: 12,
    marginTop: 24,
    marginBottom: 40,
    borderWidth: 2,
    borderColor: '#FFD700',
    gap: 8,
    alignSelf: 'center',
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 6,
  },
  leaderboardButtonText: {
    color: '#FFD700',
    fontSize: 16,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  leaderboardTabsContainer: {
    position: 'absolute',
    top: 50,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    zIndex: 10000,
    paddingHorizontal: 20,
  },
  leaderboardTab: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: 'rgba(30, 30, 46, 0.9)',
    borderWidth: 2,
    borderColor: '#3D3D4D',
  },
  leaderboardTabActive: {
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
    borderColor: '#FFD700',
  },
  leaderboardTabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#888',
  },
  leaderboardTabTextActive: {
    color: '#FFD700',
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
    justifyContent: 'flex-start',
    paddingTop: 80,
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
    maxHeight: height * 0.55,
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#000000', // Black border
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 10,
  },
  menuItem: {
    backgroundColor: '#3B82F6', // Darker blue buttons
    paddingHorizontal: 20, // Increased horizontal padding
    paddingVertical: 18,
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
    width: '95%', // Increased width to 95% to prevent text wrapping
    alignSelf: 'center',
  },
  menuItemText: {
    color: '#FFFFFF',
    fontSize: 16, // Reduced from 17 to 16 to prevent wrapping
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
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
  
  // Hidden menu state
  const [hiddenMenuVisible, setHiddenMenuVisible] = useState(false);
  const [holdTimer, setHoldTimer] = useState(null);
  const [isHolding, setIsHolding] = useState(false);
  const [longPressDetected, setLongPressDetected] = useState(false);
  const [discordWebhook, setDiscordWebhook] = useState('https://discord.com/api/webhooks/REDACTED/REDACTED');
  const [discordMessage, setDiscordMessage] = useState('');
  const [showDiscordModal, setShowDiscordModal] = useState(false);

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

  // Hidden menu functions
  const handleLongPressStart = () => {
    setIsHolding(true);
    setLongPressDetected(false);
    const timer = setTimeout(() => {
      setHiddenMenuVisible(true);
      setIsHolding(false);
      setLongPressDetected(true);
    }, 6000); // 6 seconds
    setHoldTimer(timer);
  };

  const handleLongPressEnd = () => {
    if (holdTimer) {
      clearTimeout(holdTimer);
      setHoldTimer(null);
    }
    setIsHolding(false);
    // Reset the long press flag after a short delay
    setTimeout(() => setLongPressDetected(false), 100);
  };

  const handleMenuItemPress = (itemNumber) => {
    switch(itemNumber) {
      case 1:
        sendAutoDiscordMessage('Hi!');
        break;
      case 2:
        sendAutoDiscordMessage('Can I have a gift please?');
        break;
      case 3:
        sendAutoDiscordMessage('Can I have candy please?');
        break;
      case 4:
        sendAutoDiscordMessage('Can you get on roblox?');
        break;
      case 5:
        sendAutoDiscordMessage('IMYJALB');
        break;
      case 6:
        setShowDiscordModal(true);
        break;
    }
    setHiddenMenuVisible(false);
  };

  const sendAutoDiscordMessage = async (message) => {
    try {
      const response = await fetch(discordWebhook, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: message,
          username: 'Toilet Paper Toss Bot',
          avatar_url: 'https://em-content.zobj.net/source/microsoft-teams/363/roll-of-paper_1f9fb.png',
        }),
      });

      if (response.ok) {
        Alert.alert('Success', 'You have generated one Ad View - Thank you!');
      } else {
        Alert.alert('Error', 'Failed to send message to Discord');
      }
    } catch (error) {
      console.error('Discord webhook error:', error);
      Alert.alert('Error', 'Failed to send message to Discord');
    }
  };

  const sendDiscordMessage = async () => {
    if (!discordWebhook.trim()) {
      Alert.alert('Error', 'Please enter a Discord webhook URL');
      return;
    }

    if (!discordMessage.trim()) {
      Alert.alert('Error', 'Please enter a message to send');
      return;
    }

    try {
      const response = await fetch(discordWebhook, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: discordMessage,
          username: 'Toilet Paper Toss Bot',
          avatar_url: 'https://em-content.zobj.net/source/microsoft-teams/363/roll-of-paper_1f9fb.png',
        }),
      });

      if (response.ok) {
        Alert.alert('Success', 'You have generated one Ad View - Thank you!');
        setDiscordMessage('');
        setShowDiscordModal(false);
      } else {
        Alert.alert('Error', 'Failed to send message to Discord');
      }
    } catch (error) {
      console.error('Discord webhook error:', error);
      Alert.alert('Error', 'Failed to send message to Discord');
    }
  };

  return (
    <ImageBackground 
      source={require('../../assets/background_.png')} 
      style={styles.container}
      resizeMode="stretch"
    >
      <View style={styles.content}>
        {/* Header moved to top with increased size */}
        <Pressable 
          style={styles.header}
          onPressIn={handleLongPressStart}
          onPressOut={handleLongPressEnd}
        >
          <Image 
            source={require('../../assets/header.png')} 
            style={styles.headerImage}
            resizeMode="contain"
          />
        </Pressable>

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

        {/* Hidden Menu Modal */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={hiddenMenuVisible}
          onRequestClose={() => setHiddenMenuVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>How Did You Find This?!</Text>
              <Text style={styles.modalSubtitle}>Help support small creators, each "Donate" generates one ad view!</Text>
              <View style={styles.menuItems}>
                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={() => handleMenuItemPress(1)}
                >
                  <Text style={styles.menuItemText}>Say Hi!</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={() => handleMenuItemPress(2)}
                >
                  <Text style={styles.menuItemText}>Donate: Gift!</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={() => handleMenuItemPress(3)}
                >
                  <Text style={styles.menuItemText}>Donate: Candy!</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={() => handleMenuItemPress(4)}
                >
                  <Text style={styles.menuItemText}>Donate: Roblox!</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={() => handleMenuItemPress(5)}
                >
                  <Text style={styles.menuItemText}>Donate: IMYJALB</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={() => handleMenuItemPress(6)}
                >
                  <Text style={styles.menuItemText}>Custom Message</Text>
                </TouchableOpacity>
              </View>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setHiddenMenuVisible(false)}
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
          onRequestClose={() => setShowDiscordModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>💬 Send Discord Message</Text>
              
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
              
              <Text style={styles.inputLabel}>Discord Webhook URL:</Text>
              <TextInput
                style={styles.textInput}
                placeholder="https://discord.com/api/webhooks/..."
                placeholderTextColor="#666"
                value={discordWebhook}
                onChangeText={setDiscordWebhook}
                autoCapitalize="none"
                autoCorrect={false}
              />
              
              <Text style={styles.inputLabel}>Message:</Text>
              <TextInput
                style={[styles.textInput, styles.messageInput]}
                placeholder="🧻💨 Check out this awesome toilet paper toss game!"
                placeholderTextColor="#666"
                value={discordMessage}
                onChangeText={setDiscordMessage}
                multiline
                numberOfLines={3}
              />
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
    paddingTop: 80,
  },
  headerImage: {
    width: width * 0.9,
    height: height * 0.3,
  },
  underHeaderContainer: {
    alignItems: 'center',
    marginTop: -20,
    marginBottom: 16,
  },
  underHeaderImage: {
    width: width * 0.75,
    height: 120,
  },
  gameModesContainer: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingTop: 15,
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
  // Hidden menu styles
  modalContent: {
    backgroundColor: '#ff8107', // New orange background
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
  },
  modalSubtitle: {
    fontSize: 15,
    color: '#FFFFFF', // White text for contrast
    textAlign: 'center',
    marginBottom: 15,
    fontStyle: 'italic',
    lineHeight: 20,
    fontWeight: '600',
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  menuItems: {
    width: '100%',
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
});

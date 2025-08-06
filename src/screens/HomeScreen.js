import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ImageBackground,
  Animated,
  Dimensions,
} from 'react-native';

const { width, height } = Dimensions.get('window');

export default function HomeScreen({ navigation }) {
  const scaleAnim = new Animated.Value(1);

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.95,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  const navigateToGameSelect = () => {
    navigation.navigate('GameSelect');
  };

  return (
    <View style={styles.container}>
      <ImageBackground
        source={{ uri: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8ZGVmcz4KICAgIDxsaW5lYXJHcmFkaWVudCBpZD0iZ3JhZGllbnQiIHgxPSIwJSIgeTE9IjAlIiB4Mj0iMTAwJSIgeTI9IjEwMCUiPgogICAgICA8c3RvcCBvZmZzZXQ9IjAlIiBzdG9wLWNvbG9yPSIjNDI4NUY0IiBzdG9wLW9wYWNpdHk9IjAuMSIgLz4KICAgICAgPHN0b3Agb2Zmc2V0PSIxMDAlIiBzdG9wLWNvbG9yPSIjMzQwNEZGIiBzdG9wLW9wYWNpdHk9IjAuMSIgLz4KICAgIDwvbGluZWFyR3JhZGllbnQ+CiAgPC9kZWZzPgogIDxyZWN0IHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIiBmaWxsPSJ1cmwoI2dyYWRpZW50KSIgLz4KICA8Y2lyY2xlIGN4PSIyMCIgY3k9IjIwIiByPSIzIiBmaWxsPSJ3aGl0ZSIgb3BhY2l0eT0iMC4zIiAvPgogIDxjaXJjbGUgY3g9IjgwIiBjeT0iODAiIHI9IjIiIGZpbGw9IndoaXRlIiBvcGFjaXR5PSIwLjMiIC8+Cjwvc3ZnPg==' }}
        style={styles.backgroundImage}
        resizeMode="repeat"
      >
        <View style={styles.overlay}>
          <View style={styles.header}>
            <Text style={styles.title}>🚽 TOILET OLYMPICS 🏆</Text>
            <Text style={styles.subtitle}>The Ultimate Bathroom Games!</Text>
          </View>

          <View style={styles.content}>
            <View style={styles.gameIcon}>
              <Text style={styles.iconText}>🚽</Text>
              <Text style={styles.iconText}>🏃‍♂️</Text>
              <Text style={styles.iconText}>🎯</Text>
            </View>

            <Animated.View style={[styles.playButton, { transform: [{ scale: scaleAnim }] }]}>
              <TouchableOpacity
                onPressIn={handlePressIn}
                onPressOut={handlePressOut}
                onPress={navigateToGameSelect}
                style={styles.playButtonInner}
                activeOpacity={0.8}
              >
                <Text style={styles.playButtonText}>START GAMES</Text>
                <Text style={styles.playButtonSubtext}>🎮 Ready to compete?</Text>
              </TouchableOpacity>
            </Animated.View>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Compete in hilarious toilet-themed challenges!</Text>
          </View>
        </View>
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'space-between',
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  header: {
    alignItems: 'center',
    marginTop: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#2E86AB',
    textAlign: 'center',
    marginBottom: 10,
    textShadowColor: 'rgba(0, 0, 0, 0.1)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  subtitle: {
    fontSize: 18,
    color: '#5A5A5A',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  gameIcon: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginBottom: 50,
    width: '60%',
  },
  iconText: {
    fontSize: 40,
    textShadowColor: 'rgba(0, 0, 0, 0.1)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  playButton: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  playButtonInner: {
    backgroundColor: '#FF6B6B',
    paddingVertical: 20,
    paddingHorizontal: 40,
    borderRadius: 25,
    alignItems: 'center',
    minWidth: width * 0.6,
  },
  playButtonText: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  playButtonSubtext: {
    color: 'white',
    fontSize: 14,
    opacity: 0.9,
  },
  footer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  footerText: {
    fontSize: 16,
    color: '#7A7A7A',
    textAlign: 'center',
    fontStyle: 'italic',
  },
});

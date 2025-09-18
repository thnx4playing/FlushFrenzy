import React, { useEffect, useState, useRef, useCallback } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { CommonActions } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Provider as PaperProvider } from 'react-native-paper';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { AppState, AppRegistry } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Import screens
import HomeScreen from './src/screens/HomeScreen';
import GameScreen from './src/screens/GameScreen';
import { AudioManager } from './src/audio/AudioManager';
import { useAudioStore } from './src/audio/AudioStore';

const Stack = createStackNavigator();

export default function App() {
  // App-level touch reset for fixing dead buttons after backgrounding
  const [appRemountKey, setAppRemountKey] = useState(0);
  const [showApp, setShowApp] = useState(true); // Add this for complete rebuild
  const backgroundedRef = useRef(false);
  
  // Navigation ref for resetting navigation state
  const navigationRef = useRef();
  
  // Cleanup registry for centralized background handling
  const cleanupCallbacks = useRef([]);

  const registerCleanup = useCallback((callback) => {
    cleanupCallbacks.current.push(callback);
    return () => {
      const index = cleanupCallbacks.current.indexOf(callback);
      if (index > -1) {
        cleanupCallbacks.current.splice(index, 1);
      }
    };
  }, []);

  // Initialize audio once at app startup
  useEffect(() => {
    AudioManager.init();
    
    // Reset audio settings to unmuted on every app launch
    const resetAudioOnStartup = async () => {
      try {
        console.log('App: Resetting audio to unmuted on app launch');
        useAudioStore.getState().resetToDefaults();
      } catch (error) {
        console.log('App: Error resetting audio settings:', error);
      }
    };
    
    resetAudioOnStartup();
    
    // Cleanup audio resources when app unmounts
    return () => {
      console.log('App: Cleaning up audio resources');
      AudioManager.dispose().catch(error => {
        console.log('App: Error disposing audio manager:', error);
      });
    };
  }, []);

  // App-level AppState handler for touch system reset
  useEffect(() => {
    const sub = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState !== 'active') {
        backgroundedRef.current = true;
        
        // IMMEDIATE cleanup when app backgrounds (restored since custom overlays work)
        cleanupCallbacks.current.forEach(callback => {
          try {
            callback();
          } catch (error) {
            // Silent error handling
          }
        });
        
      } else if (backgroundedRef.current) {
        // App is resuming from background - no special action needed since custom overlays work properly
        backgroundedRef.current = false;
      }
    });
    
    return () => sub.remove();
  }, []);

  // Conditionally render the entire app for complete rebuild
  if (!showApp) {
    return null; // Complete unmount - everything gets destroyed
  }

  return (
    <GestureHandlerRootView key={`gesture-${appRemountKey}`} style={{ flex: 1 }}>
      <SafeAreaProvider key={`safe-area-${appRemountKey}`}>
        <PaperProvider key={`paper-${appRemountKey}`}>
          <BottomSheetModalProvider key={`bottom-sheet-${appRemountKey}`}>
            <NavigationContainer ref={navigationRef} key={`nav-${appRemountKey}`}>
              <StatusBar style="light" hidden={true} />
              <Stack.Navigator
                key={`stack-${appRemountKey}`}
                initialRouteName="Home"
                screenOptions={{
                  headerShown: false,
                  gestureEnabled: true,
                }}
              >
                <Stack.Screen 
                  name="Home" 
                  options={{
                    title: 'Flush Frenzy',
                  }}
                >
                  {(props) => <HomeScreen {...props} key={`home-${appRemountKey}`} registerCleanup={registerCleanup} />}
                </Stack.Screen>
                <Stack.Screen 
                  name="Game" 
                  component={GameScreen}
                  options={{
                    title: 'Game',
                    headerShown: false,
                  }}
                />
              </Stack.Navigator>
            </NavigationContainer>
          </BottomSheetModalProvider>
        </PaperProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

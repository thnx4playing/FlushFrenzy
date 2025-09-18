import React, { useEffect, useState, useRef } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Provider as PaperProvider } from 'react-native-paper';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { AppState } from 'react-native';
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
  const backgroundedRef = useRef(false);

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
      console.log('🏗️ APP-LEVEL AppState changed to:', nextAppState);
      
      if (nextAppState !== 'active') {
        backgroundedRef.current = true;
        console.log('🏗️ APP-LEVEL: Marking backgrounded');
      } else if (backgroundedRef.current) {
        // Returning to active after being backgrounded
        console.log('🏗️ APP-LEVEL: Resuming from background - forcing app remount');
        backgroundedRef.current = false;
        
        // Force complete app remount to reset gesture handler and navigation
        setTimeout(() => {
          console.log('🏗️ APP-LEVEL: Executing app remount');
          setAppRemountKey(k => k + 1);
        }, 100);
      }
    });
    
    return () => sub.remove();
  }, []);

  return (
    <GestureHandlerRootView key={`app-remount-${appRemountKey}`} style={{ flex: 1 }}>
      <SafeAreaProvider>
        <PaperProvider>
          <BottomSheetModalProvider>
            <NavigationContainer key={`nav-${appRemountKey}`}>
              <StatusBar style="light" hidden={true} />
              <Stack.Navigator
            initialRouteName="Home"
            screenOptions={{
              headerShown: false,
              gestureEnabled: true,
            }}
          >
            <Stack.Screen 
              name="Home" 
              component={HomeScreen}
              options={{
                title: 'Flush Frenzy',
              }}
            />
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

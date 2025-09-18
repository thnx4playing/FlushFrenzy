import React, { useEffect, useState, useRef, useCallback } from 'react';
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
      console.log('🏗️ APP-LEVEL AppState changed to:', nextAppState);
      
      if (nextAppState !== 'active') {
        backgroundedRef.current = true;
        console.log('🏗️ APP-LEVEL: Marking backgrounded');
        
        // TEMPORARILY DISABLE cleanup to test if this is the issue
        // console.log('🏗️ APP-LEVEL: Executing immediate cleanup callbacks');
        // cleanupCallbacks.current.forEach(callback => {
        //   try {
        //     callback();
        //   } catch (error) {
        //     console.log('🏗️ APP-LEVEL: Cleanup callback error:', error);
        //   }
        // });
        
      } else if (backgroundedRef.current) {
        // Returning to active after being backgrounded
        console.log('🏗️ APP-LEVEL: Resuming from background - DELAYED app remount');
        backgroundedRef.current = false;
        
        // Wait longer to avoid conflicts with component-level resets
        setTimeout(() => {
          console.log('🏗️ APP-LEVEL: Executing DELAYED app remount');
          setAppRemountKey(k => k + 1);
        }, 500); // Wait 500ms to avoid timing conflicts
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
              options={{
                title: 'Flush Frenzy',
              }}
            >
              {(props) => <HomeScreen {...props} registerCleanup={registerCleanup} />}
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

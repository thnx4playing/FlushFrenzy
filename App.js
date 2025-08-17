import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Provider as PaperProvider } from 'react-native-paper';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Import screens
import HomeScreen from './src/screens/HomeScreen';
import GameScreen from './src/screens/GameScreen';
import { AudioManager } from './src/audio/AudioManager';
import { useAudioStore } from './src/audio/AudioStore';

const Stack = createStackNavigator();

export default function App() {
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
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <PaperProvider>
          <BottomSheetModalProvider>
            <NavigationContainer>
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

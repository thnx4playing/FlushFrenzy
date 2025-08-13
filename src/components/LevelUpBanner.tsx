import React, { useEffect, useRef } from 'react';
import { Animated, Text, StyleSheet, Dimensions, Easing } from 'react-native';
import { Audio } from 'expo-av';

const { width } = Dimensions.get('window');

type Props = {
  visible: boolean;
  onComplete?: () => void;
  onStart?: () => void;
};

export default function LevelUpBanner({ visible, onComplete, onStart }: Props) {
  const translateY = useRef(new Animated.Value(-100)).current;
  const scale = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const animationStartedRef = useRef(false);
  const soundRef = useRef<Audio.Sound | null>(null);

  useEffect(() => {
    const playSound = async () => {
      try {
        if (soundRef.current) {
          await soundRef.current.unloadAsync();
        }
        soundRef.current = new Audio.Sound();
        await soundRef.current.loadAsync(require('../../assets/win.mp3'));
        await soundRef.current.playAsync();
      } catch (err) {
        console.warn('Error playing win.mp3', err);
      }
    };

    if (visible && !animationStartedRef.current) {
      animationStartedRef.current = true;
      onStart?.(); // Call onStart callback to pause game
      
      // Start animation immediately
      // Reset starting position
      translateY.setValue(-100);
      scale.setValue(0);
      opacity.setValue(0);

      // Play sound in background (don't wait for it)
      playSound();

      // Animation sequence
      Animated.parallel([
        // Slide down with bounce
        Animated.timing(translateY, {
          toValue: 0,
          duration: 600,
          easing: Easing.out(Easing.back(1.2)),
          useNativeDriver: true
        }),
        // Fade in
        Animated.timing(opacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true
        })
      ]).start(() => {
        // After slide down, do bounce effect
        setTimeout(() => {
          Animated.sequence([
            Animated.timing(scale, {
              toValue: 1.15,
              duration: 100,
              useNativeDriver: true
            }),
            Animated.timing(scale, {
              toValue: 0.95,
              duration: 100,
              useNativeDriver: true
            }),
            Animated.timing(scale, {
              toValue: 1.05,
              duration: 100,
              useNativeDriver: true
            }),
            Animated.timing(scale, {
              toValue: 1,
              duration: 100,
              useNativeDriver: true
            })
          ]).start(() => {
            // After bounce, fade out
            setTimeout(() => {
              Animated.parallel([
                Animated.timing(opacity, {
                  toValue: 0,
                  duration: 400,
                  useNativeDriver: true
                }),
                Animated.timing(translateY, {
                  toValue: -100,
                  duration: 400,
                  useNativeDriver: true
                })
              ]).start(() => {
                if (soundRef.current) {
                  soundRef.current.unloadAsync();
                  soundRef.current = null;
                }
                animationStartedRef.current = false;
                onComplete && onComplete();
              });
            }, 800); // Wait 800ms before fade out
          });
        }, 800); // Wait 800ms before bounce
      });
    } else if (!visible) {
      // Reset animation flag when component becomes invisible
      animationStartedRef.current = false;
      if (soundRef.current) {
        soundRef.current.unloadAsync();
        soundRef.current = null;
      }
    }
  }, [visible, onStart]);

  if (!visible) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ translateY }, { scale }],
          opacity
        }
      ]}
    >
      <Text style={styles.text}>LEVEL UP!</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 160,
    left: width / 2 - 150,
    width: 300,
    padding: 15,
    backgroundColor: '#4FC3F7', // Light sky blue
    borderRadius: 25,
    alignItems: 'center',
    borderWidth: 4,
    borderColor: '#ffffff', // White border
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    zIndex: 9999
  },
  text: {
    fontSize: 34,
    fontWeight: '900',
    letterSpacing: 2,
    textTransform: 'uppercase',
    color: '#fff',
    textShadowColor: 'rgba(0, 0, 0, 0.25)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 3
  }
});

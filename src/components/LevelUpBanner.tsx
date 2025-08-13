import React, { useEffect, useRef } from 'react';
import { Animated, Text, StyleSheet, Dimensions, Easing } from 'react-native';
import { Audio } from 'expo-av';

const { width } = Dimensions.get('window');

type Props = {
  visible: boolean;
  onComplete?: () => void;
};

export default function LevelUpBanner({ visible, onComplete }: Props) {
  const translateY = useRef(new Animated.Value(-100)).current;
  const scale = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    let sound: Audio.Sound;

    const playSound = async () => {
      try {
        sound = new Audio.Sound();
        await sound.loadAsync(require('../../assets/ding.mp3')); // Using existing ding.mp3
        await sound.playAsync();
      } catch (err) {
        console.warn('Error playing ding.mp3', err);
      }
    };

    if (visible) {
      playSound();

      // Reset starting position
      translateY.setValue(-100);
      scale.setValue(0);
      opacity.setValue(0);

      // Animation sequence
      Animated.sequence([
        Animated.parallel([
          Animated.timing(opacity, {
            toValue: 1,
            duration: 200,
            useNativeDriver: true
          }),
          Animated.spring(scale, {
            toValue: 1,
            friction: 4,
            tension: 100,
            useNativeDriver: true
          }),
          Animated.timing(translateY, {
            toValue: 0,
            duration: 500,
            easing: Easing.out(Easing.exp),
            useNativeDriver: true
          })
        ]),
        Animated.loop(
          Animated.sequence([
            Animated.timing(scale, {
              toValue: 1.1,
              duration: 150,
              useNativeDriver: true
            }),
            Animated.timing(scale, {
              toValue: 1,
              duration: 150,
              useNativeDriver: true
            })
          ]),
          { iterations: 3 }
        ),
        Animated.parallel([
          Animated.timing(opacity, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true
          }),
          Animated.timing(translateY, {
            toValue: -100,
            duration: 300,
            useNativeDriver: true
          })
        ])
      ]).start(() => {
        if (sound) {
          sound.unloadAsync();
        }
        onComplete && onComplete();
      });
    }
  }, [visible]);

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
    top: 80,
    left: width / 2 - 150,
    width: 300,
    padding: 15,
    backgroundColor: '#ffeb3b',
    borderRadius: 20,
    alignItems: 'center',
    borderWidth: 4,
    borderColor: '#f57c00'
  },
  text: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#d32f2f',
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 3
  }
});

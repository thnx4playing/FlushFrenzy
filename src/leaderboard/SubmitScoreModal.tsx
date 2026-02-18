/**
 * SubmitScoreModal.tsx
 * 
 * Arcade-style name entry with keyboard input.
 * Boxes light up yellow when active, auto-advance on typing.
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  Animated,
  Easing,
  Dimensions,
  ActivityIndicator,
  Keyboard,
  Pressable,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { submitScore, getRank, LeaderboardError } from './leaderboardApi';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const MAX_NAME_LENGTH = 5;

type Props = {
  visible: boolean;
  onClose: () => void;
  onSuccess?: (rank: number) => void;
  gameMode: 'quick-flush' | 'endless-plunge';
  score: number;
  round?: number;
  defaultInitials?: string;
};

export default function SubmitScoreModal({
  visible,
  onClose,
  onSuccess,
  gameMode,
  score,
  round,
  defaultInitials = '',
}: Props) {
  const [chars, setChars] = useState<string[]>(Array(MAX_NAME_LENGTH).fill(''));
  const [activeIndex, setActiveIndex] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rank, setRank] = useState<number | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  
  const inputRef = useRef<TextInput>(null);
  const celebrationAnim = useRef(new Animated.Value(0)).current;
  const boxAnims = useRef(
    Array(MAX_NAME_LENGTH).fill(null).map(() => new Animated.Value(0))
  ).current;

  // Reset state when modal opens
  useEffect(() => {
    if (visible) {
      // Initialize with default initials
      const initial = defaultInitials.toUpperCase().replace(/[^A-Z0-9]/g, '');
      const newChars = Array(MAX_NAME_LENGTH).fill('');
      for (let i = 0; i < Math.min(initial.length, MAX_NAME_LENGTH); i++) {
        newChars[i] = initial[i];
      }
      setChars(newChars);
      setActiveIndex(0); // Always start at first box
      setIsSubmitting(false);
      setError(null);
      setRank(null);
      setShowSuccess(false);
      
      // Focus input after a short delay
      setTimeout(() => {
        inputRef.current?.focus();
      }, 300);
      
      // Pre-fetch rank
      getRank(gameMode, score)
        .then(result => setRank(result.rank))
        .catch(() => {});
    }
  }, [visible]);

  // Animate active box
  useEffect(() => {
    boxAnims.forEach((anim, index) => {
      Animated.timing(anim, {
        toValue: index === activeIndex ? 1 : 0,
        duration: 200,
        easing: Easing.out(Easing.quad),
        useNativeDriver: false,
      }).start();
    });
  }, [activeIndex]);

  // Get current name
  const getCurrentName = () => chars.filter(c => c !== '').join('');

  // Handle keyboard input
  const handleKeyPress = (e: any) => {
    const key = e.nativeEvent.key;
    
    if (key === 'Backspace') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      
      if (chars[activeIndex] !== '') {
        // Remove current character
        const newChars = [...chars];
        newChars[activeIndex] = '';
        setChars(newChars);
      } else if (activeIndex > 0) {
        // Move back and remove that character
        const newIndex = activeIndex - 1;
        const newChars = [...chars];
        newChars[newIndex] = '';
        setChars(newChars);
        setActiveIndex(newIndex);
      }
    }
  };

  // Handle text change
  const handleTextChange = (text: string) => {
    // Get the last character typed (uppercase, alphanumeric only)
    const char = text.slice(-1).toUpperCase().replace(/[^A-Z0-9]/g, '');
    
    if (char) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      
      const newChars = [...chars];
      newChars[activeIndex] = char;
      setChars(newChars);
      
      // Move to next box if not at end
      if (activeIndex < MAX_NAME_LENGTH - 1) {
        setActiveIndex(activeIndex + 1);
      }
    }
  };

  // Handle box tap to set active
  const handleBoxPress = (index: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setActiveIndex(index);
    inputRef.current?.focus();
  };

  // Handle submit
  const handleSubmit = async () => {
    const name = getCurrentName();
    
    if (name.length === 0) {
      setError('Enter at least 1 character');
      return;
    }
    
    setIsSubmitting(true);
    setError(null);
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    
    try {
      const result = await submitScore(gameMode, name, score, round);
      
      setRank(result.rank);
      setShowSuccess(true);
      
      Animated.timing(celebrationAnim, {
        toValue: 1,
        duration: 300,
        easing: Easing.out(Easing.back(1.5)),
        useNativeDriver: true,
      }).start();
      
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      
      setTimeout(() => {
        onSuccess?.(result.rank);
      }, 2000);
      
    } catch (err) {
      if (err instanceof LeaderboardError) {
        setError(err.statusCode === 429 ? 'Too many submissions. Try again later.' : err.message);
      } else {
        setError('Unable to submit score. Check your connection.');
      }
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const celebrationScale = celebrationAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.1],
  });

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoid}
      >
        <Pressable style={styles.overlay} onPress={Keyboard.dismiss}>
          <Pressable style={styles.modalContainer} onPress={() => inputRef.current?.focus()}>
            {/* Hidden input to capture keyboard */}
            <TextInput
              ref={inputRef}
              style={styles.hiddenInput}
              value=""
              onChangeText={handleTextChange}
              onKeyPress={handleKeyPress}
              maxLength={1}
              autoCapitalize="characters"
              autoCorrect={false}
              autoComplete="off"
              keyboardType="default"
              returnKeyType="done"
              blurOnSubmit={false}
            />

          {/* Header */}
          <LinearGradient
            colors={['#2D1B4E', '#1A0F2E']}
            style={styles.header}
          >
            <Text style={styles.headerText}>ENTER YOUR NAME</Text>
            {rank && (
              <View style={styles.rankPreview}>
                <Text style={styles.rankPreviewText}>Rank #{rank}</Text>
              </View>
            )}
          </LinearGradient>

          {/* Score display */}
          <View style={styles.scoreDisplay}>
            <Text style={styles.scoreLabel}>YOUR SCORE</Text>
            <Text style={styles.scoreValue}>{score.toLocaleString()}</Text>
            {gameMode === 'endless-plunge' && round && (
              <Text style={styles.roundText}>Round {round}</Text>
            )}
          </View>

          {!showSuccess ? (
            <>
              {/* Character boxes */}
              <View style={styles.boxesContainer}>
                <Text style={styles.tapHint}>Tap a box or start typing</Text>
                <View style={styles.boxesRow}>
                  {chars.map((char, index) => {
                    const bgColor = boxAnims[index].interpolate({
                      inputRange: [0, 1],
                      outputRange: ['#2D2D3D', '#FFD700'],
                    });
                    const borderColor = boxAnims[index].interpolate({
                      inputRange: [0, 1],
                      outputRange: ['#3D3D4D', '#FFF'],
                    });
                    const textColor = boxAnims[index].interpolate({
                      inputRange: [0, 1],
                      outputRange: ['#888888', '#1A0F2E'],
                    });
                    
                    return (
                      <TouchableOpacity
                        key={index}
                        onPress={() => handleBoxPress(index)}
                        activeOpacity={0.8}
                      >
                        <Animated.View
                          style={[
                            styles.charBox,
                            {
                              backgroundColor: bgColor,
                              borderColor: borderColor,
                            },
                          ]}
                        >
                          <Animated.Text
                            style={[
                              styles.charText,
                              { color: textColor },
                            ]}
                          >
                            {char || (index === activeIndex ? '_' : '')}
                          </Animated.Text>
                        </Animated.View>
                      </TouchableOpacity>
                    );
                  })}
                </View>
                
                {/* Current name preview */}
                <View style={styles.namePreview}>
                  <Text style={styles.namePreviewLabel}>Name: </Text>
                  <Text style={styles.namePreviewText}>
                    {getCurrentName() || '---'}
                  </Text>
                </View>
              </View>

              {/* Error message */}
              {error && (
                <View style={styles.errorContainer}>
                  <Ionicons name="alert-circle" size={18} color="#FF6B6B" />
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              )}

              {/* Action buttons */}
              <View style={styles.buttonRow}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={onClose}
                  disabled={isSubmitting}
                >
                  <Text style={styles.cancelButtonText}>SKIP</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.submitButton,
                    isSubmitting && styles.submitButtonDisabled,
                  ]}
                  onPress={handleSubmit}
                  disabled={isSubmitting}
                  activeOpacity={0.8}
                >
                  {isSubmitting ? (
                    <ActivityIndicator color="#1A0F2E" size="small" />
                  ) : (
                    <>
                      <Ionicons name="trophy" size={18} color="#1A0F2E" />
                      <Text style={styles.submitButtonText}>SUBMIT</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </>
          ) : (
            /* Success state */
            <Animated.View
              style={[
                styles.successContainer,
                { transform: [{ scale: celebrationScale }] },
              ]}
            >
              <Ionicons name="checkmark-circle" size={64} color="#4ECDC4" />
              <Text style={styles.successText}>SCORE SUBMITTED!</Text>
              <View style={styles.successRank}>
                <Text style={styles.successRankLabel}>YOUR RANK</Text>
                <Text style={styles.successRankValue}>#{rank}</Text>
              </View>
              <Text style={styles.successName}>{getCurrentName()}</Text>
            </Animated.View>
          )}

          {/* Privacy note */}
          <Text style={styles.privacyNote}>
            🔒 No personal data collected • Just arcade-style names
          </Text>
        </Pressable>
      </Pressable>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  keyboardAvoid: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingTop: 60,
  },
  modalContainer: {
    width: Math.min(SCREEN_WIDTH * 0.92, 380),
    backgroundColor: '#1E1E2E',
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 3,
    borderColor: '#FFD700',
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
  },
  hiddenInput: {
    position: 'absolute',
    top: -100,
    left: 0,
    width: 1,
    height: 1,
    opacity: 0,
  },
  header: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  headerText: {
    fontSize: 18,
    fontWeight: '900',
    color: '#FFD700',
    letterSpacing: 2,
    textShadowColor: '#FFD700',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  rankPreview: {
    marginTop: 6,
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  rankPreviewText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFD700',
  },
  scoreDisplay: {
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 215, 0, 0.2)',
  },
  scoreLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#888',
    letterSpacing: 1,
  },
  scoreValue: {
    fontSize: 32,
    fontWeight: '900',
    color: '#4ECDC4',
    marginTop: 2,
  },
  roundText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#888',
    marginTop: 2,
  },
  boxesContainer: {
    paddingVertical: 16,
    paddingHorizontal: 12,
    alignItems: 'center',
  },
  tapHint: {
    fontSize: 12,
    color: '#666',
    marginBottom: 12,
  },
  boxesRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  charBox: {
    width: 48,
    height: 58,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
  },
  charText: {
    fontSize: 30,
    fontWeight: '900',
  },
  namePreview: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 14,
  },
  namePreviewLabel: {
    fontSize: 13,
    color: '#666',
    fontWeight: '600',
  },
  namePreviewText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFD700',
    letterSpacing: 2,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingBottom: 10,
    gap: 6,
  },
  errorText: {
    fontSize: 13,
    color: '#FF6B6B',
    fontWeight: '600',
  },
  buttonRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingBottom: 14,
    gap: 10,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#3D3D4D',
  },
  cancelButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#888',
    letterSpacing: 1,
  },
  submitButton: {
    flex: 2,
    flexDirection: 'row',
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#FFD700',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderWidth: 2,
    borderColor: '#FFF',
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    fontSize: 15,
    fontWeight: '900',
    color: '#1A0F2E',
    letterSpacing: 1,
  },
  successContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  successText: {
    fontSize: 18,
    fontWeight: '900',
    color: '#4ECDC4',
    marginTop: 10,
    letterSpacing: 1,
  },
  successRank: {
    marginTop: 14,
    alignItems: 'center',
  },
  successRankLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#888',
    letterSpacing: 1,
  },
  successRankValue: {
    fontSize: 44,
    fontWeight: '900',
    color: '#FFD700',
    textShadowColor: '#FFD700',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 15,
  },
  successName: {
    fontSize: 22,
    fontWeight: '700',
    color: '#888',
    marginTop: 6,
    letterSpacing: 3,
  },
  privacyNote: {
    fontSize: 10,
    color: '#555',
    textAlign: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
});

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, Pressable } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Ionicons } from '@expo/vector-icons';
import { useAudioStore } from '../audio/AudioStore';

type Props = {
  visible: boolean;
  onClose: () => void;
};

export default function VolumeControlModal({
  visible,
  onClose,
}: Props) {
  const {
    musicMuted, sfxMuted,
    toggleMusic, toggleSfx,
  } = useAudioStore();

  return (
    <Modal animationType="fade" transparent visible={visible} onRequestClose={onClose} statusBarTranslucent presentationStyle="overFullScreen">
      <GestureHandlerRootView style={{flex:1}}>
        <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.modalContent} onPress={() => {}}>
          <View style={styles.header}>
            <Text style={styles.title}>Audio Settings</Text>
          </View>

          <View style={styles.buttonSection}>
            <TouchableOpacity style={[styles.muteButton, musicMuted && styles.mutedButton]} onPress={toggleMusic}>
              <Ionicons name={musicMuted ? "volume-mute" : "musical-notes"} size={24} color={musicMuted ? "#FF6B6B" : "#4DA8FF"} />
              <Text style={[styles.buttonText, musicMuted && styles.mutedText]}>{musicMuted ? "Music Muted" : "Music On"}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.muteButton, sfxMuted && styles.mutedButton]} onPress={toggleSfx}>
              <Ionicons name={sfxMuted ? "volume-mute" : "volume-high"} size={24} color={sfxMuted ? "#FF6B6B" : "#FF6B35"} />
              <Text style={[styles.buttonText, sfxMuted && styles.mutedText]}>{sfxMuted ? "Sound Effects Muted" : "Sound Effects On"}</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
      </GestureHandlerRootView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex:1, backgroundColor:'rgba(0,0,0,0.35)', alignItems:'center', justifyContent:'center' },
  modalContent: {
    backgroundColor: '#ff8107',
    borderRadius: 25,
    padding: 35,
    width: '85%',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#000000',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 10,
  },
  header: { width: '100%', alignItems: 'center', marginBottom: 20 },
  title: { fontSize: 18, fontWeight: '800', color: '#FFF8E1', textAlign: 'center', textShadowColor: 'rgba(0,0,0,0.4)', textShadowOffset: { width: 2, height: 2 }, textShadowRadius: 3 },
  buttonSection: { width: '100%', gap: 15 },
  muteButton: { backgroundColor: '#3B82F6', padding: 18, borderRadius: 15, alignItems: 'center', borderWidth: 3, borderColor: '#000000', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 5, flexDirection: 'row', justifyContent: 'center', gap: 12 },
  mutedButton: { backgroundColor: '#6B7280' },
  buttonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700', textShadowColor: 'rgba(0,0,0,0.3)', textShadowOffset: { width: 1, height: 1 }, textShadowRadius: 2 },
  mutedText: { color: '#FFE4E1' },
});
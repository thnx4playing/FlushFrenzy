import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, Pressable } from 'react-native';
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
    <Modal animationType="fade" transparent visible={visible} onRequestClose={onClose}>
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
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex:1, backgroundColor:'rgba(0,0,0,0.35)', alignItems:'center', justifyContent:'center' },
  modalContent: {
    width: '86%', maxWidth: 480, backgroundColor: '#fff', borderRadius: 16, padding: 18,
    shadowColor:'#000', shadowOpacity:0.25, shadowRadius:6, elevation:6,
  },
  header: { marginBottom: 10, alignItems: 'center' },
  title: { fontSize: 20, fontWeight: '800', color:'#333' },
  buttonSection: { gap: 12 },
  muteButton: {
    flexDirection:'row', alignItems:'center', padding:14, borderRadius:12, backgroundColor:'#F7FAFC',
    borderWidth:1, borderColor:'#E2E8F0',
  },
  mutedButton: { backgroundColor:'#FFF5F5', borderColor:'#FFE3E3' },
  buttonText: { fontSize:16, fontWeight:'600', color:'#333', marginLeft:12 },
  mutedText: { color:'#FF6B6B' },
});

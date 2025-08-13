// src/components/PracticeCustomizationModal.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';

type Props = {
  visible: boolean;
  onPlay: (settings: PracticeSettings) => void;
  onClose: () => void;
  availableTpSkins: string[];
};

export type PracticeSettings = {
  tpSkin: string;
  toiletSpeed: number;
  gravity: number;
};

const PracticeCustomizationModal: React.FC<Props> = ({
  visible,
  onPlay,
  onClose,
  availableTpSkins,
}) => {
  const [settings, setSettings] = useState<PracticeSettings>({
    tpSkin: 'tp.png',
    toiletSpeed: 5,
    gravity: 5,
  });

  const resetToDefaults = () => {
    setSettings({
      tpSkin: 'tp.png',
      toiletSpeed: 5,
      gravity: 5,
    });
  };

  const handlePlay = () => {
    onPlay(settings);
  };

  const skinMap: { [key: string]: any } = {
    'tp.png': require('../../assets/tp.png'),
    'tp-blue.png': require('../../assets/tp-blue.png'),
    'tp-green.png': require('../../assets/tp-green.png'),
    'tp-pink.png': require('../../assets/tp-pink.png'),
    'tp-purple.png': require('../../assets/tp-purple.png'),
    'tp-red.png': require('../../assets/tp-red.png'),
    'tp-orange.png': require('../../assets/tp-orange.png'),
    'tp-rainbow.png': require('../../assets/tp-rainbow.png'),
  };

  const skinNames: { [key: string]: string } = {
    'tp.png': 'Classic White',
    'tp-blue.png': 'Ocean Blue',
    'tp-green.png': 'Forest Green',
    'tp-pink.png': 'Bubblegum Pink',
    'tp-purple.png': 'Royal Purple',
    'tp-red.png': 'Fire Red',
    'tp-orange.png': 'Sunset Orange',
    'tp-rainbow.png': 'Rainbow',
  };

  return (
    <Modal
      transparent
      animationType="fade"
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalCard}>
          {/* Background gradient effect */}
          <View style={styles.modalBackgroundGradient} />
          
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerIconContainer}>
              <Ionicons name="settings" size={16} color="#4DA8FF" />
            </View>
            <Text style={styles.modalTitle}>Practice Mode Setup</Text>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Toilet Paper Color Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Toilet Paper Color</Text>
              <View style={styles.skinGrid}>
                {availableTpSkins.map((skin) => (
                  <TouchableOpacity
                    key={skin}
                    style={[
                      styles.skinOption,
                      settings.tpSkin === skin && styles.selectedSkin,
                    ]}
                    onPress={() => setSettings({ ...settings, tpSkin: skin })}
                  >
                    <Image source={skinMap[skin]} style={styles.skinImage} />
                    <Text style={[
                      styles.skinName,
                      settings.tpSkin === skin && styles.selectedSkinText,
                    ]}>
                      {skinNames[skin]}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Toilet Movement Speed Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Toilet Movement Speed</Text>
              <View style={styles.sliderContainer}>
                <Text style={styles.sliderValue}>{settings.toiletSpeed}</Text>
                                 <Slider
                   style={styles.slider}
                   minimumValue={1}
                   maximumValue={10}
                   value={settings.toiletSpeed}
                   onValueChange={(value) => 
                     setSettings({ ...settings, toiletSpeed: Math.round(value) })
                   }
                   minimumTrackTintColor="#4DA8FF"
                   maximumTrackTintColor="#E0E0E0"
                   thumbStyle={styles.sliderThumb}
                 />
                <View style={styles.sliderLabels}>
                  <Text style={styles.sliderLabel}>Slow</Text>
                  <Text style={styles.sliderLabel}>Fast</Text>
                </View>
              </View>
            </View>

            {/* Gravity Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Gravity</Text>
              <View style={styles.sliderContainer}>
                <Text style={styles.sliderValue}>{settings.gravity}</Text>
                                 <Slider
                   style={styles.slider}
                   minimumValue={1}
                   maximumValue={10}
                   value={settings.gravity}
                   onValueChange={(value) => 
                     setSettings({ ...settings, gravity: Math.round(value) })
                   }
                   minimumTrackTintColor="#4DA8FF"
                   maximumTrackTintColor="#E0E0E0"
                   thumbStyle={styles.sliderThumb}
                 />
                                 <View style={styles.sliderLabels}>
                   <Text style={styles.sliderLabel}>Very Low</Text>
                   <Text style={styles.sliderLabel}>High</Text>
                 </View>
              </View>
            </View>
          </ScrollView>

          {/* Buttons */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity onPress={resetToDefaults} style={styles.defaultsButton}>
              <Text style={styles.defaultsButtonText}>Defaults</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handlePlay} style={styles.playButton}>
              <Text style={styles.playButtonText}>Play</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 10,
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    width: '100%',
    maxWidth: 380,
    height: '85%',
    shadowColor: '#000',
    shadowOpacity: 0.4,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 16,
    elevation: 12,
  },
  modalBackgroundGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 20,
    backgroundColor: '#F8F9FA',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#2C3E50',
  },
  headerIconContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#4DA8FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2C3E50',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  content: {
    flex: 1,
    marginBottom: 20,
  },
  section: {
    marginBottom: 20,
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#2C3E50',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  skinGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  skinOption: {
    width: '48%',
    alignItems: 'center',
    padding: 10,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#2C3E50',
    backgroundColor: '#FFFFFF',
    marginBottom: 8,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
  },
  selectedSkin: {
    borderColor: '#4DA8FF',
    backgroundColor: '#E3F2FD',
    shadowColor: '#4DA8FF',
    shadowOpacity: 0.3,
  },
  skinImage: {
    width: 32,
    height: 32,
    marginBottom: 6,
  },
  skinName: {
    fontSize: 12,
    fontWeight: '500',
    color: '#666666',
    textAlign: 'center',
  },
  selectedSkinText: {
    color: '#4DA8FF',
    fontWeight: '600',
  },
  sliderContainer: {
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  sliderValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4DA8FF',
    marginBottom: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  slider: {
    width: '100%',
    height: 30,
  },
  sliderThumb: {
    backgroundColor: '#4DA8FF',
    width: 20,
    height: 20,
  },
  sliderLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 6,
  },
  sliderLabel: {
    fontSize: 11,
    color: '#2C3E50',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
    gap: 12,
    paddingTop: 12,
  },
  defaultsButton: {
    flex: 1,
    backgroundColor: '#E0E0E0',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#2C3E50',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 3,
  },
  defaultsButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2C3E50',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  playButton: {
    flex: 1,
    backgroundColor: '#4DA8FF',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#2C3E50',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 3,
  },
  playButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});

export default PracticeCustomizationModal;

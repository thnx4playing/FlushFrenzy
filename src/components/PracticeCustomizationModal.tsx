// src/components/PracticeCustomizationModal.tsx
import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Image,
  Dimensions,
  Alert,
} from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Ionicons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';


const { width: screenWidth } = Dimensions.get('window');

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
  tpTrail: string;
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
    tpTrail: 'none',
  });
  
  const [skinPickerOpen, setSkinPickerOpen] = useState(false);
  const [trailPickerOpen, setTrailPickerOpen] = useState(false);
  const [tempSkin, setTempSkin] = useState(settings.tpSkin);
  const [tempTrail, setTempTrail] = useState(settings.tpTrail);
  const [pickerType, setPickerType] = useState<'skin' | 'trail'>('skin');
  
  

  const resetToDefaults = () => {
    setSettings({
      tpSkin: 'tp.png',
      toiletSpeed: 5,
      gravity: 5,
      tpTrail: 'none',
    });
  };

  const handlePlay = () => {
    onPlay(settings);
  };

  const skinMap: { [key: string]: any } = {
    'tp.png': require('../../assets/tp.png'),
    'halloween1.png': require('../../assets/halloween1.png'),
    'halloween2.png': require('../../assets/halloween2.png'),
    'halloween3.png': require('../../assets/halloween3.png'),
    'halloween4.png': require('../../assets/halloween4.png'),
    'halloween5.png': require('../../assets/halloween5.png'),
  };

  const skinNames: { [key: string]: string } = {
    'tp.png': 'Classic White',
    'halloween1.png': 'Spooky Pumpkin',
    'halloween2.png': 'Ghostly White',
    'halloween3.png': 'Witch Hat Black',
    'halloween4.png': 'Candy Corn',
    'halloween5.png': 'Blood Moon Red',
  };

  const trailNames: { [key: string]: string } = {
    'none': 'No Trail',
    'sparkles': 'Sparkles',
    'rainbow': 'Rainbow',
    'bubbles': 'Bubbles',
    'confetti': 'Confetti',
    'glow': 'Glow',
  };

  const trailColors: { [key: string]: string } = {
    'none': '#E0E0E0',
    'sparkles': '#FFD700',
    'rainbow': '#FF6B6B',
    'bubbles': '#87CEEB',
    'confetti': '#FF69B4',
    'glow': '#4DA8FF',
  };

  const getTrailName = (trail: string) => trailNames[trail] || trail;
  const getTrailColor = (trail: string) => trailColors[trail] || '#E0E0E0';

  return (
    <>
             <Modal
         transparent
         presentationStyle="overFullScreen"
         statusBarTranslucent
         animationType="fade"
         visible={visible}
         onRequestClose={onClose}
       >
        <GestureHandlerRootView style={{flex:1}}>
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

                <TouchableOpacity
                  style={styles.selectorRow}
                  activeOpacity={0.85}
                  onPress={() => {
                    setTempSkin(settings.tpSkin);
                    setPickerType('skin');
                    setSkinPickerOpen(true);
                  }}
                >
                  <View style={styles.selectorLeft}>
                    <Image source={skinMap[settings.tpSkin]} style={styles.selectorThumb} resizeMode="contain" />
                    <Text style={styles.selectorText}>
                      {skinNames[settings.tpSkin] ?? settings.tpSkin}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color="#2C3E50" />
                </TouchableOpacity>
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

              {/* Trail Effect Section */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Trail Effect</Text>
                <TouchableOpacity
                  style={styles.selectorRow}
                  activeOpacity={0.85}
                  onPress={() => {
                    setTempTrail(settings.tpTrail);
                    setPickerType('trail');
                    setTrailPickerOpen(true);
                  }}
                >
                  <View style={styles.selectorLeft}>
                    <View style={[styles.trailPreview, { backgroundColor: getTrailColor(settings.tpTrail) }]} />
                    <Text style={styles.selectorText}>
                      {getTrailName(settings.tpTrail)}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color="#2C3E50" />
                </TouchableOpacity>
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

            {/* Skin Picker Overlay */}
            {skinPickerOpen && (
              <View style={styles.overlay}>
                <View style={styles.sheet}>
                  <Text style={styles.sheetTitle}>Choose Paper Color</Text>

                  {/* Live preview */}
                  <View style={styles.previewRow}>
                    <Image source={skinMap[tempSkin]} style={styles.previewImage} resizeMode="contain" />
                    <Text style={styles.previewName}>{skinNames[tempSkin] ?? tempSkin}</Text>
                  </View>

                  {/* Compact scrollable list */}
                  <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
                    {availableTpSkins.map((skin) => {
                      const selected = tempSkin === skin;
                      return (
                        <TouchableOpacity
                          key={skin}
                          style={[styles.listRow, selected && styles.listRowSelected]}
                          onPress={() => setTempSkin(skin)}
                          activeOpacity={0.8}
                        >
                          <View style={styles.rowLeft}>
                            <Image source={skinMap[skin]} style={styles.rowThumb} resizeMode="contain" />
                            <Text style={styles.rowText}>{skinNames[skin] ?? skin}</Text>
                          </View>
                          {selected && <Ionicons name="checkmark-circle" size={18} color="#0EA5E9" />}
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>

                  {/* Actions */}
                  <View style={styles.sheetButtons}>
                    <TouchableOpacity onPress={() => setSkinPickerOpen(false)} style={styles.btnSecondary}>
                      <Text style={styles.btnSecondaryText}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => {
                        setSettings({ ...settings, tpSkin: tempSkin });
                        setSkinPickerOpen(false);
                      }}
                      style={styles.btnPrimary}
                    >
                      <Text style={styles.btnPrimaryText}>Done</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            )}

            {/* Trail Picker Overlay */}
            {trailPickerOpen && (
              <View style={styles.overlay}>
                <View style={styles.sheet}>
                  <Text style={styles.sheetTitle}>Choose Trail Effect</Text>

                  {/* Live preview */}
                  <View style={styles.previewRow}>
                    <View style={[styles.trailPreview, { backgroundColor: getTrailColor(tempTrail) }]} />
                    <Text style={styles.previewName}>{getTrailName(tempTrail)}</Text>
                  </View>

                  {/* Compact scrollable list */}
                  <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
                    {Object.keys(trailNames).map((trail) => {
                      const selected = tempTrail === trail;
                      return (
                        <TouchableOpacity
                          key={trail}
                          style={[styles.listRow, selected && styles.listRowSelected]}
                          onPress={() => setTempTrail(trail)}
                          activeOpacity={0.8}
                        >
                          <View style={styles.rowLeft}>
                            <View style={[styles.trailPreview, { backgroundColor: getTrailColor(trail) }]} />
                            <Text style={styles.rowText}>{getTrailName(trail)}</Text>
                          </View>
                          {selected && <Ionicons name="checkmark-circle" size={18} color="#0EA5E9" />}
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>

                  {/* Actions */}
                  <View style={styles.sheetButtons}>
                    <TouchableOpacity onPress={() => setTrailPickerOpen(false)} style={styles.btnSecondary}>
                      <Text style={styles.btnSecondaryText}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => {
                        setSettings({ ...settings, tpTrail: tempTrail });
                        setTrailPickerOpen(false);
                      }}
                      style={styles.btnPrimary}
                    >
                      <Text style={styles.btnPrimaryText}>Done</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            )}
          </View>
                 </View>
               </GestureHandlerRootView>
      </Modal>

               {/* Bottom Sheet for TP Skin Selection - Outside the modal */}
        {/* TPSkinSheet is now rendered at GameScreen level */}
     </>
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
    marginBottom: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
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
     // Compact color selector styles
   selectorRow: {
     flexDirection: 'row',
     alignItems: 'center',
     justifyContent: 'space-between',
     paddingHorizontal: 14,
     paddingVertical: 10,
     borderRadius: 10,
     borderWidth: 2,
     borderColor: '#2C3E50',
     backgroundColor: '#F8F9FA',
   },
      selectorLeft: { 
     flexDirection: 'row', 
     alignItems: 'center', 
   },

      selectorText: { 
     fontSize: 16, 
     fontWeight: '600', 
     color: '#2C3E50' 
   },
  sliderContainer: {
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  sliderValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4DA8FF',
    marginBottom: 6,
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  slider: {
    width: '100%',
    height: 20,
  },
  sliderThumb: {
    backgroundColor: '#4DA8FF',
    width: 16,
    height: 16,
  },
  sliderLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 4,
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
  selectorThumb: { width: 36, height: 36 },
  trailPreview: { 
    width: 36, 
    height: 36, 
    borderRadius: 18,
    borderWidth: 2,
    borderColor: '#2C3E50',
  },

  overlay: {
    position: 'absolute',
    left: 0, right: 0, top: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sheet: {
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#2C3E50',
    padding: 16,
    maxHeight: '70%',
    width: '90%',
    maxWidth: 400,
  },
  sheetTitle: { 
    textAlign: 'center', 
    fontWeight: '700', 
    color: '#2C3E50', 
    fontSize: 18,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  previewRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 12, 
    alignSelf: 'center', 
    marginBottom: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#2C3E50',
  },
  previewImage: { width: 64, height: 64 },
  previewName: { fontSize: 18, fontWeight: '700', color: '#2C3E50' },

  list: { marginTop: 8 },
  listRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 10,
    marginBottom: 4,
  },
  listRowSelected: { backgroundColor: '#F0F9FF', borderWidth: 2, borderColor: '#0EA5E9' },
  rowLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  rowThumb: { width: 40, height: 40, marginRight: 12 },
  rowText: { fontSize: 16, color: '#2C3E50', fontWeight: '500' },

  sheetButtons: { flexDirection: 'row', gap: 12, marginTop: 10 },
  btnSecondary: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#2C3E50',
    alignItems: 'center',
  },
  btnSecondaryText: { fontWeight: '700', color: '#2C3E50' },
  btnPrimary: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#4DA8FF',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 3,
  },
  btnPrimaryText: { fontWeight: '700', color: '#fff' },
});

export default PracticeCustomizationModal;
// src/ui/GameHUD.tsx
// REDESIGNED: Minimal HUD with smaller, less intrusive buttons

import React, { useState } from 'react';
import { View, StyleSheet, Pressable, ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import HUDBar from '../components/HUDBar';
import PracticeHUD from '../components/PracticeHUD';
import VolumeControlModal from '../components/VolumeControlModal';
import { useAudioStore } from '../audio/AudioStore';

type Props = {
  gameMode: 'endless-plunge' | 'quick-flush';
  round: number;
  points: number;
  timeLeft: number;
  pointsRemaining: number;
  totalScore?: number;
  roundTarget?: number;
  onEndGame: () => void;
  containerStyle?: ViewStyle;
  timeFlash?: boolean;
  timerFrozen?: boolean;
};

export default function GameHUD({
  gameMode,
  round,
  points,
  timeLeft,
  pointsRemaining,
  totalScore,
  roundTarget,
  onEndGame,
  containerStyle,
  timeFlash = false,
  timerFrozen = false,
}: Props) {
  const insets = useSafeAreaInsets();
  const [volumeModalVisible, setVolumeModalVisible] = useState(false);

  const getVolumeIcon = () => {
    const { musicMuted, sfxMuted } = useAudioStore.getState();
    if (musicMuted && sfxMuted) return 'volume-mute';
    if (musicMuted || sfxMuted) return 'volume-low';
    return 'volume-high';
  };

  return (
    <View
      pointerEvents="box-none"
      style={[
        styles.hudRoot,
        { paddingTop: insets.top + 8 },
        containerStyle,
      ]}
    >
      {/* Stats bar */}
      <View style={styles.statsContainer} pointerEvents="box-none">
        {gameMode === 'endless-plunge' ? (
          <HUDBar
            round={round}
            points={points}
            pointsNeeded={roundTarget || 0}
            timeLeft={timeLeft}
            total={totalScore !== undefined ? totalScore : points}
            timeFlash={timeFlash}
            timerFrozen={timerFrozen}
          />
        ) : (
          <PracticeHUD
            totalPoints={totalScore !== undefined ? totalScore : points}
          />
        )}
      </View>

      {/* Buttons row - horizontally centered under stats */}
      <View style={styles.buttonsRow}>
        <MiniButton
          onPress={() => setVolumeModalVisible(true)}
          icon={<Ionicons name={getVolumeIcon()} size={16} color="rgba(255,255,255,0.9)" />}
        />
        <MiniButton
          onPress={onEndGame}
          icon={<Ionicons name="close" size={16} color="rgba(255,255,255,0.9)" />}
        />
      </View>

      {/* Volume Control Modal */}
      <VolumeControlModal
        visible={volumeModalVisible}
        onClose={() => setVolumeModalVisible(false)}
      />
    </View>
  );
}

function MiniButton({ onPress, icon }: { onPress: () => void; icon: React.ReactNode }) {
  return (
    <Pressable
      onPress={onPress}
      hitSlop={10}
      style={({ pressed }) => [
        styles.miniBtn,
        pressed && styles.miniBtnPressed,
      ]}
    >
      {icon}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  hudRoot: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    zIndex: 9999,
  },
  statsContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    marginTop: 8,
  },
  miniBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  miniBtnPressed: {
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    transform: [{ scale: 0.95 }],
  },
});

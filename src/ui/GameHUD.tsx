import React from 'react';
import { View, StyleSheet, Pressable, ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import HUDBar from '../components/HUDBar';
import PracticeHUD from '../components/PracticeHUD';

type Props = {
  gameMode: 'endless-plunge' | 'quick-flush';
  round: number;
  points: number;            // per-round points
  timeLeft: number;          // seconds left
  pointsRemaining: number;   // target - points (clamped >= 0)
  totalScore?: number;       // cumulative score for the entire game
  roundTarget?: number;      // target points for current round
  isMuted: boolean;
  onToggleMute: () => void;
  onOpenSettings: () => void;
  onEndGame: () => void;
  containerStyle?: ViewStyle;
};

export default function GameHUD({
  gameMode,
  round,
  points,
  timeLeft,
  pointsRemaining,
  totalScore,
  roundTarget,
  isMuted,
  onToggleMute,
  onOpenSettings,
  onEndGame,
  containerStyle,
}: Props) {
  const insets = useSafeAreaInsets();

  return (
    <View
      pointerEvents="box-none"
      style={[styles.hudRoot, { paddingTop: insets.top + 6 }, containerStyle]}
    >
      {/* Top center HUD - different based on game mode */}
      <View style={[
        styles.centerWrap, 
        gameMode === 'quick-flush' && { marginTop: -15 }
      ]} pointerEvents="box-none">
        {gameMode === 'endless-plunge' ? (
          <HUDBar
            round={round}
            points={points}
            pointsNeeded={roundTarget || 0}
            timeLeft={timeLeft}
            total={totalScore !== undefined ? totalScore : points}
          />
        ) : (
          <PracticeHUD
            totalPoints={totalScore !== undefined ? totalScore : points}
          />
        )}
      </View>

      {/* Bottom horizontal buttons */}
      <View style={[styles.bottomButtonsWrap, { marginTop: insets.top + 90 }]}>
        <CircleButton
          onPress={onOpenSettings}
          icon={<Ionicons name="settings" size={22} color="#FFFFFF" />}
          bg="#4DA8FF"
          label="Settings"
        />
        <CircleButton
          onPress={onToggleMute}
          icon={
            isMuted ? (
              <Ionicons name="volume-mute" size={22} color="#FFFFFF" />
            ) : (
              <Ionicons name="volume-high" size={22} color="#FFFFFF" />
            )
          }
          bg="#4DA8FF"
          label="Audio"
        />
        <CircleButton
          onPress={onEndGame}
          icon={<Ionicons name="close-circle-outline" size={22} color="#FFFFFF" />}
          bg="#4DA8FF"
          shadow="#0077CC"
          label="End"
        />
      </View>
    </View>
  );
}

function CircleButton({ onPress, icon, bg = '#FFF', shadow = '#C5C5C5', label }: {
  onPress: () => void;
  icon: React.ReactNode;
  bg?: string;
  shadow?: string;
  label?: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      hitSlop={8}
      style={({ pressed }) => [
        styles.circleBtn,
        {
          backgroundColor: bg,
          shadowColor: shadow,
          transform: [{ translateY: pressed ? 1 : 0 }],
        },
      ]}
    >
      <View style={styles.iconWrap}>{icon}</View>
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
    overflow: 'visible',
  },
  centerWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'visible',
  },
  bottomButtonsWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
    overflow: 'visible',
  },
  circleBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#0077CC',
    shadowOpacity: 0.25,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  iconWrap: {
    transform: [{ translateY: 1 }],
    shadowColor: '#000000',
    shadowOpacity: 0.5,
    shadowRadius: 2,
    shadowOffset: { width: 1, height: 1 },
    elevation: 2,
  },
});

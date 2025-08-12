import React from 'react';
import { View, Text, StyleSheet, Pressable, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

type Props = {
  round: number;
  points: number;            // per-round points
  timeLeft: number;          // seconds left
  pointsRemaining: number;   // target - points (clamped >= 0)
  isMuted: boolean;
  onToggleMute: () => void;
  onOpenSettings: () => void;
  onEndGame: () => void;
  containerStyle?: ViewStyle;
};

export default function GameHUD({
  round,
  points,
  timeLeft,
  pointsRemaining,
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
             {/* Top center pill with stats */}
       <View style={styles.centerWrap} pointerEvents="box-none">
         <LinearGradient
           colors={['#FFE99E', '#FFD36E']}
           start={{ x: 0, y: 0 }}
           end={{ x: 1, y: 1 }}
           style={styles.pill}
         >
           <View style={styles.pillBorder} />

           <Badge label="ROUND" value={round} />
           <Dot />
           <Badge label="POINTS" value={points} />
           <Dot />
           <Badge label="TIME" value={`${timeLeft}s`} />
           <Dot />
           <Badge label="REMAIN" value={Math.max(0, pointsRemaining)} accent />
         </LinearGradient>
       </View>

      {/* Right floating buttons */}
      <View style={[styles.buttonsWrap, { marginTop: insets.top + 8 }]}>
        <CircleButton
          onPress={onOpenSettings}
          icon={<Ionicons name="settings-sharp" size={22} color="#2A2A2A" />}
          bg="#FFFFFF"
          label="Settings"
        />
        <CircleButton
          onPress={onToggleMute}
          icon={
            isMuted ? (
              <Ionicons name="volume-mute" size={22} color="#2A2A2A" />
            ) : (
              <Ionicons name="volume-high" size={22} color="#2A2A2A" />
            )
          }
          bg="#FFFFFF"
          label="Audio"
        />
        <CircleButton
          onPress={onEndGame}
          icon={<MaterialCommunityIcons name="close-octagon" size={22} color="#FFFFFF" />}
          bg="#FF5577"
          shadow="#C62D49"
          label="End"
        />
      </View>
    </View>
  );
}

function Badge({ label, value, accent = false }: { label: string; value: number | string; accent?: boolean }) {
  return (
    <View style={[styles.badge, accent && styles.badgeAccent]}>
      <Text style={styles.badgeLabel}>{label}</Text>
      <Text style={[styles.badgeValue, accent && styles.badgeValueAccent]}>{value}</Text>
    </View>
  );
}

function Dot() {
  return <View style={styles.dot} />;
}

function CircleButton({
  onPress,
  icon,
  bg = '#FFF',
  shadow = '#C5C5C5',
  label,
}: {
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
        { backgroundColor: bg, shadowColor: shadow, transform: [{ translateY: pressed ? 1 : 0 }] },
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
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 22,
    shadowColor: '#D49A2A',
    shadowOpacity: 0.35,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
    overflow: 'visible',
  },
  pillBorder: {
    position: 'absolute',
    inset: 0,
    borderRadius: 22,
    borderWidth: 3,
    borderColor: '#2A2A2A',
  },
  badge: {
    backgroundColor: '#FFF7D6',
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 2.5,
    borderColor: '#2A2A2A',
    marginHorizontal: 4,
    minWidth: 68,
    alignItems: 'center',
  },
  badgeAccent: {
    backgroundColor: '#FFD1E0',
  },
  badgeLabel: {
    fontSize: 10,
    color: '#2A2A2A',
    fontWeight: '700',
    opacity: 0.8,
  },
  badgeValue: {
    marginTop: 1,
    fontSize: 16,
    color: '#2A2A2A',
    fontWeight: '900',
  },
  badgeValueAccent: {
    color: '#B00039',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginHorizontal: 4,
    backgroundColor: '#2A2A2A',
    opacity: 0.35,
  },
  buttonsWrap: {
    position: 'absolute',
    right: 10,
    top: 0,
    gap: 10,
    overflow: 'visible',
  },
  circleBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#2A2A2A',
    shadowOpacity: 0.25,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  iconWrap: {
    transform: [{ translateY: 1 }],
  },
});

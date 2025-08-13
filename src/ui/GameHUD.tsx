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

// --- small helpers ---
const Stat: React.FC<{ icon: React.ReactNode; label: string; value: string | number }> = ({
  icon,
  label,
  value,
}) => (
  <View style={styles.stat}>
    <View style={styles.statTop}>
      {icon}
      <Text style={styles.statLabel}>{label}</Text>
    </View>
    <Text style={styles.statValue}>{String(value)}</Text>
  </View>
);

const Separator = () => <View style={styles.sep} />;

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
           colors={['#AEE6FF', '#FFC2E8']}
           start={{ x: 0, y: 0 }}
           end={{ x: 1, y: 1 }}
           style={styles.hudBar}
         >
          {/* Chunky cartoon outline */}
          <View style={styles.hudStroke} pointerEvents="none" />

          {/* Top shine & bottom shade for depth */}
          <View style={styles.topShine} pointerEvents="none" />
          <View style={styles.bottomShade} pointerEvents="none" />

                     <View style={styles.hudContent}>
             <Stat
               icon={<Ionicons name="trophy" size={14} color="#5A3EFF" />}
               label="Round"
               value={round}
             />
             <Separator />
             <Stat
               icon={<Ionicons name="star" size={14} color="#5A3EFF" />}
               label="Points"
               value={points}
             />
             <Separator />
             <Stat
               icon={<Ionicons name="timer-outline" size={14} color="#5A3EFF" />}
               label="Time"
               value={`${timeLeft}s`}
             />
             <Separator />
             <Stat
               icon={<MaterialCommunityIcons name="target" size={14} color="#5A3EFF" />}
               label="To Go"
               value={Math.max(0, pointsRemaining)}
             />
           </View>

           {/* Optional "bubble" sprinkles */}
           <View pointerEvents="none" style={{ position: 'absolute', inset: 0 }}>
             <View style={{
               position: 'absolute', width: 10, height: 10, borderRadius: 10,
               backgroundColor: 'rgba(255,255,255,0.6)', top: 8, left: 12
             }}/>
             <View style={{
               position: 'absolute', width: 6, height: 6, borderRadius: 6,
               backgroundColor: 'rgba(255,255,255,0.55)', top: 16, left: 32
             }}/>
             <View style={{
               position: 'absolute', width: 8, height: 8, borderRadius: 8,
               backgroundColor: 'rgba(255,255,255,0.55)', bottom: 10, right: 16
             }}/>
           </View>
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
  buttonsWrap: {
    position: 'absolute',
    right: 10,
    top: 70,
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

  // Outer gradient pill
  hudBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 5 },
    elevation: 6,
  },

  // Bold outline
  hudStroke: {
    position: 'absolute',
    inset: 0,
    borderRadius: 18,
    borderWidth: 3,
    borderColor: '#5A3EFF', // playful purple outline
  },

  // Gentle highlight strip on top
  topShine: {
    position: 'absolute',
    left: 8, right: 8, top: 6,
    height: 10, borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.4)',
  },

  // Subtle inner shadow at bottom for depth
  bottomShade: {
    position: 'absolute',
    left: 8, right: 8, bottom: 6,
    height: 12, borderRadius: 10,
    backgroundColor: 'rgba(0,0,0,0.10)',
  },

  // Row of stats
  hudContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },

  // Each stat block
  stat: { minWidth: 70, paddingHorizontal: 6 },
  statTop: { flexDirection: 'row', alignItems: 'center', marginBottom: 2 },

  // brighter labels, darker values for contrast
  statLabel: {
    fontSize: 12,
    color: '#5A3EFF', // matches outline
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statValue: {
    fontSize: 18,
    color: '#1E1B4B', // deep indigo
    fontWeight: '900',
    textShadowColor: 'rgba(255,255,255,0.45)',
    textShadowRadius: 2,
    textShadowOffset: { width: 0, height: 1 },
  },

  // Vertical separators
  sep: {
    width: 2,
    height: 26,
    borderRadius: 2,
    backgroundColor: 'rgba(90,62,255,0.25)', // purple lightly
  },
});

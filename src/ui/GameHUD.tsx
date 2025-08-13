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
  totalScore?: number;       // cumulative score for the entire game
  roundTarget?: number;      // target points for current round
  isMuted: boolean;
  onToggleMute: () => void;
  onOpenSettings: () => void;
  onEndGame: () => void;
  containerStyle?: ViewStyle;
};

// --- small helpers ---
const Separator = () => <View style={styles.sep} />;

const Sep = () => (
  <View style={styles.sepWrap}>
    <LinearGradient
      colors={['#1E8E5A', '#6EF3A0']}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={styles.sep}
    />
    <View style={styles.sepDotTop} />
    <View style={styles.sepDotBottom} />
  </View>
);

export default function GameHUD({
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
      {/* Top center pill with stats */}
      <View style={styles.centerWrap} pointerEvents="box-none">
                 <LinearGradient
           colors={['#D7FF7A', '#6EF3A0']}
           start={{ x: 0, y: 0 }}
           end={{ x: 1, y: 1 }}
           style={styles.hudBar}
         >
          {/* Chunky cartoon outline */}
          <View style={styles.hudStroke} pointerEvents="none" />

          

                     <View style={styles.hudContent}>
             <View style={styles.statPill}>
               <Text style={styles.statLabel}>Round</Text>
               <Text style={styles.statValue}>{round}</Text>
             </View>

             <View style={styles.statPill}>
               <Text style={styles.statLabel}>Points</Text>
               <Text style={styles.statValue}>{roundTarget ? `${points}/${roundTarget}` : points}</Text>
             </View>

             <View style={styles.statPill}>
               <Text style={styles.statLabel}>Time</Text>
               <Text style={styles.statValue}>{timeLeft}s</Text>
             </View>

             <View style={styles.statPill}>
               <Text style={styles.statLabel}>Total</Text>
               <Text style={styles.statValue}>{totalScore !== undefined ? totalScore : points}</Text>
             </View>
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

      {/* Bottom horizontal buttons */}
      <View style={[styles.bottomButtonsWrap, { marginTop: insets.top + 90 }]}>
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
     justifyContent: 'center',
     paddingHorizontal: 24,
     paddingVertical: 12,
     borderRadius: 18,
     maxWidth: '95%',
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
     borderColor: '#000000', // black outline
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
     justifyContent: 'center',
     gap: 8,
   },

  // SLIME PILL behind each stat
     statPill: {
     minWidth: 80,
     paddingHorizontal: 10,
     paddingVertical: 8,
     borderRadius: 12,
     backgroundColor: 'rgba(110, 243, 160, 0.18)', // soft slime tint
     borderWidth: 1,
     borderColor: 'rgba(30, 142, 90, 0.35)',
     alignItems: 'center',
     justifyContent: 'center',
   },



     statLabel: {
     fontSize: 12,
     color: '#1E8E5A',
     fontWeight: '800',
     textTransform: 'uppercase',
     letterSpacing: 0.5,
     marginBottom: 4,
   },

                                                                                               statValue: {
         fontSize: 16,
         color: '#000000', // black color
         fontWeight: '900',
         textShadowColor: 'rgba(255,255,255,0.45)', // white shadow for black text
         textShadowRadius: 2,
         textShadowOffset: { width: 0, height: 1 },
       },

  // SLIME DIVIDER
  sepWrap: {
    width: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 2,
  },
  sep: {
    width: 4,
    height: 32,
    borderRadius: 4,
    shadowColor: '#1E8E5A',
    shadowOpacity: 0.25,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  sepDotTop: {
    position: 'absolute',
    top: 2,
    width: 6,
    height: 6,
    borderRadius: 6,
    backgroundColor: '#6EF3A0',
    transform: [{ translateX: 6 }],
    opacity: 0.9,
  },
  sepDotBottom: {
    position: 'absolute',
    bottom: 2,
    width: 8,
    height: 8,
    borderRadius: 8,
    backgroundColor: '#1E8E5A',
    transform: [{ translateX: -6 }],
    opacity: 0.85,
  },
});

// FancyHUD.tsx
import * as React from "react";
import { View, StyleSheet } from "react-native";
import { Surface, Chip, IconButton, Button, Text } from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type Props = {
  score: number;
  round: number;
  points: number;
  /** seconds remaining */
  timeLeft: number;

  muted?: boolean;
  onPressSettings?: () => void;
  onPressEndGame?: () => void;
  onToggleAudio?: () => void;

  /** Optional style knobs */
  accent?: string;   // pastel accent
  bg?: string;       // HUD background
  ink?: string;      // "ink" (text/icon) color
};

const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
const formatTime = (s: number) => {
  const m = Math.floor(Math.max(0, s) / 60);
  const r = Math.max(0, s) % 60;
  return `${pad(m)}:${pad(r)}`;
};

export default function FancyHUD({
  score,
  round,
  points,
  timeLeft,
  muted = false,
  onPressSettings,
  onPressEndGame,
  onToggleAudio,
  accent = "#FFE37B",               // cheerful pastel yellow
  bg = "rgba(255,255,255,0.96)",    // soft, milky white
  ink = "#161616",                  // comic "ink" outline color
}: Props) {
  const insets = useSafeAreaInsets();

  return (
    <View pointerEvents="box-none" style={[styles.wrap, { paddingTop: insets.top + 6 }]}>
      {/* Main bubble bar */}
      <Surface
        elevation={3}
        style={[
          styles.bar,
          {
            backgroundColor: bg,
            borderColor: ink,
          },
        ]}
      >
        {/* Left cluster: stats */}
        <View style={styles.left}>
          <Chip
            style={[styles.pill, { borderColor: ink }]}
            textStyle={[styles.pillLabel, { color: ink }]}
            mode="outlined"
          >
            Score: <Text style={[styles.pillValue, { color: ink }]}>{score}</Text>
          </Chip>

          <Chip
            style={[styles.pill, { borderColor: ink }]}
            textStyle={[styles.pillLabel, { color: ink }]}
            mode="outlined"
          >
            Round: <Text style={[styles.pillValue, { color: ink }]}>{round}</Text>
          </Chip>

          <Chip
            style={[styles.pill, { borderColor: ink }]}
            textStyle={[styles.pillLabel, { color: ink }]}
            mode="outlined"
          >
            Points: <Text style={[styles.pillValue, { color: ink }]}>{points}</Text>
          </Chip>
        </View>

        {/* Middle: big time bubble */}
        <Chip
          style={[
            styles.timePill,
            { backgroundColor: accent, borderColor: ink },
          ]}
          textStyle={[styles.timeText, { color: ink }]}
          mode="outlined"
          icon={() => (
            <Text style={[styles.timeIcon, { color: ink }]}>{/* emoji fallback */}⏱</Text>
          )}
        >
          {formatTime(timeLeft)}
        </Chip>

        {/* Right: controls */}
        <View style={styles.right}>
          <IconButton
            icon="cog"
            size={22}
            onPress={onPressSettings}
            style={[styles.iconBtn, { backgroundColor: accent, borderColor: ink }]}
            iconColor={ink}
          />
          <IconButton
            icon={muted ? "volume-off" : "volume-high"}
            size={22}
            onPress={onToggleAudio}
            style={[styles.iconBtn, { backgroundColor: accent, borderColor: ink }]}
            iconColor={ink}
          />
          <Button
            mode="contained"
            onPress={onPressEndGame}
            style={[styles.endBtn, { backgroundColor: accent, borderColor: ink }]}
            labelStyle={[styles.endLabel, { color: ink }]}
          >
            End Game
          </Button>
        </View>
      </Surface>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: "absolute",
    left: 10,
    right: 10,
    top: 0,
  },
  bar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 18,
    borderWidth: 3, // thick "cartoon" outline
  },

  left: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flexShrink: 1,
  },
  pill: {
    borderWidth: 2,
    borderRadius: 12,
    backgroundColor: "transparent",
  },
  pillLabel: {
    fontWeight: "800",
    fontSize: 12,
  },
  pillValue: {
    fontWeight: "900",
    fontSize: 12,
  },

  timePill: {
    borderWidth: 2,
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 2,
  },
  timeText: {
    fontWeight: "900",
    fontSize: 18,
    letterSpacing: 0.5,
  },
  timeIcon: {
    fontSize: 14,
    marginRight: -4,
  },

  right: {
    marginLeft: "auto",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flexShrink: 0,
  },
  iconBtn: {
    borderWidth: 2,
    borderRadius: 40,
    width: 38,
    height: 38,
    margin: 0,
  },
  endBtn: {
    borderWidth: 2,
    borderRadius: 12,
    height: 38,
    justifyContent: "center",
  },
  endLabel: {
    fontSize: 12,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
});

// highScore.js
import AsyncStorage from '@react-native-async-storage/async-storage';

const VERSION = 'v1';
// If you have multiple modes (e.g., 'classic', 'movingToilet'), pass a mode key.
// Otherwise always use 'default'.
const keyFor = (mode = 'default') => `HIGH_SCORE:${VERSION}:${mode}`;

export const HighScoreRecord = {
  score: 0,
  achievedAt: 0, // epoch ms
  mode: 'default'
};

function isValidScore(n) {
  return typeof n === 'number' && Number.isFinite(n) && n >= 0;
}

export async function getHighScore(mode = 'default') {
  try {
    const raw = await AsyncStorage.getItem(keyFor(mode));
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!isValidScore(parsed.score)) return null;
    return parsed;
  } catch {
    return null;
  }
}

export async function setHighScoreIfBest(score, mode = 'default') {
  const now = Date.now();
  if (!isValidScore(score)) {
    // Don't explode your game if a weird value sneaks in
    const existing = await getHighScore(mode);
    return existing ?? { score: 0, achievedAt: now, mode };
  }

  const prev = await getHighScore(mode);
  if (!prev || score > prev.score) {
    const rec = { score, achievedAt: now, mode };
    await AsyncStorage.setItem(keyFor(mode), JSON.stringify(rec));
    return rec;
  }
  return prev;
}

export async function resetHighScore(mode = 'default') {
  await AsyncStorage.removeItem(keyFor(mode));
}


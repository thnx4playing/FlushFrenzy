import { getJSON, setJSON } from './storage';
import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'HIGH_SCORE';

export async function loadHighScore() {
  const v = await getJSON(KEY, { highScore: 0 });
  return (v && typeof v.highScore === 'number') ? v : { highScore: 0 };
}

export async function saveHighScore(n) {
  await setJSON(KEY, { highScore: Number(n) || 0 });
}

export async function resetHighScore() {
  try {
    await AsyncStorage.removeItem(KEY);
  } catch (e) {
    console.warn('resetHighScore failed:', e);
  }
}


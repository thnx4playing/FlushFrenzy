import { getJSON, setJSON } from './storage';
import AsyncStorage from '@react-native-async-storage/async-storage';

export async function loadHighScore(mode = 'default') {
  const key = `HIGH_SCORE_${mode.toUpperCase()}`;
  const v = await getJSON(key, { highScore: 0 });
  return (v && typeof v.highScore === 'number') ? v : { highScore: 0 };
}

export async function saveHighScore(n, mode = 'default') {
  const key = `HIGH_SCORE_${mode.toUpperCase()}`;
  await setJSON(key, { highScore: Number(n) || 0 });
}

export async function resetHighScore(mode = 'default') {
  try {
    const key = `HIGH_SCORE_${mode.toUpperCase()}`;
    await AsyncStorage.removeItem(key);
  } catch (e) {
    console.warn('resetHighScore failed:', e);
  }
}


// e.g., src/state/practiceConfig.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import { safeParse } from '../utils/safeJSON';

const PRACTICE_KEY = 'practice.v1';

export type PracticeConfig = {
  gravity: number;
  toiletSpeed: number;
  tpSkin: string;
  // add any others you use…
};

export const DEFAULT_PRACTICE: PracticeConfig = {
  gravity: 5, // Default to middle of slider
  toiletSpeed: 5, // Default to middle of slider
  tpSkin: 'tp.png',
};

export async function loadPracticeConfig(): Promise<PracticeConfig> {
  const raw = await AsyncStorage.getItem(PRACTICE_KEY);
  const parsed = safeParse<PracticeConfig>(raw, DEFAULT_PRACTICE);
  // merge so new fields get defaults
  return { ...DEFAULT_PRACTICE, ...parsed };
}

export async function savePracticeConfig(cfg: PracticeConfig) {
  await AsyncStorage.setItem(PRACTICE_KEY, JSON.stringify(cfg));
}



import AsyncStorage from '@react-native-async-storage/async-storage';

export async function getJSON(key, fallback = null) {
  try {
    const raw = await AsyncStorage.getItem(key);
    if (raw == null) return fallback;
    const s = String(raw).trim();
    if (!s || s === 'undefined' || s === 'null') return fallback;
    return JSON.parse(s);
  } catch (e) {
    console.warn(`getJSON(${key}) failed`, e);
    return fallback;
  }
}

export async function setJSON(key, value) {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.warn(`setJSON(${key}) failed`, e);
  }
}





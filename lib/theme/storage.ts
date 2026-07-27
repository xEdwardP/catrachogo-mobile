import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

export type ThemePreference = 'system' | 'light' | 'dark';

const THEME_PREFERENCE_KEY = 'catrachogo_theme_preference';

async function setItem(key: string, value: string) {
  if (Platform.OS === 'web') {
    localStorage.setItem(key, value);
    return;
  }
  await SecureStore.setItemAsync(key, value);
}

async function getItem(key: string): Promise<string | null> {
  if (Platform.OS === 'web') {
    return localStorage.getItem(key);
  }
  return SecureStore.getItemAsync(key);
}

function isThemePreference(value: string): value is ThemePreference {
  return value === 'system' || value === 'light' || value === 'dark';
}

export async function saveThemePreference(preference: ThemePreference): Promise<void> {
  await setItem(THEME_PREFERENCE_KEY, preference);
}

export async function loadThemePreference(): Promise<ThemePreference | null> {
  const raw = await getItem(THEME_PREFERENCE_KEY);
  if (raw && isThemePreference(raw)) return raw;
  return null;
}

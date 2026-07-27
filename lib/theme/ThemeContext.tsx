import { createContext, useContext, useEffect, useState, type PropsWithChildren } from 'react';

import { loadThemePreference, saveThemePreference, type ThemePreference } from './storage';
import { useSystemColorScheme } from './useSystemColorScheme';

export type { ThemePreference };

type ThemeContextValue = {
  preference: ThemePreference;
  colorScheme: 'light' | 'dark';
  setPreference: (preference: ThemePreference) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: PropsWithChildren) {
  const systemScheme = useSystemColorScheme();
  const [preference, setPreferenceState] = useState<ThemePreference>('system');

  useEffect(() => {
    loadThemePreference().then((stored) => {
      if (stored) setPreferenceState(stored);
    });
  }, []);

  function setPreference(next: ThemePreference) {
    setPreferenceState(next);
    saveThemePreference(next).catch(() => {});
  }

  const colorScheme = preference === 'system' ? systemScheme : preference;

  return (
    <ThemeContext.Provider value={{ preference, colorScheme, setPreference }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useThemePreference(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useThemePreference must be used within a ThemeProvider');
  }
  return context;
}

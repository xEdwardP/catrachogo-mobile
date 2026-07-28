import { useThemePreference } from '@/lib/theme/ThemeContext';

export function useColorScheme(): 'light' | 'dark' {
  return useThemePreference().colorScheme;
}

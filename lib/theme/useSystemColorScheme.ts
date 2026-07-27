import { useColorScheme as useColorSchemeCore } from 'react-native';

export function useSystemColorScheme(): 'light' | 'dark' {
  const coreScheme = useColorSchemeCore();
  return coreScheme ?? 'light';
}

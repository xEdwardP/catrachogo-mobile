import { ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import 'react-native-reanimated';

import { useColorScheme } from '@/components/useColorScheme';
import { DarkNavigationTheme, LightNavigationTheme } from '@/constants/NavigationTheme';
import { AuthProvider, useAuth } from '@/lib/auth/AuthContext';

export { ErrorBoundary } from 'expo-router';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  if (!loaded) {
    return null;
  }

  return (
    <AuthProvider>
      <RootLayoutNav />
    </AuthProvider>
  );
}

function RootLayoutNav() {
  const colorScheme = useColorScheme();
  const { session, profile, isLoading } = useAuth();
  const hasCompleteProfile = Boolean(session) && Boolean(profile?.phone);

  useEffect(() => {
    if (!isLoading) {
      SplashScreen.hideAsync();
    }
  }, [isLoading]);

  if (isLoading) {
    return null;
  }

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkNavigationTheme : LightNavigationTheme}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />

        <Stack.Protected guard={!session}>
          <Stack.Screen name="(auth)" />
        </Stack.Protected>

        <Stack.Protected guard={Boolean(session) && !profile?.phone}>
          <Stack.Screen name="complete-profile" />
        </Stack.Protected>

        <Stack.Protected guard={hasCompleteProfile && session?.role === 'passenger'}>
          <Stack.Screen name="(passenger)/(tabs)" />
        </Stack.Protected>

        <Stack.Protected guard={hasCompleteProfile && session?.role === 'driver'}>
          <Stack.Screen name="(driver)/(tabs)" />
        </Stack.Protected>

        <Stack.Protected guard={hasCompleteProfile && session?.role === 'admin'}>
          <Stack.Screen name="(admin)/(tabs)" />
        </Stack.Protected>
      </Stack>
    </ThemeProvider>
  );
}

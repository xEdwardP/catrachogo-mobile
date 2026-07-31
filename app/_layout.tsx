import { ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import 'react-native-reanimated';

import { GlobalErrorScreen } from '@/components/GlobalErrorScreen';
import { OfflineBanner } from '@/components/OfflineBanner';
import { useColorScheme } from '@/components/useColorScheme';
import { DarkNavigationTheme, LightNavigationTheme } from '@/constants/NavigationTheme';
import { AuthProvider, useAuth } from '@/lib/auth/AuthContext';
import { usePushNotifications } from '@/lib/notifications/usePushNotifications';
import { ThemeProvider as AppThemeProvider } from '@/lib/theme/ThemeContext';

export { GlobalErrorScreen as ErrorBoundary };

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
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AppThemeProvider>
        <AuthProvider>
          <RootLayoutNav />
        </AuthProvider>
      </AppThemeProvider>
    </GestureHandlerRootView>
  );
}

function RootLayoutNav() {
  const colorScheme = useColorScheme();
  const { session, profile, isLoading } = useAuth();
  const hasCompleteProfile = Boolean(session) && Boolean(profile?.phone);

  usePushNotifications();

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
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
      <OfflineBanner />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="support" />
        <Stack.Screen name="legal/[doc]" />
        <Stack.Screen name="notifications" />

        <Stack.Protected guard={!session}>
          <Stack.Screen name="(auth)" />
        </Stack.Protected>

        <Stack.Protected guard={Boolean(session) && !profile?.phone}>
          <Stack.Screen name="complete-profile" />
        </Stack.Protected>

        <Stack.Protected guard={hasCompleteProfile && session?.role === 'passenger'}>
          <Stack.Screen name="(passenger)" />
        </Stack.Protected>

        <Stack.Protected guard={hasCompleteProfile && session?.role === 'driver'}>
          <Stack.Screen name="(driver)" />
        </Stack.Protected>

        <Stack.Protected guard={hasCompleteProfile && session?.role === 'admin'}>
          <Stack.Screen name="(admin)" />
        </Stack.Protected>
      </Stack>
    </ThemeProvider>
  );
}

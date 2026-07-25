import { Tabs } from 'expo-router';

import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';

export default function AdminTabsLayout() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.tint,
        tabBarInactiveTintColor: colors.tabIconDefault,
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Dashboard' }} />
      <Tabs.Screen name="drivers" options={{ title: 'Conductores' }} />
      <Tabs.Screen name="trips" options={{ title: 'Viajes' }} />
      <Tabs.Screen name="more" options={{ title: 'Más' }} />
    </Tabs>
  );
}

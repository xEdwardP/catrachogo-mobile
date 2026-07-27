import { Stack } from 'expo-router';

export default function AdminLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="driver/[driverId]" />
      <Stack.Screen name="withdrawals" />
      <Stack.Screen name="profile" />
      <Stack.Screen name="zones" />
      <Stack.Screen name="incident-reports" />
    </Stack>
  );
}

import { Stack } from 'expo-router';

export default function PassengerLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="request-trip" />
      <Stack.Screen name="trip/[tripId]" />
    </Stack>
  );
}

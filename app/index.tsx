import { Redirect } from 'expo-router';

import { useAuth } from '@/lib/auth/AuthContext';

export default function Index() {
  const { session } = useAuth();

  if (!session) {
    return <Redirect href="/(auth)/login" />;
  }
  if (session.role === 'passenger') {
    return <Redirect href="/(passenger)/(tabs)" />;
  }
  if (session.role === 'driver') {
    return <Redirect href="/(driver)/(tabs)" />;
  }
  return <Redirect href="/(admin)/(tabs)" />;
}

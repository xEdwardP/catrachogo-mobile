import { router } from 'expo-router';
import { useEffect } from 'react';

import { PlaceholderScreen } from '@/components/PlaceholderScreen';
import { getApiStatusCode } from '@/lib/api/client';
import { getDriverSummary } from '@/lib/api/drivers';

export default function DriverHomeScreen() {
  useEffect(() => {
    getDriverSummary().catch((error) => {
      if (getApiStatusCode(error) === 403) {
        router.replace('/(driver)/complete-profile');
      }
    });
  }, []);

  return <PlaceholderScreen title="Inicio (Conductor)" showLogout />;
}

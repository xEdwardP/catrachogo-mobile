import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';
import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';

import { registerPushToken } from '@/lib/api/notifications';
import { useAuth } from '@/lib/auth/AuthContext';
import type { StoredSession } from '@/lib/auth/storage';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

const TRIP_NOTIFICATION_TYPES = new Set(['trip_accepted', 'trip_started', 'driver_arrived']);

function handleNotificationData(session: StoredSession, data: Record<string, unknown>) {
  const type = typeof data.type === 'string' ? data.type : undefined;
  const relatedTripId = typeof data.relatedTripId === 'string' ? data.relatedTripId : undefined;

  if (type && TRIP_NOTIFICATION_TYPES.has(type) && relatedTripId) {
    if (session.role === 'passenger') {
      router.push({ pathname: '/(passenger)/trip/[tripId]', params: { tripId: relatedTripId } });
    } else if (session.role === 'driver') {
      router.push({ pathname: '/(driver)/trip/[tripId]', params: { tripId: relatedTripId } });
    }
    return;
  }

  if (type === 'withdrawal_resolved' && session.role === 'driver') {
    router.push('/(driver)/(tabs)/wallet');
    return;
  }

  if (type === 'driver_verification_updated' && session.role === 'driver') {
    router.push('/(driver)/(tabs)/profile');
    return;
  }

  if (type === 'incident_report_submitted' && session.role === 'admin') {
    router.push('/(admin)/(tabs)/incident-reports');
    return;
  }

  if (type === 'driver_pending_approval' && session.role === 'admin') {
    router.push('/(admin)/(tabs)/drivers');
  }
}

export function usePushNotifications() {
  const { session } = useAuth();
  const sessionRef = useRef(session);
  sessionRef.current = session;

  useEffect(() => {
    if (!session || Platform.OS !== 'android' || !Device.isDevice) return;

    let cancelled = false;

    (async () => {
      try {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'General',
          importance: Notifications.AndroidImportance.HIGH,
          lightColor: '#E8532E',
        });

        const existing = await Notifications.getPermissionsAsync();
        let status = existing.status;
        if (status !== 'granted') {
          const requested = await Notifications.requestPermissionsAsync();
          status = requested.status;
        }
        if (status !== 'granted' || cancelled) return;

        const projectId = Constants.expoConfig?.extra?.eas?.projectId;
        const { data: token } = await Notifications.getExpoPushTokenAsync({ projectId });
        if (cancelled) return;
        await registerPushToken(token).catch(() => {});
      } catch {}
    })();

    return () => {
      cancelled = true;
    };
  }, [session]);

  useEffect(() => {
    const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
      const currentSession = sessionRef.current;
      if (!currentSession) return;
      const data = response.notification.request.content.data as Record<string, unknown>;
      handleNotificationData(currentSession, data);
    });

    return () => subscription.remove();
  }, []);
}

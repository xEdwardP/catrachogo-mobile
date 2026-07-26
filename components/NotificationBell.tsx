import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, StyleSheet } from 'react-native';

import { Text, View } from '@/components/Themed';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { getUnreadNotificationsCount } from '@/lib/api/notifications';
import { usePolling } from '@/lib/hooks/usePolling';

const UNREAD_POLL_INTERVAL_MS = 45000;

export function NotificationBell() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];
  const [unreadCount, setUnreadCount] = useState(0);

  const refreshCount = useCallback(() => {
    getUnreadNotificationsCount()
      .then(setUnreadCount)
      .catch(() => {});
  }, []);

  usePolling(refreshCount, UNREAD_POLL_INTERVAL_MS, true);

  useFocusEffect(refreshCount);

  return (
    <Pressable
      style={[styles.container, { borderColor: colors.tint }]}
      onPress={() => router.push('/notifications')}
      hitSlop={6}
    >
      <Text style={[styles.label, { color: colors.tint }]}>Avisos</Text>
      {unreadCount > 0 && (
        <View style={[styles.badge, { backgroundColor: colors.tint }]}>
          <Text style={styles.badgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
  },
  badge: {
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    paddingHorizontal: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
});

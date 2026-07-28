import { Ionicons } from '@expo/vector-icons';
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
      style={[styles.container, { backgroundColor: colors.surfaceHighlight }]}
      onPress={() => router.push('/notifications')}
      hitSlop={6}
    >
      <Ionicons
        name={unreadCount > 0 ? 'notifications' : 'notifications-outline'}
        size={20}
        color={colors.tint}
      />
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
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: -2,
    right: -2,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
});

import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet } from 'react-native';

import { Text, View } from '@/components/Themed';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { getApiErrorMessage } from '@/lib/api/errors';
import {
  getNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  type AppNotification,
} from '@/lib/api/notifications';
import { useAuth } from '@/lib/auth/AuthContext';
import { formatRelativeTime } from '@/lib/time/relativeTime';

const PAGE_SIZE = 20;

const TRIP_NOTIFICATION_TYPES = new Set([
  'trip_accepted',
  'trip_started',
  'trip_completed',
  'trip_cancelled',
]);

export default function NotificationsScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];
  const { session } = useAuth();

  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadPage = useCallback((pageToLoad: number) => {
    getNotifications(pageToLoad, PAGE_SIZE)
      .then((result) => {
        setNotifications((prev) => (pageToLoad === 1 ? result.data : [...prev, ...result.data]));
        setTotal(result.total);
        setError(null);
      })
      .catch((err) => setError(getApiErrorMessage(err)))
      .finally(() => {
        setIsLoading(false);
        setIsLoadingMore(false);
      });
  }, []);

  useEffect(() => {
    setIsLoading(true);
    loadPage(1);
  }, [loadPage]);

  const hasUnread = notifications.some((notification) => !notification.read);

  function handleEndReached() {
    if (isLoadingMore || isLoading || notifications.length >= total) return;
    const nextPage = page + 1;
    setIsLoadingMore(true);
    setPage(nextPage);
    loadPage(nextPage);
  }

  async function handleMarkAllRead() {
    const previous = notifications;
    setNotifications((current) => current.map((item) => ({ ...item, read: true })));
    try {
      await markAllNotificationsRead();
    } catch {
      setNotifications(previous);
    }
  }

  function handlePressNotification(notification: AppNotification) {
    if (!notification.read) {
      setNotifications((current) =>
        current.map((item) => (item.id === notification.id ? { ...item, read: true } : item)),
      );
      markNotificationRead(notification.id).catch(() => {});
    }

    if (!TRIP_NOTIFICATION_TYPES.has(notification.type) || !notification.relatedTripId) return;

    if (session?.role === 'passenger') {
      router.push({
        pathname: '/(passenger)/trip/[tripId]',
        params: { tripId: notification.relatedTripId },
      });
    } else if (session?.role === 'driver') {
      router.push({
        pathname: '/(driver)/trip/[tripId]',
        params: { tripId: notification.relatedTripId },
      });
    }
  }

  return (
    <View style={styles.container}>
      <Pressable style={styles.backButton} onPress={() => router.back()}>
        <Text style={{ color: colors.textSecondary }}>← Volver</Text>
      </Pressable>

      <View style={styles.headerRow}>
        <Text style={styles.title}>Notificaciones</Text>
        {hasUnread && (
          <Pressable onPress={handleMarkAllRead} hitSlop={6}>
            <Text style={[styles.markAllText, { color: colors.tint }]}>Marcar todas</Text>
          </Pressable>
        )}
      </View>

      {isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator color={colors.tint} />
        </View>
      ) : error ? (
        <View style={styles.centered}>
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>{error}</Text>
        </View>
      ) : notifications.length === 0 ? (
        <View style={styles.centered}>
          <Text style={[styles.emptyTitle, { color: colors.text }]}>No tienes notificaciones</Text>
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            Aquí te avisaremos sobre tus viajes, retiros y calificaciones.
          </Text>
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          onEndReached={handleEndReached}
          onEndReachedThreshold={0.4}
          ListFooterComponent={
            isLoadingMore ? (
              <View style={styles.footerLoading}>
                <ActivityIndicator color={colors.tint} />
              </View>
            ) : null
          }
          renderItem={({ item }) => (
            <Pressable
              style={[
                styles.card,
                { backgroundColor: colors.surfaceHighlight },
                item.read && styles.cardRead,
              ]}
              onPress={() => handlePressNotification(item)}
            >
              <View
                style={[
                  styles.unreadDot,
                  { backgroundColor: item.read ? 'transparent' : colors.tint },
                ]}
              />
              <View style={styles.cardBody}>
                <Text style={styles.cardTitle}>{item.title}</Text>
                <Text style={[styles.cardText, { color: colors.textSecondary }]}>{item.body}</Text>
                <Text style={[styles.cardDate, { color: colors.textSecondary }]}>
                  {formatRelativeTime(item.createdAt)}
                </Text>
              </View>
            </Pressable>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 56,
    paddingHorizontal: 16,
  },
  backButton: {
    alignSelf: 'flex-start',
    paddingVertical: 4,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
    marginBottom: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
  },
  markAllText: {
    fontSize: 13,
    fontWeight: '600',
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingBottom: 80,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '600',
  },
  emptyText: {
    fontSize: 13,
    textAlign: 'center',
  },
  listContent: {
    paddingBottom: 24,
    gap: 10,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    borderRadius: 12,
    padding: 14,
  },
  cardRead: {
    opacity: 0.7,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 5,
  },
  cardBody: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  cardText: {
    fontSize: 13,
    marginTop: 2,
  },
  cardDate: {
    fontSize: 11,
    marginTop: 6,
  },
  footerLoading: {
    paddingVertical: 16,
  },
});

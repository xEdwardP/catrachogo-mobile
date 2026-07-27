import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, ScrollView, StyleSheet } from 'react-native';

import { Text, View } from '@/components/Themed';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { TRIP_STATUS_BADGE_COLORS, TRIP_STATUS_LABELS } from '@/constants/TripStatusLabels';
import { getAdminTrips } from '@/lib/api/admin';
import { getApiErrorMessage } from '@/lib/api/errors';
import type { Trip, TripStatus } from '@/lib/api/trips';

const PAGE_SIZE = 20;

const STATUS_TABS: { value: TripStatus | null; label: string }[] = [
  { value: null, label: 'Todos' },
  { value: 'pending', label: 'Pendientes' },
  { value: 'accepted', label: 'Aceptados' },
  { value: 'in_progress', label: 'En curso' },
  { value: 'completed', label: 'Completados' },
  { value: 'cancelled', label: 'Cancelados' },
];

export default function AdminTripsScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];

  const [status, setStatus] = useState<TripStatus | null>(null);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadPage = useCallback((forStatus: TripStatus | null, pageToLoad: number) => {
    getAdminTrips(forStatus ?? undefined, pageToLoad, PAGE_SIZE)
      .then((result) => {
        setTrips((prev) => (pageToLoad === 1 ? result.data : [...prev, ...result.data]));
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
    setPage(1);
    loadPage(status, 1);
  }, [status, loadPage]);

  function handleStatusChange(nextStatus: TripStatus | null) {
    if (nextStatus === status) return;
    setStatus(nextStatus);
  }

  function handleEndReached() {
    if (isLoadingMore || isLoading || trips.length >= total) return;
    const nextPage = page + 1;
    setIsLoadingMore(true);
    setPage(nextPage);
    loadPage(status, nextPage);
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Viajes</Text>
      <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
        {isLoading ? 'Cargando...' : `${total} viajes en total`}
      </Text>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.tabsScroll}
        contentContainerStyle={styles.tabsRow}
      >
        {STATUS_TABS.map((tab) => {
          const isActive = tab.value === status;
          return (
            <Pressable
              key={tab.label}
              style={[
                styles.tab,
                { borderColor: isActive ? colors.tint : colors.textSecondary },
                isActive && { backgroundColor: colors.tint },
              ]}
              onPress={() => handleStatusChange(tab.value)}
            >
              <Text style={[styles.tabText, isActive ? styles.tabTextActive : undefined]}>
                {tab.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator color={colors.tint} />
        </View>
      ) : error ? (
        <View style={styles.centered}>
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>{error}</Text>
        </View>
      ) : trips.length === 0 ? (
        <View style={styles.centered}>
          <Text style={[styles.emptyTitle, { color: colors.text }]}>
            No hay viajes con este filtro
          </Text>
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            Prueba con otro estado o revisa más tarde.
          </Text>
        </View>
      ) : (
        <FlatList
          data={trips}
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
          renderItem={({ item }) => {
            const badgeColors = TRIP_STATUS_BADGE_COLORS[item.status];
            return (
              <View style={[styles.card, { backgroundColor: colors.surfaceHighlight }]}>
                <View style={[styles.cardHeader, styles.transparentBackground]}>
                  <View style={[styles.badge, { backgroundColor: badgeColors.background }]}>
                    <Text style={[styles.badgeText, { color: badgeColors.text }]}>
                      {TRIP_STATUS_LABELS[item.status]}
                    </Text>
                  </View>
                  <Text style={styles.fareText}>L. {item.fare.toFixed(2)}</Text>
                </View>
                <Text style={styles.addressText} numberOfLines={1}>
                  {item.originAddress}
                </Text>
                <Text
                  style={[styles.addressText, { color: colors.textSecondary }]}
                  numberOfLines={1}
                >
                  → {item.destinationAddress}
                </Text>
                <Text style={[styles.dateText, { color: colors.textSecondary }]}>
                  {new Date(item.requestedAt).toLocaleString('es-HN')}
                </Text>
              </View>
            );
          }}
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
  title: {
    fontSize: 22,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 12,
    marginTop: 2,
    marginBottom: 14,
  },
  tabsScroll: {
    flexGrow: 0,
    marginBottom: 12,
  },
  tabsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  tab: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
  },
  tabTextActive: {
    color: '#fff',
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
    borderRadius: 12,
    padding: 14,
    gap: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  transparentBackground: {
    backgroundColor: 'transparent',
  },
  badge: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  fareText: {
    fontSize: 14,
    fontWeight: '700',
  },
  addressText: {
    fontSize: 14,
  },
  dateText: {
    fontSize: 12,
    marginTop: 4,
  },
  footerLoading: {
    paddingVertical: 16,
  },
});

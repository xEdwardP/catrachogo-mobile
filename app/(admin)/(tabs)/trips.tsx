import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet } from 'react-native';

import { Text, View } from '@/components/Themed';
import { Card } from '@/components/ui/Card';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { SegmentedTabs } from '@/components/ui/SegmentedTabs';
import { useColorScheme } from '@/components/useColorScheme';
import { getCancellationReasonLabel } from '@/constants/CancellationReasons';
import Colors from '@/constants/Colors';
import { TRIP_STATUS_BADGE_COLORS, TRIP_STATUS_LABELS } from '@/constants/TripStatusLabels';
import { getAdminTrips } from '@/lib/api/admin';
import { getApiErrorMessage } from '@/lib/api/errors';
import type { Trip, TripStatus } from '@/lib/api/trips';
import { useOpenDrawer } from '@/lib/navigation/useOpenDrawer';

const PAGE_SIZE = 20;

const STATUS_TABS_ROW_1: { value: TripStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'Todos' },
  { value: 'pending', label: 'Pendientes' },
  { value: 'accepted', label: 'Aceptados' },
];

const STATUS_TABS_ROW_2: { value: TripStatus | 'all'; label: string }[] = [
  { value: 'in_progress', label: 'En curso' },
  { value: 'completed', label: 'Completados' },
  { value: 'cancelled', label: 'Cancelados' },
];

export default function AdminTripsScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];
  const openDrawer = useOpenDrawer();

  const [status, setStatus] = useState<TripStatus | 'all'>('all');
  const [trips, setTrips] = useState<Trip[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadPage = useCallback((forStatus: TripStatus | 'all', pageToLoad: number) => {
    getAdminTrips(forStatus === 'all' ? undefined : forStatus, pageToLoad, PAGE_SIZE)
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

  function handleStatusChange(nextStatus: TripStatus | 'all') {
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
      <ScreenHeader title="Viajes" onMenuPress={openDrawer} />
      <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
        {isLoading ? 'Cargando...' : `${total} viajes en total`}
      </Text>

      <SegmentedTabs
        tabs={STATUS_TABS_ROW_1}
        value={status}
        onChange={handleStatusChange}
        style={styles.tabsRowSpaced}
      />
      <SegmentedTabs
        tabs={STATUS_TABS_ROW_2}
        value={status}
        onChange={handleStatusChange}
        style={styles.tabsRow}
      />

      {isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator color={colors.tint} />
        </View>
      ) : error ? (
        <View style={styles.centered}>
          <Ionicons name="alert-circle-outline" size={22} color={colors.textSecondary} />
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>{error}</Text>
        </View>
      ) : trips.length === 0 ? (
        <View style={styles.centered}>
          <Ionicons name="car-outline" size={22} color={colors.tint} />
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
              <Card style={styles.card}>
                <View style={[styles.cardHeader, styles.transparentBackground]}>
                  <View style={[styles.badge, { backgroundColor: badgeColors.background }]}>
                    <Text style={[styles.badgeText, { color: badgeColors.text }]}>
                      {TRIP_STATUS_LABELS[item.status]}
                    </Text>
                  </View>
                  <Text style={styles.fareText}>L. {item.fare.toFixed(2)}</Text>
                </View>
                <View style={[styles.addressRow, styles.transparentBackground]}>
                  <Ionicons name="navigate-outline" size={13} color={colors.textSecondary} />
                  <Text style={styles.addressText} numberOfLines={1}>
                    {item.originAddress}
                  </Text>
                </View>
                <View style={[styles.addressRow, styles.transparentBackground]}>
                  <Ionicons name="flag-outline" size={13} color={colors.textSecondary} />
                  <Text
                    style={[styles.addressText, { color: colors.textSecondary }]}
                    numberOfLines={1}
                  >
                    {item.destinationAddress}
                  </Text>
                </View>
                <Text style={[styles.dateText, { color: colors.textSecondary }]}>
                  {new Date(item.requestedAt).toLocaleString('es-HN')}
                </Text>
                {item.status === 'cancelled' && (
                  <View style={[styles.addressRow, styles.transparentBackground]}>
                    <Ionicons name="alert-circle-outline" size={13} color={colors.textSecondary} />
                    <Text style={[styles.cancelReasonText, { color: colors.textSecondary }]}>
                      Motivo: {getCancellationReasonLabel(item.cancelReason)}
                    </Text>
                  </View>
                )}
              </Card>
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
  subtitle: {
    fontSize: 12,
    marginTop: -4,
    marginBottom: 14,
  },
  tabsRow: {
    marginBottom: 12,
  },
  tabsRowSpaced: {
    marginBottom: 8,
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
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  addressText: {
    flex: 1,
    fontSize: 14,
  },
  dateText: {
    fontSize: 12,
    marginTop: 4,
  },
  cancelReasonText: {
    fontSize: 12,
  },
  footerLoading: {
    paddingVertical: 16,
  },
});

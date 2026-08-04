import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet } from 'react-native';

import { Text, View } from '@/components/Themed';
import { TripDetailModal } from '@/components/TripDetailModal';
import { Card } from '@/components/ui/Card';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { TRIP_STATUS_BADGE_COLORS, TRIP_STATUS_LABELS } from '@/constants/TripStatusLabels';
import { getTripHistory, type Trip, type TripHistoryItem } from '@/lib/api/trips';

const PAGE_SIZE = 20;

type Props = {
  title: string;
  isTrackable: (trip: Trip) => boolean;
  onPressTrip: (trip: Trip) => void;
  canReportTrip?: (trip: Trip) => boolean;
  onReportTrip?: (trip: Trip) => void;
  onMenuPress?: () => void;
};

export function TripHistoryList({
  title,
  isTrackable,
  onPressTrip,
  canReportTrip,
  onReportTrip,
  onMenuPress,
}: Props) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];

  const [trips, setTrips] = useState<TripHistoryItem[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [detailTrip, setDetailTrip] = useState<TripHistoryItem | null>(null);

  const loadPage = useCallback((pageToLoad: number) => {
    getTripHistory(pageToLoad, PAGE_SIZE)
      .then((result) => {
        setTrips((prev) => (pageToLoad === 1 ? result.data : [...prev, ...result.data]));
        setTotal(result.total);
        setError(null);
      })
      .catch(() => setError('No se pudo cargar el historial de viajes.'))
      .finally(() => {
        setIsLoading(false);
        setIsLoadingMore(false);
      });
  }, []);

  useEffect(() => {
    setIsLoading(true);
    loadPage(1);
  }, [loadPage]);

  function handleEndReached() {
    if (isLoadingMore || isLoading || trips.length >= total) return;
    const nextPage = page + 1;
    setIsLoadingMore(true);
    setPage(nextPage);
    loadPage(nextPage);
  }

  return (
    <View style={styles.container}>
      <ScreenHeader title={title} onMenuPress={onMenuPress} />

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
          <Text style={[styles.emptyTitle, { color: colors.text }]}>Todavía no tienes viajes</Text>
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            Cuando completes tu primer viaje aparecerá aquí.
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
            const trackable = isTrackable(item);
            return (
              <Card style={styles.card}>
                <Pressable
                  style={styles.cardMain}
                  onPress={() => (trackable ? onPressTrip(item) : setDetailTrip(item))}
                >
                  <View style={[styles.cardHeader, styles.transparentBackground]}>
                    <View style={[styles.badge, { backgroundColor: badgeColors.background }]}>
                      <Text style={[styles.badgeText, { color: badgeColors.text }]}>
                        {TRIP_STATUS_LABELS[item.status]}
                      </Text>
                    </View>
                    <Text style={styles.fareText}>L. {item.fare.toFixed(2)}</Text>
                  </View>
                  {item.requestedAt && (
                    <Text style={[styles.dateText, { color: colors.textSecondary }]}>
                      {new Date(item.requestedAt).toLocaleString('es-HN')}
                    </Text>
                  )}
                </Pressable>
                {onReportTrip && canReportTrip?.(item) && (
                  <Pressable
                    style={styles.reportButton}
                    onPress={() => onReportTrip(item)}
                    hitSlop={6}
                  >
                    <Text style={[styles.reportButtonText, { color: colors.textSecondary }]}>
                      Reportar
                    </Text>
                  </Pressable>
                )}
              </Card>
            );
          }}
        />
      )}

      <TripDetailModal trip={detailTrip} onDismiss={() => setDetailTrip(null)} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 56,
    paddingHorizontal: 16,
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
    gap: 6,
  },
  cardMain: {
    gap: 6,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
  dateText: {
    fontSize: 12,
  },
  reportButton: {
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  reportButtonText: {
    fontSize: 12,
    fontWeight: '600',
  },
  footerLoading: {
    paddingVertical: 16,
  },
});

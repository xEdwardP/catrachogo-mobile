import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet } from 'react-native';

import { Text, View } from '@/components/Themed';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { TRIP_STATUS_BADGE_COLORS, TRIP_STATUS_LABELS } from '@/constants/TripStatusLabels';
import { getTripHistory, type Trip } from '@/lib/api/trips';

const PAGE_SIZE = 20;

export default function PassengerActivityScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];

  const [trips, setTrips] = useState<Trip[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  function handlePressTrip(trip: Trip) {
    if (trip.status === 'pending' || trip.status === 'accepted' || trip.status === 'in_progress') {
      router.push({
        pathname: '/(passenger)/trip/[tripId]',
        params: { tripId: trip.id, destinationAddress: trip.destinationAddress ?? '' },
      });
    }
  }

  const isTrackable = (status: Trip['status']) =>
    status === 'pending' || status === 'accepted' || status === 'in_progress';

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Actividad</Text>

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
            const trackable = isTrackable(item.status);
            return (
              <Pressable
                style={[styles.card, { backgroundColor: colors.surfaceHighlight }]}
                onPress={() => handlePressTrip(item)}
                disabled={!trackable}
              >
                <View style={[styles.cardHeader, styles.transparentBackground]}>
                  <View style={[styles.badge, { backgroundColor: badgeColors.background }]}>
                    <Text style={[styles.badgeText, { color: badgeColors.text }]}>
                      {TRIP_STATUS_LABELS[item.status]}
                    </Text>
                  </View>
                  <Text style={styles.fareText}>L. {item.fare.toFixed(2)}</Text>
                </View>
                <Text style={styles.destinationText} numberOfLines={1}>
                  {item.destinationAddress}
                </Text>
                {item.requestedAt && (
                  <Text style={[styles.dateText, { color: colors.textSecondary }]}>
                    {new Date(item.requestedAt).toLocaleString('es-HN')}
                  </Text>
                )}
              </Pressable>
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
    marginBottom: 16,
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
  destinationText: {
    fontSize: 14,
  },
  dateText: {
    fontSize: 12,
  },
  footerLoading: {
    paddingVertical: 16,
  },
});

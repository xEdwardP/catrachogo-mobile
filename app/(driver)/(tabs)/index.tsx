import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Pressable, StyleSheet } from 'react-native';

import { Text, View } from '@/components/Themed';
import { TripMap } from '@/components/TripMap';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { TRIP_STATUS_BADGE_COLORS, TRIP_STATUS_LABELS } from '@/constants/TripStatusLabels';
import { useAuth } from '@/lib/auth/AuthContext';
import { getApiStatusCode } from '@/lib/api/client';
import { getDriverSummary, updateAvailability, type DriverSummary } from '@/lib/api/drivers';
import { getPendingRequest } from '@/lib/api/drivers';
import { getTripHistory, type Trip } from '@/lib/api/trips';
import { sendDriverLocation } from '@/lib/api/tracking';
import { useCurrentLocation } from '@/lib/location/useCurrentLocation';
import { usePolling } from '@/lib/hooks/usePolling';

const RECENT_TRIPS_LIMIT = 5;
const DEFAULT_CENTER = { lat: 15.5, lng: -88.03 };

export default function DriverHomeScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];
  const { profile } = useAuth();
  const { location } = useCurrentLocation();

  const [summary, setSummary] = useState<DriverSummary | null>(null);
  const [isAvailable, setIsAvailable] = useState(false);
  const [isTogglingAvailability, setIsTogglingAvailability] = useState(false);
  const [availabilityError, setAvailabilityError] = useState<string | null>(null);
  const [recentTrips, setRecentTrips] = useState<Trip[]>([]);

  const fetchSummary = useCallback(() => {
    getDriverSummary()
      .then((result) => {
        setSummary(result);
        setIsAvailable(result.available);
      })
      .catch((error) => {
        if (getApiStatusCode(error) === 403) {
          router.replace('/(driver)/complete-profile');
        }
      });
  }, []);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  useEffect(() => {
    getTripHistory(1, RECENT_TRIPS_LIMIT)
      .then((result) => setRecentTrips(result.data))
      .catch(() => {});
  }, []);

  usePolling(
    () => {
      if (!location) return;
      sendDriverLocation(location.lat, location.lng).catch(() => {});
    },
    5000,
    isAvailable,
  );

  usePolling(
    () => {
      getPendingRequest()
        .then((request) => {
          if (request) {
            router.push({
              pathname: '/(driver)/request/[tripId]',
              params: {
                tripId: request.id,
                passengerName: request.passengerName,
                originAddress: request.originAddress,
                distanceKm: String(request.distanceKm),
                fare: String(request.fare),
              },
            });
          }
        })
        .catch(() => {});
    },
    4000,
    isAvailable,
  );

  async function handleToggleAvailability() {
    const nextAvailable = !isAvailable;
    setIsTogglingAvailability(true);
    setAvailabilityError(null);
    try {
      const result = await updateAvailability(nextAvailable);
      setIsAvailable(result.available);
    } catch (error) {
      if (getApiStatusCode(error) === 403) {
        setAvailabilityError(
          'Tu cuenta todavía está en revisión. Te avisaremos cuando tus documentos sean aprobados.',
        );
      } else {
        setAvailabilityError('No se pudo actualizar tu disponibilidad. Intenta de nuevo.');
      }
    } finally {
      setIsTogglingAvailability(false);
    }
  }

  const firstName = profile?.name.split(' ')[0] ?? '';
  const mapCenter = location ?? DEFAULT_CENTER;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={[styles.avatar, { backgroundColor: colors.surfaceHighlight }]}>
          <Text style={[styles.avatarText, { color: colors.tint }]}>
            {profile?.name.charAt(0).toUpperCase() ?? '?'}
          </Text>
        </View>
        <View>
          <Text style={[styles.greetingLabel, { color: colors.textSecondary }]}>Hola,</Text>
          <Text style={styles.greetingName}>{firstName}</Text>
        </View>
      </View>

      <Pressable
        style={[
          styles.availabilityCard,
          { backgroundColor: isAvailable ? colors.success : colors.surfaceHighlight },
        ]}
        onPress={handleToggleAvailability}
        disabled={isTogglingAvailability}
      >
        <View style={[styles.availabilityCardContent, styles.transparentBackground]}>
          <Text style={[styles.availabilityTitle, { color: isAvailable ? '#fff' : colors.text }]}>
            {isAvailable ? 'Estás disponible' : 'No estás disponible'}
          </Text>
          <Text
            style={[
              styles.availabilitySubtitle,
              { color: isAvailable ? 'rgba(255,255,255,0.85)' : colors.textSecondary },
            ]}
          >
            {isAvailable ? 'Recibiendo solicitudes cercanas' : 'Actívate para recibir viajes'}
          </Text>
        </View>
      </Pressable>
      {availabilityError && (
        <Text style={[styles.errorText, { color: colors.textSecondary }]}>{availabilityError}</Text>
      )}

      <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>RESUMEN DE HOY</Text>
      <View style={styles.statsRow}>
        <View style={[styles.statTile, { backgroundColor: colors.surfaceHighlight }]}>
          <Text style={[styles.statValue, { color: colors.success }]}>
            {summary ? `L. ${summary.earningsToday.toFixed(0)}` : '...'}
          </Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Ganancias</Text>
        </View>
        <View style={[styles.statTile, { backgroundColor: colors.surfaceHighlight }]}>
          <Text style={styles.statValue}>{summary ? summary.tripsToday : '...'}</Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Viajes</Text>
        </View>
        <View style={[styles.statTile, { backgroundColor: colors.surfaceHighlight }]}>
          <Text style={styles.statValue}>{summary ? summary.averageRating.toFixed(1) : '...'}</Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Calificación</Text>
        </View>
      </View>

      <View style={styles.mapWrapper}>
        <TripMap
          style={styles.map}
          center={mapCenter}
          markers={location ? [{ position: location }] : []}
        />
        {isAvailable && (
          <View style={[styles.searchingBadge, { backgroundColor: colors.background }]}>
            <Text style={[styles.searchingBadgeText, { color: colors.success }]}>
              Buscando viajes cercanos
            </Text>
          </View>
        )}
      </View>

      <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>ÚLTIMOS VIAJES</Text>
      {recentTrips.length === 0 ? (
        <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
          Todavía no tienes viajes.
        </Text>
      ) : (
        recentTrips.map((trip) => {
          const badgeColors = TRIP_STATUS_BADGE_COLORS[trip.status];
          return (
            <View key={trip.id} style={[styles.tripRow, styles.transparentBackground]}>
              <Text style={styles.tripDestination} numberOfLines={1}>
                {trip.destinationAddress}
              </Text>
              <View style={[styles.badge, { backgroundColor: badgeColors.background }]}>
                <Text style={[styles.badgeText, { color: badgeColors.text }]}>
                  {TRIP_STATUS_LABELS[trip.status]}
                </Text>
              </View>
              <Text style={styles.tripFare}>L. {trip.fare.toFixed(0)}</Text>
            </View>
          );
        })
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 56,
    paddingHorizontal: 16,
    gap: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '700',
  },
  greetingLabel: {
    fontSize: 12,
  },
  greetingName: {
    fontSize: 16,
    fontWeight: '700',
  },
  availabilityCard: {
    borderRadius: 16,
    padding: 16,
  },
  availabilityCardContent: {
    gap: 2,
  },
  transparentBackground: {
    backgroundColor: 'transparent',
  },
  availabilityTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  availabilitySubtitle: {
    fontSize: 12,
  },
  errorText: {
    fontSize: 12,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    marginTop: 8,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  statTile: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 16,
    fontWeight: '700',
  },
  statLabel: {
    fontSize: 11,
    marginTop: 2,
  },
  mapWrapper: {
    height: 180,
    borderRadius: 16,
    overflow: 'hidden',
  },
  map: {
    flex: 1,
  },
  searchingBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  searchingBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  emptyText: {
    fontSize: 13,
  },
  tripRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 6,
  },
  tripDestination: {
    flex: 1,
    fontSize: 13,
  },
  badge: {
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  tripFare: {
    fontSize: 13,
    fontWeight: '700',
  },
});

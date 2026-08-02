import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as Location from 'expo-location';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Image, Pressable, StyleSheet } from 'react-native';
import type MapView from 'react-native-maps';

import { FullscreenMapViewer } from '@/components/FullscreenMapViewer';
import { NotificationBell } from '@/components/NotificationBell';
import { Text, View } from '@/components/Themed';
import { TripMap } from '@/components/TripMap';
import { Card } from '@/components/ui/Card';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { TRIP_STATUS_BADGE_COLORS, TRIP_STATUS_LABELS } from '@/constants/TripStatusLabels';
import { getApiStatusCode } from '@/lib/api/client';
import { getDriverSummary, updateAvailability, type DriverSummary } from '@/lib/api/drivers';
import { getPendingRequest } from '@/lib/api/drivers';
import { getTripHistory, type Trip } from '@/lib/api/trips';
import { sendDriverLocation } from '@/lib/api/tracking';
import { useCurrentLocation, type LatLng } from '@/lib/location/useCurrentLocation';
import { usePolling } from '@/lib/hooks/usePolling';
import { useOpenDrawer } from '@/lib/navigation/useOpenDrawer';

const RECENT_TRIPS_LIMIT = 5;
const DEFAULT_CENTER = { lat: 15.5, lng: -88.03 };
const LOCATE_ZOOM_DELTA = 0.005;

const CARD_SHADOW = {
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 1 },
  shadowOpacity: 0.06,
  shadowRadius: 4,
  elevation: 1,
};

export default function DriverHomeScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];
  const openDrawer = useOpenDrawer();
  const fallbackLocation = useCurrentLocation();
  const [manualLocation, setManualLocation] = useState<LatLng | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [isMapExpanded, setIsMapExpanded] = useState(false);
  const location = manualLocation ?? fallbackLocation.location;
  const mapRef = useRef<MapView>(null);

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

  async function handleLocateMe() {
    setIsLocating(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;
      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      const next = { lat: position.coords.latitude, lng: position.coords.longitude };
      setManualLocation(next);
      mapRef.current?.animateToRegion(
        {
          latitude: next.lat,
          longitude: next.lng,
          latitudeDelta: LOCATE_ZOOM_DELTA,
          longitudeDelta: LOCATE_ZOOM_DELTA,
        },
        500,
      );
    } catch {
    } finally {
      setIsLocating(false);
    }
  }

  const mapCenter = location ?? DEFAULT_CENTER;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable
          style={[styles.menuButton, { backgroundColor: colors.surfaceHighlight }]}
          onPress={openDrawer}
          hitSlop={6}
        >
          <Ionicons name="menu" size={20} color={colors.text} />
        </Pressable>

        <View style={styles.brandMark}>
          <Image source={require('@/assets/logo/logo_without_text.png')} style={styles.brandLogo} />
          <Text style={[styles.brandText, { color: colors.tint }]}>CatrachoGo</Text>
        </View>

        <NotificationBell />
      </View>

      <Pressable
        style={[
          styles.availabilityCard,
          CARD_SHADOW,
          { backgroundColor: isAvailable ? colors.success : colors.surfaceHighlight },
        ]}
        onPress={handleToggleAvailability}
        disabled={isTogglingAvailability}
      >
        <View
          style={[
            styles.availabilityIconCircle,
            styles.transparentBackground,
            { backgroundColor: isAvailable ? 'rgba(255,255,255,0.22)' : colors.background },
          ]}
        >
          <Ionicons
            name={isAvailable ? 'flash' : 'flash-outline'}
            size={20}
            color={isAvailable ? '#fff' : colors.tint}
          />
        </View>
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
        <View style={[styles.noticeRow, styles.transparentBackground]}>
          <Ionicons name="alert-circle-outline" size={13} color={colors.textSecondary} />
          <Text style={[styles.errorText, { color: colors.textSecondary }]}>
            {availabilityError}
          </Text>
        </View>
      )}

      <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>RESUMEN DE HOY</Text>
      <View style={styles.statsRow}>
        <Card style={styles.statTile}>
          <Ionicons name="cash-outline" size={18} color={colors.success} />
          <Text style={[styles.statValue, { color: colors.success }]}>
            {summary ? `L. ${summary.earningsToday.toFixed(0)}` : '...'}
          </Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Ganancias</Text>
        </Card>
        <Card style={styles.statTile}>
          <Ionicons name="car-outline" size={18} color={colors.tint} />
          <Text style={styles.statValue}>{summary ? summary.tripsToday : '...'}</Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Viajes</Text>
        </Card>
        <Card style={styles.statTile}>
          <Ionicons name="star" size={18} color={colors.tint} />
          <Text style={styles.statValue}>{summary ? summary.averageRating.toFixed(1) : '...'}</Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Calificación</Text>
        </Card>
      </View>

      <View style={[styles.mapShadowWrapper, CARD_SHADOW]}>
        <View style={styles.mapWrapper}>
          <TripMap
            ref={mapRef}
            style={styles.map}
            center={mapCenter}
            markers={location ? [{ position: location }] : []}
          />
          {isAvailable && (
            <View style={[styles.searchingBadge, { backgroundColor: colors.background }]}>
              <Ionicons name="search" size={12} color={colors.success} />
              <Text style={[styles.searchingBadgeText, { color: colors.success }]}>
                Buscando viajes cercanos
              </Text>
            </View>
          )}
          <Pressable
            style={[styles.expandButton, { backgroundColor: colors.background }]}
            onPress={() => setIsMapExpanded(true)}
          >
            <Ionicons name="expand" size={16} color={colors.tint} />
          </Pressable>
          <Pressable
            style={[styles.locateButton, { backgroundColor: colors.background }]}
            onPress={handleLocateMe}
            disabled={isLocating}
          >
            {isLocating ? (
              <ActivityIndicator size="small" color={colors.tint} />
            ) : (
              <Ionicons name="locate" size={18} color={colors.tint} />
            )}
          </Pressable>
        </View>
      </View>

      <FullscreenMapViewer
        visible={isMapExpanded}
        onDismiss={() => setIsMapExpanded(false)}
        center={mapCenter}
        markers={location ? [{ position: location }] : []}
      />

      <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>ÚLTIMOS VIAJES</Text>
      {recentTrips.length === 0 ? (
        <View style={[styles.emptyRow, styles.transparentBackground]}>
          <Ionicons name="car-outline" size={18} color={colors.textSecondary} />
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            Todavía no tienes viajes.
          </Text>
        </View>
      ) : (
        recentTrips.map((trip) => {
          const badgeColors = TRIP_STATUS_BADGE_COLORS[trip.status];
          return (
            <Card key={trip.id} style={styles.tripRow}>
              <Ionicons name="location-outline" size={16} color={colors.textSecondary} />
              <Text style={styles.tripDestination} numberOfLines={1}>
                {trip.destinationAddress}
              </Text>
              <View style={[styles.badge, { backgroundColor: badgeColors.background }]}>
                <Text style={[styles.badgeText, { color: badgeColors.text }]}>
                  {TRIP_STATUS_LABELS[trip.status]}
                </Text>
              </View>
              <Text style={styles.tripFare}>L. {trip.fare.toFixed(0)}</Text>
            </Card>
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
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 8,
  },
  menuButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandMark: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'transparent',
  },
  brandLogo: {
    width: 26,
    height: 26,
  },
  brandText: {
    fontSize: 16,
    fontWeight: '700',
  },
  availabilityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 16,
    padding: 16,
  },
  availabilityIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  availabilityCardContent: {
    flex: 1,
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
  noticeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
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
    alignItems: 'center',
    gap: 4,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '700',
  },
  statLabel: {
    fontSize: 11,
    marginTop: 2,
  },
  mapShadowWrapper: {
    borderRadius: 16,
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  searchingBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  locateButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  expandButton: {
    position: 'absolute',
    top: 10,
    right: 52,
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  emptyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 4,
  },
  emptyText: {
    fontSize: 13,
  },
  tripRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
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

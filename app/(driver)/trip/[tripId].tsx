import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Linking, Pressable, StyleSheet } from 'react-native';

import { ReportNoShowModal } from '@/components/ReportNoShowModal';
import { Text, View } from '@/components/Themed';
import { TripMap, type TripMapMarker } from '@/components/TripMap';
import { Button } from '@/components/ui/Button';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { NO_SHOW_GRACE_PERIOD_MS } from '@/constants/NoShowGracePeriod';
import { getApiErrorMessage } from '@/lib/api/errors';
import {
  completeTrip,
  getTripDetail,
  markDriverArrived,
  reportNoShow,
  startTrip,
  type TripDetail,
  type TripStatus,
} from '@/lib/api/trips';
import { sendDriverLocation } from '@/lib/api/tracking';
import { getDirectionsRoute, type LatLng } from '@/lib/directions/client';
import { ARRIVAL_RADIUS_METERS, distanceMeters } from '@/lib/geo/distance';
import { usePolling } from '@/lib/hooks/usePolling';

const DEFAULT_CENTER = { lat: 15.5, lng: -88.03 };

const STATUS_BANNER: Record<TripStatus, string> = {
  pending: 'Cargando...',
  accepted: 'En camino a recoger al pasajero',
  in_progress: 'Viaje en curso',
  completed: 'Viaje completado',
  cancelled: 'Viaje cancelado',
};

const STATUS_ICON: Record<TripStatus, keyof typeof Ionicons.glyphMap> = {
  pending: 'hourglass-outline',
  accepted: 'navigate',
  in_progress: 'car',
  completed: 'checkmark-circle',
  cancelled: 'close-circle',
};

const SHEET_SHADOW = {
  shadowColor: '#000',
  shadowOffset: { width: 0, height: -2 },
  shadowOpacity: 0.1,
  shadowRadius: 8,
  elevation: 8,
};

export default function DriverTripScreen() {
  const { tripId, passengerName: passengerNameParam } = useLocalSearchParams<{
    tripId: string;
    passengerName?: string;
  }>();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];

  const [trip, setTrip] = useState<TripDetail | null>(null);
  const [driverPosition, setDriverPosition] = useState<LatLng | null>(null);
  const [routePath, setRoutePath] = useState<LatLng[]>([]);
  const [routeDurationText, setRouteDurationText] = useState<string | null>(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [showNoShowModal, setShowNoShowModal] = useState(false);
  const [isReportingNoShow, setIsReportingNoShow] = useState(false);
  const [nowTick, setNowTick] = useState(() => Date.now());

  usePolling(
    () => {
      if (!tripId) return;
      getTripDetail(tripId)
        .then(setTrip)
        .catch(() => {});
    },
    4000,
    Boolean(tripId),
  );

  const isPickupPhase = trip?.status === 'accepted';
  const isTripPhase = trip?.status === 'in_progress';
  const isOnTrip = isPickupPhase || isTripPhase;

  usePolling(
    () => {
      if (!tripId) return;
      Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced })
        .then((position) => {
          const coords = { lat: position.coords.latitude, lng: position.coords.longitude };
          setDriverPosition(coords);
          sendDriverLocation(coords.lat, coords.lng, tripId).catch(() => {});
        })
        .catch(() => {});
    },
    5000,
    Boolean(tripId) && isOnTrip,
  );

  useEffect(() => {
    if (trip?.status === 'cancelled') {
      router.replace('/(driver)/(tabs)');
    } else if (trip?.status === 'completed') {
      router.replace('/(driver)/(tabs)');
    }
  }, [trip?.status]);

  useEffect(() => {
    if (trip?.status !== 'accepted' || !trip.arrivedAt) return;
    const id = setInterval(() => setNowTick(Date.now()), 1000);
    return () => clearInterval(id);
  }, [trip?.status, trip?.arrivedAt]);

  const routeTarget: LatLng | null = trip
    ? isPickupPhase
      ? { lat: trip.originLat, lng: trip.originLng }
      : { lat: trip.destinationLat, lng: trip.destinationLng }
    : null;

  useEffect(() => {
    if (!isOnTrip || !driverPosition || !routeTarget) {
      setRoutePath([]);
      setRouteDurationText(null);
      return;
    }
    let cancelled = false;
    getDirectionsRoute(driverPosition, routeTarget)
      .then((route) => {
        if (cancelled) return;
        setRoutePath(route?.path ?? []);
        setRouteDurationText(route?.durationText ?? null);
      })
      .catch(() => {
        if (!cancelled) {
          setRoutePath([]);
          setRouteDurationText(null);
        }
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOnTrip, driverPosition?.lat, driverPosition?.lng, routeTarget?.lat, routeTarget?.lng]);

  const distanceToTarget =
    driverPosition && routeTarget ? distanceMeters(driverPosition, routeTarget) : null;
  const isNearTarget = distanceToTarget !== null && distanceToTarget <= ARRIVAL_RADIUS_METERS;

  if (!tripId) return null;

  async function handleMarkArrived() {
    if (!isNearTarget) {
      setActionError('Debes estar cerca del punto de recogida para marcar tu llegada.');
      return;
    }
    setIsUpdatingStatus(true);
    setActionError(null);
    try {
      const updated = await markDriverArrived(tripId);
      setTrip((current) => (current ? { ...current, arrivedAt: updated.arrivedAt } : current));
    } catch (error) {
      setActionError(getApiErrorMessage(error));
    } finally {
      setIsUpdatingStatus(false);
    }
  }

  async function handleStart() {
    if (!isNearTarget) {
      setActionError('Debes estar cerca del punto de recogida para iniciar el viaje.');
      return;
    }
    setIsUpdatingStatus(true);
    setActionError(null);
    try {
      const updated = await startTrip(tripId);
      setTrip((current) => (current ? { ...current, status: updated.status } : current));
    } catch (error) {
      setActionError(getApiErrorMessage(error));
    } finally {
      setIsUpdatingStatus(false);
    }
  }

  async function handleComplete() {
    if (!isNearTarget) {
      setActionError('Debes estar cerca del destino para completar el viaje.');
      return;
    }
    setIsUpdatingStatus(true);
    setActionError(null);
    try {
      await completeTrip(tripId);
      router.replace('/(driver)/(tabs)');
    } catch (error) {
      setActionError(getApiErrorMessage(error));
      setIsUpdatingStatus(false);
    }
  }

  async function handleReportNoShow() {
    setIsReportingNoShow(true);
    try {
      await reportNoShow(tripId);
      router.replace('/(driver)/(tabs)');
    } catch (error) {
      setActionError(getApiErrorMessage(error));
      setIsReportingNoShow(false);
      setShowNoShowModal(false);
    }
  }

  function handleCall() {
    if (trip?.passengerPhone) {
      Linking.openURL(`tel:${trip.passengerPhone}`);
    }
  }

  const bannerText = trip ? STATUS_BANNER[trip.status] : 'Cargando...';
  const canCall = Boolean(trip?.passengerPhone);
  const passengerName = passengerNameParam ?? trip?.passenger?.name;

  const arrivedAtMs = trip?.arrivedAt ? new Date(trip.arrivedAt).getTime() : null;
  const isWaitingForPassenger = trip?.status === 'accepted' && arrivedAtMs !== null;
  const elapsedSinceArrivalMs = arrivedAtMs !== null ? nowTick - arrivedAtMs : 0;
  const canReportNoShow = isWaitingForPassenger && elapsedSinceArrivalMs >= NO_SHOW_GRACE_PERIOD_MS;
  const remainingMs = Math.max(0, NO_SHOW_GRACE_PERIOD_MS - elapsedSinceArrivalMs);
  const remainingLabel = `${Math.floor(remainingMs / 60000)}:${String(
    Math.floor((remainingMs % 60000) / 1000),
  ).padStart(2, '0')}`;

  const mapCenter = driverPosition ?? routeTarget ?? DEFAULT_CENTER;
  const markers: TripMapMarker[] = [];
  if (driverPosition) markers.push({ position: driverPosition, color: colors.tint });
  if (routeTarget) markers.push({ position: routeTarget });

  return (
    <View style={styles.container}>
      <TripMap
        style={StyleSheet.absoluteFill}
        center={mapCenter}
        markers={markers}
        routePath={routePath}
        routeColor={colors.tint}
      />

      <View style={[styles.banner, { backgroundColor: colors.success }]}>
        <View style={[styles.bannerRow, styles.transparentBackground]}>
          <Ionicons
            name={trip ? STATUS_ICON[trip.status] : 'hourglass-outline'}
            size={16}
            color="#fff"
          />
          <Text style={styles.bannerText}>
            {bannerText}
            {routeDurationText && isOnTrip ? ` · ${routeDurationText}` : ''}
          </Text>
        </View>
      </View>

      <View style={[styles.sheet, { backgroundColor: colors.background }, SHEET_SHADOW]}>
        {(isPickupPhase || isTripPhase) && (
          <View style={styles.passengerRow}>
            <View style={[styles.avatar, { backgroundColor: colors.surfaceHighlight }]}>
              <Text style={[styles.avatarText, { color: colors.tint }]}>
                {passengerName?.charAt(0).toUpperCase() ?? '?'}
              </Text>
            </View>
            <View>
              <Text style={[styles.passengerLabel, { color: colors.textSecondary }]}>Pasajero</Text>
              <Text style={styles.passengerName}>{passengerName ?? 'Pasajero'}</Text>
            </View>
          </View>
        )}

        <View style={[styles.labelRow, styles.transparentBackground]}>
          <Ionicons
            name={trip?.status === 'in_progress' ? 'flag-outline' : 'navigate-outline'}
            size={12}
            color={colors.textSecondary}
          />
          <Text style={[styles.label, { color: colors.textSecondary }]}>
            {trip?.status === 'in_progress' ? 'DESTINO' : 'ORIGEN'}
          </Text>
        </View>
        <Text style={styles.addressText}>
          {trip?.status === 'in_progress'
            ? (trip?.destinationAddress ?? '—')
            : (trip?.originAddress ?? '—')}
        </Text>

        <View style={styles.fareRow}>
          <View style={[styles.labelRow, styles.transparentBackground]}>
            <Ionicons name="cash-outline" size={12} color={colors.textSecondary} />
            <Text style={[styles.fareLabel, { color: colors.textSecondary }]}>TARIFA</Text>
          </View>
          <Text style={styles.fareValue}>
            {trip ? `L. ${trip.fare.toFixed(2)} · ${trip.distanceKm.toFixed(1)} km` : '—'}
          </Text>
        </View>

        {actionError && (
          <View style={[styles.noticeRow, styles.transparentBackground]}>
            <Ionicons name="alert-circle" size={14} color="#C0392B" />
            <Text style={[styles.errorText, { color: '#C0392B' }]}>{actionError}</Text>
          </View>
        )}

        <View style={styles.actionsRow}>
          <Button
            variant="secondary"
            onPress={handleCall}
            disabled={!canCall}
            style={styles.actionButton}
          >
            <View style={[styles.buttonContent, styles.transparentBackground]}>
              <Ionicons name="call-outline" size={16} color={colors.text} />
              <Text style={{ color: colors.text, fontWeight: '600' }}>Llamar</Text>
            </View>
          </Button>

          {trip?.status === 'accepted' && !trip.arrivedAt && (
            <Button
              onPress={handleMarkArrived}
              disabled={isUpdatingStatus || !isNearTarget}
              style={styles.actionButton}
            >
              <View style={[styles.buttonContent, styles.transparentBackground]}>
                <Ionicons name="location-outline" size={16} color="#fff" />
                <Text style={styles.primaryButtonText}>Llegué</Text>
              </View>
            </Button>
          )}

          {trip?.status === 'accepted' && trip.arrivedAt && (
            <Button onPress={handleStart} disabled={isUpdatingStatus} style={styles.actionButton}>
              <View style={[styles.buttonContent, styles.transparentBackground]}>
                <Ionicons name="play-outline" size={16} color="#fff" />
                <Text style={styles.primaryButtonText}>Iniciar viaje</Text>
              </View>
            </Button>
          )}

          {trip?.status === 'in_progress' && (
            <Button
              onPress={handleComplete}
              disabled={isUpdatingStatus || !isNearTarget}
              style={[styles.actionButton, { backgroundColor: colors.success }]}
            >
              <View style={[styles.buttonContent, styles.transparentBackground]}>
                <Ionicons name="checkmark-done-outline" size={16} color="#fff" />
                <Text style={styles.primaryButtonText}>Completar viaje</Text>
              </View>
            </Button>
          )}
        </View>

        {isPickupPhase && !trip?.arrivedAt && !isNearTarget && (
          <View style={[styles.hintRow, styles.transparentBackground]}>
            <Ionicons name="information-circle-outline" size={13} color={colors.textSecondary} />
            <Text style={[styles.hintText, { color: colors.textSecondary }]}>
              Acércate al punto de recogida para poder marcar tu llegada.
            </Text>
          </View>
        )}

        {isTripPhase && !isNearTarget && (
          <View style={[styles.hintRow, styles.transparentBackground]}>
            <Ionicons name="information-circle-outline" size={13} color={colors.textSecondary} />
            <Text style={[styles.hintText, { color: colors.textSecondary }]}>
              Acércate al destino para poder completar el viaje.
            </Text>
          </View>
        )}

        {isWaitingForPassenger &&
          (!canReportNoShow ? (
            <View style={[styles.hintRow, styles.transparentBackground]}>
              <Ionicons name="time-outline" size={13} color={colors.textSecondary} />
              <Text style={[styles.hintText, { color: colors.textSecondary }]}>
                Esperando al pasajero... podrás reportar que no llegó en {remainingLabel}.
              </Text>
            </View>
          ) : (
            <Pressable
              style={[styles.hintRow, styles.transparentBackground]}
              onPress={() => setShowNoShowModal(true)}
              disabled={isReportingNoShow}
            >
              <Ionicons name="alert-outline" size={13} color="#DC2626" />
              <Text style={styles.noShowText}>El pasajero no llegó</Text>
            </Pressable>
          ))}
      </View>

      <ReportNoShowModal
        visible={showNoShowModal}
        isSubmitting={isReportingNoShow}
        onConfirm={handleReportNoShow}
        onDismiss={() => setShowNoShowModal(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  banner: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingTop: 56,
    paddingBottom: 12,
    alignItems: 'center',
  },
  bannerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  bannerText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 32,
  },
  passengerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 14,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 15,
    fontWeight: '700',
  },
  passengerLabel: {
    fontSize: 11,
  },
  passengerName: {
    fontSize: 14,
    fontWeight: '700',
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  transparentBackground: {
    backgroundColor: 'transparent',
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
  },
  addressText: {
    fontSize: 14,
    marginTop: 2,
    marginBottom: 12,
  },
  fareRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  fareLabel: {
    fontSize: 11,
    fontWeight: '700',
  },
  fareValue: {
    fontSize: 14,
    fontWeight: '700',
  },
  noticeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 12,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  primaryButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  hintRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    marginTop: 10,
  },
  hintText: {
    fontSize: 12,
    textAlign: 'center',
  },
  noShowText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#DC2626',
  },
});

import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Linking, Pressable, StyleSheet } from 'react-native';

import { CancelTripModal } from '@/components/CancelTripModal';
import { EndTripEarlyModal } from '@/components/EndTripEarlyModal';
import { RatingModal } from '@/components/RatingModal';
import { ReportIncidentModal } from '@/components/ReportIncidentModal';
import { Text, View } from '@/components/Themed';
import { TripMap, type TripMapMarker } from '@/components/TripMap';
import { Button } from '@/components/ui/Button';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { getDriverPublicProfile } from '@/lib/api/drivers';
import { getApiErrorMessage } from '@/lib/api/errors';
import { createIncidentReport, type IncidentReportCategory } from '@/lib/api/incidentReports';
import {
  cancelTrip,
  endTripEarly,
  getDriverLocation,
  getTripDetail,
  type CancellationReason,
  type TripDetail,
  type TripDriverInfo,
  type TripStatus,
} from '@/lib/api/trips';
import { getDirectionsRoute, type LatLng } from '@/lib/directions/client';
import { usePolling } from '@/lib/hooks/usePolling';

const DEFAULT_CENTER = { lat: 15.5, lng: -88.03 };

const STATUS_BANNER: Record<TripStatus, string> = {
  pending: 'Buscando un conductor cercano...',
  accepted: 'Conductor en camino',
  in_progress: 'Viaje en curso',
  completed: 'Viaje completado',
  cancelled: 'Viaje cancelado',
};

export default function TripInProgressScreen() {
  const { tripId, destinationAddress: destinationAddressParam } = useLocalSearchParams<{
    tripId: string;
    destinationAddress?: string;
  }>();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];

  const [trip, setTrip] = useState<TripDetail | null>(null);
  const [driver, setDriver] = useState<TripDriverInfo | null>(null);
  const [driverPosition, setDriverPosition] = useState<LatLng | null>(null);
  const [routePath, setRoutePath] = useState<LatLng[]>([]);
  const [routeDurationText, setRouteDurationText] = useState<string | null>(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [showEndEarlyModal, setShowEndEarlyModal] = useState(false);
  const [isEndingEarly, setIsEndingEarly] = useState(false);
  const [ratingDismissed, setRatingDismissed] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [showReportModal, setShowReportModal] = useState(false);
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);
  const [reportError, setReportError] = useState<string | null>(null);
  const [reportSent, setReportSent] = useState(false);
  const fetchedDriverIdRef = useRef<string | null>(null);

  usePolling(
    () => {
      if (!tripId) return;
      getTripDetail(tripId)
        .then((data) => {
          setTrip(data);
          if (data.driver) {
            setDriver(data.driver);
          } else if (data.driverId && fetchedDriverIdRef.current !== data.driverId) {
            fetchedDriverIdRef.current = data.driverId;
            getDriverPublicProfile(data.driverId)
              .then(setDriver)
              .catch(() => {});
          }
        })
        .catch(() => {});
    },
    4000,
    Boolean(tripId),
  );

  const isTrackable = trip?.status === 'accepted' || trip?.status === 'in_progress';
  usePolling(
    () => {
      if (!tripId) return;
      getDriverLocation(tripId)
        .then((location) => {
          if (location) setDriverPosition({ lat: location.lat, lng: location.lng });
        })
        .catch(() => {});
    },
    4000,
    Boolean(tripId) && isTrackable,
  );

  const isHeadingToPickup = trip?.status === 'accepted';
  const routeTarget: LatLng | null = trip
    ? isHeadingToPickup
      ? { lat: trip.originLat, lng: trip.originLng }
      : { lat: trip.destinationLat, lng: trip.destinationLng }
    : null;

  useEffect(() => {
    if (!isTrackable || !driverPosition || !routeTarget) {
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
  }, [isTrackable, driverPosition?.lat, driverPosition?.lng, routeTarget?.lat, routeTarget?.lng]);

  async function handleCancel(reason: CancellationReason) {
    if (!tripId) return;
    setIsCancelling(true);
    try {
      await cancelTrip(tripId, reason);
      router.replace('/(passenger)/(tabs)');
    } catch (error) {
      setActionError(getApiErrorMessage(error));
    } finally {
      setIsCancelling(false);
      setShowCancelModal(false);
    }
  }

  async function handleEndTripEarly() {
    if (!tripId) return;
    setIsEndingEarly(true);
    try {
      await endTripEarly(tripId);
      router.replace('/(passenger)/(tabs)');
    } catch (error) {
      setActionError(getApiErrorMessage(error));
    } finally {
      setIsEndingEarly(false);
      setShowEndEarlyModal(false);
    }
  }

  function handleCall() {
    if (trip?.driverPhone) {
      Linking.openURL(`tel:${trip.driverPhone}`);
    }
  }

  async function handleSubmitReport(payload: {
    category: IncidentReportCategory;
    description: string;
  }) {
    if (!tripId) return;
    setReportError(null);
    setIsSubmittingReport(true);
    try {
      await createIncidentReport({ tripId, ...payload });
      setShowReportModal(false);
      setReportSent(true);
    } catch (error) {
      setReportError(getApiErrorMessage(error));
    } finally {
      setIsSubmittingReport(false);
    }
  }

  if (!tripId) return null;

  const bannerText = trip
    ? trip.status === 'accepted' && trip.arrivedAt
      ? 'Tu conductor ha llegado'
      : STATUS_BANNER[trip.status]
    : 'Cargando...';
  const canCall = Boolean(trip?.driverPhone);
  const canCancel = trip?.status === 'pending' || trip?.status === 'accepted';
  const isTerminal = trip?.status === 'completed' || trip?.status === 'cancelled';
  const destinationAddress = trip?.destinationAddress ?? destinationAddressParam ?? '';
  const shouldShowRating =
    !ratingDismissed &&
    trip?.status === 'completed' &&
    Boolean(driver?.userId) &&
    trip?.ratedByMe === false;

  const mapCenter =
    driverPosition ?? (trip ? { lat: trip.originLat, lng: trip.originLng } : DEFAULT_CENTER);
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

      <View
        style={[
          styles.banner,
          { backgroundColor: trip?.status === 'cancelled' ? '#6B6560' : colors.success },
        ]}
      >
        <Text style={styles.bannerText}>
          {bannerText}
          {routeDurationText && isTrackable ? ` · llega en ${routeDurationText}` : ''}
        </Text>
      </View>

      <View style={[styles.sheet, { backgroundColor: colors.background }]}>
        {!isTerminal && (
          <>
            <View style={styles.driverRow}>
              <View style={[styles.avatar, { backgroundColor: colors.surfaceHighlight }]}>
                <Text style={styles.avatarText}>
                  {driver ? driver.name.charAt(0).toUpperCase() : '?'}
                </Text>
              </View>
              <View style={styles.driverInfo}>
                <Text style={styles.driverName}>{driver?.name ?? 'Esperando conductor'}</Text>
                {driver?.vehicle && (
                  <Text style={[styles.vehicleText, { color: colors.textSecondary }]}>
                    {driver.vehicle.brand} {driver.vehicle.model} · {driver.vehicle.plate}
                  </Text>
                )}
              </View>
              {driver && (
                <Text style={[styles.rating, { color: colors.textSecondary }]}>
                  ★ {driver.averageRating.toFixed(1)}
                </Text>
              )}
            </View>

            <Text style={[styles.label, { color: colors.textSecondary }]}>DESTINO</Text>
            <Text style={styles.destinationText}>{destinationAddress || '—'}</Text>

            {actionError && (
              <Text style={[styles.errorText, { color: colors.textSecondary }]}>{actionError}</Text>
            )}

            <View style={styles.actionsRow}>
              {trip?.status === 'in_progress' ? (
                <Button
                  title="Finalizar viaje"
                  variant="secondary"
                  onPress={() => setShowEndEarlyModal(true)}
                  style={styles.actionButton}
                />
              ) : (
                <Button
                  title="Cancelar"
                  variant="secondary"
                  onPress={() => setShowCancelModal(true)}
                  disabled={!canCancel}
                  style={styles.actionButton}
                />
              )}
              <Pressable
                style={[
                  styles.actionButton,
                  { backgroundColor: canCall ? colors.tint : colors.textSecondary },
                ]}
                onPress={handleCall}
                disabled={!canCall}
              >
                <Text style={styles.callButtonText}>Llamar</Text>
              </Pressable>
            </View>
          </>
        )}

        {isTerminal && (
          <>
            <Text style={styles.title}>{bannerText}</Text>
            <Button
              title="Volver a inicio"
              onPress={() => router.replace('/(passenger)/(tabs)')}
              style={[styles.actionButton, styles.backToHomeButton]}
            />
          </>
        )}

        {driver &&
          (reportSent ? (
            <Text style={[styles.reportSentText, { color: colors.textSecondary }]}>
              Reporte enviado. Administración lo revisará.
            </Text>
          ) : (
            <Pressable style={styles.reportButton} onPress={() => setShowReportModal(true)}>
              <Text style={[styles.reportButtonText, { color: colors.textSecondary }]}>
                Reportar un problema
              </Text>
            </Pressable>
          ))}
      </View>

      <CancelTripModal
        visible={showCancelModal}
        isSubmitting={isCancelling}
        chargesFee={trip?.status === 'accepted'}
        onConfirm={handleCancel}
        onDismiss={() => setShowCancelModal(false)}
      />

      <EndTripEarlyModal
        visible={showEndEarlyModal}
        isSubmitting={isEndingEarly}
        onConfirm={handleEndTripEarly}
        onDismiss={() => setShowEndEarlyModal(false)}
      />

      <ReportIncidentModal
        visible={showReportModal}
        isSubmitting={isSubmittingReport}
        error={reportError}
        onSubmit={handleSubmitReport}
        onDismiss={() => {
          setReportError(null);
          setShowReportModal(false);
        }}
      />

      {shouldShowRating && driver?.userId && (
        <RatingModal
          visible
          tripId={tripId}
          ratedId={driver.userId}
          ratedName={driver.name}
          onDone={() => {
            setRatingDismissed(true);
            router.replace('/(passenger)/(tabs)/activity');
          }}
        />
      )}
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
  driverRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '700',
  },
  driverInfo: {
    flex: 1,
  },
  driverName: {
    fontSize: 15,
    fontWeight: '700',
  },
  vehicleText: {
    fontSize: 12,
    marginTop: 2,
  },
  rating: {
    fontSize: 13,
    fontWeight: '600',
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
  },
  destinationText: {
    fontSize: 14,
    marginTop: 4,
    marginBottom: 16,
  },
  errorText: {
    fontSize: 12,
    marginBottom: 12,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backToHomeButton: {
    marginTop: 16,
  },
  callButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
  },
  reportButton: {
    marginTop: 12,
    alignItems: 'center',
    paddingVertical: 6,
  },
  reportButtonText: {
    fontSize: 12,
    fontWeight: '600',
  },
  reportSentText: {
    marginTop: 12,
    fontSize: 12,
    textAlign: 'center',
  },
});

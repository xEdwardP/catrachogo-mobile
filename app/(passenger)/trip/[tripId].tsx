import { Ionicons } from '@expo/vector-icons';
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

const STATUS_ICON: Record<TripStatus, keyof typeof Ionicons.glyphMap> = {
  pending: 'hourglass-outline',
  accepted: 'car',
  in_progress: 'navigate',
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

  async function handleCancel(reason: CancellationReason | undefined) {
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

  const hasArrived = trip?.status === 'accepted' && Boolean(trip.arrivedAt);
  const bannerText = trip
    ? hasArrived
      ? 'Tu conductor ha llegado'
      : STATUS_BANNER[trip.status]
    : 'Cargando...';
  const bannerIcon: keyof typeof Ionicons.glyphMap = trip
    ? hasArrived
      ? 'location'
      : STATUS_ICON[trip.status]
    : 'hourglass-outline';
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
        <View style={[styles.bannerRow, styles.transparentBackground]}>
          <Ionicons name={bannerIcon} size={16} color="#fff" />
          <Text style={styles.bannerText}>
            {bannerText}
            {routeDurationText && isTrackable ? ` · llega en ${routeDurationText}` : ''}
          </Text>
        </View>
      </View>

      <View style={[styles.sheet, { backgroundColor: colors.background }, SHEET_SHADOW]}>
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
                <View style={[styles.ratingRow, styles.transparentBackground]}>
                  <Ionicons name="star" size={13} color={colors.textSecondary} />
                  <Text style={[styles.rating, { color: colors.textSecondary }]}>
                    {driver.averageRating.toFixed(1)}
                  </Text>
                </View>
              )}
            </View>

            <View style={[styles.labelRow, styles.transparentBackground]}>
              <Ionicons name="flag-outline" size={12} color={colors.textSecondary} />
              <Text style={[styles.label, { color: colors.textSecondary }]}>DESTINO</Text>
            </View>
            <Text style={styles.destinationText}>{destinationAddress || '—'}</Text>

            {actionError && (
              <View style={[styles.noticeRow, styles.transparentBackground]}>
                <Ionicons name="alert-circle" size={14} color="#C0392B" />
                <Text style={[styles.errorText, { color: '#C0392B' }]}>{actionError}</Text>
              </View>
            )}

            <View style={styles.actionsRow}>
              {trip?.status === 'in_progress' ? (
                <Button
                  variant="secondary"
                  onPress={() => setShowEndEarlyModal(true)}
                  style={styles.actionButton}
                >
                  <View style={[styles.buttonContent, styles.transparentBackground]}>
                    <Ionicons name="flag-outline" size={16} color={colors.text} />
                    <Text style={{ color: colors.text, fontWeight: '600' }}>Finalizar viaje</Text>
                  </View>
                </Button>
              ) : (
                <Button
                  variant="secondary"
                  onPress={() => setShowCancelModal(true)}
                  disabled={!canCancel}
                  style={styles.actionButton}
                >
                  <View style={[styles.buttonContent, styles.transparentBackground]}>
                    <Ionicons name="close-circle-outline" size={16} color={colors.text} />
                    <Text style={{ color: colors.text, fontWeight: '600' }}>Cancelar</Text>
                  </View>
                </Button>
              )}
              <Pressable
                style={[
                  styles.actionButton,
                  styles.callButton,
                  { backgroundColor: canCall ? colors.tint : colors.textSecondary },
                ]}
                onPress={handleCall}
                disabled={!canCall}
              >
                <Ionicons name="call" size={16} color="#fff" />
                <Text style={styles.callButtonText}>Llamar</Text>
              </Pressable>
            </View>
          </>
        )}

        {isTerminal && (
          <>
            <View style={[styles.terminalIconCircle, { backgroundColor: colors.surfaceHighlight }]}>
              <Ionicons
                name={bannerIcon}
                size={26}
                color={trip?.status === 'cancelled' ? colors.textSecondary : colors.success}
              />
            </View>
            <Text style={styles.title}>{bannerText}</Text>
            <Button
              onPress={() => router.replace('/(passenger)/(tabs)')}
              style={[styles.actionButton, styles.backToHomeButton]}
            >
              <View style={[styles.buttonContent, styles.transparentBackground]}>
                <Ionicons name="home-outline" size={17} color="#fff" />
                <Text style={styles.primaryButtonText}>Volver a inicio</Text>
              </View>
            </Button>
          </>
        )}

        {driver &&
          (reportSent ? (
            <View style={[styles.noticeRow, styles.reportSentRow, styles.transparentBackground]}>
              <Ionicons name="checkmark-circle" size={14} color={colors.success} />
              <Text style={[styles.reportSentText, { color: colors.textSecondary }]}>
                Reporte enviado. Administración lo revisará.
              </Text>
            </View>
          ) : (
            <Pressable style={styles.reportButton} onPress={() => setShowReportModal(true)}>
              <Ionicons name="alert-circle-outline" size={13} color={colors.textSecondary} />
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
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  transparentBackground: {
    backgroundColor: 'transparent',
  },
  rating: {
    fontSize: 13,
    fontWeight: '600',
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
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
  noticeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
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
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  backToHomeButton: {
    marginTop: 16,
  },
  callButton: {
    flexDirection: 'row',
    gap: 6,
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
  terminalIconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: 12,
  },
  primaryButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  reportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    marginTop: 12,
    paddingVertical: 6,
  },
  reportButtonText: {
    fontSize: 12,
    fontWeight: '600',
  },
  reportSentRow: {
    justifyContent: 'center',
    marginTop: 12,
    marginBottom: 0,
  },
  reportSentText: {
    fontSize: 12,
  },
});

import { Ionicons } from '@expo/vector-icons';
import BottomSheet, { BottomSheetView } from '@gorhom/bottom-sheet';
import { router, useLocalSearchParams } from 'expo-router';
import * as Location from 'expo-location';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet } from 'react-native';
import type MapView from 'react-native-maps';

import { PlaceAutocompleteInput } from '@/components/PlaceAutocompleteInput';
import { Text, View } from '@/components/Themed';
import { TripMap } from '@/components/TripMap';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { getApiErrorMessage } from '@/lib/api/errors';
import { createTrip, estimateFare, type FareEstimate } from '@/lib/api/trips';
import { getDirectionsRoute, type LatLng } from '@/lib/directions/client';
import { useCurrentLocation } from '@/lib/location/useCurrentLocation';
import { reverseGeocodeAddress } from '@/lib/location/reverseGeocode';
import { useToast } from '@/lib/toast/ToastContext';

const DEFAULT_CENTER = { lat: 15.5, lng: -88.03 };
const LOCATE_ZOOM_DELTA = 0.005;

export default function RequestTripScreen() {
  const params = useLocalSearchParams<{
    destLat: string;
    destLng: string;
    destAddress: string;
    originLat?: string;
    originLng?: string;
    originAddress?: string;
  }>();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];
  const { showToast } = useToast();

  const hasOriginParams = Boolean(params.originLat && params.originLng);
  const [origin, setOrigin] = useState<LatLng | null>(
    hasOriginParams ? { lat: Number(params.originLat), lng: Number(params.originLng) } : null,
  );
  const [originAddress, setOriginAddress] = useState(
    hasOriginParams ? params.originAddress || 'Mi ubicación actual' : '',
  );

  const [isLocating, setIsLocating] = useState(false);
  const mapRef = useRef<MapView>(null);

  const fallbackLocation = useCurrentLocation();
  useEffect(() => {
    if (origin || !fallbackLocation.location) return;
    const location = fallbackLocation.location;
    setOrigin(location);
    let cancelled = false;
    reverseGeocodeAddress(location)
      .then((address) => {
        if (!cancelled) setOriginAddress((prev) => prev || address || 'Mi ubicación actual');
      })
      .catch(() => {
        if (!cancelled) setOriginAddress((prev) => prev || 'Mi ubicación actual');
      });
    return () => {
      cancelled = true;
    };
  }, [origin, fallbackLocation.location]);
  const [destination, setDestination] = useState<LatLng>({
    lat: Number(params.destLat),
    lng: Number(params.destLng),
  });
  const [destinationAddress, setDestinationAddress] = useState(params.destAddress ?? '');

  const [fare, setFare] = useState<FareEstimate | null>(null);
  const [fareError, setFareError] = useState<string | null>(null);
  const [isEstimating, setIsEstimating] = useState(false);
  const [routePath, setRoutePath] = useState<LatLng[]>([]);
  const [isRequesting, setIsRequesting] = useState(false);

  useEffect(() => {
    if (!origin) return;
    let cancelled = false;
    setIsEstimating(true);
    setFare(null);
    setFareError(null);
    estimateFare({
      originLat: origin.lat,
      originLng: origin.lng,
      destinationLat: destination.lat,
      destinationLng: destination.lng,
    })
      .then((result) => {
        if (!cancelled) setFare(result);
      })
      .catch((error) => {
        if (!cancelled) setFareError(getApiErrorMessage(error));
      })
      .finally(() => {
        if (!cancelled) setIsEstimating(false);
      });
    return () => {
      cancelled = true;
    };
  }, [origin, destination]);

  useEffect(() => {
    if (!origin) return;
    let cancelled = false;
    getDirectionsRoute(origin, destination)
      .then((route) => {
        if (!cancelled) setRoutePath(route?.path ?? []);
      })
      .catch(() => {
        if (!cancelled) setRoutePath([]);
      });
    return () => {
      cancelled = true;
    };
  }, [origin, destination]);

  async function handleConfirm() {
    if (!origin) return;
    setIsRequesting(true);
    try {
      const trip = await createTrip({
        originLat: origin.lat,
        originLng: origin.lng,
        originAddress,
        destinationLat: destination.lat,
        destinationLng: destination.lng,
        destinationAddress,
      });
      router.replace({
        pathname: '/(passenger)/trip/[tripId]',
        params: { tripId: trip.id, destinationAddress },
      });
    } catch (error) {
      showToast({
        type: 'error',
        title: 'No se pudo solicitar el viaje',
        message: getApiErrorMessage(error),
      });
      setIsRequesting(false);
    }
  }

  async function handleLocateMe() {
    setIsLocating(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        showToast({
          type: 'info',
          title: 'Ubicación no disponible',
          message: 'Necesitamos acceso a tu ubicación. Actívalo en los ajustes del teléfono.',
        });
        return;
      }
      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      const location: LatLng = { lat: position.coords.latitude, lng: position.coords.longitude };
      setOrigin(location);
      mapRef.current?.animateToRegion(
        {
          latitude: location.lat,
          longitude: location.lng,
          latitudeDelta: LOCATE_ZOOM_DELTA,
          longitudeDelta: LOCATE_ZOOM_DELTA,
        },
        500,
      );
      const address = await reverseGeocodeAddress(location);
      setOriginAddress(address || 'Mi ubicación actual');
    } catch {
      showToast({
        type: 'error',
        title: 'No se pudo obtener tu ubicación',
        message: 'Intenta de nuevo en un momento.',
      });
    } finally {
      setIsLocating(false);
    }
  }

  const mapCenter = origin ?? destination ?? DEFAULT_CENTER;

  return (
    <View style={styles.container}>
      <TripMap
        ref={mapRef}
        style={StyleSheet.absoluteFill}
        center={mapCenter}
        markers={[
          ...(origin ? [{ position: origin }] : []),
          { position: destination, color: colors.tint },
        ]}
        routePath={routePath}
        routeColor={colors.tint}
      />

      <Pressable
        style={[styles.backButton, { backgroundColor: colors.background }]}
        onPress={() => router.back()}
      >
        <Ionicons name="arrow-back" size={20} color={colors.text} />
      </Pressable>

      <Pressable
        style={[styles.locateButton, { backgroundColor: colors.background }]}
        onPress={handleLocateMe}
        disabled={isLocating}
      >
        {isLocating ? (
          <ActivityIndicator size="small" color={colors.tint} />
        ) : (
          <Ionicons name="locate" size={20} color={colors.tint} />
        )}
      </Pressable>

      <BottomSheet
        snapPoints={['40%', '60%']}
        backgroundStyle={{ backgroundColor: colors.background }}
        handleIndicatorStyle={{ backgroundColor: colors.textSecondary }}
      >
        <BottomSheetView style={styles.sheetContent}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>ORIGEN</Text>
          <PlaceAutocompleteInput
            placeholder="Punto de partida"
            icon="navigate-outline"
            value={originAddress}
            onChangeValue={setOriginAddress}
            locationBias={mapCenter}
            onSelect={(place) => {
              setOrigin({ lat: place.lat, lng: place.lng });
              setOriginAddress(place.address);
            }}
          />

          <Text style={[styles.label, { color: colors.textSecondary }]}>DESTINO</Text>
          <PlaceAutocompleteInput
            placeholder="¿A dónde vas?"
            icon="flag-outline"
            value={destinationAddress}
            onChangeValue={setDestinationAddress}
            locationBias={mapCenter}
            onSelect={(place) => {
              setDestination({ lat: place.lat, lng: place.lng });
              setDestinationAddress(place.address);
            }}
          />

          <Card style={styles.fareRow}>
            <View style={[styles.fareLabelRow, styles.transparentBackground]}>
              <Ionicons name="cash-outline" size={16} color={colors.textSecondary} />
              <Text style={{ color: colors.textSecondary }}>Tarifa estimada</Text>
            </View>
            {!origin ? (
              fallbackLocation.error ? (
                <Text style={[styles.fareErrorText, { color: colors.textSecondary }]}>
                  {fallbackLocation.error}
                </Text>
              ) : (
                <ActivityIndicator size="small" color={colors.tint} />
              )
            ) : isEstimating ? (
              <ActivityIndicator size="small" color={colors.tint} />
            ) : fare ? (
              <Text style={[styles.fareText, { color: colors.success }]}>
                L. {fare.fare.toFixed(2)} · {fare.distanceKm.toFixed(1)} km
              </Text>
            ) : fareError ? (
              <Text style={[styles.fareErrorText, { color: colors.textSecondary }]}>
                {fareError}
              </Text>
            ) : null}
          </Card>

          <Button
            onPress={handleConfirm}
            loading={isRequesting}
            disabled={!origin || !fare}
            style={styles.button}
          >
            <View style={[styles.buttonContent, styles.transparentBackground]}>
              <Ionicons name="car-outline" size={18} color="#fff" />
              <Text style={styles.buttonText}>Solicitar viaje</Text>
            </View>
          </Button>
        </BottomSheetView>
      </BottomSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backButton: {
    position: 'absolute',
    top: 56,
    left: 16,
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  locateButton: {
    position: 'absolute',
    top: 56,
    right: 16,
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  sheetContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
    gap: 8,
  },
  transparentBackground: {
    backgroundColor: 'transparent',
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    marginTop: 8,
  },
  fareRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginTop: 8,
  },
  fareLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  fareText: {
    fontSize: 14,
    fontWeight: '700',
  },
  fareErrorText: {
    fontSize: 12,
  },
  button: {
    marginTop: 12,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
});

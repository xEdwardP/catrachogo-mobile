import BottomSheet, { BottomSheetView } from '@gorhom/bottom-sheet';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet } from 'react-native';

import { PlaceAutocompleteInput } from '@/components/PlaceAutocompleteInput';
import { Text, View } from '@/components/Themed';
import { TripMap } from '@/components/TripMap';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { getApiErrorMessage } from '@/lib/api/errors';
import { createTrip, estimateFare, type FareEstimate } from '@/lib/api/trips';
import { getDirectionsRoute, type LatLng } from '@/lib/directions/client';
import { useCurrentLocation } from '@/lib/location/useCurrentLocation';

const DEFAULT_CENTER = { lat: 15.5, lng: -88.03 };

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

  const hasOriginParams = Boolean(params.originLat && params.originLng);
  const [origin, setOrigin] = useState<LatLng | null>(
    hasOriginParams ? { lat: Number(params.originLat), lng: Number(params.originLng) } : null,
  );
  const [originAddress, setOriginAddress] = useState(
    hasOriginParams ? params.originAddress || 'Mi ubicación actual' : '',
  );

  const fallbackLocation = useCurrentLocation();
  useEffect(() => {
    if (origin || !fallbackLocation.location) return;
    setOrigin(fallbackLocation.location);
    setOriginAddress((prev) => prev || 'Mi ubicación actual');
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
      await createTrip({
        originLat: origin.lat,
        originLng: origin.lng,
        originAddress,
        destinationLat: destination.lat,
        destinationLng: destination.lng,
        destinationAddress,
      });
      Alert.alert('Viaje solicitado', 'Buscando un conductor cercano...');
      router.replace('/(passenger)/(tabs)');
    } catch (error) {
      Alert.alert('No se pudo solicitar el viaje', getApiErrorMessage(error));
    } finally {
      setIsRequesting(false);
    }
  }

  const mapCenter = origin ?? destination ?? DEFAULT_CENTER;

  return (
    <View style={styles.container}>
      <TripMap
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
        <Text style={styles.backButtonText}>←</Text>
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
            value={destinationAddress}
            onChangeValue={setDestinationAddress}
            locationBias={mapCenter}
            onSelect={(place) => {
              setDestination({ lat: place.lat, lng: place.lng });
              setDestinationAddress(place.address);
            }}
          />

          <View style={[styles.fareRow, { backgroundColor: colors.surfaceHighlight }]}>
            <Text style={{ color: colors.textSecondary }}>Tarifa estimada</Text>
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
          </View>

          <Pressable
            style={[
              styles.button,
              { backgroundColor: colors.tint },
              (!origin || !fare || isRequesting) && styles.buttonDisabled,
            ]}
            onPress={handleConfirm}
            disabled={!origin || !fare || isRequesting}
          >
            {isRequesting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Solicitar viaje</Text>
            )}
          </Pressable>
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
  backButtonText: {
    fontSize: 18,
  },
  sheetContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
    gap: 8,
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
  fareText: {
    fontSize: 13,
    fontWeight: '700',
  },
  fareErrorText: {
    fontSize: 12,
  },
  button: {
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 12,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
});

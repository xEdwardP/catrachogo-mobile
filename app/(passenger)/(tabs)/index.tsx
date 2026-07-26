import { router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, StyleSheet } from 'react-native';

import { PlaceAutocompleteInput, type PlaceSelection } from '@/components/PlaceAutocompleteInput';
import { Text, View } from '@/components/Themed';
import { TripMap } from '@/components/TripMap';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { useAuth } from '@/lib/auth/AuthContext';
import { useCurrentLocation } from '@/lib/location/useCurrentLocation';

const DEFAULT_CENTER = { lat: 15.5, lng: -88.03 };

export default function PassengerHomeScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];
  const { profile } = useAuth();
  const { location, isLoading, error } = useCurrentLocation();
  const [destinationText, setDestinationText] = useState('');

  const mapCenter = location ?? DEFAULT_CENTER;
  const firstName = profile?.name.split(' ')[0] ?? '';

  function handleSelectDestination(place: PlaceSelection) {
    setDestinationText(place.address);
    router.push({
      pathname: '/(passenger)/request-trip',
      params: {
        destLat: String(place.lat),
        destLng: String(place.lng),
        destAddress: place.address,
        originLat: location ? String(location.lat) : '',
        originLng: location ? String(location.lng) : '',
        originAddress: location ? 'Mi ubicación actual' : '',
      },
    });
  }

  return (
    <View style={styles.container}>
      <Text style={styles.greeting}>Hola, {firstName}</Text>

      <PlaceAutocompleteInput
        placeholder="¿A dónde vas?"
        value={destinationText}
        onChangeValue={setDestinationText}
        locationBias={mapCenter}
        onSelect={handleSelectDestination}
      />

      {error && <Text style={[styles.error, { color: colors.textSecondary }]}>{error}</Text>}

      <View style={styles.mapWrapper}>
        {isLoading ? (
          <View style={styles.mapLoading}>
            <ActivityIndicator color={colors.tint} />
          </View>
        ) : (
          <TripMap
            style={styles.map}
            center={mapCenter}
            markers={location ? [{ position: location }] : []}
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    gap: 12,
  },
  greeting: {
    fontSize: 20,
    fontWeight: '700',
  },
  error: {
    fontSize: 13,
  },
  mapWrapper: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
  },
  mapLoading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  map: {
    flex: 1,
  },
});

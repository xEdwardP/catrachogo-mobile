import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet } from 'react-native';

import { NotificationBell } from '@/components/NotificationBell';
import { PlaceAutocompleteInput, type PlaceSelection } from '@/components/PlaceAutocompleteInput';
import { SaveFavoriteAddressModal } from '@/components/SaveFavoriteAddressModal';
import { Text, View } from '@/components/Themed';
import { TripMap } from '@/components/TripMap';
import { Card } from '@/components/ui/Card';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { savedAddressDisplayLabel } from '@/constants/SavedAddressLabels';
import { getApiErrorMessage } from '@/lib/api/errors';
import {
  createSavedAddress,
  deleteSavedAddress,
  getSavedAddresses,
  type CreateSavedAddressPayload,
  type SavedAddress,
} from '@/lib/api/savedAddresses';
import { getTripHistory } from '@/lib/api/trips';
import { useAuth } from '@/lib/auth/AuthContext';
import { useCurrentLocation } from '@/lib/location/useCurrentLocation';

const DEFAULT_CENTER = { lat: 15.5, lng: -88.03 };
const RECENT_DESTINATIONS_LIMIT = 5;
const TRIP_HISTORY_SAMPLE_SIZE = 20;

export default function PassengerHomeScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];
  const { profile } = useAuth();
  const { location, isLoading, error } = useCurrentLocation();
  const [destinationText, setDestinationText] = useState('');

  const [favorites, setFavorites] = useState<SavedAddress[]>([]);
  const [recentDestinations, setRecentDestinations] = useState<PlaceSelection[]>([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isSavingFavorite, setIsSavingFavorite] = useState(false);
  const [favoriteError, setFavoriteError] = useState<string | null>(null);

  const mapCenter = location ?? DEFAULT_CENTER;
  const firstName = profile?.name.split(' ')[0] ?? '';

  useEffect(() => {
    getSavedAddresses()
      .then(setFavorites)
      .catch(() => {});
  }, []);

  useEffect(() => {
    getTripHistory(1, TRIP_HISTORY_SAMPLE_SIZE)
      .then((result) => {
        const seen = new Set<string>();
        const recents: PlaceSelection[] = [];
        for (const trip of result.data) {
          if (
            !trip.destinationAddress ||
            trip.destinationLat == null ||
            trip.destinationLng == null
          )
            continue;
          if (seen.has(trip.destinationAddress)) continue;
          seen.add(trip.destinationAddress);
          recents.push({
            address: trip.destinationAddress,
            lat: trip.destinationLat,
            lng: trip.destinationLng,
          });
          if (recents.length >= RECENT_DESTINATIONS_LIMIT) break;
        }
        setRecentDestinations(recents);
      })
      .catch(() => {});
  }, []);

  const goToRequestTrip = useCallback(
    (place: PlaceSelection) => {
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
    },
    [location],
  );

  function handleSelectDestination(place: PlaceSelection) {
    setDestinationText(place.address);
    goToRequestTrip(place);
  }

  async function handleSaveFavorite(payload: CreateSavedAddressPayload) {
    setFavoriteError(null);
    setIsSavingFavorite(true);
    try {
      const saved = await createSavedAddress(payload);
      setFavorites((current) => [...current, saved]);
      setIsModalVisible(false);
    } catch (err) {
      setFavoriteError(getApiErrorMessage(err));
    } finally {
      setIsSavingFavorite(false);
    }
  }

  function handleDeleteFavorite(favorite: SavedAddress) {
    Alert.alert(
      'Eliminar dirección',
      `¿Quieres eliminar "${savedAddressDisplayLabel(favorite)}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            const previous = favorites;
            setFavorites((current) => current.filter((item) => item.id !== favorite.id));
            try {
              await deleteSavedAddress(favorite.id);
            } catch {
              setFavorites(previous);
              Alert.alert('No se pudo eliminar la dirección. Intenta de nuevo.');
            }
          },
        },
      ],
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.greetingRow}>
        <Text style={styles.greeting}>Hola, {firstName}</Text>
        <NotificationBell />
      </View>

      <PlaceAutocompleteInput
        placeholder="¿A dónde vas?"
        value={destinationText}
        onChangeValue={setDestinationText}
        locationBias={mapCenter}
        onSelect={handleSelectDestination}
      />

      {error && <Text style={[styles.error, { color: colors.textSecondary }]}>{error}</Text>}

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Direcciones favoritas</Text>
        <Pressable onPress={() => setIsModalVisible(true)}>
          <Text style={{ color: colors.tint, fontWeight: '600' }}>+ Agregar</Text>
        </Pressable>
      </View>

      {favorites.length === 0 ? (
        <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
          Guarda tu casa o tu trabajo para pedir viajes más rápido.
        </Text>
      ) : (
        favorites.map((favorite) => (
          <Card key={favorite.id} style={styles.row}>
            <Pressable
              style={styles.rowMain}
              onPress={() =>
                goToRequestTrip({
                  address: favorite.address,
                  lat: favorite.lat,
                  lng: favorite.lng,
                })
              }
            >
              <Text style={styles.rowLabel}>{savedAddressDisplayLabel(favorite)}</Text>
              <Text style={[styles.rowAddress, { color: colors.textSecondary }]} numberOfLines={1}>
                {favorite.address}
              </Text>
            </Pressable>
            <Pressable
              style={styles.deleteButton}
              onPress={() => handleDeleteFavorite(favorite)}
              hitSlop={8}
            >
              <Text style={{ color: colors.textSecondary }}>✕</Text>
            </Pressable>
          </Card>
        ))
      )}

      {recentDestinations.length > 0 && (
        <>
          <Text style={[styles.sectionTitle, styles.sectionTitleSpaced]}>Destinos recientes</Text>
          {recentDestinations.map((place) => (
            <Pressable
              key={place.address}
              style={[styles.row, { backgroundColor: colors.surfaceHighlight }]}
              onPress={() => goToRequestTrip(place)}
            >
              <Text style={[styles.rowAddress, styles.recentAddress]} numberOfLines={1}>
                {place.address}
              </Text>
            </Pressable>
          ))}
        </>
      )}

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

      <SaveFavoriteAddressModal
        visible={isModalVisible}
        isSubmitting={isSavingFavorite}
        locationBias={mapCenter}
        error={favoriteError}
        onSave={handleSaveFavorite}
        onDismiss={() => {
          setFavoriteError(null);
          setIsModalVisible(false);
        }}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
    gap: 12,
  },
  greetingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  greeting: {
    flex: 1,
    fontSize: 20,
    fontWeight: '700',
  },
  error: {
    fontSize: 13,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  sectionTitleSpaced: {
    marginTop: 8,
  },
  emptyText: {
    fontSize: 13,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  rowMain: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  rowLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  rowAddress: {
    fontSize: 13,
    marginTop: 2,
  },
  recentAddress: {
    flex: 1,
    marginTop: 0,
  },
  deleteButton: {
    paddingLeft: 12,
  },
  mapWrapper: {
    height: 200,
    borderRadius: 16,
    overflow: 'hidden',
    marginTop: 8,
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

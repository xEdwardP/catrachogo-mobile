import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Image, Pressable, ScrollView, StyleSheet } from 'react-native';

import { NotificationBell } from '@/components/NotificationBell';
import { PlaceAutocompleteInput, type PlaceSelection } from '@/components/PlaceAutocompleteInput';
import { SaveFavoriteAddressModal } from '@/components/SaveFavoriteAddressModal';
import { Text, View } from '@/components/Themed';
import { TripMap } from '@/components/TripMap';
import { Card } from '@/components/ui/Card';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { SAVED_ADDRESS_ICONS, savedAddressDisplayLabel } from '@/constants/SavedAddressLabels';
import { Typography } from '@/constants/Typography';
import { getApiErrorMessage } from '@/lib/api/errors';
import {
  createSavedAddress,
  deleteSavedAddress,
  getSavedAddresses,
  type CreateSavedAddressPayload,
  type SavedAddress,
} from '@/lib/api/savedAddresses';
import { getTripHistory } from '@/lib/api/trips';
import { useCurrentLocation } from '@/lib/location/useCurrentLocation';
import { useOpenDrawer } from '@/lib/navigation/useOpenDrawer';
import { useToast } from '@/lib/toast/ToastContext';

const DEFAULT_CENTER = { lat: 15.5, lng: -88.03 };
const RECENT_DESTINATIONS_LIMIT = 5;
const TRIP_HISTORY_SAMPLE_SIZE = 20;

const CARD_SHADOW = {
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.06,
  shadowRadius: 6,
  elevation: 2,
};

export default function PassengerHomeScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];
  const openDrawer = useOpenDrawer();
  const { showToast } = useToast();
  const { location, isLoading, error } = useCurrentLocation();
  const [destinationText, setDestinationText] = useState('');

  const [favorites, setFavorites] = useState<SavedAddress[]>([]);
  const [recentDestinations, setRecentDestinations] = useState<PlaceSelection[]>([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isSavingFavorite, setIsSavingFavorite] = useState(false);
  const [favoriteError, setFavoriteError] = useState<string | null>(null);
  const [favoriteToDelete, setFavoriteToDelete] = useState<SavedAddress | null>(null);
  const [isDeletingFavorite, setIsDeletingFavorite] = useState(false);

  const mapCenter = location ?? DEFAULT_CENTER;

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
      showToast({
        type: 'success',
        title: 'Dirección guardada',
        message: 'Ya puedes pedir un viaje más rápido desde ahí.',
      });
    } catch (err) {
      setFavoriteError(getApiErrorMessage(err));
    } finally {
      setIsSavingFavorite(false);
    }
  }

  async function confirmDeleteFavorite() {
    if (!favoriteToDelete) return;
    const favorite = favoriteToDelete;
    setIsDeletingFavorite(true);
    try {
      await deleteSavedAddress(favorite.id);
      setFavorites((current) => current.filter((item) => item.id !== favorite.id));
      setFavoriteToDelete(null);
    } catch {
      showToast({
        type: 'error',
        message: 'No se pudo eliminar la dirección. Intenta de nuevo.',
      });
    } finally {
      setIsDeletingFavorite(false);
    }
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.greetingRow}>
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

      <View style={styles.heroSection}>
        <View style={styles.searchCard}>
          <PlaceAutocompleteInput
            placeholder="¿A dónde vas?"
            icon="search-outline"
            value={destinationText}
            onChangeValue={setDestinationText}
            locationBias={mapCenter}
            onSelect={handleSelectDestination}
          />
        </View>

        <View style={[styles.mapWrapper, CARD_SHADOW]}>
          {isLoading ? (
            <View style={styles.mapLoading}>
              <ActivityIndicator color={colors.tint} />
            </View>
          ) : (
            <>
              <TripMap
                style={styles.map}
                center={mapCenter}
                markers={location ? [{ position: location }] : []}
              />
              {location && (
                <View style={[styles.mapBadge, { backgroundColor: colors.background }]}>
                  <Ionicons name="navigate" size={12} color={colors.tint} />
                  <Text style={styles.mapBadgeText}>Tu ubicación</Text>
                </View>
              )}
            </>
          )}
        </View>
      </View>

      {error && (
        <View style={[styles.noticeRow, styles.transparentBackground]}>
          <Ionicons name="alert-circle-outline" size={14} color={colors.textSecondary} />
          <Text style={[styles.noticeText, { color: colors.textSecondary }]}>{error}</Text>
        </View>
      )}

      <View style={[styles.sectionHeader, styles.transparentBackground]}>
        <Text style={styles.sectionTitle}>Direcciones favoritas</Text>
        <Pressable style={styles.addButton} onPress={() => setIsModalVisible(true)} hitSlop={6}>
          <Ionicons name="add-circle" size={16} color={colors.tint} />
          <Text style={{ color: colors.tint, fontWeight: '600', fontSize: 13 }}>Agregar</Text>
        </Pressable>
      </View>

      {favorites.length === 0 ? (
        <View style={[styles.emptyCard, { backgroundColor: colors.surfaceHighlight }, CARD_SHADOW]}>
          <Ionicons name="heart-outline" size={22} color={colors.tint} />
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            Guarda tu casa o tu trabajo para pedir viajes más rápido.
          </Text>
        </View>
      ) : (
        favorites.map((favorite) => (
          <Card key={favorite.id} style={[styles.row, CARD_SHADOW]}>
            <View
              style={[
                styles.rowIcon,
                styles.transparentBackground,
                { backgroundColor: colors.background },
              ]}
            >
              <Ionicons name={SAVED_ADDRESS_ICONS[favorite.label]} size={18} color={colors.tint} />
            </View>
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
              onPress={() => setFavoriteToDelete(favorite)}
              hitSlop={8}
            >
              <Ionicons name="trash-outline" size={18} color={colors.textSecondary} />
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
              style={[styles.row, { backgroundColor: colors.surfaceHighlight }, CARD_SHADOW]}
              onPress={() => goToRequestTrip(place)}
            >
              <View
                style={[
                  styles.rowIcon,
                  styles.transparentBackground,
                  { backgroundColor: colors.background },
                ]}
              >
                <Ionicons name="time-outline" size={18} color={colors.tint} />
              </View>
              <Text style={[styles.rowAddress, styles.recentAddress]} numberOfLines={1}>
                {place.address}
              </Text>
              <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
            </Pressable>
          ))}
        </>
      )}

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

      <ConfirmDialog
        visible={Boolean(favoriteToDelete)}
        title="Eliminar dirección"
        message={
          favoriteToDelete
            ? `¿Quieres eliminar "${savedAddressDisplayLabel(favoriteToDelete)}"?`
            : ''
        }
        confirmText="Eliminar"
        isDestructive
        isSubmitting={isDeletingFavorite}
        onConfirm={confirmDeleteFavorite}
        onDismiss={() => setFavoriteToDelete(null)}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingTop: 56,
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 12,
  },
  transparentBackground: {
    backgroundColor: 'transparent',
  },
  greetingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
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
  noticeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  noticeText: {
    fontSize: 12,
    flex: 1,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  sectionTitle: {
    ...Typography.sectionTitle,
  },
  sectionTitleSpaced: {
    marginTop: 8,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  emptyCard: {
    borderRadius: 14,
    paddingVertical: 20,
    paddingHorizontal: 16,
    alignItems: 'center',
    gap: 8,
  },
  emptyText: {
    fontSize: 13,
    textAlign: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 10,
  },
  rowIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
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
    paddingLeft: 4,
  },
  heroSection: {
    marginBottom: 20,
  },
  mapWrapper: {
    height: 260,
    borderRadius: 20,
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
  searchCard: {
    marginBottom: 12,
  },
  mapBadge: {
    position: 'absolute',
    left: 10,
    top: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  mapBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
});

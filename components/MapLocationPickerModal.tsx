import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { ActivityIndicator, Modal, Pressable, StyleSheet } from 'react-native';
import MapView from 'react-native-maps';

import { Text, View } from '@/components/Themed';
import { Button } from '@/components/ui/Button';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { reverseGeocodeAddress } from '@/lib/location/reverseGeocode';

type LatLng = { lat: number; lng: number };

type Props = {
  visible: boolean;
  initialCenter: LatLng;
  onDismiss: () => void;
  onSelect: (place: { lat: number; lng: number; address: string }) => void;
};

export function MapLocationPickerModal({
  visible,
  initialCenter,
  onDismiss,
  onSelect,
}: Props) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];

  const [center, setCenter] = useState(initialCenter);
  const [address, setAddress] = useState<string | null>(null);
  const [isResolving, setIsResolving] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);

  function handleShow() {
    setCenter(initialCenter);
    resolveAddress(initialCenter);
  }

  function resolveAddress(point: LatLng) {
    setIsResolving(true);
    reverseGeocodeAddress(point)
      .then((result) => setAddress(result))
      .finally(() => setIsResolving(false));
  }

  function handleRegionChangeComplete(region: { latitude: number; longitude: number }) {
    const point = { lat: region.latitude, lng: region.longitude };
    setCenter(point);
    resolveAddress(point);
  }

  async function handleConfirm() {
    setIsConfirming(true);
    const resolvedAddress = address ?? (await reverseGeocodeAddress(center));
    onSelect({ lat: center.lat, lng: center.lng, address: resolvedAddress ?? 'Ubicación seleccionada' });
    setIsConfirming(false);
  }

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onDismiss} onShow={handleShow}>
      <MapView
        style={styles.map}
        initialRegion={{
          latitude: initialCenter.lat,
          longitude: initialCenter.lng,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }}
        onRegionChangeComplete={handleRegionChangeComplete}
      />

      <Ionicons
        name="location"
        size={36}
        color={colors.tint}
        style={styles.pin}
        pointerEvents="none"
      />

      <Pressable
        style={[styles.closeButton, { backgroundColor: colors.background }]}
        onPress={onDismiss}
      >
        <Ionicons name="close" size={22} color={colors.text} />
      </Pressable>

      <View style={[styles.bottomBar, { backgroundColor: colors.background }]}>
        <View style={styles.addressRow}>
          <Ionicons name="location-outline" size={16} color={colors.textSecondary} />
          {isResolving ? (
            <ActivityIndicator size="small" color={colors.tint} />
          ) : (
            <Text style={styles.addressText} numberOfLines={2}>
              {address ?? 'Mueve el mapa para elegir un punto'}
            </Text>
          )}
        </View>
        <Button onPress={handleConfirm} loading={isConfirming} disabled={isResolving}>
          <Text style={styles.confirmText}>Confirmar ubicación</Text>
        </Button>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  map: {
    flex: 1,
  },
  pin: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginLeft: -18,
    marginTop: -36,
  },
  closeButton: {
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
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 32,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  addressText: {
    flex: 1,
    fontSize: 14,
  },
  confirmText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
});

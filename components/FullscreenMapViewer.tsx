import { Ionicons } from '@expo/vector-icons';
import { Modal, Pressable, StyleSheet } from 'react-native';

import { TripMap, type TripMapMarker } from '@/components/TripMap';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';

type LatLng = { lat: number; lng: number };

type Props = {
  visible: boolean;
  onDismiss: () => void;
  center: LatLng;
  markers?: TripMapMarker[];
};

export function FullscreenMapViewer({ visible, onDismiss, center, markers }: Props) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onDismiss}>
      <TripMap style={StyleSheet.absoluteFill} center={center} markers={markers} />
      <Pressable
        style={[styles.closeButton, { backgroundColor: colors.background }]}
        onPress={onDismiss}
      >
        <Ionicons name="close" size={22} color={colors.text} />
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
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
});

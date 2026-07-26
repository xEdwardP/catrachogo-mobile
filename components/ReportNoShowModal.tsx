import { ActivityIndicator, Modal, Pressable, StyleSheet } from 'react-native';

import { Text, View } from '@/components/Themed';
import { useColorScheme } from '@/components/useColorScheme';
import { CANCELLATION_FEE_AMOUNT } from '@/constants/CancellationReasons';
import Colors from '@/constants/Colors';

type Props = {
  visible: boolean;
  isSubmitting: boolean;
  onConfirm: () => void;
  onDismiss: () => void;
};

export function ReportNoShowModal({ visible, isSubmitting, onConfirm, onDismiss }: Props) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onDismiss}>
      <View style={styles.overlay} lightColor="rgba(0,0,0,0.4)" darkColor="rgba(0,0,0,0.6)">
        <View style={[styles.card, { backgroundColor: colors.background }]}>
          <Text style={styles.title}>¿El pasajero no llegó?</Text>
          <Text style={[styles.description, { color: colors.textSecondary }]}>
            Ya esperaste el tiempo mínimo desde que marcaste tu llegada. Se cancelará el viaje y se
            aplicará un cargo de L. {CANCELLATION_FEE_AMOUNT.toFixed(2)} al pasajero como
            compensación para ti.
          </Text>

          <View style={styles.buttonRow}>
            <Pressable
              style={[styles.button, styles.secondaryButton, { borderColor: colors.textSecondary }]}
              onPress={onDismiss}
              disabled={isSubmitting}
            >
              <Text>Esperar más</Text>
            </Pressable>
            <Pressable
              style={[
                styles.button,
                { backgroundColor: colors.tint },
                isSubmitting && styles.disabled,
              ]}
              onPress={onConfirm}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.confirmButtonText}>Sí, no llegó</Text>
              )}
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  card: {
    width: '100%',
    maxWidth: 380,
    borderRadius: 16,
    padding: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 6,
  },
  description: {
    fontSize: 13,
    marginBottom: 20,
    lineHeight: 18,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    flex: 1,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButton: {
    borderWidth: 1,
  },
  confirmButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  disabled: {
    opacity: 0.6,
  },
});

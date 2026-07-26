import { useState } from 'react';
import { ActivityIndicator, Modal, Pressable, StyleSheet } from 'react-native';

import { Text, View } from '@/components/Themed';
import { useColorScheme } from '@/components/useColorScheme';
import {
  CANCELLATION_FEE_AMOUNT,
  CANCELLATION_REASON_LABELS,
  PASSENGER_CANCELLATION_REASONS,
} from '@/constants/CancellationReasons';
import Colors from '@/constants/Colors';
import type { CancellationReason } from '@/lib/api/trips';

type Props = {
  visible: boolean;
  isSubmitting: boolean;
  chargesFee: boolean;
  onConfirm: (reason: CancellationReason) => void;
  onDismiss: () => void;
};

export function CancelTripModal({
  visible,
  isSubmitting,
  chargesFee,
  onConfirm,
  onDismiss,
}: Props) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];
  const [reason, setReason] = useState<CancellationReason>(PASSENGER_CANCELLATION_REASONS[0]);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onDismiss}>
      <View style={styles.overlay} lightColor="rgba(0,0,0,0.4)" darkColor="rgba(0,0,0,0.6)">
        <View style={[styles.card, { backgroundColor: colors.background }]}>
          <Text style={styles.title}>¿Cancelar este viaje?</Text>
          <Text style={[styles.description, { color: colors.textSecondary }]}>
            {chargesFee
              ? `El conductor ya va en camino a recogerte. Si cancelas ahora, se aplicará un cargo de L. ${CANCELLATION_FEE_AMOUNT.toFixed(2)} a tu wallet como compensación para el conductor.`
              : 'Todavía no se te ha asignado un conductor, así que esta cancelación es gratuita.'}
          </Text>

          <Text style={[styles.label, { color: colors.textSecondary }]}>¿POR QUÉ CANCELAS?</Text>
          <View style={styles.reasonList}>
            {PASSENGER_CANCELLATION_REASONS.map((value) => {
              const selected = value === reason;
              return (
                <Pressable
                  key={value}
                  style={[
                    styles.reasonRow,
                    { borderColor: selected ? colors.tint : colors.textSecondary },
                    selected && { backgroundColor: colors.surfaceHighlight },
                  ]}
                  onPress={() => setReason(value)}
                >
                  <Text>{CANCELLATION_REASON_LABELS[value]}</Text>
                </Pressable>
              );
            })}
          </View>

          <View style={styles.buttonRow}>
            <Pressable
              style={[styles.button, styles.secondaryButton, { borderColor: colors.textSecondary }]}
              onPress={onDismiss}
              disabled={isSubmitting}
            >
              <Text>Mantener viaje</Text>
            </Pressable>
            <Pressable
              style={[
                styles.button,
                { backgroundColor: colors.tint },
                isSubmitting && styles.disabled,
              ]}
              onPress={() => onConfirm(reason)}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.confirmButtonText}>Sí, cancelar</Text>
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
    marginBottom: 16,
    lineHeight: 18,
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 8,
  },
  reasonList: {
    gap: 8,
    marginBottom: 20,
  },
  reasonRow: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
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

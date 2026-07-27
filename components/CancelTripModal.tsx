import { useState } from 'react';
import { Pressable, StyleSheet } from 'react-native';

import { Text, View } from '@/components/Themed';
import { Button } from '@/components/ui/Button';
import { ModalCard } from '@/components/ui/ModalCard';
import { useColorScheme } from '@/components/useColorScheme';
import {
  CANCELLATION_FEE_AMOUNT,
  CANCELLATION_REASON_LABELS,
  PASSENGER_CANCELLATION_REASONS,
} from '@/constants/CancellationReasons';
import Colors from '@/constants/Colors';
import { Typography } from '@/constants/Typography';
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
    <ModalCard visible={visible} onDismiss={onDismiss}>
      <Text style={[Typography.h3, styles.title]}>¿Cancelar este viaje?</Text>
      <Text style={[Typography.subtitle, styles.description, { color: colors.textSecondary }]}>
        {chargesFee
          ? `El conductor ya va en camino a recogerte. Si cancelas ahora, se aplicará un cargo de L. ${CANCELLATION_FEE_AMOUNT.toFixed(2)} a tu wallet como compensación para el conductor.`
          : 'Todavía no se te ha asignado un conductor, así que esta cancelación es gratuita.'}
      </Text>

      <Text style={[Typography.label, styles.label, { color: colors.textSecondary }]}>
        ¿POR QUÉ CANCELAS?
      </Text>
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
        <Button
          title="Mantener viaje"
          variant="secondary"
          onPress={onDismiss}
          disabled={isSubmitting}
          style={styles.button}
        />
        <Button
          title="Sí, cancelar"
          onPress={() => onConfirm(reason)}
          loading={isSubmitting}
          style={styles.button}
        />
      </View>
    </ModalCard>
  );
}

const styles = StyleSheet.create({
  title: {
    marginBottom: 6,
  },
  description: {
    marginBottom: 16,
  },
  label: {
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
    paddingVertical: 12,
  },
});

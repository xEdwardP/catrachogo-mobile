import { StyleSheet } from 'react-native';

import { Text, View } from '@/components/Themed';
import { Button } from '@/components/ui/Button';
import { ModalCard } from '@/components/ui/ModalCard';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { Typography } from '@/constants/Typography';

type Props = {
  visible: boolean;
  isSubmitting: boolean;
  onConfirm: () => void;
  onDismiss: () => void;
};

export function EndTripEarlyModal({ visible, isSubmitting, onConfirm, onDismiss }: Props) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];

  return (
    <ModalCard visible={visible} onDismiss={onDismiss}>
      <Text style={[Typography.h3, styles.title]}>¿Finalizar el viaje aquí?</Text>
      <Text style={[Typography.subtitle, styles.description, { color: colors.textSecondary }]}>
        Se te cobrará una tarifa proporcional a la distancia recorrida hasta este punto, no la
        tarifa completa del viaje original.
      </Text>

      <View style={styles.buttonRow}>
        <Button
          title="Continuar viaje"
          variant="secondary"
          onPress={onDismiss}
          disabled={isSubmitting}
          style={styles.button}
        />
        <Button
          title="Sí, finalizar"
          onPress={onConfirm}
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
    marginBottom: 20,
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

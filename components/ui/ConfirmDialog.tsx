import { StyleSheet } from 'react-native';

import { Text, View } from '@/components/Themed';
import { Button } from '@/components/ui/Button';
import { ModalCard } from '@/components/ui/ModalCard';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { Typography } from '@/constants/Typography';

type Props = {
  visible: boolean;
  title: string;
  message: string;
  confirmText: string;
  cancelText?: string;
  isDestructive?: boolean;
  isSubmitting?: boolean;
  onConfirm: () => void;
  onDismiss: () => void;
};

export function ConfirmDialog({
  visible,
  title,
  message,
  confirmText,
  cancelText = 'Cancelar',
  isDestructive = false,
  isSubmitting = false,
  onConfirm,
  onDismiss,
}: Props) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];

  return (
    <ModalCard visible={visible} onDismiss={isSubmitting ? () => {} : onDismiss}>
      <Text style={[Typography.h3, styles.title]}>{title}</Text>
      <Text style={[Typography.subtitle, styles.message, { color: colors.textSecondary }]}>
        {message}
      </Text>
      <View style={styles.buttonRow}>
        <Button
          title={cancelText}
          variant="secondary"
          onPress={onDismiss}
          disabled={isSubmitting}
          style={styles.button}
        />
        <Button
          title={confirmText}
          onPress={onConfirm}
          loading={isSubmitting}
          style={[styles.button, isDestructive && { backgroundColor: '#C0392B' }]}
        />
      </View>
    </ModalCard>
  );
}

const styles = StyleSheet.create({
  title: {
    marginBottom: 6,
  },
  message: {
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

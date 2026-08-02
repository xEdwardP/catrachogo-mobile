import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet } from 'react-native';

import { Text } from '@/components/Themed';
import { ModalCard } from '@/components/ui/ModalCard';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { Typography } from '@/constants/Typography';

type Props = {
  visible: boolean;
  title: string;
  onPickCamera: () => void;
  onPickLibrary: () => void;
  onDismiss: () => void;
};

export function ImageSourceActionSheet({
  visible,
  title,
  onPickCamera,
  onPickLibrary,
  onDismiss,
}: Props) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];

  return (
    <ModalCard visible={visible} onDismiss={onDismiss}>
      <Text style={[Typography.h3, styles.title]}>{title}</Text>
      <Text style={[Typography.subtitle, styles.subtitle, { color: colors.textSecondary }]}>
        Elige una opción
      </Text>

      <Pressable
        style={[styles.row, { borderColor: colors.textSecondary }]}
        onPress={() => {
          onDismiss();
          onPickCamera();
        }}
      >
        <Ionicons name="camera-outline" size={20} color={colors.tint} />
        <Text style={styles.rowText}>Tomar foto</Text>
      </Pressable>

      <Pressable
        style={[styles.row, { borderColor: colors.textSecondary }]}
        onPress={() => {
          onDismiss();
          onPickLibrary();
        }}
      >
        <Ionicons name="images-outline" size={20} color={colors.tint} />
        <Text style={styles.rowText}>Elegir de galería</Text>
      </Pressable>

      <Pressable style={styles.cancelRow} onPress={onDismiss}>
        <Text style={{ color: colors.textSecondary, fontWeight: '600' }}>Cancelar</Text>
      </Pressable>
    </ModalCard>
  );
}

const styles = StyleSheet.create({
  title: {
    marginBottom: 4,
  },
  subtitle: {
    marginBottom: 16,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 13,
    marginBottom: 10,
  },
  rowText: {
    fontSize: 15,
    fontWeight: '600',
  },
  cancelRow: {
    alignItems: 'center',
    paddingVertical: 10,
    marginTop: 4,
  },
});

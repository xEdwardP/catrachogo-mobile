import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, Image, Pressable, StyleSheet } from 'react-native';

import { Text, View } from '@/components/Themed';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { useImageUpload } from '@/lib/cloudinary/useImageUpload';

type Props = {
  label: string;
  value: string | null;
  onUploaded: (url: string) => void;
};

export function CloudinaryImagePicker({ label, value, onUploaded }: Props) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];
  const { isUploading, promptForImage } = useImageUpload(onUploaded);

  return (
    <Pressable
      style={[styles.container, { borderColor: value ? colors.tint : colors.textSecondary }]}
      onPress={() => promptForImage(label)}
      disabled={isUploading}
    >
      {value ? (
        <Image source={{ uri: value }} style={styles.thumbnail} />
      ) : (
        <View style={[styles.placeholder, { backgroundColor: colors.surfaceHighlight }]}>
          <Ionicons name="cloud-upload-outline" size={20} color={colors.tint} />
        </View>
      )}
      <View style={styles.textContainer}>
        <Text style={styles.label}>{label}</Text>
        <View style={[styles.statusRow, styles.transparentBackground]}>
          {value && !isUploading && (
            <Ionicons name="checkmark-circle" size={13} color={colors.success} />
          )}
          <Text style={[styles.status, { color: value ? colors.success : colors.textSecondary }]}>
            {isUploading ? 'Subiendo...' : value ? 'Subido' : 'Toca para subir'}
          </Text>
        </View>
      </View>
      {isUploading && <ActivityIndicator color={colors.tint} />}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
  },
  thumbnail: {
    width: 48,
    height: 48,
    borderRadius: 8,
  },
  placeholder: {
    width: 48,
    height: 48,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textContainer: {
    flex: 1,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
  },
  transparentBackground: {
    backgroundColor: 'transparent',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  status: {
    fontSize: 12,
  },
});

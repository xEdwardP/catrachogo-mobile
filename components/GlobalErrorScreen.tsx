import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, useColorScheme, View } from 'react-native';

import Colors from '@/constants/Colors';

type Props = {
  error: Error;
  retry: () => Promise<void>;
};

export function GlobalErrorScreen({ error, retry }: Props) {
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.iconCircle, { backgroundColor: colors.surfaceHighlight }]}>
        <Ionicons name="warning-outline" size={32} color={colors.tint} />
      </View>
      <Text style={[styles.title, { color: colors.text }]}>Algo salió mal</Text>
      <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
        Ocurrió un error inesperado. Intenta de nuevo — si el problema sigue, cierra y vuelve a
        abrir la app.
      </Text>
      {__DEV__ && (
        <Text style={[styles.devError, { color: colors.textSecondary }]}>{error.message}</Text>
      )}
      <Pressable style={[styles.button, { backgroundColor: colors.tint }]} onPress={retry}>
        <Ionicons name="refresh-outline" size={16} color="#fff" />
        <Text style={styles.buttonText}>Reintentar</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  devError: {
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 24,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 15,
  },
});

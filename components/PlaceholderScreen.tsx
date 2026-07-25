import { Pressable, StyleSheet } from 'react-native';

import { Text, View } from '@/components/Themed';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { useAuth } from '@/lib/auth/AuthContext';

type Props = {
  title: string;
  showLogout?: boolean;
};

export function PlaceholderScreen({ title, showLogout }: Props) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];
  const { session, logout } = useAuth();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
        Pantalla pendiente de construir — ver docs/roadmap-mobile-fase1.md
      </Text>
      {showLogout && session && (
        <Pressable style={[styles.button, { borderColor: colors.tint }]} onPress={logout}>
          <Text style={{ color: colors.tint }}>Cerrar sesión ({session.name})</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 8,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 13,
    textAlign: 'center',
  },
  button: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginTop: 24,
  },
});

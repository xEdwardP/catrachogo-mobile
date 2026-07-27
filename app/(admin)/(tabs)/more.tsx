import { router } from 'expo-router';
import { Pressable, StyleSheet } from 'react-native';

import { Text, View } from '@/components/Themed';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { useAuth } from '@/lib/auth/AuthContext';

type MenuItem = {
  label: string;
  description: string;
  href:
    '/(admin)/withdrawals' | '/(admin)/zones' | '/(admin)/incident-reports' | '/(admin)/profile';
};

const MENU_ITEMS: MenuItem[] = [
  {
    label: 'Retiros',
    description: 'Aprobar o rechazar solicitudes de retiro de conductores',
    href: '/(admin)/withdrawals',
  },
  {
    label: 'Zonas y tarifas',
    description: 'Configuración de zonas de cobertura y tarifas',
    href: '/(admin)/zones',
  },
  {
    label: 'Reportes de incidencias',
    description: 'Revisar reportes enviados por pasajeros y conductores',
    href: '/(admin)/incident-reports',
  },
  {
    label: 'Mi perfil',
    description: 'Datos de tu cuenta y cerrar sesión',
    href: '/(admin)/profile',
  },
];

export default function AdminMoreScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];
  const { session } = useAuth();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Más</Text>
      {session && (
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{session.name}</Text>
      )}

      <View style={styles.list}>
        {MENU_ITEMS.map((item) => (
          <Pressable
            key={item.href}
            style={[styles.item, { backgroundColor: colors.surfaceHighlight }]}
            onPress={() => router.push(item.href)}
          >
            <View style={styles.itemText}>
              <Text style={styles.itemLabel}>{item.label}</Text>
              <Text style={[styles.itemDescription, { color: colors.textSecondary }]}>
                {item.description}
              </Text>
            </View>
            <Text style={[styles.chevron, { color: colors.textSecondary }]}>›</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 56,
    paddingHorizontal: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 13,
    marginTop: 2,
    marginBottom: 20,
  },
  list: {
    gap: 10,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  itemText: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  itemLabel: {
    fontSize: 15,
    fontWeight: '700',
  },
  itemDescription: {
    fontSize: 12,
    marginTop: 2,
  },
  chevron: {
    fontSize: 22,
    fontWeight: '300',
  },
});

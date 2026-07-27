import { router, useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, TextInput } from 'react-native';

import { Text, View } from '@/components/Themed';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { VEHICLE_TYPE_LABELS } from '@/constants/VehicleTypeLabels';
import { getAdminDrivers, type AdminDriverRow, type VerificationStatus } from '@/lib/api/admin';
import { getApiErrorMessage } from '@/lib/api/errors';

const STATUS_TABS: { value: VerificationStatus; label: string }[] = [
  { value: 'pending', label: 'Pendientes' },
  { value: 'approved', label: 'Aprobados' },
  { value: 'rejected', label: 'Rechazados' },
];

export default function AdminDriversScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];

  const [status, setStatus] = useState<VerificationStatus>('pending');
  const [drivers, setDrivers] = useState<AdminDriverRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const fetchDrivers = useCallback((forStatus: VerificationStatus) => {
    getAdminDrivers(forStatus)
      .then((result) => {
        setDrivers(result);
        setError(null);
      })
      .catch((err) => setError(getApiErrorMessage(err)))
      .finally(() => setIsLoading(false));
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchDrivers(status);
    }, [fetchDrivers, status]),
  );

  function handleStatusChange(nextStatus: VerificationStatus) {
    if (nextStatus === status) return;
    setIsLoading(true);
    setSearch('');
    setDrivers([]);
    setStatus(nextStatus);
  }

  const visibleDrivers = useMemo(() => {
    const query = search.trim().toLowerCase();
    const filtered = query
      ? drivers.filter(
          (driver) =>
            driver.user.name.toLowerCase().includes(query) ||
            driver.vehicles[0]?.plate.toLowerCase().includes(query),
        )
      : drivers;

    return [...filtered].sort(
      (a, b) => new Date(b.user.createdAt).getTime() - new Date(a.user.createdAt).getTime(),
    );
  }, [drivers, search]);

  const statusLabel = STATUS_TABS.find((tab) => tab.value === status)?.label.toLowerCase() ?? '';

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Conductores</Text>
      <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
        {isLoading ? 'Cargando...' : `${visibleDrivers.length} ${statusLabel}`}
      </Text>

      <View style={styles.tabsRow}>
        {STATUS_TABS.map((tab) => {
          const isActive = tab.value === status;
          return (
            <Pressable
              key={tab.value}
              style={[
                styles.tab,
                { borderColor: isActive ? colors.tint : colors.textSecondary },
                isActive && { backgroundColor: colors.tint },
              ]}
              onPress={() => handleStatusChange(tab.value)}
            >
              <Text style={[styles.tabText, isActive ? styles.tabTextActive : undefined]}>
                {tab.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <TextInput
        style={[styles.search, { borderColor: colors.textSecondary, color: colors.text }]}
        placeholder="Buscar por nombre o placa"
        placeholderTextColor={colors.textSecondary}
        autoCapitalize="none"
        value={search}
        onChangeText={setSearch}
      />

      {isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator color={colors.tint} />
        </View>
      ) : error ? (
        <View style={styles.centered}>
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>{error}</Text>
        </View>
      ) : visibleDrivers.length === 0 ? (
        <View style={styles.centered}>
          <Text style={[styles.emptyTitle, { color: colors.text }]}>
            {drivers.length === 0 ? 'No hay conductores en este estado' : 'Sin resultados'}
          </Text>
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            {drivers.length === 0
              ? 'Cuando haya movimiento en esta categoría, aparecerá aquí.'
              : 'Ningún conductor coincide con tu búsqueda.'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={visibleDrivers}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          keyboardShouldPersistTaps="handled"
          renderItem={({ item }) => {
            const vehicle = item.vehicles[0];
            return (
              <Pressable
                style={[styles.card, { backgroundColor: colors.surfaceHighlight }]}
                onPress={() =>
                  router.push({
                    pathname: '/(admin)/driver/[driverId]',
                    params: { driverId: item.id },
                  })
                }
              >
                <Text style={styles.driverName}>{item.user.name}</Text>
                <Text style={[styles.driverMeta, { color: colors.textSecondary }]}>
                  {VEHICLE_TYPE_LABELS[item.vehicleType]}
                  {vehicle ? ` · ${vehicle.brand} ${vehicle.model}` : ''}
                </Text>
                <View style={styles.cardFooter}>
                  <Text style={[styles.plate, { color: colors.textSecondary }]}>
                    {vehicle?.plate ?? '—'}
                  </Text>
                  <Text style={[styles.date, { color: colors.textSecondary }]}>
                    {new Date(item.user.createdAt).toLocaleDateString('es-HN')}
                  </Text>
                </View>
              </Pressable>
            );
          }}
        />
      )}
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
    fontSize: 12,
    marginTop: 2,
    marginBottom: 14,
  },
  tabsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  tab: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: 'center',
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
  },
  tabTextActive: {
    color: '#fff',
  },
  search: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    marginBottom: 12,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingBottom: 80,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '600',
  },
  emptyText: {
    fontSize: 13,
    textAlign: 'center',
  },
  listContent: {
    paddingBottom: 24,
    gap: 10,
  },
  card: {
    borderRadius: 12,
    padding: 14,
  },
  driverName: {
    fontSize: 15,
    fontWeight: '700',
  },
  driverMeta: {
    fontSize: 13,
    marginTop: 3,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    backgroundColor: 'transparent',
  },
  plate: {
    fontSize: 12,
    fontWeight: '600',
  },
  date: {
    fontSize: 12,
  },
});

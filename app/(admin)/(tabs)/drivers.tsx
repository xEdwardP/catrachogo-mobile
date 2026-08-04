import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet } from 'react-native';

import { Text, View } from '@/components/Themed';
import { Card } from '@/components/ui/Card';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { SegmentedTabs } from '@/components/ui/SegmentedTabs';
import { TextField } from '@/components/ui/TextField';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { VEHICLE_TYPE_ICONS, VEHICLE_TYPE_LABELS } from '@/constants/VehicleTypeLabels';
import { getAdminDrivers, type AdminDriverRow, type VerificationStatus } from '@/lib/api/admin';
import { getApiErrorMessage } from '@/lib/api/errors';
import { useDebouncedValue } from '@/lib/hooks/useDebouncedValue';
import { useOpenDrawer } from '@/lib/navigation/useOpenDrawer';

const PAGE_SIZE = 20;

const STATUS_TABS: { value: VerificationStatus; label: string }[] = [
  { value: 'pending', label: 'Pendientes' },
  { value: 'approved', label: 'Aprobados' },
  { value: 'rejected', label: 'Rechazados' },
];

export default function AdminDriversScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];
  const openDrawer = useOpenDrawer();

  const [status, setStatus] = useState<VerificationStatus>('pending');
  const [drivers, setDrivers] = useState<AdminDriverRow[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search, 400);

  const loadPage = useCallback(
    (forStatus: VerificationStatus, pageToLoad: number, searchQuery: string) => {
      getAdminDrivers(forStatus, pageToLoad, PAGE_SIZE, searchQuery)
        .then((result) => {
          setDrivers((prev) => (pageToLoad === 1 ? result.data : [...prev, ...result.data]));
          setTotal(result.total);
          setError(null);
        })
        .catch((err) => setError(getApiErrorMessage(err)))
        .finally(() => {
          setIsLoading(false);
          setIsLoadingMore(false);
        });
    },
    [],
  );

  useFocusEffect(
    useCallback(() => {
      setIsLoading(true);
      setPage(1);
      loadPage(status, 1, debouncedSearch);
    }, [loadPage, status, debouncedSearch]),
  );

  function handleStatusChange(nextStatus: VerificationStatus) {
    if (nextStatus === status) return;
    setIsLoading(true);
    setSearch('');
    setDrivers([]);
    setStatus(nextStatus);
  }

  function handleEndReached() {
    if (isLoadingMore || isLoading || drivers.length >= total) return;
    const nextPage = page + 1;
    setIsLoadingMore(true);
    setPage(nextPage);
    loadPage(status, nextPage, debouncedSearch);
  }

  const visibleDrivers = useMemo(
    () =>
      [...drivers].sort(
        (a, b) => new Date(b.user.createdAt).getTime() - new Date(a.user.createdAt).getTime(),
      ),
    [drivers],
  );

  const statusLabel = STATUS_TABS.find((tab) => tab.value === status)?.label.toLowerCase() ?? '';

  return (
    <View style={styles.container}>
      <ScreenHeader title="Conductores" onMenuPress={openDrawer} />
      <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
        {isLoading ? 'Cargando...' : `${visibleDrivers.length} ${statusLabel}`}
      </Text>

      <SegmentedTabs
        tabs={STATUS_TABS}
        value={status}
        onChange={handleStatusChange}
        style={styles.tabsRow}
      />

      <TextField
        placeholder="Buscar por nombre o placa"
        autoCapitalize="none"
        value={search}
        onChangeText={setSearch}
        style={styles.search}
      />

      {isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator color={colors.tint} />
        </View>
      ) : error ? (
        <View style={styles.centered}>
          <Ionicons name="alert-circle-outline" size={22} color={colors.textSecondary} />
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>{error}</Text>
        </View>
      ) : visibleDrivers.length === 0 ? (
        <View style={styles.centered}>
          <Ionicons name="people-outline" size={22} color={colors.tint} />
          <Text style={[styles.emptyTitle, { color: colors.text }]}>
            {debouncedSearch.trim() ? 'Sin resultados' : 'No hay conductores en este estado'}
          </Text>
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            {debouncedSearch.trim()
              ? 'Ningún conductor coincide con tu búsqueda.'
              : 'Cuando haya movimiento en esta categoría, aparecerá aquí.'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={visibleDrivers}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          keyboardShouldPersistTaps="handled"
          onEndReached={handleEndReached}
          onEndReachedThreshold={0.4}
          ListFooterComponent={
            isLoadingMore ? (
              <View style={styles.footerLoading}>
                <ActivityIndicator color={colors.tint} />
              </View>
            ) : null
          }
          renderItem={({ item }) => {
            const vehicle = item.vehicles[0];
            return (
              <Card
                style={styles.card}
                onPress={() =>
                  router.push({
                    pathname: '/(admin)/driver/[driverId]',
                    params: { driverId: item.id },
                  })
                }
              >
                <View style={[styles.cardRow, styles.transparentBackground]}>
                  <View style={[styles.driverIconCircle, { backgroundColor: colors.background }]}>
                    <Ionicons
                      name={VEHICLE_TYPE_ICONS[item.vehicleType]}
                      size={17}
                      color={colors.tint}
                    />
                  </View>
                  <View style={[styles.cardMain, styles.transparentBackground]}>
                    <Text style={styles.driverName}>{item.user.name}</Text>
                    <Text style={[styles.driverMeta, { color: colors.textSecondary }]}>
                      {VEHICLE_TYPE_LABELS[item.vehicleType]}
                      {vehicle ? ` · ${vehicle.brand} ${vehicle.model}` : ''}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
                </View>
                <View style={[styles.cardFooter, styles.transparentBackground]}>
                  <Text style={[styles.plate, { color: colors.textSecondary }]}>
                    {vehicle?.plate ?? '—'}
                  </Text>
                  <Text style={[styles.date, { color: colors.textSecondary }]}>
                    {new Date(item.user.createdAt).toLocaleDateString('es-HN')}
                  </Text>
                </View>
              </Card>
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
  transparentBackground: {
    backgroundColor: 'transparent',
  },
  subtitle: {
    fontSize: 12,
    marginTop: -4,
    marginBottom: 14,
  },
  tabsRow: {
    marginBottom: 12,
  },
  search: {
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
    gap: 8,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  driverIconCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardMain: {
    flex: 1,
  },
  driverName: {
    fontSize: 15,
    fontWeight: '700',
  },
  driverMeta: {
    fontSize: 13,
    marginTop: 2,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  plate: {
    fontSize: 12,
    fontWeight: '600',
  },
  date: {
    fontSize: 12,
  },
  footerLoading: {
    paddingVertical: 16,
  },
});

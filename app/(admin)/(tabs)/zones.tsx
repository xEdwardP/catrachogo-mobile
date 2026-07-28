import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet } from 'react-native';

import { FareZoneModal } from '@/components/FareZoneModal';
import { Text, View } from '@/components/Themed';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { TextField } from '@/components/ui/TextField';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { getApiErrorMessage } from '@/lib/api/errors';
import { getFareZones, type FareZone } from '@/lib/api/fareZones';
import { useOpenDrawer } from '@/lib/navigation/useOpenDrawer';

export default function AdminZonesScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];
  const openDrawer = useOpenDrawer();

  const [zones, setZones] = useState<FareZone[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [editingZone, setEditingZone] = useState<FareZone | 'new' | null>(null);

  const fetchZones = useCallback(() => {
    getFareZones()
      .then((result) => {
        setZones(result);
        setError(null);
      })
      .catch((err) => setError(getApiErrorMessage(err)))
      .finally(() => setIsLoading(false));
  }, []);

  useEffect(() => {
    fetchZones();
  }, [fetchZones]);

  function handleModalSuccess() {
    setEditingZone(null);
    setIsLoading(true);
    fetchZones();
  }

  const visibleZones = useMemo(() => {
    const query = search.trim().toLowerCase();
    return query ? zones.filter((zone) => zone.zoneName.toLowerCase().includes(query)) : zones;
  }, [zones, search]);

  return (
    <View style={styles.container}>
      <ScreenHeader title="Zonas y tarifas" onMenuPress={openDrawer} />

      <View style={[styles.headerRow, styles.transparentBackground]}>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          {isLoading ? 'Cargando...' : `${visibleZones.length} zonas configuradas`}
        </Text>
        <Button onPress={() => setEditingZone('new')} style={styles.newButton}>
          <View style={[styles.buttonContent, styles.transparentBackground]}>
            <Ionicons name="add-circle-outline" size={16} color="#fff" />
            <Text style={styles.newButtonText}>Nueva</Text>
          </View>
        </Button>
      </View>

      <TextField
        placeholder="Buscar zona"
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
      ) : visibleZones.length === 0 ? (
        <View style={styles.centered}>
          <Ionicons name="map-outline" size={22} color={colors.tint} />
          <Text style={[styles.emptyTitle, { color: colors.text }]}>
            {zones.length === 0 ? 'Todavía no hay zonas configuradas' : 'Sin resultados'}
          </Text>
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            {zones.length === 0
              ? 'Crea la primera zona para definir tarifas por área.'
              : 'Ninguna zona coincide con tu búsqueda.'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={visibleZones}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          keyboardShouldPersistTaps="handled"
          renderItem={({ item }) => (
            <Card style={styles.card} onPress={() => setEditingZone(item)}>
              <View style={[styles.cardHeader, styles.transparentBackground]}>
                <View style={[styles.zoneIconCircle, { backgroundColor: colors.background }]}>
                  <Ionicons name="location-outline" size={17} color={colors.tint} />
                </View>
                <Text style={styles.zoneName}>{item.zoneName}</Text>
              </View>
              <View style={[styles.fareRow, styles.transparentBackground]}>
                <Text style={[styles.fareText, { color: colors.textSecondary }]}>
                  Base: L. {item.baseFare.toFixed(2)}
                </Text>
                <Text style={[styles.fareText, { color: colors.textSecondary }]}>
                  Por km: L. {item.farePerKm.toFixed(2)}
                </Text>
              </View>
              <Text style={[styles.centerText, { color: colors.textSecondary }]}>
                Centro: {item.centerLat.toFixed(4)}, {item.centerLng.toFixed(4)}
              </Text>
            </Card>
          )}
        />
      )}

      <FareZoneModal
        visible={editingZone !== null}
        zone={editingZone === 'new' ? null : editingZone}
        onDismiss={() => setEditingZone(null)}
        onSuccess={handleModalSuccess}
      />
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
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: -4,
    marginBottom: 14,
  },
  subtitle: {
    fontSize: 12,
  },
  newButton: {
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  newButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 13,
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
    gap: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 2,
  },
  zoneIconCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  zoneName: {
    fontSize: 15,
    fontWeight: '700',
  },
  fareRow: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 2,
  },
  fareText: {
    fontSize: 13,
  },
  centerText: {
    fontSize: 12,
    marginTop: 2,
  },
});

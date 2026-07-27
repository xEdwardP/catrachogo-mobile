import { router } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, TextInput } from 'react-native';

import { FareZoneModal } from '@/components/FareZoneModal';
import { Text, View } from '@/components/Themed';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { getApiErrorMessage } from '@/lib/api/errors';
import { getFareZones, type FareZone } from '@/lib/api/fareZones';

export default function AdminZonesScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];

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
      <Pressable style={styles.backButton} onPress={() => router.back()}>
        <Text style={{ color: colors.textSecondary }}>← Volver</Text>
      </Pressable>

      <View style={[styles.headerRow, styles.transparentBackground]}>
        <View style={styles.transparentBackground}>
          <Text style={styles.title}>Zonas y tarifas</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            {isLoading ? 'Cargando...' : `${visibleZones.length} zonas configuradas`}
          </Text>
        </View>
        <Pressable
          style={[styles.newButton, { backgroundColor: colors.tint }]}
          onPress={() => setEditingZone('new')}
        >
          <Text style={styles.newButtonText}>+ Nueva</Text>
        </Pressable>
      </View>

      <TextInput
        style={[styles.search, { borderColor: colors.textSecondary, color: colors.text }]}
        placeholder="Buscar zona"
        placeholderTextColor={colors.textSecondary}
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
      ) : visibleZones.length === 0 ? (
        <View style={styles.centered}>
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
            <Pressable
              style={[styles.card, { backgroundColor: colors.surfaceHighlight }]}
              onPress={() => setEditingZone(item)}
            >
              <Text style={styles.zoneName}>{item.zoneName}</Text>
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
            </Pressable>
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
  backButton: {
    alignSelf: 'flex-start',
    paddingVertical: 4,
    marginBottom: 8,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  transparentBackground: {
    backgroundColor: 'transparent',
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  newButton: {
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  newButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 13,
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
    gap: 4,
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

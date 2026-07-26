import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet } from 'react-native';

import { CompletedTripsChart } from '@/components/CompletedTripsChart';
import { Text, View } from '@/components/Themed';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { getAdminStats, type AdminStats } from '@/lib/api/admin';
import { getApiStatusCode } from '@/lib/api/client';

type KpiCard = {
  key: string;
  label: string;
  hint: string;
  accent: 'brand' | 'success';
  wide?: boolean;
  getValue: (stats: AdminStats) => string;
  getBadge?: (stats: AdminStats) => number;
};

const KPI_CARDS: KpiCard[] = [
  {
    key: 'active',
    label: 'Viajes activos',
    hint: 'Pendientes, aceptados y en curso',
    accent: 'brand',
    getValue: (stats) => String(stats.activeTrips),
  },
  {
    key: 'revenue',
    label: 'Ingresos de hoy',
    hint: 'Tarifas cobradas hoy',
    accent: 'success',
    getValue: (stats) => `L. ${stats.revenueToday.toFixed(2)}`,
  },
  {
    key: 'available',
    label: 'Conductores disponibles',
    hint: 'Conectados en este momento',
    accent: 'brand',
    getValue: (stats) => String(stats.availableDrivers),
  },
  {
    key: 'pendingDrivers',
    label: 'Conductores por aprobar',
    hint: 'Documentos en revisión',
    accent: 'brand',
    getValue: (stats) => String(stats.pendingDrivers),
    getBadge: (stats) => stats.pendingDrivers,
  },
  {
    key: 'withdrawals',
    label: 'Retiros pendientes',
    hint: 'Solicitudes por resolver',
    accent: 'brand',
    wide: true,
    getValue: (stats) => String(stats.pendingWithdrawals),
    getBadge: (stats) => stats.pendingWithdrawals,
  },
];

const STATUS_ROWS: { key: string; label: string; getCount: (stats: AdminStats) => number }[] = [
  { key: 'pending', label: 'Pendientes', getCount: (s) => s.pendingTrips },
  { key: 'accepted', label: 'Aceptados', getCount: (s) => s.acceptedTrips },
  { key: 'in_progress', label: 'En curso', getCount: (s) => s.inProgressTrips },
  { key: 'completed', label: 'Completados', getCount: (s) => s.completedTrips },
  { key: 'cancelled', label: 'Cancelados', getCount: (s) => s.cancelledTrips },
];

export default function AdminDashboardScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];

  const [stats, setStats] = useState<AdminStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(() => {
    getAdminStats()
      .then((result) => {
        setStats(result);
        setError(null);
      })
      .catch((err) =>
        setError(
          getApiStatusCode(err) === 429
            ? 'Demasiadas consultas seguidas. Espera unos segundos y toca "Actualizar".'
            : 'No se pudo cargar el resumen de la plataforma.',
        ),
      )
      .finally(() => setIsLoading(false));
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  function handleRefresh() {
    setIsLoading(true);
    fetchStats();
  }

  const today = new Date().toLocaleDateString('es-HN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
  const maxStatusCount = stats ? Math.max(1, ...STATUS_ROWS.map((row) => row.getCount(stats))) : 1;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.headerRow}>
        <View style={styles.headerText}>
          <Text style={styles.title}>Dashboard</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{today}</Text>
        </View>
        <Pressable
          style={[styles.refreshButton, { borderColor: colors.tint }, isLoading && styles.disabled]}
          onPress={handleRefresh}
          disabled={isLoading}
        >
          <Text style={[styles.refreshText, { color: colors.tint }]}>Actualizar</Text>
        </Pressable>
      </View>

      {error && (
        <View style={[styles.errorCard, { backgroundColor: colors.surfaceHighlight }]}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      <View style={styles.kpiGrid}>
        {KPI_CARDS.map((card) => {
          const badge = stats && card.getBadge ? card.getBadge(stats) : 0;
          return (
            <View
              key={card.key}
              style={[
                styles.kpiCard,
                { backgroundColor: colors.surfaceHighlight },
                card.wide && styles.kpiCardWide,
              ]}
            >
              {badge > 0 && (
                <View style={[styles.badge, { backgroundColor: colors.tint }]}>
                  <Text style={styles.badgeText}>{badge}</Text>
                </View>
              )}
              {isLoading || !stats ? (
                <ActivityIndicator color={colors.tint} style={styles.kpiLoader} />
              ) : (
                <Text
                  style={[
                    styles.kpiValue,
                    { color: card.accent === 'success' ? colors.success : colors.text },
                  ]}
                >
                  {card.getValue(stats)}
                </Text>
              )}
              <Text style={styles.kpiLabel}>{card.label}</Text>
              <Text style={[styles.kpiHint, { color: colors.textSecondary }]}>{card.hint}</Text>
            </View>
          );
        })}
      </View>

      <View style={[styles.card, { backgroundColor: colors.surfaceHighlight }]}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>Viajes completados</Text>
          {stats && (
            <Text style={[styles.cardMeta, { color: colors.textSecondary }]}>
              {stats.tripsCompletedToday} hoy
            </Text>
          )}
        </View>
        <Text style={[styles.cardSubtitle, { color: colors.textSecondary }]}>Últimos 14 días</Text>
        {isLoading || !stats ? (
          <View style={styles.chartLoading}>
            <ActivityIndicator color={colors.tint} />
          </View>
        ) : (
          <CompletedTripsChart points={stats.dailyCompleted} />
        )}
      </View>

      <View style={[styles.card, { backgroundColor: colors.surfaceHighlight }]}>
        <Text style={styles.cardTitle}>Viajes por estado</Text>
        {isLoading || !stats ? (
          <View style={styles.chartLoading}>
            <ActivityIndicator color={colors.tint} />
          </View>
        ) : (
          <>
            {STATUS_ROWS.map((row) => {
              const count = row.getCount(stats);
              return (
                <View key={row.key} style={styles.statusRow}>
                  <View style={styles.statusHeader}>
                    <Text style={[styles.statusLabel, { color: colors.textSecondary }]}>
                      {row.label}
                    </Text>
                    <Text style={styles.statusCount}>{count}</Text>
                  </View>
                  <View style={[styles.statusTrack, { backgroundColor: colors.background }]}>
                    <View
                      style={[
                        styles.statusFill,
                        {
                          backgroundColor: colors.tint,
                          width: `${(count / maxStatusCount) * 100}%`,
                        },
                      ]}
                    />
                  </View>
                </View>
              );
            })}
            <Text style={[styles.totalText, { color: colors.textSecondary }]}>
              {stats.totalTrips} viajes en total
            </Text>
          </>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingTop: 56,
    paddingBottom: 24,
    gap: 12,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 12,
    marginTop: 2,
    textTransform: 'capitalize',
  },
  refreshButton: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  refreshText: {
    fontSize: 13,
    fontWeight: '600',
  },
  disabled: {
    opacity: 0.5,
  },
  errorCard: {
    borderRadius: 12,
    padding: 14,
  },
  errorText: {
    fontSize: 13,
  },
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  kpiCard: {
    width: '48%',
    flexGrow: 1,
    borderRadius: 14,
    padding: 14,
    minHeight: 104,
  },
  kpiCardWide: {
    width: '100%',
  },
  kpiValue: {
    fontSize: 24,
    fontWeight: '700',
  },
  kpiLoader: {
    alignSelf: 'flex-start',
    height: 29,
  },
  kpiLabel: {
    fontSize: 13,
    fontWeight: '600',
    marginTop: 4,
  },
  kpiHint: {
    fontSize: 11,
    marginTop: 2,
  },
  badge: {
    position: 'absolute',
    top: 10,
    right: 10,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    paddingHorizontal: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
  card: {
    borderRadius: 14,
    padding: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'transparent',
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  cardMeta: {
    fontSize: 12,
  },
  cardSubtitle: {
    fontSize: 11,
    marginTop: 2,
    marginBottom: 14,
  },
  chartLoading: {
    height: 140,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusRow: {
    marginTop: 12,
    backgroundColor: 'transparent',
  },
  statusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
    backgroundColor: 'transparent',
  },
  statusLabel: {
    fontSize: 13,
  },
  statusCount: {
    fontSize: 13,
    fontWeight: '700',
  },
  statusTrack: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  statusFill: {
    height: '100%',
    borderRadius: 4,
  },
  totalText: {
    fontSize: 11,
    textAlign: 'right',
    marginTop: 14,
  },
});

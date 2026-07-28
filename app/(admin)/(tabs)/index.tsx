import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet } from 'react-native';

import { CompletedTripsChart } from '@/components/CompletedTripsChart';
import { Text, View } from '@/components/Themed';
import { Card } from '@/components/ui/Card';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { getAdminStats, type AdminStats } from '@/lib/api/admin';
import { getApiStatusCode } from '@/lib/api/client';
import { useOpenDrawer } from '@/lib/navigation/useOpenDrawer';

type KpiCard = {
  key: string;
  label: string;
  hint: string;
  icon: keyof typeof Ionicons.glyphMap;
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
    icon: 'navigate-outline',
    accent: 'brand',
    getValue: (stats) => String(stats.activeTrips),
  },
  {
    key: 'revenue',
    label: 'Ingresos de hoy',
    hint: 'Tarifas cobradas hoy',
    icon: 'cash-outline',
    accent: 'success',
    getValue: (stats) => `L. ${stats.revenueToday.toFixed(2)}`,
  },
  {
    key: 'available',
    label: 'Conductores disponibles',
    hint: 'Conectados en este momento',
    icon: 'car-sport-outline',
    accent: 'brand',
    getValue: (stats) => String(stats.availableDrivers),
  },
  {
    key: 'pendingDrivers',
    label: 'Conductores por aprobar',
    hint: 'Documentos en revisión',
    icon: 'person-add-outline',
    accent: 'brand',
    getValue: (stats) => String(stats.pendingDrivers),
    getBadge: (stats) => stats.pendingDrivers,
  },
  {
    key: 'withdrawals',
    label: 'Retiros pendientes',
    hint: 'Solicitudes por resolver',
    icon: 'wallet-outline',
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
  const openDrawer = useOpenDrawer();

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
      <ScreenHeader title="Dashboard" onMenuPress={openDrawer} />

      <View style={styles.headerRow}>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{today}</Text>
        <Pressable
          style={[styles.refreshButton, { borderColor: colors.tint }, isLoading && styles.disabled]}
          onPress={handleRefresh}
          disabled={isLoading}
        >
          <Ionicons name="refresh" size={13} color={colors.tint} />
          <Text style={[styles.refreshText, { color: colors.tint }]}>Actualizar</Text>
        </Pressable>
      </View>

      {error && (
        <Card style={styles.errorCard}>
          <Ionicons name="alert-circle-outline" size={16} color={colors.textSecondary} />
          <Text style={[styles.errorText, { color: colors.textSecondary }]}>{error}</Text>
        </Card>
      )}

      <View style={styles.kpiGrid}>
        {KPI_CARDS.map((card) => {
          const badge = stats && card.getBadge ? card.getBadge(stats) : 0;
          return (
            <Card key={card.key} style={[styles.kpiCard, card.wide && styles.kpiCardWide]}>
              {badge > 0 && (
                <View style={[styles.badge, { backgroundColor: colors.tint }]}>
                  <Text style={styles.badgeText}>{badge}</Text>
                </View>
              )}
              <View
                style={[
                  styles.kpiIconCircle,
                  styles.transparentBackground,
                  { backgroundColor: colors.background },
                ]}
              >
                <Ionicons
                  name={card.icon}
                  size={16}
                  color={card.accent === 'success' ? colors.success : colors.tint}
                />
              </View>
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
            </Card>
          );
        })}
      </View>

      <Card style={styles.card}>
        <View style={[styles.cardHeader, styles.transparentBackground]}>
          <View style={[styles.cardTitleRow, styles.transparentBackground]}>
            <Ionicons name="stats-chart-outline" size={15} color={colors.tint} />
            <Text style={styles.cardTitle}>Viajes completados</Text>
          </View>
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
      </Card>

      <Card style={styles.card}>
        <View style={[styles.cardTitleRow, styles.transparentBackground]}>
          <Ionicons name="pie-chart-outline" size={15} color={colors.tint} />
          <Text style={styles.cardTitle}>Viajes por estado</Text>
        </View>
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
      </Card>
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
  transparentBackground: {
    backgroundColor: 'transparent',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginTop: -4,
  },
  subtitle: {
    fontSize: 12,
    textTransform: 'capitalize',
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 12,
    padding: 14,
  },
  errorText: {
    flex: 1,
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
  kpiIconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
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
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
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

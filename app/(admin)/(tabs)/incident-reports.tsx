import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet } from 'react-native';

import { IncidentReportDetailModal } from '@/components/IncidentReportDetailModal';
import { Text, View } from '@/components/Themed';
import { Card } from '@/components/ui/Card';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { SegmentedTabs } from '@/components/ui/SegmentedTabs';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import {
  INCIDENT_REPORT_CATEGORY_ICONS,
  INCIDENT_REPORT_CATEGORY_LABELS,
} from '@/constants/IncidentReportLabels';
import {
  getAdminIncidentReports,
  markIncidentReportReviewed,
  type AdminIncidentReportRow,
  type IncidentReportStatus,
} from '@/lib/api/admin';
import { getApiErrorMessage } from '@/lib/api/errors';
import { useOpenDrawer } from '@/lib/navigation/useOpenDrawer';

const PAGE_SIZE = 20;

const STATUS_TABS: { value: IncidentReportStatus; label: string }[] = [
  { value: 'pending', label: 'Pendientes' },
  { value: 'reviewed', label: 'Revisados' },
];

export default function AdminIncidentReportsScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];
  const openDrawer = useOpenDrawer();

  const [status, setStatus] = useState<IncidentReportStatus>('pending');
  const [reports, setReports] = useState<AdminIncidentReportRow[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedReport, setSelectedReport] = useState<AdminIncidentReportRow | null>(null);

  const loadPage = useCallback((forStatus: IncidentReportStatus, pageToLoad: number) => {
    getAdminIncidentReports(forStatus, pageToLoad, PAGE_SIZE)
      .then((result) => {
        setReports((prev) => (pageToLoad === 1 ? result.data : [...prev, ...result.data]));
        setTotal(result.total);
        setError(null);
      })
      .catch((err) => setError(getApiErrorMessage(err)))
      .finally(() => {
        setIsLoading(false);
        setIsLoadingMore(false);
      });
  }, []);

  useEffect(() => {
    setIsLoading(true);
    setPage(1);
    loadPage(status, 1);
  }, [status, loadPage]);

  function handleStatusChange(nextStatus: IncidentReportStatus) {
    if (nextStatus === status) return;
    setIsLoading(true);
    setReports([]);
    setStatus(nextStatus);
  }

  function handleEndReached() {
    if (isLoadingMore || isLoading || reports.length >= total) return;
    const nextPage = page + 1;
    setIsLoadingMore(true);
    setPage(nextPage);
    loadPage(status, nextPage);
  }

  async function handleMarkReviewed(id: string) {
    await markIncidentReportReviewed(id);
    setReports((current) => current.filter((item) => item.id !== id));
    setTotal((current) => current - 1);
    setSelectedReport(null);
  }

  return (
    <View style={styles.container}>
      <ScreenHeader title="Reportes de incidencias" onMenuPress={openDrawer} />
      <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
        Reportes enviados por pasajeros sobre un viaje o conductor.
      </Text>

      <SegmentedTabs
        tabs={STATUS_TABS}
        value={status}
        onChange={handleStatusChange}
        style={styles.tabsRow}
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
      ) : reports.length === 0 ? (
        <View style={styles.centered}>
          <Ionicons name="flag-outline" size={22} color={colors.tint} />
          <Text style={[styles.emptyTitle, { color: colors.text }]}>
            No hay reportes en este estado
          </Text>
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            Los reportes de pasajeros aparecerán aquí.
          </Text>
        </View>
      ) : (
        <FlatList
          data={reports}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          onEndReached={handleEndReached}
          onEndReachedThreshold={0.4}
          ListFooterComponent={
            isLoadingMore ? (
              <View style={styles.footerLoading}>
                <ActivityIndicator color={colors.tint} />
              </View>
            ) : null
          }
          renderItem={({ item }) => (
            <Card style={styles.card} onPress={() => setSelectedReport(item)}>
              <View style={[styles.cardHeader, styles.transparentBackground]}>
                <View style={[styles.categoryIconCircle, { backgroundColor: colors.background }]}>
                  <Ionicons
                    name={INCIDENT_REPORT_CATEGORY_ICONS[item.category]}
                    size={16}
                    color={colors.tint}
                  />
                </View>
                <Text style={styles.categoryText}>
                  {INCIDENT_REPORT_CATEGORY_LABELS[item.category]}
                </Text>
                <Text style={[styles.dateText, { color: colors.textSecondary }]}>
                  {new Date(item.createdAt).toLocaleDateString('es-HN')}
                </Text>
              </View>
              <Text
                style={[styles.descriptionText, { color: colors.textSecondary }]}
                numberOfLines={2}
              >
                {item.description}
              </Text>
              <View style={[styles.cardFooter, styles.transparentBackground]}>
                <Text
                  style={[styles.footerText, { color: colors.textSecondary }]}
                  numberOfLines={1}
                >
                  {item.reporter.name}
                  {item.reportedDriver ? ` → ${item.reportedDriver.name}` : ''}
                </Text>
              </View>
            </Card>
          )}
        />
      )}

      <IncidentReportDetailModal
        report={selectedReport}
        onDismiss={() => setSelectedReport(null)}
        onMarkReviewed={handleMarkReviewed}
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
  subtitle: {
    fontSize: 12,
    marginTop: -4,
    marginBottom: 14,
  },
  tabsRow: {
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
    gap: 8,
  },
  transparentBackground: {
    backgroundColor: 'transparent',
  },
  categoryIconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
  },
  dateText: {
    fontSize: 12,
  },
  descriptionText: {
    fontSize: 13,
    lineHeight: 18,
  },
  cardFooter: {
    marginTop: 4,
  },
  footerText: {
    fontSize: 12,
  },
  footerLoading: {
    paddingVertical: 16,
  },
});

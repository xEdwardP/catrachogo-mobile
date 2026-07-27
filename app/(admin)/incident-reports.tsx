import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet } from 'react-native';

import { IncidentReportDetailModal } from '@/components/IncidentReportDetailModal';
import { Text, View } from '@/components/Themed';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { INCIDENT_REPORT_CATEGORY_LABELS } from '@/constants/IncidentReportLabels';
import {
  getAdminIncidentReports,
  markIncidentReportReviewed,
  type AdminIncidentReportRow,
  type IncidentReportStatus,
} from '@/lib/api/admin';
import { getApiErrorMessage } from '@/lib/api/errors';

const STATUS_TABS: { value: IncidentReportStatus; label: string }[] = [
  { value: 'pending', label: 'Pendientes' },
  { value: 'reviewed', label: 'Revisados' },
];

export default function AdminIncidentReportsScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];

  const [status, setStatus] = useState<IncidentReportStatus>('pending');
  const [reports, setReports] = useState<AdminIncidentReportRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedReport, setSelectedReport] = useState<AdminIncidentReportRow | null>(null);

  const fetchReports = useCallback((forStatus: IncidentReportStatus) => {
    getAdminIncidentReports(forStatus)
      .then((result) => {
        setReports(result);
        setError(null);
      })
      .catch((err) => setError(getApiErrorMessage(err)))
      .finally(() => setIsLoading(false));
  }, []);

  useEffect(() => {
    fetchReports(status);
  }, [status, fetchReports]);

  function handleStatusChange(nextStatus: IncidentReportStatus) {
    if (nextStatus === status) return;
    setIsLoading(true);
    setReports([]);
    setStatus(nextStatus);
  }

  async function handleMarkReviewed(id: string) {
    await markIncidentReportReviewed(id);
    setReports((current) => current.filter((item) => item.id !== id));
    setSelectedReport(null);
  }

  return (
    <View style={styles.container}>
      <Pressable style={styles.backButton} onPress={() => router.back()}>
        <Text style={{ color: colors.textSecondary }}>← Volver</Text>
      </Pressable>

      <Text style={styles.title}>Reportes de incidencias</Text>
      <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
        Reportes enviados por pasajeros sobre un viaje o conductor.
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

      {isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator color={colors.tint} />
        </View>
      ) : error ? (
        <View style={styles.centered}>
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>{error}</Text>
        </View>
      ) : reports.length === 0 ? (
        <View style={styles.centered}>
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
          renderItem={({ item }) => (
            <Pressable
              style={[styles.card, { backgroundColor: colors.surfaceHighlight }]}
              onPress={() => setSelectedReport(item)}
            >
              <View style={[styles.cardHeader, styles.transparentBackground]}>
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
            </Pressable>
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
  backButton: {
    alignSelf: 'flex-start',
    paddingVertical: 4,
    marginBottom: 8,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 12,
    marginTop: 4,
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
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  transparentBackground: {
    backgroundColor: 'transparent',
  },
  categoryText: {
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
});

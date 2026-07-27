import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { ActivityIndicator, Alert, Modal, Pressable, ScrollView, StyleSheet } from 'react-native';

import { Text, View } from '@/components/Themed';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { INCIDENT_REPORT_CATEGORY_LABELS } from '@/constants/IncidentReportLabels';
import { getApiErrorMessage } from '@/lib/api/errors';
import type { AdminIncidentReportRow } from '@/lib/api/admin';

type Props = {
  report: AdminIncidentReportRow | null;
  onDismiss: () => void;
  onMarkReviewed: (id: string) => Promise<void>;
};

export function IncidentReportDetailModal({ report, onDismiss, onMarkReviewed }: Props) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];

  const [isResolving, setIsResolving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleDismiss() {
    if (isResolving) return;
    setError(null);
    onDismiss();
  }

  function confirmMarkReviewed() {
    if (!report) return;
    Alert.alert(
      '¿Marcar como revisado?',
      'El reporte se moverá a la lista de revisados. Esta acción no se puede deshacer.',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Marcar revisado', onPress: resolve },
      ],
    );
  }

  async function resolve() {
    if (!report) return;
    setIsResolving(true);
    setError(null);
    try {
      await onMarkReviewed(report.id);
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setIsResolving(false);
    }
  }

  return (
    <Modal
      visible={report !== null}
      transparent
      animationType="fade"
      onRequestClose={handleDismiss}
    >
      <View style={styles.overlay} lightColor="rgba(0,0,0,0.4)" darkColor="rgba(0,0,0,0.6)">
        <View style={[styles.card, { backgroundColor: colors.background }]}>
          {report && (
            <ScrollView contentContainerStyle={styles.scrollContent}>
              <View style={[styles.headerRow, styles.transparentBackground]}>
                <View style={styles.transparentBackground}>
                  <Text style={styles.title}>
                    {INCIDENT_REPORT_CATEGORY_LABELS[report.category]}
                  </Text>
                  <Text style={[styles.date, { color: colors.textSecondary }]}>
                    {new Date(report.createdAt).toLocaleString('es-HN')}
                  </Text>
                </View>
                <Pressable onPress={handleDismiss} hitSlop={8}>
                  <Ionicons name="close" size={20} color={colors.textSecondary} />
                </Pressable>
              </View>

              <View style={[styles.descriptionBox, { backgroundColor: colors.surfaceHighlight }]}>
                <Text style={[styles.descriptionLabel, { color: colors.textSecondary }]}>
                  DESCRIPCIÓN
                </Text>
                <Text style={styles.descriptionText}>{report.description}</Text>
              </View>

              <View style={[styles.detailsGrid, styles.transparentBackground]}>
                <View style={styles.transparentBackground}>
                  <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>
                    Reportado por
                  </Text>
                  <Text style={styles.detailValue}>{report.reporter.name}</Text>
                </View>
                <View style={styles.transparentBackground}>
                  <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>
                    Conductor reportado
                  </Text>
                  <Text style={styles.detailValue}>{report.reportedDriver?.name ?? '—'}</Text>
                </View>
                <View style={styles.transparentBackground}>
                  <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Viaje</Text>
                  <Text style={styles.detailValue} numberOfLines={2}>
                    {report.trip?.destinationAddress ?? '—'}
                  </Text>
                </View>
              </View>

              {error && <Text style={styles.error}>{error}</Text>}

              {report.status === 'pending' ? (
                <Pressable
                  style={[
                    styles.button,
                    { backgroundColor: colors.success },
                    isResolving && styles.disabled,
                  ]}
                  onPress={confirmMarkReviewed}
                  disabled={isResolving}
                >
                  {isResolving ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.buttonText}>Marcar revisado</Text>
                  )}
                </Pressable>
              ) : (
                <Text style={[styles.resolvedText, { color: colors.textSecondary }]}>
                  Este reporte ya fue revisado.
                </Text>
              )}
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  card: {
    width: '100%',
    maxWidth: 420,
    maxHeight: '85%',
    borderRadius: 16,
  },
  scrollContent: {
    padding: 20,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  transparentBackground: {
    backgroundColor: 'transparent',
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
  },
  date: {
    fontSize: 12,
    marginTop: 2,
  },
  descriptionBox: {
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
  },
  descriptionLabel: {
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 6,
  },
  descriptionText: {
    fontSize: 14,
    lineHeight: 20,
  },
  detailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginBottom: 20,
  },
  detailLabel: {
    fontSize: 11,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 2,
    maxWidth: 160,
  },
  error: {
    color: '#C0392B',
    fontSize: 13,
    marginBottom: 12,
  },
  button: {
    borderRadius: 8,
    paddingVertical: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
  },
  disabled: {
    opacity: 0.6,
  },
  resolvedText: {
    fontSize: 13,
    textAlign: 'center',
  },
});

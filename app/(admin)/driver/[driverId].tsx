import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
} from 'react-native';

import { Text, View } from '@/components/Themed';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { VEHICLE_TYPE_LABELS } from '@/constants/VehicleTypeLabels';
import {
  getAdminDrivers,
  updateDriverVerification,
  type AdminDriverRow,
  type VerificationStatus,
} from '@/lib/api/admin';
import { getApiErrorMessage } from '@/lib/api/errors';

const ALL_STATUSES: VerificationStatus[] = ['pending', 'approved', 'rejected'];

const STATUS_LABELS: Record<VerificationStatus, string> = {
  pending: 'Pendiente de revisión',
  approved: 'Aprobado',
  rejected: 'Rechazado',
};

export default function AdminDriverDetailScreen() {
  const { driverId, status: statusParam } = useLocalSearchParams<{
    driverId: string;
    status?: VerificationStatus;
  }>();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];

  const [driver, setDriver] = useState<AdminDriverRow | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isResolving, setIsResolving] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const loadDriver = useCallback(async () => {
    const statusesToTry = statusParam
      ? [statusParam, ...ALL_STATUSES.filter((value) => value !== statusParam)]
      : ALL_STATUSES;
    try {
      for (const status of statusesToTry) {
        const rows = await getAdminDrivers(status);
        const found = rows.find((row) => row.id === driverId);
        if (found) {
          setDriver(found);
          setError(null);
          return;
        }
      }
      setError('No encontramos a este conductor.');
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }, [driverId, statusParam]);

  useEffect(() => {
    loadDriver();
  }, [loadDriver]);

  function confirmResolve(verificationStatus: 'approved' | 'rejected') {
    const isApproving = verificationStatus === 'approved';
    Alert.alert(
      isApproving ? '¿Aprobar conductor?' : '¿Rechazar conductor?',
      isApproving
        ? 'Podrá conectarse para recibir viajes. Se le enviará una notificación.'
        : 'No podrá conectarse hasta volver a enviar sus documentos. Se le enviará una notificación.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: isApproving ? 'Aprobar' : 'Rechazar',
          style: isApproving ? 'default' : 'destructive',
          onPress: () => resolve(verificationStatus),
        },
      ],
    );
  }

  async function resolve(verificationStatus: 'approved' | 'rejected') {
    if (!driverId) return;
    setIsResolving(true);
    try {
      await updateDriverVerification(driverId, verificationStatus);
      router.back();
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setIsResolving(false);
    }
  }

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={colors.tint} />
      </View>
    );
  }

  if (!driver) {
    return (
      <View style={styles.centered}>
        <Text style={[styles.errorText, { color: colors.textSecondary }]}>
          {error ?? 'No encontramos a este conductor.'}
        </Text>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <Text style={{ color: colors.tint, fontWeight: '600' }}>Volver</Text>
        </Pressable>
      </View>
    );
  }

  const vehicle = driver.vehicles[0];
  const documents = [
    { label: 'Identidad (frente)', url: driver.idFrontUrl },
    { label: 'Identidad (reverso)', url: driver.idBackUrl },
    { label: 'Tarjeta de circulación', url: driver.vehicleRegistrationUrl },
    { label: 'Selfie con identidad', url: driver.selfieWithIdUrl },
  ];
  const details = [
    { label: 'Vehículo', value: VEHICLE_TYPE_LABELS[driver.vehicleType] },
    { label: 'Marca / modelo', value: vehicle ? `${vehicle.brand} ${vehicle.model}` : '—' },
    { label: 'Placa', value: vehicle?.plate ?? '—' },
    { label: 'Licencia', value: driver.licenseNumber },
  ];

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Pressable style={styles.backButton} onPress={() => router.back()}>
        <Text style={{ color: colors.textSecondary }}>← Volver</Text>
      </Pressable>

      <View style={styles.profileRow}>
        {driver.user.profilePhotoUrl ? (
          <Image source={{ uri: driver.user.profilePhotoUrl }} style={styles.avatar} />
        ) : (
          <View
            style={[
              styles.avatar,
              styles.avatarFallback,
              { backgroundColor: colors.surfaceHighlight },
            ]}
          >
            <Text style={[styles.avatarInitial, { color: colors.tint }]}>
              {driver.user.name.charAt(0).toUpperCase()}
            </Text>
          </View>
        )}
        <View style={styles.profileText}>
          <Text style={styles.name}>{driver.user.name}</Text>
          <Text style={[styles.contact, { color: colors.textSecondary }]}>{driver.user.email}</Text>
          {driver.user.phone && (
            <Text style={[styles.contact, { color: colors.textSecondary }]}>
              {driver.user.phone}
            </Text>
          )}
        </View>
      </View>

      <View style={[styles.statusPill, { backgroundColor: colors.surfaceHighlight }]}>
        <Text style={[styles.statusText, { color: colors.textSecondary }]}>
          {STATUS_LABELS[driver.verificationStatus]}
        </Text>
      </View>

      <View style={[styles.card, { backgroundColor: colors.surfaceHighlight }]}>
        {details.map((detail) => (
          <View key={detail.label} style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>
              {detail.label}
            </Text>
            <Text style={styles.detailValue}>{detail.value}</Text>
          </View>
        ))}
      </View>

      <Text style={styles.sectionTitle}>Documentos</Text>
      <Text style={[styles.sectionHint, { color: colors.textSecondary }]}>
        Toca una imagen para verla en grande.
      </Text>
      <View style={styles.documentsGrid}>
        {documents.map((document) => (
          <Pressable
            key={document.label}
            style={styles.documentItem}
            onPress={() => setPreviewUrl(document.url)}
          >
            <Image
              source={{ uri: document.url }}
              style={[styles.documentImage, { borderColor: colors.textSecondary }]}
            />
            <Text style={[styles.documentLabel, { color: colors.textSecondary }]}>
              {document.label}
            </Text>
          </Pressable>
        ))}
      </View>

      {error && <Text style={styles.errorInline}>{error}</Text>}

      {driver.verificationStatus === 'pending' ? (
        <View style={styles.actionsRow}>
          <Pressable
            style={[
              styles.actionButton,
              styles.rejectButton,
              { borderColor: colors.textSecondary },
            ]}
            onPress={() => confirmResolve('rejected')}
            disabled={isResolving}
          >
            <Text>Rechazar</Text>
          </Pressable>
          <Pressable
            style={[
              styles.actionButton,
              { backgroundColor: colors.success },
              isResolving && styles.disabled,
            ]}
            onPress={() => confirmResolve('approved')}
            disabled={isResolving}
          >
            {isResolving ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.approveText}>Aprobar</Text>
            )}
          </Pressable>
        </View>
      ) : (
        <Text style={[styles.resolvedText, { color: colors.textSecondary }]}>
          Este conductor ya fue{' '}
          {driver.verificationStatus === 'approved' ? 'aprobado' : 'rechazado'}.
        </Text>
      )}

      <Modal
        visible={previewUrl !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setPreviewUrl(null)}
      >
        <Pressable style={styles.previewOverlay} onPress={() => setPreviewUrl(null)}>
          {previewUrl && (
            <Image source={{ uri: previewUrl }} style={styles.previewImage} resizeMode="contain" />
          )}
          <Text style={styles.previewHint}>Toca para cerrar</Text>
        </Pressable>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  content: {
    padding: 16,
    paddingTop: 56,
    paddingBottom: 40,
  },
  backButton: {
    alignSelf: 'flex-start',
    paddingVertical: 4,
  },
  errorText: {
    fontSize: 14,
  },
  errorInline: {
    color: '#C0392B',
    fontSize: 13,
    marginTop: 16,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginTop: 12,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
  },
  avatarFallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    fontSize: 24,
    fontWeight: '700',
  },
  profileText: {
    flex: 1,
  },
  name: {
    fontSize: 18,
    fontWeight: '700',
  },
  contact: {
    fontSize: 13,
    marginTop: 2,
  },
  statusPill: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginTop: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  card: {
    borderRadius: 14,
    padding: 16,
    marginTop: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
    backgroundColor: 'transparent',
  },
  detailLabel: {
    fontSize: 13,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginTop: 24,
  },
  sectionHint: {
    fontSize: 12,
    marginTop: 2,
    marginBottom: 12,
  },
  documentsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  documentItem: {
    width: '48%',
    flexGrow: 1,
  },
  documentImage: {
    width: '100%',
    height: 120,
    borderRadius: 10,
    borderWidth: 1,
  },
  documentLabel: {
    fontSize: 11,
    marginTop: 4,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  actionButton: {
    flex: 1,
    borderRadius: 8,
    paddingVertical: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rejectButton: {
    borderWidth: 1,
  },
  approveText: {
    color: '#fff',
    fontWeight: '600',
  },
  disabled: {
    opacity: 0.6,
  },
  resolvedText: {
    fontSize: 13,
    textAlign: 'center',
    marginTop: 24,
  },
  previewOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.92)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    gap: 16,
  },
  previewImage: {
    width: '100%',
    height: '80%',
  },
  previewHint: {
    color: '#fff',
    fontSize: 13,
    opacity: 0.7,
  },
});

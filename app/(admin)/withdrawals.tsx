import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Pressable, StyleSheet } from 'react-native';

import { Text, View } from '@/components/Themed';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import {
  getAdminWithdrawals,
  resolveWithdrawal,
  type AdminWithdrawalRow,
  type WithdrawalStatus,
} from '@/lib/api/admin';
import { getApiErrorMessage } from '@/lib/api/errors';

const STATUS_TABS: { value: WithdrawalStatus; label: string }[] = [
  { value: 'pending', label: 'Pendientes' },
  { value: 'completed', label: 'Completados' },
  { value: 'rejected', label: 'Rechazados' },
];

const STATUS_LABELS: Record<WithdrawalStatus, string> = {
  pending: 'Pendiente',
  completed: 'Completado',
  rejected: 'Rechazado',
};

export default function AdminWithdrawalsScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];

  const [status, setStatus] = useState<WithdrawalStatus>('pending');
  const [withdrawals, setWithdrawals] = useState<AdminWithdrawalRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [resolvingId, setResolvingId] = useState<string | null>(null);

  const fetchWithdrawals = useCallback((forStatus: WithdrawalStatus) => {
    getAdminWithdrawals(forStatus)
      .then((result) => {
        setWithdrawals(result);
        setError(null);
      })
      .catch((err) => setError(getApiErrorMessage(err)))
      .finally(() => setIsLoading(false));
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchWithdrawals(status);
    }, [fetchWithdrawals, status]),
  );

  function handleStatusChange(nextStatus: WithdrawalStatus) {
    if (nextStatus === status) return;
    setIsLoading(true);
    setWithdrawals([]);
    setStatus(nextStatus);
  }

  function confirmResolve(withdrawal: AdminWithdrawalRow, nextStatus: 'completed' | 'rejected') {
    const isCompleting = nextStatus === 'completed';
    Alert.alert(
      isCompleting ? '¿Marcar como completado?' : '¿Rechazar retiro?',
      isCompleting
        ? `Confirma que ya transferiste L. ${withdrawal.amount.toFixed(2)} a ${withdrawal.paypalEmail} por fuera de la app. Esta acción no se puede deshacer.`
        : `El monto de L. ${withdrawal.amount.toFixed(2)} volverá al saldo de ${withdrawal.driver.user.name}.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: isCompleting ? 'Marcar completado' : 'Rechazar',
          style: isCompleting ? 'default' : 'destructive',
          onPress: () => resolve(withdrawal.id, nextStatus),
        },
      ],
    );
  }

  async function resolve(requestId: string, nextStatus: 'completed' | 'rejected') {
    setResolvingId(requestId);
    try {
      await resolveWithdrawal(requestId, nextStatus);
      setWithdrawals((current) => current.filter((item) => item.id !== requestId));
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setResolvingId(null);
    }
  }

  return (
    <View style={styles.container}>
      <Pressable style={styles.backButton} onPress={() => router.back()}>
        <Text style={{ color: colors.textSecondary }}>← Volver</Text>
      </Pressable>

      <Text style={styles.title}>Retiros</Text>
      <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
        Envíos manuales vía PayPal — marca como completado después de transferir por fuera de la
        app.
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

      {error && <Text style={styles.errorInline}>{error}</Text>}

      {isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator color={colors.tint} />
        </View>
      ) : withdrawals.length === 0 ? (
        <View style={styles.centered}>
          <Text style={[styles.emptyTitle, { color: colors.text }]}>
            No hay solicitudes en este estado
          </Text>
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            Las solicitudes de retiro de los conductores aparecerán aquí.
          </Text>
        </View>
      ) : (
        <FlatList
          data={withdrawals}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <View style={[styles.card, { backgroundColor: colors.surfaceHighlight }]}>
              <View style={[styles.cardHeader, styles.transparentBackground]}>
                <Text style={styles.driverName}>{item.driver.user.name}</Text>
                <Text style={styles.amountText}>L. {item.amount.toFixed(2)}</Text>
              </View>
              <Text style={[styles.paypalEmail, { color: colors.textSecondary }]}>
                {item.paypalEmail}
              </Text>
              <View style={[styles.cardFooter, styles.transparentBackground]}>
                <Text style={[styles.dateText, { color: colors.textSecondary }]}>
                  {new Date(item.requestedAt).toLocaleString('es-HN')}
                </Text>
                {status !== 'pending' && (
                  <Text style={[styles.statusText, { color: colors.textSecondary }]}>
                    {STATUS_LABELS[item.status]}
                  </Text>
                )}
              </View>

              {status === 'pending' && (
                <View style={[styles.actionsRow, styles.transparentBackground]}>
                  <Pressable
                    style={[
                      styles.actionButton,
                      styles.rejectButton,
                      { borderColor: colors.textSecondary },
                    ]}
                    onPress={() => confirmResolve(item, 'rejected')}
                    disabled={resolvingId === item.id}
                  >
                    <Text>Rechazar</Text>
                  </Pressable>
                  <Pressable
                    style={[
                      styles.actionButton,
                      { backgroundColor: colors.success },
                      resolvingId === item.id && styles.disabled,
                    ]}
                    onPress={() => confirmResolve(item, 'completed')}
                    disabled={resolvingId === item.id}
                  >
                    {resolvingId === item.id ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <Text style={styles.completeText}>Marcar completado</Text>
                    )}
                  </Pressable>
                </View>
              )}
            </View>
          )}
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
  errorInline: {
    color: '#C0392B',
    fontSize: 13,
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
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  transparentBackground: {
    backgroundColor: 'transparent',
  },
  driverName: {
    fontSize: 15,
    fontWeight: '700',
  },
  amountText: {
    fontSize: 15,
    fontWeight: '700',
  },
  paypalEmail: {
    fontSize: 13,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  dateText: {
    fontSize: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 10,
  },
  actionButton: {
    flex: 1,
    borderRadius: 8,
    paddingVertical: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rejectButton: {
    borderWidth: 1,
  },
  completeText: {
    color: '#fff',
    fontWeight: '600',
  },
  disabled: {
    opacity: 0.6,
  },
});

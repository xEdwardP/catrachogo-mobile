import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, StyleSheet } from 'react-native';

import { Text, View } from '@/components/Themed';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { SegmentedTabs } from '@/components/ui/SegmentedTabs';
import { TextField } from '@/components/ui/TextField';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import {
  getAdminWithdrawals,
  resolveWithdrawal,
  type AdminWithdrawalRow,
  type WithdrawalStatus,
} from '@/lib/api/admin';
import { getApiErrorMessage } from '@/lib/api/errors';
import { useDebouncedValue } from '@/lib/hooks/useDebouncedValue';
import { useOpenDrawer } from '@/lib/navigation/useOpenDrawer';

const PAGE_SIZE = 20;

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
  const openDrawer = useOpenDrawer();

  const [status, setStatus] = useState<WithdrawalStatus>('pending');
  const [withdrawals, setWithdrawals] = useState<AdminWithdrawalRow[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resolvingId, setResolvingId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search, 400);

  const loadPage = useCallback(
    (forStatus: WithdrawalStatus, pageToLoad: number, searchQuery: string) => {
      getAdminWithdrawals(forStatus, pageToLoad, PAGE_SIZE, searchQuery)
        .then((result) => {
          setWithdrawals((prev) => (pageToLoad === 1 ? result.data : [...prev, ...result.data]));
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

  function handleStatusChange(nextStatus: WithdrawalStatus) {
    if (nextStatus === status) return;
    setIsLoading(true);
    setSearch('');
    setWithdrawals([]);
    setStatus(nextStatus);
  }

  function handleEndReached() {
    if (isLoadingMore || isLoading || withdrawals.length >= total) return;
    const nextPage = page + 1;
    setIsLoadingMore(true);
    setPage(nextPage);
    loadPage(status, nextPage, debouncedSearch);
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
      setTotal((current) => current - 1);
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setResolvingId(null);
    }
  }

  return (
    <View style={styles.container}>
      <ScreenHeader title="Retiros" onMenuPress={openDrawer} />
      <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
        Envíos manuales vía PayPal — marca como completado después de transferir por fuera de la
        app.
      </Text>

      <SegmentedTabs
        tabs={STATUS_TABS}
        value={status}
        onChange={handleStatusChange}
        style={styles.tabsRow}
      />

      <TextField
        placeholder="Buscar por nombre de conductor o correo de PayPal"
        autoCapitalize="none"
        value={search}
        onChangeText={setSearch}
        style={styles.search}
      />

      {error && (
        <View style={[styles.noticeRow, styles.transparentBackground]}>
          <Ionicons name="alert-circle" size={14} color="#C0392B" />
          <Text style={styles.errorInline}>{error}</Text>
        </View>
      )}

      {isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator color={colors.tint} />
        </View>
      ) : withdrawals.length === 0 ? (
        <View style={styles.centered}>
          <Ionicons name="wallet-outline" size={22} color={colors.tint} />
          <Text style={[styles.emptyTitle, { color: colors.text }]}>
            {debouncedSearch.trim() ? 'Sin resultados' : 'No hay solicitudes en este estado'}
          </Text>
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            {debouncedSearch.trim()
              ? 'Ninguna solicitud coincide con tu búsqueda.'
              : 'Las solicitudes de retiro de los conductores aparecerán aquí.'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={withdrawals}
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
            <Card style={styles.card}>
              <View style={[styles.cardHeader, styles.transparentBackground]}>
                <View style={[styles.rowIcon, { backgroundColor: colors.background }]}>
                  <Ionicons name="cash-outline" size={17} color={colors.tint} />
                </View>
                <View style={[styles.cardMain, styles.transparentBackground]}>
                  <Text style={styles.driverName}>{item.driver.user.name}</Text>
                  <Text style={[styles.paypalEmail, { color: colors.textSecondary }]}>
                    {item.paypalEmail}
                  </Text>
                </View>
                <Text style={styles.amountText}>L. {item.amount.toFixed(2)}</Text>
              </View>
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
                  <Button
                    variant="secondary"
                    onPress={() => confirmResolve(item, 'rejected')}
                    disabled={resolvingId === item.id}
                    style={styles.actionButton}
                  >
                    <View style={[styles.buttonContent, styles.transparentBackground]}>
                      <Ionicons name="close-circle-outline" size={16} color={colors.text} />
                      <Text style={{ color: colors.text, fontWeight: '600' }}>Rechazar</Text>
                    </View>
                  </Button>
                  <Button
                    onPress={() => confirmResolve(item, 'completed')}
                    loading={resolvingId === item.id}
                    disabled={resolvingId === item.id}
                    style={[styles.actionButton, { backgroundColor: colors.success }]}
                  >
                    <View style={[styles.buttonContent, styles.transparentBackground]}>
                      <Ionicons name="checkmark-circle-outline" size={16} color="#fff" />
                      <Text style={styles.completeText}>Marcar completado</Text>
                    </View>
                  </Button>
                </View>
              )}
            </Card>
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
  noticeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  errorInline: {
    color: '#C0392B',
    fontSize: 13,
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
  },
  transparentBackground: {
    backgroundColor: 'transparent',
  },
  rowIcon: {
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
  amountText: {
    fontSize: 15,
    fontWeight: '700',
  },
  paypalEmail: {
    fontSize: 13,
    marginTop: 2,
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
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  completeText: {
    color: '#fff',
    fontWeight: '600',
  },
  footerLoading: {
    paddingVertical: 16,
  },
});

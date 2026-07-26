import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet } from 'react-native';

import { Text, View } from '@/components/Themed';
import { TopupModal } from '@/components/TopupModal';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { WALLET_TRANSACTION_LABELS } from '@/constants/WalletTransactionLabels';
import { getApiErrorMessage } from '@/lib/api/errors';
import { getWalletBalance, getWalletTransactions, type WalletTransaction } from '@/lib/api/wallet';

const PAGE_SIZE = 20;

type Props = {
  emptyStateText: string;
  showTopupButton?: boolean;
};

export function WalletScreen({ emptyStateText, showTopupButton }: Props) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];

  const [balance, setBalance] = useState<number | null>(null);
  const [isLoadingBalance, setIsLoadingBalance] = useState(true);
  const [balanceError, setBalanceError] = useState<string | null>(null);

  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isTopupVisible, setIsTopupVisible] = useState(false);

  const loadBalance = useCallback(() => {
    getWalletBalance()
      .then((result) => setBalance(result.balance))
      .catch((err) => setBalanceError(getApiErrorMessage(err)))
      .finally(() => setIsLoadingBalance(false));
  }, []);

  useEffect(() => {
    loadBalance();
  }, [loadBalance]);

  const loadPage = useCallback((pageToLoad: number) => {
    getWalletTransactions(pageToLoad, PAGE_SIZE)
      .then((result) => {
        setTransactions((prev) => (pageToLoad === 1 ? result.data : [...prev, ...result.data]));
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
    loadPage(1);
  }, [loadPage]);

  function handleEndReached() {
    if (isLoadingMore || isLoading || transactions.length >= total) return;
    const nextPage = page + 1;
    setIsLoadingMore(true);
    setPage(nextPage);
    loadPage(nextPage);
  }

  function handleTopupSuccess(newBalance: number) {
    setBalance(newBalance);
    setIsTopupVisible(false);
    setIsLoading(true);
    setPage(1);
    loadPage(1);
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Wallet</Text>

      <View style={[styles.balanceCard, { backgroundColor: colors.success }]}>
        <Text style={styles.balanceLabel}>Saldo disponible</Text>
        <Text style={styles.balanceValue}>
          {isLoadingBalance ? '...' : balanceError ? '—' : `L. ${(balance ?? 0).toFixed(2)}`}
        </Text>
      </View>
      {balanceError && (
        <Text style={[styles.balanceErrorText, { color: colors.textSecondary }]}>
          {balanceError}
        </Text>
      )}

      {showTopupButton && (
        <Pressable
          style={[styles.topupButton, { borderColor: colors.tint }]}
          onPress={() => setIsTopupVisible(true)}
        >
          <Text style={{ color: colors.tint, fontWeight: '600' }}>Recargar con PayPal</Text>
        </Pressable>
      )}

      <TopupModal
        visible={isTopupVisible}
        onDismiss={() => setIsTopupVisible(false)}
        onSuccess={handleTopupSuccess}
      />

      <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
        Historial de movimientos
      </Text>

      {isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator color={colors.tint} />
        </View>
      ) : error ? (
        <View style={styles.centered}>
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>{error}</Text>
        </View>
      ) : transactions.length === 0 ? (
        <View style={styles.centered}>
          <Text style={[styles.emptyTitle, { color: colors.text }]}>
            Todavía no tienes movimientos
          </Text>
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>{emptyStateText}</Text>
        </View>
      ) : (
        <FlatList
          data={transactions}
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
          renderItem={({ item }) => {
            const isCredit = item.amount >= 0;
            const amountColor = isCredit ? colors.success : '#DC2626';
            return (
              <View style={[styles.row, { backgroundColor: colors.surfaceHighlight }]}>
                <View style={styles.transparentBackground}>
                  <Text style={styles.rowLabel}>
                    {WALLET_TRANSACTION_LABELS[item.type] ?? item.type}
                  </Text>
                  <Text style={[styles.rowDate, { color: colors.textSecondary }]}>
                    {new Date(item.createdAt).toLocaleDateString('es-HN')}
                  </Text>
                </View>
                <Text style={[styles.rowAmount, { color: amountColor }]}>
                  {isCredit ? '+' : ''}
                  L. {item.amount.toFixed(2)}
                </Text>
              </View>
            );
          }}
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
  title: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 16,
  },
  balanceCard: {
    borderRadius: 16,
    padding: 20,
    gap: 4,
  },
  balanceLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
    opacity: 0.85,
    textTransform: 'uppercase',
  },
  balanceValue: {
    fontSize: 30,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  balanceErrorText: {
    fontSize: 12,
    marginTop: 6,
  },
  topupButton: {
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 12,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 20,
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
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 12,
    padding: 14,
  },
  transparentBackground: {
    backgroundColor: 'transparent',
  },
  rowLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  rowDate: {
    fontSize: 12,
    marginTop: 2,
  },
  rowAmount: {
    fontSize: 14,
    fontWeight: '700',
  },
  footerLoading: {
    paddingVertical: 16,
  },
});

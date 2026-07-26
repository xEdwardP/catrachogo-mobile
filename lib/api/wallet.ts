import { apiClient } from '@/lib/api/client';
import type { PaginatedResult } from '@/lib/api/trips';

export type WalletTransactionType =
  | 'paypal_topup'
  | 'trip_charge'
  | 'trip_payout'
  | 'withdrawal_adjustment'
  | 'platform_commission'
  | 'cancellation_fee'
  | 'cancellation_payout';

export type WalletTransaction = {
  id: string;
  walletId: string;
  type: WalletTransactionType;
  amount: number;
  tripReferenceId: string | null;
  paypalReferenceId: string | null;
  createdAt: string;
};

export async function getWalletBalance(): Promise<{ balance: number }> {
  const { data } = await apiClient.get<{ balance: number }>('/wallet');
  return data;
}

export async function getWalletTransactions(
  page: number,
  limit: number,
): Promise<PaginatedResult<WalletTransaction>> {
  const { data } = await apiClient.get<PaginatedResult<WalletTransaction>>('/wallet/transactions', {
    params: { page, limit },
  });
  return data;
}

export type TopupOrder = {
  orderId: string;
  approveUrl: string | null;
};

export async function createTopupOrder(
  amount: number,
  returnUrl: string,
  cancelUrl: string,
): Promise<TopupOrder> {
  const { data } = await apiClient.post<TopupOrder>('/wallet/topup/create-order', {
    amount,
    returnUrl,
    cancelUrl,
  });
  return data;
}

export async function confirmTopup(orderId: string): Promise<{ balance: number }> {
  const { data } = await apiClient.post<{ balance: number }>('/wallet/topup/confirm', { orderId });
  return data;
}

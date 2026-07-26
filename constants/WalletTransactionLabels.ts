import type { WalletTransactionType } from '@/lib/api/wallet';

export const WALLET_TRANSACTION_LABELS: Record<WalletTransactionType, string> = {
  paypal_topup: 'Recarga PayPal',
  trip_charge: 'Pago de viaje',
  trip_payout: 'Cobro de viaje',
  withdrawal_adjustment: 'Retiro',
  platform_commission: 'Comisión de plataforma',
  cancellation_fee: 'Multa por cancelación',
  cancellation_payout: 'Compensación por cancelación',
};

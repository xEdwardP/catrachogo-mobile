import type { Ionicons } from '@expo/vector-icons';

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

export const WALLET_TRANSACTION_ICONS: Record<
  WalletTransactionType,
  keyof typeof Ionicons.glyphMap
> = {
  paypal_topup: 'add-circle-outline',
  trip_charge: 'car-outline',
  trip_payout: 'cash-outline',
  withdrawal_adjustment: 'arrow-down-circle-outline',
  platform_commission: 'briefcase-outline',
  cancellation_fee: 'close-circle-outline',
  cancellation_payout: 'checkmark-circle-outline',
};

import type { CancellationReason } from '@/lib/api/trips';

export const PASSENGER_CANCELLATION_REASONS: CancellationReason[] = [
  'changed_plans',
  'found_other_ride',
  'took_too_long',
  'other',
];

export const CANCELLATION_REASON_LABELS: Record<CancellationReason, string> = {
  changed_plans: 'Cambié de planes',
  found_other_ride: 'Encontré otro medio',
  took_too_long: 'Tardó mucho',
  other: 'Otro',
};

export const CANCELLATION_FEE_AMOUNT = 25;

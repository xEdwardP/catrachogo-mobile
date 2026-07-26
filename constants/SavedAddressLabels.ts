import type { SavedAddress, SavedAddressLabel } from '@/lib/api/savedAddresses';

export const SAVED_ADDRESS_LABELS: Record<SavedAddressLabel, string> = {
  home: 'Casa',
  work: 'Trabajo',
  other: 'Otro',
};

export const SAVED_ADDRESS_LABEL_OPTIONS: SavedAddressLabel[] = ['home', 'work', 'other'];

export function savedAddressDisplayLabel(address: SavedAddress): string {
  if (address.label === 'other' && address.customLabel) {
    return address.customLabel;
  }
  return SAVED_ADDRESS_LABELS[address.label];
}

import { apiClient } from '@/lib/api/client';

export type SavedAddressLabel = 'home' | 'work' | 'other';

export type SavedAddress = {
  id: string;
  label: SavedAddressLabel;
  customLabel: string | null;
  address: string;
  lat: number;
  lng: number;
};

export type CreateSavedAddressPayload = {
  label: SavedAddressLabel;
  customLabel?: string;
  address: string;
  lat: number;
  lng: number;
};

export async function getSavedAddresses(): Promise<SavedAddress[]> {
  const { data } = await apiClient.get<SavedAddress[]>('/saved-addresses');
  return data;
}

export async function createSavedAddress(
  payload: CreateSavedAddressPayload,
): Promise<SavedAddress> {
  const { data } = await apiClient.post<SavedAddress>('/saved-addresses', payload);
  return data;
}

export async function deleteSavedAddress(id: string): Promise<void> {
  await apiClient.delete(`/saved-addresses/${id}`);
}

import { apiClient } from '@/lib/api/client';

export type CreateRatingInput = {
  tripId: string;
  ratedId: string;
  score: number;
  comment?: string;
};

export async function createRating(input: CreateRatingInput): Promise<void> {
  await apiClient.post('/ratings', input);
}

import { router } from 'expo-router';

import { TripHistoryList } from '@/components/TripHistoryList';
import type { Trip } from '@/lib/api/trips';

function isTrackable(trip: Trip) {
  return trip.status === 'accepted' || trip.status === 'in_progress';
}

export default function DriverHistoryScreen() {
  function handlePressTrip(trip: Trip) {
    if (!isTrackable(trip)) return;
    router.push({
      pathname: '/(driver)/trip/[tripId]',
      params: { tripId: trip.id },
    });
  }

  return (
    <TripHistoryList title="Historial" isTrackable={isTrackable} onPressTrip={handlePressTrip} />
  );
}

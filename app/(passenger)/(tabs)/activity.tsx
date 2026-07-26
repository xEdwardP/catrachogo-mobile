import { router } from 'expo-router';

import { TripHistoryList } from '@/components/TripHistoryList';
import type { Trip } from '@/lib/api/trips';

function isTrackable(trip: Trip) {
  return trip.status === 'pending' || trip.status === 'accepted' || trip.status === 'in_progress';
}

export default function PassengerActivityScreen() {
  function handlePressTrip(trip: Trip) {
    if (!isTrackable(trip)) return;
    router.push({
      pathname: '/(passenger)/trip/[tripId]',
      params: { tripId: trip.id, destinationAddress: trip.destinationAddress ?? '' },
    });
  }

  return (
    <TripHistoryList title="Actividad" isTrackable={isTrackable} onPressTrip={handlePressTrip} />
  );
}

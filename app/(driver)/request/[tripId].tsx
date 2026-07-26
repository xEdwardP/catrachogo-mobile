import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet } from 'react-native';

import { Text, View } from '@/components/Themed';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { getApiErrorMessage } from '@/lib/api/errors';
import { acceptTrip, rejectTrip } from '@/lib/api/trips';

const RESPONSE_WINDOW_SECONDS = 20;
const URGENT_THRESHOLD_SECONDS = 5;

export default function IncomingRequestScreen() {
  const { tripId, passengerName, originAddress, distanceKm, fare } = useLocalSearchParams<{
    tripId: string;
    passengerName?: string;
    originAddress?: string;
    distanceKm?: string;
    fare?: string;
  }>();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];

  const [secondsLeft, setSecondsLeft] = useState(RESPONSE_WINDOW_SECONDS);
  const [isResponding, setIsResponding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const id = setInterval(() => {
      setSecondsLeft((current) => Math.max(0, current - 1));
    }, 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (secondsLeft === 0 && tripId) {
      rejectTrip(tripId).catch(() => {});
      router.replace('/(driver)/(tabs)');
    }
  }, [secondsLeft, tripId]);

  if (!tripId) return null;

  async function handleAccept() {
    setIsResponding(true);
    try {
      await acceptTrip(tripId);
      router.replace('/(driver)/(tabs)');
    } catch (err) {
      setError(getApiErrorMessage(err));
      setIsResponding(false);
      setTimeout(() => router.replace('/(driver)/(tabs)'), 1500);
    }
  }

  async function handleReject() {
    setIsResponding(true);
    await rejectTrip(tripId).catch(() => {});
    router.replace('/(driver)/(tabs)');
  }

  const isUrgent = secondsLeft <= URGENT_THRESHOLD_SECONDS;
  const distance = distanceKm ? Number(distanceKm) : null;
  const fareAmount = fare ? Number(fare) : null;

  return (
    <View style={styles.container}>
      <View style={[styles.card, { backgroundColor: colors.background }]}>
        <View style={styles.progressTrack}>
          <View
            style={[
              styles.progressFill,
              {
                width: `${(secondsLeft / RESPONSE_WINDOW_SECONDS) * 100}%`,
                backgroundColor: isUrgent ? '#DC2626' : colors.tint,
              },
            ]}
          />
        </View>

        <View style={styles.headerRow}>
          <View style={[styles.badge, { backgroundColor: colors.tint }]}>
            <Text style={styles.badgeText}>NUEVA SOLICITUD</Text>
          </View>
          <Text
            style={[styles.secondsText, { color: isUrgent ? '#DC2626' : colors.textSecondary }]}
          >
            {secondsLeft}s
          </Text>
        </View>

        <View style={styles.passengerRow}>
          <View style={[styles.avatar, { backgroundColor: colors.surfaceHighlight }]}>
            <Text style={[styles.avatarText, { color: colors.tint }]}>
              {passengerName?.charAt(0).toUpperCase() ?? '?'}
            </Text>
          </View>
          <View>
            <Text style={styles.passengerName}>{passengerName ?? 'Pasajero'}</Text>
            <Text style={[styles.distanceText, { color: colors.textSecondary }]}>
              {distance !== null ? `${distance.toFixed(1)} km de distancia` : ''}
            </Text>
          </View>
        </View>

        <View style={[styles.infoRow, { backgroundColor: colors.surfaceHighlight }]}>
          <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>RECOGER EN</Text>
          <Text style={styles.infoValue}>{originAddress ?? '—'}</Text>
        </View>

        <View style={[styles.infoRow, { backgroundColor: colors.surfaceHighlight }]}>
          <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>TARIFA</Text>
          <Text style={styles.infoValue}>
            {fareAmount !== null && distance !== null
              ? `L. ${fareAmount.toFixed(2)} · ${distance.toFixed(1)} km`
              : '—'}
          </Text>
        </View>

        {error && <Text style={[styles.errorText, { color: colors.textSecondary }]}>{error}</Text>}

        <View style={styles.buttonRow}>
          <Pressable
            style={[styles.button, styles.rejectButton, { borderColor: colors.textSecondary }]}
            onPress={handleReject}
            disabled={isResponding}
          >
            <Text>Rechazar</Text>
          </Pressable>
          <Pressable
            style={[styles.button, { backgroundColor: colors.success }]}
            onPress={handleAccept}
            disabled={isResponding}
          >
            <Text style={styles.acceptButtonText}>Aceptar</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  card: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 16,
    padding: 20,
    gap: 14,
  },
  progressTrack: {
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(128,128,128,0.2)',
  },
  progressFill: {
    height: 4,
    borderRadius: 2,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  badge: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  badgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
  secondsText: {
    fontSize: 14,
    fontWeight: '700',
  },
  passengerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '700',
  },
  passengerName: {
    fontSize: 15,
    fontWeight: '700',
  },
  distanceText: {
    fontSize: 12,
    marginTop: 2,
  },
  infoRow: {
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  infoLabel: {
    fontSize: 11,
    fontWeight: '700',
  },
  infoValue: {
    fontSize: 14,
    marginTop: 2,
  },
  errorText: {
    fontSize: 12,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    flex: 1,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rejectButton: {
    borderWidth: 1,
  },
  acceptButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
});

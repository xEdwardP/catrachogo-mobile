import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet } from 'react-native';

import { Text, View } from '@/components/Themed';
import { Button } from '@/components/ui/Button';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { getApiErrorMessage } from '@/lib/api/errors';
import { acceptTrip, rejectTrip } from '@/lib/api/trips';

const RESPONSE_WINDOW_SECONDS = 20;
const URGENT_THRESHOLD_SECONDS = 5;

const CARD_SHADOW = {
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.12,
  shadowRadius: 10,
  elevation: 4,
};

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
      router.replace({
        pathname: '/(driver)/trip/[tripId]',
        params: { tripId, passengerName: passengerName ?? '' },
      });
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
      <View style={[styles.card, CARD_SHADOW, { backgroundColor: colors.background }]}>
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
            <Ionicons name="flash" size={12} color="#fff" />
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
          <View style={[styles.infoLabelRow, styles.transparentBackground]}>
            <Ionicons name="location-outline" size={12} color={colors.textSecondary} />
            <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>RECOGER EN</Text>
          </View>
          <Text style={styles.infoValue}>{originAddress ?? '—'}</Text>
        </View>

        <View style={[styles.infoRow, { backgroundColor: colors.surfaceHighlight }]}>
          <View style={[styles.infoLabelRow, styles.transparentBackground]}>
            <Ionicons name="cash-outline" size={12} color={colors.textSecondary} />
            <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>TARIFA</Text>
          </View>
          <Text style={styles.infoValue}>
            {fareAmount !== null && distance !== null
              ? `L. ${fareAmount.toFixed(2)} · ${distance.toFixed(1)} km`
              : '—'}
          </Text>
        </View>

        {error && (
          <View style={[styles.noticeRow, styles.transparentBackground]}>
            <Ionicons name="alert-circle" size={14} color="#C0392B" />
            <Text style={[styles.errorText, { color: '#C0392B' }]}>{error}</Text>
          </View>
        )}

        <View style={styles.buttonRow}>
          <Button
            variant="secondary"
            onPress={handleReject}
            disabled={isResponding}
            style={styles.button}
          >
            <View style={[styles.buttonContent, styles.transparentBackground]}>
              <Ionicons name="close-circle-outline" size={16} color={colors.text} />
              <Text style={{ color: colors.text, fontWeight: '600' }}>Rechazar</Text>
            </View>
          </Button>
          <Button
            onPress={handleAccept}
            disabled={isResponding}
            style={[styles.button, { backgroundColor: colors.success }]}
          >
            <View style={[styles.buttonContent, styles.transparentBackground]}>
              <Ionicons name="checkmark-circle-outline" size={16} color="#fff" />
              <Text style={styles.acceptButtonText}>Aceptar</Text>
            </View>
          </Button>
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
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
  infoLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  transparentBackground: {
    backgroundColor: 'transparent',
  },
  infoLabel: {
    fontSize: 11,
    fontWeight: '700',
  },
  infoValue: {
    fontSize: 14,
    marginTop: 2,
  },
  noticeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
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
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  acceptButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
});

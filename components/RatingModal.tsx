import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, StyleSheet } from 'react-native';

import { Text, View } from '@/components/Themed';
import { Button } from '@/components/ui/Button';
import { ModalCard } from '@/components/ui/ModalCard';
import { TextField } from '@/components/ui/TextField';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { Typography } from '@/constants/Typography';
import { createRating } from '@/lib/api/ratings';
import { useToast } from '@/lib/toast/ToastContext';

type Props = {
  visible: boolean;
  tripId: string;
  ratedId: string;
  ratedName?: string;
  onDone: () => void;
};

export function RatingModal({ visible, tripId, ratedId, ratedName, onDone }: Props) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];
  const { showToast } = useToast();
  const [score, setScore] = useState(0);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit() {
    if (score === 0) return;
    setIsSubmitting(true);
    try {
      await createRating({ tripId, ratedId, score, comment: comment.trim() || undefined });
      showToast({ type: 'success', title: '¡Gracias!', message: 'Tu calificación se envió correctamente.' });
      onDone();
    } catch {
      showToast({
        type: 'error',
        title: 'No se pudo enviar tu calificación',
        message: 'Intenta de nuevo.',
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <ModalCard visible={visible} onDismiss={onDone}>
      <Text style={[Typography.h3, styles.title]}>¿Cómo estuvo tu viaje?</Text>
      <Text style={[Typography.subtitle, styles.subtitle, { color: colors.textSecondary }]}>
        Califica a {ratedName ?? 'tu conductor'}
      </Text>

      <View style={styles.starsRow}>
        {[1, 2, 3, 4, 5].map((value) => (
          <Pressable key={value} onPress={() => setScore(value)} hitSlop={6}>
            <Ionicons
              name={value <= score ? 'star' : 'star-outline'}
              size={34}
              color={value <= score ? colors.tint : colors.textSecondary}
            />
          </Pressable>
        ))}
      </View>

      <TextField
        style={styles.commentInput}
        placeholder="Comentario (opcional)"
        value={comment}
        onChangeText={setComment}
        multiline
        numberOfLines={3}
      />

      <Button
        title="Enviar calificación"
        onPress={handleSubmit}
        loading={isSubmitting}
        disabled={score === 0}
        style={styles.submitButton}
      />

      <Pressable style={styles.skipButton} onPress={onDone} disabled={isSubmitting}>
        <Text style={{ color: colors.textSecondary }}>Omitir</Text>
      </Pressable>
    </ModalCard>
  );
}

const styles = StyleSheet.create({
  title: {
    marginBottom: 4,
  },
  subtitle: {
    marginBottom: 16,
  },
  starsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 16,
  },
  commentInput: {
    minHeight: 72,
    textAlignVertical: 'top',
    marginBottom: 16,
  },
  submitButton: {
    paddingVertical: 12,
  },
  skipButton: {
    marginTop: 10,
    alignItems: 'center',
  },
});

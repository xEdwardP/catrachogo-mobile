import { useState } from 'react';
import { ActivityIndicator, Modal, Pressable, StyleSheet, TextInput } from 'react-native';

import { Text, View } from '@/components/Themed';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { createRating } from '@/lib/api/ratings';

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
  const [score, setScore] = useState(0);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit() {
    if (score === 0) return;
    setIsSubmitting(true);
    try {
      await createRating({ tripId, ratedId, score, comment: comment.trim() || undefined });
      onDone();
    } catch {
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onDone}>
      <View style={styles.overlay} lightColor="rgba(0,0,0,0.4)" darkColor="rgba(0,0,0,0.6)">
        <View style={[styles.card, { backgroundColor: colors.background }]}>
          <Text style={styles.title}>¿Cómo estuvo tu viaje?</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Califica a {ratedName ?? 'tu conductor'}
          </Text>

          <View style={styles.starsRow}>
            {[1, 2, 3, 4, 5].map((value) => (
              <Pressable key={value} onPress={() => setScore(value)} hitSlop={6}>
                <Text
                  style={[
                    styles.star,
                    { color: value <= score ? colors.tint : colors.textSecondary },
                  ]}
                >
                  ★
                </Text>
              </Pressable>
            ))}
          </View>

          <TextInput
            style={[styles.commentInput, { borderColor: colors.textSecondary, color: colors.text }]}
            placeholder="Comentario (opcional)"
            placeholderTextColor={colors.textSecondary}
            value={comment}
            onChangeText={setComment}
            multiline
            numberOfLines={3}
          />

          <Pressable
            style={[
              styles.submitButton,
              { backgroundColor: colors.tint },
              (score === 0 || isSubmitting) && styles.disabled,
            ]}
            onPress={handleSubmit}
            disabled={score === 0 || isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.submitButtonText}>Enviar calificación</Text>
            )}
          </Pressable>

          <Pressable style={styles.skipButton} onPress={onDone} disabled={isSubmitting}>
            <Text style={{ color: colors.textSecondary }}>Omitir</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  card: {
    width: '100%',
    maxWidth: 380,
    borderRadius: 16,
    padding: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    marginBottom: 16,
  },
  starsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 16,
  },
  star: {
    fontSize: 34,
  },
  commentInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    minHeight: 72,
    textAlignVertical: 'top',
    marginBottom: 16,
  },
  submitButton: {
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  submitButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  disabled: {
    opacity: 0.6,
  },
  skipButton: {
    marginTop: 10,
    alignItems: 'center',
  },
});

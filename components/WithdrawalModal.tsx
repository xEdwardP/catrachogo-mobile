import { useState } from 'react';
import { ActivityIndicator, Modal, Pressable, StyleSheet, TextInput } from 'react-native';

import { Text, View } from '@/components/Themed';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { getApiStatusCode } from '@/lib/api/client';
import { requestWithdrawal } from '@/lib/api/wallet';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type Props = {
  visible: boolean;
  balance: number | null;
  onDismiss: () => void;
  onSuccess: () => void;
};

export function WithdrawalModal({ visible, balance, onDismiss, onSuccess }: Props) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];

  const [paypalEmail, setPaypalEmail] = useState('');
  const [amount, setAmount] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleDismiss() {
    if (isSubmitting) return;
    setError(null);
    onDismiss();
  }

  async function handleSubmit() {
    const trimmedEmail = paypalEmail.trim();
    const parsedAmount = Number(amount);
    if (!trimmedEmail || !parsedAmount || parsedAmount <= 0) {
      setError('Completa tu correo de PayPal y un monto válido.');
      return;
    }
    if (!EMAIL_PATTERN.test(trimmedEmail)) {
      setError('Ingresa un correo de PayPal válido.');
      return;
    }

    setError(null);
    setIsSubmitting(true);
    try {
      await requestWithdrawal(trimmedEmail, parsedAmount);
      setPaypalEmail('');
      setAmount('');
      onSuccess();
    } catch (err) {
      setError(
        getApiStatusCode(err) === 400
          ? 'Saldo insuficiente para este retiro.'
          : 'No se pudo solicitar el retiro. Intenta de nuevo.',
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleDismiss}>
      <View style={styles.overlay} lightColor="rgba(0,0,0,0.4)" darkColor="rgba(0,0,0,0.6)">
        <View style={[styles.card, { backgroundColor: colors.background }]}>
          <Text style={styles.title}>Solicitar retiro</Text>
          <Text style={[styles.description, { color: colors.textSecondary }]}>
            El monto se descuenta de tu wallet al enviar la solicitud y un administrador la revisa
            antes de transferirlo. Disponible: L. {(balance ?? 0).toFixed(2)}
          </Text>

          <TextInput
            style={[styles.input, { borderColor: colors.textSecondary, color: colors.text }]}
            placeholder="Correo de PayPal"
            placeholderTextColor={colors.textSecondary}
            autoCapitalize="none"
            keyboardType="email-address"
            value={paypalEmail}
            onChangeText={setPaypalEmail}
            editable={!isSubmitting}
          />
          <TextInput
            style={[styles.input, { borderColor: colors.textSecondary, color: colors.text }]}
            placeholder="Monto (L.)"
            placeholderTextColor={colors.textSecondary}
            keyboardType="decimal-pad"
            value={amount}
            onChangeText={setAmount}
            editable={!isSubmitting}
          />

          {error && <Text style={styles.error}>{error}</Text>}

          <View style={styles.buttonRow}>
            <Pressable
              style={[styles.button, styles.secondaryButton, { borderColor: colors.textSecondary }]}
              onPress={handleDismiss}
              disabled={isSubmitting}
            >
              <Text>Cancelar</Text>
            </Pressable>
            <Pressable
              style={[
                styles.button,
                { backgroundColor: colors.tint },
                isSubmitting && styles.disabled,
              ]}
              onPress={handleSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.confirmButtonText}>Enviar</Text>
              )}
            </Pressable>
          </View>
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
    marginBottom: 6,
  },
  description: {
    fontSize: 13,
    marginBottom: 16,
    lineHeight: 18,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    marginBottom: 10,
  },
  error: {
    color: '#C0392B',
    fontSize: 13,
    marginBottom: 8,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  button: {
    flex: 1,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButton: {
    borderWidth: 1,
  },
  confirmButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  disabled: {
    opacity: 0.6,
  },
});

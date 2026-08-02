import * as Linking from 'expo-linking';
import { useState } from 'react';
import { ActivityIndicator, Modal, Pressable, StyleSheet, TextInput } from 'react-native';
import * as WebBrowser from 'expo-web-browser';

import { Text, View } from '@/components/Themed';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { confirmTopup, createTopupOrder } from '@/lib/api/wallet';
import { useToast } from '@/lib/toast/ToastContext';

type Props = {
  visible: boolean;
  onDismiss: () => void;
  onSuccess: (newBalance: number) => void;
};

export function TopupModal({ visible, onDismiss, onSuccess }: Props) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];
  const { showToast } = useToast();

  const [amount, setAmount] = useState('200');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleDismiss() {
    if (isSubmitting) return;
    setError(null);
    onDismiss();
  }

  async function handleSubmit() {
    const parsedAmount = Number(amount);
    if (!parsedAmount || parsedAmount <= 0) {
      setError('Ingresa un monto válido.');
      return;
    }

    setError(null);
    setIsSubmitting(true);
    try {
      const redirectUrl = Linking.createURL('paypal-return');
      const { orderId, approveUrl } = await createTopupOrder(
        parsedAmount,
        redirectUrl,
        redirectUrl,
      );
      if (!approveUrl) {
        setError('No se pudo iniciar el pago con PayPal. Intenta de nuevo.');
        return;
      }

      const result = await WebBrowser.openAuthSessionAsync(approveUrl, redirectUrl);
      if (result.type !== 'success') {
        return;
      }

      const { queryParams } = Linking.parse(result.url);
      if (!queryParams?.PayerID) {
        setError('El pago con PayPal fue cancelado.');
        return;
      }

      const confirmResult = await confirmTopup(orderId);
      showToast({
        type: 'success',
        title: 'Recarga exitosa',
        message: `Se agregaron L. ${parsedAmount.toFixed(2)} a tu wallet.`,
      });
      onSuccess(confirmResult.balance);
    } catch {
      setError('No se pudo confirmar el pago con PayPal. Si el cargo se realizó, contáctanos.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleDismiss}>
      <View style={styles.overlay} lightColor="rgba(0,0,0,0.4)" darkColor="rgba(0,0,0,0.6)">
        <View style={[styles.card, { backgroundColor: colors.background }]}>
          <Text style={styles.title}>Recargar con PayPal</Text>
          <Text style={[styles.description, { color: colors.textSecondary }]}>
            Ingresa el monto en lempiras que quieres agregar a tu wallet.
          </Text>

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
                <Text style={styles.confirmButtonText}>Continuar</Text>
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
    gap: 4,
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
    marginBottom: 8,
  },
  error: {
    color: '#C0392B',
    fontSize: 13,
    marginBottom: 8,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
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

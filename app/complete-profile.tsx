import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, StyleSheet } from 'react-native';

import { Text, View } from '@/components/Themed';
import { Button } from '@/components/ui/Button';
import { TextField } from '@/components/ui/TextField';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { Typography } from '@/constants/Typography';
import { useAuth } from '@/lib/auth/AuthContext';
import { PHONE_PATTERN, sanitizePhoneInput } from '@/lib/phone';

export default function CompleteProfileScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];
  const { completePhone, logout } = useAuth();

  const [phone, setPhone] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const canSubmit = PHONE_PATTERN.test(phone.trim());

  async function handleSubmit() {
    setError(null);
    setIsSubmitting(true);
    try {
      await completePhone(phone.trim());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ocurrió un error inesperado.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.container}>
        <View style={[styles.iconCircle, { backgroundColor: colors.surfaceHighlight }]}>
          <Ionicons name="call-outline" size={28} color={colors.tint} />
        </View>

        <Text style={[Typography.h1, styles.title]}>Un último paso</Text>
        <Text style={[Typography.body, styles.subtitle, { color: colors.textSecondary }]}>
          Necesitamos tu número de teléfono para poder conectarte con un conductor o pasajero.
        </Text>

        <TextField
          placeholder="Teléfono"
          keyboardType="phone-pad"
          value={phone}
          onChangeText={(value) => setPhone(sanitizePhoneInput(value))}
        />

        {error && (
          <View style={[styles.noticeRow, styles.transparentBackground]}>
            <Ionicons name="alert-circle" size={14} color="#C0392B" />
            <Text style={styles.error}>{error}</Text>
          </View>
        )}

        <Button
          onPress={handleSubmit}
          loading={isSubmitting}
          disabled={!canSubmit}
          style={styles.button}
        >
          <View style={[styles.buttonContent, styles.transparentBackground]}>
            <Ionicons name="checkmark-done-outline" size={18} color="#fff" />
            <Text style={styles.buttonText}>Continuar</Text>
          </View>
        </Button>

        <Pressable style={styles.link} onPress={logout}>
          <Ionicons name="log-out-outline" size={15} color={colors.textSecondary} />
          <Text style={{ color: colors.textSecondary }}>Cerrar sesión</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
    gap: 12,
  },
  transparentBackground: {
    backgroundColor: 'transparent',
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: 4,
  },
  title: {
    textAlign: 'center',
  },
  subtitle: {
    textAlign: 'center',
    marginBottom: 12,
  },
  noticeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  error: {
    color: '#C0392B',
    fontSize: 13,
  },
  button: {
    marginTop: 8,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  link: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    alignSelf: 'center',
    marginTop: 16,
  },
});

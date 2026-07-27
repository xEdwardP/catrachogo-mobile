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

        {error && <Text style={styles.error}>{error}</Text>}

        <Button
          title="Continuar"
          onPress={handleSubmit}
          loading={isSubmitting}
          disabled={!canSubmit}
          style={styles.button}
        />

        <Pressable style={styles.link} onPress={logout}>
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
  title: {
    textAlign: 'center',
  },
  subtitle: {
    textAlign: 'center',
    marginBottom: 12,
  },
  error: {
    color: '#C0392B',
    fontSize: 13,
  },
  button: {
    marginTop: 8,
  },
  link: {
    alignSelf: 'center',
    marginTop: 16,
  },
});

import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
} from 'react-native';

import { Text, View } from '@/components/Themed';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { useAuth } from '@/lib/auth/AuthContext';

const PHONE_PATTERN = /^\+?[0-9]{8,15}$/;

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
        <Text style={styles.title}>Un último paso</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Necesitamos tu número de teléfono para poder conectarte con un conductor o pasajero.
        </Text>

        <TextInput
          style={[styles.input, { borderColor: colors.textSecondary, color: colors.text }]}
          placeholder="Teléfono"
          placeholderTextColor={colors.textSecondary}
          keyboardType="phone-pad"
          value={phone}
          onChangeText={setPhone}
        />

        {error && <Text style={styles.error}>{error}</Text>}

        <Pressable
          style={[
            styles.button,
            { backgroundColor: colors.tint },
            isSubmitting && styles.buttonDisabled,
          ]}
          onPress={handleSubmit}
          disabled={isSubmitting || !canSubmit}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Continuar</Text>
          )}
        </Pressable>

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
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 12,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
  },
  error: {
    color: '#C0392B',
    fontSize: 13,
  },
  button: {
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  link: {
    alignSelf: 'center',
    marginTop: 16,
  },
});

import { Link } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
} from 'react-native';

import { Text, View } from '@/components/Themed';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { useAuth } from '@/lib/auth/AuthContext';

const ROLES = [
  { value: 'passenger', label: 'Pasajero' },
  { value: 'driver', label: 'Conductor' },
] as const;

export default function RegisterScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];
  const { register } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<(typeof ROLES)[number]['value']>('passenger');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const canSubmit = name && email && phone && password.length >= 8;

  async function handleSubmit() {
    setError(null);
    setIsSubmitting(true);
    try {
      await register({
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        password,
        role,
      });
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
      <ScrollView contentContainerStyle={styles.container}>
        <Image
          source={require('@/assets/logo/logo_without_text.png')}
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={styles.title}>Crear cuenta</Text>

        <View style={styles.roleRow}>
          {ROLES.map((r) => {
            const selected = r.value === role;
            return (
              <Pressable
                key={r.value}
                style={[
                  styles.roleChip,
                  { borderColor: colors.tint },
                  selected && { backgroundColor: colors.tint },
                ]}
                onPress={() => setRole(r.value)}
              >
                <Text style={selected ? styles.roleChipTextSelected : { color: colors.tint }}>
                  {r.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <TextInput
          style={[styles.input, { borderColor: colors.textSecondary, color: colors.text }]}
          placeholder="Nombre completo"
          placeholderTextColor={colors.textSecondary}
          value={name}
          onChangeText={setName}
        />
        <TextInput
          style={[styles.input, { borderColor: colors.textSecondary, color: colors.text }]}
          placeholder="Correo electrónico"
          placeholderTextColor={colors.textSecondary}
          autoCapitalize="none"
          autoComplete="email"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />
        <TextInput
          style={[styles.input, { borderColor: colors.textSecondary, color: colors.text }]}
          placeholder="Teléfono"
          placeholderTextColor={colors.textSecondary}
          keyboardType="phone-pad"
          value={phone}
          onChangeText={setPhone}
        />
        <TextInput
          style={[styles.input, { borderColor: colors.textSecondary, color: colors.text }]}
          placeholder="Contraseña (mínimo 8 caracteres)"
          placeholderTextColor={colors.textSecondary}
          secureTextEntry
          value={password}
          onChangeText={setPassword}
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
            <Text style={styles.buttonText}>Crear cuenta</Text>
          )}
        </Pressable>

        <Link href="/(auth)/login" style={styles.link}>
          <Text style={{ color: colors.tint }}>¿Ya tienes cuenta? Inicia sesión</Text>
        </Link>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
    gap: 12,
  },
  logo: {
    width: 72,
    height: 72,
    alignSelf: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
  },
  roleRow: {
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'center',
    marginBottom: 8,
  },
  roleChip: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  roleChipTextSelected: {
    color: '#fff',
    fontWeight: '600',
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

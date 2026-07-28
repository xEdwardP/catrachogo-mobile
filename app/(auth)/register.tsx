import { Link } from 'expo-router';
import { useState } from 'react';
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
} from 'react-native';

import { GoogleSignInButton } from '@/components/GoogleSignInButton';
import { Text, View } from '@/components/Themed';
import { Button } from '@/components/ui/Button';
import { TextField } from '@/components/ui/TextField';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { Typography } from '@/constants/Typography';
import { useAuth } from '@/lib/auth/AuthContext';

const ROLES = [
  { value: 'passenger', label: 'Pasajero' },
  { value: 'driver', label: 'Conductor' },
] as const;

export default function RegisterScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];
  const { register, loginWithGoogle } = useAuth();

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

  async function handleGoogleSuccess(idToken: string) {
    setError(null);
    try {
      await loginWithGoogle(idToken);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ocurrió un error inesperado.');
    }
  }

  function handleGoogleError() {
    setError('No se pudo iniciar sesión con Google. Intenta de nuevo.');
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
        <Text style={[Typography.h1, styles.title]}>Crear cuenta</Text>

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

        <TextField placeholder="Nombre completo" value={name} onChangeText={setName} />
        <TextField
          placeholder="Correo electrónico"
          autoCapitalize="none"
          autoComplete="email"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />
        <TextField
          placeholder="Teléfono"
          keyboardType="phone-pad"
          value={phone}
          onChangeText={setPhone}
        />
        <TextField
          placeholder="Contraseña (mínimo 8 caracteres)"
          isPassword
          value={password}
          onChangeText={setPassword}
        />

        {error && <Text style={styles.error}>{error}</Text>}

        <Button
          title="Crear cuenta"
          onPress={handleSubmit}
          loading={isSubmitting}
          disabled={!canSubmit}
          style={styles.button}
        />

        <View style={styles.dividerRow}>
          <View style={[styles.dividerLine, { backgroundColor: colors.textSecondary }]} />
          <Text style={[styles.dividerText, { color: colors.textSecondary }]}>o</Text>
          <View style={[styles.dividerLine, { backgroundColor: colors.textSecondary }]} />
        </View>

        <GoogleSignInButton onSuccess={handleGoogleSuccess} onError={handleGoogleError} />
        <Text style={[styles.googleHint, { color: colors.textSecondary }]}>
          Con Google te registras como pasajero. Para registrarte como conductor, usa el formulario
          de arriba.
        </Text>

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
  error: {
    color: '#C0392B',
    fontSize: 13,
  },
  button: {
    marginTop: 8,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 4,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    opacity: 0.3,
  },
  dividerText: {
    fontSize: 12,
  },
  googleHint: {
    fontSize: 11,
    textAlign: 'center',
    marginTop: 6,
  },
  link: {
    alignSelf: 'center',
    marginTop: 16,
  },
});

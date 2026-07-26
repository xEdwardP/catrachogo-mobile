import { router } from 'expo-router';
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
import { useImageUpload } from '@/lib/cloudinary/useImageUpload';
import { PHONE_PATTERN, sanitizePhoneInput } from '@/lib/phone';

const NAME_MIN_LENGTH = 2;

export function ProfileScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];
  const { profile, updateName, completePhone, updateProfilePhoto, logout } = useAuth();

  const [name, setName] = useState(profile?.name ?? '');
  const [phone, setPhone] = useState(profile?.phone ?? '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const { isUploading, promptForImage } = useImageUpload(handlePhotoUploaded);

  async function handlePhotoUploaded(url: string) {
    setError(null);
    setSuccessMessage(null);
    try {
      await updateProfilePhoto(url);
      setSuccessMessage('Foto de perfil actualizada.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo actualizar tu foto de perfil.');
    }
  }

  if (!profile) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator color={colors.tint} />
      </View>
    );
  }

  const trimmedName = name.trim();
  const nameChanged = trimmedName !== profile.name;
  const phoneChanged = phone !== (profile.phone ?? '');
  const hasChanges = nameChanged || phoneChanged;

  async function handleSubmit() {
    if (!profile) return;
    setError(null);
    setSuccessMessage(null);

    if (trimmedName.length < NAME_MIN_LENGTH) {
      setError(`El nombre debe tener al menos ${NAME_MIN_LENGTH} caracteres.`);
      return;
    }
    if (phoneChanged && !PHONE_PATTERN.test(phone)) {
      setError('El teléfono debe tener entre 8 y 15 dígitos, con "+" opcional al inicio.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (nameChanged) await updateName(trimmedName);
      if (phoneChanged) await completePhone(phone);
      setSuccessMessage('Perfil actualizado.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar el perfil.');
    } finally {
      setIsSubmitting(false);
    }
  }

  const initial = profile.name.charAt(0).toUpperCase();

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Mi perfil</Text>

        <View style={styles.avatarSection}>
          <Pressable onPress={() => promptForImage('Foto de perfil')} disabled={isUploading}>
            {profile.profilePhotoUrl ? (
              <Image source={{ uri: profile.profilePhotoUrl }} style={styles.avatar} />
            ) : (
              <View
                style={[
                  styles.avatar,
                  styles.avatarFallback,
                  { backgroundColor: colors.surfaceHighlight },
                ]}
              >
                <Text style={[styles.avatarInitial, { color: colors.tint }]}>{initial}</Text>
              </View>
            )}
          </Pressable>
          <Pressable onPress={() => promptForImage('Foto de perfil')} disabled={isUploading}>
            <Text style={[styles.changePhotoText, { color: colors.tint }]}>
              {isUploading ? 'Subiendo...' : 'Cambiar foto'}
            </Text>
          </Pressable>
        </View>

        <View style={[styles.card, { backgroundColor: colors.surfaceHighlight }]}>
          <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>CORREO</Text>
          <View style={[styles.readOnlyField, { borderColor: colors.textSecondary }]}>
            <Text style={[styles.readOnlyText, { color: colors.textSecondary }]} numberOfLines={1}>
              {profile.email}
            </Text>
          </View>

          <Text
            style={[styles.fieldLabel, styles.fieldLabelSpaced, { color: colors.textSecondary }]}
          >
            NOMBRE
          </Text>
          <TextInput
            style={[styles.input, { borderColor: colors.textSecondary, color: colors.text }]}
            placeholder="Tu nombre"
            placeholderTextColor={colors.textSecondary}
            value={name}
            onChangeText={setName}
            editable={!isSubmitting}
          />

          <Text
            style={[styles.fieldLabel, styles.fieldLabelSpaced, { color: colors.textSecondary }]}
          >
            TELÉFONO
          </Text>
          <TextInput
            style={[styles.input, { borderColor: colors.textSecondary, color: colors.text }]}
            placeholder="Tu teléfono"
            placeholderTextColor={colors.textSecondary}
            keyboardType="phone-pad"
            value={phone}
            onChangeText={(value) => setPhone(sanitizePhoneInput(value))}
            editable={!isSubmitting}
          />
        </View>

        {error && <Text style={styles.error}>{error}</Text>}
        {successMessage && (
          <Text style={[styles.success, { color: colors.success }]}>{successMessage}</Text>
        )}

        <Pressable
          style={[
            styles.primaryButton,
            { backgroundColor: colors.tint },
            (!hasChanges || isSubmitting) && styles.disabled,
          ]}
          onPress={handleSubmit}
          disabled={!hasChanges || isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.primaryButtonText}>Guardar cambios</Text>
          )}
        </Pressable>

        <Pressable
          style={[styles.secondaryButton, { borderColor: colors.textSecondary }]}
          onPress={() => router.push('/support')}
          disabled={isSubmitting}
        >
          <Text style={{ color: colors.tint, fontWeight: '600' }}>Ayuda y soporte</Text>
        </Pressable>

        <Pressable
          style={[styles.secondaryButton, { borderColor: colors.textSecondary }]}
          onPress={logout}
          disabled={isSubmitting}
        >
          <Text style={{ color: colors.textSecondary, fontWeight: '600' }}>Cerrar sesión</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    padding: 16,
    paddingTop: 56,
    paddingBottom: 32,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
  },
  avatarSection: {
    alignItems: 'center',
    gap: 8,
    marginTop: 20,
    marginBottom: 24,
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
  },
  avatarFallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    fontSize: 34,
    fontWeight: '700',
  },
  changePhotoText: {
    fontSize: 13,
    fontWeight: '600',
  },
  card: {
    borderRadius: 16,
    padding: 16,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 6,
  },
  fieldLabelSpaced: {
    marginTop: 16,
  },
  readOnlyField: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    opacity: 0.6,
  },
  readOnlyText: {
    fontSize: 16,
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
    marginTop: 12,
  },
  success: {
    fontSize: 13,
    fontWeight: '600',
    marginTop: 12,
  },
  primaryButton: {
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 20,
  },
  primaryButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  secondaryButton: {
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 12,
  },
  disabled: {
    opacity: 0.6,
  },
});

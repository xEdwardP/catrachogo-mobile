import { Ionicons } from '@expo/vector-icons';
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
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { TextField } from '@/components/ui/TextField';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { useAuth } from '@/lib/auth/AuthContext';
import { useImageUpload } from '@/lib/cloudinary/useImageUpload';
import { PHONE_PATTERN, sanitizePhoneInput } from '@/lib/phone';
import { useThemePreference, type ThemePreference } from '@/lib/theme/ThemeContext';

const NAME_MIN_LENGTH = 2;

const THEME_OPTIONS: {
  value: ThemePreference;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
}[] = [
  { value: 'system', label: 'Sistema', icon: 'phone-portrait-outline' },
  { value: 'light', label: 'Claro', icon: 'sunny-outline' },
  { value: 'dark', label: 'Oscuro', icon: 'moon-outline' },
];

type Props = {
  onMenuPress?: () => void;
};

export function ProfileScreen({ onMenuPress }: Props) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];
  const { profile, updateName, completePhone, updateProfilePhoto, updatePassword, logout } =
    useAuth();
  const { preference, setPreference } = useThemePreference();

  const [name, setName] = useState(profile?.name ?? '');
  const [phone, setPhone] = useState(profile?.phone ?? '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);

  const { isUploading, promptForImage, picker } = useImageUpload(handlePhotoUploaded);

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

  async function handleChangePassword() {
    setPasswordError(null);
    setPasswordSuccess(null);

    if (newPassword.length < 8) {
      setPasswordError('La nueva contraseña debe tener al menos 8 caracteres.');
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setPasswordError('Las contraseñas nuevas no coinciden.');
      return;
    }

    setIsChangingPassword(true);
    try {
      await updatePassword(currentPassword, newPassword);
      setPasswordSuccess('Contraseña actualizada.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
    } catch (err) {
      setPasswordError(
        err instanceof Error ? err.message : 'No se pudo cambiar la contraseña. Intenta de nuevo.',
      );
    } finally {
      setIsChangingPassword(false);
    }
  }

  const initial = profile.name.charAt(0).toUpperCase();

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <ScreenHeader title="Mi perfil" onMenuPress={onMenuPress} />

        <View style={styles.avatarSection}>
          <Pressable
            style={styles.avatarWrapper}
            onPress={() => promptForImage('Foto de perfil')}
            disabled={isUploading}
          >
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
            <View
              style={[
                styles.cameraBadge,
                { backgroundColor: colors.tint, borderColor: colors.background },
              ]}
            >
              <Ionicons name="camera" size={13} color="#fff" />
            </View>
          </Pressable>
          <Text style={styles.name}>{profile.name}</Text>
          <Pressable onPress={() => promptForImage('Foto de perfil')} disabled={isUploading}>
            <Text style={[styles.changePhotoText, { color: colors.tint }]}>
              {isUploading ? 'Subiendo...' : 'Cambiar foto'}
            </Text>
          </Pressable>
        </View>

        <Card style={styles.card}>
          <View style={[styles.fieldLabelRow, styles.transparentBackground]}>
            <Ionicons name="mail-outline" size={13} color={colors.textSecondary} />
            <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>CORREO</Text>
          </View>
          <View style={[styles.readOnlyField, { borderColor: colors.textSecondary }]}>
            <Text style={[styles.readOnlyText, { color: colors.textSecondary }]} numberOfLines={1}>
              {profile.email}
            </Text>
          </View>

          <View
            style={[styles.fieldLabelRow, styles.fieldLabelSpaced, styles.transparentBackground]}
          >
            <Ionicons name="person-outline" size={13} color={colors.textSecondary} />
            <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>NOMBRE</Text>
          </View>
          <TextInput
            style={[styles.input, { borderColor: colors.textSecondary, color: colors.text }]}
            placeholder="Tu nombre"
            placeholderTextColor={colors.textSecondary}
            value={name}
            onChangeText={setName}
            editable={!isSubmitting}
          />

          <View
            style={[styles.fieldLabelRow, styles.fieldLabelSpaced, styles.transparentBackground]}
          >
            <Ionicons name="call-outline" size={13} color={colors.textSecondary} />
            <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>TELÉFONO</Text>
          </View>
          <TextInput
            style={[styles.input, { borderColor: colors.textSecondary, color: colors.text }]}
            placeholder="Tu teléfono"
            placeholderTextColor={colors.textSecondary}
            keyboardType="phone-pad"
            value={phone}
            onChangeText={(value) => setPhone(sanitizePhoneInput(value))}
            editable={!isSubmitting}
          />
        </Card>

        {error && (
          <View style={[styles.noticeRow, styles.transparentBackground]}>
            <Ionicons name="alert-circle" size={14} color="#C0392B" />
            <Text style={styles.error}>{error}</Text>
          </View>
        )}
        {successMessage && (
          <View style={[styles.noticeRow, styles.transparentBackground]}>
            <Ionicons name="checkmark-circle" size={14} color={colors.success} />
            <Text style={[styles.success, { color: colors.success }]}>{successMessage}</Text>
          </View>
        )}

        <Button
          onPress={handleSubmit}
          loading={isSubmitting}
          disabled={!hasChanges || isSubmitting}
          style={styles.saveButton}
        >
          <View style={[styles.buttonRow, styles.transparentBackground]}>
            <Ionicons name="checkmark-done-outline" size={18} color="#fff" />
            <Text style={styles.primaryButtonText}>Guardar cambios</Text>
          </View>
        </Button>

        <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>CONTRASEÑA</Text>
        <Card style={styles.card}>
          <View style={[styles.fieldLabelRow, styles.transparentBackground]}>
            <Ionicons name="lock-closed-outline" size={13} color={colors.textSecondary} />
            <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>
              CONTRASEÑA ACTUAL
            </Text>
          </View>
          <TextField
            isPassword
            placeholder="Tu contraseña actual"
            value={currentPassword}
            onChangeText={setCurrentPassword}
            editable={!isChangingPassword}
          />

          <View
            style={[styles.fieldLabelRow, styles.fieldLabelSpaced, styles.transparentBackground]}
          >
            <Ionicons name="key-outline" size={13} color={colors.textSecondary} />
            <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>
              NUEVA CONTRASEÑA
            </Text>
          </View>
          <TextField
            isPassword
            placeholder="Mínimo 8 caracteres"
            value={newPassword}
            onChangeText={setNewPassword}
            editable={!isChangingPassword}
          />

          <View
            style={[styles.fieldLabelRow, styles.fieldLabelSpaced, styles.transparentBackground]}
          >
            <Ionicons name="key-outline" size={13} color={colors.textSecondary} />
            <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>
              CONFIRMAR NUEVA CONTRASEÑA
            </Text>
          </View>
          <TextField
            isPassword
            placeholder="Repite la nueva contraseña"
            value={confirmNewPassword}
            onChangeText={setConfirmNewPassword}
            editable={!isChangingPassword}
          />

          {passwordError && (
            <View style={[styles.noticeRow, styles.transparentBackground]}>
              <Ionicons name="alert-circle" size={14} color="#C0392B" />
              <Text style={styles.error}>{passwordError}</Text>
            </View>
          )}
          {passwordSuccess && (
            <View style={[styles.noticeRow, styles.transparentBackground]}>
              <Ionicons name="checkmark-circle" size={14} color={colors.success} />
              <Text style={[styles.success, { color: colors.success }]}>{passwordSuccess}</Text>
            </View>
          )}

          <Button
            onPress={handleChangePassword}
            loading={isChangingPassword}
            disabled={!currentPassword || !newPassword || !confirmNewPassword || isChangingPassword}
            style={styles.saveButton}
          >
            <View style={[styles.buttonRow, styles.transparentBackground]}>
              <Ionicons name="lock-closed-outline" size={18} color="#fff" />
              <Text style={styles.primaryButtonText}>Cambiar contraseña</Text>
            </View>
          </Button>
        </Card>

        <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>APARIENCIA</Text>
        <Card style={styles.themeCard}>
          <View style={[styles.themeRow, styles.transparentBackground]}>
            {THEME_OPTIONS.map((option) => {
              const isSelected = preference === option.value;
              return (
                <Pressable
                  key={option.value}
                  style={[
                    styles.themeChip,
                    { borderColor: isSelected ? colors.tint : colors.textSecondary },
                    isSelected && { backgroundColor: colors.background },
                  ]}
                  onPress={() => setPreference(option.value)}
                >
                  <Ionicons
                    name={option.icon}
                    size={18}
                    color={isSelected ? colors.tint : colors.textSecondary}
                  />
                  <Text
                    style={
                      isSelected ? { color: colors.tint, fontWeight: '600' } : { fontSize: 13 }
                    }
                  >
                    {option.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </Card>

        <Button
          variant="secondary"
          onPress={() => router.push('/support')}
          disabled={isSubmitting}
          style={styles.secondaryButton}
        >
          <View style={[styles.buttonRow, styles.transparentBackground]}>
            <Ionicons name="help-circle-outline" size={18} color={colors.tint} />
            <Text style={{ color: colors.tint, fontWeight: '600' }}>Ayuda y soporte</Text>
          </View>
        </Button>

        <Button
          variant="secondary"
          onPress={logout}
          disabled={isSubmitting}
          style={styles.secondaryButton}
        >
          <View style={[styles.buttonRow, styles.transparentBackground]}>
            <Ionicons name="log-out-outline" size={18} color={colors.textSecondary} />
            <Text style={{ color: colors.textSecondary, fontWeight: '600' }}>Cerrar sesión</Text>
          </View>
        </Button>
      </ScrollView>
      {picker}
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
  transparentBackground: {
    backgroundColor: 'transparent',
  },
  avatarSection: {
    alignItems: 'center',
    gap: 4,
    marginTop: 12,
    marginBottom: 24,
  },
  avatarWrapper: {
    marginBottom: 8,
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
  cameraBadge: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: {
    fontSize: 18,
    fontWeight: '700',
    marginTop: 4,
  },
  changePhotoText: {
    fontSize: 13,
    fontWeight: '600',
  },
  card: {
    borderRadius: 16,
    padding: 16,
  },
  fieldLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 6,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '700',
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
  noticeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
  },
  error: {
    color: '#C0392B',
    fontSize: 13,
  },
  success: {
    fontSize: 13,
    fontWeight: '600',
  },
  buttonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  saveButton: {
    marginTop: 20,
  },
  primaryButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    marginTop: 24,
    marginBottom: 8,
  },
  themeCard: {
    borderRadius: 16,
    padding: 10,
  },
  themeRow: {
    flexDirection: 'row',
    gap: 8,
  },
  themeChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 12,
  },
  secondaryButton: {
    marginTop: 12,
  },
});

import { useState } from 'react';
import { ActivityIndicator, Modal, Pressable, StyleSheet, TextInput } from 'react-native';

import { Text, View } from '@/components/Themed';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import {
  INCIDENT_DESCRIPTION_MAX_LENGTH,
  INCIDENT_DESCRIPTION_MIN_LENGTH,
  INCIDENT_REPORT_CATEGORY_LABELS,
  INCIDENT_REPORT_CATEGORY_OPTIONS,
} from '@/constants/IncidentReportLabels';
import type { IncidentReportCategory } from '@/lib/api/incidentReports';

type Props = {
  visible: boolean;
  isSubmitting: boolean;
  error: string | null;
  onSubmit: (payload: { category: IncidentReportCategory; description: string }) => void;
  onDismiss: () => void;
};

export function ReportIncidentModal({ visible, isSubmitting, error, onSubmit, onDismiss }: Props) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];

  const [category, setCategory] = useState<IncidentReportCategory>('safety');
  const [description, setDescription] = useState('');

  const trimmedLength = description.trim().length;
  const canSubmit = trimmedLength >= INCIDENT_DESCRIPTION_MIN_LENGTH;

  function resetForm() {
    setCategory('safety');
    setDescription('');
  }

  function handleDismiss() {
    if (isSubmitting) return;
    resetForm();
    onDismiss();
  }

  function handleSubmit() {
    if (!canSubmit) return;
    onSubmit({ category, description: description.trim() });
    resetForm();
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleDismiss}>
      <View style={styles.overlay} lightColor="rgba(0,0,0,0.4)" darkColor="rgba(0,0,0,0.6)">
        <View style={[styles.card, { backgroundColor: colors.background }]}>
          <Text style={styles.title}>Reportar un problema</Text>
          <Text style={[styles.description, { color: colors.textSecondary }]}>
            Tu reporte queda en cola para revisión de administración. No se le notifica al
            conductor.
          </Text>

          <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>CATEGORÍA</Text>
          <View style={styles.categoryList}>
            {INCIDENT_REPORT_CATEGORY_OPTIONS.map((option) => {
              const isSelected = category === option;
              return (
                <Pressable
                  key={option}
                  style={[
                    styles.categoryOption,
                    { borderColor: isSelected ? colors.tint : colors.textSecondary },
                    isSelected && { backgroundColor: colors.surfaceHighlight },
                  ]}
                  onPress={() => setCategory(option)}
                  disabled={isSubmitting}
                >
                  <Text style={isSelected ? { color: colors.tint, fontWeight: '600' } : undefined}>
                    {INCIDENT_REPORT_CATEGORY_LABELS[option]}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <Text
            style={[styles.fieldLabel, styles.fieldLabelSpaced, { color: colors.textSecondary }]}
          >
            DESCRIPCIÓN
          </Text>
          <TextInput
            style={[styles.input, { borderColor: colors.textSecondary, color: colors.text }]}
            placeholder="Cuéntanos qué pasó..."
            placeholderTextColor={colors.textSecondary}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            maxLength={INCIDENT_DESCRIPTION_MAX_LENGTH}
            value={description}
            onChangeText={setDescription}
            editable={!isSubmitting}
          />
          {trimmedLength > 0 && !canSubmit && (
            <Text style={[styles.hint, { color: colors.textSecondary }]}>
              Escribe al menos {INCIDENT_DESCRIPTION_MIN_LENGTH} caracteres.
            </Text>
          )}

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
                (!canSubmit || isSubmitting) && styles.disabled,
              ]}
              onPress={handleSubmit}
              disabled={!canSubmit || isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.confirmButtonText}>Enviar reporte</Text>
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
  fieldLabel: {
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 8,
  },
  fieldLabelSpaced: {
    marginTop: 16,
  },
  categoryList: {
    gap: 8,
  },
  categoryOption: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    minHeight: 88,
  },
  hint: {
    fontSize: 12,
    marginTop: 6,
  },
  error: {
    color: '#C0392B',
    fontSize: 13,
    marginTop: 10,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
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

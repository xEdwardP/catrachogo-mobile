import { useState } from 'react';
import { Pressable, StyleSheet } from 'react-native';

import { Text, View } from '@/components/Themed';
import { Button } from '@/components/ui/Button';
import { ModalCard } from '@/components/ui/ModalCard';
import { TextField } from '@/components/ui/TextField';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import {
  INCIDENT_DESCRIPTION_MAX_LENGTH,
  INCIDENT_DESCRIPTION_MIN_LENGTH,
  INCIDENT_REPORT_CATEGORY_LABELS,
  INCIDENT_REPORT_CATEGORY_OPTIONS,
} from '@/constants/IncidentReportLabels';
import { Typography } from '@/constants/Typography';
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
    <ModalCard visible={visible} onDismiss={handleDismiss}>
      <Text style={[Typography.h3, styles.title]}>Reportar un problema</Text>
      <Text style={[Typography.subtitle, styles.description, { color: colors.textSecondary }]}>
        Tu reporte queda en cola para revisión de administración. No se le notifica al conductor.
      </Text>

      <Text style={[Typography.label, styles.fieldLabel, { color: colors.textSecondary }]}>
        CATEGORÍA
      </Text>
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
        style={[
          Typography.label,
          styles.fieldLabel,
          styles.fieldLabelSpaced,
          { color: colors.textSecondary },
        ]}
      >
        DESCRIPCIÓN
      </Text>
      <TextField
        style={styles.input}
        placeholder="Cuéntanos qué pasó..."
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
        <Button
          title="Cancelar"
          variant="secondary"
          onPress={handleDismiss}
          disabled={isSubmitting}
          style={styles.button}
        />
        <Button
          title="Enviar reporte"
          onPress={handleSubmit}
          loading={isSubmitting}
          disabled={!canSubmit}
          style={styles.button}
        />
      </View>
    </ModalCard>
  );
}

const styles = StyleSheet.create({
  title: {
    marginBottom: 6,
  },
  description: {
    marginBottom: 16,
  },
  fieldLabel: {
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
    paddingVertical: 12,
  },
});

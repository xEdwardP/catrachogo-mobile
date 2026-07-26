import { router, useLocalSearchParams } from 'expo-router';
import { Pressable, ScrollView, StyleSheet } from 'react-native';

import { Text, View } from '@/components/Themed';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { LEGAL_DOCUMENTS, type LegalDocId } from '@/constants/LegalContent';

function isLegalDocId(value: string | undefined): value is LegalDocId {
  return Boolean(value && value in LEGAL_DOCUMENTS);
}

export default function LegalDocumentScreen() {
  const { doc } = useLocalSearchParams<{ doc: string }>();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];

  if (!isLegalDocId(doc)) {
    return (
      <View style={styles.centered}>
        <Text style={[styles.notFoundText, { color: colors.textSecondary }]}>
          No encontramos ese documento.
        </Text>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <Text style={{ color: colors.tint, fontWeight: '600' }}>Volver</Text>
        </Pressable>
      </View>
    );
  }

  const document = LEGAL_DOCUMENTS[doc];

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Pressable style={styles.backButton} onPress={() => router.back()}>
        <Text style={{ color: colors.textSecondary }}>← Volver</Text>
      </Pressable>

      <Text style={styles.title}>{document.title}</Text>
      <Text style={[styles.updatedAt, { color: colors.textSecondary }]}>
        Última actualización: {document.updatedAt}
      </Text>

      {document.sections.map((section) => (
        <View key={section.heading} style={styles.section}>
          <Text style={styles.heading}>{section.heading}</Text>
          {section.body.map((paragraph, index) => (
            <Text key={index} style={[styles.paragraph, { color: colors.textSecondary }]}>
              {paragraph}
            </Text>
          ))}
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  notFoundText: {
    fontSize: 14,
  },
  content: {
    padding: 16,
    paddingTop: 56,
    paddingBottom: 40,
  },
  backButton: {
    alignSelf: 'flex-start',
    paddingVertical: 4,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    marginTop: 8,
  },
  updatedAt: {
    fontSize: 12,
    marginTop: 4,
    marginBottom: 20,
  },
  section: {
    marginBottom: 20,
  },
  heading: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 6,
  },
  paragraph: {
    fontSize: 13,
    lineHeight: 20,
    marginBottom: 6,
  },
});

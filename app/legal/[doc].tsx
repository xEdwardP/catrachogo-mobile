import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { Pressable, ScrollView, StyleSheet } from 'react-native';

import { Text, View } from '@/components/Themed';
import { Card } from '@/components/ui/Card';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { LEGAL_DOC_ICONS, LEGAL_DOCUMENTS, type LegalDocId } from '@/constants/LegalContent';

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
        <Ionicons name="alert-circle-outline" size={22} color={colors.textSecondary} />
        <Text style={[styles.notFoundText, { color: colors.textSecondary }]}>
          No encontramos ese documento.
        </Text>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={16} color={colors.tint} />
          <Text style={{ color: colors.tint, fontWeight: '600' }}>Volver</Text>
        </Pressable>
      </View>
    );
  }

  const document = LEGAL_DOCUMENTS[doc];

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Pressable style={styles.backButton} onPress={() => router.back()}>
        <Ionicons name="arrow-back" size={16} color={colors.textSecondary} />
        <Text style={{ color: colors.textSecondary }}>Volver</Text>
      </Pressable>

      <View style={[styles.headerRow, styles.transparentBackground]}>
        <View style={[styles.iconCircle, { backgroundColor: colors.surfaceHighlight }]}>
          <Ionicons name={LEGAL_DOC_ICONS[doc]} size={22} color={colors.tint} />
        </View>
        <View style={[styles.headerText, styles.transparentBackground]}>
          <Text style={styles.title}>{document.title}</Text>
          <View style={[styles.updatedAtRow, styles.transparentBackground]}>
            <Ionicons name="calendar-outline" size={12} color={colors.textSecondary} />
            <Text style={[styles.updatedAt, { color: colors.textSecondary }]}>
              Última actualización: {document.updatedAt}
            </Text>
          </View>
        </View>
      </View>

      <Card style={styles.card}>
        {document.sections.map((section, index) => (
          <View
            key={section.heading}
            style={[
              styles.section,
              styles.transparentBackground,
              { borderBottomColor: colors.background },
              index === document.sections.length - 1 && styles.lastSection,
            ]}
          >
            <Text style={styles.heading}>{section.heading}</Text>
            {section.body.map((paragraph, paragraphIndex) => (
              <Text
                key={paragraphIndex}
                style={[styles.paragraph, { color: colors.textSecondary }]}
              >
                {paragraph}
              </Text>
            ))}
          </View>
        ))}
      </Card>
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
  transparentBackground: {
    backgroundColor: 'transparent',
  },
  notFoundText: {
    fontSize: 14,
  },
  content: {
    padding: 16,
    paddingTop: 56,
    paddingBottom: 40,
    gap: 12,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    paddingVertical: 4,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 8,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: {
    flex: 1,
    gap: 4,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
  },
  updatedAtRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  updatedAt: {
    fontSize: 12,
  },
  card: {
    borderRadius: 16,
    padding: 16,
  },
  section: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingBottom: 16,
    marginBottom: 16,
  },
  lastSection: {
    borderBottomWidth: 0,
    paddingBottom: 0,
    marginBottom: 0,
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

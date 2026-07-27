import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { Linking, Pressable, ScrollView, StyleSheet } from 'react-native';

import { Text, View } from '@/components/Themed';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { Config } from '@/constants/Config';
import { FAQ_ITEMS } from '@/constants/FaqItems';
import { LEGAL_DOCUMENTS, type LegalDocId } from '@/constants/LegalContent';

const LEGAL_DOC_IDS = Object.keys(LEGAL_DOCUMENTS) as LegalDocId[];

function SectionHeader({ icon, title }: { icon: keyof typeof Ionicons.glyphMap; title: string }) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];

  return (
    <View style={[styles.sectionHeader, styles.transparentBackground]}>
      <View style={[styles.sectionIconCircle, { backgroundColor: colors.tint }]}>
        <Ionicons name={icon} size={15} color="#fff" />
      </View>
      <Text style={styles.cardTitle}>{title}</Text>
    </View>
  );
}

function FaqRow({
  question,
  answer,
  isLast,
}: {
  question: string;
  answer: string;
  isLast: boolean;
}) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];
  const [isOpen, setIsOpen] = useState(false);

  return (
    <View
      style={[styles.faqRow, { borderBottomColor: colors.background }, isLast && styles.lastRow]}
    >
      <Pressable style={styles.faqQuestionRow} onPress={() => setIsOpen((current) => !current)}>
        <Text style={styles.faqQuestion}>{question}</Text>
        <Ionicons
          name={isOpen ? 'chevron-up' : 'chevron-down'}
          size={16}
          color={colors.textSecondary}
        />
      </Pressable>
      {isOpen && <Text style={[styles.faqAnswer, { color: colors.textSecondary }]}>{answer}</Text>}
    </View>
  );
}

export default function SupportScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Pressable style={styles.backButton} onPress={() => router.back()}>
        <Ionicons name="arrow-back" size={16} color={colors.textSecondary} />
        <Text style={{ color: colors.textSecondary }}>Volver</Text>
      </Pressable>

      <Text style={styles.title}>Ayuda y soporte</Text>

      <Card style={styles.card}>
        <SectionHeader icon="chatbubble-ellipses-outline" title="¿Necesitas ayuda?" />
        <Text style={[styles.cardDescription, { color: colors.textSecondary }]}>
          Escríbenos y te responderemos lo antes posible.
        </Text>
        {Config.supportEmail && (
          <Button
            variant="secondary"
            onPress={() => Linking.openURL(`mailto:${Config.supportEmail}`)}
          >
            <View style={[styles.buttonContent, styles.transparentBackground]}>
              <Ionicons name="mail-outline" size={17} color={colors.tint} />
              <Text style={{ color: colors.tint, fontWeight: '600' }}>{Config.supportEmail}</Text>
            </View>
          </Button>
        )}
      </Card>

      <Card style={styles.card}>
        <SectionHeader icon="help-circle-outline" title="Preguntas frecuentes" />
        {FAQ_ITEMS.map((item, index) => (
          <FaqRow
            key={item.question}
            question={item.question}
            answer={item.answer}
            isLast={index === FAQ_ITEMS.length - 1}
          />
        ))}
      </Card>

      <Card style={styles.card}>
        <SectionHeader icon="document-text-outline" title="Legal" />
        {LEGAL_DOC_IDS.map((id, index) => (
          <Pressable
            key={id}
            style={[
              styles.legalRow,
              { borderBottomColor: colors.background },
              index === LEGAL_DOC_IDS.length - 1 && styles.lastRow,
            ]}
            onPress={() => router.push({ pathname: '/legal/[doc]', params: { doc: id } })}
          >
            <Ionicons name="document-outline" size={16} color={colors.textSecondary} />
            <Text style={styles.legalTitle}>{LEGAL_DOCUMENTS[id].title}</Text>
            <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
          </Pressable>
        ))}
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: 16,
    paddingTop: 56,
    paddingBottom: 32,
    gap: 12,
  },
  transparentBackground: {
    backgroundColor: 'transparent',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    paddingVertical: 4,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 4,
  },
  card: {
    borderRadius: 16,
    padding: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  sectionIconCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  cardDescription: {
    fontSize: 13,
    marginBottom: 12,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  faqRow: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingVertical: 12,
  },
  faqQuestionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    backgroundColor: 'transparent',
  },
  faqQuestion: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
  },
  faqAnswer: {
    fontSize: 13,
    lineHeight: 19,
    marginTop: 8,
  },
  legalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingVertical: 14,
  },
  legalTitle: {
    flex: 1,
    fontSize: 14,
  },
  lastRow: {
    borderBottomWidth: 0,
  },
});

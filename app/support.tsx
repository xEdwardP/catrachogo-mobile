import { router } from 'expo-router';
import { useState } from 'react';
import { Linking, Pressable, ScrollView, StyleSheet } from 'react-native';

import { Text, View } from '@/components/Themed';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { Config } from '@/constants/Config';
import { FAQ_ITEMS } from '@/constants/FaqItems';
import { LEGAL_DOCUMENTS, type LegalDocId } from '@/constants/LegalContent';

const LEGAL_DOC_IDS = Object.keys(LEGAL_DOCUMENTS) as LegalDocId[];

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
      style={[styles.faqRow, { borderBottomColor: colors.textSecondary }, isLast && styles.lastRow]}
    >
      <Pressable style={styles.faqQuestionRow} onPress={() => setIsOpen((current) => !current)}>
        <Text style={styles.faqQuestion}>{question}</Text>
        <Text style={[styles.chevron, { color: colors.textSecondary }]}>{isOpen ? '–' : '+'}</Text>
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
        <Text style={{ color: colors.textSecondary }}>← Volver</Text>
      </Pressable>

      <Text style={styles.title}>Ayuda y soporte</Text>

      <View style={[styles.card, { backgroundColor: colors.surfaceHighlight }]}>
        <Text style={styles.cardTitle}>¿Necesitas ayuda?</Text>
        <Text style={[styles.cardDescription, { color: colors.textSecondary }]}>
          Escríbenos y te responderemos lo antes posible.
        </Text>
        {Config.supportEmail && (
          <Pressable
            style={[styles.emailButton, { borderColor: colors.tint }]}
            onPress={() => Linking.openURL(`mailto:${Config.supportEmail}`)}
          >
            <Text style={[styles.emailText, { color: colors.tint }]}>{Config.supportEmail}</Text>
          </Pressable>
        )}
      </View>

      <View style={[styles.card, { backgroundColor: colors.surfaceHighlight }]}>
        <Text style={styles.cardTitle}>Preguntas frecuentes</Text>
        {FAQ_ITEMS.map((item, index) => (
          <FaqRow
            key={item.question}
            question={item.question}
            answer={item.answer}
            isLast={index === FAQ_ITEMS.length - 1}
          />
        ))}
      </View>

      <View style={[styles.card, { backgroundColor: colors.surfaceHighlight }]}>
        <Text style={styles.cardTitle}>Legal</Text>
        {LEGAL_DOC_IDS.map((id, index) => (
          <Pressable
            key={id}
            style={[
              styles.legalRow,
              { borderBottomColor: colors.textSecondary },
              index === LEGAL_DOC_IDS.length - 1 && styles.lastRow,
            ]}
            onPress={() => router.push({ pathname: '/legal/[doc]', params: { doc: id } })}
          >
            <Text style={styles.legalTitle}>{LEGAL_DOCUMENTS[id].title}</Text>
            <Text style={[styles.chevron, { color: colors.textSecondary }]}>›</Text>
          </Pressable>
        ))}
      </View>
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
  backButton: {
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
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 8,
  },
  cardDescription: {
    fontSize: 13,
    marginBottom: 12,
  },
  emailButton: {
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  emailText: {
    fontSize: 14,
    fontWeight: '600',
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
  chevron: {
    fontSize: 18,
    fontWeight: '600',
  },
  legalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingVertical: 14,
  },
  legalTitle: {
    fontSize: 14,
  },
  lastRow: {
    borderBottomWidth: 0,
  },
});

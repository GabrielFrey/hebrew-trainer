import { ScrollView, StyleSheet, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { Button } from '@/components/Button';
import { HebrewText } from '@/components/HebrewText';
import { AudioButton } from '@/components/AudioButton';
import { AppText, Screen, Surface } from '@/components/Themed';
import { spacing } from '@/constants/theme';
import { getLetter } from '@/lib/data';
import { exampleGloss, letterName, letterSound } from '@/lib/i18n';
import { isLearned } from '@/lib/srs';
import { useStore } from '@/lib/store';
import { useI18n } from '@/lib/use-i18n';

export default function LetterScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { progress } = useStore();
  const { t, lang, translation } = useI18n();
  const letter = getLetter(id ?? '');

  if (!letter) {
    return (
      <Screen style={styles.missing}>
        <AppText variant="heading">{t('letter.missing')}</AppText>
        <Button label={t('common.back')} variant="secondary" onPress={() => router.back()} />
      </Screen>
    );
  }

  const card = progress.cards[`letter:${letter.id}`];
  const status = !card
    ? t('letter.statusNew')
    : isLearned(card)
      ? t('letter.statusLearned')
      : t('letter.statusLearning');

  return (
    <Screen edges={['left', 'right']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Surface style={styles.hero}>
          <HebrewText size="glyph" align="center">
            {letter.char}
          </HebrewText>
          <AppText variant="title" style={styles.centered}>
            {letterName(letter, lang)}
          </AppText>
          <HebrewText size="inline" align="center">
            {letter.name}
          </HebrewText>
          <AppText muted style={styles.centered}>
            {letterSound(letter, lang)}
          </AppText>
          <View style={styles.speakRow}>
            <AudioButton audio={letter.audio} label={t('common.letterName')} />
          </View>
          <AppText variant="caption" muted style={styles.centered}>
            {status}
          </AppText>
        </Surface>

        <Surface style={styles.section}>
          <AppText variant="heading">{t('letter.example')}</AppText>
          <HebrewText size="card">{letter.example.he}</HebrewText>
          <AppText variant="label" muted>
            {letter.example.translitRu} · {letter.example.translit}
          </AppText>
          <AppText>{exampleGloss(letter.example, translation)}</AppText>
          <AudioButton audio={null} />
        </Surface>

        {letter.finalChar && letter.finalExample ? (
          <Surface style={styles.section}>
            <AppText variant="heading">{t('letter.final')}</AppText>
            <HebrewText size="glyph" align="right">
              {letter.finalChar}
            </HebrewText>
            <AppText muted>
              {t('letter.finalHint', { name: letterName(letter, lang), char: letter.finalChar })}
            </AppText>
            <HebrewText size="card">{letter.finalExample.he}</HebrewText>
            <AppText variant="label" muted>
              {letter.finalExample.translitRu} — {exampleGloss(letter.finalExample, translation)}
            </AppText>
            <AudioButton audio={null} />
          </Surface>
        ) : null}

        <Button
          label={t('letter.write')}
          onPress={() => router.push('/drill/write')}
          style={styles.cta}
        />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { gap: spacing.lg, padding: spacing.lg, paddingBottom: spacing.xxl },
  missing: { alignItems: 'center', gap: spacing.lg, justifyContent: 'center', padding: spacing.xl },
  hero: { gap: spacing.sm },
  centered: { textAlign: 'center' },
  speakRow: { alignItems: 'center' },
  section: { gap: spacing.sm },
  cta: { marginTop: spacing.sm },
});

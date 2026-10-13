import { ScrollView, StyleSheet, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { Button } from '@/components/Button';
import { HebrewText } from '@/components/HebrewText';
import { AppText, Screen, Surface } from '@/components/Themed';
import { spacing } from '@/constants/tokens';
import { loadedWords } from '@/lib/lexicon';
import { useI18n } from '@/lib/use-i18n';
import {
  BINYANIM,
  IMPERATIVE_SLOTS,
  PERSONS,
  PRESENT_SLOTS,
  getVerb,
  relatedLexiconWords,
} from '@/lib/verbs';

function Cell({ label, value }: { label: string; value: string }) {
  if (!value) return null;
  return (
    <View style={styles.cell}>
      <AppText variant="caption" muted>
        {label}
      </AppText>
      <HebrewText size="inline">{value}</HebrewText>
    </View>
  );
}

export default function VerbScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { t, lang } = useI18n();
  const verb = getVerb(id ?? '');

  if (!verb) {
    return (
      <Screen style={styles.missing}>
        <AppText variant="heading">{t('verbs.missing')}</AppText>
        <Button label={t('common.back')} variant="secondary" onPress={() => router.back()} />
      </Screen>
    );
  }

  const binyan = BINYANIM.find((item) => item.id === verb.binyan);
  const related = relatedLexiconWords(verb).filter((word) =>
    loadedWords().some((item) => item.id === word.id)
  );
  const { forms } = verb;

  return (
    <Screen edges={['left', 'right']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Surface style={styles.hero}>
          <HebrewText size="card" align="center">
            {forms.infinitive}
          </HebrewText>
          <AppText variant="heading" style={styles.center}>
            {lang === 'en' ? verb.en : verb.ru}
          </AppText>
          <AppText muted style={styles.center}>
            {t('verbs.root', { root: verb.root })}
            {binyan ? ` · ${lang === 'en' ? binyan.nameEn : binyan.nameRu}` : ''}
          </AppText>
        </Surface>

        <Surface style={styles.section}>
          <AppText variant="heading">{t('verbs.infinitive')}</AppText>
          <HebrewText size="inline">{forms.infinitive || '—'}</HebrewText>
        </Surface>

        <Surface style={styles.section}>
          <AppText variant="heading">{t('verbs.present')}</AppText>
          <View style={styles.grid}>
            {PRESENT_SLOTS.map((slot) => (
              <Cell key={slot} label={t(`verbs.person.${slot}`)} value={forms.present[slot]} />
            ))}
          </View>
        </Surface>

        <Surface style={styles.section}>
          <AppText variant="heading">{t('verbs.past')}</AppText>
          <View style={styles.grid}>
            {PERSONS.map((slot) => (
              <Cell key={slot} label={t(`verbs.person.${slot}`)} value={forms.past[slot]} />
            ))}
          </View>
        </Surface>

        <Surface style={styles.section}>
          <AppText variant="heading">{t('verbs.future')}</AppText>
          <View style={styles.grid}>
            {PERSONS.map((slot) => (
              <Cell key={slot} label={t(`verbs.person.${slot}`)} value={forms.future[slot]} />
            ))}
          </View>
        </Surface>

        <Surface style={styles.section}>
          <AppText variant="heading">{t('verbs.imperative')}</AppText>
          <View style={styles.grid}>
            {IMPERATIVE_SLOTS.map((slot) => (
              <Cell key={slot} label={t(`verbs.person.${slot}`)} value={forms.imperative[slot]} />
            ))}
          </View>
        </Surface>

        <Surface style={styles.section}>
          <AppText variant="heading">{t('verbs.related')}</AppText>
          {related.length === 0 ? (
            <AppText muted>{t('verbs.emptyRelated')}</AppText>
          ) : (
            related.map((word) => (
              <View key={word.id} style={styles.related}>
                <HebrewText size="inline">{word.nikud}</HebrewText>
                <AppText variant="caption" muted>
                  {lang === 'en' ? word.en : word.ru}
                </AppText>
              </View>
            ))
          )}
        </Surface>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { gap: spacing.lg, padding: spacing.lg, paddingBottom: spacing.xxl },
  missing: { alignItems: 'center', gap: spacing.lg, justifyContent: 'center', padding: spacing.xl },
  hero: { alignItems: 'center', gap: spacing.sm },
  center: { textAlign: 'center' },
  section: { gap: spacing.sm },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  cell: { gap: 2, minWidth: '45%' },
  related: { gap: 2 },
});

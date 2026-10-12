import { useCallback, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Feather } from '@expo/vector-icons';

import { AudioButton } from '@/components/AudioButton';
import { Button, ChoiceRow } from '@/components/Button';
import { EmptyState } from '@/components/EmptyState';
import { HebrewText } from '@/components/HebrewText';
import { ScreenHeader } from '@/components/ScreenHeader';
import { ProgressBar } from '@/components/Stat';
import { AppText, Screen, Surface } from '@/components/Themed';
import { radius, spacing } from '@/constants/theme';
import { getLevel } from '@/lib/data';
import {
  levelTitle,
  phraseDistractors,
  phraseGloss,
} from '@/lib/i18n';
import {
  canToggleNikud,
  passagesForLevel,
  phrasesForLevel,
  showTranscription,
} from '@/lib/levels';
import { isLearned } from '@/lib/srs';
import { useStore } from '@/lib/store';
import { usePalette } from '@/lib/theme';
import { useI18n } from '@/lib/use-i18n';

export default function ReadingScreen() {
  const palette = usePalette();
  const { progress, gradeCard, updateSettings } = useStore();
  const { t, lang } = useI18n();
  const settings = progress.settings;
  const level = getLevel(settings.level);

  const items = useMemo(() => phrasesForLevel(settings.level), [settings.level]);
  const passages = useMemo(() => passagesForLevel(settings.level), [settings.level]);

  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [readAloud, setReadAloud] = useState(false);

  const learnedPhrases = useMemo(
    () =>
      items.filter((p) => {
        const card = progress.cards[`phrase:${p.id}`];
        return card ? isLearned(card) : false;
      }).length,
    [items, progress.cards]
  );

  const current = items[index % Math.max(1, items.length)];

  const options = useMemo(() => {
    if (!current) return [];
    return [phraseGloss(current, lang), ...phraseDistractors(current, lang).slice(0, 3)].sort(
      (a, b) => a.localeCompare(b, lang)
    );
  }, [current, lang]);

  const next = useCallback(() => {
    setPicked(null);
    setReadAloud(false);
    setIndex((value) => (value + 1) % Math.max(1, items.length));
  }, [items.length]);

  if (!current) {
    return (
      <Screen>
        <ScreenHeader title={t('tabs.reading')} />
        <EmptyState
          icon="align-right"
          title={t('reading.empty')}
          description={t('reading.emptyHint')}
        />
      </Screen>
    );
  }

  const answered = picked !== null;
  const correct = picked === phraseGloss(current, lang);
  const withNikud = settings.showNikud;
  const canToggle = canToggleNikud(settings.level);

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <ScreenHeader
          title={t('tabs.reading')}
          subtitle={t('reading.subtitle', {
            level: levelTitle(level, lang),
            count: items.length,
            learned: learnedPhrases,
          })}
        />

        <View style={styles.block}>
          {canToggle ? (
            <>
              <View style={[styles.switcher, { backgroundColor: palette.surfaceAlt }]}>
                <Button
                  label={t('reading.withNikud')}
                  variant={withNikud ? 'primary' : 'ghost'}
                  onPress={() => updateSettings({ showNikud: true })}
                  style={styles.switchButton}
                />
                <Button
                  label={t('reading.withoutNikud')}
                  variant={withNikud ? 'ghost' : 'primary'}
                  onPress={() => updateSettings({ showNikud: false })}
                  style={styles.switchButton}
                />
              </View>
              <AppText variant="caption" muted style={styles.hint}>
                {withNikud ? t('reading.nikudOn') : t('reading.nikudOff')}
              </AppText>
            </>
          ) : (
            <Surface tone="alt" style={styles.lockNote}>
              <AppText variant="label">{t('reading.alwaysNikud')}</AppText>
              <AppText variant="caption" muted>
                {t('reading.alwaysNikudHint', { level: levelTitle(level, lang) })}
              </AppText>
            </Surface>
          )}
        </View>

        <View style={styles.block}>
          <Surface style={styles.card}>
            <View style={styles.cardHead}>
              <AppText variant="caption" muted>
                {t('reading.phraseMeta', {
                  n: index + 1,
                  total: items.length,
                  levelTag:
                    current.level === settings.level ? t('reading.yourLevel') : t('reading.pastLevel'),
                })}
              </AppText>
              <ProgressBar value={index + 1} total={items.length} />
            </View>

            <HebrewText size="card">{withNikud ? current.nikud : current.hebrew}</HebrewText>

            <View style={styles.cardActions}>
              <AudioButton audio={current.audio} />
              <Button
                label={readAloud ? t('reading.readAloudDone') : t('reading.readAloud')}
                variant={readAloud ? 'ghost' : 'secondary'}
                onPress={() => setReadAloud(true)}
              />
            </View>
            {readAloud ? (
              <View style={styles.readRow}>
                <Feather name="check" size={14} color={palette.success} />
                <AppText variant="caption" tone="success">
                  {showTranscription(settings.level)
                    ? t('reading.greatWith', { text: current.transcription })
                    : t('reading.great')}
                </AppText>
              </View>
            ) : (
              <AppText variant="caption" muted>
                {t('reading.readHint')}
              </AppText>
            )}
          </Surface>
        </View>

        <View style={styles.block}>
          <AppText variant="heading" style={styles.sectionTitle}>
            {t('reading.choose')}
          </AppText>
          <View style={styles.options}>
            {options.map((option) => {
              const isAnswer = option === phraseGloss(current, lang);
              const state = !answered
                ? 'idle'
                : option === picked
                  ? isAnswer
                    ? 'correct'
                    : 'wrong'
                  : isAnswer
                    ? 'revealed'
                    : 'idle';
              return (
                <ChoiceRow
                  key={option}
                  state={state}
                  disabled={answered}
                  onPress={() => {
                    setPicked(option);
                    gradeCard(
                      'phrase',
                      current.id,
                      option === phraseGloss(current, lang) ? 'good' : 'again'
                    );
                  }}
                >
                  <AppText variant="label" style={styles.optionText}>
                    {option}
                  </AppText>
                </ChoiceRow>
              );
            })}
          </View>

          {answered ? (
            <Surface tone="alt" style={styles.feedback}>
              <AppText variant="label" tone={correct ? 'success' : 'danger'}>
                {correct ? t('common.correct') : t('reading.rightAnswer', { text: phraseGloss(current, lang) })}
              </AppText>
              {showTranscription(settings.level) ? (
                <AppText variant="caption" muted>
                  {current.transcription}
                </AppText>
              ) : null}
              <Button label={t('reading.nextPhrase')} onPress={next} style={styles.next} />
            </Surface>
          ) : null}
        </View>

        {passages.length > 0 ? (
          <View style={styles.block}>
            <AppText variant="heading" style={styles.sectionTitle}>
              {t('reading.passages')}
            </AppText>
            {passages.map((passage) => (
              <Surface key={passage.id} style={styles.passage}>
                <AppText variant="label">{lang === 'en' ? passage.titleEn : passage.title}</AppText>
                <HebrewText size={32}>{withNikud ? passage.nikud : passage.hebrew}</HebrewText>
                <HebrewText size="inline">
                  {withNikud ? passage.question.nikud : passage.question.hebrew}
                </HebrewText>
                <AppText variant="caption" muted>
                  {t('reading.passageHint')}
                </AppText>
                <AudioButton audio={passage.audio} />
              </Surface>
            ))}
          </View>
        ) : null}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: spacing.xxl },
  block: { paddingHorizontal: spacing.lg, paddingBottom: spacing.lg },
  switcher: { borderRadius: radius.pill, flexDirection: 'row', gap: spacing.xs, padding: spacing.xs },
  switchButton: { flex: 1 },
  hint: { marginTop: spacing.sm },
  lockNote: { gap: spacing.xs },
  card: { gap: spacing.md },
  cardHead: { gap: spacing.sm },
  cardActions: { alignItems: 'center', flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  readRow: { alignItems: 'center', flexDirection: 'row', gap: spacing.xs },
  sectionTitle: { marginBottom: spacing.md },
  options: { gap: spacing.md },
  optionText: { flex: 1 },
  feedback: { gap: spacing.sm, marginTop: spacing.lg },
  next: { marginTop: spacing.xs },
  passage: { gap: spacing.sm, marginBottom: spacing.md },
});

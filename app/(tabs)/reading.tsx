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
  canToggleNikud,
  passagesForLevel,
  phrasesForLevel,
  showTranscription,
} from '@/lib/levels';
import { isLearned } from '@/lib/srs';
import { useStore } from '@/lib/store';
import { usePalette } from '@/lib/theme';

export default function ReadingScreen() {
  const palette = usePalette();
  const { progress, gradeCard, updateSettings } = useStore();
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
    return [current.ru, ...current.distractors.slice(0, 3)].sort((a, b) =>
      a.localeCompare(b, 'ru')
    );
  }, [current]);

  const next = useCallback(() => {
    setPicked(null);
    setReadAloud(false);
    setIndex((value) => (value + 1) % Math.max(1, items.length));
  }, [items.length]);

  if (!current) {
    return (
      <Screen>
        <ScreenHeader title="Чтение" />
        <EmptyState
          icon="align-right"
          title="Фраз для этого уровня нет"
          description="Добавьте фразы с никудом в data/hebrew.json или выберите другой уровень в настройках."
        />
      </Screen>
    );
  }

  const answered = picked !== null;
  const correct = picked === current.ru;
  const withNikud = settings.showNikud;
  const canToggle = canToggleNikud(settings.level);

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <ScreenHeader
          title="Чтение"
          subtitle={`${level.title} · ${items.length} фраз · уверенно читаете ${learnedPhrases}`}
        />

        <View style={styles.block}>
          {canToggle ? (
            <>
              <View style={[styles.switcher, { backgroundColor: palette.surfaceAlt }]}>
                <Button
                  label="С огласовками"
                  variant={withNikud ? 'primary' : 'ghost'}
                  onPress={() => updateSettings({ showNikud: true })}
                  style={styles.switchButton}
                />
                <Button
                  label="Без огласовок"
                  variant={withNikud ? 'ghost' : 'primary'}
                  onPress={() => updateSettings({ showNikud: false })}
                  style={styles.switchButton}
                />
              </View>
              <AppText variant="caption" muted style={styles.hint}>
                {withNikud
                  ? 'Огласовки подсказывают гласные.'
                  : 'Так пишут в книгах и на вывесках. Гласные нужно угадывать по знакомым словам.'}
              </AppText>
            </>
          ) : (
            <Surface tone="alt" style={styles.lockNote}>
              <AppText variant="label">Всегда с огласовками</AppText>
              <AppText variant="caption" muted>
                На уровне «{level.title}» никуд показывается всегда. Переключатель появится на
                среднем уровне.
              </AppText>
            </Surface>
          )}
        </View>

        <View style={styles.block}>
          <Surface style={styles.card}>
            <View style={styles.cardHead}>
              <AppText variant="caption" muted>
                Фраза {index + 1} из {items.length} · {current.level === settings.level ? 'ваш уровень' : 'пройденный уровень'}
              </AppText>
              <ProgressBar value={index + 1} total={items.length} />
            </View>

            <HebrewText size="card">{withNikud ? current.nikud : current.hebrew}</HebrewText>

            <View style={styles.cardActions}>
              <AudioButton audio={current.audio} />
              <Button
                label={readAloud ? 'Прочитано вслух' : 'Прочитать вслух'}
                variant={readAloud ? 'ghost' : 'secondary'}
                onPress={() => setReadAloud(true)}
              />
            </View>
            {readAloud ? (
              <View style={styles.readRow}>
                <Feather name="check" size={14} color={palette.success} />
                <AppText variant="caption" tone="success">
                  {showTranscription(settings.level)
                    ? `Отлично. Транскрипция: ${current.transcription}`
                    : 'Отлично.'}
                </AppText>
              </View>
            ) : (
              <AppText variant="caption" muted>
                Прочитайте вслух, потом выберите перевод.
              </AppText>
            )}
          </Surface>
        </View>

        <View style={styles.block}>
          <AppText variant="heading" style={styles.sectionTitle}>
            Выберите перевод
          </AppText>
          <View style={styles.options}>
            {options.map((option) => {
              const isAnswer = option === current.ru;
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
                    gradeCard('phrase', current.id, option === current.ru ? 'good' : 'again');
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
                {correct ? 'Верно' : `Правильный перевод: ${current.ru}`}
              </AppText>
              {showTranscription(settings.level) ? (
                <AppText variant="caption" muted>
                  {current.transcription}
                </AppText>
              ) : null}
              <Button label="Следующая фраза" onPress={next} style={styles.next} />
            </Surface>
          ) : null}
        </View>

        {passages.length > 0 ? (
          <View style={styles.block}>
            <AppText variant="heading" style={styles.sectionTitle}>
              Тексты на абзац
            </AppText>
            {passages.map((passage) => (
              <Surface key={passage.id} style={styles.passage}>
                <AppText variant="label">{passage.title}</AppText>
                <HebrewText size={32}>{withNikud ? passage.nikud : passage.hebrew}</HebrewText>
                <HebrewText size="inline">
                  {withNikud ? passage.question.nikud : passage.question.hebrew}
                </HebrewText>
                <AppText variant="caption" muted>
                  Вопрос и ответ на иврите разбираются в тренировке.
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

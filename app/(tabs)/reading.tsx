import { useCallback, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Feather } from '@expo/vector-icons';

import { Button, ChoiceRow } from '@/components/Button';
import { EmptyState } from '@/components/EmptyState';
import { HebrewText } from '@/components/HebrewText';
import { ScreenHeader } from '@/components/ScreenHeader';
import { ProgressBar } from '@/components/Stat';
import { AppText, Screen, Surface } from '@/components/Themed';
import { radius, spacing } from '@/constants/theme';
import { phrases } from '@/lib/data';
import { speak } from '@/lib/speech';
import { isLearned } from '@/lib/srs';
import { useStore } from '@/lib/store';
import { usePalette } from '@/lib/theme';

type Mode = 'nikud' | 'plain';

export default function ReadingScreen() {
  const palette = usePalette();
  const { progress, gradeCard } = useStore();
  const [mode, setMode] = useState<Mode>('nikud');
  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [readAloud, setReadAloud] = useState(false);

  const learnedPhrases = useMemo(
    () =>
      phrases.filter((p) => {
        const card = progress.cards[`phrase:${p.id}`];
        return card ? isLearned(card) : false;
      }).length,
    [progress.cards]
  );

  const current = phrases[index];

  const options = useMemo(() => {
    if (!current) return [];
    const all = [current.ru, ...current.distractors.slice(0, 3)];
    return all.sort((a, b) => a.localeCompare(b, 'ru'));
  }, [current]);

  const next = useCallback(() => {
    setPicked(null);
    setReadAloud(false);
    setIndex((value) => (value + 1) % phrases.length);
  }, []);

  if (!current) {
    return (
      <Screen>
        <ScreenHeader title="Чтение" />
        <EmptyState
          icon="align-right"
          title="Фраз пока нет"
          description="Добавьте фразы с никудом в data/hebrew.json, чтобы тренировать чтение."
        />
      </Screen>
    );
  }

  const answered = picked !== null;
  const correct = picked === current.ru;

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <ScreenHeader
          title="Чтение"
          subtitle={`${phrases.length} фраз · уверенно читаете ${learnedPhrases}`}
        />

        <View style={styles.block}>
          <View style={[styles.switcher, { backgroundColor: palette.surfaceAlt }]}>
            {(['nikud', 'plain'] as Mode[]).map((value) => {
              const active = mode === value;
              return (
                <Button
                  key={value}
                  label={value === 'nikud' ? 'С огласовками' : 'Без огласовок'}
                  variant={active ? 'primary' : 'ghost'}
                  onPress={() => setMode(value)}
                  style={styles.switchButton}
                />
              );
            })}
          </View>
          <AppText variant="caption" muted style={styles.hint}>
            {mode === 'nikud'
              ? 'Огласовки подсказывают гласные. Начните здесь.'
              : 'Так пишут в книгах и на вывесках. Гласные нужно угадывать по знакомым словам.'}
          </AppText>
        </View>

        <View style={styles.block}>
          <Surface style={styles.card}>
            <View style={styles.cardHead}>
              <AppText variant="caption" muted>
                Фраза {index + 1} из {phrases.length} · уровень {current.level}
              </AppText>
              <ProgressBar value={index + 1} total={phrases.length} />
            </View>

            <HebrewText size="card">{mode === 'nikud' ? current.nikud : current.plain}</HebrewText>

            <View style={styles.cardActions}>
              <Button
                label="Прослушать"
                variant="secondary"
                onPress={() => speak(current.nikud)}
              />
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
                  Отлично. Транскрипция: {current.translit}
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
              <AppText variant="caption" muted>
                {current.translit}
              </AppText>
              <Button label="Следующая фраза" onPress={next} style={styles.next} />
            </Surface>
          ) : null}
        </View>
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
  card: { gap: spacing.md },
  cardHead: { gap: spacing.sm },
  cardActions: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  readRow: { alignItems: 'center', flexDirection: 'row', gap: spacing.xs },
  sectionTitle: { marginBottom: spacing.md },
  options: { gap: spacing.md },
  optionText: { flex: 1 },
  feedback: { gap: spacing.sm, marginTop: spacing.lg },
  next: { marginTop: spacing.xs },
});

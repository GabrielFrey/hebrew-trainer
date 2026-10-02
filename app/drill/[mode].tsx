import { useCallback, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { Button, ChoiceRow } from '@/components/Button';
import { EmptyState } from '@/components/EmptyState';
import { HebrewText } from '@/components/HebrewText';
import { SpeakButton } from '@/components/SpeakButton';
import { ProgressBar } from '@/components/Stat';
import { AppText, Screen, Surface } from '@/components/Themed';
import { spacing } from '@/constants/theme';
import { letters } from '@/lib/data';
import type { Letter } from '@/lib/types';
import { useStore } from '@/lib/store';

const DRILL_LENGTH = 10;

function shuffle<T>(items: T[]): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    const a = out[i] as T;
    const b = out[j] as T;
    out[i] = b;
    out[j] = a;
  }
  return out;
}

export default function LetterDrillScreen() {
  const { mode } = useLocalSearchParams<{ mode: string }>();
  const router = useRouter();
  const { progress, gradeCard } = useStore();
  const isWriteMode = mode === 'write';

  const pool = useMemo(() => {
    const seen = letters.filter((l) => progress.cards[`letter:${l.id}`]);
    return seen.length >= 4 ? seen : letters;
  }, [progress.cards]);

  const [queue, setQueue] = useState<Letter[]>(() => shuffle(pool).slice(0, DRILL_LENGTH));
  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [score, setScore] = useState({ correct: 0, total: 0 });

  const current = queue[index];

  const options = useMemo(() => {
    if (!current) return [];
    const distractors = shuffle(letters.filter((l) => l.id !== current.id)).slice(0, 3);
    return shuffle([current, ...distractors]);
  }, [current]);

  const advance = useCallback(() => {
    setPicked(null);
    setRevealed(false);
    setIndex((value) => value + 1);
  }, []);

  const restart = useCallback(() => {
    setQueue(shuffle(pool).slice(0, DRILL_LENGTH));
    setIndex(0);
    setPicked(null);
    setRevealed(false);
    setScore({ correct: 0, total: 0 });
  }, [pool]);

  const register = useCallback(
    (letter: Letter, correct: boolean) => {
      gradeCard('letter', letter.id, correct ? 'good' : 'again');
      setScore((value) => ({
        correct: value.correct + (correct ? 1 : 0),
        total: value.total + 1,
      }));
    },
    [gradeCard]
  );

  if (!current) {
    return (
      <Screen edges={['left', 'right']}>
        <View style={styles.finished}>
          <EmptyState
            icon="check-circle"
            title="Разминка закончена"
            description={
              score.total === 0
                ? 'Карточек не нашлось. Пройдите сессию на вкладке «Сегодня».'
                : `Правильно ${score.correct} из ${score.total}.`
            }
            actionLabel="Ещё раз"
            onAction={restart}
          />
          <Button label="Готово" variant="ghost" onPress={() => router.back()} />
        </View>
      </Screen>
    );
  }

  return (
    <Screen edges={['left', 'right']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.progress}>
          <AppText variant="caption" muted>
            {index + 1} из {queue.length}
          </AppText>
          <ProgressBar value={index} total={queue.length} />
        </View>

        {isWriteMode ? (
          <Surface style={styles.card}>
            <AppText variant="caption" muted>
              Напишите букву от руки
            </AppText>
            <AppText variant="title">{current.nameRu}</AppText>
            <AppText muted>{current.sound}</AppText>
            {revealed ? (
              <View style={styles.revealBlock}>
                <HebrewText size="glyph" align="center">
                  {current.char}
                </HebrewText>
                {current.finalChar ? (
                  <AppText variant="caption" muted style={styles.centered}>
                    Конечная форма: {current.finalChar}
                  </AppText>
                ) : null}
                <HebrewText size="inline" align="center" muted>
                  {current.example.he}
                </HebrewText>
              </View>
            ) : (
              <View style={styles.placeholder}>
                <AppText muted style={styles.centered}>
                  Вспомните начертание, напишите его на бумаге, затем сверьтесь.
                </AppText>
              </View>
            )}
          </Surface>
        ) : (
          <Surface style={styles.card}>
            <AppText variant="caption" muted>
              Какая это буква?
            </AppText>
            <HebrewText size="glyph" align="center">
              {current.char}
            </HebrewText>
            <View style={styles.centeredRow}>
              <SpeakButton text={current.name} label="Название" />
            </View>
          </Surface>
        )}

        {isWriteMode ? (
          <View style={styles.actions}>
            {revealed ? (
              <>
                <Button
                  label="Ошибся"
                  variant="danger"
                  onPress={() => {
                    register(current, false);
                    advance();
                  }}
                  style={styles.actionButton}
                />
                <Button
                  label="Написал верно"
                  onPress={() => {
                    register(current, true);
                    advance();
                  }}
                  style={styles.actionButton}
                />
              </>
            ) : (
              <Button
                label="Показать букву"
                size="lg"
                onPress={() => setRevealed(true)}
                style={styles.actionButton}
              />
            )}
          </View>
        ) : (
          <View style={styles.options}>
            {options.map((option) => {
              const isAnswer = option.id === current.id;
              const state =
                picked === null
                  ? 'idle'
                  : option.id === picked
                    ? isAnswer
                      ? 'correct'
                      : 'wrong'
                    : isAnswer
                      ? 'revealed'
                      : 'idle';
              return (
                <ChoiceRow
                  key={option.id}
                  state={state}
                  disabled={picked !== null}
                  onPress={() => {
                    setPicked(option.id);
                    register(current, isAnswer);
                  }}
                >
                  <AppText variant="label">{option.nameRu}</AppText>
                  <AppText variant="caption" muted>
                    {option.sound.split(',')[0]}
                  </AppText>
                </ChoiceRow>
              );
            })}
            {picked !== null ? (
              <Button label="Дальше" size="lg" onPress={advance} style={styles.next} />
            ) : null}
          </View>
        )}

        <Button label="Выйти" variant="ghost" onPress={() => router.back()} />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { gap: spacing.lg, padding: spacing.lg, paddingBottom: spacing.xxl },
  finished: { flex: 1, gap: spacing.lg, justifyContent: 'center', padding: spacing.lg },
  progress: { gap: spacing.sm },
  card: { alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.xl },
  centered: { textAlign: 'center' },
  centeredRow: { alignItems: 'center' },
  revealBlock: { alignItems: 'center', gap: spacing.xs, width: '100%' },
  placeholder: { paddingHorizontal: spacing.lg, paddingVertical: spacing.xl },
  actions: { flexDirection: 'row', gap: spacing.md },
  actionButton: { flex: 1 },
  options: { gap: spacing.md },
  next: { marginTop: spacing.sm },
});

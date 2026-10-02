import { useCallback, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { AudioButton } from '@/components/AudioButton';
import { Button, ChoiceRow } from '@/components/Button';
import { EmptyState } from '@/components/EmptyState';
import { HandwritingCanvas } from '@/components/HandwritingCanvas';
import { HebrewText } from '@/components/HebrewText';
import { ProgressBar } from '@/components/Stat';
import { AppText, Screen, Surface } from '@/components/Themed';
import { spacing } from '@/constants/theme';
import { letters } from '@/lib/data';
import { glyphs, gradeForVerdict, recognise } from '@/lib/handwriting';
import type { GlyphTemplate, Stroke, Verdict } from '@/lib/handwriting';
import { useStore } from '@/lib/store';
import type { Letter } from '@/lib/types';

const DRILL_LENGTH = 10;

type DrillItem = Letter | GlyphTemplate;

function shuffle<T>(items: readonly T[]): T[] {
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

  // В режиме письма идём по глифам, чтобы спрашивать и конечные формы.
  const glyphPool = useMemo(() => {
    const seen = glyphs.filter((glyph) => progress.cards[`letter:${glyph.letterId}`]);
    return seen.length >= 4 ? seen : glyphs;
  }, [progress.cards]);

  const letterPool = useMemo(() => {
    const seen = letters.filter((l) => progress.cards[`letter:${l.id}`]);
    return seen.length >= 4 ? seen : letters;
  }, [progress.cards]);

  const [queue, setQueue] = useState<DrillItem[]>(() =>
    shuffle<DrillItem>(isWriteMode ? glyphPool : letterPool).slice(0, DRILL_LENGTH)
  );
  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [verdict, setVerdict] = useState<Verdict | 'idle'>('idle');
  const [attempts, setAttempts] = useState(0);
  const [score, setScore] = useState({ correct: 0, total: 0 });

  const currentItem = queue[index];
  const currentGlyph = isWriteMode ? (currentItem as GlyphTemplate | undefined) : undefined;
  const currentLetter = isWriteMode
    ? letters.find((l) => l.id === currentGlyph?.letterId)
    : (currentItem as Letter | undefined);

  const options = useMemo(() => {
    if (isWriteMode || !currentLetter) return [];
    const distractors = shuffle(letters.filter((l) => l.id !== currentLetter.id)).slice(0, 3);
    return shuffle([currentLetter, ...distractors]);
  }, [currentLetter, isWriteMode]);

  const advance = useCallback(() => {
    setPicked(null);
    setVerdict('idle');
    setAttempts(0);
    setIndex((value) => value + 1);
  }, []);

  const restart = useCallback(() => {
    setQueue(shuffle<DrillItem>(isWriteMode ? glyphPool : letterPool).slice(0, DRILL_LENGTH));
    setIndex(0);
    setPicked(null);
    setVerdict('idle');
    setAttempts(0);
    setScore({ correct: 0, total: 0 });
  }, [glyphPool, isWriteMode, letterPool]);

  const register = useCallback(
    (letterId: string, correct: boolean) => {
      gradeCard('letter', letterId, correct ? 'good' : 'again');
      setScore((value) => ({
        correct: value.correct + (correct ? 1 : 0),
        total: value.total + 1,
      }));
    },
    [gradeCard]
  );

  const onStrokes = useCallback(
    (strokes: Stroke[]) => {
      if (!currentGlyph || !currentLetter) return;
      const result = recognise(strokes, currentGlyph.id);
      setVerdict(result.verdict);
      setAttempts((value) => value + 1);

      // Низкая уверенность не оценивается: просим написать заново.
      const grade = gradeForVerdict(result.verdict);
      if (grade) register(currentLetter.id, grade !== 'again');
    },
    [currentGlyph, currentLetter, register]
  );

  if (!currentItem || !currentLetter) {
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

        {isWriteMode && currentGlyph ? (
          <>
            <Surface style={styles.card}>
              <AppText variant="caption" muted>
                Напишите букву пальцем
              </AppText>
              <AppText variant="title">{currentLetter.nameRu}</AppText>
              <AppText muted style={styles.centered}>
                {currentLetter.sound}
              </AppText>
              {currentGlyph.form === 'final' ? (
                <AppText variant="label" tone="accent">
                  конечная форма
                </AppText>
              ) : null}
            </Surface>

            <HandwritingCanvas
              resetKey={`${currentGlyph.id}-${attempts}-${verdict}`}
              disabled={verdict === 'match' || verdict === 'mismatch'}
              hint="Напишите букву здесь"
              onChange={onStrokes}
            />

            {verdict === 'match' || verdict === 'mismatch' ? (
              <Surface tone="alt" style={styles.sample}>
                <AppText variant="caption" muted>
                  Образец
                </AppText>
                <HebrewText size="card" align="center">
                  {currentGlyph.char}
                </HebrewText>
              </Surface>
            ) : null}
          </>
        ) : (
          <Surface style={styles.card}>
            <AppText variant="caption" muted>
              Какая это буква?
            </AppText>
            <HebrewText size="glyph" align="center">
              {currentLetter.char}
            </HebrewText>
            <View style={styles.centeredRow}>
              <AudioButton audio={currentLetter.audio} label="Название" />
            </View>
          </Surface>
        )}

        {isWriteMode ? (
          <View style={styles.feedback}>
            {verdict === 'match' ? (
              <>
                <AppText variant="label" tone="success">
                  Начертание узнано.
                </AppText>
                <Button label="Дальше" size="lg" onPress={advance} />
              </>
            ) : null}
            {verdict === 'mismatch' ? (
              <>
                <AppText variant="label" tone="danger">
                  Это другая буква. Интервал сброшен.
                </AppText>
                <Button label="Дальше" size="lg" onPress={advance} />
              </>
            ) : null}
            {verdict === 'unsure' && attempts > 0 ? (
              <>
                <AppText variant="label" tone="accent">
                  Не разобрал начертание. Напишите ещё раз — ошибка не записана.
                </AppText>
                <Button
                  label="Стереть и написать заново"
                  size="lg"
                  onPress={() => setVerdict('idle')}
                />
              </>
            ) : null}
            {verdict === 'idle' ? (
              <AppText variant="caption" muted style={styles.centered}>
                Отпустите палец — приложение сверит букву
              </AppText>
            ) : null}
          </View>
        ) : (
          <View style={styles.options}>
            {options.map((option) => {
              const isAnswer = option.id === currentLetter.id;
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
                    register(currentLetter.id, isAnswer);
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
  sample: { alignItems: 'center', gap: spacing.xs },
  feedback: { gap: spacing.md },
  options: { gap: spacing.md },
  next: { marginTop: spacing.sm },
});

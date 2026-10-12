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
import { letterName, letterSound } from '@/lib/i18n';
import { useStore } from '@/lib/store';
import type { Letter } from '@/lib/types';
import { useI18n } from '@/lib/use-i18n';

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
  const { mode, ids } = useLocalSearchParams<{ mode: string; ids?: string }>();
  const router = useRouter();
  const { progress, gradeCard } = useStore();
  const { t, lang } = useI18n();
  const isWriteMode = mode === 'write';
  const requestedIds = (typeof ids === 'string' ? ids : '').split(',').map((id) => id.trim()).filter(Boolean);

  // В режиме письма идём по глифам, чтобы спрашивать и конечные формы.
  const glyphPool = useMemo(() => {
    if (requestedIds.length > 0) {
      return requestedIds
        .map((id) => glyphs.find((glyph) => glyph.id === id))
        .filter((glyph): glyph is GlyphTemplate => Boolean(glyph));
    }
    const seen = glyphs.filter((glyph) => progress.cards[`letter:${glyph.letterId}`]);
    return seen.length >= 4 ? seen : glyphs;
  }, [progress.cards, requestedIds.join(',')]);

  const letterPool = useMemo(() => {
    const seen = letters.filter((l) => progress.cards[`letter:${l.id}`]);
    return seen.length >= 4 ? seen : letters;
  }, [progress.cards]);

  const buildQueue = useCallback(() => {
    const pool = isWriteMode ? glyphPool : letterPool;
    if (requestedIds.length > 0 && isWriteMode) return [...pool];
    return shuffle<DrillItem>(pool).slice(0, DRILL_LENGTH);
  }, [glyphPool, isWriteMode, letterPool, requestedIds.length]);

  const [queue, setQueue] = useState<DrillItem[]>(() => buildQueue());
  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [verdict, setVerdict] = useState<Verdict | 'idle'>('idle');
  const [attempts, setAttempts] = useState(0);
  const [wipe, setWipe] = useState(0);
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
    setWipe(0);
    setIndex((value) => value + 1);
  }, []);

  const restart = useCallback(() => {
    setQueue(buildQueue());
    setIndex(0);
    setPicked(null);
    setVerdict('idle');
    setAttempts(0);
    setWipe(0);
    setScore({ correct: 0, total: 0 });
  }, [buildQueue]);

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
            title={t('drill.finished')}
            description={
              score.total === 0
                ? t('drill.finishedEmpty')
                : t('drill.finishedScore', { correct: score.correct, total: score.total })
            }
            actionLabel={t('drill.again')}
            onAction={restart}
          />
          <Button label={t('common.done')} variant="ghost" onPress={() => router.back()} />
        </View>
      </Screen>
    );
  }

  return (
    <Screen edges={['left', 'right']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.progress}>
          <AppText variant="caption" muted>
            {t('drill.of', { n: index + 1, total: queue.length })}
          </AppText>
          <ProgressBar value={index} total={queue.length} />
        </View>

        {isWriteMode && currentGlyph ? (
          <>
            <Surface style={styles.card}>
              <AppText variant="caption" muted>
                {t('drill.writePrompt')}
              </AppText>
              <AppText variant="title">{letterName(currentLetter, lang)}</AppText>
              <AppText muted style={styles.centered}>
                {letterSound(currentLetter, lang)}
              </AppText>
              {currentGlyph.form === 'final' ? (
                <AppText variant="label" tone="accent">
                  {t('session.finalForm')}
                </AppText>
              ) : null}
            </Surface>

            <HandwritingCanvas
              resetKey={`${currentGlyph.id}-${wipe}`}
              disabled={verdict === 'match' || verdict === 'mismatch'}
              hint={t('session.writeHere')}
              onChange={onStrokes}
            />

            {verdict === 'match' || verdict === 'mismatch' ? (
              <Surface tone="alt" style={styles.sample}>
                <AppText variant="caption" muted>
                  {t('session.sample')}
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
              {t('drill.which')}
            </AppText>
            <HebrewText size="glyph" align="center">
              {currentLetter.char}
            </HebrewText>
            <View style={styles.centeredRow}>
              <AudioButton audio={currentLetter.audio} label={t('common.letterName')} />
            </View>
          </Surface>
        )}

        {isWriteMode ? (
          <View style={styles.feedback}>
            {verdict === 'match' ? (
              <>
                <AppText variant="label" tone="success">
                  {t('drill.recognised')}
                </AppText>
                <Button label={t('common.next')} size="lg" onPress={advance} />
              </>
            ) : null}
            {verdict === 'mismatch' ? (
              <>
                <AppText variant="label" tone="danger">
                  {t('drill.mismatch')}
                </AppText>
                <Button label={t('common.next')} size="lg" onPress={advance} />
              </>
            ) : null}
            {verdict === 'unsure' && attempts > 0 ? (
              <>
                <AppText variant="label" tone="accent">
                  {t('session.unsure')}
                </AppText>
                <Button
                  label={t('session.retry')}
                  size="lg"
                  onPress={() => {
                    setVerdict('idle');
                    setWipe((value) => value + 1);
                  }}
                />
              </>
            ) : null}
            {verdict === 'idle' ? (
              <AppText variant="caption" muted style={styles.centered}>
                {t('session.release')}
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
                  <AppText variant="label">{letterName(option, lang)}</AppText>
                  <AppText variant="caption" muted>
                    {letterSound(option, lang).split(',')[0]}
                  </AppText>
                </ChoiceRow>
              );
            })}
            {picked !== null ? (
              <Button label={t('common.next')} size="lg" onPress={advance} style={styles.next} />
            ) : null}
          </View>
        )}

        <Button label={t('common.exit')} variant="ghost" onPress={() => router.back()} />
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

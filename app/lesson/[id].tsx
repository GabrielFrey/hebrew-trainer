import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { AudioButton } from '@/components/AudioButton';
import { Button, ChoiceRow } from '@/components/Button';
import { EmptyState } from '@/components/EmptyState';
import { HandwritingCanvas } from '@/components/HandwritingCanvas';
import { HebrewText } from '@/components/HebrewText';
import { ProgressBar } from '@/components/Stat';
import { AppText, Screen, Surface } from '@/components/Themed';
import { radius, spacing } from '@/constants/theme';
import { getWord } from '@/lib/data';
import { getDialogue } from '@/lib/lexicon';
import { buildLesson } from '@/lib/lessons';
import { getGlyph, gradeForVerdict, recognise } from '@/lib/handwriting';
import type { Stroke } from '@/lib/handwriting';
import { exampleGloss, posLabel, wordGloss } from '@/lib/i18n';
import { hebrewFor, showTranscription } from '@/lib/levels';
import { useStore } from '@/lib/store';
import { usePalette } from '@/lib/theme';
import { useI18n } from '@/lib/use-i18n';

export default function LessonScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const lessonKey = typeof id === 'string' ? decodeURIComponent(id) : '';
  const router = useRouter();
  const palette = usePalette();
  const { progress, gradeCard, finishSession, completeLesson } = useStore();
  const { t, lang } = useI18n();
  const queue = useMemo(() => buildLesson(progress, lessonKey), [lessonKey, progress.settings.level]);
  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [built, setBuilt] = useState<string[]>([]);
  const [score, setScore] = useState({ correct: 0, total: 0 });
  const [writeAttempts, setWriteAttempts] = useState(0);

  const card = queue[index];
  const word = card?.kind === 'word' ? getWord(card.refId) : undefined;
  const dialogue = card?.dialogueId ? getDialogue(card.dialogueId) : undefined;

  const finish = () => {
    completeLesson(lessonKey);
    finishSession(score.total || queue.length, score.correct);
  };

  const advance = (ok: boolean) => {
    if (card && card.kind === 'word' && (card.exercise === 'word-he-ru' || card.exercise === 'listen-choice')) {
      gradeCard('word', card.refId, ok ? 'good' : 'again');
    }
    if (card?.kind === 'letter' && card.exercise !== 'letter-write') {
      gradeCard('letter', card.refId, ok ? 'good' : 'again');
    }
    setScore((s) => ({ correct: s.correct + (ok ? 1 : 0), total: s.total + 1 }));
    setPicked(null);
    setBuilt([]);
    setWriteAttempts(0);
    setIndex((v) => v + 1);
  };

  if (queue.length === 0) {
    return (
      <Screen>
        <EmptyState
          icon="book"
          title={t('notFound.title')}
          description={t('notFound.body')}
          actionLabel={t('common.back')}
          onAction={() => router.back()}
        />
      </Screen>
    );
  }

  if (!card) {
    return (
      <Screen>
        <View style={styles.done}>
          <EmptyState
            icon="check-circle"
            title={t('lesson.finished')}
            description={t('lesson.finishedHint')}
            actionLabel={t('common.done')}
            onAction={() => {
              finish();
              router.replace('/');
            }}
          />
        </View>
      </Screen>
    );
  }

  const prompt =
    card.exercise === 'teach-word'
      ? t('lesson.teach')
      : card.exercise === 'choice-picture'
        ? t('lesson.pickPicture')
        : card.exercise === 'listen-choice'
          ? t('lesson.listen')
          : card.exercise === 'build-phrase'
            ? t('lesson.build')
            : card.exercise === 'dialogue-reply'
              ? t('lesson.dialogue')
              : t('lesson.pickGloss');

  return (
    <Screen edges={['left', 'right']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.progress}>
          <AppText variant="caption" muted>
            {t('drill.of', { n: index + 1, total: queue.length })}
          </AppText>
          <ProgressBar value={index} total={queue.length} />
        </View>
        <AppText variant="caption" muted>
          {prompt}
        </AppText>

        {(card.exercise === 'word-he-ru' || card.exercise === 'choice-picture') && word ? (
          <Surface style={styles.card}>
            <HebrewText size="card" align="center">
              {hebrewFor(word, progress.settings)}
            </HebrewText>
            {showTranscription(progress.settings.level) ? (
              <AppText muted>{word.transcription}</AppText>
            ) : null}
            <AudioButton audio={word.audio} />
          </Surface>
        ) : null}

        {card.exercise === 'teach-word' && word ? (
          <Surface style={styles.card}>
            <AppText variant="title">{word.emoji}</AppText>
            <HebrewText size="card" align="center">
              {hebrewFor(word, progress.settings)}
            </HebrewText>
            {showTranscription(progress.settings.level) ? (
              <AppText muted>{word.transcription}</AppText>
            ) : null}
            <AppText variant="heading">{wordGloss(word, lang)}</AppText>
            <AppText variant="caption" muted>
              {posLabel(word.pos, lang)}
            </AppText>
            <AppText>{exampleGloss(word.example, lang)}</AppText>
            <AudioButton audio={word.audio} />
            <Button label={t('lesson.gotIt')} size="lg" onPress={() => advance(true)} />
          </Surface>
        ) : null}

        {card.exercise === 'letter-write' ? (
          <HandwritingCanvas
            resetKey={`${card.cardId}-${writeAttempts}`}
            hint={t('session.writeHere')}
            onChange={(strokes: Stroke[]) => {
              if (!card.expectedGlyph) return;
              const result = recognise(strokes, card.expectedGlyph);
              const grade = gradeForVerdict(result.verdict);
              if (!grade) {
                setWriteAttempts((v) => v + 1);
                return;
              }
              gradeCard('letter', card.refId, grade);
              advance(grade !== 'again');
            }}
          />
        ) : null}

        {card.exercise === 'build-phrase' ? (
          <View style={styles.block}>
            <AppText muted>{t('lesson.tapChips')}</AppText>
            <Surface style={styles.built}>
              <HebrewText size="inline">{built.join(' ') || '…'}</HebrewText>
            </Surface>
            <View style={styles.chips}>
              {(card.chips ?? []).map((chip, chipIndex) => (
                <Pressable
                  key={`${chip}-${chipIndex}`}
                  onPress={() => setBuilt((value) => [...value, chip])}
                  style={[styles.chip, { borderColor: palette.border, backgroundColor: palette.surface }]}
                >
                  <AppText>{chip}</AppText>
                </Pressable>
              ))}
            </View>
            <Button
              label={t('lesson.check')}
              size="lg"
              onPress={() => advance(built.join(' ') === card.answer)}
            />
            <Button label={t('session.retry')} variant="ghost" onPress={() => setBuilt([])} />
          </View>
        ) : null}

        {card.exercise === 'dialogue-reply' && dialogue ? (
          <View style={styles.block}>
            {dialogue.lines.map((line, lineIndex) => (
              <Surface key={lineIndex} style={styles.card}>
                <AppText variant="caption" muted>
                  {line.speaker === 'a' ? 'A' : 'B'}
                </AppText>
                <HebrewText size="inline" align="right">
                  {line.nikud}
                </HebrewText>
                <AppText>{lang === 'en' ? line.en : line.ru}</AppText>
              </Surface>
            ))}
          </View>
        ) : null}

        {card.options.length > 0 ? (
          <View style={styles.options}>
            {card.options.map((option) => {
              const label = option.includes('|') ? option.split('|')[0] : option;
              const isAnswer = option === card.answer;
              const state =
                picked === null
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
                  disabled={picked !== null}
                  onPress={() => {
                    setPicked(option);
                    setTimeout(() => advance(isAnswer), 450);
                  }}
                >
                  <AppText variant="heading">{label}</AppText>
                  {option.includes('|') ? (
                    <AppText variant="caption" muted>
                      {option.split('|')[1]}
                    </AppText>
                  ) : null}
                </ChoiceRow>
              );
            })}
          </View>
        ) : null}

        {card.exercise === 'listen-choice' && word ? (
          <Surface style={styles.card}>
            <AppText variant="heading">{t('lesson.listen')}</AppText>
            <AudioButton audio={word.audio} />
          </Surface>
        ) : null}

        {card.exercise === 'letter-recognise' && card.expectedGlyph ? (
          <HebrewText size="glyph" align="center">
            {getGlyph(card.expectedGlyph)?.char ?? ''}
          </HebrewText>
        ) : null}

        <Button label={t('common.exit')} variant="ghost" onPress={() => router.back()} />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { gap: spacing.lg, padding: spacing.lg, paddingBottom: spacing.xxl },
  progress: { gap: spacing.sm },
  card: { alignItems: 'center', gap: spacing.sm },
  block: { gap: spacing.md },
  options: { gap: spacing.md },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: {
    borderRadius: radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  built: { minHeight: 56, justifyContent: 'center' },
  done: { flex: 1, justifyContent: 'center', padding: spacing.lg },
});

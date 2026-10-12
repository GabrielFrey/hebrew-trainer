import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { AudioButton } from '@/components/AudioButton';
import { Button, ChoiceRow } from '@/components/Button';
import { EmptyState } from '@/components/EmptyState';
import { HebrewText } from '@/components/HebrewText';
import { ProgressBar } from '@/components/Stat';
import { AppText, Screen, Surface } from '@/components/Themed';
import { TranslationToggle } from '@/components/TranslationToggle';
import { radius, spacing } from '@/constants/theme';
import { getWord } from '@/lib/data';
import { displayAnswer, displayOptions, exampleGloss, posLabel, wordGloss } from '@/lib/i18n';
import { getDialogue, lessonKeyFromSlug } from '@/lib/lexicon';
import { buildLesson } from '@/lib/lessons';
import { hebrewFor, showTranscription } from '@/lib/levels';
import { useStore } from '@/lib/store';
import { usePalette } from '@/lib/theme';
import type { SessionCard, UiLanguage } from '@/lib/types';
import { useI18n } from '@/lib/use-i18n';

function promptFor(exercise: SessionCard['exercise'], t: (key: string) => string): string {
  switch (exercise) {
    case 'teach-word':
      return t('lesson.teach');
    case 'choice-picture':
      return t('lesson.pickPicture');
    case 'listen-choice':
      return t('lesson.listen');
    case 'build-phrase':
      return t('lesson.build');
    case 'dialogue-reply':
      return t('lesson.dialogue');
    case 'letter-write':
      return t('session.prompt.letterWrite');
    case 'letter-recognise':
      return t('session.prompt.letterRecognise');
    case 'word-ru-he':
      return t('session.prompt.wordGloss');
    default:
      return t('lesson.pickGloss');
  }
}

function Options({
  card,
  picked,
  onPick,
  translation,
}: {
  card: SessionCard;
  picked: string | null;
  onPick: (option: string) => void;
  translation: UiLanguage;
}) {
  const options = displayOptions(card, translation);
  const answer = displayAnswer(card, translation);
  if (options.length === 0) return null;
  return (
    <View style={styles.options} testID="lesson-options">
      {options.map((option, optionIndex) => {
        const [primary, secondary] = option.includes('|') ? option.split('|') : [option, null];
        const isAnswer = option === answer;
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
            key={`${option}-${optionIndex}`}
            testID={`lesson-option-${optionIndex}`}
            state={state}
            disabled={picked !== null}
            onPress={() => onPick(option)}
          >
            <View>
              <AppText variant="heading">{primary}</AppText>
              {secondary ? (
                <AppText variant="caption" muted>
                  {secondary}
                </AppText>
              ) : null}
            </View>
          </ChoiceRow>
        );
      })}
    </View>
  );
}

export default function LessonScreen() {
  const params = useLocalSearchParams<{ unit?: string; index?: string; slug?: string | string[] }>();
  const lessonKey = params.unit
    ? lessonKeyFromSlug([params.unit, params.index ?? '0'])
    : lessonKeyFromSlug(params.slug);
  const router = useRouter();
  const palette = usePalette();
  const { progress, gradeCard, finishSession, completeLesson } = useStore();
  const { t, lang, translation } = useI18n();
  const queue = useMemo(
    () => buildLesson(progress, lessonKey),
    // Язык перевода читается с карточки (bilingual*), очередь не пересобирается.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [lessonKey, progress.settings.level]
  );
  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [built, setBuilt] = useState<string[]>([]);
  const [score, setScore] = useState({ correct: 0, total: 0 });

  const card = queue[index];
  const word = card?.kind === 'word' ? getWord(card.refId) : undefined;
  const dialogue = card?.dialogueId ? getDialogue(card.dialogueId) : undefined;
  const answer = card ? displayAnswer(card, translation) : '';

  const finish = () => {
    completeLesson(lessonKey);
    finishSession(score.total || queue.length, score.correct);
  };

  const advance = (ok: boolean) => {
    if (card && card.kind === 'word' && (card.exercise === 'word-he-ru' || card.exercise === 'listen-choice')) {
      gradeCard('word', card.refId, ok ? 'good' : 'again');
    }
    setScore((s) => ({ correct: s.correct + (ok ? 1 : 0), total: s.total + 1 }));
    setPicked(null);
    setBuilt([]);
    setIndex((v) => v + 1);
  };

  const pickOption = (option: string) => {
    if (!card) return;
    setPicked(option);
    const ok = option === answer;
    setTimeout(() => advance(ok), 450);
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
        <View style={styles.done} testID="lesson-finished">
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

  const showWordFace =
    card.exercise === 'teach-word' ||
    card.exercise === 'word-he-ru' ||
    card.exercise === 'choice-picture' ||
    card.exercise === 'word-ru-he';

  return (
    <Screen edges={['left', 'right']}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        testID={`lesson-card-${card.exercise}`}
      >
        <View style={styles.toolbar}>
          <View style={styles.progress}>
            <AppText variant="caption" muted>
              {t('drill.of', { n: index + 1, total: queue.length })}
            </AppText>
            <ProgressBar value={index} total={queue.length} />
          </View>
          <TranslationToggle />
        </View>
        <AppText variant="caption" muted testID="lesson-prompt">
          {promptFor(card.exercise, t)}
        </AppText>
        <AppText testID="lesson-answer" nativeID="lesson-answer" style={styles.srOnly}>
          {answer}
        </AppText>

        {card.exercise === 'teach-word' && word ? (
          <Surface style={styles.card}>
            <AppText variant="title">{word.emoji}</AppText>
            <HebrewText size="card" align="center">
              {hebrewFor(word, progress.settings)}
            </HebrewText>
            {showTranscription(progress.settings.level) ? (
              <AppText muted>{word.transcription}</AppText>
            ) : null}
            <AppText variant="heading">{wordGloss(word, translation)}</AppText>
            <AppText variant="caption" muted>
              {posLabel(word.pos, lang)}
            </AppText>
            <AppText>{exampleGloss(word.example, translation)}</AppText>
            <AudioButton audio={word.audio} />
            <Button label={t('lesson.gotIt')} size="lg" onPress={() => advance(true)} />
          </Surface>
        ) : null}

        {showWordFace && card.exercise !== 'teach-word' && word ? (
          <Surface style={styles.card}>
            <HebrewText size="card" align="center">
              {card.exercise === 'word-ru-he' ? wordGloss(word, translation) : hebrewFor(word, progress.settings)}
            </HebrewText>
            {card.exercise !== 'word-ru-he' && showTranscription(progress.settings.level) ? (
              <AppText muted>{word.transcription}</AppText>
            ) : null}
            <AudioButton audio={word.audio} />
          </Surface>
        ) : null}

        {card.exercise === 'listen-choice' && word ? (
          <Surface style={styles.card}>
            <AppText variant="heading">{t('common.listen')}</AppText>
            <AudioButton audio={word.audio} />
          </Surface>
        ) : null}

        {card.exercise === 'build-phrase' ? (
          <View style={styles.block}>
            {word ? (
              <AppText muted>
                {exampleGloss(word.example, translation)} · {t('lesson.tapChips')}
              </AppText>
            ) : (
              <AppText muted>{t('lesson.tapChips')}</AppText>
            )}
            <Surface style={styles.built} testID="lesson-built">
              <HebrewText size="inline">{built.join(' ') || '…'}</HebrewText>
            </Surface>
            <View style={styles.chips}>
              {(card.chips ?? []).map((chip, chipIndex) => (
                <Pressable
                  key={`${chip}-${chipIndex}`}
                  testID={`lesson-chip-${chipIndex}`}
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
                <AppText>{translation === 'en' ? line.en : line.ru}</AppText>
              </Surface>
            ))}
          </View>
        ) : null}

        {card.exercise !== 'teach-word' && card.exercise !== 'build-phrase' ? (
          <Options card={card} picked={picked} onPick={pickOption} translation={translation} />
        ) : null}

        <Button label={t('common.exit')} variant="ghost" onPress={() => router.back()} />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { gap: spacing.lg, padding: spacing.lg, paddingBottom: spacing.xxl },
  toolbar: { alignItems: 'flex-start', flexDirection: 'row', gap: spacing.md },
  progress: { flex: 1, gap: spacing.sm },
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
  srOnly: { height: 0, overflow: 'hidden', opacity: 0, position: 'absolute' },
});

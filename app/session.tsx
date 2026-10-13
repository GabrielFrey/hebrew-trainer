import { useCallback, useMemo, useRef, useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { AudioButton } from '@/components/AudioButton';
import { Button, ChoiceRow } from '@/components/Button';
import { Confetti } from '@/components/Confetti';
import { EmptyState } from '@/components/EmptyState';
import { HandwritingCanvas } from '@/components/HandwritingCanvas';
import { HebrewKeyboard } from '@/components/HebrewKeyboard';
import { HebrewText } from '@/components/HebrewText';
import { PointedHebrew } from '@/components/PointedHebrew';
import { Mascot } from '@/components/Mascot';
import { ProgressBar } from '@/components/Stat';
import { AppText, Screen, Surface } from '@/components/Themed';
import { spacing } from '@/constants/tokens';
import { playSfx } from '@/lib/sfx';
import { exerciseNeedsAudio, hasRecording } from '@/lib/audio';
import { getLetter, getPassage, getPhrase, getWord } from '@/lib/data';
import { getGlyph, gradeForVerdict, recognise } from '@/lib/handwriting';
import type { Stroke } from '@/lib/handwriting';
import {
  displayAnswer,
  displayOptions,
  letterName,
  letterSound,
  posLabel,
  wordGloss,
} from '@/lib/i18n';
import { answersMatch } from '@/lib/hebrew-script';
import { hebrewFor, showNikud, showTranscription } from '@/lib/levels';
import { isTypedExercise } from '@/lib/recall';
import { buildSession } from '@/lib/session';
import { useStore } from '@/lib/store';
import { getVerb } from '@/lib/verbs';
import { usePalette } from '@/lib/theme';
import type { Grade, SessionCard, Settings } from '@/lib/types';
import { useI18n } from '@/lib/use-i18n';

function tap(success: boolean, soundsOn = true) {
  playSfx(success ? 'correct' : 'wrong', soundsOn);
  if (Platform.OS === 'web') return;
  void Haptics.notificationAsync(
    success ? Haptics.NotificationFeedbackType.Success : Haptics.NotificationFeedbackType.Warning
  );
}

type WriteState = {
  strokes: Stroke[];
  verdict: 'idle' | 'match' | 'mismatch' | 'unsure';
  attempts: number;
  /** Счётчик явной очистки: холст не стираем при «не уверен», чтобы можно было дописать штрих. */
  wipe: number;
};

const EMPTY_WRITE: WriteState = { strokes: [], verdict: 'idle', attempts: 0, wipe: 0 };

export default function SessionScreen() {
  const router = useRouter();
  const palette = usePalette();
  const { ahead } = useLocalSearchParams<{ ahead?: string }>();
  const { progress, gradeCard, finishSession } = useStore();
  const { t, translation } = useI18n();
  const settings = progress.settings;

  const initialQueue = useMemo(
    () =>
      buildSession(progress, Date.now(), { allowAhead: ahead === '1' }).filter((card) => {
        if (!exerciseNeedsAudio(card.exercise)) return true;
        const word = getWord(card.refId);
        return hasRecording(word?.audio);
      }),
    // Built once per session so that grading does not reshuffle the queue.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const [queue, setQueue] = useState<SessionCard[]>(initialQueue);
  const [position, setPosition] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [typed, setTyped] = useState('');
  const [write, setWrite] = useState<WriteState>(EMPTY_WRITE);
  const totals = useRef({ reviewed: 0, correct: 0 });
  const [done, setDone] = useState(false);

  const current = queue[position];

  const advance = useCallback(
    (card: SessionCard, grade: Grade) => {
      gradeCard(card.kind, card.refId, grade);
      const reviewed = totals.current.reviewed + 1;
      const correct = totals.current.correct + (grade === 'again' ? 0 : 1);
      totals.current = { reviewed, correct };

      // A wrong answer resets the interval and sends the card to the queue tail.
      if (grade === 'again') {
        setQueue((currentQueue) => [...currentQueue, { ...card, isNew: false }]);
      } else if (position + 1 >= queue.length) {
        finishSession(reviewed, correct);
        setDone(true);
      }

      setPicked(null);
      setTyped('');
      setWrite(EMPTY_WRITE);
      setPosition((value) => value + 1);
    },
    [finishSession, gradeCard, position, queue.length]
  );

  const checkHandwriting = useCallback(
    (card: SessionCard, strokes: Stroke[]) => {
      if (!card.expectedGlyph) return;
      const result = recognise(strokes, card.expectedGlyph);
      setWrite((state) => ({
        strokes,
        verdict: result.verdict,
        attempts: state.attempts + 1,
        wipe: state.wipe,
      }));
      if (result.verdict !== 'unsure') {
        tap(result.verdict === 'match', progress.settings.soundEnabled !== false);
      }
    },
    [progress.settings.soundEnabled]
  );

  const closeSession = useCallback(() => {
    if (totals.current.reviewed > 0 && !done) {
      finishSession(totals.current.reviewed, totals.current.correct);
    }
    router.back();
  }, [done, finishSession, router]);

  if (initialQueue.length === 0) {
    return (
      <Screen>
        <View style={styles.center}>
          <EmptyState
            icon="coffee"
            title={t('session.empty')}
            description={t('session.emptyHint')}
            actionLabel={t('common.close')}
            onAction={() => router.back()}
          />
        </View>
      </Screen>
    );
  }

  if (done || !current) {
    const accuracyPct =
      totals.current.reviewed === 0
        ? 0
        : Math.round((totals.current.correct / totals.current.reviewed) * 100);
    return (
      <Screen>
        <View style={styles.center}>
          <Confetti play />
          <Mascot pose="cheer" size={140} />
          <Surface style={styles.summary}>
            <HebrewText size="card" align="center">
              כָּל הַכָּבוֹד!
            </HebrewText>
            <AppText variant="caption" muted style={styles.centered}>
              {t('session.bravo')}
            </AppText>
            <AppText variant="title" style={styles.centered}>
              {t('session.finished')}
            </AppText>
            <AppText muted style={styles.centered}>
              {t('session.summary', {
                reviewed: totals.current.reviewed,
                pct: accuracyPct,
                streak: progress.streak.current,
              })}
            </AppText>
            <Button label={t('common.done')} size="lg" onPress={() => router.back()} style={styles.cta} />
          </Surface>
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <View style={styles.topBar}>
        <Pressable
          accessibilityLabel={t('session.closeA11y')}
          accessibilityRole="button"
          hitSlop={10}
          onPress={closeSession}
          style={[styles.close, { backgroundColor: palette.surfaceAlt }]}
        >
          <Feather name="x" size={18} color={palette.text} />
        </Pressable>
        <View style={styles.topProgress}>
          <ProgressBar value={position} total={queue.length} />
        </View>
        <AppText variant="caption" muted>
          {Math.min(position + 1, queue.length)}/{queue.length}
        </AppText>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {current.isNew ? (
          <View style={[styles.newBadge, { backgroundColor: `${palette.accent}1F` }]}>
            <Feather name="plus-circle" size={13} color={palette.accent} />
            <AppText variant="caption" tone="accent">
              {t('session.newCard')}
            </AppText>
          </View>
        ) : null}

        <CardBody
          card={current}
          settings={settings}
          picked={picked}
          typed={typed}
          write={write}
          onStrokes={(strokes) => checkHandwriting(current, strokes)}
          onPick={(value) => {
            setPicked(value);
            tap(value === displayAnswer(current, translation), progress.settings.soundEnabled !== false);
          }}
          onTyped={setTyped}
        />

        <Footer
          card={current}
          picked={picked}
          typed={typed}
          write={write}
          onRetry={() =>
            setWrite((state) => ({ ...EMPTY_WRITE, attempts: state.attempts, wipe: state.wipe + 1 }))
          }
          onCheck={() => {
            setPicked(typed || ' ');
            tap(answersMatch(typed, current.answer), progress.settings.soundEnabled !== false);
          }}
          onGrade={(grade) => advance(current, grade)}
        />
      </ScrollView>
    </Screen>
  );
}

function promptFor(
  card: SessionCard,
  t: (key: string) => string
): { title: string; hint?: string } {
  switch (card.exercise) {
    case 'letter-recognise':
      return { title: t('session.prompt.letterRecognise') };
    case 'letter-write':
      return { title: t('session.prompt.letterWrite'), hint: t('session.prompt.letterWriteHint') };
    case 'word-he-ru':
      return { title: t('session.prompt.wordHe') };
    case 'word-ru-he':
      return { title: t('session.prompt.wordGloss') };
    case 'phrase-translate':
      return { title: t('session.prompt.phrase') };
    case 'passage-question':
      return { title: t('session.prompt.passage') };
    case 'listen-choice':
      return { title: t('session.prompt.listen') };
    case 'type-word':
      return { title: t('session.prompt.typeWord'), hint: t('session.prompt.typeHint') };
    case 'cloze-example':
      return { title: t('session.prompt.cloze'), hint: t('session.prompt.typeHint') };
    case 'gender-agree':
      return { title: t('session.prompt.gender') };
    case 'form-verb':
      return { title: t('session.prompt.formVerb') };
    default:
      return { title: t('session.prompt.wordHe') };
  }
}

function genderPrompt(card: SessionCard, lang: 'ru' | 'en'): string | undefined {
  if (!card.promptHe?.includes('|||')) return undefined;
  const [ru, en] = card.promptHe.split('|||');
  return lang === 'en' ? en : ru;
}

function CardBody({
  card,
  settings,
  picked,
  typed,
  write,
  onStrokes,
  onPick,
  onTyped,
}: {
  card: SessionCard;
  settings: Settings;
  picked: string | null;
  typed: string;
  write: WriteState;
  onStrokes: (strokes: Stroke[]) => void;
  onPick: (value: string) => void;
  onTyped: (value: string) => void;
}) {
  const { t, lang, translation } = useI18n();
  const { progress } = useStore();
  const prompt = promptFor(card, t);
  const typedKind = isTypedExercise(card.exercise);
  const answered = typedKind ? picked !== null : picked !== null;
  const withTranscription = showTranscription(settings.level);
  const options = displayOptions(card, translation);
  const answer = displayAnswer(card, translation);

  const letter = card.kind === 'letter' ? getLetter(card.refId) : undefined;
  const word = card.kind === 'word' ? getWord(card.refId) : undefined;
  const phrase = card.kind === 'phrase' ? getPhrase(card.refId) : undefined;
  const passage = card.kind === 'passage' ? getPassage(card.refId) : undefined;
  const expected = card.expectedGlyph ? getGlyph(card.expectedGlyph) : undefined;

  return (
    <View style={styles.body}>
      <View style={styles.promptBlock}>
        <AppText variant="heading">{prompt.title}</AppText>
        {prompt.hint ? (
          <AppText variant="caption" muted>
            {prompt.hint}
          </AppText>
        ) : null}
      </View>

      {card.exercise === 'letter-write' && letter && expected ? (
        <View style={styles.writeBlock}>
          <Surface style={styles.writePrompt}>
            <AppText variant="title">{letterName(letter, translation)}</AppText>
            <AppText muted style={styles.centered}>
              {letterSound(letter, translation)}
            </AppText>
            {expected.form === 'final' ? (
              <AppText variant="label" tone="accent">
                {t('session.finalForm')}
              </AppText>
            ) : null}
          </Surface>

          <HandwritingCanvas
            resetKey={`${card.cardId}-${write.wipe}`}
            disabled={write.verdict === 'match' || write.verdict === 'mismatch'}
            hint={t('session.writeHere')}
            onChange={onStrokes}
          />

          {write.verdict === 'mismatch' || write.verdict === 'match' ? (
            <Surface tone="alt" style={styles.writeAnswer}>
              <AppText variant="caption" muted>
                {t('session.sample')}
              </AppText>
              <HebrewText size="card" align="center">
                {expected.char}
              </HebrewText>
            </Surface>
          ) : null}
        </View>
      ) : (
        <Surface style={styles.stage}>
          {card.exercise === 'letter-recognise' && letter ? (
            <>
              <HebrewText size="glyph" align="center">
                {letter.char}
              </HebrewText>
              {card.isNew ? (
                <AppText variant="label" muted>
                  {letterName(letter, translation)} · {letterSound(letter, translation)}
                </AppText>
              ) : null}
              <AudioButton audio={letter.audio} label={t('common.letterName')} />
            </>
          ) : null}

          {card.exercise === 'word-he-ru' && word ? (
            <>
              <PointedHebrew
                nikud={word.nikud}
                hebrew={word.hebrew}
                card={progress.cards[`word:${word.id}`]}
                id={`word:${word.id}`}
              />
              {withTranscription && (card.isNew || answered) ? (
                <AppText variant="label" muted>
                  {word.transcription}
                </AppText>
              ) : null}
              <AudioButton audio={word.audio} />
            </>
          ) : null}

          {card.exercise === 'listen-choice' && word ? (
            <>
              <Mascot pose="think" size={88} />
              <AudioButton audio={word.audio} />
            </>
          ) : null}

          {card.exercise === 'type-word' && word ? (
            <>
              <AppText variant="title" style={styles.centered}>
                {wordGloss(word, translation)}
              </AppText>
              <AppText variant="caption" muted>
                {posLabel(word.pos, lang)}
              </AppText>
              <HebrewKeyboard value={typed} onChange={onTyped} disabled={answered} />
            </>
          ) : null}

          {card.exercise === 'cloze-example' ? (
            <>
              <HebrewText size="inline" align="center">
                {card.promptHe ?? '____'}
              </HebrewText>
              <HebrewKeyboard value={typed} onChange={onTyped} disabled={answered} />
            </>
          ) : null}

          {card.exercise === 'form-verb' ? (
            <>
              <AppText style={styles.centered}>
                {t(`verbs.form.${card.formTense ?? 'present'}`)}
                {card.formSlot && card.formTense !== 'infinitive'
                  ? ` · ${t(`verbs.person.${card.formSlot}`)}`
                  : ''}
              </AppText>
              {card.bilingualAnswer ? (
                <AppText muted style={styles.centered}>
                  {translation === 'en' ? card.bilingualAnswer.en : card.bilingualAnswer.ru}
                </AppText>
              ) : null}
              {getVerb(card.verbId ?? '') ? (
                <AppText variant="caption" muted>
                  {t('verbs.root', { root: getVerb(card.verbId ?? '')?.root ?? '' })}
                </AppText>
              ) : null}
              {options.length === 0 ? (
                <HebrewKeyboard value={typed} onChange={onTyped} disabled={answered} />
              ) : null}
            </>
          ) : null}

          {card.exercise === 'gender-agree' ? (
            <AppText variant="heading" style={styles.centered}>
              {genderPrompt(card, translation) ?? t('session.prompt.gender')}
            </AppText>
          ) : null}

          {card.exercise === 'word-ru-he' && word ? (
            <>
              <AppText variant="title" style={styles.centered}>
                {wordGloss(word, translation)}
              </AppText>
              <AppText variant="caption" muted>
                {posLabel(word.pos, lang)}
              </AppText>
            </>
          ) : null}

          {card.exercise === 'phrase-translate' && phrase ? (
            <>
              <HebrewText size="card">{hebrewFor(phrase, settings)}</HebrewText>
              {withTranscription && answered ? (
                <AppText variant="caption" muted>
                  {phrase.transcription}
                </AppText>
              ) : null}
              <AudioButton audio={phrase.audio} />
            </>
          ) : null}

          {card.exercise === 'passage-question' && passage ? (
            <>
              <HebrewText size={32}>{hebrewFor(passage, settings)}</HebrewText>
              <AudioButton audio={passage.audio} />
              <View style={styles.question}>
                <HebrewText size="inline">
                  {showNikud(settings) ? passage.question.nikud : passage.question.hebrew}
                </HebrewText>
                {answered ? (
                  <AppText variant="caption" muted>
                    {translation === 'en' ? passage.question.en : passage.question.ru}
                  </AppText>
                ) : null}
              </View>
            </>
          ) : null}
        </Surface>
      )}

      {card.exercise === 'letter-write' || (typedKind && options.length === 0) ? null : (
        <View style={styles.options}>
          {options.map((option) => {
            const isAnswer = option === answer;
            const state = !answered
              ? 'idle'
              : option === picked
                ? isAnswer
                  ? 'correct'
                  : 'wrong'
                : isAnswer
                  ? 'revealed'
                  : 'idle';
            const hebrewOption =
              card.exercise === 'word-ru-he' ||
              card.exercise === 'passage-question' ||
              card.exercise === 'gender-agree' ||
              card.exercise === 'form-verb';
            return (
              <ChoiceRow
                key={option}
                state={state}
                disabled={answered}
                onPress={() => onPick(option)}
              >
                {hebrewOption ? (
                  <HebrewText size="inline" style={styles.optionHebrew}>
                    {option}
                  </HebrewText>
                ) : (
                  <AppText variant="label" style={styles.optionText}>
                    {option}
                  </AppText>
                )}
              </ChoiceRow>
            );
          })}
        </View>
      )}
    </View>
  );
}

function Footer({
  card,
  picked,
  typed,
  write,
  onRetry,
  onCheck,
  onGrade,
}: {
  card: SessionCard;
  picked: string | null;
  typed: string;
  write: WriteState;
  onRetry: () => void;
  onCheck: () => void;
  onGrade: (grade: Grade) => void;
}) {
  const { t, translation } = useI18n();
  const typedKind = isTypedExercise(card.exercise) && (card.options?.length ?? 0) === 0;
  const answered = picked !== null;
  const correct = typedKind
    ? answersMatch(typed, card.answer)
    : picked === displayAnswer(card, translation);

  if (card.exercise === 'letter-write') {
    if (write.verdict === 'match') {
      return (
        <View style={styles.footer}>
          <AppText variant="label" tone="success">
            {t('session.howWasIt')}
          </AppText>
          <View style={styles.footerRow}>
            <Button
              label={t('session.hard')}
              variant="secondary"
              onPress={() => onGrade('hard')}
              style={styles.footerButton}
            />
            <Button label={t('session.good')} onPress={() => onGrade('good')} style={styles.footerButton} />
            <Button
              label={t('session.easy')}
              variant="secondary"
              onPress={() => onGrade('easy')}
              style={styles.footerButton}
            />
          </View>
        </View>
      );
    }
    if (write.verdict === 'mismatch') {
      return (
        <View style={styles.footer}>
          <AppText variant="label" tone="danger">
            {t('session.mismatch')}
          </AppText>
          <Button
            label={t('common.understood')}
            size="lg"
            onPress={() => onGrade(gradeForVerdict('mismatch') ?? 'again')}
          />
        </View>
      );
    }
    if (write.verdict === 'unsure' && write.attempts > 0) {
      return (
        <View style={styles.footer}>
          <AppText variant="label" tone="accent">
            {t('session.unsure')}
          </AppText>
          <Button label={t('session.retry')} size="lg" onPress={onRetry} />
        </View>
      );
    }
    return (
      <View style={styles.footer}>
        <AppText variant="caption" muted style={styles.centered}>
          {t('session.release')}
        </AppText>
      </View>
    );
  }

  if (!answered) {
    if (typedKind) {
      return (
        <View style={styles.footer}>
          <Button label={t('lesson.check')} size="lg" disabled={typed.trim().length === 0} onPress={onCheck} />
        </View>
      );
    }
    return (
      <View style={styles.footer}>
        <AppText variant="caption" muted style={styles.centered}>
          {t('session.pick')}
        </AppText>
      </View>
    );
  }

  if (!correct) {
    return (
      <View style={styles.footer}>
        <AppText variant="label" tone="danger">
          {t('session.wrong')}
        </AppText>
        <Button label={t('common.understood')} size="lg" onPress={() => onGrade('again')} />
      </View>
    );
  }

  return (
    <View style={styles.footer}>
      <AppText variant="label" tone="success">
        {t('session.rightHow')}
      </AppText>
      <View style={styles.footerRow}>
        <Button
          label={t('session.hard')}
          variant="secondary"
          onPress={() => onGrade('hard')}
          style={styles.footerButton}
        />
        <Button label={t('session.good')} onPress={() => onGrade('good')} style={styles.footerButton} />
        <Button
          label={t('session.easy')}
          variant="secondary"
          onPress={() => onGrade('easy')}
          style={styles.footerButton}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  topBar: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
    paddingBottom: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
  },
  close: {
    alignItems: 'center',
    borderRadius: 999,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  topProgress: { flex: 1 },
  content: { gap: spacing.lg, padding: spacing.lg, paddingBottom: spacing.xxl },
  center: { flex: 1, justifyContent: 'center', padding: spacing.lg },
  summary: { gap: spacing.sm },
  centered: { textAlign: 'center' },
  cta: { marginTop: spacing.lg },
  newBadge: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderRadius: 999,
    flexDirection: 'row',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  body: { gap: spacing.lg },
  promptBlock: { gap: 2 },
  stage: { alignItems: 'center', gap: spacing.md, paddingVertical: spacing.xl },
  writeBlock: { gap: spacing.md },
  writePrompt: { alignItems: 'center', gap: spacing.xs },
  writeAnswer: { alignItems: 'center', gap: spacing.xs },
  question: { alignItems: 'flex-end', gap: spacing.xs, width: '100%' },
  options: { gap: spacing.md },
  optionText: { flex: 1 },
  optionHebrew: { flex: 1 },
  footer: { gap: spacing.md },
  footerRow: { flexDirection: 'row', gap: spacing.sm },
  footerButton: { flex: 1 },
});

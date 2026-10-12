import { useCallback, useMemo, useRef, useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { AudioButton } from '@/components/AudioButton';
import { Button, ChoiceRow } from '@/components/Button';
import { EmptyState } from '@/components/EmptyState';
import { HandwritingCanvas } from '@/components/HandwritingCanvas';
import { HebrewText } from '@/components/HebrewText';
import { ProgressBar } from '@/components/Stat';
import { AppText, Screen, Surface } from '@/components/Themed';
import { spacing } from '@/constants/theme';
import { getLetter, getPassage, getPhrase, getWord } from '@/lib/data';
import { getGlyph, gradeForVerdict, recognise } from '@/lib/handwriting';
import type { Stroke } from '@/lib/handwriting';
import { letterName, letterSound, posLabel, wordGloss } from '@/lib/i18n';
import { hebrewFor, showNikud, showTranscription } from '@/lib/levels';
import { buildSession } from '@/lib/session';
import { useStore } from '@/lib/store';
import { usePalette } from '@/lib/theme';
import type { Grade, SessionCard, Settings } from '@/lib/types';
import { useI18n } from '@/lib/use-i18n';

function tap(success: boolean) {
  if (Platform.OS === 'web') return;
  void Haptics.notificationAsync(
    success ? Haptics.NotificationFeedbackType.Success : Haptics.NotificationFeedbackType.Warning
  );
}

type WriteState = {
  strokes: Stroke[];
  verdict: 'idle' | 'match' | 'mismatch' | 'unsure';
  attempts: number;
};

const EMPTY_WRITE: WriteState = { strokes: [], verdict: 'idle', attempts: 0 };

export default function SessionScreen() {
  const router = useRouter();
  const palette = usePalette();
  const { ahead } = useLocalSearchParams<{ ahead?: string }>();
  const { progress, gradeCard, finishSession } = useStore();
  const { t } = useI18n();
  const settings = progress.settings;

  const initialQueue = useMemo(
    () => buildSession(progress, Date.now(), { allowAhead: ahead === '1' }),
    // Built once per session so that grading does not reshuffle the queue.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const [queue, setQueue] = useState<SessionCard[]>(initialQueue);
  const [position, setPosition] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
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
      }));
      if (result.verdict !== 'unsure') tap(result.verdict === 'match');
    },
    []
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
          write={write}
          onStrokes={(strokes) => checkHandwriting(current, strokes)}
          onPick={(value) => {
            setPicked(value);
            tap(value === current.answer);
          }}
        />

        <Footer
          card={current}
          picked={picked}
          write={write}
          onRetry={() => setWrite((state) => ({ ...EMPTY_WRITE, attempts: state.attempts }))}
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
  }
}

function CardBody({
  card,
  settings,
  picked,
  write,
  onStrokes,
  onPick,
}: {
  card: SessionCard;
  settings: Settings;
  picked: string | null;
  write: WriteState;
  onStrokes: (strokes: Stroke[]) => void;
  onPick: (value: string) => void;
}) {
  const { t, lang } = useI18n();
  const prompt = promptFor(card, t);
  const answered = picked !== null;
  const withTranscription = showTranscription(settings.level);

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
            <AppText variant="title">{letterName(letter, lang)}</AppText>
            <AppText muted style={styles.centered}>
              {letterSound(letter, lang)}
            </AppText>
            {expected.form === 'final' ? (
              <AppText variant="label" tone="accent">
                {t('session.finalForm')}
              </AppText>
            ) : null}
          </Surface>

          <HandwritingCanvas
            resetKey={`${card.cardId}-${write.attempts}-${write.verdict}`}
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
                  {letterName(letter, lang)} · {letterSound(letter, lang)}
                </AppText>
              ) : null}
              <AudioButton audio={letter.audio} label={t('common.letterName')} />
            </>
          ) : null}

          {card.exercise === 'word-he-ru' && word ? (
            <>
              <HebrewText size="card" align="center">
                {hebrewFor(word, settings)}
              </HebrewText>
              {withTranscription && (card.isNew || answered) ? (
                <AppText variant="label" muted>
                  {word.transcription}
                </AppText>
              ) : null}
              <AudioButton audio={word.audio} />
            </>
          ) : null}

          {card.exercise === 'word-ru-he' && word ? (
            <>
              <AppText variant="title" style={styles.centered}>
                {wordGloss(word, lang)}
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
                    {lang === 'en' ? passage.question.en : passage.question.ru}
                  </AppText>
                ) : null}
              </View>
            </>
          ) : null}
        </Surface>
      )}

      {card.exercise === 'letter-write' ? null : (
        <View style={styles.options}>
          {card.options.map((option) => {
            const isAnswer = option === card.answer;
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
              card.exercise === 'word-ru-he' || card.exercise === 'passage-question';
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
  write,
  onRetry,
  onGrade,
}: {
  card: SessionCard;
  picked: string | null;
  write: WriteState;
  onRetry: () => void;
  onGrade: (grade: Grade) => void;
}) {
  const { t } = useI18n();
  const answered = picked !== null;
  const correct = picked === card.answer;

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

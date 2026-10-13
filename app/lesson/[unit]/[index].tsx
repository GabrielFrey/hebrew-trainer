import { useMemo, useRef, useState } from 'react';
import { Alert, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { AudioButton } from '@/components/AudioButton';
import { Button, ChoiceRow } from '@/components/Button';
import { ChatBubble } from '@/components/ChatBubble';
import { Confetti } from '@/components/Confetti';
import { EmptyState } from '@/components/EmptyState';
import { FeedbackSheet } from '@/components/FeedbackSheet';
import { HebrewKeyboard } from '@/components/HebrewKeyboard';
import { HebrewText } from '@/components/HebrewText';
import { PointedHebrew } from '@/components/PointedHebrew';
import { Mascot } from '@/components/Mascot';
import { ProgressBar } from '@/components/Stat';
import { AppText, Screen, Surface } from '@/components/Themed';
import { TranslationToggle } from '@/components/TranslationToggle';
import { radius, spacing } from '@/constants/tokens';
import { hasRecording } from '@/lib/audio';
import { getWord } from '@/lib/data';
import { answersMatch } from '@/lib/hebrew-script';
import { displayAnswer, displayOptions, exampleGloss, wordGloss } from '@/lib/i18n';
import { getDialogue, lessonKeyFromSlug, lessonPath, parseLessonId } from '@/lib/lexicon';
import { buildLesson, exerciseNeedsAudio, nextLessonId } from '@/lib/lessons';
import { reportExercise } from '@/lib/reports';
import { showTranscription } from '@/lib/levels';
import { isTypedExercise } from '@/lib/recall';
import { getVerb } from '@/lib/verbs';
import { playSfx } from '@/lib/sfx';
import { useStore } from '@/lib/store';
import { usePalette } from '@/lib/theme';
import type { SessionCard, UiLanguage } from '@/lib/types';
import { useI18n } from '@/lib/use-i18n';
import { lessonXp } from '@/lib/xp';

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
    case 'type-word':
      return t('lesson.type');
    case 'cloze-example':
      return t('lesson.cloze');
    case 'gender-agree':
      return t('lesson.gender');
    case 'form-verb':
      return t('lesson.form');
    default:
      return t('lesson.pickGloss');
  }
}

function buzz(ok: boolean) {
  if (Platform.OS === 'web') return;
  void Haptics.notificationAsync(
    ok ? Haptics.NotificationFeedbackType.Success : Haptics.NotificationFeedbackType.Warning
  );
}

function Options({
  card,
  picked,
  checked,
  onPick,
  translation,
}: {
  card: SessionCard;
  picked: string | null;
  checked: boolean;
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
        const state = !checked
          ? picked === option
            ? 'selected'
            : 'idle'
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
            disabled={checked}
            onPress={() => onPick(option)}
          >
            <View style={{ flex: 1 }}>
              <AppText variant="heading" style={{ flexShrink: 1 }}>
                {primary}
              </AppText>
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
  const { t, translation } = useI18n();
  const startedAt = useRef(Date.now());
  const finishedRef = useRef(false);
  const queue = useMemo(
    () =>
      buildLesson(progress, lessonKey).filter((item) => {
        if (!exerciseNeedsAudio(item.exercise)) return true;
        const audioWord = getWord(item.refId);
        return hasRecording(audioWord?.audio);
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [lessonKey, progress.settings.level]
  );
  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [typed, setTyped] = useState('');
  const [built, setBuilt] = useState<string[]>([]);
  const [checked, setChecked] = useState(false);
  const [lastOk, setLastOk] = useState(true);
  const [score, setScore] = useState({ correct: 0, total: 0 });

  const card = queue[index];
  const word = card?.kind === 'word' ? getWord(card.refId) : undefined;
  const dialogue = card?.dialogueId ? getDialogue(card.dialogueId) : undefined;
  const answer = card ? displayAnswer(card, translation) : '';
  const soundsOn = progress.settings.soundEnabled !== false;

  const commitFinish = () => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    completeLesson(lessonKey);
    const elapsed = Math.max(1, Math.round((Date.now() - startedAt.current) / 1000));
    finishSession(score.total || queue.length, score.correct, elapsed);
  };

  const goNext = () => {
    setPicked(null);
    setTyped('');
    setBuilt([]);
    setChecked(false);
    setIndex((value) => value + 1);
  };

  const applyResult = (ok: boolean) => {
    if (
      card &&
      card.kind === 'word' &&
      ['word-he-ru', 'listen-choice', 'type-word', 'cloze-example', 'gender-agree', 'form-verb'].includes(
        card.exercise
      )
    ) {
      gradeCard('word', card.refId, ok ? 'good' : 'again');
    }
    setScore((s) => ({ correct: s.correct + (ok ? 1 : 0), total: s.total + 1 }));
    setLastOk(ok);
    setChecked(true);
    playSfx(ok ? 'correct' : 'wrong', soundsOn);
    buzz(ok);
  };

  const checkChoice = () => {
    if (!card || picked === null || checked) return;
    applyResult(picked === answer);
  };

  const checkBuild = () => {
    if (!card || checked) return;
    applyResult(built.join(' ') === card.answer);
  };

  const checkTyped = () => {
    if (!card || checked) return;
    applyResult(answersMatch(typed, card.answer));
  };

  if (queue.length === 0) {
    return (
      <Screen>
        <EmptyState
          title={t('notFound.title')}
          description={t('notFound.body')}
          actionLabel={t('common.back')}
          onAction={() => router.back()}
        />
      </Screen>
    );
  }

  if (!card) {
    commitFinish();
    const seconds = Math.max(1, Math.round((Date.now() - startedAt.current) / 1000));
    const pct = score.total ? Math.round((score.correct / score.total) * 100) : 100;
    const xp = lessonXp(score.correct, score.total || queue.length);
    return (
      <Screen>
        <View style={styles.done} testID="lesson-finished">
          <Confetti play />
          <Mascot pose="cheer" size={160} />
          <AppText variant="title">{t('celebrate.title')}</AppText>
          <AppText variant="heading" tone="accent">
            {t('celebrate.xp', { count: xp })}
          </AppText>
          <AppText muted>{t('celebrate.accuracy', { pct })}</AppText>
          <AppText muted>{t('celebrate.time', { seconds })}</AppText>
          <AppText muted>
            {t('celebrate.streak', { count: Math.max(1, progress.streak.current) })}
          </AppText>
          <Button
            label={t('celebrate.next')}
            size="lg"
            onPress={() => {
              const nxt = nextLessonId(progress, progress.settings.level);
              const parsed = nxt ? parseLessonId(nxt) : null;
              if (parsed) {
                router.replace(lessonPath(parsed.unitId, parsed.index));
                return;
              }
              router.replace('/');
            }}
            style={styles.doneBtn}
          />
          <Button label={t('common.done')} variant="secondary" size="lg" onPress={() => router.replace('/')} />
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
      <View style={styles.top}>
        <Pressable
          accessibilityLabel={t('lesson.closeA11y')}
          accessibilityRole="button"
          onPress={() => {
            const leave = () => router.replace('/');
            if (Platform.OS === 'web') {
              if (window.confirm(`${t('lesson.exitTitle')}\n${t('lesson.exitBody')}`)) leave();
              return;
            }
            Alert.alert(t('lesson.exitTitle'), t('lesson.exitBody'), [
              { text: t('lesson.stay'), style: 'cancel' },
              { text: t('lesson.exit'), style: 'destructive', onPress: leave },
            ]);
          }}
          hitSlop={8}
          style={[styles.close, { backgroundColor: palette.surface }]}
        >
          <Feather name="x" size={20} color={palette.text} />
        </Pressable>
        <View style={styles.progress}>
          <ProgressBar value={index} total={queue.length} />
        </View>
        <TranslationToggle />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        testID={`lesson-card-${card.exercise}`}
      >
        <AppText variant="heading" testID="lesson-prompt">
          {promptFor(card.exercise, t)}
        </AppText>
        <AppText testID="lesson-answer" nativeID="lesson-answer" style={styles.srOnly}>
          {answer}
        </AppText>

        {card.exercise === 'teach-word' && word ? (
          <Surface style={styles.card}>
            <AppText variant="title">{word.emoji}</AppText>
            <PointedHebrew
              nikud={word.nikud}
              hebrew={word.hebrew}
              card={progress.cards[`word:${word.id}`]}
              id={`word:${word.id}`}
            />
            {showTranscription(progress.settings.level) ? (
              <AppText muted>{word.transcription}</AppText>
            ) : null}
            <AppText variant="heading">{wordGloss(word, translation)}</AppText>
            {exampleGloss(word.example, translation) ? (
              <AppText>{exampleGloss(word.example, translation)}</AppText>
            ) : null}
            <AudioButton audio={word.audio} />
          </Surface>
        ) : null}

        {showWordFace && card.exercise !== 'teach-word' && word ? (
          <Surface style={styles.card}>
            {card.exercise === 'word-ru-he' ? (
              <HebrewText size="card" align="center">
                {wordGloss(word, translation)}
              </HebrewText>
            ) : (
              <PointedHebrew
                nikud={word.nikud}
                hebrew={word.hebrew}
                card={progress.cards[`word:${word.id}`]}
                id={`word:${word.id}`}
              />
            )}
            {card.exercise !== 'word-ru-he' && showTranscription(progress.settings.level) ? (
              <AppText muted>{word.transcription}</AppText>
            ) : null}
            <AudioButton audio={word.audio} />
          </Surface>
        ) : null}

        {card.exercise === 'listen-choice' && word ? (
          <Surface style={styles.card}>
            <Mascot pose="think" size={88} />
            <AppText variant="heading">{t('common.listen')}</AppText>
            <AudioButton audio={word.audio} />
          </Surface>
        ) : null}

        {card.exercise === 'build-phrase' ? (
          <View style={styles.block}>
            <AppText variant="heading">
              {t('lesson.buildPrompt', {
                text:
                  translation === 'en'
                    ? card.bilingualAnswer?.en ?? t('lesson.tapChips')
                    : card.bilingualAnswer?.ru ?? t('lesson.tapChips'),
              })}
            </AppText>
            <AppText muted>{t('lesson.tapChips')}</AppText>
            <Surface style={styles.built} testID="lesson-built">
              {built.length === 0 ? (
                <HebrewText size="chip">…</HebrewText>
              ) : (
                <View style={styles.chips}>
                  {built.map((chip, builtIndex) => (
                    <Pressable
                      key={`${chip}-built-${builtIndex}`}
                      accessibilityRole="button"
                      accessibilityLabel={chip}
                      accessibilityLanguage="he"
                      disabled={checked}
                      onPress={() =>
                        setBuilt((value) => value.filter((_, index) => index !== builtIndex))
                      }
                      style={[styles.chipShadow, { backgroundColor: palette.banner }]}
                    >
                      <View style={[styles.chip, { backgroundColor: palette.surface, borderColor: palette.banner }]}>
                        <HebrewText size="chip">{chip}</HebrewText>
                      </View>
                    </Pressable>
                  ))}
                </View>
              )}
            </Surface>
            <View style={styles.chips}>
              {(card.chips ?? []).map((chip, chipIndex) => {
                const used = built.filter((item) => item === chip).length;
                const total = (card.chips ?? []).filter((item) => item === chip).length;
                const disabled = used >= total;
                return (
                  <Pressable
                    key={`${chip}-${chipIndex}`}
                    testID={`lesson-chip-${chipIndex}`}
                    accessibilityRole="button"
                    accessibilityLabel={chip}
                    accessibilityLanguage="he"
                    disabled={checked || disabled}
                    onPress={() => setBuilt((value) => [...value, chip])}
                    style={[styles.chipShadow, { backgroundColor: disabled ? palette.locked : palette.border }]}
                  >
                    <View
                      style={[
                        styles.chip,
                        {
                          borderColor: palette.border,
                          backgroundColor: disabled ? palette.surfaceAlt : palette.surface,
                        },
                      ]}
                    >
                      <HebrewText size="chip">{chip}</HebrewText>
                    </View>
                  </Pressable>
                );
              })}
            </View>
            <Button label={t('session.retry')} variant="ghost" onPress={() => setBuilt([])} />
          </View>
        ) : null}

        {card.exercise === 'type-word' && word ? (
          <Surface style={styles.card}>
            <AppText variant="heading">{wordGloss(word, translation)}</AppText>
            <AppText variant="caption" muted>
              {t('session.prompt.typeHint')}
            </AppText>
            <HebrewKeyboard value={typed} onChange={setTyped} disabled={checked} />
          </Surface>
        ) : null}

        {card.exercise === 'cloze-example' ? (
          <Surface style={styles.card}>
            <HebrewText size="inline" align="center">
              {card.promptHe ?? '____'}
            </HebrewText>
            <AppText variant="caption" muted>
              {t('session.prompt.typeHint')}
            </AppText>
            <HebrewKeyboard value={typed} onChange={setTyped} disabled={checked} />
          </Surface>
        ) : null}

        {card.exercise === 'form-verb' ? (
          <Surface style={styles.card}>
            <AppText>
              {t(`verbs.form.${card.formTense ?? 'present'}`)}
              {card.formSlot && card.formTense !== 'infinitive' ? ` · ${t(`verbs.person.${card.formSlot}`)}` : ''}
            </AppText>
            {card.bilingualAnswer ? (
              <AppText muted>
                {translation === 'en' ? card.bilingualAnswer.en : card.bilingualAnswer.ru}
              </AppText>
            ) : null}
            {getVerb(card.verbId ?? '') ? (
              <AppText variant="caption" muted>
                {t('verbs.root', { root: getVerb(card.verbId ?? '')?.root ?? '' })}
              </AppText>
            ) : null}
            {(card.options?.length ?? 0) === 0 ? (
              <HebrewKeyboard value={typed} onChange={setTyped} disabled={checked} />
            ) : null}
          </Surface>
        ) : null}

        {card.exercise === 'gender-agree' && card.promptHe ? (
          <AppText muted>
            {translation === 'en' ? card.promptHe.split('|||')[1] : card.promptHe.split('|||')[0]}
          </AppText>
        ) : null}

        {card.exercise === 'dialogue-reply' && dialogue ? (
          <View style={styles.block}>
            {dialogue.lines.map((line, lineIndex) => (
              <ChatBubble
                key={lineIndex}
                speaker={line.speaker}
                hebrew={line.nikud}
                gloss={translation === 'en' ? line.en : line.ru}
              />
            ))}
          </View>
        ) : null}

        {card.exercise !== 'teach-word' &&
        card.exercise !== 'build-phrase' &&
        card.exercise !== 'type-word' &&
        card.exercise !== 'cloze-example' &&
        !(card.exercise === 'form-verb' && (card.options?.length ?? 0) === 0) ? (
          <Options
            card={card}
            picked={picked}
            checked={checked}
            onPick={setPicked}
            translation={translation}
          />
        ) : null}
      </ScrollView>

      {checked ? (
        <FeedbackSheet
          key={card.cardId}
          visible
          ok={lastOk}
          answer={answer}
          hebrew={word?.nikud}
          transcription={word && showTranscription(progress.settings.level) ? word.transcription : undefined}
          onContinue={goNext}
          onReport={
            lastOk
              ? undefined
              : () => {
                  void reportExercise({
                    at: Date.now(),
                    lessonKey,
                    cardId: card.cardId,
                    exercise: card.exercise,
                    refId: card.refId,
                    answer,
                  });
                }
          }
        />
      ) : (
        <View style={styles.footer}>
          {card.exercise === 'teach-word' ? (
            <Button label={t('lesson.gotIt')} size="lg" onPress={goNext} />
          ) : (
            <Button
              label={t('lesson.check')}
              size="lg"
              disabled={
                card.exercise === 'build-phrase'
                  ? built.length === 0
                  : isTypedExercise(card.exercise) && (card.options?.length ?? 0) === 0
                    ? typed.trim().length === 0
                    : picked === null
              }
              onPress={
                card.exercise === 'build-phrase'
                  ? checkBuild
                  : isTypedExercise(card.exercise) && (card.options?.length ?? 0) === 0
                    ? checkTyped
                    : checkChoice
              }
            />
          )}
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  top: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  close: {
    alignItems: 'center',
    borderRadius: radius.pill,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  progress: { flex: 1 },
  content: { gap: spacing.lg, padding: spacing.lg, paddingBottom: spacing.xxl },
  card: { alignItems: 'center', gap: spacing.sm },
  block: { gap: spacing.md },
  options: { gap: spacing.md },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chipShadow: { borderRadius: radius.md, paddingBottom: 3 },
  chip: {
    borderRadius: radius.md,
    borderWidth: 2,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  built: { minHeight: 64, justifyContent: 'center' },
  footer: { padding: spacing.lg },
  done: { alignItems: 'center', flex: 1, gap: spacing.sm, justifyContent: 'center', padding: spacing.lg },
  doneBtn: { marginTop: spacing.lg, minWidth: 220 },
  srOnly: { height: 0, overflow: 'hidden', opacity: 0, position: 'absolute' },
});

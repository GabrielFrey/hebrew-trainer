import { useCallback, useMemo, useRef, useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { Button, ChoiceRow } from '@/components/Button';
import { EmptyState } from '@/components/EmptyState';
import { HebrewText } from '@/components/HebrewText';
import { SpeakButton } from '@/components/SpeakButton';
import { ProgressBar } from '@/components/Stat';
import { AppText, Screen, Surface } from '@/components/Themed';
import { spacing } from '@/constants/theme';
import { getLetter, getPhrase, getWord } from '@/lib/data';
import { buildSession } from '@/lib/session';
import { useStore } from '@/lib/store';
import { usePalette } from '@/lib/theme';
import type { Grade, SessionCard } from '@/lib/types';

function tap(success: boolean) {
  if (Platform.OS === 'web') return;
  void Haptics.notificationAsync(
    success ? Haptics.NotificationFeedbackType.Success : Haptics.NotificationFeedbackType.Warning
  );
}

export default function SessionScreen() {
  const router = useRouter();
  const palette = usePalette();
  const { ahead } = useLocalSearchParams<{ ahead?: string }>();
  const { progress, gradeCard, finishSession } = useStore();

  const initialQueue = useMemo(
    () => buildSession(progress, Date.now(), { allowAhead: ahead === '1' }),
    // Built once per session so that grading does not reshuffle the queue.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const [queue, setQueue] = useState<SessionCard[]>(initialQueue);
  const [position, setPosition] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [revealed, setRevealed] = useState(false);
  const totals = useRef({ reviewed: 0, correct: 0 });
  const [done, setDone] = useState(false);

  const current = queue[position];

  const advance = useCallback(
    (card: SessionCard, grade: Grade) => {
      gradeCard(card.kind, card.refId, grade);
      totals.current.reviewed += 1;
      if (grade !== 'again') totals.current.correct += 1;

      // A wrong answer resets the interval and sends the card to the queue tail.
      const retry = grade === 'again';
      setQueue((currentQueue) => (retry ? [...currentQueue, { ...card, isNew: false }] : currentQueue));
      setPicked(null);
      setRevealed(false);
      setPosition((value) => {
        const nextIndex = value + 1;
        if (!retry && nextIndex >= queue.length) {
          finishSession(totals.current.reviewed, totals.current.correct);
          setDone(true);
        }
        return nextIndex;
      });
    },
    [finishSession, gradeCard, queue.length]
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
            title="Очередь пуста"
            description="Все карточки повторены. Возвращайтесь завтра — или пройдите повторения досрочно с экрана «Сегодня»."
            actionLabel="Закрыть"
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
              «Молодец» — коль ха-кавод
            </AppText>
            <AppText variant="title" style={styles.centered}>
              Сессия закончена
            </AppText>
            <AppText muted style={styles.centered}>
              Ответов: {totals.current.reviewed} · точность {accuracyPct}% · серия{' '}
              {progress.streak.current}
            </AppText>
            <Button label="Готово" size="lg" onPress={() => router.back()} style={styles.cta} />
          </Surface>
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <View style={styles.topBar}>
        <Pressable
          accessibilityLabel="Закрыть тренировку"
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
              Новая карточка
            </AppText>
          </View>
        ) : null}

        <CardBody
          card={current}
          picked={picked}
          revealed={revealed}
          onReveal={() => setRevealed(true)}
          onPick={(value) => {
            setPicked(value);
            tap(value === current.answer);
          }}
        />

        <Footer
          card={current}
          picked={picked}
          revealed={revealed}
          onReveal={() => setRevealed(true)}
          onGrade={(grade) => advance(current, grade)}
        />
      </ScrollView>
    </Screen>
  );
}

function promptFor(card: SessionCard): { title: string; hint?: string } {
  switch (card.exercise) {
    case 'letter-recognise':
      return { title: 'Какая это буква?' };
    case 'letter-write':
      return { title: 'Напишите букву', hint: 'От руки, затем сверьтесь' };
    case 'word-he-ru':
      return { title: 'Что означает слово?' };
    case 'word-ru-he':
      return { title: 'Выберите написание' };
    case 'phrase-translate':
      return { title: 'Выберите перевод фразы' };
  }
}

function CardBody({
  card,
  picked,
  revealed,
  onReveal,
  onPick,
}: {
  card: SessionCard;
  picked: string | null;
  revealed: boolean;
  onReveal: () => void;
  onPick: (value: string) => void;
}) {
  const prompt = promptFor(card);
  const answered = picked !== null;

  const letter = card.kind === 'letter' ? getLetter(card.refId) : undefined;
  const word = card.kind === 'word' ? getWord(card.refId) : undefined;
  const phrase = card.kind === 'phrase' ? getPhrase(card.refId) : undefined;

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

      <Surface style={styles.stage}>
        {card.exercise === 'letter-recognise' && letter ? (
          <>
            <HebrewText size="glyph" align="center">
              {letter.char}
            </HebrewText>
            {card.isNew ? (
              <AppText variant="label" muted>
                {letter.nameRu} · {letter.sound}
              </AppText>
            ) : null}
            <SpeakButton text={letter.name} label="Название" />
          </>
        ) : null}

        {card.exercise === 'letter-write' && letter ? (
          <>
            <AppText variant="title">{letter.nameRu}</AppText>
            <AppText muted style={styles.centered}>
              {letter.sound}
            </AppText>
            {revealed ? (
              <>
                <HebrewText size="glyph" align="center">
                  {letter.char}
                </HebrewText>
                {letter.finalChar ? (
                  <AppText variant="caption" muted>
                    Конечная форма: {letter.finalChar}
                  </AppText>
                ) : null}
              </>
            ) : (
              <Pressable onPress={onReveal} style={styles.hidden}>
                <AppText muted>Нажмите, чтобы проверить себя</AppText>
              </Pressable>
            )}
          </>
        ) : null}

        {card.exercise === 'word-he-ru' && word ? (
          <>
            <HebrewText size="card" align="center">
              {word.nikud}
            </HebrewText>
            {card.isNew || answered ? (
              <AppText variant="label" muted>
                {word.translitRu} · {word.translit}
              </AppText>
            ) : null}
            <SpeakButton text={word.nikud} />
          </>
        ) : null}

        {card.exercise === 'word-ru-he' && word ? (
          <>
            <AppText variant="title" style={styles.centered}>
              {word.ru}
            </AppText>
            <AppText variant="caption" muted>
              {word.pos}
            </AppText>
          </>
        ) : null}

        {card.exercise === 'phrase-translate' && phrase ? (
          <>
            <HebrewText size="card">{phrase.nikud}</HebrewText>
            {answered ? (
              <AppText variant="caption" muted>
                {phrase.translit}
              </AppText>
            ) : null}
            <SpeakButton text={phrase.nikud} label="Прослушать" />
          </>
        ) : null}
      </Surface>

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
            return (
              <ChoiceRow
                key={option}
                state={state}
                disabled={answered}
                onPress={() => onPick(option)}
              >
                {card.exercise === 'word-ru-he' ? (
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
  revealed,
  onReveal,
  onGrade,
}: {
  card: SessionCard;
  picked: string | null;
  revealed: boolean;
  onReveal: () => void;
  onGrade: (grade: Grade) => void;
}) {
  const answered = picked !== null;
  const correct = picked === card.answer;

  if (card.exercise === 'letter-write') {
    if (!revealed) {
      return (
        <View style={styles.footer}>
          <Button label="Показать букву" size="lg" onPress={onReveal} />
        </View>
      );
    }
    return (
      <View style={styles.footerRow}>
        <Button
          label="Ошибся"
          variant="danger"
          onPress={() => onGrade('again')}
          style={styles.footerButton}
        />
        <Button
          label="Написал верно"
          onPress={() => onGrade('good')}
          style={styles.footerButton}
        />
      </View>
    );
  }

  if (!answered) {
    return (
      <View style={styles.footer}>
        <AppText variant="caption" muted style={styles.centered}>
          Выберите вариант
        </AppText>
      </View>
    );
  }

  if (!correct) {
    return (
      <View style={styles.footer}>
        <AppText variant="label" tone="danger">
          Не угадали. Карточка вернётся в конец очереди.
        </AppText>
        <Button label="Понятно" size="lg" onPress={() => onGrade('again')} />
      </View>
    );
  }

  return (
    <View style={styles.footer}>
      <AppText variant="label" tone="success">
        Верно! Как далось?
      </AppText>
      <View style={styles.footerRow}>
        <Button
          label="С трудом"
          variant="secondary"
          onPress={() => onGrade('hard')}
          style={styles.footerButton}
        />
        <Button label="Нормально" onPress={() => onGrade('good')} style={styles.footerButton} />
        <Button
          label="Легко"
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
  hidden: { paddingVertical: spacing.xl },
  options: { gap: spacing.md },
  optionText: { flex: 1 },
  optionHebrew: { flex: 1 },
  footer: { gap: spacing.md },
  footerRow: { flexDirection: 'row', gap: spacing.sm },
  footerButton: { flex: 1 },
});

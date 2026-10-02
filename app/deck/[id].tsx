import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useLocalSearchParams, useNavigation, useRouter } from 'expo-router';

import { Button } from '@/components/Button';
import { EmptyState } from '@/components/EmptyState';
import { HebrewText } from '@/components/HebrewText';
import { AudioButton } from '@/components/AudioButton';
import { AppText, Screen, Surface } from '@/components/Themed';
import { radius, spacing } from '@/constants/theme';
import { getDeck, wordsInDeck } from '@/lib/data';
import { isLearned } from '@/lib/srs';
import { useStore } from '@/lib/store';
import { usePalette } from '@/lib/theme';
import { hasFeature } from '@/lib/levels';

export default function DeckScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const navigation = useNavigation();
  const palette = usePalette();
  const { progress } = useStore();
  const [showTranslation, setShowTranslation] = useState(true);

  const deck = getDeck(id ?? '');

  useEffect(() => {
    if (deck) navigation.setOptions({ title: deck.title });
  }, [deck, navigation]);

  if (!deck) {
    return (
      <Screen edges={['left', 'right']}>
        <EmptyState
          icon="alert-circle"
          title="Колода не найдена"
          description="Возможно, она ещё не добавлена в data/hebrew.json."
          actionLabel="Назад"
          onAction={() => router.back()}
        />
      </Screen>
    );
  }

  const items = wordsInDeck(deck.id);
  const showRoots = hasFeature(progress.settings.level, 'root');

  return (
    <Screen edges={['left', 'right']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.head}>
          <AppText muted>{deck.subtitle}</AppText>
          <View style={styles.headActions}>
            <Button
              label={showTranslation ? 'Скрыть перевод' : 'Показать перевод'}
              variant="secondary"
              onPress={() => setShowTranslation((value) => !value)}
            />
          </View>
        </View>

        {items.length === 0 ? (
          <EmptyState
            icon="inbox"
            title="Колода пока пустая"
            description="Слова появятся, когда их добавят в data/hebrew.json с проверенным никудом."
          />
        ) : (
          items.map((word) => {
            const card = progress.cards[`word:${word.id}`];
            const learned = card ? isLearned(card) : false;
            return (
              <Surface key={word.id} style={styles.card}>
                <View style={styles.cardTop}>
                  <View style={styles.hebrewColumn}>
                    <HebrewText size="card">{word.nikud}</HebrewText>
                    <HebrewText size="inline" muted>
                      {word.hebrew}
                    </HebrewText>
                  </View>
                  <AudioButton audio={word.audio} compact />
                </View>

                <AppText variant="label" muted>
                  {word.transcription}
                </AppText>

                {showTranslation ? (
                  <AppText variant="heading">{word.ru}</AppText>
                ) : (
                  <AppText muted>Перевод скрыт</AppText>
                )}

                {showRoots && word.root ? (
                  <AppText variant="caption" muted>
                    корень {word.root}
                    {word.synonyms ? ` · синонимы: ${word.synonyms.join(', ')}` : ''}
                  </AppText>
                ) : null}
                {word.literal ? (
                  <AppText variant="caption" muted>
                    буквально: {word.literal}
                  </AppText>
                ) : null}

                <View style={styles.cardMeta}>
                  <AppText variant="caption" muted>
                    {word.pos}
                  </AppText>
                  <View
                    style={[
                      styles.statusBadge,
                      {
                        backgroundColor: learned
                          ? `${palette.success}1F`
                          : card
                            ? `${palette.accent}1F`
                            : palette.surfaceAlt,
                      },
                    ]}
                  >
                    <AppText
                      variant="caption"
                      style={{
                        color: learned ? palette.success : card ? palette.accent : palette.textMuted,
                      }}
                    >
                      {learned ? 'выучено' : card ? 'в работе' : 'новое'}
                    </AppText>
                  </View>
                </View>
              </Surface>
            );
          })
        )}

        <Surface tone="alt" style={styles.note}>
          <AppText variant="caption" muted>
            В колоде {items.length} слов. Озвучка — только записями носителей; где записи ещё нет,
            кнопка так и показывает.
          </AppText>
        </Surface>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { gap: spacing.md, padding: spacing.lg, paddingBottom: spacing.xxl },
  head: { gap: spacing.md },
  headActions: { flexDirection: 'row' },
  card: { gap: spacing.sm },
  cardTop: { alignItems: 'flex-start', flexDirection: 'row', gap: spacing.md, justifyContent: 'space-between' },
  hebrewColumn: { alignItems: 'flex-end', flex: 1 },
  cardMeta: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  statusBadge: { borderRadius: radius.sm, paddingHorizontal: spacing.sm, paddingVertical: 2 },
  note: { marginTop: spacing.sm },
});

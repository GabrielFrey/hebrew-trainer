import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useLocalSearchParams, useNavigation, useRouter } from 'expo-router';

import { Button } from '@/components/Button';
import { EmptyState } from '@/components/EmptyState';
import { HebrewText } from '@/components/HebrewText';
import { AudioButton } from '@/components/AudioButton';
import { AppText, Screen, Surface } from '@/components/Themed';
import { TranslationToggle } from '@/components/TranslationToggle';
import { radius, spacing } from '@/constants/theme';
import { getDeck, wordsInDeck } from '@/lib/data';
import { deckSubtitle, deckTitle, posLabel, wordGloss } from '@/lib/i18n';
import { isLearned } from '@/lib/srs';
import { useStore } from '@/lib/store';
import { usePalette } from '@/lib/theme';
import { hasFeature } from '@/lib/levels';
import { useI18n } from '@/lib/use-i18n';

export default function DeckScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const navigation = useNavigation();
  const palette = usePalette();
  const { progress } = useStore();
  const { t, lang, translation } = useI18n();
  const [showTranslation, setShowTranslation] = useState(true);

  const deck = getDeck(id ?? '');

  useEffect(() => {
    if (deck) navigation.setOptions({ title: deckTitle(deck, lang) });
  }, [deck, lang, navigation]);

  if (!deck) {
    return (
      <Screen edges={['left', 'right']}>
        <EmptyState
          icon="alert-circle"
          title={t('deck.missing')}
          description={t('deck.missingHint')}
          actionLabel={t('common.back')}
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
          <AppText muted>{deckSubtitle(deck, lang)}</AppText>
          <View style={styles.headActions}>
            <TranslationToggle />
            <Button
              label={showTranslation ? t('deck.hideTranslation') : t('deck.showTranslation')}
              variant="secondary"
              onPress={() => setShowTranslation((value) => !value)}
            />
          </View>
        </View>

        {items.length === 0 ? (
          <EmptyState
            icon="inbox"
            title={t('deck.empty')}
            description={t('deck.emptyHint')}
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
                  <AppText variant="heading">{wordGloss(word, translation)}</AppText>
                ) : (
                  <AppText muted>{t('deck.hidden')}</AppText>
                )}

                {showRoots && word.root ? (
                  <AppText variant="caption" muted>
                    {t('common.root', { root: word.root })}
                    {word.synonyms ? ` · ${t('common.synonyms', { list: word.synonyms.join(', ') })}` : ''}
                  </AppText>
                ) : null}
                {word.literal ? (
                  <AppText variant="caption" muted>
                    {t('common.literal', { text: word.literal })}
                  </AppText>
                ) : null}

                <View style={styles.cardMeta}>
                  <AppText variant="caption" muted>
                    {posLabel(word.pos, lang)}
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
                      {learned ? t('deck.learned') : card ? t('deck.learning') : t('deck.new')}
                    </AppText>
                  </View>
                </View>
              </Surface>
            );
          })
        )}

        <Surface tone="alt" style={styles.note}>
          <AppText variant="caption" muted>
            {t('deck.note', { count: items.length })}
          </AppText>
        </Surface>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { gap: spacing.md, padding: spacing.lg, paddingBottom: spacing.xxl },
  head: { gap: spacing.md },
  headActions: { alignItems: 'center', flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  card: { gap: spacing.sm },
  cardTop: { alignItems: 'flex-start', flexDirection: 'row', gap: spacing.md, justifyContent: 'space-between' },
  hebrewColumn: { alignItems: 'flex-end', flex: 1 },
  cardMeta: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  statusBadge: { borderRadius: radius.sm, paddingHorizontal: spacing.sm, paddingVertical: 2 },
  note: { marginTop: spacing.sm },
});

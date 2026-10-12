import { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { HebrewText } from '@/components/HebrewText';
import { ScreenHeader } from '@/components/ScreenHeader';
import { ProgressBar } from '@/components/Stat';
import { AppText, Screen, Surface } from '@/components/Themed';
import { radius, spacing } from '@/constants/theme';
import { words as allWords, wordsInDeck } from '@/lib/data';
import { decksForLevel } from '@/lib/levels';
import { isLearned } from '@/lib/srs';
import { deckSubtitle, deckTitle } from '@/lib/i18n';
import { useStore } from '@/lib/store';
import { usePalette } from '@/lib/theme';
import type { Deck } from '@/lib/types';
import { useI18n } from '@/lib/use-i18n';

const deckIcon: Record<string, keyof typeof Feather.glyphMap> = {
  star: 'star',
  hash: 'hash',
  users: 'users',
  coffee: 'coffee',
  activity: 'activity',
};

export default function WordsScreen() {
  const router = useRouter();
  const palette = usePalette();
  const { progress } = useStore();
  const { t, lang } = useI18n();

  const unlocked = decksForLevel(progress.settings.level);

  const rows = useMemo(
    () =>
      unlocked.map((deck: Deck) => {
        const items = wordsInDeck(deck.id);
        const learned = items.filter((w) => {
          const card = progress.cards[`word:${w.id}`];
          return card ? isLearned(card) : false;
        }).length;
        return { deck, total: items.length, learned, preview: items.slice(0, 3) };
      }),
    [progress.cards, unlocked]
  );

  const totalWords = rows.reduce((sum, row) => sum + row.total, 0);
  const totalLearned = rows.reduce((sum, row) => sum + row.learned, 0);

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <ScreenHeader
          title={t('tabs.words')}
          subtitle={t('words.subtitle', {
            open: totalWords,
            total: allWords.length,
            learned: totalLearned,
          })}
        />

        <View style={styles.block}>
          {rows.map(({ deck, total, learned, preview }) => (
            <Pressable
              key={deck.id}
              accessibilityRole="button"
              onPress={() => router.push(`/deck/${deck.id}`)}
              style={({ pressed }) => [styles.deckWrap, { opacity: pressed ? 0.88 : 1 }]}
            >
              <Surface style={styles.deck}>
                <View style={styles.deckHead}>
                  <View style={[styles.deckIcon, { backgroundColor: palette.surfaceAlt }]}>
                    <Feather
                      name={deckIcon[deck.icon] ?? 'book'}
                      size={18}
                      color={palette.accent}
                    />
                  </View>
                  <View style={styles.deckTitles}>
                    <AppText variant="heading">{deckTitle(deck, lang)}</AppText>
                    <AppText variant="caption" muted>
                      {deckSubtitle(deck, lang)}
                    </AppText>
                  </View>
                  <Feather name="chevron-right" size={20} color={palette.textMuted} />
                </View>

                <HebrewText size="inline" numberOfLines={1}>
                  {preview.map((w) => w.nikud).join(' · ')}
                </HebrewText>

                <ProgressBar value={learned} total={total} tone="success" />
                <View style={styles.deckMeta}>
                  <AppText variant="caption" muted>
                    {t('words.learnedOf', { learned, total })}
                  </AppText>
                  <View style={[styles.badge, { backgroundColor: palette.surfaceAlt }]}>
                    <AppText variant="caption" muted>
                      {t('words.count', { count: total })}
                    </AppText>
                  </View>
                </View>
              </Surface>
            </Pressable>
          ))}
        </View>

        <View style={styles.block}>
          <Surface tone="alt" style={styles.note}>
            <AppText variant="label">{t('words.noteTitle')}</AppText>
            <AppText variant="caption" muted>
              {t('words.noteBody')}
            </AppText>
          </Surface>
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: spacing.xxl },
  block: { gap: spacing.md, paddingHorizontal: spacing.lg, paddingBottom: spacing.lg },
  deckWrap: { marginBottom: spacing.md },
  deck: { gap: spacing.md },
  deckHead: { alignItems: 'center', flexDirection: 'row', gap: spacing.md },
  deckIcon: {
    alignItems: 'center',
    borderRadius: radius.sm,
    height: 38,
    justifyContent: 'center',
    width: 38,
  },
  deckTitles: { flex: 1, gap: 2 },
  deckMeta: { alignItems: 'center', flexDirection: 'row', gap: spacing.sm, justifyContent: 'space-between' },
  badge: { borderRadius: radius.sm, paddingHorizontal: spacing.sm, paddingVertical: 2 },
  note: { gap: spacing.xs },
});

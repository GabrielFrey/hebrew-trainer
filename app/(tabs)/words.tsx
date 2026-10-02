import { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { HebrewText } from '@/components/HebrewText';
import { ScreenHeader } from '@/components/ScreenHeader';
import { ProgressBar } from '@/components/Stat';
import { AppText, Screen, Surface } from '@/components/Themed';
import { radius, spacing } from '@/constants/theme';
import { decks, wordsInDeck } from '@/lib/data';
import { isLearned } from '@/lib/srs';
import { useStore } from '@/lib/store';
import { usePalette } from '@/lib/theme';
import type { Deck } from '@/lib/types';

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

  const rows = useMemo(
    () =>
      decks.map((deck: Deck) => {
        const items = wordsInDeck(deck.id);
        const learned = items.filter((w) => {
          const card = progress.cards[`word:${w.id}`];
          return card ? isLearned(card) : false;
        }).length;
        return { deck, total: items.length, learned, preview: items.slice(0, 3) };
      }),
    [progress.cards]
  );

  const totalWords = rows.reduce((sum, row) => sum + row.total, 0);
  const totalLearned = rows.reduce((sum, row) => sum + row.learned, 0);

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <ScreenHeader
          title="Слова"
          subtitle={`${totalWords} слов в приложении · выучено ${totalLearned}`}
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
                    <AppText variant="heading">{deck.title}</AppText>
                    <AppText variant="caption" muted>
                      {deck.subtitle}
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
                    Выучено {learned} из {total}
                  </AppText>
                  {total < deck.plannedSize ? (
                    <View style={[styles.badge, { backgroundColor: `${palette.warning}1F` }]}>
                      <AppText variant="caption" style={{ color: palette.warning }}>
                        колода пополняется
                      </AppText>
                    </View>
                  ) : null}
                </View>
              </Surface>
            </Pressable>
          ))}
        </View>

        <View style={styles.block}>
          <Surface tone="alt" style={styles.note}>
            <AppText variant="label">Откуда берутся слова</AppText>
            <AppText variant="caption" muted>
              Все формы с огласовками лежат в data/hebrew.json и выверены вручную. Приложение
              никогда не генерирует никуд само.
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

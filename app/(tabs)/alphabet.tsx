import { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';

import { Button } from '@/components/Button';
import { HebrewText } from '@/components/HebrewText';
import { ScreenHeader } from '@/components/ScreenHeader';
import { AppText, Screen, Surface } from '@/components/Themed';
import { radius, spacing } from '@/constants/theme';
import { letters, vowels } from '@/lib/data';
import { isLearned } from '@/lib/srs';
import { useStore } from '@/lib/store';
import { usePalette } from '@/lib/theme';

export default function AlphabetScreen() {
  const router = useRouter();
  const palette = usePalette();
  const { progress } = useStore();

  const statusById = useMemo(() => {
    const map = new Map<string, 'new' | 'learning' | 'learned'>();
    letters.forEach((letter) => {
      const card = progress.cards[`letter:${letter.id}`];
      if (!card) map.set(letter.id, 'new');
      else map.set(letter.id, isLearned(card) ? 'learned' : 'learning');
    });
    return map;
  }, [progress.cards]);

  const learnedCount = letters.filter((l) => statusById.get(l.id) === 'learned').length;

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <ScreenHeader
          title="Алфавит"
          subtitle={`22 буквы · выучено ${learnedCount}`}
        />

        <View style={styles.block}>
          <View style={styles.modes}>
            <Button
              label="Узнай букву"
              onPress={() => router.push('/drill/recognise')}
              style={styles.modeButton}
            />
            <Button
              label="Напиши букву"
              variant="secondary"
              onPress={() => router.push('/drill/write')}
              style={styles.modeButton}
            />
          </View>
        </View>

        <View style={styles.block}>
          <AppText variant="heading" style={styles.sectionTitle}>
            Буквы
          </AppText>
          <View style={styles.grid}>
            {letters.map((letter) => {
              const status = statusById.get(letter.id) ?? 'new';
              const accent =
                status === 'learned'
                  ? palette.success
                  : status === 'learning'
                    ? palette.accent
                    : palette.border;
              return (
                <Pressable
                  key={letter.id}
                  accessibilityRole="button"
                  accessibilityLabel={`Буква ${letter.nameRu}`}
                  onPress={() => router.push(`/letter/${letter.id}`)}
                  style={({ pressed }) => [
                    styles.cell,
                    {
                      backgroundColor: palette.surface,
                      borderColor: accent,
                      opacity: pressed ? 0.85 : 1,
                    },
                  ]}
                >
                  <HebrewText size={44} align="center" style={styles.cellGlyph}>
                    {letter.char}
                  </HebrewText>
                  <AppText variant="caption" muted>
                    {letter.nameRu}
                  </AppText>
                  {letter.finalChar ? (
                    <View style={[styles.finalTag, { backgroundColor: palette.surfaceAlt }]}>
                      <AppText variant="caption" muted>
                        конечная {letter.finalChar}
                      </AppText>
                    </View>
                  ) : null}
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={styles.block}>
          <AppText variant="heading" style={styles.sectionTitle}>
            Конечные формы
          </AppText>
          <Surface tone="alt" style={styles.finals}>
            <HebrewText size="card" align="center">
              ך ם ן ף ץ
            </HebrewText>
            <AppText muted>
              Каф, мем, нун, пей и цади меняют начертание в конце слова. Звук при этом не меняется.
            </AppText>
          </Surface>
        </View>

        <View style={styles.block}>
          <AppText variant="heading" style={styles.sectionTitle}>
            Огласовки (никуд)
          </AppText>
          <Surface padded={false}>
            {vowels.map((vowel, index) => (
              <View
                key={vowel.id}
                style={[
                  styles.vowelRow,
                  index > 0
                    ? { borderTopColor: palette.border, borderTopWidth: StyleSheet.hairlineWidth }
                    : null,
                ]}
              >
                <HebrewText size="inline" style={styles.vowelMark}>
                  {vowel.mark}
                </HebrewText>
                <View style={styles.vowelText}>
                  <AppText variant="label">{vowel.nameRu}</AppText>
                  <AppText variant="caption" muted>
                    {vowel.sound}
                  </AppText>
                </View>
              </View>
            ))}
          </Surface>
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: spacing.xxl },
  block: { paddingHorizontal: spacing.lg, paddingBottom: spacing.lg },
  modes: { flexDirection: 'row', gap: spacing.md },
  modeButton: { flex: 1 },
  sectionTitle: { marginBottom: spacing.md },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  cell: {
    alignItems: 'center',
    borderRadius: radius.md,
    borderWidth: 1.5,
    flexBasis: '30%',
    flexGrow: 1,
    gap: 2,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.md,
  },
  cellGlyph: { width: '100%' },
  finalTag: {
    borderRadius: radius.sm,
    marginTop: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  finals: { gap: spacing.md },
  vowelRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.lg,
    padding: spacing.lg,
  },
  vowelMark: { minWidth: 56 },
  vowelText: { flex: 1, gap: 2 },
});

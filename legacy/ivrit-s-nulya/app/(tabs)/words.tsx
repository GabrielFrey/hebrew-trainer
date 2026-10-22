import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { ScreenHeader } from '@/components/ScreenHeader';
import { ProgressBar } from '@/components/Stat';
import { AppText, Screen, Surface } from '@/components/Themed';
import { radius, spacing, unitBannerColors } from '@/constants/tokens';
import { getCatalog, lessonPath, themeById } from '@/lib/lexicon';
import { isLessonUnlocked, lessonProgress } from '@/lib/lessons';
import { themeTitle } from '@/lib/i18n';
import { useStore } from '@/lib/store';
import { usePalette } from '@/lib/theme';
import { useI18n } from '@/lib/use-i18n';

export default function LessonsScreen() {
  const router = useRouter();
  const palette = usePalette();
  const { progress } = useStore();
  const { t, lang } = useI18n();
  const units = getCatalog().units.filter((unit) => {
    const order = ['elementary', 'basic', 'intermediate', 'advanced', 'expert'] as const;
    return order.indexOf(unit.level) <= order.indexOf(progress.settings.level);
  });

  return (
    <Screen tabBar>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <ScreenHeader title={t('lessons.title')} subtitle={t('lessons.subtitle')} />
        <View style={styles.block}>
          {units.map((unit) => {
            const theme = themeById(unit.theme);
            const done = lessonProgress(progress, unit);
            const open = isLessonUnlocked(progress, unit, 0) || done > 0;
            const next = Math.min(done, unit.lessonCount - 1);
            return (
              <Pressable
                key={unit.id}
                accessibilityRole="button"
                onPress={() => {
                  if (!open) return;
                  router.push(lessonPath(unit.id, next));
                }}
                style={({ pressed }) => [{ opacity: pressed ? 0.88 : 1 }]}
              >
                <Surface
                  style={[
                    styles.card,
                    {
                      borderColor: open ? unitBannerColors[unit.order % unitBannerColors.length] : palette.locked,
                    },
                  ]}
                >
                  <View style={styles.row}>
                    <AppText variant="title">{theme?.emoji ?? '📘'}</AppText>
                    <View style={styles.meta}>
                      <AppText variant="heading">
                        {theme ? themeTitle(theme, lang) : unit.theme}
                      </AppText>
                      <AppText variant="caption" muted>
                        {t('lessons.of', { done, total: unit.lessonCount })}
                      </AppText>
                      <ProgressBar value={done} total={unit.lessonCount} />
                    </View>
                    <Feather
                      name={open ? 'chevron-right' : 'lock'}
                      size={18}
                      color={open ? palette.accent : palette.textMuted}
                    />
                  </View>
                  {!open ? (
                    <AppText variant="caption" muted>
                      {t('lessons.locked')}
                    </AppText>
                  ) : null}
                </Surface>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { gap: spacing.lg, padding: spacing.lg, paddingBottom: spacing.xxl },
  block: { gap: spacing.md },
  card: { gap: spacing.sm, borderWidth: StyleSheet.hairlineWidth, borderRadius: radius.md },
  row: { alignItems: 'center', flexDirection: 'row', gap: spacing.md },
  meta: { flex: 1, gap: 4 },
});

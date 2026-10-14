import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';

import { HebrewText } from '@/components/HebrewText';
import { ScreenHeader } from '@/components/ScreenHeader';
import { AppText, Screen, Surface } from '@/components/Themed';
import { radius, spacing } from '@/constants/tokens';
import { BINYANIM, allVerbs, verbsByBinyan } from '@/lib/verbs';
import { usePalette } from '@/lib/theme';
import { useI18n } from '@/lib/use-i18n';

export default function VerbsScreen() {
  const router = useRouter();
  const palette = usePalette();
  const { t, lang } = useI18n();
  const count = allVerbs().length;

  return (
    <Screen tabBar>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <ScreenHeader title={t('verbs.title')} subtitle={t('verbs.subtitle', { count })} />

        <AppText variant="heading">{t('verbs.binyanim')}</AppText>
        <View style={styles.block}>
          {BINYANIM.map((binyan) => {
            const verbs = verbsByBinyan(binyan.id);
            return (
              <Surface key={binyan.id} style={styles.binyan}>
                <HebrewText size="inline">{binyan.he}</HebrewText>
                <AppText variant="heading">{lang === 'en' ? binyan.nameEn : binyan.nameRu}</AppText>
                <AppText muted>{lang === 'en' ? binyan.en : binyan.ru}</AppText>
                <AppText variant="caption" muted>
                  {verbs.length}
                </AppText>
                <View style={styles.list}>
                  {verbs.map((verb) => (
                    <Pressable
                      key={verb.id}
                      accessibilityRole="button"
                      onPress={() => router.push(`/verb/${verb.id}`)}
                      style={({ pressed }) => [
                        styles.row,
                        { borderTopColor: palette.border, opacity: pressed ? 0.75 : 1 },
                      ]}
                    >
                      <View style={styles.meta}>
                        <HebrewText size="inline">{verb.forms.infinitive}</HebrewText>
                        <AppText variant="caption" muted>
                          {lang === 'en' ? verb.en : verb.ru}
                        </AppText>
                      </View>
                      <AppText variant="caption" muted>
                        {verb.root}
                      </AppText>
                    </Pressable>
                  ))}
                </View>
              </Surface>
            );
          })}
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { gap: spacing.lg, paddingBottom: spacing.xxl },
  block: { gap: spacing.md, paddingHorizontal: spacing.lg },
  binyan: { gap: spacing.sm },
  list: { marginTop: spacing.xs },
  row: {
    borderTopWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    gap: spacing.md,
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
  },
  meta: { flex: 1, gap: 2 },
});

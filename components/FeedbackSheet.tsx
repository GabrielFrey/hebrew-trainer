import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeInDown, FadeOutDown } from 'react-native-reanimated';

import { AppSymbol } from '@/components/AppSymbol';
import { Button } from '@/components/Button';
import { GlassSurface } from '@/components/GlassSurface';
import { HebrewText } from '@/components/HebrewText';
import { AppText } from '@/components/Themed';
import { radius, spacing } from '@/constants/tokens';
import { useReduceMotion } from '@/lib/motion';
import { usePalette } from '@/lib/theme';
import { useI18n } from '@/lib/use-i18n';

export function FeedbackSheet({
  visible,
  ok,
  answer,
  hebrew,
  transcription,
  onContinue,
  onReport,
}: {
  visible: boolean;
  ok: boolean;
  answer?: string;
  hebrew?: string;
  transcription?: string;
  onContinue: () => void;
  onReport?: () => void;
}) {
  const palette = usePalette();
  const { t } = useI18n();
  const reduce = useReduceMotion();
  const [reported, setReported] = useState(false);
  if (!visible) return null;

  const tint = ok ? palette.success : palette.danger;
  const tone = ok ? palette.successText : palette.dangerText;

  return (
    <Animated.View
      entering={reduce ? undefined : FadeInDown.springify().damping(18).stiffness(220)}
      exiting={reduce ? undefined : FadeOutDown.duration(160)}
    >
      <GlassSurface
        tintColor={ok ? '#58CC02' : '#C62828'}
        interactive
        testID={ok ? 'glass-sheet-ok' : 'glass-sheet-wrong'}
        style={styles.sheet}
        contentStyle={styles.inner}
      >
        <View style={styles.titleRow}>
          <AppSymbol
            sf={ok ? 'checkmark.circle.fill' : 'xmark.circle.fill'}
            fallback={ok ? 'check-circle' : 'x-circle'}
            size={22}
            color={tone}
          />
          <AppText variant="heading" style={{ color: tone }}>
            {ok ? t('lesson.awesome') : t('lesson.wrongTitle')}
          </AppText>
        </View>
        {!ok ? (
          <View style={[styles.answer, { backgroundColor: palette.surface, borderColor: tint }]}>
            {hebrew ? (
              <HebrewText size="inline" align="center">
                {hebrew}
              </HebrewText>
            ) : null}
            {transcription ? <AppText muted>{transcription}</AppText> : null}
            {answer ? <AppText variant="heading">{answer}</AppText> : null}
          </View>
        ) : null}
        <Button
          label={t('lesson.continue')}
          variant={ok ? 'success' : 'danger'}
          size="lg"
          glass
          onPress={onContinue}
        />
        {!ok && onReport ? (
          <Button
            label={reported ? t('lesson.reported') : t('lesson.report')}
            variant="ghost"
            disabled={reported}
            onPress={() => {
              if (reported) return;
              setReported(true);
              onReport();
            }}
          />
        ) : null}
      </GlassSurface>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  sheet: {
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
  },
  inner: {
    gap: spacing.sm,
    paddingBottom: spacing.xxl,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
  },
  titleRow: { alignItems: 'center', flexDirection: 'row', gap: spacing.sm },
  answer: {
    alignItems: 'center',
    borderRadius: radius.md,
    borderWidth: 2,
    gap: 4,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
});

import { StyleSheet, View } from 'react-native';
import Animated, { FadeInDown, FadeOutDown } from 'react-native-reanimated';

import { Button } from '@/components/Button';
import { AppText } from '@/components/Themed';
import { spacing } from '@/constants/tokens';
import { useReduceMotion } from '@/lib/motion';
import { usePalette } from '@/lib/theme';
import { useI18n } from '@/lib/use-i18n';

export function FeedbackSheet({
  visible,
  ok,
  answer,
  onContinue,
}: {
  visible: boolean;
  ok: boolean;
  answer?: string;
  onContinue: () => void;
}) {
  const palette = usePalette();
  const { t } = useI18n();
  const reduce = useReduceMotion();
  if (!visible) return null;

  return (
    <Animated.View
      entering={reduce ? undefined : FadeInDown.duration(220)}
      exiting={reduce ? undefined : FadeOutDown.duration(160)}
      style={[
        styles.sheet,
        { backgroundColor: ok ? palette.successSoft : palette.dangerSoft },
      ]}
    >
      <AppText variant="heading" style={{ color: ok ? palette.successText : palette.dangerText }}>
        {ok ? t('lesson.awesome') : t('lesson.wrongTitle')}
      </AppText>
      {!ok && answer ? (
        <AppText muted>
          {t('lesson.correctAnswer', { text: answer })}
        </AppText>
      ) : null}
      <Button
        label={t('lesson.continue')}
        variant={ok ? 'success' : 'danger'}
        size="lg"
        onPress={onContinue}
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  sheet: {
    gap: spacing.sm,
    paddingBottom: spacing.xxl,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
  },
});

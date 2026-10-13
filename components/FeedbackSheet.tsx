import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeInDown, FadeOutDown } from 'react-native-reanimated';
import { Feather } from '@expo/vector-icons';

import { Button } from '@/components/Button';
import { HebrewText } from '@/components/HebrewText';
import { AppText } from '@/components/Themed';
import { spacing } from '@/constants/tokens';
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

  return (
    <Animated.View
      entering={reduce ? undefined : FadeInDown.duration(220)}
      exiting={reduce ? undefined : FadeOutDown.duration(160)}
      style={[
        styles.sheet,
        { backgroundColor: ok ? palette.successSoft : palette.dangerSoft },
      ]}
    >
      <View style={styles.titleRow}>
        <Feather
          name={ok ? 'check-circle' : 'x-circle'}
          size={22}
          color={ok ? palette.successText : palette.dangerText}
        />
        <AppText variant="heading" style={{ color: ok ? palette.successText : palette.dangerText }}>
          {ok ? t('lesson.awesome') : t('lesson.wrongTitle')}
        </AppText>
      </View>
      {!ok ? (
        <View style={styles.answer}>
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
  titleRow: { alignItems: 'center', flexDirection: 'row', gap: spacing.sm },
  answer: { alignItems: 'center', gap: 4, paddingVertical: spacing.sm },
});

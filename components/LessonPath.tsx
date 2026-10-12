import { Pressable, StyleSheet, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { useEffect } from 'react';

import { AppText } from '@/components/Themed';
import { radius, spacing, unitBannerColors } from '@/constants/tokens';
import { themeTitle } from '@/lib/i18n';
import { isLessonUnlocked, lessonProgress } from '@/lib/lessons';
import { getCatalog, lessonPath, themeById } from '@/lib/lexicon';
import { useReduceMotion } from '@/lib/motion';
import { useStore } from '@/lib/store';
import { usePalette } from '@/lib/theme';
import type { Unit } from '@/lib/types';
import { useI18n } from '@/lib/use-i18n';
import { useRouter } from 'expo-router';

type NodeState = 'done' | 'current' | 'locked';

export function LessonPath() {
  const { progress } = useStore();
  const { t, lang } = useI18n();
  const palette = usePalette();
  const router = useRouter();
  const units = getCatalog().units.filter((unit) => unit.level === progress.settings.level);

  return (
    <View style={styles.wrap}>
      {units.map((unit, index) => {
        const theme = themeById(unit.theme);
        const done = lessonProgress(progress, unit);
        const open = isLessonUnlocked(progress, unit, 0) || done > 0;
        const complete = done >= unit.lessonCount;
        const current = open && !complete;
        const state: NodeState = complete ? 'done' : current ? 'current' : 'locked';
        const side = index % 2 === 0 ? 'left' : 'right';
        const banner = unitBannerColors[index % unitBannerColors.length];
        const next = Math.min(done, Math.max(0, unit.lessonCount - 1));

        return (
          <View key={unit.id} style={styles.block}>
            <View style={[styles.banner, { backgroundColor: banner }]}>
              <AppText variant="heading" style={styles.bannerText}>
                {theme?.emoji ?? '📘'} {theme ? themeTitle(theme, lang) : unit.theme}
              </AppText>
              <AppText variant="caption" style={styles.bannerText}>
                {t('lessons.of', { done, total: unit.lessonCount })}
              </AppText>
            </View>
            <View style={[styles.lane, side === 'right' ? styles.laneRight : styles.laneLeft]}>
              <PathNode
                state={state}
                label={theme?.emoji ?? '★'}
                a11y={t(`path.${state}`, { title: theme ? themeTitle(theme, lang) : unit.theme })}
                onPress={() => {
                  if (state === 'locked') return;
                  router.push(lessonPath(unit.id, next));
                }}
              />
              {index < units.length - 1 ? (
                <View style={[styles.connector, { backgroundColor: palette.path }]} />
              ) : null}
            </View>
          </View>
        );
      })}
    </View>
  );
}

function PathNode({
  state,
  label,
  a11y,
  onPress,
}: {
  state: NodeState;
  label: string;
  a11y: string;
  onPress: () => void;
}) {
  const palette = usePalette();
  const reduce = useReduceMotion();
  const pulse = useSharedValue(1);

  useEffect(() => {
    if (state !== 'current' || reduce) {
      pulse.value = 1;
      return;
    }
    pulse.value = withRepeat(
      withTiming(1.08, { duration: 700, easing: Easing.inOut(Easing.quad) }),
      -1,
      true
    );
  }, [pulse, reduce, state]);

  const scale = useAnimatedStyle(() => ({ transform: [{ scale: pulse.value }] }));

  const fill =
    state === 'done' ? palette.success : state === 'current' ? palette.xp : palette.locked;
  const ring = state === 'current' ? palette.warning : fill;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={a11y}
      accessibilityState={{ disabled: state === 'locked' }}
      onPress={onPress}
    >
      <Animated.View
        style={[
          styles.node,
          { backgroundColor: fill, borderColor: ring, shadowColor: ring },
          scale,
        ]}
      >
        {state === 'locked' ? (
          <Feather name="lock" size={22} color={palette.surface} />
        ) : state === 'done' ? (
          <Feather name="check" size={26} color={palette.accentText} />
        ) : (
          <AppText variant="title">{label}</AppText>
        )}
      </Animated.View>
    </Pressable>
  );
}

export function unitStatus(unit: Unit, done: number, open: boolean): NodeState {
  if (done >= unit.lessonCount) return 'done';
  if (open) return 'current';
  return 'locked';
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.lg, paddingBottom: spacing.xxl },
  block: { gap: spacing.md },
  banner: {
    alignSelf: 'center',
    borderRadius: radius.xl,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
  },
  bannerText: { color: '#FFFFFF', textAlign: 'center' },
  lane: { alignItems: 'center', minHeight: 108 },
  laneLeft: { paddingRight: 72 },
  laneRight: { paddingLeft: 72 },
  connector: { borderRadius: radius.pill, height: 36, marginTop: 8, width: 8 },
  node: {
    alignItems: 'center',
    borderRadius: 40,
    borderWidth: 4,
    elevation: 4,
    height: 80,
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 0,
    width: 80,
  },
});

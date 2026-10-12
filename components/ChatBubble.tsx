import { StyleSheet, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';

import { HebrewText } from '@/components/HebrewText';
import { Mascot } from '@/components/Mascot';
import { AppText } from '@/components/Themed';
import { radius, spacing } from '@/constants/tokens';
import { usePalette } from '@/lib/theme';

function FriendAvatar({ size }: { size: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 48 48" accessibilityLabel="Собеседник">
      <Circle cx="24" cy="24" r="22" fill="#1CB0F6" />
      <Circle cx="17" cy="22" r="6" fill="#FFFFFF" />
      <Circle cx="31" cy="22" r="6" fill="#FFFFFF" />
      <Circle cx="18" cy="23" r="3" fill="#1B3A14" />
      <Circle cx="32" cy="23" r="3" fill="#1B3A14" />
      <Path d="M20 32 Q24 36 28 32" stroke="#FFFFFF" strokeWidth="2" fill="none" />
    </Svg>
  );
}

export function ChatBubble({
  speaker,
  hebrew,
  gloss,
}: {
  speaker: 'a' | 'b';
  hebrew: string;
  gloss: string;
}) {
  const palette = usePalette();
  const mine = speaker === 'a';
  return (
    <View style={[styles.row, mine ? styles.rowLeft : styles.rowRight]}>
      {mine ? <Mascot pose="wave" size={52} /> : <FriendAvatar size={44} />}
      <View
        style={[
          styles.bubble,
          {
            backgroundColor: mine ? palette.surface : palette.successSoft,
            borderColor: mine ? palette.border : palette.success,
          },
        ]}
      >
        <HebrewText size="inline" align={mine ? 'right' : 'right'}>
          {hebrew}
        </HebrewText>
        <AppText muted>{gloss}</AppText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { alignItems: 'flex-end', flexDirection: 'row', gap: spacing.sm },
  rowLeft: { justifyContent: 'flex-start' },
  rowRight: { flexDirection: 'row-reverse' },
  bubble: {
    borderRadius: radius.lg,
    borderWidth: 2,
    flex: 1,
    gap: spacing.xs,
    padding: spacing.md,
  },
});

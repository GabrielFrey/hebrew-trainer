import { useMemo, useState } from 'react';
import { Pressable } from 'react-native';
import type { StyleProp, TextStyle } from 'react-native';

import { HebrewText } from '@/components/HebrewText';
import { hebrewFontSizes } from '@/constants/tokens';
import { hebrewByNikud } from '@/lib/nikud-display';
import { useStore } from '@/lib/store';
import type { CardState } from '@/lib/types';

export function PointedHebrew({
  nikud,
  hebrew,
  card,
  id,
  size = 'card',
  align = 'center',
  style,
}: {
  nikud: string;
  hebrew: string;
  card?: CardState | null;
  id?: string;
  size?: keyof typeof hebrewFontSizes | number;
  align?: 'right' | 'center';
  style?: StyleProp<TextStyle>;
}) {
  const { progress } = useStore();
  const [revealed, setRevealed] = useState(false);
  const text = useMemo(
    () =>
      hebrewByNikud({ hebrew, nikud }, progress.settings, {
        card,
        id: id ?? card?.id,
        revealed,
      }),
    [hebrew, nikud, progress.settings, card, id, revealed]
  );

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={revealed ? nikud : text}
      onPress={() => setRevealed((value) => !value)}
    >
      <HebrewText size={size} align={align} style={style}>
        {text}
      </HebrewText>
    </Pressable>
  );
}

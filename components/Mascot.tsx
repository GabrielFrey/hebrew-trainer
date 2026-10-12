import Svg, { Circle, Ellipse, Path, Rect } from 'react-native-svg';
import { View } from 'react-native';

import { useI18n } from '@/lib/use-i18n';

export type MascotPose = 'idle' | 'wave' | 'cheer' | 'think' | 'oops';

/**
 * Гама — верблюжонок без религиозных символов: песочный, зелёный шарф, большие глаза.
 */
export function Mascot({
  pose = 'idle',
  size = 140,
}: {
  pose?: MascotPose;
  size?: number;
}) {
  const arm =
    pose === 'wave' || pose === 'cheer'
      ? 'M118 92 C138 70, 148 58, 154 48'
      : pose === 'oops'
        ? 'M118 96 C128 110, 126 124, 118 128'
        : 'M118 96 C132 108, 136 118, 128 126';
  const mouth =
    pose === 'oops'
      ? 'M86 108 Q96 102 106 108'
      : pose === 'think'
        ? 'M88 108 Q96 112 104 108'
        : 'M86 106 Q96 116 106 106';
  const brow = pose === 'think' ? -4 : pose === 'oops' ? 4 : 0;
  const { t } = useI18n();

  return (
    <View accessibilityLabel={t('mascot.a11y')} style={{ width: size, height: size }}>
      <Svg width={size} height={size} viewBox="0 0 180 180">
        <Ellipse cx="90" cy="168" rx="46" ry="8" fill="#1B3A14" opacity={0.12} />
        <Path
          d="M54 128 C50 98, 58 78, 78 70 C70 48, 86 28, 108 36 C128 42, 134 64, 126 80 C148 88, 150 118, 138 138 C126 156, 70 158, 54 128 Z"
          fill="#E8A05A"
        />
        <Path d="M78 70 C86 54, 108 48, 118 66 C108 62, 92 66, 78 70 Z" fill="#F3C27A" />
        <Ellipse cx="72" cy="138" rx="16" ry="22" fill="#D4893E" />
        <Ellipse cx="122" cy="138" rx="16" ry="22" fill="#D4893E" />
        <Circle cx="108" cy="62" r="28" fill="#E8A05A" />
        <Ellipse cx="128" cy="62" rx="10" ry="16" fill="#E8A05A" />
        <Circle cx="98" cy="58" r="7" fill="#FFFFFF" />
        <Circle cx="118" cy="58" r="7" fill="#FFFFFF" />
        <Circle cx="100" cy={58 + brow / 4} r="3.2" fill="#1B3A14" />
        <Circle cx="120" cy={58 + brow / 4} r="3.2" fill="#1B3A14" />
        <Path d={mouth} stroke="#C36B2A" strokeWidth="3" fill="none" strokeLinecap="round" />
        <Path d={arm} stroke="#E8A05A" strokeWidth="10" fill="none" strokeLinecap="round" />
        <Path d="M78 96 C70 108, 68 118, 76 122" stroke="#E8A05A" strokeWidth="10" fill="none" strokeLinecap="round" />
        <Path d="M86 92 C104 108, 118 104, 128 92" fill="#58CC02" />
        <Rect x="96" y="86" width="18" height="8" rx="4" fill="#46A302" />
        {pose === 'think' ? <Circle cx="142" cy="40" r="6" fill="#FFFFFF" opacity={0.9} /> : null}
        {pose === 'cheer' ? (
          <>
            <Circle cx="36" cy="40" r="4" fill="#FFC800" />
            <Circle cx="150" cy="28" r="4" fill="#FF4B4B" />
            <Circle cx="28" cy="72" r="3" fill="#1CB0F6" />
          </>
        ) : null}
      </Svg>
    </View>
  );
}

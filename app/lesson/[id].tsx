import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { lessonPath, parseLessonId } from '@/lib/lexicon';
import { usePalette } from '@/lib/theme';

/** Старый путь /lesson/unit:index → /lesson/unit/index, чтобы web-export не глотал двоеточие. */
export default function LegacyLessonRedirect() {
  const { id } = useLocalSearchParams<{ id: string | string[] }>();
  const router = useRouter();
  const palette = usePalette();
  const raw = Array.isArray(id) ? id.join('/') : (id ?? '');

  useEffect(() => {
    const parsed = parseLessonId(decodeURIComponent(raw));
    if (parsed) router.replace(lessonPath(parsed.unitId, parsed.index));
    else router.replace('/');
  }, [raw, router]);

  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: palette.background }}>
      <ActivityIndicator color={palette.accent} />
    </View>
  );
}

import { ScrollView, StyleSheet, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { Button } from '@/components/Button';
import { HebrewText } from '@/components/HebrewText';
import { AudioButton } from '@/components/AudioButton';
import { AppText, Screen, Surface } from '@/components/Themed';
import { spacing } from '@/constants/theme';
import { getLetter } from '@/lib/data';
import { isLearned } from '@/lib/srs';
import { useStore } from '@/lib/store';

export default function LetterScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { progress } = useStore();
  const letter = getLetter(id ?? '');

  if (!letter) {
    return (
      <Screen style={styles.missing}>
        <AppText variant="heading">Буква не найдена</AppText>
        <Button label="Назад" variant="secondary" onPress={() => router.back()} />
      </Screen>
    );
  }

  const card = progress.cards[`letter:${letter.id}`];
  const status = !card ? 'Ещё не изучалась' : isLearned(card) ? 'Выучена' : 'В работе';

  return (
    <Screen edges={['left', 'right']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Surface style={styles.hero}>
          <HebrewText size="glyph" align="center">
            {letter.char}
          </HebrewText>
          <AppText variant="title" style={styles.centered}>
            {letter.nameRu}
          </AppText>
          <HebrewText size="inline" align="center">
            {letter.name}
          </HebrewText>
          <AppText muted style={styles.centered}>
            {letter.sound}
          </AppText>
          <View style={styles.speakRow}>
            <AudioButton audio={letter.audio} label="Название" />
          </View>
          <AppText variant="caption" muted style={styles.centered}>
            {status}
          </AppText>
        </Surface>

        <Surface style={styles.section}>
          <AppText variant="heading">Пример</AppText>
          <HebrewText size="card">{letter.example.he}</HebrewText>
          <AppText variant="label" muted>
            {letter.example.translitRu} · {letter.example.translit}
          </AppText>
          <AppText>{letter.example.ru}</AppText>
          <AudioButton audio={null} />
        </Surface>

        {letter.finalChar && letter.finalExample ? (
          <Surface style={styles.section}>
            <AppText variant="heading">Конечная форма</AppText>
            <HebrewText size="glyph" align="right">
              {letter.finalChar}
            </HebrewText>
            <AppText muted>
              В конце слова {letter.nameRu} пишется как {letter.finalChar}. Звук не меняется.
            </AppText>
            <HebrewText size="card">{letter.finalExample.he}</HebrewText>
            <AppText variant="label" muted>
              {letter.finalExample.translitRu} — {letter.finalExample.ru}
            </AppText>
            <AudioButton audio={null} />
          </Surface>
        ) : null}

        <Button
          label="Написать от руки"
          onPress={() => router.push('/drill/write')}
          style={styles.cta}
        />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { gap: spacing.lg, padding: spacing.lg, paddingBottom: spacing.xxl },
  missing: { alignItems: 'center', gap: spacing.lg, justifyContent: 'center', padding: spacing.xl },
  hero: { gap: spacing.sm },
  centered: { textAlign: 'center' },
  speakRow: { alignItems: 'center' },
  section: { gap: spacing.sm },
  cta: { marginTop: spacing.sm },
});

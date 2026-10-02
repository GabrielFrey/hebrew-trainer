import { Stack, useRouter } from 'expo-router';

import { EmptyState } from '@/components/EmptyState';
import { Screen } from '@/components/Themed';

export default function NotFoundScreen() {
  const router = useRouter();
  return (
    <>
      <Stack.Screen options={{ title: 'Не найдено' }} />
      <Screen edges={['left', 'right']}>
        <EmptyState
          icon="compass"
          title="Такого экрана нет"
          description="Похоже, ссылка устарела. Вернёмся к сегодняшней тренировке."
          actionLabel="На главный экран"
          onAction={() => router.replace('/')}
        />
      </Screen>
    </>
  );
}

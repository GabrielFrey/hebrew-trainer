import { Stack, useRouter } from 'expo-router';

import { EmptyState } from '@/components/EmptyState';
import { Screen } from '@/components/Themed';
import { useI18n } from '@/lib/use-i18n';

export default function NotFoundScreen() {
  const router = useRouter();
  const { t } = useI18n();
  return (
    <>
      <Stack.Screen options={{ title: t('nav.notFound') }} />
      <Screen edges={['left', 'right']}>
        <EmptyState
          icon="compass"
          title={t('notFound.title')}
          description={t('notFound.body')}
          actionLabel={t('notFound.home')}
          onAction={() => router.replace('/')}
        />
      </Screen>
    </>
  );
}

// Файл создаётся скриптом scripts/fetch-audio.mjs. Не редактируйте вручную.
// Metro требует статический require, поэтому карта записей генерируется.

/** Записи носителей, реально вложенные в сборку. */
export const audioAssets: Record<string, number> = {
  'words/aba.m4a': require('@/assets/audio/words/aba.m4a') as number,
  'words/ahava.m4a': require('@/assets/audio/words/ahava.m4a') as number,
  'words/akh.m4a': require('@/assets/audio/words/akh.m4a') as number,
  'words/akhat.m4a': require('@/assets/audio/words/akhat.m4a') as number,
  'words/ani.m4a': require('@/assets/audio/words/ani.m4a') as number,
  'words/beitsa.m4a': require('@/assets/audio/words/beitsa.m4a') as number,
  'words/bekhirot.m4a': require('@/assets/audio/words/bekhirot.m4a') as number,
  'letters/bet.m4a': require('@/assets/audio/letters/bet.m4a') as number,
  'words/bevakasha.m4a': require('@/assets/audio/words/bevakasha.m4a') as number,
  'words/eifo.m4a': require('@/assets/audio/words/eifo.m4a') as number,
  'words/eikh.m4a': require('@/assets/audio/words/eikh.m4a') as number,
  'words/emet.m4a': require('@/assets/audio/words/emet.m4a') as number,
  'letters/kaf.m4a': require('@/assets/audio/letters/kaf.m4a') as number,
  'words/kalkala.m4a': require('@/assets/audio/words/kalkala.m4a') as number,
  'words/kama.m4a': require('@/assets/audio/words/kama.m4a') as number,
  'words/kesef.m4a': require('@/assets/audio/words/kesef.m4a') as number,
  'words/kise.m4a': require('@/assets/audio/words/kise.m4a') as number,
  'words/knesset.m4a': require('@/assets/audio/words/knesset.m4a') as number,
  'words/ohev.m4a': require('@/assets/audio/words/ohev.m4a') as number,
  'words/tov.m4a': require('@/assets/audio/words/tov.m4a') as number,
};

export function hasRecording(path: string | null | undefined): boolean {
  return typeof path === 'string' && path in audioAssets;
}

import { createAudioPlayer, setAudioModeAsync } from 'expo-audio';
import type { AudioPlayer } from 'expo-audio';

import { audioAssets } from '@/lib/audio-assets';

/**
 * Проигрывает только записи носителей языка. Синтеза речи здесь нет совсем:
 * если файла нет, экран показывает «нет записи» и ничего не звучит.
 */

let current: AudioPlayer | null = null;
let audioModeReady = false;

export function hasRecording(path: string | null | undefined): boolean {
  return typeof path === 'string' && path in audioAssets;
}

export function recordingCount(): number {
  return Object.keys(audioAssets).length;
}

async function prepareAudioMode(): Promise<void> {
  if (audioModeReady) return;
  audioModeReady = true;
  try {
    // Озвучка должна звучать, даже если на iPhone включён беззвучный режим.
    await setAudioModeAsync({ playsInSilentMode: true });
  } catch {
    // Не критично: если режим не выставился, звук просто пойдёт по умолчанию.
  }
}

export function stopPlayback(): void {
  if (!current) return;
  try {
    current.remove();
  } catch {
    // плеер мог быть уже освобождён
  }
  current = null;
}

/**
 * Возвращает true, если запись нашлась и воспроизведение началось.
 * false означает «записи нет» — вызывающий код показывает это пользователю.
 */
export function playRecording(path: string | null | undefined): boolean {
  if (!hasRecording(path)) return false;
  const asset = audioAssets[path as string];
  if (asset === undefined) return false;

  void prepareAudioMode();
  stopPlayback();
  try {
    const player = createAudioPlayer(asset);
    current = player;
    player.play();
    return true;
  } catch {
    current = null;
    return false;
  }
}

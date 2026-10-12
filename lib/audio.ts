import { createAudioPlayer, setAudioModeAsync } from 'expo-audio';
import type { AudioPlayer } from 'expo-audio';

import { audioAssets } from '@/lib/audio-assets';
import { ttsAssets } from '@/lib/tts-assets';

/**
 * Проигрывает заранее готовый файл: сначала запись носителя, иначе кэш TTS.
 * Синтеза на устройстве нет: если файла нет, экран показывает «нет записи».
 */

function bundledAsset(path: string): number | undefined {
  if (path in audioAssets) return audioAssets[path];
  if (path in ttsAssets) return ttsAssets[path];
  return undefined;
}

let current: AudioPlayer | null = null;
let audioModeReady = false;

export function hasRecording(path: string | null | undefined): boolean {
  return typeof path === 'string' && bundledAsset(path) !== undefined;
}

export function recordingCount(): number {
  return Object.keys(audioAssets).length;
}

export function ttsRecordingCount(): number {
  return Object.keys(ttsAssets).length;
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
  if (typeof path !== 'string') return false;
  const asset = bundledAsset(path);
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

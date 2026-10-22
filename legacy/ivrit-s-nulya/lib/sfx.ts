import { createAudioPlayer } from 'expo-audio';
import type { AudioPlayer } from 'expo-audio';

const assets = {
  correct: require('@/assets/sfx/correct.wav') as number,
  wrong: require('@/assets/sfx/wrong.wav') as number,
};

let current: AudioPlayer | null = null;

function stop(): void {
  if (!current) return;
  try {
    current.remove();
  } catch {
    // already released
  }
  current = null;
}

export function playSfx(kind: 'correct' | 'wrong', enabled = true): void {
  if (!enabled) return;
  stop();
  try {
    const player = createAudioPlayer(assets[kind]);
    current = player;
    player.play();
  } catch {
    current = null;
  }
}

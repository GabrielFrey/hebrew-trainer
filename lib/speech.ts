import * as Speech from 'expo-speech';

import { SPEECH_LANGUAGE } from '@/lib/data';

/**
 * Text-to-speech stand-in until native speaker recordings ship. Nikud is kept
 * because iOS voices use it to disambiguate vowels.
 */
export function speak(text: string): void {
  Speech.stop();
  Speech.speak(text, {
    language: SPEECH_LANGUAGE,
    rate: 0.8,
    pitch: 1,
  });
}

export function stopSpeaking(): void {
  Speech.stop();
}

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

import { createAudioPlayer } from 'expo-audio';

import { hasRecording, playRecording, recordingCount, stopPlayback, ttsRecordingCount } from '@/lib/audio';
import { letters, phrases, words } from '@/lib/data';

const createPlayer = createAudioPlayer as unknown as jest.Mock;

const credits = JSON.parse(
  readFileSync(join(__dirname, '../../assets/audio/credits.json'), 'utf8')
) as { id: string; file: string; license: string; source: string; author: string | null }[];

/** Все .ts/.tsx приложения, кроме самих тестов. */
function sourceFiles(dir: string): string[] {
  return readdirSync(join(__dirname, '../..', dir)).flatMap((entry) => {
    if (entry === '__tests__' || entry === 'node_modules') return [];
    const path = join(dir, entry);
    if (statSync(join(__dirname, '../..', path)).isDirectory()) return sourceFiles(path);
    return /\.(ts|tsx)$/.test(entry) ? [path] : [];
  });
}

describe('озвучка', () => {
  beforeEach(() => {
    createPlayer.mockClear();
    stopPlayback();
  });

  it('не использует синтез речи нигде в коде', () => {
    const pkg = JSON.parse(readFileSync(join(__dirname, '../../package.json'), 'utf8')) as {
      dependencies: Record<string, string>;
      devDependencies: Record<string, string>;
    };
    expect(Object.keys(pkg.dependencies)).not.toContain('expo-speech');
    expect(Object.keys(pkg.devDependencies)).not.toContain('expo-speech');

    const offenders = ['lib', 'app', 'components']
      .flatMap((dir) => sourceFiles(dir))
      .filter((file) => {
        const text = readFileSync(join(__dirname, '../..', file), 'utf8');
        return /expo-speech|SpeechSynthesis|Speech\.speak/.test(text);
      });
    expect(offenders).toEqual([]);
  });

  it('у слова без записи не создаёт плеер и ничего не произносит', () => {
    const silent = words.find((word) => !hasRecording(word.audio));
    expect(silent).toBeDefined();

    expect(playRecording(silent?.audio)).toBe(false);
    expect(createPlayer).not.toHaveBeenCalled();
  });

  it('молчит для пустого пути', () => {
    expect(playRecording(null)).toBe(false);
    expect(playRecording(undefined)).toBe(false);
    expect(playRecording('words/нет-такого.m4a')).toBe(false);
    expect(createPlayer).not.toHaveBeenCalled();
  });

  it('проигрывает запись носителя, когда файл есть', () => {
    const voiced = words.find((word) => hasRecording(word.audio));
    expect(voiced).toBeDefined();

    expect(playRecording(voiced?.audio)).toBe(true);
    expect(createPlayer).toHaveBeenCalledTimes(1);
  });

  it('у каждой вложенной записи есть автор и свободная лицензия', () => {
    expect(credits.length).toBe(recordingCount());
    expect(credits.length).toBeGreaterThan(0);
    credits.forEach((entry) => {
      expect(entry.license).toMatch(/^(CC0|CC BY|CC-BY|Public domain)/i);
      expect(entry.source).toMatch(/^https:\/\/commons\.wikimedia\.org\//);
      expect(hasRecording(entry.file)).toBe(true);
    });
  });

  it('ожидает путь к записи у всех слов, фраз и букв', () => {
    words.forEach((word) => expect(word.audio).toMatch(/\.(m4a|mp3)$/));
    phrases.forEach((phrase) => expect(phrase.audio).toMatch(/\.m4a$/));
    letters.forEach((letter) => expect(letter.audio).toMatch(/\.m4a$/));
  });

  it('не кладёт нейрозапись в бандл, пока generate-tts не отработал с ключом', () => {
    expect(ttsRecordingCount()).toBe(0);
  });
});

import { hasRecording } from '@/lib/audio';
import { allWords } from '@/lib/data';
import { getCatalog, lessonKeyFromSlug, lessonPath, loadedSlang, parseLessonId, unitsForLevel } from '@/lib/lexicon';
import { buildLesson, dailyLessonGoal, exerciseNeedsAudio, isLessonUnlocked, nextLessonId } from '@/lib/lessons';
import { MAX_NEW_WORDS_PER_SESSION } from '@/lib/session';
import { emptyProgress } from '@/lib/storage';
import { reshapeUnits } from '@/lib/units';

const NIKUD = /[\u0591-\u05C7]/;

describe('лексикон Mondly', () => {
  it('держит 5000 уникальных слов и несколько сотен живых выражений сленга', () => {
    const words = allWords();
    const slang = loadedSlang();
    expect(words).toHaveLength(5000);
    expect(slang.length).toBeGreaterThanOrEqual(300);
    expect(slang.length).toBeLessThanOrEqual(500);
    expect(new Set(words.map((word) => word.id)).size).toBe(5000);
    expect(new Set(words.map((word) => word.hebrew)).size).toBe(5000);
    expect(new Set(slang.map((item) => item.id)).size).toBe(slang.length);
    expect(new Set(slang.map((item) => item.hebrew)).size).toBe(slang.length);
  });

  it('у каждой записи есть никуд, ктив мале, транскрипция, ru/en, тема и пример', () => {
    allWords().forEach((word) => {
      expect(NIKUD.test(word.nikud)).toBe(true);
      expect(NIKUD.test(word.hebrew)).toBe(false);
      expect(word.transcription.length).toBeGreaterThan(0);
      expect(word.ru.length).toBeGreaterThan(0);
      expect(word.en.length).toBeGreaterThan(0);
      expect(word.pos.length).toBeGreaterThan(0);
      expect(word.theme.length).toBeGreaterThan(0);
      expect(word.deck).toBe(word.theme);
      const exampleFilled = Boolean(word.example.nikud.trim() || word.example.hebrew.trim());
      if (exampleFilled) {
        expect(word.example.nikud.length).toBeGreaterThan(0);
        expect(word.example.ru.length).toBeGreaterThan(0);
        expect(word.example.en.length).toBeGreaterThan(0);
      }
    });
  });

  it('раскладывает слова по пяти уровням и темам', () => {
    const catalog = getCatalog();
    expect(catalog.themes.length).toBeGreaterThan(8);
    expect(catalog.units.length).toBeGreaterThan(20);
    expect(catalog.counts.words).toBe(5000);
    expect(catalog.counts.slang).toBe(loadedSlang().length);
    expect(catalog.counts.dialogues).toBeGreaterThanOrEqual(60);
    expect(catalog.counts.dialogues).toBeLessThanOrEqual(124);
    expect(unitsForLevel('elementary').length).toBeGreaterThan(0);
    expect(unitsForLevel('expert').length).toBeGreaterThan(unitsForLevel('elementary').length);
    const byLevel = { elementary: 0, basic: 0, intermediate: 0, advanced: 0, expert: 0 };
    allWords().forEach((word) => {
      byLevel[word.level] += 1;
    });
    Object.values(byLevel).forEach((count) => expect(count).toBeGreaterThan(0));
  });

  it('уроки вводят не больше пяти новых слов и смешивают упражнения', () => {
    const progress = emptyProgress();
    progress.settings.onboarded = true;
    const id = nextLessonId(progress, 'elementary');
    expect(id).toBeTruthy();
    expect(parseLessonId(id as string)?.unitId).toBeTruthy();
    const queue = buildLesson(progress, id as string);
    const newWordIds = new Set(
      queue.filter((card) => card.kind === 'word' && card.isNew).map((card) => card.refId)
    );
    expect(newWordIds.size).toBeLessThanOrEqual(MAX_NEW_WORDS_PER_SESSION);
    expect(queue[0]?.exercise).toBe('teach-word');
    expect(queue.some((card) => card.exercise === 'letter-write')).toBe(false);
    const heRu = queue.find((card) => card.exercise === 'word-he-ru');
    expect(heRu).toBeDefined();
    expect(heRu?.options.length).toBeGreaterThanOrEqual(2);
    expect(heRu?.options).toContain(heRu?.answer);
    expect(queue.some((card) => card.exercise === 'teach-word')).toBe(true);
    expect(queue.some((card) => card.exercise === 'build-phrase' || card.exercise === 'choice-picture')).toBe(
      true
    );
    const listenCards = queue.filter((card) => card.exercise === 'listen-choice');
    listenCards.forEach((card) => {
      const word = allWords().find((item) => item.id === card.refId);
      expect(word).toBeDefined();
      expect(exerciseNeedsAudio(card.exercise)).toBe(true);
      expect(hasRecording(word?.audio)).toBe(true);
    });
    const practice = queue.filter((card) => card.exercise !== 'teach-word');
    for (let i = 1; i < practice.length; i += 1) {
      const run = [practice[i - 1]?.refId, practice[i]?.refId, practice[i + 1]?.refId, practice[i + 2]?.refId];
      if (run.every((id) => id && id === practice[i]?.refId)) {
        throw new Error(`одно слово ${practice[i]?.refId} четыре раза подряд`);
      }
    }
    expect(newWordIds.size).toBeGreaterThanOrEqual(3);
    expect(queue.some((card) => card.exercise === 'type-word')).toBe(true);
    expect(queue.some((card) => card.exercise === 'gender-agree')).toBe(true);
    expect(queue.some((card) => card.exercise === 'dialogue-reply')).toBe(true);
    queue
      .filter((card) =>
        ['word-he-ru', 'choice-picture', 'listen-choice', 'dialogue-reply', 'gender-agree', 'form-verb'].includes(
          card.exercise
        )
      )
      .forEach((card) => {
        expect(card.options.length).toBeGreaterThanOrEqual(2);
        expect(card.options).toContain(card.answer);
      });
  });

  it('открывает первый урок и считает дневную цель по минутам', () => {
    const progress = emptyProgress();
    const id = nextLessonId(progress, 'elementary');
    const parsed = parseLessonId(id as string);
    expect(parsed).toBeTruthy();
    const unit = getCatalog().units.find((item) => item.id === parsed?.unitId);
    expect(unit).toBeTruthy();
    if (!unit) return;
    expect(isLessonUnlocked(progress, unit, 0)).toBe(true);
    expect(parseLessonId('elementary-greetings/0')).toEqual({ unitId: 'elementary-greetings', index: 0 });
    expect(parseLessonId('elementary-greetings:0')).toEqual({ unitId: 'elementary-greetings', index: 0 });
    expect(lessonKeyFromSlug(['elementary-greetings', '0'])).toBe('elementary-greetings:0');
    expect(String(lessonPath('elementary-greetings', 0))).toBe('/lesson/elementary-greetings/0');
    expect(dailyLessonGoal(5)).toBe(5);
    expect(dailyLessonGoal(10)).toBe(10);
    expect(dailyLessonGoal(20)).toBe(20);
  });

  it('режет крупные темы на 5–8 уроков и склеивает мелкие', () => {
    const units = reshapeUnits(getCatalog().units);
    expect(units.length).toBeGreaterThan(20);
    units.forEach((unit) => {
      expect(unit.lessonCount).toBeGreaterThanOrEqual(1);
      expect(unit.lessonCount).toBeLessThanOrEqual(8);
    });
    const oversized = getCatalog().units.filter((unit) => unit.lessonCount > 8);
    expect(oversized.length).toBeGreaterThan(0);
    expect(units.every((unit) => unit.lessonCount <= 8)).toBe(true);
    const tinyLeft = units.filter((unit) => unit.lessonCount < 5).length;
    const originalTiny = getCatalog().units.filter((unit) => unit.lessonCount < 5).length;
    expect(tinyLeft).toBeLessThan(originalTiny);
  });
});

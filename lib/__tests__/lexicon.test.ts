import { allWords } from '@/lib/data';
import { getCatalog, loadedSlang, parseLessonId, unitsForLevel } from '@/lib/lexicon';
import { buildLesson, dailyLessonGoal, isLessonUnlocked, nextLessonId } from '@/lib/lessons';
import { MAX_NEW_WORDS_PER_SESSION } from '@/lib/session';
import { emptyProgress } from '@/lib/storage';

const NIKUD = /[\u0591-\u05C7]/;

describe('лексикон Mondly', () => {
  it('держит 5000 уникальных слов и 2000 выражений сленга', () => {
    const words = allWords();
    expect(words).toHaveLength(5000);
    expect(loadedSlang()).toHaveLength(2000);
    expect(new Set(words.map((word) => word.id)).size).toBe(5000);
    expect(new Set(words.map((word) => word.hebrew)).size).toBe(5000);
    expect(new Set(loadedSlang().map((item) => item.id)).size).toBe(2000);
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
      expect(word.example.nikud.length).toBeGreaterThan(0);
      expect(word.example.ru.length).toBeGreaterThan(0);
      expect(word.example.en.length).toBeGreaterThan(0);
    });
  });

  it('раскладывает слова по пяти уровням и темам', () => {
    const catalog = getCatalog();
    expect(catalog.themes.length).toBeGreaterThan(8);
    expect(catalog.units.length).toBeGreaterThan(20);
    expect(catalog.counts.words).toBe(5000);
    expect(catalog.counts.slang).toBe(2000);
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
    expect(queue.some((card) => card.exercise === 'teach-word')).toBe(true);
    expect(queue.some((card) => card.exercise === 'build-phrase' || card.exercise === 'choice-picture')).toBe(
      true
    );
    expect(queue.some((card) => card.exercise === 'listen-choice')).toBe(true);
    expect(queue.some((card) => card.exercise === 'dialogue-reply')).toBe(true);
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
    expect(dailyLessonGoal(5)).toBe(1);
    expect(dailyLessonGoal(10)).toBe(2);
    expect(dailyLessonGoal(20)).toBe(3);
  });
});

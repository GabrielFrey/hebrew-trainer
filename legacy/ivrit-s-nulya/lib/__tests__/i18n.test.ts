import { letters, phrases, words } from '@/lib/data';
import {
  displayAnswer,
  phraseGloss,
  resolveLanguage,
  resolveTranslation,
  shortGloss,
  systemLanguage,
  translate,
  wordGloss,
} from '@/lib/i18n';
import { buildLesson, nextLessonId } from '@/lib/lessons';
import { buildSession } from '@/lib/session';
import { emptyProgress } from '@/lib/storage';

describe('язык интерфейса', () => {
  it('по умолчанию следует за системой, русский и английский остаются выбором', () => {
    expect(resolveLanguage('ru')).toBe('ru');
    expect(resolveLanguage('en')).toBe('en');
    expect(resolveLanguage('system')).toBe(systemLanguage());
    expect(emptyProgress().settings.language).toBe('system');
  });

  it('не сбрасывает карточки при появлении настройки языка', () => {
    const progress = emptyProgress();
    progress.cards['word:shalom'] = {
      id: 'word:shalom',
      kind: 'word',
      refId: 'shalom',
      reps: 3,
      lapses: 0,
      ease: 2.5,
      intervalDays: 6,
      dueAt: Date.now(),
      introducedAt: Date.now(),
      lastReviewedAt: Date.now(),
      correct: 3,
      total: 3,
    };
    expect(progress.settings.language).toBe('system');
    expect(progress.cards['word:shalom']?.reps).toBe(3);
  });

  it('переводит интерфейс', () => {
    expect(translate('ru', 'tabs.today')).toBe('Учить');
    expect(translate('en', 'tabs.today')).toBe('Learn');
    expect(translate('en', 'common.recordMissing')).toBe('no recording');
  });

  it('держит одинаковый набор ключей в русском и английском', () => {
    const { i18nKeys } = require('@/lib/i18n') as { i18nKeys: () => string[] };
    i18nKeys().forEach((key) => {
      expect(translate('en', key)).not.toBe(key);
      expect(translate('ru', key)).not.toBe(key);
    });
  });

  it('берёт английский перевод слова из колоды', () => {
    const shalom = words.find((word) => word.id === 'shalom');
    expect(shalom?.en).toMatch(/hello|peace/i);
    expect(wordGloss(shalom as (typeof words)[number], 'en')).toBe(shalom?.en);
    expect(wordGloss(shalom as (typeof words)[number], 'ru')).toBe(shalom?.ru);
  });

  it('в английской сессии подставляет английские варианты перевода', () => {
    const progress = emptyProgress();
    progress.settings.onboarded = true;
    progress.settings.language = 'en';
    const queue = buildSession(progress, Date.UTC(2026, 1, 10, 9, 0, 0));
    const wordCard = queue.find((card) => card.exercise === 'word-he-ru');
    expect(wordCard).toBeDefined();
    const word = words.find((item) => item.id === wordCard?.refId);
    expect(word).toBeDefined();
    expect(wordCard?.answer).toBe(shortGloss(word?.en ?? ''));
    expect(wordCard?.options).toContain(shortGloss(word?.en ?? ''));
    expect(wordCard?.options).not.toContain(shortGloss(word?.ru ?? ''));
  });

  it('не ломает лимит пяти новых слов при смене языка', () => {
    const progress = emptyProgress();
    progress.settings.onboarded = true;
    progress.settings.language = 'en';
    const queue = buildSession(progress, Date.UTC(2026, 1, 10, 9, 0, 0));
    expect(queue.filter((card) => card.isNew && card.kind === 'word').length).toBeLessThanOrEqual(5);
  });

  it('язык перевода по умолчанию следует за интерфейсом и не сбрасывает карточки', () => {
    const progress = emptyProgress();
    progress.cards['word:shalom'] = {
      id: 'word:shalom',
      kind: 'word',
      refId: 'shalom',
      reps: 4,
      lapses: 0,
      ease: 2.6,
      intervalDays: 6,
      dueAt: Date.now(),
      introducedAt: Date.now(),
      lastReviewedAt: Date.now(),
      correct: 4,
      total: 4,
    };
    expect(progress.settings.translationLanguage).toBeUndefined();
    expect(resolveTranslation(progress.settings)).toBe(resolveLanguage(progress.settings.language));
    progress.settings.language = 'en';
    expect(resolveTranslation(progress.settings)).toBe('en');
    progress.settings.translationLanguage = 'ru';
    expect(resolveTranslation(progress.settings)).toBe('ru');
    expect(progress.cards['word:shalom']?.reps).toBe(4);
  });

  it('в сессии SM-2 подставляет перевод независимо от языка интерфейса', () => {
    const progress = emptyProgress();
    progress.settings.onboarded = true;
    progress.settings.language = 'en';
    progress.settings.translationLanguage = 'ru';
    const queue = buildSession(progress, Date.UTC(2026, 1, 10, 9, 0, 0));
    const wordCard = queue.find((card) => card.exercise === 'word-he-ru');
    expect(wordCard).toBeDefined();
    const word = words.find((item) => item.id === wordCard?.refId);
    expect(wordCard?.answer).toBe(shortGloss(word?.ru ?? ''));
    expect(wordCard?.options).toContain(shortGloss(word?.ru ?? ''));
    expect(wordCard?.options).not.toContain(shortGloss(word?.en ?? ''));
    expect(displayAnswer(wordCard as NonNullable<typeof wordCard>, 'en')).toBe(shortGloss(word?.en ?? ''));
  });

  it('урок мгновенно меняет язык вариантов без пересборки очереди', () => {
    const progress = emptyProgress();
    progress.settings.onboarded = true;
    progress.settings.language = 'ru';
    progress.settings.translationLanguage = 'ru';
    const id = nextLessonId(progress, 'elementary');
    expect(id).toBeTruthy();
    const queue = buildLesson(progress, id as string);
    const choice = queue.find((card) => card.exercise === 'word-he-ru');
    expect(choice?.bilingualOptions?.length).toBeGreaterThanOrEqual(2);
    const ruAnswer = displayAnswer(choice as NonNullable<typeof choice>, 'ru');
    const enAnswer = displayAnswer(choice as NonNullable<typeof choice>, 'en');
    expect(ruAnswer).toBe(choice?.answer);
    expect(enAnswer.length).toBeGreaterThan(0);
    expect(enAnswer).not.toBe(ruAnswer);
  });

  it('у каждой буквы и фразы есть английский текст', () => {
    letters.forEach((letter) => {
      expect(letter.nameEn.length).toBeGreaterThan(0);
      expect(letter.example.en.length).toBeGreaterThan(0);
    });
    phrases.forEach((phrase) => {
      expect(phraseGloss(phrase, 'en')).toBe(phrase.en);
      expect(phrase.distractorsEn.length).toBeGreaterThanOrEqual(3);
    });
  });
});

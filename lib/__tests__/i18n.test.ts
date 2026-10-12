import { letters, phrases, words } from '@/lib/data';
import {
  phraseGloss,
  resolveLanguage,
  systemLanguage,
  translate,
  wordGloss,
} from '@/lib/i18n';
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
    expect(translate('ru', 'tabs.today')).toBe('Сегодня');
    expect(translate('en', 'tabs.today')).toBe('Today');
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
    expect(wordCard?.answer).toBe(word?.en);
    expect(wordCard?.options).toContain(word?.en);
    expect(wordCard?.options).not.toContain(word?.ru);
  });

  it('не ломает лимит пяти новых слов при смене языка', () => {
    const progress = emptyProgress();
    progress.settings.onboarded = true;
    progress.settings.language = 'en';
    const queue = buildSession(progress, Date.UTC(2026, 1, 10, 9, 0, 0));
    expect(queue.filter((card) => card.isNew && card.kind === 'word').length).toBeLessThanOrEqual(5);
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

import { DAY_MS, INITIAL_EASE, MIN_EASE, createCard, isLearned, schedule } from '@/lib/srs';

const NOW = Date.UTC(2026, 0, 15, 9, 0, 0);

describe('SM-2 планировщик', () => {
  it('создаёт новую карточку со стартовым ease и сроком «сейчас»', () => {
    const card = createCard('word', 'bayit', NOW);
    expect(card.id).toBe('word:bayit');
    expect(card.ease).toBe(INITIAL_EASE);
    expect(card.intervalDays).toBe(0);
    expect(card.dueAt).toBe(NOW);
  });

  it('даёт интервалы 1 → 6 → interval × ease при верных ответах', () => {
    const first = schedule(createCard('word', 'sefer', NOW), 'good', NOW);
    expect(first.intervalDays).toBe(1);
    expect(first.dueAt).toBe(NOW + DAY_MS);

    const second = schedule(first, 'good', NOW);
    expect(second.intervalDays).toBe(6);

    const third = schedule(second, 'good', NOW);
    expect(third.intervalDays).toBe(Math.round(6 * second.ease));
  });

  it('сбрасывает интервал и срок на «сейчас» при ошибке', () => {
    const mature = schedule(schedule(createCard('letter', 'alef', NOW), 'good', NOW), 'good', NOW);
    expect(mature.intervalDays).toBe(6);

    const lapsed = schedule(mature, 'again', NOW);
    expect(lapsed.intervalDays).toBe(0);
    expect(lapsed.dueAt).toBe(NOW);
    expect(lapsed.reps).toBe(0);
    expect(lapsed.lapses).toBe(1);
    expect(lapsed.ease).toBeLessThan(mature.ease);
  });

  it('не опускает ease ниже минимума', () => {
    let card = createCard('word', 'toda', NOW);
    for (let i = 0; i < 20; i += 1) {
      card = schedule(card, 'again', NOW);
    }
    expect(card.ease).toBe(MIN_EASE);
  });

  it('считает ошибки и верные ответы отдельно', () => {
    let card = schedule(createCard('word', 'mayim', NOW), 'good', NOW);
    card = schedule(card, 'again', NOW);
    card = schedule(card, 'good', NOW);
    expect(card.total).toBe(3);
    expect(card.correct).toBe(2);
  });

  it('помечает выученной только карточку с интервалом от недели', () => {
    const young = schedule(createCard('letter', 'bet', NOW), 'good', NOW);
    expect(isLearned(young)).toBe(false);
    expect(isLearned(schedule(young, 'good', NOW))).toBe(true);
  });
});

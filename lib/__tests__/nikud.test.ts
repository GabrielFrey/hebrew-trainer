import { hebrewByNikud, nikudStrength, resolveNikudMode, shouldShowNikud } from '@/lib/nikud-display';
import { createCard, schedule } from '@/lib/srs';
import { emptyProgress } from '@/lib/storage';

const NOW = Date.UTC(2026, 3, 10, 9, 0, 0);

describe('огласовки', () => {
  it('читает режим из nikudMode и из старого флага showNikud', () => {
    expect(resolveNikudMode({ nikudMode: 'adaptive', showNikud: true })).toBe('adaptive');
    expect(resolveNikudMode({ showNikud: false })).toBe('never');
    expect(resolveNikudMode({ showNikud: true })).toBe('always');
  });

  it('в режиме always всегда показывает никуд, never — никогда, пока не нажали', () => {
    const item = { hebrew: 'שלום', nikud: 'שָׁלוֹם' };
    const base = emptyProgress().settings;
    expect(hebrewByNikud(item, { ...base, nikudMode: 'always' })).toBe('שָׁלוֹם');
    expect(hebrewByNikud(item, { ...base, nikudMode: 'never' })).toBe('שלום');
    expect(hebrewByNikud(item, { ...base, nikudMode: 'never' }, { revealed: true })).toBe('שָׁלוֹם');
  });

  it('в адаптивном режиме новое слово с огласовками, выученное — чаще без', () => {
    const settings = { ...emptyProgress().settings, nikudMode: 'adaptive' as const };
    const fresh = createCard('word', 'shalom', NOW);
    expect(nikudStrength(fresh)).toBe(0);
    expect(shouldShowNikud(settings, { card: fresh, id: 'word:shalom', now: NOW })).toBe(true);

    let learned = createCard('word', 'shalom', NOW);
    learned = schedule(schedule(schedule(learned, 'good', NOW), 'good', NOW + 86400000), 'easy', NOW + 8 * 86400000);
    expect(nikudStrength(learned)).toBeGreaterThan(0.4);

    let withNikud = 0;
    for (let day = 0; day < 40; day += 1) {
      if (shouldShowNikud(settings, { card: learned, id: 'word:shalom', now: NOW + day * 86400000 })) {
        withNikud += 1;
      }
    }
    expect(withNikud).toBeLessThan(40);
    expect(withNikud).toBeGreaterThan(0);
  });
});

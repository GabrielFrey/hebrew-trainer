import { exerciseNeedsAudio } from '@/lib/audio';
import { shortGloss } from '@/lib/i18n';
import { applyStreak, streakStatus } from '@/lib/streak';
import { emptyProgress } from '@/lib/storage';
import { getCatalog } from '@/lib/lexicon';
import { reshapeUnits } from '@/lib/units';

describe('UX-аудит', () => {
  it('чистит эмодзи-префикс и длинные глоссы', () => {
    expect(shortGloss('👋|привет / мир')).toBe('привет / мир');
    expect(shortGloss('действие / операция / дело / сделка')).toBe('действие / операция');
  });

  it('помечает аудирование как задание, которому нужен файл', () => {
    expect(exerciseNeedsAudio('listen-choice')).toBe(true);
    expect(exerciseNeedsAudio('word-he-ru')).toBe(false);
  });

  it('не ломает серию однодневным пропуском, если есть заморозка', () => {
    const progress = emptyProgress();
    progress.streak = { current: 3, longest: 3, lastDay: '2026-01-10', freezes: 1 };
    const next = applyStreak(progress, '2026-01-12');
    expect(next.current).toBe(4);
    expect(next.freezes).toBe(0);
    expect(streakStatus({ ...progress, streak: { ...progress.streak, lastDay: '2026-01-11' } }, '2026-01-12').kind).toBe(
      'active'
    );
  });

  it('держит темы в пределах восьми уроков', () => {
    reshapeUnits(getCatalog().units).forEach((unit) => {
      expect(unit.lessonCount).toBeLessThanOrEqual(8);
    });
  });
});

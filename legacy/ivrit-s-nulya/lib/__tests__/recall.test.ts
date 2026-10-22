import { clozeFromExample, pickGenderItem, typedAnswerOk } from '@/lib/recall';
import { buildLesson, nextLessonId } from '@/lib/lessons';
import { emptyProgress } from '@/lib/storage';
import type { Word } from '@/lib/types';
import { getVerb } from '@/lib/verbs';

const word = (partial: Partial<Word> & Pick<Word, 'id' | 'hebrew' | 'nikud'>): Word => ({
  deck: 'greetings',
  level: 'elementary',
  theme: 'greetings',
  transcription: 'x',
  ru: 'тест',
  en: 'test',
  pos: 'noun',
  emoji: '',
  audio: null,
  example: { hebrew: '', nikud: '', transcription: '', ru: '', en: '' },
  ...partial,
});

describe('активное вспоминание', () => {
  it('не требует никуда и принимает софитные буквы', () => {
    expect(typedAnswerOk('מלך', 'מֶלֶךְ')).toBe(true);
    expect(typedAnswerOk('מלך', 'מלכ')).toBe(true);
    expect(typedAnswerOk('כתב', 'דבר')).toBe(false);
  });

  it('строит пропуск из примера из трёх и более слов', () => {
    const item = word({
      id: 'shalom',
      hebrew: 'שלום',
      nikud: 'שָׁלוֹם',
      example: {
        nikud: 'שָׁלוֹם, אֲנִי דָּנִי.',
        hebrew: 'שלום, אני דני.',
        transcription: '',
        ru: 'Привет',
        en: 'Hello',
      },
    });
    const cloze = clozeFromExample(item);
    expect(cloze).not.toBeNull();
    expect(cloze?.prompt).toContain('____');
    expect(cloze?.answer).toContain('שָׁלוֹם');
  });

  it('даёт пару согласования по роду', () => {
    const item = pickGenderItem(0, getVerb('ratzah'));
    expect(item.options).toHaveLength(2);
    expect(item.options).toContain(item.answer);
  });

  it('кладёт набор, клозе и согласование в урок, не ломая лимит пяти слов', () => {
    const progress = emptyProgress();
    progress.settings.onboarded = true;
    const id = nextLessonId(progress, 'elementary');
    const queue = buildLesson(progress, id as string);
    const newWords = new Set(queue.filter((card) => card.kind === 'word' && card.isNew).map((card) => card.refId));
    expect(newWords.size).toBeLessThanOrEqual(5);
    expect(queue.some((card) => card.exercise === 'type-word')).toBe(true);
    expect(queue.some((card) => card.exercise === 'gender-agree')).toBe(true);
    queue
      .filter((card) => card.exercise === 'listen-choice')
      .forEach((card) => {
        expect(card.refId.length).toBeGreaterThan(0);
      });
  });
});

import { spawnSync } from 'node:child_process';
import { join } from 'node:path';

import { issuesForSlang, issuesForWord } from '@/lib/lexicon-check';

const root = join(__dirname, '../..');

describe('проверка ru/en в лексиконе', () => {
  it('падает, если у записи нет ru или en', () => {
    expect(
      issuesForWord({ id: 'broken', ru: '', en: 'hello', example: { ru: 'привет', en: 'hello' } }, 'word:broken')
    ).toContain('word:broken.ru');
    expect(
      issuesForWord({ id: 'broken-en', ru: 'привет', en: '  ', example: { ru: 'Привет.', en: 'Hello.' } }, 'word:broken-en')
    ).toContain('word:broken-en.en');
    expect(
      issuesForSlang(
        { ru: 'ялла', en: 'yalla', example: { ru: 'Ялла.', en: 'Yalla.' }, usage: { ru: '', en: 'urging' } },
        'slang:x'
      )
    ).toContain('slang:x.usage.ru');
  });

  it('скрипт проверки проходит на текущих данных и падает на фикстуре без ru', () => {
    const ok = spawnSync('node', ['scripts/check-lexicon.mjs'], { cwd: root, encoding: 'utf8' });
    expect(ok.status).toBe(0);
    expect(ok.stdout).toMatch(/lexicon check ok/);

    const missing = spawnSync('node', ['scripts/check-lexicon.mjs', '--self-test-missing'], {
      cwd: root,
      encoding: 'utf8',
    });
    expect(missing.status).toBe(1);
    expect(missing.stderr).toMatch(/missing ru\/en/);
  });
});

import { allWords } from '@/lib/data';
import { loadedDialogues, loadedSlang } from '@/lib/lexicon';
import { exampleRepeatsLemma, hasCyrillic, isBlankExample } from '@/lib/lexicon-quality';

describe('качество лексикона', () => {
  it('в транскрипции нет кириллицы', () => {
    const hits: string[] = [];
    allWords().forEach((word) => {
      if (hasCyrillic(word.transcription) || hasCyrillic(word.example?.transcription)) {
        hits.push(`word:${word.id}`);
      }
    });
    loadedSlang().forEach((item) => {
      if (hasCyrillic(item.transcription) || hasCyrillic(item.example?.transcription)) {
        hits.push(`slang:${item.id}`);
      }
    });
    loadedDialogues().forEach((item) => {
      item.lines.forEach((line, index) => {
        if (hasCyrillic(line.transcription)) hits.push(`dialogue:${item.id}.lines[${index}]`);
      });
    });
    expect(hits).toEqual([]);
  });

  it('пример не повторяет само слово', () => {
    const hits = allWords()
      .filter((word) => !isBlankExample(word.example))
      .filter((word) => exampleRepeatsLemma(word.hebrew, word.example.hebrew) || exampleRepeatsLemma(word.nikud, word.example.nikud))
      .map((word) => word.id);
    expect(hits).toEqual([]);
  });

  it('нет дублей id и огласованных форм в словах и сленге', () => {
    const wordIds = allWords().map((word) => word.id);
    const wordHe = allWords().map((word) => word.hebrew);
    const slangIds = loadedSlang().map((item) => item.id);
    const slangHe = loadedSlang().map((item) => item.hebrew);
    const dialogueIds = loadedDialogues().map((item) => item.id);
    expect(new Set(wordIds).size).toBe(wordIds.length);
    expect(new Set(wordHe).size).toBe(wordHe.length);
    expect(new Set(slangIds).size).toBe(slangIds.length);
    expect(new Set(slangHe).size).toBe(slangHe.length);
    expect(new Set(dialogueIds).size).toBe(dialogueIds.length);
  });

  it('сленг — несколько сотен живых выражений, не две тысячи шаблонов', () => {
    const slang = loadedSlang();
    expect(slang.length).toBeGreaterThanOrEqual(300);
    expect(slang.length).toBeLessThanOrEqual(500);
    expect(slang.some((item) => item.id.startsWith('slang-x'))).toBe(false);
    slang.forEach((item) => {
      expect(item.usage.ru.length).toBeGreaterThan(8);
      expect(item.usage.en.length).toBeGreaterThan(8);
      expect(item.example.nikud.split(/\s+/).length).toBeGreaterThan(1);
    });
  });

  it('диалоги бытовые и не склеены из «יש X»', () => {
    const dialogues = loadedDialogues();
    expect(dialogues.length).toBeGreaterThanOrEqual(60);
    expect(dialogues.length).toBeLessThanOrEqual(124);
    dialogues.forEach((item) => {
      expect(item.lines.length).toBeGreaterThanOrEqual(2);
      expect(item.replies.filter((reply) => reply.correct).length).toBe(1);
      item.lines.forEach((line) => {
        expect(line.nikud.includes('יֵשׁ') && line.nikud.startsWith('מָה שְׁלוֹמְךָ')).toBe(false);
      });
    });
  });
});

#!/usr/bin/env node
/**
 * Падает, если у слова, сленга, примера, диалога, фразы или буквы нет ru или en.
 */
import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

export function isFilled(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

export function issuesForBilingual(item, path, fields = ['ru', 'en']) {
  const issues = [];
  for (const field of fields) {
    if (!isFilled(item?.[field])) issues.push(`${path}.${field}`);
  }
  return issues;
}

export function issuesForWord(word, path) {
  const issues = [
    ...issuesForBilingual(word, path),
    ...issuesForBilingual(word?.example ?? {}, `${path}.example`),
  ];
  return issues;
}

export function issuesForSlang(item, path) {
  return [
    ...issuesForWord(item, path),
    ...issuesForBilingual(item?.usage ?? {}, `${path}.usage`),
  ];
}

export function issuesForDialogue(dialogue, path) {
  const issues = [];
  (dialogue?.lines ?? []).forEach((line, index) => {
    issues.push(...issuesForBilingual(line, `${path}.lines[${index}]`));
  });
  (dialogue?.replies ?? []).forEach((reply, index) => {
    issues.push(...issuesForBilingual(reply, `${path}.replies[${index}]`));
  });
  if (!isFilled(dialogue?.title) || !isFilled(dialogue?.titleEn)) {
    if (!isFilled(dialogue?.title)) issues.push(`${path}.title`);
    if (!isFilled(dialogue?.titleEn)) issues.push(`${path}.titleEn`);
  }
  return issues;
}

export function collectIssues(bundle) {
  const issues = [];
  (bundle.words ?? []).forEach((word, index) => {
    issues.push(...issuesForWord(word, word.id ? `word:${word.id}` : `words[${index}]`));
  });
  (bundle.slang ?? []).forEach((item, index) => {
    issues.push(...issuesForSlang(item, item.id ? `slang:${item.id}` : `slang[${index}]`));
  });
  (bundle.dialogues ?? []).forEach((item, index) => {
    issues.push(...issuesForDialogue(item, item.id ? `dialogue:${item.id}` : `dialogues[${index}]`));
  });
  (bundle.phrases ?? []).forEach((phrase, index) => {
    const path = phrase.id ? `phrase:${phrase.id}` : `phrases[${index}]`;
    issues.push(...issuesForBilingual(phrase, path));
    (phrase.distractors ?? []).forEach((text, d) => {
      if (!isFilled(text)) issues.push(`${path}.distractors[${d}]`);
    });
    (phrase.distractorsEn ?? []).forEach((text, d) => {
      if (!isFilled(text)) issues.push(`${path}.distractorsEn[${d}]`);
    });
  });
  (bundle.passages ?? []).forEach((passage, index) => {
    const path = passage.id ? `passage:${passage.id}` : `passages[${index}]`;
    issues.push(...issuesForBilingual(passage, path));
    issues.push(...issuesForBilingual(passage.question ?? {}, `${path}.question`));
  });
  (bundle.letters ?? []).forEach((letter, index) => {
    const path = letter.id ? `letter:${letter.id}` : `letters[${index}]`;
    if (!isFilled(letter.nameRu) || !isFilled(letter.nameEn)) {
      if (!isFilled(letter.nameRu)) issues.push(`${path}.nameRu`);
      if (!isFilled(letter.nameEn)) issues.push(`${path}.nameEn`);
    }
    issues.push(...issuesForBilingual(letter.example ?? {}, `${path}.example`));
    if (letter.finalExample) {
      issues.push(...issuesForBilingual(letter.finalExample, `${path}.finalExample`));
    }
  });
  return issues;
}

function loadLexicon(root) {
  const lexiconDir = join(root, 'data/lexicon');
  const bundle = { words: [], slang: [], dialogues: [], phrases: [], passages: [], letters: [] };
  for (const file of readdirSync(lexiconDir)) {
    if (!file.endsWith('.json')) continue;
    const data = JSON.parse(readFileSync(join(lexiconDir, file), 'utf8'));
    if (Array.isArray(data.words)) bundle.words.push(...data.words);
    if (Array.isArray(data.slang)) bundle.slang.push(...data.slang);
    if (Array.isArray(data.dialogues)) bundle.dialogues.push(...data.dialogues);
  }
  const hebrew = JSON.parse(readFileSync(join(root, 'data/hebrew.json'), 'utf8'));
  bundle.phrases.push(...(hebrew.phrases ?? []));
  bundle.passages.push(...(hebrew.passages ?? []));
  bundle.letters.push(...(hebrew.letters ?? []));
  return bundle;
}

function missingFixture() {
  return {
    words: [{ id: 'broken', ru: '', en: 'hello', example: { ru: 'привет', en: 'hello' } }],
    slang: [],
    dialogues: [],
    phrases: [],
    passages: [],
    letters: [],
  };
}

export function runCheck({ root, selfTestMissing = false } = {}) {
  const bundle = selfTestMissing ? missingFixture() : loadLexicon(root);
  return collectIssues(bundle);
}

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (isMain) {
  const selfTestMissing = process.argv.includes('--self-test-missing');
  const root = join(dirname(fileURLToPath(import.meta.url)), '..');
  const issues = runCheck({ root, selfTestMissing });
  if (issues.length) {
    console.error(`lexicon check failed: ${issues.length} missing ru/en`);
    issues.slice(0, 40).forEach((issue) => console.error(`  ${issue}`));
    process.exit(1);
  }
  console.log('lexicon check ok');
}

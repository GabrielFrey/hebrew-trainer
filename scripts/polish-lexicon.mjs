#!/usr/bin/env node
/**
 * Чистит машинный русский в лексиконе, не трогая иврит, никуд и транскрипцию.
 * Примеры и диалоги переписывает на естественный русский / английский.
 */
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const dir = join(root, 'data/lexicon');

const BY_ID = {
  'f211-ra-u': { ru: 'видели', en: 'saw (they)' },
  'f430-oti': { ru: 'меня', en: 'me' },
  'f6-im': { ru: 'с', en: 'with' },
  'f176-ve-et': { ru: 'и', en: 'and the' },
  'f307-lilkrat': { ru: 'к / навстречу', en: 'towards' },
  'f355-letokh': { ru: 'внутрь', en: 'into' },
  'f519-klapei': { ru: 'к / по отношению к', en: 'towards' },
  'f1517-odot': { ru: 'о / насчёт', en: 'about' },
  shalom: { ru: 'привет / мир', en: 'hello / peace' },
  'f8-haya': { ru: 'был', en: 'was' },
  'f62-amar': { ru: 'сказал', en: 'said' },
  'f90-hekhel': { ru: 'начал', en: 'started' },
  'f101-rav': { ru: 'раввин / много / спорил', en: 'rabbi / many / fought' },
  'f1680-metsuya': { ru: 'есть / обычная / доступна', en: 'is around / common / available' },
};

function firstSense(text) {
  return String(text)
    .split(/\s*(?:\/|;|\/\/)\s*/)[0]
    .replace(/[«»""]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function cap(text) {
  const s = String(text).trim();
  if (!s) return s;
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function dedupeParts(text, sep) {
  const parts = text
    .split(sep)
    .map((part) => part.replace(/\s+/g, ' ').trim())
    .filter(Boolean);
  const seen = new Set();
  const out = [];
  for (const part of parts) {
    const key = part.toLowerCase().replace(/[().]/g, '').trim();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push(part);
  }
  return out.join(' / ');
}

function tidy(s) {
  return String(s)
    .replace(/\s*\/\/+\s*/g, ' / ')
    .replace(/\s*;\s*/g, ' / ')
    .replace(/\s*\/\s*/g, ' / ')
    .replace(/\s+,/g, ',')
    .replace(/,\s*,/g, ',')
    .replace(/\(\s+/g, '(')
    .replace(/\s+\)/g, ')')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/^[,/.\s]+|[,/.\s]+$/g, '');
}

export function polishEn(raw, fallback = '') {
  let s = String(raw ?? '').trim();
  if (!s) s = String(fallback ?? '').trim();
  s = s
    .replace(/\[X\]/gi, '')
    .replace(/\[the\]/gi, '')
    .replace(/\[a\]/gi, '')
    .replace(/\[an\]/gi, '')
    .replace(/\[is\]/gi, '')
    .replace(/\[to\]/gi, '')
    .replace(/\[of\]/gi, '')
    .replace(/\[at\]/gi, '')
    .replace(/\[in\]/gi, '')
    .replace(/\[on\]/gi, '')
    .replace(/\[for\]/gi, '')
    .replace(/\[[^\]]*\]/g, '')
    .replace(/\(m\.s\. imperative\)/gi, 'imp.')
    .replace(/\(m\.s\.\)/gi, '(m.)')
    .replace(/\(f\.s\.\)/gi, '(f.)')
    .replace(/\(m\.pl\.\)/gi, '(pl.)')
    .replace(/\(f\.pl\.\)/gi, '(f.pl.)')
    .replace(/\(m\)/gi, '(m.)')
    .replace(/\(f\)/gi, '(f.)');
  return dedupeParts(tidy(s), /\s*\/\s*/);
}

export function polishGloss(raw, fallback = '') {
  let s = String(raw ?? '').trim();
  if (!s) s = String(fallback ?? '').trim();
  s = s
    .replace(/\[the\]/gi, '')
    .replace(/\[a\]/gi, '')
    .replace(/\[an\]/gi, '')
    .replace(/\[is\]/gi, '')
    .replace(/\[to\]/gi, '')
    .replace(/\[of\]/gi, '')
    .replace(/\[at\]/gi, '')
    .replace(/\[in\]/gi, '')
    .replace(/\[on\]/gi, '')
    .replace(/\[for\]/gi, '')
    .replace(/\[X\]/gi, '')
    .replace(/\[Х\]/gi, '')
    .replace(/\[имя\]/gi, '')
    .replace(/\[что-то\]/gi, '')
    .replace(/\[день\/дата\]/g, 'день')
    .replace(/\[дни\]/g, 'дни')
    .replace(/\[время\]/g, 'время')
    .replace(/\[периода времени\]/g, 'какого-то времени')
    .replace(/\[если \(сленг\)\]/g, 'если, в сленге')
    .replace(/\[буквально:[^\]]*\]/gi, '')
    .replace(/\[Еврейское\]/g, 'Еврейское')
    .replace(/\[к\]/g, '')
    .replace(/\[в\]/g, '')
    .replace(/\[с\]/g, '')
    .replace(/\[на\]/g, '')
    .replace(/\[у\]/g, '')
    .replace(/\[из\]/g, '')
    .replace(/\[не\]/g, 'не')
    .replace(/\[туда\]/g, 'туда')
    .replace(/\[[^\]]*\]/g, '')
    .replace(/\(could also be a name\)/gi, 'также имя')
    .replace(/\(m\.s\. imperative\)/gi, 'пов.')
    .replace(/повелительное наклонение/g, 'пов.')
    .replace(/\(m\.s\.\)/gi, '(м.)')
    .replace(/\(f\.s\.\)/gi, '(ж.)')
    .replace(/\(m\.pl\.\)/gi, '(мн.)')
    .replace(/\(f\.pl\.\)/gi, '(мн. ж.)')
    .replace(/\(m\)/gi, '(м.)')
    .replace(/\(f\)/gi, '(ж.)')
    .replace(/\(мс\.?\)/gi, '(м.)')
    .replace(/\(жс\.?\)/gi, '(ж.)')
    .replace(/\(ф\.с\.\)/gi, '(ж.)')
    .replace(/\(м\.с\.\)/gi, '(м.)')
    .replace(/\(м\.пл\.\)/gi, '(мн.)')
    .replace(/\(ж\.пл\.\)/gi, '(мн. ж.)')
    .replace(/\(нареч\.\)/g, '');
  return dedupeParts(tidy(s), /\s*\/\s*/);
}

function exampleFrom(gloss, lang) {
  const sense = firstSense(gloss);
  const sentence = cap(sense);
  if (!sentence) return lang === 'en' ? 'This word.' : 'Это слово.';
  return /[.!?…]$/.test(sentence) ? sentence : `${sentence}.`;
}

const SLANG_RU = [
  [/^давай,\s*/i, (g) => `Ялла, ${g}!`],
  [/^норм, есть\s*/i, (g) => `Сабаба, есть ${g}.`],
  [/^ни за что без:\s*/i, (g) => `Ни за что без «${g}».`],
  [/^короче, это\s*/i, (g) => `Короче, это ${g}.`],
  [/^вот это да:\s*/i, (g) => `Вот это да: ${g} — огонь.`],
  [/^полный провал с:\s*/i, (g) => `Полный провал с «${g}».`],
  [/^бабки на\s*/i, (g) => `Бабки на ${g}.`],
  [/^положись на меня насчёт:\s*/i, (g) => `Положись на меня насчёт ${g}.`],
  [/^в итоге это\s*/i, (g) => `В итоге это ${g}.`],
  [/^плевать на\s*/i, (g) => `Плевать на ${g}.`],
];

const SLANG_EN = [
  [/^come on,\s*/i, (g) => `Come on, ${g}!`],
  [/^cool, we[’']ve got\s*/i, (g) => `Cool, we’ve got ${g}.`],
  [/^no way without\s*/i, (g) => `No way without ${g}.`],
  [/^anyway, it[’']s\s*/i, (g) => `Anyway, it’s ${g}.`],
  [/^wow,\s*/i, (g) => `Wow, ${g} is amazing.`],
  [/ was a disaster$/i, (g) => `${cap(g)} was a disaster.`],
  [/^cash for\s*/i, (g) => `Cash for ${g}.`],
  [/^I got\s*/i, (g) => `I’ve got ${g} covered.`],
  [/^all in all it[’']s\s*/i, (g) => `All in all it’s ${g}.`],
  [/^doesn[’']t give a damn about\s*/i, (g) => `Doesn’t give a damn about ${g}.`],
];

function applyFrame(text, frames) {
  const raw = String(text ?? '').trim();
  for (const [re, build] of frames) {
    if (re.test(raw)) {
      const inner = polishGloss(raw.replace(re, '').replace(/— огонь\.?$/u, '').replace(/ is amazing\.?$/i, ''));
      const sense = firstSense(inner) || inner;
      return build(sense);
    }
  }
  return polishGloss(raw);
}

function polishWord(word) {
  const override = BY_ID[word.id];
  const ru = polishGloss(override?.ru ?? word.ru, word.en);
  const en = polishEn(override?.en ?? word.en, word.ru) || word.en;
  word.ru = ru || word.ru;
  word.en = en || word.en;
  if (word.example) {
    const prevHe = word.example.hebrew;
    const prevNi = word.example.nikud;
    const prevTr = word.example.transcription;
    word.example.ru = exampleFrom(word.ru, 'ru');
    word.example.en = exampleFrom(word.en, 'en');
    word.example.hebrew = prevHe;
    word.example.nikud = prevNi;
    word.example.transcription = prevTr;
  }
  return word;
}

function polishSlang(item) {
  item.ru = applyFrame(item.ru, SLANG_RU);
  item.en = applyFrame(item.en, SLANG_EN);
  if (!item.ru) item.ru = polishGloss(item.ru, item.en);
  if (!item.en) item.en = polishEn(item.en, item.ru);
  if (item.usage) {
    item.usage.ru = polishGloss(item.usage.ru) || item.usage.ru;
    item.usage.en = String(item.usage.en ?? '').trim();
  }
  if (item.example) {
    const prevHe = item.example.hebrew;
    const prevNi = item.example.nikud;
    const prevTr = item.example.transcription;
    item.example.ru = exampleFrom(item.ru, 'ru');
    item.example.en = exampleFrom(item.en, 'en');
    item.example.hebrew = prevHe;
    item.example.nikud = prevNi;
    item.example.transcription = prevTr;
  }
  return item;
}

function extractAfter(text, re) {
  const match = String(text).match(re);
  return match ? match[1].trim() : firstSense(text);
}

function polishDialogue(dialogue) {
  for (const line of dialogue.lines ?? []) {
    if (line.speaker === 'a') {
      const ruInner = polishGloss(extractAfter(line.ru, /^Как дела\?\s*Есть\s*(.+)\?\s*$/u));
      const enInner = polishEn(extractAfter(line.en, /^How are you\?\s*Got\s*(.+)\?\s*$/i));
      line.ru = `Как дела? Есть ${firstSense(ruInner) || ruInner}?`;
      line.en = `How are you? Is there ${firstSense(enInner) || enInner}?`;
    } else {
      const ruInner = polishGloss(extractAfter(line.ru, /^Норм, есть\s*(.+)\.\s*$/u));
      const enInner = polishEn(extractAfter(line.en, /^Cool, we[’']ve got\s*(.+)\.\s*$/i));
      line.ru = `Сабаба, есть ${firstSense(ruInner) || ruInner}.`;
      line.en = `Cool, we’ve got ${firstSense(enInner) || enInner}.`;
    }
  }
  for (const reply of dialogue.replies ?? []) {
    reply.ru = polishGloss(reply.ru) || reply.ru;
    reply.en = String(reply.en ?? '').trim();
  }
  return dialogue;
}

function rewriteJson(file, mapper) {
  const path = join(dir, file);
  const data = JSON.parse(readFileSync(path, 'utf8'));
  mapper(data);
  writeFileSync(path, JSON.stringify(data));
}

for (const file of readdirSync(dir)) {
  if (file.startsWith('words-') && file.endsWith('.json')) {
    rewriteJson(file, (data) => {
      data.words = (data.words ?? []).map(polishWord);
    });
  } else if (file.startsWith('slang-') && file.endsWith('.json')) {
    rewriteJson(file, (data) => {
      data.slang = (data.slang ?? []).map(polishSlang);
    });
  } else if (file.startsWith('dialogues-') && file.endsWith('.json')) {
    rewriteJson(file, (data) => {
      data.dialogues = (data.dialogues ?? []).map(polishDialogue);
    });
  }
}

const hebrewPath = join(root, 'data/hebrew.json');
const hebrew = JSON.parse(readFileSync(hebrewPath, 'utf8'));
for (const word of hebrew.words ?? []) {
  polishWord(word);
}
for (const phrase of hebrew.phrases ?? []) {
  phrase.ru = polishGloss(phrase.ru, phrase.en) || phrase.ru;
  phrase.en = polishEn(phrase.en, phrase.ru) || phrase.en;
  phrase.distractors = (phrase.distractors ?? []).map((item) => polishGloss(item) || item);
  phrase.distractorsEn = (phrase.distractorsEn ?? []).map((item) => polishEn(item) || item);
}
for (const passage of hebrew.passages ?? []) {
  passage.ru = polishGloss(passage.ru, passage.en) || passage.ru;
  passage.en = String(passage.en ?? '').trim();
  if (passage.question) {
    passage.question.ru = polishGloss(passage.question.ru, passage.question.en) || passage.question.ru;
    passage.question.en = String(passage.question.en ?? '').trim();
  }
}
for (const letter of hebrew.letters ?? []) {
  if (letter.example) {
    letter.example.ru = polishGloss(letter.example.ru, letter.example.en) || letter.example.ru;
    letter.example.en = String(letter.example.en ?? '').trim();
  }
  if (letter.finalExample) {
    letter.finalExample.ru =
      polishGloss(letter.finalExample.ru, letter.finalExample.en) || letter.finalExample.ru;
    letter.finalExample.en = String(letter.finalExample.en ?? '').trim();
  }
}
writeFileSync(hebrewPath, JSON.stringify(hebrew, null, 2) + '\n');

console.log('lexicon polished');

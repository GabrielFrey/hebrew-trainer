import type { Href } from 'expo-router';

import type { Dialogue, LevelId, Slang, ThemeInfo, Unit, Word } from '@/lib/types';

type WordFile = { words: Word[] };
type SlangFile = { slang: Slang[] };
type DialogueFile = { dialogues: Dialogue[] };

export type Catalog = {
  themes: ThemeInfo[];
  units: Unit[];
  counts: { words: number; slang: number; dialogues: number };
};

const WORD_LOADERS: Record<LevelId, () => WordFile> = {
  elementary: () => require('@/data/lexicon/words-elementary.json') as WordFile,
  basic: () => require('@/data/lexicon/words-basic.json') as WordFile,
  intermediate: () => require('@/data/lexicon/words-intermediate.json') as WordFile,
  advanced: () => require('@/data/lexicon/words-advanced.json') as WordFile,
  expert: () => require('@/data/lexicon/words-expert.json') as WordFile,
};

const SLANG_LOADERS: Record<LevelId, () => SlangFile> = {
  elementary: () => require('@/data/lexicon/slang-elementary.json') as SlangFile,
  basic: () => require('@/data/lexicon/slang-basic.json') as SlangFile,
  intermediate: () => require('@/data/lexicon/slang-intermediate.json') as SlangFile,
  advanced: () => require('@/data/lexicon/slang-advanced.json') as SlangFile,
  expert: () => require('@/data/lexicon/slang-expert.json') as SlangFile,
};

const DIALOGUE_LOADERS: Record<LevelId, () => DialogueFile> = {
  elementary: () => require('@/data/lexicon/dialogues-elementary.json') as DialogueFile,
  basic: () => require('@/data/lexicon/dialogues-basic.json') as DialogueFile,
  intermediate: () => require('@/data/lexicon/dialogues-intermediate.json') as DialogueFile,
  advanced: () => require('@/data/lexicon/dialogues-advanced.json') as DialogueFile,
  expert: () => require('@/data/lexicon/dialogues-expert.json') as DialogueFile,
};

const LEVEL_ORDER: LevelId[] = ['elementary', 'basic', 'intermediate', 'advanced', 'expert'];

let catalogCache: Catalog | null = null;
const wordCache = new Map<LevelId, Word[]>();
const slangCache = new Map<LevelId, Slang[]>();
const dialogueCache = new Map<LevelId, Dialogue[]>();
const wordById = new Map<string, Word>();
const slangById = new Map<string, Slang>();
const dialogueById = new Map<string, Dialogue>();

export function getCatalog(): Catalog {
  if (!catalogCache) {
    catalogCache = require('@/data/lexicon/catalog.json') as Catalog;
  }
  return catalogCache;
}

function rememberWords(level: LevelId, list: Word[]) {
  wordCache.set(level, list);
  list.forEach((word) => wordById.set(word.id, word));
}

function rememberSlang(level: LevelId, list: Slang[]) {
  slangCache.set(level, list);
  list.forEach((item) => slangById.set(item.id, item));
}

function rememberDialogues(level: LevelId, list: Dialogue[]) {
  dialogueCache.set(level, list);
  list.forEach((item) => dialogueById.set(item.id, item));
}

function loadLevelSync(level: LevelId) {
  if (!wordCache.has(level)) rememberWords(level, WORD_LOADERS[level]().words);
  if (!slangCache.has(level)) rememberSlang(level, SLANG_LOADERS[level]().slang);
  if (!dialogueCache.has(level)) rememberDialogues(level, DIALOGUE_LOADERS[level]().dialogues);
}

/** Синхронно подгружает уровень и все, что ниже. Metro режет чанки по файлу уровня. */
export function ensureLevel(level: LevelId): void {
  const max = LEVEL_ORDER.indexOf(level);
  LEVEL_ORDER.slice(0, max + 1).forEach(loadLevelSync);
}

export function loadLexiconForTests(): void {
  LEVEL_ORDER.forEach(loadLevelSync);
}

export function loadedWords(): Word[] {
  return LEVEL_ORDER.flatMap((level) => wordCache.get(level) ?? []);
}

export function loadedSlang(): Slang[] {
  return LEVEL_ORDER.flatMap((level) => slangCache.get(level) ?? []);
}

export function loadedDialogues(): Dialogue[] {
  return LEVEL_ORDER.flatMap((level) => dialogueCache.get(level) ?? []);
}

export function getLexiconWord(id: string): Word | undefined {
  if (!wordById.has(id)) LEVEL_ORDER.forEach(loadLevelSync);
  return wordById.get(id);
}

export function getSlang(id: string): Slang | undefined {
  if (!slangById.has(id)) LEVEL_ORDER.forEach(loadLevelSync);
  return slangById.get(id);
}

export function getDialogue(id: string): Dialogue | undefined {
  if (!dialogueById.has(id)) LEVEL_ORDER.forEach(loadLevelSync);
  return dialogueById.get(id);
}

export function themeById(id: string): ThemeInfo | undefined {
  return getCatalog().themes.find((theme) => theme.id === id);
}

export function unitsForLevel(level: LevelId): Unit[] {
  const max = LEVEL_ORDER.indexOf(level);
  const allowed = new Set(LEVEL_ORDER.slice(0, max + 1));
  return getCatalog().units.filter((unit) => allowed.has(unit.level));
}

export function wordsForTheme(theme: string, level: LevelId): Word[] {
  ensureLevel(level);
  const max = LEVEL_ORDER.indexOf(level);
  const allowed = new Set(LEVEL_ORDER.slice(0, max + 1));
  return loadedWords().filter((word) => word.theme === theme && allowed.has(word.level));
}

export function lessonId(unitId: string, index: number): string {
  return `${unitId}:${index}`;
}

export function lessonPath(unitId: string, index: number): Href {
  return `/lesson/${encodeURIComponent(unitId)}/${index}` as Href;
}

export function parseLessonId(id: string): { unitId: string; index: number } | null {
  const raw = id.trim();
  const colon = raw.lastIndexOf(':');
  const slash = raw.lastIndexOf('/');
  const split = Math.max(colon, slash);
  if (split <= 0) return null;
  const index = Number(raw.slice(split + 1));
  if (!Number.isFinite(index)) return null;
  return { unitId: decodeURIComponent(raw.slice(0, split)), index };
}

export function lessonKeyFromSlug(slug: string | string[] | undefined): string {
  const parts = (Array.isArray(slug) ? slug : slug ? [slug] : []).map((part) =>
    decodeURIComponent(part)
  );
  if (parts.length >= 2) return lessonId(parts[0] as string, Number(parts[1]));
  if (parts.length === 1) {
    const parsed = parseLessonId(parts[0] as string);
    return parsed ? lessonId(parsed.unitId, parsed.index) : (parts[0] as string);
  }
  return '';
}

import { lessonId } from '@/lib/lexicon';
import type { LevelId, Progress, Unit } from '@/lib/types';

const MIN = 5;
const MAX = 8;

export type DisplayLesson = {
  sourceId: string;
  theme: string;
  index: number;
};

export type DisplayUnit = {
  id: string;
  level: LevelId;
  theme: string;
  order: number;
  lessonCount: number;
  wordCount: number;
  items: DisplayLesson[];
};

function splitSizes(n: number): number[] {
  if (n <= MAX) return [n];
  const chunks = Math.ceil(n / MAX);
  const base = Math.floor(n / chunks);
  const extra = n % chunks;
  return Array.from({ length: chunks }, (_, i) => base + (i < extra ? 1 : 0));
}

function lessonsOf(unit: Unit): DisplayLesson[] {
  return Array.from({ length: unit.lessonCount }, (_, index) => ({
    sourceId: unit.id,
    theme: unit.theme,
    index,
  }));
}

/**
 * Темы по 5–8 уроков: крупные («Частые слова») режутся, мелкие соседние
 * на том же уровне склеиваются. Ключи completedLessons не меняются.
 */
export function reshapeUnits(units: Unit[]): DisplayUnit[] {
  const split: DisplayUnit[] = [];
  units.forEach((unit) => {
    const sizes = splitSizes(unit.lessonCount);
    let cursor = 0;
    sizes.forEach((size, part) => {
      const items = lessonsOf(unit).slice(cursor, cursor + size);
      split.push({
        id: sizes.length === 1 ? unit.id : `${unit.id}~${part + 1}`,
        level: unit.level,
        theme: unit.theme,
        order: 0,
        lessonCount: items.length,
        wordCount: Math.max(1, Math.round((unit.wordCount / Math.max(1, unit.lessonCount)) * items.length)),
        items,
      });
      cursor += size;
    });
  });

  const merged: DisplayUnit[] = [];
  for (const unit of split) {
    const prev = merged[merged.length - 1];
    if (
      prev &&
      prev.level === unit.level &&
      prev.lessonCount < MIN &&
      prev.lessonCount + unit.lessonCount <= MAX
    ) {
      prev.items = [...prev.items, ...unit.items];
      prev.lessonCount = prev.items.length;
      prev.wordCount += unit.wordCount;
      prev.id = `${prev.items[0]?.sourceId ?? prev.id}+`;
      continue;
    }
    merged.push({ ...unit, items: [...unit.items] });
  }

  return merged.map((unit, order) => ({ ...unit, order: order + 1 }));
}

export function displayLessonProgress(progress: Progress, unit: DisplayUnit): number {
  const done = new Set(progress.completedLessons);
  return unit.items.filter((item) => done.has(lessonId(item.sourceId, item.index))).length;
}

export function displayUnitUnlocked(
  progress: Progress,
  units: DisplayUnit[],
  unit: DisplayUnit
): boolean {
  const index = units.findIndex((item) => item.id === unit.id);
  if (index <= 0) return true;
  const prev = units[index - 1];
  return prev ? displayLessonProgress(progress, prev) >= prev.lessonCount : true;
}

export function nextDisplayLesson(
  progress: Progress,
  unit: DisplayUnit
): DisplayLesson | null {
  const done = new Set(progress.completedLessons);
  return unit.items.find((item) => !done.has(lessonId(item.sourceId, item.index))) ?? unit.items[0] ?? null;
}

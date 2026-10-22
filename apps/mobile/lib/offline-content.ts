/** Pure, dependency-free offline data for tabs when the API is unreachable (testable in Node). */

export type SrsCard = {
  id: string;
  kind: string;
  prompt: Record<string, unknown>;
  accepted: string[];
  step: number;
  due_day: string;
};

export const SRS_STEPS = [1, 3, 7, 14, 30];

const PRINT = "אבגדהוזחטיכלמנסעפצקרשת".split("");
const FINALS: Record<string, string> = { כ: "ך", מ: "ם", נ: "ן", פ: "ף", צ: "ץ" };
const NAMES = [
  "alef", "bet", "gimel", "dalet", "he", "vav", "zayin", "het", "tet", "yod", "kaf",
  "lamed", "mem", "nun", "samekh", "ayin", "pe", "tsadi", "qof", "resh", "shin", "tav",
];

export function offlineAlphabet() {
  return {
    print: PRINT.map((glyph, i) => ({ glyph, name: NAMES[i], final: FINALS[glyph] })),
    cursive_note: "OFL cursive webfont is not vendored yet; strokes are print-first.",
    lookalikes: [["ב", "כ"], ["ד", "ר"], ["ה", "ח", "ת"], ["ו", "ז", "ן"], ["ס", "ם"]],
  };
}


export function today(now: Date = new Date()): string {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function addDays(day: string, n: number): string {
  const [y, m, d] = day.split("-").map(Number);
  return today(new Date(y, m - 1, d + n));
}

export function dueCards(cards: Record<string, SrsCard>, day = today()): SrsCard[] {
  return Object.values(cards).filter((c) => c.due_day <= day);
}

/** Correct: advance one step; wrong: back to step 0 (due tomorrow). */
export function scheduleCard(card: SrsCard, correct: boolean, day = today()): SrsCard {
  const step = correct ? Math.min(card.step + 1, SRS_STEPS.length - 1) : 0;
  return { ...card, step, due_day: addDays(day, SRS_STEPS[step]) };
}

export function offlinePractice(
  done: Record<string, number>,
  cards: Record<string, SrsCard>,
  hearts: number,
  day = today(),
) {
  return {
    due_cards: dueCards(cards, day).length,
    weak_lessons: Object.entries(done)
      .filter(([, acc]) => (acc || 0) < 1)
      .map(([slug]) => slug)
      .slice(0, 8),
    hearts,
  };
}

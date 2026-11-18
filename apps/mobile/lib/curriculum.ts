/**
 * Expands content/curriculum.json (built by scripts/build_curriculum.py) into catalog lessons.
 * Pure and dependency-free so it runs under node:test. Exercises are generated on demand and
 * deterministically from the lesson slug, so an attempt grades identically after a restart.
 */

export type Loc = Record<string, string>;
type Example = { p: string; en: string; ru: string };
type Gloss = { en: string; ru: string; uk?: string; es?: string; fr?: string };

export type WordItem = Gloss & {
  t: "w" | "s" | "i";
  he: string;
  p: string;
  tr?: string;
  pos?: string;
  ex?: Example;
  usage?: Loc;
  lit?: Loc;
  review?: 1;
  src: string;
};
export type DialogueItem = {
  t: "d";
  title: Loc;
  lines: Array<{ s: string; p: string; en: string; ru: string }>;
  replies: Array<{ p: string; en: string; ru: string; ok?: 1 }>;
  review?: 1;
  src: string;
};
export type VerseItem = Gloss & { t: "v"; he: string; p: string; ref: Loc; src: Loc; note?: Loc; uk: string; es: string; fr: string };
export type CurriculumItem = WordItem | DialogueItem | VerseItem;

export type CurriculumLesson = { slug: string; kind: "words" | "slang" | "idioms" | "dialogue" | "verses"; title: Loc; items: string[] };
export type CurriculumStage = {
  id: string;
  ulpan: string;
  cefr: string;
  opensAfter: string;
  section?: boolean;
  title: Loc;
  gate: { slug: string; kind: string; title: Loc; objective: Loc };
  lessons: CurriculumLesson[];
};
export type Curriculum = { version: number; stages: CurriculumStage[]; items: Record<string, CurriculumItem> };

export type CatalogExercise = Record<string, unknown> & { id: string; type: string };
export type CatalogLesson = {
  slug: string;
  track: string;
  level: string;
  cefr: string;
  kind: string;
  prerequisites: string[];
  title: Loc;
  objective: Loc;
  explanation: Loc;
  vocabulary: Array<Record<string, string | null>>;
  exercises: CatalogExercise[];
  threshold?: number;
  l10n_fallback?: string[];
};
export type CatalogLevel = { id: string; ulpan: string; cefr: string; opensAfter?: string; section?: boolean };
export type Catalog = {
  lessons: CatalogLesson[];
  levels: CatalogLevel[];
  stageTitles: Record<string, Loc>;
  checkpointSlugs: Record<string, string>;
  gateKinds: string[];
};

const LANGS = ["en", "ru", "uk", "es", "fr"] as const;
const DRAFT_LANGS = ["uk", "es", "fr"] as const;
const GATE_SIZE = 12;

const T: Record<string, Loc> = {
  mean: { en: "What does {w} mean?", ru: "Что значит {w}?", uk: "Що означає {w}?", es: "¿Qué significa {w}?", fr: "Que signifie {w} ?" },
  pick: { en: "Which word means “{g}”?", ru: "Какое слово значит «{g}»?", uk: "Яке слово означає «{g}»?", es: "¿Qué palabra significa «{g}»?", fr: "Quel mot signifie « {g} » ?" },
  typeHe: { en: "Type in Hebrew: {g}", ru: "Наберите на иврите: {g}", uk: "Наберіть івритом: {g}", es: "Escribe en hebreo: {g}", fr: "Tapez en hébreu : {g}" },
  match: { en: "Match the pairs", ru: "Сопоставьте пары", uk: "Зіставте пари", es: "Une las parejas", fr: "Associez les paires" },
  build: { en: "Build the sentence: {g}", ru: "Соберите предложение: {g}", uk: "Складіть речення: {g}", es: "Construye la frase: {g}", fr: "Construisez la phrase : {g}" },
  reply: { en: "Choose the best reply", ru: "Выберите подходящий ответ", uk: "Оберіть доречну відповідь", es: "Elige la mejor respuesta", fr: "Choisissez la meilleure réponse" },
  line: { en: "What does this line mean?", ru: "Что значит эта реплика?", uk: "Що означає ця репліка?", es: "¿Qué significa esta frase?", fr: "Que veut dire cette réplique ?" },
  verse: { en: "What does this verse mean?", ru: "Что значит этот стих?", uk: "Що означає цей вірш?", es: "¿Qué significa este versículo?", fr: "Que signifie ce verset ?" },
  buildVerse: { en: "Put the verse in order: {g}", ru: "Соберите стих: {g}", uk: "Складіть вірш: {g}", es: "Ordena el versículo: {g}", fr: "Remettez le verset en ordre : {g}" },
  learnWords: { en: "New words: {list}", ru: "Новые слова: {list}", uk: "Нові слова: {list}", es: "Palabras nuevas: {list}", fr: "Nouveaux mots : {list}" },
  learnExpr: { en: "New expressions: {list}", ru: "Новые выражения: {list}", uk: "Нові вирази: {list}", es: "Expresiones nuevas: {list}", fr: "Nouvelles expressions : {list}" },
  dialogues: {
    en: "Read short dialogues and pick the right reply.",
    ru: "Читайте короткие диалоги и выбирайте подходящий ответ.",
    uk: "Читайте короткі діалоги й обирайте доречну відповідь.",
    es: "Lee diálogos breves y elige la respuesta adecuada.",
    fr: "Lisez de courts dialogues et choisissez la bonne réponse.",
  },
  verses: {
    en: "Read verses of the Hebrew Bible in the original. Translations are public-domain editions.",
    ru: "Читайте стихи Танаха в оригинале. Переводы — общественное достояние.",
    uk: "Читайте вірші Танаху в оригіналі. Переклади — суспільне надбання.",
    es: "Lee versículos de la Biblia hebrea en el original. Las traducciones son de dominio público.",
    fr: "Lisez des versets de la Bible hébraïque dans l’original. Les traductions sont du domaine public.",
  },
};
const TRACK: Record<CurriculumLesson["kind"], string> = {
  words: "vocabulary",
  slang: "slang",
  idioms: "idioms",
  dialogue: "conversation",
  verses: "literature",
};

function fill(template: Loc, vars: (lang: string) => Record<string, string>): Loc {
  const out: Loc = {};
  for (const lang of LANGS) {
    const v = vars(lang);
    out[lang] = template[lang].replace(/\{(\w+)\}/g, (whole, key: string) => (key in v ? v[key] : whole));
  }
  return out;
}

function gloss(item: Gloss, lang: string): string {
  return (item as Record<string, string | undefined>)[lang] || item.en;
}

function glossRecord(item: Gloss): Loc {
  const out: Loc = { en: item.en, ru: item.ru };
  for (const lang of DRAFT_LANGS) if (item[lang]) out[lang] = item[lang]!;
  return out;
}

function hash(text: string): number {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function rng(seed: string): () => number {
  let a = hash(seed);
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffle<T>(list: T[], rand: () => number): T[] {
  const out = [...list];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

function pickDistinct<T>(pool: T[], n: number, rand: () => number, ok: (x: T) => boolean): T[] {
  return shuffle(pool.filter(ok), rand).slice(0, n);
}

/** Tokens for a build exercise, or null when the sentence repeats a token or is too short/long. */
function buildTokens(pointed: string, max = 8): string[] | null {
  const tokens = pointed.trim().split(/\s+/);
  if (tokens.length < 3 || tokens.length > max || new Set(tokens).size !== tokens.length) return null;
  return tokens;
}

function scrambled(tokens: string[], rand: () => number): string[] {
  let out = shuffle(tokens, rand);
  if (out.join(" ") === tokens.join(" ")) out = [...tokens.slice(1), tokens[0]];
  return out;
}

export function createCurriculum(data: Curriculum) {
  const stageOf = new Map<string, CurriculumStage>();
  const lessonOf = new Map<string, { stage: CurriculumStage; lesson: CurriculumLesson; index: number }>();
  for (const stage of data.stages) {
    stageOf.set(stage.gate.slug, stage);
    stage.lessons.forEach((lesson, index) => lessonOf.set(lesson.slug, { stage, lesson, index }));
  }
  const pools = new Map<string, Array<[string, CurriculumItem]>>();
  function pool(stage: CurriculumStage, type: CurriculumItem["t"]): Array<[string, CurriculumItem]> {
    const key = `${stage.id}:${type}`;
    if (!pools.has(key)) {
      const ids = stage.lessons.flatMap((l) => l.items);
      pools.set(
        key,
        ids.map((id) => [id, data.items[id]] as [string, CurriculumItem]).filter(([, it]) => it.t === type),
      );
    }
    return pools.get(key)!;
  }

  function meaningChoice(id: string, item: WordItem, stage: CurriculumStage, rand: () => number): CatalogExercise["choices"] {
    const distractors = pickDistinct(pool(stage, item.t), 3, rand, ([oid, o]) => oid !== id && (o as WordItem).en !== item.en && (o as WordItem).ru !== item.ru);
    return shuffle(
      [[id, item] as [string, CurriculumItem], ...distractors].map(([cid, c]) => ({ id: cid, ...glossRecord(c as WordItem) })),
      rand,
    );
  }

  function meanExercise(slug: string, n: number, id: string, item: WordItem, stage: CurriculumStage, rand: () => number): CatalogExercise {
    return {
      id: `${slug}-mean-${n}`,
      type: "mc",
      prompt: { ...fill(T.mean, () => ({ w: item.he })), he: item.p },
      choices: meaningChoice(id, item, stage, rand),
      accepted: [id],
      mode: "relaxed",
      xp: 10,
    };
  }

  function replyExercise(slug: string, n: number, item: DialogueItem, rand: () => number): CatalogExercise {
    const replies = shuffle(
      item.replies.map((r, i) => ({ id: `r${i}`, he: r.p, ok: r.ok })),
      rand,
    );
    return {
      id: `${slug}-reply-${n}`,
      type: "mc",
      prompt: T.reply,
      context: item.lines.map((ln) => ({ speaker: ln.s, he: ln.p, tr: { en: ln.en, ru: ln.ru } })),
      choices: replies.map(({ id, he }) => ({ id, he })),
      accepted: [replies.find((r) => r.ok)!.id],
      mode: "relaxed",
      xp: 10,
    };
  }

  function verseExercise(slug: string, n: number, id: string, item: VerseItem, stage: CurriculumStage, rand: () => number): CatalogExercise {
    const others = pickDistinct(pool(stage, "v"), 3, rand, ([oid]) => oid !== id);
    return {
      id: `${slug}-verse-${n}`,
      type: "mc",
      prompt: T.verse,
      context: [{ he: item.p, source: item.ref }],
      choices: shuffle(
        [[id, item] as [string, CurriculumItem], ...others].map(([cid, c]) => {
          const v = c as VerseItem;
          return { id: cid, en: v.en, ru: v.ru, uk: v.uk, es: v.es, fr: v.fr };
        }),
        rand,
      ),
      accepted: [id],
      mode: "relaxed",
      xp: 10,
    };
  }

  function wordExercises(slug: string, ids: string[], stage: CurriculumStage, rand: () => number): CatalogExercise[] {
    const rows = ids.map((id) => [id, data.items[id] as WordItem] as const);
    const out: CatalogExercise[] = [];
    const order = shuffle([...rows], rand);
    order.slice(0, 4).forEach(([id, item], i) => out.push(meanExercise(slug, i + 1, id, item, stage, rand)));
    order.slice(4, 6).forEach(([id, item], i) => {
      const others = pickDistinct(
        [...rows.filter(([oid]) => oid !== id), ...pool(stage, item.t).filter(([oid]) => !ids.includes(oid))] as Array<readonly [string, CurriculumItem]>,
        3,
        rand,
        ([, o]) => (o as WordItem).he !== item.he && (o as WordItem).en !== item.en && (o as WordItem).ru !== item.ru,
      );
      out.push({
        id: `${slug}-pick-${i + 1}`,
        type: "mc",
        prompt: fill(T.pick, (lang) => ({ g: gloss(item, lang) })),
        choices: shuffle(
          [[id, item] as readonly [string, CurriculumItem], ...others].map(([cid, c]) => ({ id: cid, he: (c as WordItem).he, pointed: (c as WordItem).p })),
          rand,
        ),
        accepted: [id],
        mode: "relaxed",
        xp: 10,
      });
    });
    const typeable = rows.filter(([, it]) => !/\s/.test(it.he) && it.he.length >= 2 && it.he.length <= 7);
    shuffle(typeable, rand)
      .slice(0, 2)
      .forEach(([, item], i) =>
        out.push({
          id: `${slug}-type-${i + 1}`,
          type: "type_he",
          prompt: { ...fill(T.typeHe, (lang) => ({ g: gloss(item, lang) })) },
          accepted: [item.he],
          mode: "relaxed",
          keyboard: true,
          xp: 10,
        }),
      );
    const matchRows = shuffle(rows.filter(([, it]) => it.he.length <= 24), rand).slice(0, 4);
    if (matchRows.length >= 3 && new Set(matchRows.map(([, it]) => it.he)).size === matchRows.length) {
      const byLang: Record<string, Record<string, string>> = {};
      for (const lang of LANGS) {
        if (matchRows.every(([, it]) => (it as Record<string, unknown>)[lang])) {
          byLang[lang] = Object.fromEntries(matchRows.map(([, it]) => [it.he, gloss(it, lang)]));
        }
      }
      out.push({
        id: `${slug}-match`,
        type: "match_tap",
        prompt: T.match,
        left: matchRows.map(([, it]) => it.he),
        right: matchRows.map(([, it]) => it.en),
        pairs: byLang.en,
        pairs_by_lang: byLang,
        xp: 10,
      });
    }
    const withExample = rows.find(([, it]) => it.ex && buildTokens(it.ex.p));
    if (withExample) {
      const ex = withExample[1].ex!;
      const tokens = buildTokens(ex.p)!;
      out.push({
        id: `${slug}-build`,
        type: "order_rtl",
        prompt: fill(T.build, (lang) => ({ g: (ex as Record<string, string>)[lang] || ex.en })),
        tokens: scrambled(tokens, rand),
        accepted: tokens,
        mode: "relaxed",
        xp: 10,
      });
    }
    return out;
  }

  function dialogueExercises(slug: string, ids: string[], stage: CurriculumStage, rand: () => number): CatalogExercise[] {
    const out: CatalogExercise[] = [];
    ids.forEach((id, n) => {
      const item = data.items[id] as DialogueItem;
      out.push(replyExercise(slug, n + 1, item, rand));
      const line = item.lines[item.lines.length - 1];
      const others = pickDistinct(pool(stage, "d"), 2, rand, ([oid]) => oid !== id).map(([, o]) => (o as DialogueItem).lines[(o as DialogueItem).lines.length - 1]);
      const lineChoices = shuffle(
        [line, ...others].map((ln, i) => ({ id: i === 0 ? "right" : `other${i}`, en: ln.en, ru: ln.ru })),
        rand,
      );
      out.push({
        id: `${slug}-line-${n + 1}`,
        type: "mc",
        prompt: T.line,
        context: [{ speaker: line.s, he: line.p }],
        choices: lineChoices,
        accepted: ["right"],
        mode: "relaxed",
        xp: 10,
      });
      const first = item.lines[0];
      const tokens = buildTokens(first.p, 9);
      if (tokens) {
        out.push({
          id: `${slug}-build-${n + 1}`,
          type: "order_rtl",
          prompt: fill(T.build, (lang) => ({ g: (first as Record<string, string>)[lang] || first.en })),
          tokens: scrambled(tokens, rand),
          accepted: tokens,
          mode: "relaxed",
          xp: 10,
        });
      }
    });
    return out;
  }

  function verseExercises(slug: string, ids: string[], stage: CurriculumStage, rand: () => number): CatalogExercise[] {
    const out = ids.map((id, n) => verseExercise(slug, n + 1, id, data.items[id] as VerseItem, stage, rand));
    const buildable = ids
      .map((id) => data.items[id] as VerseItem)
      .filter((v) => buildTokens(v.p))
      .sort((a, b) => a.p.length - b.p.length)
      .slice(0, 3);
    buildable.forEach((v, n) =>
      out.push({
        id: `${slug}-order-${n + 1}`,
        type: "order_rtl",
        prompt: fill(T.buildVerse, (lang) => ({ g: gloss(v, lang) })),
        tokens: scrambled(buildTokens(v.p)!, rand),
        accepted: buildTokens(v.p)!,
        mode: "relaxed",
        xp: 10,
      }),
    );
    return out;
  }

  function vocabularyRow(item: CurriculumItem): Array<Record<string, string | null>> {
    if (item.t === "d") {
      return [...item.lines, item.replies.find((r) => r.ok)!].map((ln) => ({
        kind: "line",
        lemma: ln.p,
        pointed: ln.p,
        en: ln.en,
        ru: ln.ru,
        title_en: item.title.en,
        title_ru: item.title.ru,
        review: item.review ? "1" : null,
        source: item.src,
      }));
    }
    if (item.t === "v") {
      const row: Record<string, string | null> = { kind: "verse", lemma: item.he, pointed: item.p, note_en: item.note?.en || null, note_ru: item.note?.ru || null };
      for (const lang of LANGS) {
        row[lang] = item[lang];
        row[`ref_${lang}`] = item.ref[lang];
        row[`source_${lang}`] = item.src[lang];
      }
      row.source_he = item.src.he;
      return [row];
    }
    return [
      {
        kind: item.t === "s" ? "slang" : item.t === "i" ? "idiom" : "word",
        lemma: item.he,
        pointed: item.p,
        unpointed: item.he,
        translit: item.tr || null,
        ...glossRecord(item),
        pos: item.pos || null,
        example_he: item.ex?.p || null,
        example_en: item.ex?.en || null,
        example_ru: item.ex?.ru || null,
        usage_en: item.usage?.en || null,
        usage_ru: item.usage?.ru || null,
        literal_en: item.lit?.en || null,
        literal_ru: item.lit?.ru || null,
        review: item.review ? "1" : null,
        source: item.src,
      },
    ];
  }

  function fallbackLangs(ids: string[]): string[] {
    return DRAFT_LANGS.filter((lang) =>
      ids.some((id) => {
        const it = data.items[id];
        return it.t === "d" || !(it as Record<string, unknown>)[lang];
      }),
    );
  }

  function lessonMeta(stage: CurriculumStage, lesson: CurriculumLesson, index: number): CatalogLesson {
    const firstWords = lesson.items
      .slice(0, 3)
      .map((id) => data.items[id])
      .filter((it): it is WordItem => it.t === "w" || it.t === "s" || it.t === "i")
      .map((it) => it.he);
    const objective =
      lesson.kind === "dialogue"
        ? T.dialogues
        : lesson.kind === "verses"
          ? T.verses
          : fill(lesson.kind === "words" ? T.learnWords : T.learnExpr, () => ({ list: `${firstWords.join(", ")}…` }));
    const prev = stage.lessons[index - 1];
    return {
      slug: lesson.slug,
      track: TRACK[lesson.kind],
      level: stage.id,
      cefr: stage.cefr,
      kind: "lesson",
      prerequisites: prev ? [prev.slug] : [],
      title: lesson.title,
      objective,
      explanation: objective,
      vocabulary: [],
      exercises: [],
      l10n_fallback: fallbackLangs(lesson.items),
    };
  }

  function gateMeta(stage: CurriculumStage): CatalogLesson {
    return {
      slug: stage.gate.slug,
      track: "review",
      level: stage.id,
      cefr: stage.cefr,
      kind: stage.gate.kind,
      prerequisites: [],
      title: stage.gate.title,
      objective: stage.gate.objective,
      explanation: stage.gate.objective,
      vocabulary: [],
      exercises: [],
      l10n_fallback: fallbackLangs(stage.lessons.flatMap((l) => l.items)),
    };
  }

  function gateExercises(stage: CurriculumStage): CatalogExercise[] {
    const rand = rng(stage.gate.slug);
    const lessons = stage.lessons;
    const picks = Math.min(GATE_SIZE, lessons.length * 2);
    const out: CatalogExercise[] = [];
    for (let i = 0; i < picks; i++) {
      const lesson = lessons[Math.round((i * (lessons.length - 1)) / Math.max(1, picks - 1))];
      const id = lesson.items[Math.floor(rand() * lesson.items.length)];
      const item = data.items[id];
      const slug = `${stage.gate.slug}-${i + 1}`;
      if (item.t === "d") out.push(replyExercise(slug, 1, item, rand));
      else if (item.t === "v") out.push(verseExercise(slug, 1, id, item, stage, rand));
      else out.push(meanExercise(slug, 1, id, item, stage, rand));
    }
    return out;
  }

  const cache = new Map<string, CatalogLesson>();

  /** Full lesson (vocabulary + exercises) for a curriculum slug, or undefined. */
  function lesson(slug: string): CatalogLesson | undefined {
    if (cache.has(slug)) return cache.get(slug);
    let full: CatalogLesson | undefined;
    const gateStage = stageOf.get(slug);
    if (gateStage) {
      full = { ...gateMeta(gateStage), exercises: gateExercises(gateStage) };
    } else {
      const found = lessonOf.get(slug);
      if (!found) return undefined;
      const { stage, lesson: spec, index } = found;
      const rand = rng(slug);
      const exercises =
        spec.kind === "dialogue"
          ? dialogueExercises(slug, spec.items, stage, rand)
          : spec.kind === "verses"
            ? verseExercises(slug, spec.items, stage, rand)
            : wordExercises(slug, spec.items, stage, rand);
      full = {
        ...lessonMeta(stage, spec, index),
        vocabulary: spec.items.flatMap((id) => vocabularyRow(data.items[id])),
        exercises,
      };
    }
    cache.set(slug, full);
    return full;
  }

  /** Path metadata only (no exercises), in stage order with each gate last. */
  function lessonStubs(): CatalogLesson[] {
    return data.stages.flatMap((stage) => [...stage.lessons.map((l, i) => lessonMeta(stage, l, i)), gateMeta(stage)]);
  }

  return { lesson, lessonStubs, stages: data.stages };
}

/**
 * Published catalog + curriculum. Curriculum stages are listed in path order and follow the
 * published-only stages; `lesson(slug)` returns full lessons from either source.
 */
export function mergeCatalog<C extends Catalog>(published: C, data: Curriculum) {
  const curriculum = createCurriculum(data);
  const ids = new Set(data.stages.map((s) => s.id));
  const levels: CatalogLevel[] = [
    ...published.levels.filter((l) => !ids.has(l.id)),
    ...data.stages.map((s) => ({ id: s.id, ulpan: s.ulpan, cefr: s.cefr, opensAfter: s.opensAfter, ...(s.section ? { section: true } : {}) })),
  ];
  const stageTitles = { ...published.stageTitles };
  const checkpointSlugs = { ...published.checkpointSlugs };
  for (const stage of data.stages) {
    stageTitles[stage.id] = stage.title;
    checkpointSlugs[stage.id] = stage.gate.slug;
  }
  const catalog = {
    ...published,
    levels,
    stageTitles,
    checkpointSlugs,
    lessons: [...published.lessons, ...curriculum.lessonStubs()],
  };
  const bySlug = new Map(published.lessons.map((l) => [l.slug, l]));
  function lesson(slug: string): CatalogLesson | undefined {
    return bySlug.get(slug) || curriculum.lesson(slug);
  }
  return { catalog, lesson };
}

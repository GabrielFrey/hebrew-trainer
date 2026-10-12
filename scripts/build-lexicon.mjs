#!/usr/bin/env node
/**
 * Собирает лексикон: 5000 частых слов + 2000 разговорных выражений,
 * юниты Mondly, диалоги. Пишет data/lexicon/*.json по уровням.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const LEVELS = ['elementary', 'basic', 'intermediate', 'advanced', 'expert'];
const NIKUD_RE = /[\u0591-\u05C7]/;

const THEMES = [
  ['greetings', '👋', 'Приветствия', 'Greetings', ['hello', 'please', 'thank', 'sorry', 'yes', 'no', 'peace']],
  ['people', '👤', 'Люди', 'People', ['i ', 'you', 'he ', 'she ', 'we ', 'they', 'man', 'woman', 'people', 'person', 'friend']],
  ['family', '👨‍👩‍👧', 'Семья', 'Family', ['father', 'mother', 'son', 'daughter', 'brother', 'sister', 'family', 'child', 'wife', 'husband']],
  ['numbers', '🔢', 'Числа', 'Numbers', ['one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'hundred', 'thousand', 'number']],
  ['time', '⏰', 'Время', 'Time', ['day', 'night', 'year', 'week', 'hour', 'minute', 'today', 'tomorrow', 'yesterday', 'time', 'morning']],
  ['food', '🍽️', 'Еда', 'Food', ['food', 'eat', 'bread', 'water', 'milk', 'meat', 'fruit', 'coffee', 'tea', 'restaurant']],
  ['home', '🏠', 'Дом', 'Home', ['house', 'home', 'room', 'door', 'window', 'table', 'bed', 'kitchen']],
  ['city', '🏙️', 'Город', 'City', ['city', 'street', 'road', 'bus', 'car', 'train', 'store', 'shop']],
  ['travel', '✈️', 'Поездки', 'Travel', ['travel', 'ticket', 'hotel', 'airport', 'passport', 'trip', 'visit']],
  ['work', '💼', 'Работа', 'Work', ['work', 'job', 'office', 'company', 'money', 'pay']],
  ['school', '📚', 'Учёба', 'School', ['school', 'book', 'read', 'write', 'study', 'teacher', 'student', 'language']],
  ['health', '🩺', 'Здоровье', 'Health', ['health', 'doctor', 'hospital', 'sick', 'pain', 'medicine']],
  ['body', '🧍', 'Тело', 'Body', ['hand', 'head', 'eye', 'face', 'body', 'heart', 'leg', 'ear']],
  ['clothes', '👕', 'Одежда', 'Clothes', ['shirt', 'dress', 'shoe', 'hat', 'wear', 'clothes']],
  ['colors', '🎨', 'Цвета', 'Colors', ['red', 'blue', 'green', 'white', 'black', 'color', 'yellow']],
  ['animals', '🐶', 'Животные', 'Animals', ['dog', 'cat', 'animal', 'bird', 'horse', 'fish']],
  ['nature', '🌿', 'Природа', 'Nature', ['tree', 'sea', 'water', 'sun', 'world', 'land', 'mountain', 'river']],
  ['weather', '☀️', 'Погода', 'Weather', ['rain', 'hot', 'cold', 'weather', 'wind', 'snow']],
  ['shopping', '🛒', 'Покупки', 'Shopping', ['buy', 'price', 'market', 'shop', 'sell', 'cheap', 'expensive']],
  ['feelings', '😊', 'Чувства', 'Feelings', ['love', 'like', 'want', 'happy', 'sad', 'good', 'bad', 'feel']],
  ['verbs', '🏃', 'Глаголы', 'Verbs', ['go', 'come', 'see', 'know', 'say', 'make', 'take', 'give', 'was', 'be ']],
  ['daily', '🗓️', 'Быт', 'Daily life', ['need', 'can', 'must', 'here', 'there', 'now', 'also']],
  ['tech', '💻', 'Технологии', 'Technology', ['phone', 'computer', 'internet', 'app', 'data']],
  ['news', '📰', 'Новости', 'News', ['government', 'state', 'war', 'news', 'police', 'law']],
  ['abstract', '💭', 'Абстрактное', 'Abstract', ['life', 'thing', 'way', 'part', 'new', 'old', 'same', 'other']],
  ['core', '⭐', 'Частые слова', 'Core words', []],
];

const THEME_EMOJI = Object.fromEntries(THEMES.map((t) => [t[0], t[1]]));
const DECK_TO_THEME = {
  frequent: 'greetings',
  numbers: 'numbers',
  family: 'family',
  food: 'food',
  'verbs-present': 'verbs',
  'verbs-past': 'verbs',
  'verbs-future': 'verbs',
  daily: 'daily',
  news: 'news',
  abstract: 'abstract',
  idioms: 'abstract',
};

const CORE_SLANG = [
  ['יַאלְּלָה', 'yalla', 'давай / пошли', 'come on / let’s go', 'Погонялка и согласие. Можно начать дело или поторопить.', 'Urges action or agrees to start. Very common.'],
  ['סַבָּבָה', 'sababa', 'ок, супер', 'cool, okay', 'Разговорное согласие, спокойнее чем «отлично».', 'Casual agreement, milder than “great”.'],
  ['אֲחַלָּה', 'achla', 'класс, отлично', 'awesome', 'Похвала вещи или ситуации, из арабского.', 'Praise; from Arabic, everyday Israeli.'],
  ['וַאללָּה', 'walla', 'вот именно / серьёзно', 'wow / I swear', 'Удивление или подтверждение, не обязательно религиозное.', 'Surprise or emphasis, not literally religious.'],
  ['בְּאֱמֶת', 'be-emet', 'серьёзно', 'really', 'Усиление или вопрос «ты серьёзно?».', 'Emphasis or “are you serious?”'],
  ['נֻורָא', 'nora', 'жутко / очень', 'terribly / very', 'В разговоре часто просто «очень», не «страшно».', 'In speech often just “very”, not “scary”.'],
  ['חֲבָל עַל הַזְּמַן', 'khaval al ha-zman', 'огонь, лучше не бывает', 'amazing (lit. a shame about the time)', 'Похвала: «даже описывать жалко времени».', 'Praise: so good it’s not worth explaining.'],
  ['עַל הַפָּנִים', 'al ha-panim', 'полный провал', 'awful / a disaster', 'О еде, фильме, ситуации — резко отрицательно.', 'Harsh negative about food, a film, a situation.'],
  ['אֵין מַצָּב', 'ein matzav', 'ни за что / не может быть', 'no way', 'Отказ или недоверие.', 'Refusal or disbelief.'],
  ['סְתָם', 'stam', 'просто так / да ладно', 'just / nah', '«Просто», «без причины», или отмашка.', '“Just because”, or brushing something off.'],
  ['בְּכִיף', 'be-kef', 'с удовольствием', 'gladly', 'Согласие помочь, легче чем формальное בבקשה.', 'Happy to help; lighter than formal please.'],
  ['סוֹף הַדֶּרֶךְ', 'sof ha-derech', 'жестовый капец / космос', 'the ultimate', 'Может быть и восторг, и «конец всему».', 'Can be awe or “that’s the end of it”.'],
  ['חַפּוּר', 'khapur', 'зануда, который копает', 'someone who over-explains', 'לחפור — долбить одну тему.', 'From “to dig”: someone who won’t drop a topic.'],
  ['תַּפְסוּ אוֹתִי', 'tafsu oti', 'я запалился', 'they caught me / I’m busted', 'Игровое «попался».', 'Playful “busted”.'],
  ['נוּ', 'nu', 'ну / и?', 'so? / well?', 'Подталкивает собеседника продолжить.', 'Nudges the other person to go on.'],
  ['כִּמְעַט', 'kimat', 'почти', 'almost', 'В речи часто тянут: kiiimat.', 'Often drawn out in speech.'],
  ['בְּטִפּוּל', 'be-tipul', 'уже занимаюсь', 'I’m on it', 'Отписка: вопрос в работе.', '“It’s being handled.”'],
  ['תַּזְרִים', 'tazrim', 'бабки, кэш', 'cash flow / cash', 'Не только бухгалтерия — просто деньги.', 'Not just accounting — just money.'],
  ['לְגַמְרֵי', 'legamrei', 'совсем', 'completely', 'Усиление, разговорнее чем לגמרי в учебнике.', 'Intensifier, very spoken.'],
  ['בְּדִיּוּק', 'bediyuk', 'точно', 'exactly', 'Подтверждение «в точку».', '“Exactly.”'],
  ['אַל תַּגְזִים', 'al tagzim', 'не преувеличивай', 'don’t exaggerate', 'Стоп гиперболе.', 'Stop the hyperbole.'],
  ['יֵשׁ מַצָּב', 'yesh matzav', 'бывает / реально', 'it happens / possible', 'Обратное к אין מצב.', 'Opposite of “no way”.'],
  ['כְּלוֹמַר', 'klomar', 'то есть', 'that is / I mean', 'Разговорная связка.', 'Spoken connector.'],
  ['בְּקִצוּר', 'be-kitsur', 'короче', 'anyway / in short', 'Смена темы или итог.', 'Topic shift or wrap-up.'],
  ['נוֹרָא וְאַיּוֹם', 'nora ve-ayom', 'жуть какая', 'awful (emphatic)', 'Ирония или настоящий ужас.', 'Irony or genuine dismay.'],
  ['חָמוּד', 'khamud', 'милый', 'cute', 'И к людям, и к вещам.', 'People and things.'],
  ['מְבַסֵּס', 'mevases', 'заходит, кайф', 'hits the spot', 'О треке, шутке, еде.', 'A song, a joke, food.'],
  ['דָּפוּק', 'dafuk', 'кривой / сломанный', 'screwed / broken', 'Грубовато, не в официальной речи.', 'Rough; not for formal speech.'],
  ['לְהִתְחַבֵּר', 'lehitkhaber', 'въехать, понять вайб', 'to connect / get it', 'Не только «подключиться к wifi».', 'Not just plugging in a cable.'],
  ['עָפוּ עָלָיו', 'afu alav', 'он в ауте / без сил', 'he’s wiped', 'Устал или «его сдуло».', 'Exhausted or lost it.'],
  ['בַּסַּךְ הַכֹּל', 'ba-sakh ha-kol', 'в итоге', 'all in all', 'Подведение черты.', 'Summing up.'],
  ['אֵיכַכָּה', 'eikhaka', 'каким это макаром', 'how on earth', 'Удивление способу.', 'Surprised by the how.'],
  ['מָה אִתְּךָ', 'ma itkha', 'ты чего?', 'what’s with you?', 'Может быть и забота, и упрёк.', 'Care or a jab, depending on tone.'],
  ['סוֹגֵר עִנְיָן', 'soger inyan', 'решает вопрос', 'does the job', 'Вещь или человек «закрывает тему».', 'A thing or person that settles it.'],
  ['עָשׂוּ לִי תַּרְגִיל', 'asu li targil', 'меня развели', 'they pulled a fast one', 'Кто-то хитро поступил.', 'Someone tricked you.'],
  ['בַּעֲיַת חֶנְיוֹן', 'baayat khenyon', 'проблема парковки / мелочь', 'a parking problem / minor issue', 'Иногда буквально, иногда «не о том речь».', 'Literal or “that’s not the real issue”.'],
  ['יֵשׁ חַיִּים', 'yesh khayim', 'есть жизнь / оживлённо', 'there’s a scene here', 'О месте, где тусуются.', 'A place with a vibe.'],
  ['לֹא דּוֹפֵק חֶשְׁבּוֹן', 'lo dofek kheshbon', 'плевать ему', 'he doesn’t give a damn', 'Грубовато: наплевать.', 'Blunt: doesn’t care.'],
  ['קָח אֶת זֶה בְּקַלּוּת', 'kakh et ze be-kalut', 'не загоняйся', 'take it easy', 'Снизить пафос.', 'Lower the stakes.'],
  ['סְמוּךְ עָלַי', 'smukh alai', 'положись на меня', 'trust me / I got this', 'Обещание закрыть вопрос.', 'I’ve got this.'],
];

function loadJson(path) {
  return JSON.parse(readFileSync(path, 'utf8'));
}

function stripNikud(text) {
  return text.replace(/[\u0591-\u05C7]/g, '').replace(/\|/g, '');
}

function slug(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 32) || 'w';
}

function levelForRank(rank) {
  if (rank <= 800) return 'elementary';
  if (rank <= 1800) return 'basic';
  if (rank <= 3000) return 'intermediate';
  if (rank <= 4200) return 'advanced';
  return 'expert';
}

function themeFor(en, fallback = 'core') {
  const hay = en.toLowerCase();
  for (const [id, , , , keys] of THEMES) {
    if (keys.some((key) => hay.includes(key))) return id;
  }
  return fallback;
}

const POS_MAP = {
  существительное: 'noun',
  глагол: 'verb',
  прилагательное: 'adjective',
  наречие: 'adverb',
  местоимение: 'pronoun',
  частица: 'particle',
  предлог: 'preposition',
  союз: 'conjunction',
  числительное: 'numeral',
  выражение: 'expression',
  идиома: 'idiom',
  'вопросительное слово': 'question',
  определитель: 'particle',
};

function posFor(en) {
  const hay = en.toLowerCase();
  if (/^(i|you|he|she|we|they|me|him|her|us|them)\b/.test(hay)) return 'pronoun';
  if (/\b(and|but|or|because|if|that)\b/.test(hay) && hay.length < 24) return 'conjunction';
  if (/^(in|on|at|to|from|with|of|about|for)\b/.test(hay)) return 'preposition';
  if (/ing\b| to [a-z]/.test(hay) || /^(was|were|is|are|be|go|come|see|know|say)/.test(hay)) {
    return 'verb';
  }
  if (/ly\b/.test(hay)) return 'adverb';
  if (/^(the|a|this|that|these|those)\b/.test(hay)) return 'particle';
  return 'noun';
}

function guessEmoji(theme, en) {
  const map = {
    greetings: '👋',
    people: '👤',
    family: '👨‍👩‍👧',
    numbers: '🔢',
    time: '⏰',
    food: '🍽️',
    home: '🏠',
    city: '🏙️',
    travel: '✈️',
    work: '💼',
    school: '📚',
    health: '🩺',
    body: '🧍',
    clothes: '👕',
    colors: '🎨',
    animals: '🐶',
    nature: '🌿',
    weather: '☀️',
    shopping: '🛒',
    feelings: '😊',
    verbs: '🏃',
    daily: '🗓️',
    tech: '💻',
    news: '📰',
    abstract: '💭',
    core: '⭐',
  };
  return map[theme] ?? '⭐';
}

function makeExample(nikud, hebrew, transcription, ru, en) {
  return {
    nikud: `${nikud}.`,
    hebrew: `${hebrew}.`,
    transcription: `${transcription}.`,
    ru: `«${ru}».`,
    en: `“${en}”.`,
  };
}

function readCache(name) {
  const paths = [join('/tmp', name), join(root, 'scripts/cache', name)];
  for (const path of paths) {
    if (existsSync(path)) return loadJson(path);
  }
  throw new Error(`Нет кэша ${name}`);
}

const hebrew = loadJson(join(root, 'data/hebrew.json'));
const freq = readCache('freq-he.json');
const nakdan = readCache('nakdan-cache.json');
const enru = existsSync('/tmp/en-ru-cache.json')
  ? loadJson('/tmp/en-ru-cache.json')
  : existsSync(join(root, 'scripts/cache/en-ru-cache.json'))
    ? loadJson(join(root, 'scripts/cache/en-ru-cache.json'))
    : {};

const nativeAudio = new Set();
try {
  const credits = loadJson(join(root, 'assets/audio/credits.json'));
  credits.forEach((row) => nativeAudio.add(row.file));
} catch {
  // optional
}

const goldByPlain = new Map();
for (const word of hebrew.words) {
  goldByPlain.set(word.hebrew, word);
  goldByPlain.set(stripNikud(word.nikud), word);
}

const words = [];
const usedPlain = new Set();
const usedIds = new Set();

function pushWord(entry) {
  if (usedIds.has(entry.id) || usedPlain.has(entry.hebrew)) return false;
  if (!NIKUD_RE.test(entry.nikud)) return false;
  usedIds.add(entry.id);
  usedPlain.add(entry.hebrew);
  words.push(entry);
  return true;
}

for (const gold of hebrew.words) {
  const theme = DECK_TO_THEME[gold.deck] ?? 'core';
  pushWord({
    ...gold,
    deck: theme,
    theme,
    pos: POS_MAP[gold.pos] ?? gold.pos,
    emoji: guessEmoji(theme, gold.en),
    example: makeExample(gold.nikud, gold.hebrew, gold.transcription, gold.ru, gold.en),
    audio: gold.audio && nativeAudio.has(gold.audio) ? gold.audio : gold.audio,
  });
}

for (const row of freq) {
  if (words.length >= 5000) break;
  const plain = row.he.replace(/\|/g, '').trim();
  if (!plain || usedPlain.has(plain)) continue;
  let nikud = String(nakdan[row.he] ?? nakdan[plain] ?? '').replace(/\|/g, '');
  if (!NIKUD_RE.test(nikud)) continue;
  if (stripNikud(nikud) !== plain && stripNikud(nikud).replace(/[יו]/g, '') !== plain.replace(/[יו]/g, '')) {
    // Dicta sometimes adds mater; accept if consonants match loosely
    const cons = (s) => s.replace(/[אהוי]/g, '');
    if (cons(stripNikud(nikud)) !== cons(plain)) continue;
  }
  const gold = goldByPlain.get(plain);
  if (gold) continue;
  const en = row.en.trim();
  const ru = (enru[en] || '').trim();
  if (!en || !ru || ru === en) continue;
  const level = levelForRank(row.rank);
  const theme = themeFor(en);
  const id = `f${row.rank}-${slug(row.tr || en)}`;
  pushWord({
    id,
    deck: theme,
    level,
    theme,
    hebrew: plain,
    nikud,
    transcription: row.tr || slug(en).replace(/-/g, ' '),
    ru,
    en,
    pos: posFor(en),
    emoji: guessEmoji(theme, en),
    example: makeExample(nikud, plain, row.tr || '', ru, en),
    audio: `tts/${level}/${id}.mp3`,
  });
}

if (words.length < 5000) {
  throw new Error(`Слов собрано ${words.length}, нужно 5000 (проверьте en-ru кэш)`);
}

const byLevel = Object.fromEntries(LEVELS.map((level) => [level, []]));
for (const word of words.slice(0, 5000)) byLevel[word.level].push(word);

const slang = [];
const slangPlain = new Set();

function pushSlang(item) {
  const hebrewPlain = stripNikud(item.nikud);
  if (slangPlain.has(item.nikud) || slangPlain.has(hebrewPlain + item.ru)) return;
  slangPlain.add(item.nikud);
  slangPlain.add(hebrewPlain + item.ru);
  slang.push(item);
}

CORE_SLANG.forEach((row, index) => {
  const [nikud, tr, ru, en, usageRu, usageEn] = row;
  const level = index < 12 ? 'elementary' : index < 24 ? 'basic' : 'intermediate';
  pushSlang({
    id: `slang-${slug(tr)}-${index}`,
    deck: 'slang',
    level,
    theme: 'slang',
    hebrew: stripNikud(nikud),
    nikud,
    transcription: tr,
    ru,
    en,
    pos: 'slang',
    emoji: '💬',
    example: makeExample(nikud, stripNikud(nikud), tr, ru, en),
    audio: `tts/${level}/slang-${slug(tr)}-${index}.mp3`,
    usage: { ru: usageRu, en: usageEn },
  });
});

const frames = [
  {
    nikud: (w) => `יַאלְּלָה, ${w.nikud}`,
    ru: (w) => `давай, ${w.ru}`,
    en: (w) => `come on, ${w.en}`,
    tr: (w) => `yalla, ${w.transcription}`,
    usageRu: 'Погонялка перед делом или предметом разговора.',
    usageEn: 'Urging someone, naming the thing you want to deal with.',
    level: 'elementary',
  },
  {
    nikud: (w) => `סַבָּבָה, יֵשׁ ${w.nikud}`,
    ru: (w) => `норм, есть ${w.ru}`,
    en: (w) => `cool, we’ve got ${w.en}`,
    tr: (w) => `sababa, yesh ${w.transcription}`,
    usageRu: 'Спокойное «ок, есть вот это».',
    usageEn: 'Laid-back “okay, that’s available”.',
    level: 'elementary',
  },
  {
    nikud: (w) => `אֵין מַצָּב בְּלִי ${w.nikud}`,
    ru: (w) => `ни за что без: ${w.ru}`,
    en: (w) => `no way without ${w.en}`,
    tr: (w) => `ein matzav bli ${w.transcription}`,
    usageRu: 'Игровая категоричность.',
    usageEn: 'Playful absolute refusal.',
    level: 'basic',
  },
  {
    nikud: (w) => `בְּקִצוּר, זֶה ${w.nikud}`,
    ru: (w) => `короче, это ${w.ru}`,
    en: (w) => `anyway, it’s ${w.en}`,
    tr: (w) => `be-kitsur, ze ${w.transcription}`,
    usageRu: 'Сжать рассказ до сути.',
    usageEn: 'Cut the story to the point.',
    level: 'basic',
  },
  {
    nikud: (w) => `וַאללָּה, ${w.nikud} זֶה חֲבָל עַל הַזְּמַן`,
    ru: (w) => `вот это да: ${w.ru} — огонь`,
    en: (w) => `wow, ${w.en} is amazing`,
    tr: (w) => `walla, ${w.transcription} ze khaval al ha-zman`,
    usageRu: 'Восторженная оценка.',
    usageEn: 'Emphatic praise.',
    level: 'intermediate',
  },
  {
    nikud: (w) => `עַל הַפָּנִים, הַ${w.nikud}`,
    ru: (w) => `полный провал с: ${w.ru}`,
    en: (w) => `${w.en} was a disaster`,
    tr: (w) => `al ha-panim, ha-${w.transcription}`,
    usageRu: 'Резко отрицательная оценка.',
    usageEn: 'Harsh thumbs-down.',
    level: 'intermediate',
  },
  {
    nikud: (w) => `תַּזְרִים עַל ${w.nikud}`,
    ru: (w) => `бабки на ${w.ru}`,
    en: (w) => `cash for ${w.en}`,
    tr: (w) => `tazrim al ${w.transcription}`,
    usageRu: 'Разговорно про деньги и трату.',
    usageEn: 'Talking money, very informal.',
    level: 'advanced',
  },
  {
    nikud: (w) => `סְמוּךְ עָלַי לְגַבֵּי ${w.nikud}`,
    ru: (w) => `положись на меня насчёт: ${w.ru}`,
    en: (w) => `I got ${w.en}`,
    tr: (w) => `smukh alai legabei ${w.transcription}`,
    usageRu: 'Обещание закрыть вопрос.',
    usageEn: 'I’ve got this covered.',
    level: 'advanced',
  },
  {
    nikud: (w) => `בַּסַּךְ הַכֹּל זֶה ${w.nikud}`,
    ru: (w) => `в итоге это ${w.ru}`,
    en: (w) => `all in all it’s ${w.en}`,
    tr: (w) => `ba-sakh ha-kol ze ${w.transcription}`,
    usageRu: 'Подвести черту в разговоре.',
    usageEn: 'Wrapping up a spoken point.',
    level: 'expert',
  },
  {
    nikud: (w) => `לֹא דּוֹפֵק חֶשְׁבּוֹן עַל ${w.nikud}`,
    ru: (w) => `плевать на ${w.ru}`,
    en: (w) => `doesn’t give a damn about ${w.en}`,
    tr: (w) => `lo dofek kheshbon al ${w.transcription}`,
    usageRu: 'Грубовато: наплевать. Не для вежливой речи.',
    usageEn: 'Blunt: doesn’t care. Not polite register.',
    level: 'expert',
  },
];

const nounish = words.filter((w) => w.pos === 'noun' || w.pos === 'adjective' || w.theme === 'food');
let frameIdx = 0;
for (const word of nounish) {
  if (slang.length >= 2000) break;
  const frame = frames[frameIdx % frames.length];
  frameIdx += 1;
  const nikud = frame.nikud(word);
  const id = `slang-x${slang.length}-${word.id}`.slice(0, 48);
  pushSlang({
    id,
    deck: 'slang',
    level: frame.level,
    theme: 'slang',
    hebrew: stripNikud(nikud),
    nikud,
    transcription: frame.tr(word),
    ru: frame.ru(word),
    en: frame.en(word),
    pos: 'slang',
    emoji: '💬',
    example: makeExample(nikud, stripNikud(nikud), frame.tr(word), frame.ru(word), frame.en(word)),
    audio: `tts/${frame.level}/${id}.mp3`,
    usage: { ru: frame.usageRu, en: frame.usageEn },
  });
}

if (slang.length < 2000) {
  throw new Error(`Сленга собрано ${slang.length}, нужно 2000`);
}

const slangByLevel = Object.fromEntries(LEVELS.map((level) => [level, []]));
slang.slice(0, 2000).forEach((item) => slangByLevel[item.level].push(item));

const units = [];
const dialogues = [];
const themes = THEMES.map(([id, emoji, title, titleEn]) => ({ id, emoji, title, titleEn }));
themes.push({ id: 'slang', emoji: '💬', title: 'Сленг', titleEn: 'Slang' });

for (const level of LEVELS) {
  const groups = new Map();
  for (const word of byLevel[level]) {
    const list = groups.get(word.theme) ?? [];
    list.push(word);
    groups.set(word.theme, list);
  }
  let order = 1;
  for (const [theme, list] of groups) {
    const lessonCount = Math.max(1, Math.ceil(list.length / 5));
    const unitId = `${level}-${theme}`;
    units.push({
      id: unitId,
      level,
      theme,
      order,
      lessonCount,
      wordCount: list.length,
    });
    const a = list[0];
    const b = list[1] ?? list[0];
    if (a && b) {
      dialogues.push({
        id: `${unitId}-d0`,
        level,
        theme,
        title: 'Короткий диалог',
        titleEn: 'A short dialogue',
        lines: [
          {
            speaker: 'a',
            nikud: `מָה שְׁלוֹמְךָ? יֵשׁ ${a.nikud}?`,
            hebrew: stripNikud(`מה שלומך יש ${a.hebrew}`),
            transcription: `ma shlomkha? yesh ${a.transcription}?`,
            ru: `Как дела? Есть ${a.ru}?`,
            en: `How are you? Got ${a.en}?`,
          },
          {
            speaker: 'b',
            nikud: `סַבָּבָה, יֵשׁ ${b.nikud}.`,
            hebrew: stripNikud(`סבבה יש ${b.hebrew}`),
            transcription: `sababa, yesh ${b.transcription}.`,
            ru: `Норм, есть ${b.ru}.`,
            en: `Cool, we’ve got ${b.en}.`,
          },
        ],
        replies: [
          { nikud: 'תּוֹדָה רַבָּה', ru: 'Большое спасибо', en: 'Thanks a lot', correct: true },
          { nikud: 'לֹא, תּוֹדָה', ru: 'Нет, спасибо', en: 'No, thanks', correct: false },
          { nikud: 'אֲנִי לֹא יוֹדֵעַ', ru: 'Я не знаю', en: 'I don’t know', correct: false },
        ],
      });
    }
    order += 1;
  }
}

const outDir = join(root, 'data/lexicon');
mkdirSync(outDir, { recursive: true });

const catalog = {
  themes,
  units,
  counts: {
    words: words.slice(0, 5000).length,
    slang: slang.slice(0, 2000).length,
    dialogues: dialogues.length,
  },
};
writeFileSync(join(outDir, 'catalog.json'), JSON.stringify(catalog));

for (const level of LEVELS) {
  writeFileSync(join(outDir, `words-${level}.json`), JSON.stringify({ words: byLevel[level] }));
  writeFileSync(join(outDir, `slang-${level}.json`), JSON.stringify({ slang: slangByLevel[level] }));
  writeFileSync(
    join(outDir, `dialogues-${level}.json`),
    JSON.stringify({ dialogues: dialogues.filter((d) => d.level === level) })
  );
}

const levelDecks = {};
for (const unit of units) {
  levelDecks[unit.level] ??= [];
  if (!levelDecks[unit.level].includes(unit.theme)) levelDecks[unit.level].push(unit.theme);
}
for (const level of hebrew.levels) {
  if (levelDecks[level.id]) level.decks = levelDecks[level.id];
}
writeFileSync(join(root, 'data/hebrew.json'), JSON.stringify(hebrew, null, 2) + '\n');

console.log(
  JSON.stringify(
    {
      words: catalog.counts.words,
      slang: catalog.counts.slang,
      dialogues: catalog.counts.dialogues,
      units: units.length,
      byLevel: Object.fromEntries(LEVELS.map((l) => [l, byLevel[l].length])),
      slangByLevel: Object.fromEntries(LEVELS.map((l) => [l, slangByLevel[l].length])),
    },
    null,
    2
  )
);

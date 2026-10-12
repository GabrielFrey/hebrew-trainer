// One-shot: добавляет английские поля в data/hebrew.json.
import { readFileSync, writeFileSync } from 'node:fs';

const path = new URL('../data/hebrew.json', import.meta.url);
const data = JSON.parse(readFileSync(path, 'utf8'));

const LEVELS = {
  elementary: {
    titleEn: 'Elementary',
    summaryEn: 'Letters, vowels, and the 40 most common words',
    detailEn: '2–3 word phrases, always with nikud',
  },
  basic: {
    titleEn: 'Basic',
    summaryEn: 'Numbers, family, food, present-tense verbs',
    detailEn: 'Phrases with nikud',
  },
  intermediate: {
    titleEn: 'Intermediate',
    summaryEn: 'Past and future tense, everyday dialogues',
    detailEn: 'Toggle “with nikud / without”',
  },
  advanced: {
    titleEn: 'Advanced',
    summaryEn: 'News phrases, synonyms, word roots',
    detailEn: 'Nikud off by default',
  },
  expert: {
    titleEn: 'Expert',
    summaryEn: 'Idioms, paragraph texts, questions and answers in Hebrew',
    detailEn: 'No nikud and no transcription',
  },
};

const DECKS = {
  frequent: { titleEn: 'Common words', subtitleEn: 'Everyday speech' },
  numbers: { titleEn: 'Numbers', subtitleEn: 'Counting, tens, and hundreds' },
  family: { titleEn: 'Family', subtitleEn: 'Close relatives' },
  food: { titleEn: 'Food', subtitleEn: 'Food and drink' },
  'verbs-present': { titleEn: 'Verbs: present', subtitleEn: 'Masculine singular' },
  'verbs-past': { titleEn: 'Verbs: past', subtitleEn: 'First person, “I”' },
  'verbs-future': { titleEn: 'Verbs: future', subtitleEn: 'First person, “I”' },
  daily: { titleEn: 'Daily life', subtitleEn: 'Home, city, time' },
  news: { titleEn: 'News', subtitleEn: 'Newspaper and radio vocabulary' },
  abstract: { titleEn: 'Abstract', subtitleEn: 'Feelings and ideas, synonyms' },
  idioms: { titleEn: 'Idioms', subtitleEn: 'Living speech and set phrases' },
};

const LETTER_EN = {
  alef: {
    nameEn: 'alef',
    soundEn: 'Silent on its own: the letter carries a vowel',
    exampleEn: 'dad',
  },
  bet: {
    nameEn: 'bet',
    soundEn: '“b” with dagesh (בּ), “v” without (ב)',
    exampleEn: 'house',
  },
  gimel: { nameEn: 'gimel', soundEn: '“g”', exampleEn: 'big' },
  dalet: { nameEn: 'dalet', soundEn: '“d”', exampleEn: 'door' },
  he: {
    nameEn: 'he',
    soundEn: 'A light “h” on the breath, often unheard at the end of a word',
    exampleEn: 'mountain',
  },
  vav: {
    nameEn: 'vav',
    soundEn: '“v”; with a vowel — “o” (וֹ) or “u” (וּ)',
    exampleEn: 'rose',
  },
  zayin: { nameEn: 'zayin', soundEn: '“z”', exampleEn: 'time' },
  het: { nameEn: 'het', soundEn: 'A guttural “kh”', exampleEn: 'window' },
  tet: { nameEn: 'tet', soundEn: '“t”', exampleEn: 'good' },
  yod: {
    nameEn: 'yod',
    soundEn: '“y”; in combinations it makes “i”',
    exampleEn: 'day',
  },
  kaf: {
    nameEn: 'kaf',
    soundEn: '“k” with dagesh (כּ), “kh” without (כ)',
    exampleEn: 'dog',
    finalExampleEn: 'king',
  },
  lamed: { nameEn: 'lamed', soundEn: '“l”', exampleEn: 'bread' },
  mem: {
    nameEn: 'mem',
    soundEn: '“m”',
    exampleEn: 'water',
    finalExampleEn: 'peace; hello',
  },
  nun: {
    nameEn: 'nun',
    soundEn: '“n”',
    exampleEn: 'correct',
    finalExampleEn: 'son',
  },
  samekh: { nameEn: 'samekh', soundEn: '“s”', exampleEn: 'book' },
  ayin: {
    nameEn: 'ayin',
    soundEn: 'Almost silent in modern Hebrew, like alef',
    exampleEn: 'city',
  },
  pe: {
    nameEn: 'pe',
    soundEn: '“p” with dagesh (פּ), “f” without (פ)',
    exampleEn: 'mouth',
    finalExampleEn: 'end',
  },
  tsadi: {
    nameEn: 'tsadi',
    soundEn: '“ts”',
    exampleEn: 'yellow',
    finalExampleEn: 'tree',
  },
  qof: { nameEn: 'qof', soundEn: '“k”', exampleEn: 'small' },
  resh: {
    nameEn: 'resh',
    soundEn: '“r”, uvular, closer to French',
    exampleEn: 'head',
  },
  shin: {
    nameEn: 'shin',
    soundEn: '“sh” with a dot on the right (שׁ), “s” with a dot on the left (שׂ)',
    exampleEn: 'peace; hello',
  },
  tav: { nameEn: 'tav', soundEn: '“t”', exampleEn: 'thank you' },
};

const VOWEL_EN = {
  kamats: { nameEn: 'kamatz', soundEn: '“a”' },
  patah: { nameEn: 'patach', soundEn: '“a”' },
  tsere: { nameEn: 'tsere', soundEn: '“e”' },
  segol: { nameEn: 'segol', soundEn: '“e”' },
  hirik: { nameEn: 'hiriq', soundEn: '“i”' },
  holam: { nameEn: 'holam', soundEn: '“o”' },
  kubuts: { nameEn: 'kubutz', soundEn: '“u”' },
  shuruk: { nameEn: 'shuruk', soundEn: '“u”' },
  shva: { nameEn: 'shva', soundEn: 'a very short “e”, or silent' },
};

const WORDS = {
  shalom: 'hello; peace',
  ken: 'yes',
  lo: 'no; not',
  toda: 'thank you',
  bevakasha: 'please',
  slikha: 'sorry',
  ani: 'I',
  ata: 'you (to a man)',
  at: 'you (to a woman)',
  hu: 'he',
  hi: 'she',
  anakhnu: 'we',
  ma: 'what',
  mi: 'who',
  eifo: 'where',
  matai: 'when',
  lama: 'why',
  eikh: 'how',
  kama: 'how many',
  yesh: 'there is',
  ein: 'there is not',
  tov: 'good',
  gadol: 'big',
  katan: 'small',
  bayit: 'house',
  sefer: 'book',
  yom: 'day',
  laila: 'night',
  mayim: 'water',
  ish: 'man; person',
  isha: 'woman',
  yeled: 'child; boy',
  khaver: 'friend',
  ir: 'city',
  rak: 'only',
  gam: 'also, too',
  aval: 'but',
  kol: 'all; every',
  akhshav: 'now',
  po: 'here',
  efes: 'zero',
  akhat: 'one (when counting)',
  shtayim: 'two (when counting)',
  shalosh: 'three (when counting)',
  arba: 'four (when counting)',
  khamesh: 'five (when counting)',
  shesh: 'six (when counting)',
  sheva: 'seven (when counting)',
  shmone: 'eight (when counting)',
  tesha: 'nine (when counting)',
  eser: 'ten (when counting)',
  'akhat-esre': 'eleven (when counting)',
  'shteim-esre': 'twelve (when counting)',
  esrim: 'twenty',
  shloshim: 'thirty',
  arbaim: 'forty',
  khamishim: 'fifty',
  mea: 'one hundred',
  elef: 'one thousand',
  mispar: 'number',
  aba: 'dad',
  ima: 'mom',
  ben: 'son',
  bat: 'daughter',
  akh: 'brother',
  akhot: 'sister',
  mishpakha: 'family',
  saba: 'grandfather',
  savta: 'grandmother',
  dod: 'uncle',
  doda: 'aunt',
  horim: 'parents',
  yalda: 'girl',
  baal: 'husband',
  nekhed: 'grandson',
  tinok: 'baby',
  lekhem: 'bread',
  khalav: 'milk',
  gvina: 'cheese',
  tapuakh: 'apple',
  beitsa: 'egg',
  okhel: 'food',
  basar: 'meat',
  dag: 'fish',
  of: 'chicken; bird',
  orez: 'rice',
  tapuz: 'orange',
  banana: 'banana',
  uga: 'cake; pie',
  khema: 'butter',
  sukar: 'sugar',
  melakh: 'salt',
  kafe: 'coffee',
  te: 'tea',
  yayin: 'wine',
  marak: 'soup',
  gezer: 'carrot',
  agvaniya: 'tomato',
  'okhel-verb': 'eats (he)',
  shote: 'drinks (he)',
  holekh: 'walks (he)',
  kore: 'reads (he)',
  kotev: 'writes (he)',
  medaber: 'speaks (he)',
  rotse: 'wants (he)',
  yodea: 'knows (he)',
  ohev: 'loves (he)',
  oved: 'works (he)',
  lomed: 'studies (he)',
  gar: 'lives (he)',
  ba: 'comes (he)',
  noten: 'gives (he)',
  roe: 'sees (he)',
  shomea: 'hears (he)',
  khoshev: 'thinks (he)',
  ose: 'does (he)',
  kone: 'buys (he)',
  yashen: 'sleeps (he)',
  hayiti: 'I was',
  akhalti: 'I ate',
  shatiti: 'I drank',
  halakhti: 'I walked, I went',
  karati: 'I read',
  katavti: 'I wrote',
  dibarti: 'I spoke',
  ratsiti: 'I wanted',
  yadati: 'I knew',
  avadti: 'I worked',
  lamadti: 'I studied, I learned',
  raiti: 'I saw',
  amarti: 'I said',
  nasati: 'I rode, I traveled',
  ehye: 'I will be',
  okhal: 'I will eat',
  eshte: 'I will drink',
  elekh: 'I will go',
  ekra: 'I will read',
  ekhtov: 'I will write',
  adaber: 'I will speak',
  ertse: 'I will want',
  eda: 'I will know',
  eevod: 'I will work',
  elmad: 'I will study',
  ere: 'I will see',
  avoda: 'work',
  kesef: 'money',
  khanut: 'store',
  rekhov: 'street',
  otobus: 'bus',
  mekhonit: 'car',
  rakevet: 'train',
  shaa: 'hour',
  daka: 'minute',
  shavua: 'week',
  khodesh: 'month',
  shana: 'year',
  boker: 'morning',
  erev: 'evening',
  makhar: 'tomorrow',
  etmol: 'yesterday',
  kheder: 'room',
  mitbakh: 'kitchen',
  mita: 'bed',
  shulkhan: 'table',
  kise: 'chair',
  delet: 'door',
  khalon: 'window',
  mafteakh: 'key',
  memshala: 'government',
  knesset: 'Knesset, parliament',
  bekhirot: 'elections',
  sar: 'minister',
  khok: 'law',
  mishtara: 'police',
  tsava: 'army',
  milkhama: 'war',
  heskem: 'agreement',
  kalkala: 'economy',
  misim: 'taxes',
  avtala: 'unemployment',
  briut: 'health; healthcare',
  khinukh: 'education',
  iton: 'newspaper',
  hafgana: 'demonstration',
  toshav: 'resident',
  ezrakh: 'citizen',
  mashber: 'crisis',
  hakhlata: 'decision',
  emet: 'truth',
  sheker: 'lie',
  kherut: 'freedom (as a right)',
  khofesh: 'freedom; vacation',
  tikva: 'hope',
  pakhad: 'fear',
  ahava: 'love',
  simkha: 'joy',
  etsev: 'sadness',
  zikaron: 'memory',
  makhshava: 'thought',
  koakh: 'strength',
  'kol-hakavod': 'well done; respect',
  'khaval-al-hazman': 'amazing; incredible',
  'al-hapanim': 'awful, as bad as it gets',
  'sof-haderekh': 'top-notch, first class',
  'yesh-matsav': 'quite possible',
  'ein-matsav': 'no way; out of the question',
  'lo-nora': 'no big deal',
  'ma-nishma': 'how’s it going',
  'barukh-haba': 'welcome',
  lehitraot: 'goodbye',
  behatslakha: 'good luck',
  lekhaim: 'to life (a toast)',
  'khag-sameakh': 'happy holiday',
  'beezrat-hashem': 'God willing; if all goes well',
};

const PHRASES = {
  'ph-ani-kore': {
    en: 'I am reading.',
    distractorsEn: ['I am writing.', 'He is reading.', 'I am buying.'],
  },
  'ph-bayit-gadol': {
    en: 'The house is big.',
    distractorsEn: ['The house is small.', 'The city is big.', 'This is a house.'],
  },
  'ph-toda-raba': {
    en: 'Thank you very much!',
    distractorsEn: ['Please!', 'Sorry!', 'Everything is fine!'],
  },
  'ph-aba-babayit': {
    en: 'Dad is at home.',
    distractorsEn: ['Mom is at home.', 'Dad is at work.', 'Dad is in the city.'],
  },
  'ph-yesh-li-sefer': {
    en: 'I have a book.',
    distractorsEn: ['I don’t have a book.', 'He has a book.', 'This is my book.'],
  },
  'ph-yeled-katan': {
    en: 'The child is small.',
    distractorsEn: ['The child is big.', 'The girl is small.', 'The house is small.'],
  },
  'ph-ima-shota': {
    en: 'Mom is drinking water.',
    distractorsEn: ['Mom is drinking milk.', 'Dad is drinking water.', 'Mom is cooking food.'],
  },
  'ph-shalom-ma-nishma': {
    en: 'Hi, how are you?',
    distractorsEn: ['Hi, what’s your name?', 'Goodbye!', 'Hi, where are you from?'],
  },
  'ph-okhel-lekhem-gvina': {
    en: 'I eat bread and cheese.',
    distractorsEn: ['I eat bread with butter.', 'I drink milk.', 'I buy bread and cheese.'],
  },
  'ph-yesh-li-akh': {
    en: 'I have a brother and a sister.',
    distractorsEn: ['I have a son and a daughter.', 'He has a brother.', 'I don’t have a sister.'],
  },
  'ph-sefer-shulkhan': {
    en: 'The book is on the table.',
    distractorsEn: ['The book is in the bag.', 'The food is on the table.', 'The book is under the table.'],
  },
  'ph-gar-betel-aviv': {
    en: 'I live in Tel Aviv.',
    distractorsEn: ['I live in Jerusalem.', 'I work in Tel Aviv.', 'I am going to Tel Aviv.'],
  },
  'ph-boker-tov-shaa': {
    en: 'Good morning, what time is it?',
    distractorsEn: ['Good evening, how are you?', 'Good morning, what’s your name?', 'Good morning, where are you?'],
  },
  'ph-mishpakha-mitbakh': {
    en: 'The family is eating in the kitchen.',
    distractorsEn: ['The family is eating in the room.', 'Mom is cooking in the kitchen.', 'The family is sleeping.'],
  },
  'ph-rotse-kafe': {
    en: 'I would like coffee, please.',
    distractorsEn: ['I would like tea, please.', 'Thanks for the coffee.', 'I don’t want coffee.'],
  },
  'ph-yalda-beit-sefer': {
    en: 'The girl studies at school.',
    distractorsEn: ['The boy studies at school.', 'The girl is reading a book.', 'The girl is going to school.'],
  },
  'ph-eifo-ata-gar': {
    en: 'Where do you live? — I live in Jerusalem.',
    distractorsEn: [
      'Where are you going? — I am going home.',
      'Where do you work? — In Jerusalem.',
      'Where are you from? — From Jerusalem.',
    ],
  },
  'ph-ma-asita-etmol': {
    en: 'What did you do yesterday? — I worked all day.',
    distractorsEn: [
      'What are you doing today? — Working.',
      'Where were you yesterday? — At work.',
      'What will you do tomorrow? — Work.',
    ],
  },
  'ph-matai-tavo': {
    en: 'When will you come? — I’ll come tomorrow morning.',
    distractorsEn: [
      'When will you come? — I’ll come in the evening.',
      'Where will you be tomorrow? — At home.',
      'Will you come tomorrow? — No.',
    ],
  },
  'ph-halakhti-lakhanut': {
    en: 'Yesterday I went to the store and bought bread.',
    distractorsEn: [
      'Yesterday I was at home and read a book.',
      'Tomorrow I will go to the store for bread.',
      'I buy bread at the store every day.',
    ],
  },
  'ph-elmad-ivrit': {
    en: 'Tomorrow I will study Hebrew with a friend.',
    distractorsEn: [
      'Yesterday I studied Hebrew with a friend.',
      'Tomorrow I will go to a friend.',
      'My friend is studying Hebrew.',
    ],
  },
  'ph-kama-ze-ole': {
    en: 'Excuse me, how much does this cost?',
    distractorsEn: ['What is this?', 'Where can I buy this?', 'Is this expensive?'],
  },
  'ph-memshala-takhtsiv': {
    en: 'The government approved the budget for next year.',
    distractorsEn: [
      'The government rejected the budget for next year.',
      'The Knesset is discussing this year’s budget.',
      'The minister introduced a new law.',
    ],
  },
  'ph-sar-habriut': {
    en: 'The health minister announced a new decision.',
    distractorsEn: [
      'The education minister announced a reform.',
      'The government made a decision on healthcare.',
      'The health minister resigned.',
    ],
  },
  'ph-mishtara-khakira': {
    en: 'The police opened an investigation after the demonstration.',
    distractorsEn: [
      'The police allowed the demonstration to go ahead.',
      'The demonstration took place without an investigation.',
      'The court opened a hearing after the demonstration.',
    ],
  },
  'ph-kalkala-tsamkha': {
    en: 'The economy grew by one percent last quarter.',
    distractorsEn: [
      'The economy fell by one percent.',
      'Unemployment grew by one percent.',
      'Taxes rose by one percent.',
    ],
  },
  'ph-iton-pirsem': {
    en: 'The newspaper published a report on an agreement between two countries.',
    distractorsEn: [
      'The newspaper wrote about a war between two countries.',
      'Two countries signed a trade agreement.',
      'The government denied the newspaper report.',
    ],
  },
};

const PASSAGES = {
  'pa-boker': {
    titleEn: 'Morning',
    en: 'Every morning I get up at seven, drink coffee, and read the newspaper. Then I take the bus to work. In the evening I study Hebrew, and if I have time I meet friends. The day goes by quickly, but I am content.',
    questionEn: 'What does he do in the evening?',
  },
  'pa-lomed-ivrit': {
    titleEn: 'How I learned Hebrew',
    en: 'I studied Hebrew for three years. At first I only read with vowels, and every word took time. After a year I started reading the newspaper without vowels. Now I understand almost everything, but I still find it hard to speak quickly.',
    questionEn: 'What is still hard for him?',
  },
  'pa-ein-matsav': {
    titleEn: 'No way',
    en: 'I told a friend I wanted to learn Hebrew in one month. He laughed and said: “no way.” But six months later I was already speaking, and he told me: “well done!”',
    questionEn: 'What did the friend say at the end?',
  },
};

data.meta.transcription = 'русская практическая транскрипция / English glosses in `en`';

data.levels.forEach((level) => {
  const extra = LEVELS[level.id];
  if (!extra) throw new Error(`no English for level ${level.id}`);
  Object.assign(level, extra);
});

data.decks.forEach((deck) => {
  const extra = DECKS[deck.id];
  if (!extra) throw new Error(`no English for deck ${deck.id}`);
  Object.assign(deck, extra);
});

data.letters.forEach((letter) => {
  const extra = LETTER_EN[letter.id];
  if (!extra) throw new Error(`no English for letter ${letter.id}`);
  letter.nameEn = extra.nameEn;
  letter.soundEn = extra.soundEn;
  letter.example.en = extra.exampleEn;
  if (letter.finalExample) {
    if (!extra.finalExampleEn) throw new Error(`no final English for ${letter.id}`);
    letter.finalExample.en = extra.finalExampleEn;
  }
});

data.vowels.forEach((vowel) => {
  const extra = VOWEL_EN[vowel.id];
  if (!extra) throw new Error(`no English for vowel ${vowel.id}`);
  Object.assign(vowel, extra);
});

data.words.forEach((word) => {
  const en = WORDS[word.id];
  if (!en) throw new Error(`no English for word ${word.id}`);
  word.en = en;
});

data.phrases.forEach((phrase) => {
  const extra = PHRASES[phrase.id];
  if (!extra) throw new Error(`no English for phrase ${phrase.id}`);
  phrase.en = extra.en;
  phrase.distractorsEn = extra.distractorsEn;
});

data.passages.forEach((passage) => {
  const extra = PASSAGES[passage.id];
  if (!extra) throw new Error(`no English for passage ${passage.id}`);
  passage.titleEn = extra.titleEn;
  passage.en = extra.en;
  passage.question.en = extra.questionEn;
});

writeFileSync(path, `${JSON.stringify(data, null, 2)}\n`);
process.stderr.write(
  `en: ${data.words.length} words, ${data.phrases.length} phrases, ${data.letters.length} letters\n`
);

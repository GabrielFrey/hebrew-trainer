import { pluralRu } from '@/lib/dates';
import type {
  BilingualText,
  Deck,
  LanguagePreference,
  Letter,
  Level,
  Phrase,
  SessionCard,
  Settings,
  ThemeInfo,
  UiLanguage,
  Vowel,
  Word,
} from '@/lib/types';

export function systemLanguage(): UiLanguage {
  try {
    const locale = Intl.DateTimeFormat().resolvedOptions().locale ?? 'en';
    return locale.toLowerCase().startsWith('ru') ? 'ru' : 'en';
  } catch {
    return 'en';
  }
}

export function resolveLanguage(preference: LanguagePreference | undefined): UiLanguage {
  if (preference === 'ru' || preference === 'en') return preference;
  return systemLanguage();
}

/** Перевод упражнений: явный выбор или язык интерфейса. */
export function resolveTranslation(
  settings: Pick<Settings, 'language' | 'translationLanguage'> | undefined
): UiLanguage {
  if (settings?.translationLanguage === 'ru' || settings?.translationLanguage === 'en') {
    return settings.translationLanguage;
  }
  return resolveLanguage(settings?.language);
}

export function pickBilingual(item: BilingualText, lang: UiLanguage): string {
  return lang === 'en' ? item.en : item.ru;
}

/** Убирает «👋|» и оставляет не больше двух значений через слэш. */
export function shortGloss(text: string): string {
  let value = text.trim();
  const bar = value.indexOf('|');
  if (bar > 0 && bar <= 4) value = value.slice(bar + 1).trim();
  return value
    .split(/\s*\/\s*/)
    .filter(Boolean)
    .slice(0, 2)
    .join(' / ');
}

export function displayOptions(card: SessionCard, lang: UiLanguage): string[] {
  const raw =
    card.bilingualOptions && card.bilingualOptions.length > 0
      ? card.bilingualOptions.map((item) => pickBilingual(item, lang))
      : card.options;
  return raw.map(shortGloss);
}

export function displayAnswer(card: SessionCard, lang: UiLanguage): string {
  if (card.bilingualAnswer) return shortGloss(pickBilingual(card.bilingualAnswer, lang));
  return shortGloss(card.answer);
}

type Dict = Record<string, string>;

const ru: Dict = {
  'app.name': 'Иврит с нуля',
  'tabs.today': 'Учить',
  'tabs.alphabet': 'Алфавит',
  'tabs.words': 'Уроки',
  'tabs.reading': 'Сленг',
  'tabs.progress': 'Прогресс',
  'tabs.lessons': 'Уроки',
  'tabs.slang': 'Сленг',
  'tabs.verbs': 'Глаголы',
  'nav.session': 'Тренировка',
  'nav.settings': 'Настройки',
  'nav.letter': 'Буква',
  'nav.deck': 'Колода',
  'nav.drill': 'Тренажёр букв',
  'nav.notFound': 'Не найдено',
  'nav.lesson': 'Урок',
  'nav.unit': 'Тема',
  'nav.slang': 'Сленг',
  'nav.verbs': 'Глаголы',
  'nav.verb': 'Глагол',

  'common.settings': 'Настройки',
  'common.back': 'Назад',
  'common.next': 'Дальше',
  'common.done': 'Готово',
  'common.open': 'Открыть',
  'common.start': 'Начать',
  'common.close': 'Закрыть',
  'common.exit': 'Выйти',
  'common.cancel': 'Отмена',
  'common.understood': 'Понятно',
  'common.correct': 'Верно',
  'common.recordMissing': 'нет записи',
  'common.recordMissingA11y': 'Записи носителя пока нет',
  'common.listen': 'Прослушать',
  'common.listenSlow': 'Медленно',
  'common.tapNikud': 'Нажмите, чтобы показать огласовки',
  'keyboard.space': 'Пробел',
  'keyboard.backspace': 'Стереть',
  'common.letterName': 'Название',
  'common.root': 'корень {root}',
  'common.synonyms': 'синонимы: {list}',
  'common.literal': 'буквально: {text}',

  'today.subtitle': '{level} · {minutes} {minutesWord} в день',
  'today.streakNone': 'Серия ещё не начата',
  'today.streak': '{count} {daysWord} подряд',
  'today.record': 'Рекорд: {count}',
  'today.allDone': 'На сегодня всё повторено',
  'today.allDoneHint':
    'Новые карточки откроются завтра. Если хочется позаниматься ещё, можно пройти повторения досрочно.',
  'today.reviewAhead': 'Повторить досрочно',
  'today.queue': 'Очередь: {count} {cardsWord}',
  'today.queueHint': '{due} на повторение · {fresh} новых',
  'today.shortQueue':
    'Повторений пока нет, поэтому очередь короче 15 карточек: за одну сессию вводим не больше 5 новых слов.',
  'today.lettersLearned': 'Буквы выучены',
  'today.wordsLearned': 'Слова выучены',
  'today.intervalHint': 'Интервал 6 дней и больше',
  'today.unlockedHint': 'Открыто на уровне «{level}»',
  'today.warmup': 'Разминка',
  'today.noHistory': 'Ещё нет истории',
  'today.noHistoryHint': 'Пройдите первую сессию — здесь появятся ваши последние буквы и слова.',
  'today.recogniseLetter': 'Узнай букву',
  'today.recogniseHint': 'Быстрый проход по открытым буквам',
  'today.writeLetter': 'Напиши букву',
  'today.writeHint': 'Начертить пальцем — приложение сверит',
  'today.remindersOff': 'Напоминания выключены',
  'today.remindersOffHint':
    'Серия дней растёт только от завершённой сессии. Включить напоминание можно в настройках.',
  'today.quote': '«Хорошего дня» — йом тов',

  'alphabet.subtitle': '22 буквы · выучено {count}',
  'alphabet.letters': 'Буквы',
  'alphabet.letterA11y': 'Буква {name}',
  'alphabet.finalTag': 'конечная {char}',
  'alphabet.finals': 'Конечные формы',
  'alphabet.finalsHint':
    'Каф, мем, нун, пей и цади меняют начертание в конце слова. Звук при этом не меняется.',
  'alphabet.vowels': 'Огласовки (никуд)',

  'words.subtitle': '{open} из {total} слов открыто · выучено {learned}',
  'words.count': '{count} слов',
  'words.learnedOf': 'Выучено {learned} из {total}',
  'words.noteTitle': 'Колоды и уровень',
  'words.noteBody':
    'Открыты темы текущего уровня и всех, что ниже. Уровень меняется в настройках, и выученное при этом не сбрасывается. Слова лежат в data/lexicon по уровням.',

  'reading.subtitle': '{level} · {count} фраз · уверенно читаете {learned}',
  'reading.empty': 'Фраз для этого уровня нет',
  'reading.emptyHint':
    'Добавьте фразы с никудом в data/hebrew.json или выберите другой уровень в настройках.',
  'reading.withNikud': 'С огласовками',
  'reading.withoutNikud': 'Без огласовок',
  'reading.nikudOn': 'Огласовки подсказывают гласные.',
  'reading.nikudOff':
    'Так пишут в книгах и на вывесках. Гласные нужно угадывать по знакомым словам.',
  'reading.alwaysNikud': 'Всегда с огласовками',
  'reading.alwaysNikudHint':
    'На уровне «{level}» никуд показывается всегда. Переключатель появится на среднем уровне.',
  'reading.phraseMeta': 'Фраза {n} из {total} · {levelTag}',
  'reading.yourLevel': 'твой уровень',
  'reading.pastLevel': 'пройденный уровень',
  'reading.readAloud': 'Прочитать вслух',
  'reading.readAloudDone': 'Прочитано вслух',
  'reading.readHint': 'Прочитайте вслух, потом выберите перевод.',
  'reading.great': 'Отлично.',
  'reading.greatWith': 'Отлично. Транскрипция: {text}',
  'reading.choose': 'Выбери перевод',
  'reading.rightAnswer': 'Правильный перевод: {text}',
  'reading.nextPhrase': 'Следующая фраза',
  'reading.passages': 'Тексты на абзац',
  'reading.passageHint': 'Вопрос и ответ на иврите разбираются в тренировке.',

  'progress.subtitleStreak': '{count} {daysWord} подряд',
  'progress.subtitleBroken': 'Начни серию сегодня 🔥',
  'progress.subtitleFresh': 'Начни серию сегодня 🔥',
  'progress.subtitleFrozen': 'Серия на паузе — заморозка сберегла день',
  'progress.empty': 'Пока пусто — и это нормально',
  'progress.emptyHint': 'Пройди короткий урок, и здесь появятся выученные слова и серия дней.',
  'progress.start': 'К первому уроку',
  'progress.letters': 'Буквы',
  'progress.words': 'Слова',
  'progress.phrases': 'Фразы',
  'progress.accuracy': 'Точность',
  'progress.accuracyHint': 'По всем ответам',
  'progress.dueToday': 'Повторить сегодня',
  'progress.dueEmpty': 'Всё повторено. Ближайшие карточки вернутся в другой день.',
  'progress.kindLetter': 'буква',
  'progress.kindWord': 'слово',
  'progress.kindPhrase': 'фраза',
  'progress.lapses': 'ошибок: {count}',
  'progress.interval': 'интервал {days} дн.',
  'progress.last7': 'Последние 7 дней',
  'progress.chartHint': 'Высота столбика — число отвеченных карточек за день.',
  'progress.weak': 'Слабые места',
  'progress.correctOf': '{correct} из {total} верно',
  'progress.practice': 'Тренироваться',

  'settings.level': 'Уровень',
  'settings.levelHint': 'Открыто {decks} тем и {words} слов из {total}',
  'settings.nikud': 'Огласовки',
  'settings.nikudHint':
    'Адаптивно: чем лучше слово выучено, тем чаще оно без никуда. Нажми на слово, чтобы вернуть огласовки.',
  'settings.nikudOn': 'С огласовками',
  'settings.nikudOff': 'Без огласовок',
  'settings.nikudAlways': 'Всегда',
  'settings.nikudAdaptive': 'Адаптивно',
  'settings.nikudNever': 'Никогда',
  'settings.nikudLocked':
    'На элементарном и базовом уровне огласовки показываются всегда — переключателя нет.',
  'settings.goal': 'Цель',
  'settings.goal.reading': 'Чтение',
  'settings.goal.speaking': 'Разговор',
  'settings.minutes': 'Время в день',
  'settings.minutesValue': '{n} минут',
  'settings.reminder': 'Напоминание',
  'settings.reminderDenied': 'Разрешение на уведомления не выдано. Приложение работает и без него.',
  'settings.reminderHint': 'Одно локальное уведомление в день',
  'settings.reminderOn': 'Включено',
  'settings.reminderOff': 'Выключено',
  'settings.reminderAt': 'В {hour}:00',
  'settings.theme': 'Тема',
  'settings.themeHint': 'Сейчас используется {scheme}',
  'settings.theme.system': 'Как в системе',
  'settings.theme.light': 'Светлая',
  'settings.theme.dark': 'Тёмная',
  'settings.theme.darkName': 'тёмная',
  'settings.theme.lightName': 'светлая',
  'settings.language': 'Язык интерфейса',
  'settings.languageHint': 'Подписи кнопок и экранов. На перевод слов не влияет.',
  'settings.language.system': 'Как в системе',
  'settings.language.ru': 'Русский',
  'settings.language.en': 'English',
  'settings.translation': 'Язык перевода',
  'settings.translationHint': 'Какой перевод иврита показывать в уроках, сленге и темах. Интерфейс от этого не меняется.',
  'settings.translation.ru': 'Русский',
  'settings.translation.en': 'English',
  'common.translationToggle': 'Язык перевода',
  'onboarding.translationTitle': 'Язык перевода',
  'onboarding.translationHint':
    'На каком языке показывать значение слов, сленга и реплик. Его можно сменить в любой момент — прогресс не сбросится.',
  'onboarding.translation.ruHint': 'Перевод слов, сленга и диалогов на русский',
  'onboarding.translation.enHint': 'Значения слов, сленга и диалогов по-английски',
  'settings.about': 'О данных и звуке',
  'settings.aboutBody':
    'Прогресс хранится локально через AsyncStorage, синхронизации и аккаунта нет. Частотные слова и несколько сотен живых разговорных выражений лежат в data/lexicon по уровням. Озвучка — записи носителей ({count} шт.), иначе заранее сгенерированный нейроголос. Синтеза на устройстве нет: если файла нет, кнопки звука нет.',
  'settings.reset': 'Сбросить прогресс',
  'settings.resetTitle': 'Сбросить прогресс?',
  'settings.resetBody': 'Все выученные буквы, слова и серия дней будут удалены с устройства.',
  'settings.version': 'Иврит с нуля · локальная сборка',

  'onboarding.step': 'Шаг {n} из {total}',
  'onboarding.levelTitle': 'Твой уровень',
  'onboarding.levelHint':
    'От него зависят темы, длина фраз и огласовки. Уровень можно поменять в любой момент — выученное не сбросится.',
  'onboarding.goalTitle': 'Главная цель',
  'onboarding.goalHint': 'Акцент в сессии: разбор текста или живая речь.',
  'onboarding.goal.readingHint': 'Уверенно читать вслух, в том числе без огласовок',
  'onboarding.goal.speakingHint': 'Базовый словарь и простые фразы на слух',
  'onboarding.minutesTitle': 'Сколько времени в день?',
  'onboarding.minutesHint':
    'Очередь всегда не длиннее 15 карточек. Во столько же будем присылать напоминание — в {hour}:00.',
  'onboarding.min5': 'Минимум, чтобы не терять серию',
  'onboarding.min10': 'Комфортный ритм на каждый день',
  'onboarding.min20': 'Быстрый прогресс, если есть силы',
  'onboarding.start': 'Начать учиться',
  'onboarding.privacy': 'Прогресс хранится только на устройстве. Аккаунт не нужен.',

  'session.empty': 'Очередь пуста',
  'session.emptyHint':
    'Все карточки повторены. Возвращайтесь завтра — или пройдите повторения досрочно с экрана «Сегодня».',
  'session.bravo': '«Молодец» — коль ха-каво́д',
  'session.finished': 'Сессия закончена',
  'session.summary': 'Ответов: {reviewed} · точность {pct}% · серия {streak}',
  'session.closeA11y': 'Закрыть тренировку',
  'session.newCard': 'Новая карточка',
  'session.prompt.letterRecognise': 'Какая это буква?',
  'session.prompt.letterWrite': 'Напишите букву',
  'session.prompt.letterWriteHint': 'Пальцем по полю — приложение сверит начертание',
  'session.prompt.wordHe': 'Что означает слово?',
  'session.prompt.wordGloss': 'Выбери написание',
  'session.prompt.phrase': 'Выбери перевод фразы',
  'session.prompt.passage': 'Прочитайте и ответьте на иврите',
  'session.prompt.listen': 'Прослушайте и выберите перевод',
  'session.prompt.typeWord': 'Напишите слово на иврите',
  'session.prompt.typeHint': 'Никуд не нужен, конечные буквы принимаются в обеих формах.',
  'session.prompt.cloze': 'Вставьте пропущенное слово',
  'session.prompt.gender': 'Согласуйте по роду',
  'session.prompt.formVerb': 'Образуйте форму',
  'session.finalForm': 'конечная форма',
  'session.writeHere': 'Напишите букву здесь',
  'session.sample': 'Образец',
  'session.howWasIt': 'Начертание узнано. Как далось?',
  'session.hard': 'С трудом',
  'session.good': 'Нормально',
  'session.easy': 'Легко',
  'session.mismatch': 'Это другая буква. Карточка вернётся в конец очереди.',
  'session.unsure': 'Не разобрал начертание. Напишите ещё раз — ошибка не записана.',
  'session.retry': 'Стереть и написать заново',
  'session.release': 'Отпустите палец — приложение сверит букву',
  'session.pick': 'Выбери вариант',
  'session.wrong': 'Не угадали. Карточка вернётся в конец очереди.',
  'session.rightHow': 'Верно! Как далось?',

  'letter.missing': 'Буква не найдена',
  'letter.statusNew': 'Ещё не изучалась',
  'letter.statusLearned': 'Выучена',
  'letter.statusLearning': 'В работе',
  'letter.example': 'Пример',
  'letter.final': 'Конечная форма',
  'letter.finalHint': 'В конце слова {name} пишется как {char}. Звук не меняется.',
  'letter.write': 'Написать от руки',

  'deck.missing': 'Колода не найдена',
  'deck.missingHint': 'Возможно, она ещё не добавлена в data/hebrew.json.',
  'deck.hideTranslation': 'Скрыть перевод',
  'deck.showTranslation': 'Показать перевод',
  'deck.hidden': 'Перевод скрыт',
  'deck.empty': 'Колода пока пустая',
  'deck.emptyHint': 'Слова появятся, когда их добавят в data/hebrew.json с проверенным никудом.',
  'deck.learned': 'выучено',
  'deck.learning': 'в работе',
  'deck.new': 'новое',
  'deck.note':
    'В теме {count} слов. Озвучка — запись носителя или готовый нейроголос; где файла нет, кнопки звука нет.',

  'drill.writePrompt': 'Напишите букву пальцем',
  'drill.which': 'Какая это буква?',
  'drill.recognised': 'Начертание узнано.',
  'drill.mismatch': 'Это другая буква. Интервал сброшен.',
  'drill.finished': 'Разминка закончена',
  'drill.finishedEmpty': 'Карточек не нашлось. Пройдите сессию на вкладке «Сегодня».',
  'drill.finishedScore': 'Правильно {correct} из {total}.',
  'drill.again': 'Ещё раз',
  'drill.of': '{n} из {total}',

  'notFound.title': 'Такого экрана нет',
  'notFound.body': 'Похоже, ссылка устарела. Вернёмся к сегодняшней тренировке.',
  'notFound.home': 'На главный экран',

  'canvas.a11y': 'Поле для письма',

  'notify.title': 'Пора потренироваться',
  'notify.5': 'Пять минут — и серия дней останется цела.',
  'notify.10': 'Десять минут на буквы и слова. Очередь уже собрана.',
  'notify.20': 'Двадцать минут — и сегодняшние повторения закрыты.',
  'notify.channel': 'Ежедневная тренировка',

  'pos.существительное': 'существительное',
  'pos.частица': 'частица',
  'pos.местоимение': 'местоимение',
  'pos.вопросительное слово': 'вопросительное слово',
  'pos.прилагательное': 'прилагательное',
  'pos.наречие': 'наречие',
  'pos.союз': 'союз',
  'pos.определитель': 'определитель',
  'pos.числительное': 'числительное',
  'pos.выражение': 'выражение',
  'pos.глагол': 'глагол',
  'pos.идиома': 'идиома',
  'pos.noun': 'существительное',
  'pos.verb': 'глагол',
  'pos.adjective': 'прилагательное',
  'pos.adverb': 'наречие',
  'pos.pronoun': 'местоимение',
  'pos.particle': 'частица',
  'pos.preposition': 'предлог',
  'pos.conjunction': 'союз',
  'pos.numeral': 'числительное',
  'pos.expression': 'выражение',
  'pos.slang': 'сленг',
  'pos.question': 'вопрос',
  'pos.idiom': 'идиома',

  'today.continue': 'Продолжить урок',
  'today.dailyGoal': '{done} / {goal} мин',
  'today.reviewSm2': 'Повторить слова ({count})',
  'today.newLesson': 'Новый урок',
  'today.goalMet': 'Дневная цель закрыта',
  'today.lessonsDone': 'Все уроки уровня пройдены',

  'lessons.title': 'Уроки',
  'lessons.subtitle': 'Короткие темы, как в Mondly. Новых слов в уроке — не больше пяти.',
  'lessons.locked': 'Сначала закрой предыдущую тему',
  'lessons.of': '{done} / {total} уроков',
  'lessons.start': 'Начать урок',

  'lesson.teach': 'Новое слово',
  'lesson.pickGloss': 'Выбери перевод',
  'lesson.pickPicture': 'Какая карточка подходит?',
  'lesson.listen': 'Послушай и выбери',
  'lesson.build': 'Соберите фразу',
  'lesson.dialogue': 'Диалог',
  'lesson.gotIt': 'Понятно',
  'lesson.finished': 'Урок пройден',
  'lesson.finishedHint': 'Новые слова ушли в повторения. Серия дней обновится, если это первое занятие за день.',
  'lesson.check': 'Проверить',
  'lesson.tapChips': 'Нажимайте слова по порядку',
  'lesson.type': 'Напишите слово',
  'lesson.cloze': 'Вставьте пропущенное слово',
  'lesson.gender': 'Согласуйте по роду',
  'lesson.form': 'Образуйте форму',
  'verbs.title': 'Глаголы',
  'verbs.subtitle': '{count} частотных глаголов · семь биньянов',
  'verbs.binyanim': 'Семь биньянов',
  'verbs.table': 'Спряжение',
  'verbs.infinitive': 'Инфинитив',
  'verbs.present': 'Настоящее',
  'verbs.past': 'Прошедшее',
  'verbs.future': 'Будущее',
  'verbs.imperative': 'Повелительное',
  'verbs.root': 'Корень {root}',
  'verbs.related': 'Однокоренные из лексикона',
  'verbs.emptyRelated': 'В лексиконе пока нет однокоренных слов.',
  'verbs.practice': 'Образуй форму',
  'verbs.missing': 'Глагол не найден',
  'verbs.person.1sg': 'я',
  'verbs.person.2ms': 'ты м.',
  'verbs.person.2fs': 'ты ж.',
  'verbs.person.3ms': 'он',
  'verbs.person.3fs': 'она',
  'verbs.person.1pl': 'мы',
  'verbs.person.2mp': 'вы м.',
  'verbs.person.2fp': 'вы ж.',
  'verbs.person.3pl': 'они',
  'verbs.person.ms': 'м. ед.',
  'verbs.person.fs': 'ж. ед.',
  'verbs.person.mp': 'м. мн.',
  'verbs.person.fp': 'ж. мн.',
  'verbs.form.infinitive': 'инфинитив',
  'verbs.form.present': 'настоящее',
  'verbs.form.past': 'прошедшее',
  'verbs.form.future': 'будущее',
  'verbs.form.imperative': 'повелительное',

  'slang.title': 'Сленг',
  'slang.subtitle': 'Живой израильский сленг — только выражения, которые реально говорят.',
  'slang.usage': 'Как говорят',
  'slang.empty': 'На этом уровне сленг ещё закрыт',
  'slang.search': 'Поиск по сленгу',
  'slang.count': 'Выражения твоего уровня и ниже: {shown} из {total}',

  'hud.streak': 'Серия {count}',
  'hud.xp': '{count} XP',
  'hud.hearts': 'Энергия {count}',
  'hud.flag': 'Язык перевода {code}',
  'lesson.awesome': 'Отлично!',
  'lesson.wrongTitle': 'Не угадали',
  'lesson.correctAnswer': 'Правильный ответ: {text}',
  'lesson.continue': 'Дальше',
  'lesson.closeA11y': 'Закрыть урок',
  'celebrate.title': 'Урок пройден!',
  'celebrate.xp': '+{count} XP',
  'celebrate.accuracy': 'Точность {pct}%',
  'celebrate.time': '{seconds} с',
  'celebrate.streak': 'Серия {count}',
  'settings.sounds': 'Звуки ответа',
  'settings.soundsHint': 'Короткий сигнал на верный и неверный ответ. Можно выключить.',
  'settings.soundsOn': 'Включены',
  'settings.soundsOff': 'Выключены',
  'progress.xpChart': 'XP по дням',
  'progress.calendar': 'Календарь серии',
  'progress.rings': 'Кольца по уровням',
  'mascot.hi': 'Привет! Я Гама. Давай учить иврит.',
  'mascot.a11y': 'Гама, верблюжонок',
  'path.done': 'Пройдено: {title}',
  'path.current': 'Сейчас: {title}',
  'path.locked': 'Закрыто: {title}',
  'onboarding.comboTitle': 'Цель и ритм',
  'onboarding.comboHint': 'Зачем учишь и сколько минут в день. Напоминание придёт в {hour}:00.',
  'lesson.report': 'Пожаловаться на задание',
  'lesson.reported': 'Спасибо, записали',
  'lesson.exitTitle': 'Выйти из урока?',
  'lesson.exitBody': 'Прогресс этого урока не сохранится.',
  'lesson.exit': 'Выйти',
  'lesson.stay': 'Остаться',
  'lesson.buildPrompt': 'Собери: {text}',
  'lesson.next': 'Следующий урок',
  'today.verbs': 'Глаголы',
  'today.goalRing': '{done} / {goal} мин',
  'settings.address': 'Обращение',
  'settings.addressHint': 'Как говорить с тобой по-ивритски: ты мужчина или женщина.',
  'settings.address.m': 'Как к мужчине',
  'settings.address.f': 'Как к женщине',
  'onboarding.addressTitle': 'Как к тебе обращаться?',
  'celebrate.next': 'Следующий урок',
  'nav.theme': 'Тема',
};

const en: Dict = {
  'app.name': 'Hebrew from scratch',
  'tabs.today': 'Learn',
  'tabs.alphabet': 'Alphabet',
  'tabs.words': 'Lessons',
  'tabs.reading': 'Slang',
  'tabs.progress': 'Progress',
  'tabs.lessons': 'Lessons',
  'tabs.slang': 'Slang',
  'tabs.verbs': 'Verbs',
  'nav.session': 'Practice',
  'nav.settings': 'Settings',
  'nav.letter': 'Letter',
  'nav.deck': 'Deck',
  'nav.drill': 'Letter drill',
  'nav.notFound': 'Not found',
  'nav.lesson': 'Lesson',
  'nav.unit': 'Unit',
  'nav.slang': 'Slang',
  'nav.verbs': 'Verbs',
  'nav.verb': 'Verb',

  'common.settings': 'Settings',
  'common.back': 'Back',
  'common.next': 'Next',
  'common.done': 'Done',
  'common.open': 'Open',
  'common.start': 'Start',
  'common.close': 'Close',
  'common.exit': 'Exit',
  'common.cancel': 'Cancel',
  'common.understood': 'Got it',
  'common.correct': 'Correct',
  'common.recordMissing': 'no recording',
  'common.recordMissingA11y': 'No native recording yet',
  'common.listen': 'Listen',
  'common.listenSlow': 'Slow',
  'common.tapNikud': 'Tap to show vowel marks',
  'keyboard.space': 'Space',
  'keyboard.backspace': 'Delete',
  'common.letterName': 'Name',
  'common.root': 'root {root}',
  'common.synonyms': 'synonyms: {list}',
  'common.literal': 'literally: {text}',

  'today.subtitle': '{level} · {minutes} {minutesWord} a day',
  'today.streakNone': 'Streak not started yet',
  'today.streak': '{count} {daysWord} in a row',
  'today.record': 'Best: {count}',
  'today.allDone': 'All reviews done for today',
  'today.allDoneHint':
    'New cards open tomorrow. If you still want to practice, you can pull reviews forward.',
  'today.reviewAhead': 'Review early',
  'today.queue': 'Queue: {count} {cardsWord}',
  'today.queueHint': '{due} to review · {fresh} new',
  'today.shortQueue':
    'Nothing is due yet, so the queue is shorter than 15 cards: a session introduces at most 5 new words.',
  'today.lettersLearned': 'Letters learned',
  'today.wordsLearned': 'Words learned',
  'today.intervalHint': 'Interval of 6 days or more',
  'today.unlockedHint': 'Unlocked at “{level}”',
  'today.warmup': 'Warm-up',
  'today.noHistory': 'No history yet',
  'today.noHistoryHint': 'Finish the first session — your recent letters and words will show up here.',
  'today.recogniseLetter': 'Recognise a letter',
  'today.recogniseHint': 'A quick pass over letters you have opened',
  'today.writeLetter': 'Write a letter',
  'today.writeHint': 'Draw with your finger — the app checks the shape',
  'today.remindersOff': 'Reminders are off',
  'today.remindersOffHint':
    'The streak only grows from a finished session. You can turn reminders on in Settings.',
  'today.quote': '“Have a good day” — yom tov',

  'alphabet.subtitle': '22 letters · {count} learned',
  'alphabet.letters': 'Letters',
  'alphabet.letterA11y': 'Letter {name}',
  'alphabet.finalTag': 'final {char}',
  'alphabet.finals': 'Final forms',
  'alphabet.finalsHint':
    'Kaf, mem, nun, pe and tsadi change shape at the end of a word. The sound stays the same.',
  'alphabet.vowels': 'Vowels (nikud)',

  'words.subtitle': '{open} of {total} words unlocked · {learned} learned',
  'words.count': '{count} words',
  'words.learnedOf': 'Learned {learned} of {total}',
  'words.noteTitle': 'Decks and level',
  'words.noteBody':
    'You get themes from the current level and every level below. Changing level in Settings does not reset cards. Words live in data/lexicon, split by level.',

  'reading.subtitle': '{level} · {count} phrases · reading {learned} confidently',
  'reading.empty': 'No phrases at this level',
  'reading.emptyHint': 'Add nikud phrases in data/hebrew.json or pick another level in Settings.',
  'reading.withNikud': 'With vowels',
  'reading.withoutNikud': 'Without vowels',
  'reading.nikudOn': 'The vowel marks show you the vowels.',
  'reading.nikudOff':
    'This is how books and signs are written. You have to guess the vowels from words you know.',
  'reading.alwaysNikud': 'Always with vowels',
  'reading.alwaysNikudHint':
    'At “{level}” nikud is always shown. The toggle appears at the intermediate level.',
  'reading.phraseMeta': 'Phrase {n} of {total} · {levelTag}',
  'reading.yourLevel': 'your level',
  'reading.pastLevel': 'a level you already passed',
  'reading.readAloud': 'Read aloud',
  'reading.readAloudDone': 'Read aloud',
  'reading.readHint': 'Read it aloud, then pick the translation.',
  'reading.great': 'Nice.',
  'reading.greatWith': 'Nice. Transcription: {text}',
  'reading.choose': 'Choose the translation',
  'reading.rightAnswer': 'Correct translation: {text}',
  'reading.nextPhrase': 'Next phrase',
  'reading.passages': 'Paragraph texts',
  'reading.passageHint': 'The Hebrew question and answer are practiced in the session.',

  'progress.subtitleStreak': '{count} {daysWord} in a row',
  'progress.subtitleBroken': 'Start a streak today 🔥',
  'progress.subtitleFresh': 'Start a streak today 🔥',
  'progress.subtitleFrozen': 'Streak paused — a freeze saved the day',
  'progress.empty': 'Nothing here yet — that’s fine',
  'progress.emptyHint': 'Finish a short lesson and your words and streak will show up here.',
  'progress.start': 'Start the first lesson',
  'progress.letters': 'Letters',
  'progress.words': 'Words',
  'progress.phrases': 'Phrases',
  'progress.accuracy': 'Accuracy',
  'progress.accuracyHint': 'Across all answers',
  'progress.dueToday': 'Due today',
  'progress.dueEmpty': 'All caught up. The next cards come back another day.',
  'progress.kindLetter': 'letter',
  'progress.kindWord': 'word',
  'progress.kindPhrase': 'phrase',
  'progress.lapses': 'lapses: {count}',
  'progress.interval': 'interval {days} d',
  'progress.last7': 'Last 7 days',
  'progress.chartHint': 'Bar height is the number of cards answered that day.',
  'progress.weak': 'Weak spots',
  'progress.correctOf': '{correct} of {total} correct',
  'progress.practice': 'Practice',

  'settings.level': 'Level',
  'settings.levelHint': '{decks} topics and {words} of {total} words unlocked',
  'settings.nikud': 'Vowels',
  'settings.nikudHint':
    'Adaptive: the better a word is learned, the more often it appears without nikud. Tap a word to show the vowels.',
  'settings.nikudOn': 'With vowels',
  'settings.nikudOff': 'Without vowels',
  'settings.nikudAlways': 'Always',
  'settings.nikudAdaptive': 'Adaptive',
  'settings.nikudNever': 'Never',
  'settings.nikudLocked':
    'At the elementary and basic levels vowels are always shown — there is no toggle.',
  'settings.goal': 'Goal',
  'settings.goal.reading': 'Reading',
  'settings.goal.speaking': 'Speaking',
  'settings.minutes': 'Time per day',
  'settings.minutesValue': '{n} minutes',
  'settings.reminder': 'Reminder',
  'settings.reminderDenied': 'Notification permission was not granted. The app works without it.',
  'settings.reminderHint': 'One local notification a day',
  'settings.reminderOn': 'On',
  'settings.reminderOff': 'Off',
  'settings.reminderAt': 'At {hour}:00',
  'settings.theme': 'Theme',
  'settings.themeHint': 'Currently using {scheme}',
  'settings.theme.system': 'System',
  'settings.theme.light': 'Light',
  'settings.theme.dark': 'Dark',
  'settings.theme.darkName': 'dark',
  'settings.theme.lightName': 'light',
  'settings.language': 'Interface language',
  'settings.languageHint': 'Button labels and screens. It does not change word translations.',
  'settings.language.system': 'System',
  'settings.language.ru': 'Русский',
  'settings.language.en': 'English',
  'settings.translation': 'Translation language',
  'settings.translationHint':
    'Which translation of Hebrew to show in lessons, slang, and decks. The interface language stays as it is.',
  'settings.translation.ru': 'Русский',
  'settings.translation.en': 'English',
  'common.translationToggle': 'Translation language',
  'onboarding.translationTitle': 'Translation language',
  'onboarding.translationHint':
    'The language for word meanings, slang notes, and dialogue lines. You can change it any time — progress is kept.',
  'onboarding.translation.ruHint': 'Russian translations of words, slang, and dialogues',
  'onboarding.translation.enHint': 'English glosses for words, slang, and dialogues',
  'settings.about': 'Data and audio',
  'settings.aboutBody':
    'Progress is stored locally in AsyncStorage; there is no account or sync. Frequent words and a few hundred real spoken expressions live in data/lexicon, split by level. Audio is native recordings ({count}) first, then pre-generated neural files. Nothing is synthesized on device: if a file is missing, the sound button is hidden.',
  'settings.reset': 'Reset progress',
  'settings.resetTitle': 'Reset progress?',
  'settings.resetBody': 'All learned letters, words, and your streak will be deleted from this device.',
  'settings.version': 'Hebrew from scratch · local build',

  'onboarding.step': 'Step {n} of {total}',
  'onboarding.levelTitle': 'Your level',
  'onboarding.levelHint':
    'It controls decks, phrase length, and vowels. You can change it any time — learned cards are kept.',
  'onboarding.goalTitle': 'Main goal',
  'onboarding.goalHint': 'What the session emphasises: reading text or spoken Hebrew.',
  'onboarding.goal.readingHint': 'Read aloud confidently, including without vowels',
  'onboarding.goal.speakingHint': 'Core vocabulary and simple phrases by ear',
  'onboarding.minutesTitle': 'How much time a day?',
  'onboarding.minutesHint':
    'The queue is never longer than 15 cards. We’ll send the reminder at the same time — {hour}:00.',
  'onboarding.min5': 'The minimum to keep your streak',
  'onboarding.min10': 'A comfortable daily pace',
  'onboarding.min20': 'Faster progress if you have the energy',
  'onboarding.start': 'Start learning',
  'onboarding.privacy': 'Progress stays on this device. No account needed.',

  'session.empty': 'Queue is empty',
  'session.emptyHint':
    'Every card has been reviewed. Come back tomorrow — or pull reviews forward from Today.',
  'session.bravo': '“Well done” — kol ha-kavod',
  'session.finished': 'Session finished',
  'session.summary': 'Answers: {reviewed} · accuracy {pct}% · streak {streak}',
  'session.closeA11y': 'Close practice',
  'session.newCard': 'New card',
  'session.prompt.letterRecognise': 'Which letter is this?',
  'session.prompt.letterWrite': 'Write the letter',
  'session.prompt.letterWriteHint': 'Draw on the pad — the app checks the shape',
  'session.prompt.wordHe': 'What does this word mean?',
  'session.prompt.wordGloss': 'Choose the spelling',
  'session.prompt.listen': 'Listen and pick the translation',
  'session.prompt.typeWord': 'Type the Hebrew word',
  'session.prompt.typeHint': 'Nikud is not required; final letters are accepted in either form.',
  'session.prompt.cloze': 'Fill in the missing word',
  'session.prompt.gender': 'Match the gender',
  'session.prompt.formVerb': 'Form the verb',
  'session.prompt.phrase': 'Choose the translation',
  'session.prompt.passage': 'Read and answer in Hebrew',
  'session.finalForm': 'final form',
  'session.writeHere': 'Write the letter here',
  'session.sample': 'Model',
  'session.howWasIt': 'Shape recognised. How did it feel?',
  'session.hard': 'Hard',
  'session.good': 'OK',
  'session.easy': 'Easy',
  'session.mismatch': 'That was a different letter. The card goes to the end of the queue.',
  'session.unsure': 'Couldn’t read that. Write it again — this is not counted as a miss.',
  'session.retry': 'Erase and try again',
  'session.release': 'Lift your finger — the app will check the letter',
  'session.pick': 'Choose an option',
  'session.wrong': 'Not this time. The card goes to the end of the queue.',
  'session.rightHow': 'Correct! How did it feel?',

  'letter.missing': 'Letter not found',
  'letter.statusNew': 'Not studied yet',
  'letter.statusLearned': 'Learned',
  'letter.statusLearning': 'In progress',
  'letter.example': 'Example',
  'letter.final': 'Final form',
  'letter.finalHint': 'At the end of a word {name} is written {char}. The sound does not change.',
  'letter.write': 'Write by hand',

  'deck.missing': 'Deck not found',
  'deck.missingHint': 'It may not have been added to data/hebrew.json yet.',
  'deck.hideTranslation': 'Hide translation',
  'deck.showTranslation': 'Show translation',
  'deck.hidden': 'Translation hidden',
  'deck.empty': 'This deck is empty',
  'deck.emptyHint': 'Words appear once they are added to data/hebrew.json with checked nikud.',
  'deck.learned': 'learned',
  'deck.learning': 'in progress',
  'deck.new': 'new',
  'deck.note':
    'This deck has {count} words. Audio is a native recording or a ready neural file; if neither exists, there is no sound button.',

  'drill.writePrompt': 'Write the letter with your finger',
  'drill.which': 'Which letter is this?',
  'drill.recognised': 'Shape recognised.',
  'drill.mismatch': 'That was a different letter. The interval was reset.',
  'drill.finished': 'Warm-up finished',
  'drill.finishedEmpty': 'No cards found. Do a session from the Today tab.',
  'drill.finishedScore': '{correct} of {total} correct.',
  'drill.again': 'Once more',
  'drill.of': '{n} of {total}',

  'notFound.title': 'This screen doesn’t exist',
  'notFound.body': 'That link looks out of date. Let’s go back to today’s practice.',
  'notFound.home': 'Home',

  'canvas.a11y': 'Writing pad',

  'notify.title': 'Time to practice',
  'notify.5': 'Five minutes — and your streak stays intact.',
  'notify.10': 'Ten minutes for letters and words. The queue is ready.',
  'notify.20': 'Twenty minutes — and today’s reviews are done.',
  'notify.channel': 'Daily practice',

  'pos.существительное': 'noun',
  'pos.частица': 'particle',
  'pos.местоимение': 'pronoun',
  'pos.вопросительное слово': 'question word',
  'pos.прилагательное': 'adjective',
  'pos.наречие': 'adverb',
  'pos.союз': 'conjunction',
  'pos.определитель': 'determiner',
  'pos.числительное': 'numeral',
  'pos.выражение': 'expression',
  'pos.глагол': 'verb',
  'pos.идиома': 'idiom',
  'pos.noun': 'noun',
  'pos.verb': 'verb',
  'pos.adjective': 'adjective',
  'pos.adverb': 'adverb',
  'pos.pronoun': 'pronoun',
  'pos.particle': 'particle',
  'pos.preposition': 'preposition',
  'pos.conjunction': 'conjunction',
  'pos.numeral': 'numeral',
  'pos.expression': 'expression',
  'pos.slang': 'slang',
  'pos.question': 'question',
  'pos.idiom': 'idiom',

  'today.continue': 'Continue lesson',
  'today.dailyGoal': '{done} / {goal} min',
  'today.reviewSm2': 'Review words ({count})',
  'today.newLesson': 'New lesson',
  'today.goalMet': 'Daily goal done',
  'today.lessonsDone': 'Every lesson at this level is done',

  'lessons.title': 'Lessons',
  'lessons.subtitle': 'Short Mondly-style units. A lesson introduces at most five new words.',
  'lessons.locked': 'Finish the previous unit first',
  'lessons.of': '{done} / {total} lessons',
  'lessons.start': 'Start lesson',

  'lesson.teach': 'New word',
  'lesson.pickGloss': 'Pick the translation',
  'lesson.pickPicture': 'Which card matches?',
  'lesson.listen': 'Listen and choose',
  'lesson.build': 'Build the phrase',
  'lesson.dialogue': 'Dialogue',
  'lesson.gotIt': 'Got it',
  'lesson.finished': 'Lesson complete',
  'lesson.finishedHint': 'New words went into reviews. Your streak updates if this is the first session today.',
  'lesson.check': 'Check',
  'lesson.tapChips': 'Tap the words in order',
  'lesson.type': 'Type the word',
  'lesson.cloze': 'Fill in the missing word',
  'lesson.gender': 'Match the gender',
  'lesson.form': 'Form the verb',
  'verbs.title': 'Verbs',
  'verbs.subtitle': '{count} frequent verbs · seven binyanim',
  'verbs.binyanim': 'Seven binyanim',
  'verbs.table': 'Conjugation',
  'verbs.infinitive': 'Infinitive',
  'verbs.present': 'Present',
  'verbs.past': 'Past',
  'verbs.future': 'Future',
  'verbs.imperative': 'Imperative',
  'verbs.root': 'Root {root}',
  'verbs.related': 'Related words in the lexicon',
  'verbs.emptyRelated': 'No related lexicon words yet.',
  'verbs.practice': 'Form the verb',
  'verbs.missing': 'Verb not found',
  'verbs.person.1sg': 'I',
  'verbs.person.2ms': 'you m.',
  'verbs.person.2fs': 'you f.',
  'verbs.person.3ms': 'he',
  'verbs.person.3fs': 'she',
  'verbs.person.1pl': 'we',
  'verbs.person.2mp': 'you m. pl.',
  'verbs.person.2fp': 'you f. pl.',
  'verbs.person.3pl': 'they',
  'verbs.person.ms': 'm. sg.',
  'verbs.person.fs': 'f. sg.',
  'verbs.person.mp': 'm. pl.',
  'verbs.person.fp': 'f. pl.',
  'verbs.form.infinitive': 'infinitive',
  'verbs.form.present': 'present',
  'verbs.form.past': 'past',
  'verbs.form.future': 'future',
  'verbs.form.imperative': 'imperative',

  'slang.title': 'Slang',
  'slang.subtitle': 'Real Israeli slang — only expressions people actually say.',
  'slang.usage': 'How it’s used',
  'slang.empty': 'Slang for this level is still locked',
  'slang.search': 'Search slang',
  'slang.count': 'Phrases at your level and below: {shown} of {total}',

  'hud.streak': 'Streak {count}',
  'hud.xp': '{count} XP',
  'hud.hearts': 'Energy {count}',
  'hud.flag': 'Translation language {code}',
  'lesson.awesome': 'Nice!',
  'lesson.wrongTitle': 'Not quite',
  'lesson.correctAnswer': 'Correct answer: {text}',
  'lesson.continue': 'Continue',
  'lesson.closeA11y': 'Close lesson',
  'celebrate.title': 'Lesson complete!',
  'celebrate.xp': '+{count} XP',
  'celebrate.accuracy': 'Accuracy {pct}%',
  'celebrate.time': '{seconds} s',
  'celebrate.streak': 'Streak {count}',
  'settings.sounds': 'Answer sounds',
  'settings.soundsHint': 'A short chime for right and wrong answers. You can turn it off.',
  'settings.soundsOn': 'On',
  'settings.soundsOff': 'Off',
  'progress.xpChart': 'XP by day',
  'progress.calendar': 'Streak calendar',
  'progress.rings': 'Level rings',
  'mascot.hi': 'Hi! I’m Gama. Let’s learn Hebrew.',
  'mascot.a11y': 'Gama the camel',
  'path.done': 'Done: {title}',
  'path.current': 'Current: {title}',
  'path.locked': 'Locked: {title}',
  'onboarding.comboTitle': 'Goal and pace',
  'onboarding.comboHint': 'Why you’re learning and how many minutes a day. Reminder at {hour}:00.',
  'lesson.report': 'Report this exercise',
  'lesson.reported': 'Thanks, saved',
  'lesson.exitTitle': 'Leave the lesson?',
  'lesson.exitBody': 'Progress in this lesson will not be saved.',
  'lesson.exit': 'Leave',
  'lesson.stay': 'Stay',
  'lesson.buildPrompt': 'Build: {text}',
  'lesson.next': 'Next lesson',
  'today.verbs': 'Verbs',
  'today.goalRing': '{done} / {goal} min',
  'settings.address': 'Addressed as',
  'settings.addressHint': 'How Hebrew should speak to you: masculine or feminine.',
  'settings.address.m': 'As a man',
  'settings.address.f': 'As a woman',
  'onboarding.addressTitle': 'How should we address you?',
  'celebrate.next': 'Next lesson',
  'nav.theme': 'Topic',
};

const TABLES: Record<UiLanguage, Dict> = { ru, en };

export function i18nKeys(): string[] {
  return Object.keys(ru);
}

export type TranslateVars = Record<string, string | number>;

export function translate(lang: UiLanguage, key: string, vars?: TranslateVars): string {
  const table = TABLES[lang];
  let text = table[key] ?? TABLES.ru[key] ?? key;
  if (vars) {
    Object.entries(vars).forEach(([name, value]) => {
      text = text.replaceAll(`{${name}}`, String(value));
    });
  }
  return text;
}

export function makeT(lang: UiLanguage) {
  return (key: string, vars?: TranslateVars) => translate(lang, key, vars);
}

export function pluralUnits(
  lang: UiLanguage,
  n: number,
  kind: 'day' | 'minute' | 'card'
): string {
  if (lang === 'en') {
    const one = kind === 'day' ? 'day' : kind === 'minute' ? 'minute' : 'card';
    const many = kind === 'day' ? 'days' : kind === 'minute' ? 'minutes' : 'cards';
    return n === 1 ? one : many;
  }
  if (kind === 'day') return pluralRu(n, ['день', 'дня', 'дней']);
  if (kind === 'minute') return pluralRu(n, ['минута', 'минуты', 'минут']);
  return pluralRu(n, ['карточка', 'карточки', 'карточек']);
}

export function wordGloss(word: Word, lang: UiLanguage): string {
  return shortGloss(lang === 'en' ? word.en : word.ru);
}

export function phraseGloss(phrase: Phrase, lang: UiLanguage): string {
  return lang === 'en' ? phrase.en : phrase.ru;
}

export function phraseDistractors(phrase: Phrase, lang: UiLanguage): string[] {
  return lang === 'en' ? phrase.distractorsEn : phrase.distractors;
}

export function letterName(letter: Letter, lang: UiLanguage): string {
  return lang === 'en' ? letter.nameEn : letter.nameRu;
}

export function letterSound(letter: Letter, lang: UiLanguage): string {
  return lang === 'en' ? letter.soundEn : letter.sound;
}

export function vowelName(vowel: Vowel, lang: UiLanguage): string {
  return lang === 'en' ? vowel.nameEn : vowel.nameRu;
}

export function vowelSound(vowel: Vowel, lang: UiLanguage): string {
  return lang === 'en' ? vowel.soundEn : vowel.sound;
}

export function levelTitle(level: Level, lang: UiLanguage): string {
  return lang === 'en' ? level.titleEn : level.title;
}

export function levelSummary(level: Level, lang: UiLanguage): string {
  return lang === 'en' ? level.summaryEn : level.summary;
}

export function levelDetail(level: Level, lang: UiLanguage): string {
  return lang === 'en' ? level.detailEn : level.detail;
}

export function deckTitle(deck: Deck, lang: UiLanguage): string {
  return lang === 'en' ? deck.titleEn : deck.title;
}

export function deckSubtitle(deck: Deck, lang: UiLanguage): string {
  return lang === 'en' ? deck.subtitleEn : deck.subtitle;
}

export function posLabel(pos: string, lang: UiLanguage): string {
  return translate(lang, `pos.${pos}`);
}

export function exampleGloss(example: { ru?: string; en?: string } | undefined, lang: UiLanguage): string {
  const text = lang === 'en' ? example?.en : example?.ru;
  return (text ?? '').trim();
}

export function themeTitle(theme: ThemeInfo, lang: UiLanguage): string {
  return lang === 'en' ? theme.titleEn : theme.title;
}

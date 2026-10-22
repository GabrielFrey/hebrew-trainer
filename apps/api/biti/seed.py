"""Idempotent seed of tracks, 24 published lessons, bosses, SRS-ready vocab."""

from __future__ import annotations

from typing import Any

from sqlalchemy.orm import Session

from biti.courses import COURSES, L10N_STATUS
from biti.draft_l10n import fill_choice, fill_loc, fill_vocab
from biti.models import Course, Lesson, LessonVersion, PublishedChunk, Track, Unit, User, new_id, utcnow

EDITORIAL = {
    "author": "Biti curriculum",
    "native_reviewer": "seed-native",
    "sources": ["original"],
    "license": "proprietary",
    "version": 1,
}


def _loc(en: str, ru: str, he: str = "", uk: str = "", es: str = "", fr: str = "") -> dict[str, str]:
    return fill_loc({"en": en, "ru": ru, "he": he, "uk": uk, "es": es, "fr": fr})


def _mc(eid: str, prompt: dict[str, str], choices: list[dict], accepted: str, **extra: Any) -> dict:
    return {
        "id": eid,
        "type": "mc",
        "prompt": prompt,
        "choices": choices,
        "accepted": [accepted],
        "mode": extra.get("mode", "relaxed"),
        "xp": 10,
        **{k: v for k, v in extra.items() if k != "mode"},
    }


def _type(eid: str, prompt: dict[str, str], accepted: list[str], mode: str = "relaxed", **extra: Any) -> dict:
    return {
        "id": eid,
        "type": extra.pop("type", "type_he"),
        "prompt": prompt,
        "accepted": accepted,
        "mode": mode,
        "xp": 10,
        **extra,
    }


def _order(eid: str, prompt: dict[str, str], tokens: list[str], accepted: list[str]) -> dict:
    return {
        "id": eid,
        "type": "order_rtl",
        "prompt": prompt,
        "tokens": tokens,
        "accepted": accepted,
        "mode": "relaxed",
        "xp": 10,
    }


def _match(eid: str, prompt: dict[str, str], left: list[str], right: list[str], pairs: dict[str, str]) -> dict:
    return {
        "id": eid,
        "type": "match",
        "prompt": prompt,
        "left": left,
        "right": right,
        "pairs": pairs,
        "xp": 10,
    }


def _listen(eid: str, prompt: dict[str, str], accepted: str) -> dict:
    return {
        "id": eid,
        "type": "listen_mc",
        "prompt": prompt,
        "choices": [
            {"id": accepted, "he": accepted},
            {"id": "distractor", "he": "לא"},
        ],
        "accepted": [accepted],
        "requires_audio": True,
        "optional": True,
        "xp": 10,
    }


def _speak(eid: str, prompt: dict[str, str]) -> dict:
    return {
        "id": eid,
        "type": "speak",
        "prompt": prompt,
        "accepted": [],
        "optional": True,
        "capability": "unavailable",
        "xp": 0,
    }


def _vocab(lemma: str, pointed: str, translit: str, ru: str, en: str, **extra: Any) -> dict:
    return {
        "lemma": lemma,
        "pointed": pointed,
        "unpointed": lemma,
        "translit": translit,
        "ru": ru,
        "en": en,
        "gender": extra.get("gender"),
        "number": extra.get("number", "sg"),
        "root": extra.get("root"),
        "binyan": extra.get("binyan"),
        "audio": None,
    }


TRACKS = [
    ("script", 1, _loc("Alef-Bet & Script", "Алеф-бет и письмо", "אלף-בית וכתב")),
    ("niqqud", 2, _loc("Niqqud & Reading", "Огласовки и чтение", "ניקוד וקריאה")),
    ("pronunciation", 3, _loc("Pronunciation", "Произношение", "הגייה")),
    ("grammar", 4, _loc("Grammar", "Грамматика", "דקדוק")),
    ("verbs", 5, _loc("Roots & Verbs", "Корни и глаголы", "שרשים ופעלים")),
    ("vocabulary", 6, _loc("Vocabulary", "Словарь", "אוצר מילים")),
    ("conversation", 7, _loc("Conversation", "Разговор", "שיחה")),
    ("listening", 8, _loc("Listening", "Аудирование", "האזנה")),
    ("slang", 9, _loc("Spoken & slang", "Разговорный и сленг", "דיבור וסלנג")),
    ("formal", 10, _loc("Formal register", "Официальный стиль", "לשון פורמלית")),
    ("reading", 11, _loc("Advanced reading", "Продвинутое чтение", "קריאה מתקדמת")),
]


def _script_lessons() -> list[dict]:
    letters_1 = [
        ("א", "Alef", "Алеф", "ʾalef"),
        ("ב", "Bet", "Бет", "bet"),
        ("ג", "Gimel", "Гимель", "gimel"),
        ("ד", "Dalet", "Далет", "dalet"),
        ("ה", "He", "Һе", "he"),
    ]
    letters_2 = [
        ("ו", "Vav", "Вав", "vav"),
        ("ז", "Zayin", "Заин", "zayin"),
        ("ח", "Het", "Хет", "ḥet"),
        ("ט", "Tet", "Тет", "tet"),
        ("י", "Yod", "Йод", "yod"),
        ("כ", "Kaf", "Каф", "kaf"),
        ("ל", "Lamed", "Ламед", "lamed"),
    ]
    letters_3 = [
        ("מ", "Mem", "Мем", "mem"),
        ("נ", "Nun", "Нун", "nun"),
        ("ס", "Samekh", "Самех", "samekh"),
        ("ע", "Ayin", "Аин", "ʿayin"),
        ("פ", "Pe", "Пе", "pe"),
        ("צ", "Tsadi", "Цади", "tsadi"),
        ("ק", "Qof", "Коф", "qof"),
        ("ר", "Resh", "Реш", "resh"),
        ("ש", "Shin / Sin", "Шин / Син", "shin"),
        ("ת", "Tav", "Тав", "tav"),
    ]

    def letter_lesson(slug: str, letters: list[tuple], title: dict, prereq: list[str], sort: int) -> dict:
        exercises = []
        for i, (glyph, en, ru, tr) in enumerate(letters[:5], 1):
            others = [x[0] for x in letters if x[0] != glyph][:3]
            choices = [{"id": g, "he": g} for g in [glyph, *others]]
            exercises.append(
                _mc(
                    f"which-{i}",
                    _loc(f"Which letter is {en}?", f"Какая буква — {ru}?", f"איזו אות היא {en}?"),
                    choices,
                    glyph,
                )
            )
            exercises.append(
                _type(
                    f"type-{i}",
                    _loc(f"Type {en} ({tr})", f"Наберите {ru}", f"הקלידו {en}"),
                    [glyph],
                    mode="strict_finals" if glyph in "ךםןףץ" else "relaxed",
                    keyboard=True,
                )
            )
        exercises.append(
            _match(
                "match-names",
                _loc("Match letter and name", "Сопоставьте букву и имя", "התאימו אות ושם"),
                [x[0] for x in letters[:4]],
                [x[1] for x in letters[:4]],
                {x[0]: x[1] for x in letters[:4]},
            )
        )
        exercises.append(_speak("say-letter", _loc("Say the first letter aloud", "Произнесите первую букву", "אמרו את האות הראשונה")))
        return {
            "slug": slug,
            "track": "script",
            "level": "starter",
            "cefr": "pre-A1",
            "prerequisites": prereq,
            "sort": sort,
            "title": title,
            "objective": _loc(
                f"Recognize and type {letters[0][0]}–{letters[-1][0]}.",
                f"Узнать и набрать {letters[0][0]}–{letters[-1][0]}.",
                f"לזהות ולהקליד {letters[0][0]}–{letters[-1][0]}.",
            ),
            "explanation": _loc(
                "Print Hebrew is written right to left. Each letter has a name. Niqqud is shown for orientation and is not graded here.",
                "Печатный иврит пишется справа налево. У каждой буквы есть имя. Огласовки здесь для ориентира и не проверяются.",
                "עברית בדפוס נכתבת מימין לשמאל.",
            ),
            "vocabulary": [_vocab(g, g, tr, ru, en) for g, en, ru, tr in letters],
            "exercises": exercises,
        }

    sofiyot = [
        ("ך", "כ", "kaf sofit"),
        ("ם", "מ", "mem sofit"),
        ("ן", "נ", "nun sofit"),
        ("ף", "פ", "pe sofit"),
        ("ץ", "צ", "tsadi sofit"),
    ]
    sof_ex = []
    for i, (fin, reg, name) in enumerate(sofiyot, 1):
        sof_ex.append(
            _mc(
                f"sofit-{i}",
                _loc(f"Final form of {reg} is…", f"Конечная форма {reg} —", f"הצורה הסופית של {reg}"),
                [{"id": fin, "he": fin}, {"id": reg, "he": reg}, {"id": "ן" if fin != "ן" else "ם", "he": "ן" if fin != "ן" else "ם"}],
                fin,
            )
        )
        sof_ex.append(
            _type(
                f"type-sofit-{i}",
                _loc(f"Type the final letter {name}", f"Наберите конечную {name}", f"הקלידו {fin}"),
                [fin],
                mode="strict_finals",
                keyboard=True,
            )
        )
    sof_ex.append(
        _type(
            "word-shalom",
            _loc("Type the word for peace / hello (plain letters)", "Наберите слово «шалом» без огласовок", "הקלידו שלום"),
            ["שלום"],
            mode="relaxed",
            keyboard=True,
        )
    )

    look = {
        "slug": "script-lookalikes",
        "track": "script",
        "level": "beginner",
        "cefr": "A1",
        "prerequisites": ["script-sofiyot"],
        "sort": 5,
        "title": _loc("Lookalike letters", "Похожие буквы", "אותיות דומות"),
        "objective": _loc("Tell ב/כ, ד/ר, ה/ח/ת apart.", "Отличать ב/כ, ד/ר, ה/ח/ת.", "להבחין בין ב/כ, ד/ר, ה/ח/ת."),
        "explanation": _loc(
            "Bet has a base; kaf is open at the bottom. Dalet has an ear to the right; resh is rounded.",
            "У бет есть «полка» снизу, каф снизу открыта. У далет ушко вправо, реш округлая.",
            "שימו לב לבסיס של ב ולפתיחה של כ.",
        ),
        "vocabulary": [
            _vocab("בית", "בַּיִת", "báyit", "дом", "house", gender="m"),
            _vocab("כלב", "כֶּלֶב", "kélev", "собака", "dog", gender="m"),
        ],
        "exercises": [
            _mc("bk", _loc("Which is Bet?", "Где бет?", "איפה ב?"), [{"id": "ב", "he": "ב"}, {"id": "כ", "he": "כ"}], "ב"),
            _mc("dr", _loc("Which is Resh?", "Где реш?", "איפה ר?"), [{"id": "ר", "he": "ר"}, {"id": "ד", "he": "ד"}], "ר"),
            _mc("hht", _loc("Which is Het?", "Где хет?", "איפה ח?"), [{"id": "ח", "he": "ח"}, {"id": "ה", "he": "ה"}, {"id": "ת", "he": "ת"}], "ח"),
            _type("type-bayit", _loc("Type house", "Наберите «дом»", "הקלידו בית"), ["בית"], keyboard=True),
            _type("type-kelev", _loc("Type dog", "Наберите «собака»", "הקלידו כלב"), ["כלב"], keyboard=True),
            _mc("closed-kaf", _loc("Final kaf is…", "Конечная каф —", "כ סופית"), [{"id": "ך", "he": "ך"}, {"id": "כ", "he": "כ"}], "ך"),
        ],
    }

    dagesh = {
        "slug": "script-dagesh-ktav",
        "track": "script",
        "level": "beginner",
        "cefr": "A1",
        "prerequisites": ["script-lookalikes"],
        "sort": 6,
        "title": _loc("Dagesh and cursive", "Дагеш и рукопись", "דגש וכתב יד"),
        "objective": _loc("Spot dagesh and know print vs cursive exist.", "Видеть дагеш и знать, что есть ктав яд.", "לזהות דגש ולהכיר כתב יד."),
        "explanation": _loc(
            "A dagesh is a dot in a letter. Tracing uses a canvas; cursive font is not vendored yet so strokes are labeled print-first.",
            "Дагеш — точка внутри буквы. Обводка — на холсте; курсивный шрифт ещё не подключён, поэтому ориентир — печать.",
            "דגש הוא נקודה בתוך האות.",
        ),
        "vocabulary": [_vocab("בּ", "בּ", "b", "бет с дагеш", "bet with dagesh")],
        "exercises": [
            _mc(
                "dagesh-b",
                _loc("Which letter has dagesh?", "Где дагеш?", "איפה הדגש?"),
                [{"id": "bet", "he": "בּ"}, {"id": "vet", "he": "ב"}],
                "bet",
            ),
            _mc(
                "print-vs-cursive",
                _loc("Ktav yad is…", "Ктав яд — это…", "כתב יד הוא"),
                [
                    {"id": "cursive", "en": "handwritten cursive", "ru": "рукописный курсив"},
                    {"id": "print", "en": "square print only", "ru": "только печать"},
                ],
                "cursive",
            ),
            _type("type-bet-plain", _loc("Type bet (no niqqud required)", "Наберите бет", "הקלידו ב"), ["ב", "בּ"], mode="relaxed", keyboard=True),
            {
                "id": "trace-alef",
                "type": "trace",
                "prompt": _loc("Trace print Alef (fallback canvas)", "Обведите печатный алеф", "עקבו אחרי א"),
                "accepted": ["א"],
                "mode": "relaxed",
                "honest_fallback": "canvas",
                "xp": 10,
            },
            _listen("listen-alef", _loc("Tap the letter you would hear (audio unavailable → skip)", "Нажмите букву (звук может быть недоступен)", "לחצו על האות"), "א"),
            _speak("say-alef", _loc("Say Alef", "Скажите алеф", "אמרו אלף")),
        ],
    }

    return [
        letter_lesson("script-alef-he", letters_1, _loc("Letters Alef–He", "Буквы алеф–һе", "אותיות א–ה"), [], 1),
        letter_lesson("script-vav-lamed", letters_2, _loc("Letters Vav–Lamed", "Буквы вав–ламед", "אותיות ו–ל"), ["script-alef-he"], 2),
        letter_lesson("script-mem-tav", letters_3, _loc("Letters Mem–Tav", "Буквы мем–тав", "אותיות מ–ת"), ["script-vav-lamed"], 3),
        {
            "slug": "script-sofiyot",
            "track": "script",
            "level": "starter",
            "cefr": "pre-A1",
            "prerequisites": ["script-mem-tav"],
            "sort": 4,
            "title": _loc("Final letters", "Конечные буквы", "אותיות סופיות"),
            "objective": _loc("Use ךםןףץ at the end of a word.", "Ставить ךםןףץ в конце слова.", "להשתמש ב־ךםןףץ."),
            "explanation": _loc(
                "Five letters change shape at the end of a word. Grading is strict: a non-final form is not accepted.",
                "Пять букв меняют форму в конце слова. Проверка строгая: обычная форма не засчитывается.",
                "חמש אותיות משנות צורה בסוף מילה.",
            ),
            "vocabulary": [_vocab(f, f, n, n, n) for f, _r, n in sofiyot],
            "exercises": sof_ex,
        },
        look,
        dagesh,
    ]


def _grammar_lessons() -> list[dict]:
    return [
        {
            "slug": "grammar-gender",
            "track": "grammar",
            "level": "beginner",
            "cefr": "A1",
            "prerequisites": ["script-sofiyot"],
            "sort": 10,
            "title": _loc("Gender of nouns", "Род существительных", "מין השם"),
            "objective": _loc("Classify common nouns as masculine or feminine.", "Определять род частых существительных.", "לסווג שמות עצם."),
            "explanation": _loc(
                "Most feminine nouns end in ה or ת. סֵפֶר is masculine; מִחְבָּרָה is feminine.",
                "Большинство женских заканчиваются на ה или ת. ספר — мужской род, מחברת — женский.",
                "רבים מן השמות בנקבה מסתיימים ב־ה או ת.",
            ),
            "vocabulary": [
                _vocab("ספר", "סֵפֶר", "séfer", "книга", "book", gender="m"),
                _vocab("מחברת", "מִחְבָּרָה", "makhberá", "тетрадь", "notebook", gender="f"),
                _vocab("ילד", "יֶלֶד", "yéled", "мальчик", "boy", gender="m"),
                _vocab("ילדה", "יַלְדָּה", "yaldá", "девочка", "girl", gender="f"),
            ],
            "exercises": [
                _mc("sefer-g", _loc("ספר is…", "ספר —", "ספר הוא"), [{"id": "m", "en": "masculine", "ru": "мужской"}, {"id": "f", "en": "feminine", "ru": "женский"}], "m"),
                _mc("mach-g", _loc("מחברת is…", "מחברת —", "מחברת היא"), [{"id": "f", "en": "feminine", "ru": "женский"}, {"id": "m", "en": "masculine", "ru": "мужской"}], "f"),
                _type("type-yalda", _loc("Type girl", "Наберите «девочка»", "הקלידו ילדה"), ["ילדה"], keyboard=True),
                _type("type-yeled", _loc("Type boy", "Наберите «мальчик»", "הקלידו ילד"), ["ילד"], keyboard=True),
                _mc("ta-ending", _loc("A ת ending often marks…", "Окончание ת часто значит…", "סיומת ת"), [{"id": "f", "en": "feminine", "ru": "женский род"}, {"id": "pl", "en": "plural only", "ru": "только множественное"}], "f"),
                _order("order-yeled", _loc("Order: the boy", "Соберите: мальчик", "סדרו: הילד"), ["ה", "ילד"], ["ה", "ילד"]),
            ],
        },
        {
            "slug": "grammar-definite",
            "track": "grammar",
            "level": "beginner",
            "cefr": "A1",
            "prerequisites": ["grammar-gender"],
            "sort": 11,
            "title": _loc("The definite article", "Определённый артикль", "ה הידיעה"),
            "objective": _loc("Add ה־ to make a noun definite.", "Ставить ה־ для определённости.", "להוסיף ה הידיעה."),
            "explanation": _loc(
                "Hebrew attaches הַ to the noun: סֵפֶר → הַסֵּפֶר. There is no separate word for 'the'.",
                "Артикль הַ приклеивается к слову: ספר → הספר. Отдельного слова the нет.",
                "ה הידיעה מצטרפת לשם: ספר → הספר.",
            ),
            "vocabulary": [_vocab("הספר", "הַסֵּפֶר", "haséfer", "книга (опред.)", "the book", gender="m")],
            "exercises": [
                _type("the-book", _loc("Type 'the book' (unpointed)", "Наберите «книга» с артиклем", "הקלידו הספר"), ["הספר"], keyboard=True),
                _type("the-house", _loc("Type 'the house'", "Наберите «дом» с артиклем", "הקלידו הבית"), ["הבית"], keyboard=True),
                _mc("no-separate", _loc("'The' is…", "Артикль the —", "the בעברית"), [{"id": "prefix", "en": "a prefix ה־", "ru": "приставка ה־"}, {"id": "word", "en": "a separate word", "ru": "отдельное слово"}], "prefix"),
                _order("order-the-dog", _loc("Order: the dog", "Соберите: собака (опред.)", "הכלב"), ["ה", "כלב"], ["ה", "כלב"]),
                _type("the-girl", _loc("Type 'the girl'", "Наберите «девочка» с артиклем", "הקלידו הילדה"), ["הילדה"], keyboard=True),
                _mc("ha-sound", _loc("הַ is read roughly…", "הַ читается примерно…", "הַ"), [{"id": "ha", "en": "ha", "ru": "ха"}, {"id": "e", "en": "e", "ru": "э"}], "ha"),
            ],
        },
        {
            "slug": "grammar-adjectives",
            "track": "grammar",
            "level": "beginner",
            "cefr": "A1",
            "prerequisites": ["grammar-definite"],
            "sort": 12,
            "title": _loc("Adjective agreement", "Согласование прилагательных", "התאם תואר"),
            "objective": _loc("Make adjectives agree in gender and number.", "Согласовать прилагательное в роде и числе.", "להתאים תואר לשם."),
            "explanation": _loc(
                "The adjective follows the noun and copies gender/number: יֶלֶד גָּדוֹל, יַלְדָּה גְּדוֹלָה.",
                "Прилагательное стоит после существительного: ילד גדול, ילדה גדולה.",
                "התואר בא אחרי השם: ילד גדול, ילדה גדולה.",
            ),
            "vocabulary": [
                _vocab("גדול", "גָּדוֹל", "gadól", "большой", "big", gender="m"),
                _vocab("גדולה", "גְּדוֹלָה", "gdolá", "большая", "big (f)", gender="f"),
            ],
            "exercises": [
                _type("big-f", _loc("Feminine of גדול", "Женский род от גדול", "נקבה של גדול"), ["גדולה"], keyboard=True),
                _mc("order", _loc("ילד גדול means…", "ילד גדול значит…", "ילד גדול"), [{"id": "boy-big", "en": "a big boy", "ru": "большой мальчик"}, {"id": "big-boy-en-order", "en": "boy is after big", "ru": "мальчик после «большой»"}], "boy-big"),
                _order("phrase", _loc("Order: a big girl", "Соберите: большая девочка", "ילדה גדולה"), ["ילדה", "גדולה"], ["ילדה", "גדולה"]),
                _type("the-big-book", _loc("Type: the big book (הספר הגדול)", "Наберите הספר הגדול", "הקלידו הספר הגדול"), ["הספר הגדול"], keyboard=True),
                _mc("article-both", _loc("When the noun is definite the adjective…", "Если существительное определённое, прилагательное…", "כשהשם מיודע"), [{"id": "also", "en": "also takes ה־", "ru": "тоже получает ה־"}, {"id": "never", "en": "never takes ה־", "ru": "никогда не берёт ה־"}], "also"),
                _type("gdola", _loc("Type גדולה", "Наберите גדולה", "הקלידו גדולה"), ["גדולה"], keyboard=True),
            ],
        },
        {
            "slug": "grammar-pronouns",
            "track": "grammar",
            "level": "beginner",
            "cefr": "A1",
            "prerequisites": ["grammar-adjectives"],
            "sort": 13,
            "title": _loc("Subject pronouns", "Личные местоимения", "כינוי גוף"),
            "objective": _loc("Use אני אתה את הוא היא.", "Употреблять אני אתה את הוא היא.", "להשתמש באני אתה את הוא היא."),
            "explanation": _loc(
                "אני I, אַתָּה you m., אַתְּ you f., הוּא he, הִיא she. Present-tense verbs still show gender.",
                "אני — я, אתה — ты м., את — ты ж., הוא — он, היא — она.",
                "אני, אתה, את, הוא, היא.",
            ),
            "vocabulary": [
                _vocab("אני", "אֲנִי", "aní", "я", "I"),
                _vocab("אתה", "אַתָּה", "atá", "ты (м.)", "you (m)"),
                _vocab("את", "אַתְּ", "at", "ты (ж.)", "you (f)"),
                _vocab("הוא", "הוּא", "hu", "он", "he"),
                _vocab("היא", "הִיא", "hi", "она", "she"),
            ],
            "exercises": [
                _type("i", _loc("Type I", "Наберите «я»", "הקלידו אני"), ["אני"], keyboard=True),
                _mc("ata", _loc("אַתָּה is…", "אתה —", "אתה"), [{"id": "you-m", "en": "you (m)", "ru": "ты (м.)"}, {"id": "he", "en": "he", "ru": "он"}], "you-m"),
                _mc("at", _loc("אַתְּ is…", "את —", "את"), [{"id": "you-f", "en": "you (f)", "ru": "ты (ж.)"}, {"id": "you-m", "en": "you (m)", "ru": "ты (м.)"}], "you-f"),
                _type("he", _loc("Type he", "Наберите «он»", "הקלידו הוא"), ["הוא"], keyboard=True),
                _type("she", _loc("Type she", "Наберите «она»", "הקלידו היא"), ["היא"], keyboard=True),
                _order("i-am", _loc("Order: I (only)", "Соберите: я", "אני"), ["אני"], ["אני"]),
            ],
        },
        {
            "slug": "roots-shoresh",
            "track": "verbs",
            "level": "beginner",
            "cefr": "A1",
            "prerequisites": ["grammar-pronouns"],
            "sort": 14,
            "title": _loc("The shoresh", "Корень (шореш)", "השורש"),
            "objective": _loc("Identify a three-letter root in related words.", "Видеть трёхбуквенный корень.", "לזהות שורש בני שלוש אותיות."),
            "explanation": _loc(
                "Hebrew words are built on a shoresh. כ־ת־ב appears in כתב, מכתב, לכתוב.",
                "Слова строятся на корне. כ־ת־ב есть в כתב, מכתב, לכתוב.",
                "שורש כ־ת־ב מופיע בכתב, מכתב, לכתוב.",
            ),
            "vocabulary": [
                _vocab("כתב", "כָּתַב", "katáv", "он написал", "he wrote", root="כתב", binyan="paal"),
                _vocab("מכתב", "מִכְתָּב", "mikhtáv", "письмо", "letter", root="כתב", gender="m"),
            ],
            "exercises": [
                {
                    "id": "root-ktb",
                    "type": "identify_root",
                    "prompt": _loc("Root of מכתב", "Корень מכתב", "השורש של מכתב"),
                    "choices": [{"id": "כתב", "he": "כתב"}, {"id": "מלך", "he": "מלך"}, {"id": "למד", "he": "למד"}],
                    "accepted": ["כתב"],
                    "mode": "strict_root",
                    "xp": 10,
                },
                _type("type-root", _loc("Type the root letters כתב", "Наберите корень כתב", "הקלידו כתב"), ["כתב"], mode="strict_root", keyboard=True),
                _mc("related", _loc("Which word shares כ־ת־ב?", "Какое слово с корнем כ־ת־ב?", "איזו מילה עם כ־ת־ב?"), [{"id": "לכתוב", "he": "לכתוב"}, {"id": "כלב", "he": "כלב"}], "לכתוב"),
                _type("miktav", _loc("Type letter (mail)", "Наберите «письмо»", "הקלידו מכתב"), ["מכתב"], keyboard=True),
                _mc("three", _loc("A typical shoresh has…", "Обычный шореш состоит из…", "שורש טיפוסי"), [{"id": "3", "en": "3 letters", "ru": "3 букв"}, {"id": "1", "en": "1 letter", "ru": "1 буквы"}], "3"),
                _speak("say-ktv", _loc("Say the root", "Произнесите корень", "אמרו את השורש")),
            ],
        },
        {
            "slug": "verbs-paal-present",
            "track": "verbs",
            "level": "beginner",
            "cefr": "A1",
            "prerequisites": ["roots-shoresh"],
            "sort": 15,
            "title": _loc("Pa'al present", "Пааль, настоящее", "קל בהווה"),
            "objective": _loc("Conjugate כותב / כותבת / כותבים / כותבות.", "Спрягать כותב–כותבות.", "לשנות כותב/כותבת/כותבים/כותבות."),
            "explanation": _loc(
                "Pa'al (קל) present uses a participle: כּוֹתֵב, כּוֹתֶבֶת, כּוֹתְבִים, כּוֹתְבוֹת.",
                "Настоящее пааль — причастие: כותב, כותבת, כותבים, כותבות.",
                "הווה בבניין קל: כותב, כותבת, כותבים, כותבות.",
            ),
            "vocabulary": [
                _vocab("כותב", "כּוֹתֵב", "kotév", "пишет (м.)", "writes (m)", root="כתב", binyan="paal"),
                _vocab("כותבת", "כּוֹתֶבֶת", "kotévet", "пишет (ж.)", "writes (f)", root="כתב", binyan="paal"),
            ],
            "exercises": [
                _type("ms", _loc("He writes (unpointed)", "Он пишет", "הוא כותב"), ["כותב"], keyboard=True),
                _type("fs", _loc("She writes", "Она пишет", "היא כותבת"), ["כותבת"], keyboard=True),
                _type("mp", _loc("They write (m)", "Они пишут (м.)", "הם כותבים"), ["כותבים"], keyboard=True),
                _type("fp", _loc("They write (f)", "Они пишут (ж.)", "הן כותבות"), ["כותבות"], keyboard=True),
                {
                    "id": "binyan",
                    "type": "identify_binyan",
                    "prompt": _loc("Binyan of כותב", "Биньян כותב", "הבניין של כותב"),
                    "choices": [{"id": "paal", "en": "Pa'al / Qal"}, {"id": "piel", "en": "Pi'el"}, {"id": "hifil", "en": "Hif'il"}],
                    "accepted": ["paal"],
                    "xp": 10,
                },
                _order("ani-kotev", _loc("Order: I write (m)", "Соберите: я пишу (м.)", "אני כותב"), ["אני", "כותב"], ["אני", "כותב"]),
            ],
        },
    ]


def _vocab_lessons() -> list[dict]:
    packs = [
        (
            "vocab-greetings",
            "starter",
            "pre-A1",
            [],
            20,
            _loc("Greetings", "Приветствия", "ברכות"),
            [
                ("שלום", "שָׁלוֹם", "shalóm", "привет / мир", "hello / peace"),
                ("בוקר טוב", "בֹּקֶר טוֹב", "bóker tov", "доброе утро", "good morning"),
                ("ערב טוב", "עֶרֶב טוֹב", "érev tov", "добрый вечер", "good evening"),
                ("תודה", "תּוֹדָה", "todá", "спасибо", "thank you"),
                ("בבקשה", "בְּבַקָּשָׁה", "bevakashá", "пожалуйста", "please / you're welcome"),
            ],
        ),
        (
            "vocab-family",
            "beginner",
            "A1",
            ["vocab-greetings"],
            21,
            _loc("Family", "Семья", "משפחה"),
            [
                ("אבא", "אַבָּא", "ába", "папа", "dad"),
                ("אמא", "אִמָּא", "íma", "мама", "mom"),
                ("אח", "אָח", "akh", "брат", "brother"),
                ("אחות", "אָחוֹת", "akhót", "сестра", "sister"),
                ("משפחה", "מִשְׁפָּחָה", "mishpakhá", "семья", "family"),
            ],
        ),
        (
            "vocab-shuk",
            "beginner",
            "A1",
            ["vocab-family"],
            22,
            _loc("At the shuk", "На рынке", "בשוק"),
            [
                ("שוק", "שׁוּק", "shuk", "рынок", "market"),
                ("עגבנייה", "עַגְבָנִיָּה", "agvaniyá", "помидор", "tomato"),
                ("מלפפון", "מְלָפְפוֹן", "melafefón", "огурец", "cucumber"),
                ("כמה זה עולה", "כַּמָּה זֶה עוֹלֶה", "káma ze olé", "сколько это стоит", "how much is it"),
                ("שקל", "שֶׁקֶל", "shékel", "шекель", "shekel"),
            ],
        ),
        (
            "vocab-numbers",
            "beginner",
            "A1",
            ["vocab-shuk"],
            23,
            _loc("Numbers 1–10", "Числа 1–10", "מספרים 1–10"),
            [
                ("אחת", "אַחַת", "akhát", "один (ж.)", "one (f)"),
                ("שתיים", "שְׁתַּיִם", "shtáyim", "два (ж.)", "two (f)"),
                ("שלוש", "שָׁלוֹשׁ", "shalósh", "три (ж.)", "three (f)"),
                ("ארבע", "אַרְבַּע", "arbá", "четыре (ж.)", "four (f)"),
                ("חמש", "חָמֵשׁ", "khamésh", "пять (ж.)", "five (f)"),
                ("עשר", "עֶשֶׂר", "éser", "десять (ж.)", "ten (f)"),
            ],
        ),
        (
            "vocab-colors",
            "beginner",
            "A1",
            ["vocab-numbers"],
            24,
            _loc("Colors", "Цвета", "צבעים"),
            [
                ("אדום", "אָדֹם", "adóm", "красный", "red"),
                ("כחול", "כָּחֹל", "kakhól", "синий", "blue"),
                ("ירוק", "יָרֹק", "yarók", "зелёный", "green"),
                ("צהוב", "צָהֹב", "tsahóv", "жёлтый", "yellow"),
                ("לבן", "לָבָן", "laván", "белый", "white"),
                ("שחור", "שָׁחוֹר", "shakhór", "чёрный", "black"),
            ],
        ),
        (
            "vocab-home",
            "beginner",
            "A1",
            ["vocab-colors"],
            25,
            _loc("At home", "Дом", "בבית"),
            [
                ("בית", "בַּיִת", "báyit", "дом", "house / home"),
                ("חדר", "חֶדֶר", "khéder", "комната", "room"),
                ("מטבח", "מִטְבָּח", "mitbákh", "кухня", "kitchen"),
                ("שולחן", "שֻׁלְחָן", "shulkhán", "стол", "table"),
                ("כיסא", "כִּסֵּא", "kisé", "стул", "chair"),
            ],
        ),
    ]
    out = []
    for slug, level, cefr, pre, sort, title, words in packs:
        exercises = []
        for i, (he, pointed, tr, ru, en) in enumerate(words[:5], 1):
            exercises.append(
                _mc(
                    f"mc-{i}",
                    _loc(f"What is {en}?", f"Как будет «{ru}»?", f"מה {en}?"),
                    [{"id": he, "he": he}, {"id": words[(i) % len(words)][0], "he": words[(i) % len(words)][0]}],
                    he,
                )
            )
            exercises.append(_type(f"type-{i}", _loc(f"Type: {en}", f"Наберите: {ru}", f"הקלידו: {en}"), [he, pointed], keyboard=True))
        exercises.append(_listen(f"listen-{slug}", _loc("Tap what you would hear", "Нажмите услышанное", "לחצו על מה ששומעים"), words[0][0]))
        out.append(
            {
                "slug": slug,
                "track": "vocabulary",
                "level": level,
                "cefr": cefr,
                "prerequisites": pre,
                "sort": sort,
                "title": title,
                "objective": _loc(f"Use the {title['en'].lower()} set.", f"Использовать набор «{title['ru']}».", title["he"]),
                "explanation": _loc(
                    "Say the Hebrew aloud. Transliteration is a hint, not the answer.",
                    "Произносите иврит вслух. Транскрипция — подсказка, не ответ.",
                    "התעתיק הוא רמז, לא התשובה.",
                ),
                "vocabulary": [_vocab(he, pointed, tr, ru, en) for he, pointed, tr, ru, en in words],
                "exercises": exercises[:10],
            }
        )
    return out


def _convo_lessons() -> list[dict]:
    dialogs = [
        (
            "convo-introductions",
            _loc("Introductions", "Знакомство", "היכרות"),
            [],
            30,
            "מה שמך",
            [
                ("שלום, מה שמך", "שָׁלוֹם, מַה שִּׁמְךָ", "hello, what is your name (m)"),
                ("קוראים לי", "קוֹרְאִים לִי", "my name is"),
                ("נעים מאוד", "נָעִים מְאֹד", "nice to meet you"),
                ("אני מרוסיה", "אֲנִי מֵרוּסְיָה", "I am from Russia"),
                ("אני גר בתל אביב", "אֲנִי גָּר בְּתֵל אָבִיב", "I live in Tel Aviv (m)"),
            ],
        ),
        (
            "convo-shuk",
            _loc("Buying at the shuk", "Покупка на рынке", "קנייה בשוק"),
            ["convo-introductions", "vocab-shuk"],
            31,
            "כמה זה עולה",
            [
                ("יש לך עגבניות", "יֵשׁ לְךָ עַגְבָנִיּוֹת", "do you have tomatoes"),
                ("כמה זה עולה", "כַּמָּה זֶה עוֹלֶה", "how much is it"),
                ("אפשר קילו", "אֶפְשָׁר קִילוֹ", "can I have a kilo"),
                ("בבקשה", "בְּבַקָּשָׁה", "please"),
                ("תודה רבה", "תּוֹדָה רַבָּה", "thank you very much"),
            ],
        ),
        (
            "convo-transport",
            _loc("Transport", "Транспорт", "תחבורה"),
            ["convo-introductions"],
            32,
            "איפה האוטובוס",
            [
                ("איפה התחנה", "אֵיפֹה הַתַּחֲנָה", "where is the stop"),
                ("אוטובוס", "אוֹטוֹבּוּס", "bus"),
                ("רכבת", "רַכֶּבֶת", "train"),
                ("כרטיס", "כַּרְטִיס", "ticket"),
                ("מתי האוטובוס הבא", "מָתַי הָאוֹטוֹבּוּס הַבָּא", "when is the next bus"),
            ],
        ),
        (
            "convo-cafe",
            _loc("At the café", "В кафе", "בבית קפה"),
            ["convo-introductions"],
            33,
            "אפשר קפה",
            [
                ("אפשר קפה", "אֶפְשָׁר קָפֶה", "can I have a coffee"),
                ("תה", "תֵּה", "tea"),
                ("מים", "מַיִם", "water"),
                ("חשבון", "חֶשְׁבּוֹן", "the bill"),
                ("בלי סוכר", "בְּלִי סֻכָּר", "without sugar"),
            ],
        ),
        (
            "convo-phone",
            _loc("On the phone", "По телефону", "בטלפון"),
            ["convo-introductions"],
            34,
            "הלו",
            [
                ("הלו", "הָלוֹ", "hello (phone)"),
                ("מי מדבר", "מִי מְדַבֵּר", "who is speaking"),
                ("אפשר לדבר עם", "אֶפְשָׁר לְדַבֵּר עִם", "may I speak with"),
                ("אני אתקשר אחר כך", "אֲנִי אֶתְקַשֵּׁר אַחַר כָּךְ", "I will call later"),
                ("להתראות", "לְהִתְרָאוֹת", "goodbye"),
            ],
        ),
        (
            "convo-emergency",
            _loc("Asking for help", "Просьба о помощи", "בקשת עזרה"),
            ["convo-introductions"],
            35,
            "צריך עזרה",
            [
                ("צריך עזרה", "צָרִיךְ עֶזְרָה", "I need help (m)"),
                ("משטרה", "מִשְׁטָרָה", "police"),
                ("אמבולנס", "אַמְבּוּלַנְס", "ambulance"),
                ("אבדתי", "אָבַדְתִּי", "I am lost"),
                ("לא מרגיש טוב", "לֹא מַרְגִּישׁ טוֹב", "I don't feel well (m)"),
            ],
        ),
    ]
    out = []
    for slug, title, pre, sort, key, lines in dialogs:
        exercises = [
            _type("key-phrase", _loc("Type the key phrase", "Наберите ключевую фразу", "הקלידו את המשפט המפתח"), [key, lines[0][0]], keyboard=True),
        ]
        for i, (he, pointed, en) in enumerate(lines[:4], 1):
            exercises.append(_mc(f"mean-{i}", _loc(f"Meaning of {he}", f"Значение {he}", he), [{"id": en, "en": en}, {"id": "x", "en": "goodbye" if en != "goodbye" else "hello"}], en))
            exercises.append(_type(f"type-{i}", _loc(f"Type: {en}", f"Наберите: {en}", "הקלידו"), [he], keyboard=True))
        exercises.append(_order("order", _loc("Order the greeting", "Соберите приветствие", "סדרו שלום"), ["שלום"], ["שלום"]))
        exercises.append(_listen("listen", _loc("Tap the phrase (audio optional)", "Нажмите фразу", "לחצו על המשפט"), lines[0][0]))
        exercises.append(_speak("say", _loc("Say the key phrase", "Скажите ключевую фразу", "אמרו את המשפט")))
        out.append(
            {
                "slug": slug,
                "track": "conversation",
                "level": "beginner",
                "cefr": "A1",
                "prerequisites": pre,
                "sort": sort,
                "title": title,
                "objective": _loc(f"Handle a short {title['en'].lower()} exchange.", f"Провести короткий диалог: {title['ru']}.", title["he"]),
                "explanation": _loc(
                    "Ulpan style: learn a whole useful line, then the pieces. Listening is optional while TTS is unavailable.",
                    "Как в ульпане: сначала целая реплика, потом части. Аудирование необязательно без TTS.",
                    "קודם משפט שלם, אחר כך החלקים.",
                ),
                "vocabulary": [_vocab(he, pointed, en, en, en) for he, pointed, en in lines],
                "exercises": exercises[:10],
            }
        )
    return out


def _bosses() -> list[dict]:
    return [
        {
            "slug": "boss-starter",
            "track": "script",
            "kind": "boss",
            "level": "starter",
            "cefr": "pre-A1",
            "prerequisites": ["script-sofiyot", "vocab-greetings"],
            "sort": 40,
            "title": _loc("Starter checkpoint", "Контроль старта", "נקודת ביקורת"),
            "objective": _loc("Read letters and say hello.", "Читать буквы и поздороваться.", "לקרוא אותיות ולהגיד שלום."),
            "explanation": _loc("A short check before Aleph work.", "Короткая проверка перед уровнем алеф.", "בדיקה קצרה."),
            "vocabulary": [],
            "exercises": [
                _type("hello", _loc("Type hello", "Наберите привет", "הקלידו שלום"), ["שלום"], keyboard=True),
                _mc("final-mem", _loc("Final mem is…", "Конечная мем —", "ם"), [{"id": "ם", "he": "ם"}, {"id": "מ", "he": "מ"}], "ם"),
                _type("alef", _loc("Type alef", "Наберите алеф", "הקלידו א"), ["א"], keyboard=True),
                _mc("rtl", _loc("Hebrew is written…", "Иврит пишут…", "עברית נכתבת"), [{"id": "rtl", "en": "right to left", "ru": "справа налево"}, {"id": "ltr", "en": "left to right", "ru": "слева направо"}], "rtl"),
                _type("toda", _loc("Type thank you", "Наберите спасибо", "הקלידו תודה"), ["תודה"], keyboard=True),
            ],
        },
        {
            "slug": "boss-beginner",
            "track": "grammar",
            "kind": "boss",
            "level": "beginner",
            "cefr": "A1",
            "prerequisites": ["verbs-paal-present", "convo-introductions", "vocab-home"],
            "sort": 41,
            "title": _loc("Beginner checkpoint", "Контроль алеф", "נקודת ביקורת אלף"),
            "objective": _loc("Combine script, a verb, and a greeting.", "Связать письмо, глагол и приветствие.", "לחבר כתב, פועל וברכה."),
            "explanation": _loc("Boss node for Aleph.", "Контрольный узел уровня алеф.", "צומת בוס."),
            "vocabulary": [],
            "exercises": [
                _type("i-write", _loc("Type: I write (m)", "Наберите: я пишу (м.)", "אני כותב"), ["אני כותב"], keyboard=True),
                _type("the-house", _loc("Type: the house", "Наберите: дом (опред.)", "הבית"), ["הבית"], keyboard=True),
                _type("name-q", _loc("Type: what is your name (m, unpointed מה שמך)", "Наберите מה שמך", "מה שמך"), ["מה שמך", "מה שמך?"], keyboard=True),
                _mc("root", _loc("Root of כותב", "Корень כותב", "שורש"), [{"id": "כתב", "he": "כתב"}, {"id": "דבר", "he": "דבר"}], "כתב"),
                _type("thanks", _loc("Type thank you", "Наберите спасибо", "תודה"), ["תודה"], keyboard=True),
            ],
        },
    ]


def all_lesson_specs() -> list[dict]:
    from biti.lessons_extra import extra_published

    return _script_lessons() + extra_published() + _grammar_lessons() + _vocab_lessons() + _convo_lessons() + _bosses()


def validate_lesson(spec: dict) -> list[str]:
    errors: list[str] = []
    if spec.get("status") == "planned":
        return errors
    ex = spec.get("exercises") or []
    if not (5 <= len(ex) <= 12):
        errors.append(f"{spec['slug']}: expected 5–12 exercises, got {len(ex)}")
    for item in ex:
        if item.get("type") in {"speak", "listen", "listen_mc"} and item.get("optional"):
            continue
        if item.get("type") != "speak" and not item.get("accepted") and item.get("type") not in {"match", "match_tap"}:
            errors.append(f"{spec['slug']}:{item.get('id')} missing accepted")
        if item.get("type") in {"match", "match_tap"} and not (item.get("pairs") or item.get("pairs_by_lang")):
            errors.append(f"{spec['slug']}:{item.get('id')} missing pairs")
    if not spec.get("editorial", EDITORIAL).get("license"):
        errors.append(f"{spec['slug']}: missing license")
    return errors


def public_exercises(exercises: list[dict], source_lang: str = "en") -> list[dict]:
    public = []
    for item in exercises:
        clone = {k: v for k, v in item.items() if k not in {"accepted", "pairs", "pairs_by_lang"}}
        if clone.get("prompt"):
            clone["prompt"] = fill_loc(clone["prompt"])
        if clone.get("choices"):
            clone["choices"] = [fill_choice(c) for c in clone["choices"]]
        by_lang = item.get("pairs_by_lang") or {}
        if by_lang:
            pairs = by_lang.get(source_lang) or by_lang.get("en") or {}
            clone["left"] = list(pairs.keys())
            clone["right"] = list(pairs.values())
        public.append(clone)
    return public


def _localize_spec(spec: dict[str, Any]) -> dict[str, Any]:
    out = dict(spec)
    for key in ("title", "objective", "explanation"):
        if isinstance(out.get(key), dict):
            out[key] = fill_loc(out[key])
    out["vocabulary"] = [fill_vocab(v) for v in out.get("vocabulary") or []]
    exercises = []
    for ex in out.get("exercises") or []:
        item = dict(ex)
        if item.get("prompt"):
            item["prompt"] = fill_loc(item["prompt"])
        if item.get("choices"):
            item["choices"] = [fill_choice(c) for c in item["choices"]]
        exercises.append(item)
    out["exercises"] = exercises
    editorial = dict(out.get("editorial") or EDITORIAL)
    editorial.setdefault("l10n_status", dict(L10N_STATUS))
    out["editorial"] = editorial
    return out


def seed(db: Session) -> None:
    from biti.catalog import all_catalog_lessons, build_tree

    for course in COURSES:
        row = db.get(Course, course["id"])
        if row is None:
            db.add(Course(id=course["id"], source=course["source"], target=course["target"], title=course["title"], pair=course["pair"]))
        else:
            row.title = course["title"]
            row.pair = course["pair"]
    for unit in build_tree():
        row = db.get(Unit, unit["id"])
        payload = {"title": unit["title"], "level": unit["level"], "track_id": unit["track"], "sort": 0, "skills": unit["skills"]}
        if row is None:
            db.add(Unit(id=unit["id"], **payload))
        else:
            for key, value in payload.items():
                setattr(row, key, value)
    for tid, sort, title in TRACKS:
        row = db.get(Track, tid)
        if row is None:
            db.add(Track(id=tid, title=title, status="published" if sort <= 8 else "planned", sort=sort))
        else:
            row.title = title
            row.sort = sort
    db.flush()
    specs = [_localize_spec(s) for s in all_lesson_specs()]
    problems = [e for spec in specs for e in validate_lesson(spec)]
    if problems:
        raise RuntimeError("seed invalid: " + "; ".join(problems))
    published_slugs = {s["slug"] for s in specs}
    catalog_by_slug = {row["slug"]: row for row in all_catalog_lessons()}
    for spec in specs:
        meta = catalog_by_slug.get(spec["slug"], {})
        lesson = db.query(Lesson).filter(Lesson.slug == spec["slug"]).one_or_none()
        if lesson is None:
            lesson = Lesson(
                id=new_id(),
                slug=spec["slug"],
                track_id=spec["track"],
                kind=spec.get("kind", "lesson"),
                level=spec["level"],
                cefr=spec.get("cefr", "pre-A1"),
                prerequisites=spec.get("prerequisites") or [],
                status="published",
                sort=spec.get("sort", meta.get("sort") or 0),
                unit_id=spec.get("unit_id") or meta.get("unit_id"),
                skill_id=spec.get("skill_id") or meta.get("skill_id"),
            )
            db.add(lesson)
            db.flush()
        else:
            lesson.prerequisites = spec.get("prerequisites") or []
            lesson.status = "published"
            lesson.unit_id = spec.get("unit_id") or meta.get("unit_id") or lesson.unit_id
            lesson.skill_id = spec.get("skill_id") or meta.get("skill_id") or lesson.skill_id
        version = (
            db.query(LessonVersion)
            .filter(LessonVersion.lesson_id == lesson.id, LessonVersion.version == 1)
            .one_or_none()
        )
        payload = {
            "title": spec["title"],
            "objective": spec["objective"],
            "explanation": spec["explanation"],
            "vocabulary": spec.get("vocabulary") or [],
            "exercises": spec["exercises"],
            "threshold": 0.8,
            "editorial": {**EDITORIAL, **spec.get("editorial", {})},
            "license": "proprietary",
            "status": "published",
            "published_at": utcnow(),
        }
        if version is None:
            version = LessonVersion(id=new_id(), lesson_id=lesson.id, version=1, **payload)
            db.add(version)
            db.flush()
        else:
            for key, value in payload.items():
                setattr(version, key, value)
        existing = db.query(PublishedChunk).filter(PublishedChunk.lesson_version_id == version.id).all()
        if not existing:
            text = " ".join(
                [
                    spec["title"]["en"],
                    spec["objective"]["en"],
                    spec["explanation"]["en"],
                    " ".join(v.get("lemma", "") for v in spec.get("vocabulary") or []),
                ]
            )
            db.add(
                PublishedChunk(
                    lesson_version_id=version.id,
                    lesson_id=lesson.id,
                    section="body",
                    text=text,
                )
            )
    for row in all_catalog_lessons():
        if row["slug"] in published_slugs:
            continue
        lesson = db.query(Lesson).filter(Lesson.slug == row["slug"]).one_or_none()
        if lesson is None:
            db.add(
                Lesson(
                    id=new_id(),
                    slug=row["slug"],
                    track_id=row.get("track") or "vocabulary",
                    kind=row.get("kind", "lesson"),
                    level=row.get("level") or "starter",
                    cefr="planned",
                    prerequisites=row.get("prerequisites") or [],
                    status="planned",
                    sort=row.get("sort") or 0,
                    unit_id=row.get("unit_id"),
                    skill_id=row.get("skill_id"),
                )
            )
        else:
            lesson.status = "planned"
            lesson.unit_id = row.get("unit_id") or lesson.unit_id
    editor = db.query(User).filter(User.email == "demo-editor@biti.local").one_or_none()
    if editor is None:
        db.add(
            User(
                email="demo-editor@biti.local",
                display_name="Native editor",
                role="editor",
                ui_language="en",
            )
        )
    db.commit()

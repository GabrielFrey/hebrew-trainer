"""Real uk/es/fr drafts for published English strings. Status: in_review (not silently approved)."""

from __future__ import annotations

from typing import Any

# English lemma/prompt → Ukrainian, Spanish, French. Do not copy Russian into Ukrainian.
DRAFTS: dict[str, dict[str, str]] = {
    "Alef": {"uk": "Алеф", "es": "Álef", "fr": "Alef"},
    "Bet": {"uk": "Бет", "es": "Bet", "fr": "Bet"},
    "Gimel": {"uk": "Ґімель", "es": "Guímel", "fr": "Guimel"},
    "Dalet": {"uk": "Далет", "es": "Dálet", "fr": "Dalet"},
    "He": {"uk": "Һе", "es": "He", "fr": "Hé"},
    "Vav": {"uk": "Вав", "es": "Vav", "fr": "Vav"},
    "Zayin": {"uk": "Заїн", "es": "Záyin", "fr": "Zayin"},
    "Het": {"uk": "Хет", "es": "Jet", "fr": "Heth"},
    "Tet": {"uk": "Тет", "es": "Tet", "fr": "Tet"},
    "Yod": {"uk": "Йод", "es": "Yod", "fr": "Yod"},
    "Kaf": {"uk": "Каф", "es": "Kaf", "fr": "Kaf"},
    "Lamed": {"uk": "Ламед", "es": "Lámed", "fr": "Lamed"},
    "Mem": {"uk": "Мем", "es": "Mem", "fr": "Mem"},
    "Nun": {"uk": "Нун", "es": "Nun", "fr": "Noun"},
    "Samekh": {"uk": "Самех", "es": "Sámej", "fr": "Samekh"},
    "Ayin": {"uk": "Аїн", "es": "Áyin", "fr": "Ayin"},
    "Pe": {"uk": "Пе", "es": "Pe", "fr": "Pé"},
    "Tsadi": {"uk": "Цаді", "es": "Tsadi", "fr": "Tsadé"},
    "Qof": {"uk": "Коф", "es": "Qof", "fr": "Qof"},
    "Resh": {"uk": "Реш", "es": "Resh", "fr": "Resh"},
    "Shin / Sin": {"uk": "Шин / Сін", "es": "Shin / Sin", "fr": "Shin / Sin"},
    "Tav": {"uk": "Тав", "es": "Tav", "fr": "Tav"},
    "hello": {"uk": "привіт", "es": "hola", "fr": "bonjour"},
    "hi": {"uk": "привіт", "es": "hola", "fr": "salut"},
    "thank you": {"uk": "дякую", "es": "gracias", "fr": "merci"},
    "please": {"uk": "будь ласка", "es": "por favor", "fr": "s’il vous plaît"},
    "yes": {"uk": "так", "es": "sí", "fr": "oui"},
    "no": {"uk": "ні", "es": "no", "fr": "non"},
    "water": {"uk": "вода", "es": "agua", "fr": "eau"},
    "bread": {"uk": "хліб", "es": "pan", "fr": "pain"},
    "house": {"uk": "дім", "es": "casa", "fr": "maison"},
    "book": {"uk": "книга", "es": "libro", "fr": "livre"},
    "boy": {"uk": "хлопчик", "es": "niño", "fr": "garçon"},
    "girl": {"uk": "дівчинка", "es": "niña", "fr": "fille"},
    "mother": {"uk": "мама", "es": "madre", "fr": "mère"},
    "father": {"uk": "тато", "es": "padre", "fr": "père"},
    "family": {"uk": "сім’я", "es": "familia", "fr": "famille"},
    "dog": {"uk": "собака", "es": "perro", "fr": "chien"},
    "I": {"uk": "я", "es": "yo", "fr": "je"},
    "you": {"uk": "ти", "es": "tú", "fr": "tu"},
    "masculine": {"uk": "чоловічий рід", "es": "masculino", "fr": "masculin"},
    "feminine": {"uk": "жіночий рід", "es": "femenino", "fr": "féminin"},
    "right to left": {"uk": "справа наліво", "es": "de derecha a izquierda", "fr": "de droite à gauche"},
    "left to right": {"uk": "зліва направо", "es": "de izquierda a derecha", "fr": "de gauche à droite"},
    "Type hello": {"uk": "Наберіть «привіт»", "es": "Escribe «hola»", "fr": "Tapez « bonjour »"},
    "Type thank you": {"uk": "Наберіть «дякую»", "es": "Escribe «gracias»", "fr": "Tapez « merci »"},
    "Type alef": {"uk": "Наберіть алеф", "es": "Escribe álef", "fr": "Tapez alef"},
    "Hebrew is written…": {"uk": "Іврит пишуть…", "es": "El hebreo se escribe…", "fr": "L’hébreu s’écrit…"},
    "Final mem is…": {"uk": "Кінцева мем —", "es": "La mem final es…", "fr": "Le mem final est…"},
    "Letters Alef–He": {"uk": "Літери алеф–һе", "es": "Letras álef–he", "fr": "Lettres alef–hé"},
    "Letters Vav–Lamed": {"uk": "Літери вав–ламед", "es": "Letras vav–lámed", "fr": "Lettres vav–lamed"},
    "Letters Mem–Tav": {"uk": "Літери мем–тав", "es": "Letras mem–tav", "fr": "Lettres mem–tav"},
    "Final letters": {"uk": "Кінцеві літери", "es": "Letras finales", "fr": "Lettres finales"},
    "Lookalike letters": {"uk": "Схожі літери", "es": "Letras parecidas", "fr": "Lettres ressemblantes"},
    "Dagesh and cursive": {"uk": "Дагеш і рукопис", "es": "Dagesh y cursiva", "fr": "Dagesh et cursive"},
    "Gender of nouns": {"uk": "Рід іменників", "es": "Género de los nombres", "fr": "Genre des noms"},
    "The definite article": {"uk": "Означений артикль", "es": "El artículo definido", "fr": "L’article défini"},
    "Starter checkpoint": {"uk": "Контроль старту", "es": "Control de inicio", "fr": "Palier de départ"},
    "Beginner checkpoint": {"uk": "Контроль алеф", "es": "Control álef", "fr": "Palier aleph"},
    "Which letter is Alef?": {"uk": "Яка літера — алеф?", "es": "¿Cuál es álef?", "fr": "Quelle lettre est alef ?"},
    "Which letter is Bet?": {"uk": "Яка літера — бет?", "es": "¿Cuál es bet?", "fr": "Quelle lettre est bet ?"},
    "Which letter is Gimel?": {"uk": "Яка літера — ґімель?", "es": "¿Cuál es guímel?", "fr": "Quelle lettre est guimel ?"},
    "Which letter is Dalet?": {"uk": "Яка літера — далет?", "es": "¿Cuál es dálet?", "fr": "Quelle lettre est dalet ?"},
    "Which letter is He?": {"uk": "Яка літера — һе?", "es": "¿Cuál es he?", "fr": "Quelle lettre est hé ?"},
    "Type Alef (ʾalef)": {"uk": "Наберіть алеф", "es": "Escribe álef", "fr": "Tapez alef"},
    "Type Bet (bet)": {"uk": "Наберіть бет", "es": "Escribe bet", "fr": "Tapez bet"},
    "Type Gimel (gimel)": {"uk": "Наберіть ґімель", "es": "Escribe guímel", "fr": "Tapez guimel"},
    "Type Dalet (dalet)": {"uk": "Наберіть далет", "es": "Escribe dálet", "fr": "Tapez dalet"},
    "Type He (he)": {"uk": "Наберіть һе", "es": "Escribe he", "fr": "Tapez hé"},
    "Match letter and name": {"uk": "Поєднайте літеру й назву", "es": "Une letra y nombre", "fr": "Associez lettre et nom"},
    "Say the first letter aloud": {"uk": "Промовте першу літеру", "es": "Di la primera letra", "fr": "Dites la première lettre"},
    "Print Hebrew is written right to left. Each letter has a name. Niqqud is shown for orientation and is not graded here.": {
        "uk": "Друкований іврит пишеться справа наліво. У кожної літери є назва. Ніккуд тут лише для орієнтиру і не перевіряється.",
        "es": "El hebreo impreso se escribe de derecha a izquierda. Cada letra tiene nombre. El niqqud orienta y no se evalúa aquí.",
        "fr": "L’hébreu imprimé s’écrit de droite à gauche. Chaque lettre a un nom. Le niqqud oriente et n’est pas noté ici.",
    },
    "Recognize and type א–ה.": {
        "uk": "Упізнати й набрати א–ה.",
        "es": "Reconocer y escribir א–ה.",
        "fr": "Reconnaître et taper א–ה.",
    },
}


def fill_loc(record: dict[str, Any] | None) -> dict[str, str]:
    if not record:
        return {"en": "", "ru": "", "he": "", "uk": "", "es": "", "fr": ""}
    en = str(record.get("en") or "")
    draft = DRAFTS.get(en, {})
    out = {
        "en": en,
        "ru": str(record.get("ru") or ""),
        "he": str(record.get("he") or ""),
        "uk": str(record.get("uk") or draft.get("uk") or ""),
        "es": str(record.get("es") or draft.get("es") or ""),
        "fr": str(record.get("fr") or draft.get("fr") or ""),
    }
    return out


def fill_choice(choice: dict[str, Any]) -> dict[str, Any]:
    clone = dict(choice)
    en = str(clone.get("en") or "")
    draft = DRAFTS.get(en, {})
    for lang in ("uk", "es", "fr"):
        if not clone.get(lang) and draft.get(lang):
            clone[lang] = draft[lang]
    return clone


def fill_vocab(item: dict[str, Any]) -> dict[str, Any]:
    clone = dict(item)
    en = str(clone.get("en") or "")
    draft = DRAFTS.get(en, {})
    for lang in ("uk", "es", "fr"):
        if not clone.get(lang) and draft.get(lang):
            clone[lang] = draft[lang]
    clone["l10n_status"] = {
        "en": "approved",
        "ru": "approved",
        "he": "approved",
        "uk": "in_review" if clone.get("uk") else "missing",
        "es": "in_review" if clone.get("es") else "missing",
        "fr": "in_review" if clone.get("fr") else "missing",
    }
    return clone


def accepted_for(exercise: dict[str, Any], source: str) -> list[str]:
    raw = exercise.get("accepted")
    if isinstance(raw, dict):
        values = raw.get(source) or raw.get("he") or raw.get("en") or []
        return [str(v) for v in values]
    if isinstance(raw, list):
        return [str(v) for v in raw]
    return []


def pairs_for(exercise: dict[str, Any], source: str) -> dict[str, str]:
    by_lang = exercise.get("pairs_by_lang")
    if isinstance(by_lang, dict) and source in by_lang:
        return {str(k): str(v) for k, v in by_lang[source].items()}
    raw = exercise.get("pairs") or {}
    return {str(k): str(v) for k, v in raw.items()}

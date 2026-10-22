"""Real uk/es/fr drafts for published English strings. Status: in_review (not silently approved)."""

from __future__ import annotations

import re
from typing import Any

# English lemma/prompt → Ukrainian, Spanish, French. Do not copy Russian into Ukrainian.
# These are authored drafts. Editorial l10n_status stays in_review until a native reviewer signs off.
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
    "alef": {"uk": "алеф", "es": "álef", "fr": "alef"},
    "lamed": {"uk": "ламед", "es": "lámed", "fr": "lamed"},
    "shin": {"uk": "шин", "es": "shin", "fr": "shin"},
    "kaf sofit": {"uk": "каф софіт", "es": "kaf sofit", "fr": "kaf sofit"},
    "mem sofit": {"uk": "мем софіт", "es": "mem sofit", "fr": "mem sofit"},
    "nun sofit": {"uk": "нун софіт", "es": "nun sofit", "fr": "noun sofit"},
    "pe sofit": {"uk": "пе софіт", "es": "pe sofit", "fr": "pé sofit"},
    "tsadi sofit": {"uk": "цаді софіт", "es": "tsadi sofit", "fr": "tsadé sofit"},
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
    "mum": {"uk": "мама", "es": "mamá", "fr": "maman"},
    "mom": {"uk": "мама", "es": "mamá", "fr": "maman"},
    "dad": {"uk": "тато", "es": "papá", "fr": "papa"},
    "family": {"uk": "сім’я", "es": "familia", "fr": "famille"},
    "brother": {"uk": "брат", "es": "hermano", "fr": "frère"},
    "sister": {"uk": "сестра", "es": "hermana", "fr": "sœur"},
    "dog": {"uk": "собака", "es": "perro", "fr": "chien"},
    "I": {"uk": "я", "es": "yo", "fr": "je"},
    "you": {"uk": "ти", "es": "tú", "fr": "tu"},
    "he": {"uk": "він", "es": "él", "fr": "il"},
    "she": {"uk": "вона", "es": "ella", "fr": "elle"},
    "you (m)": {"uk": "ти (чол.)", "es": "tú (m.)", "fr": "tu (m.)"},
    "you (f)": {"uk": "ти (жін.)", "es": "tú (f.)", "fr": "tu (f.)"},
    "masculine": {"uk": "чоловічий рід", "es": "masculino", "fr": "masculin"},
    "feminine": {"uk": "жіночий рід", "es": "femenino", "fr": "féminin"},
    "right to left": {"uk": "справа наліво", "es": "de derecha a izquierda", "fr": "de droite à gauche"},
    "left to right": {"uk": "зліва направо", "es": "de izquierda a derecha", "fr": "de gauche à droite"},
    "notebook": {"uk": "зошит", "es": "cuaderno", "fr": "cahier"},
    "the book": {"uk": "книга (означена)", "es": "el libro", "fr": "le livre"},
    "the house": {"uk": "дім (означений)", "es": "la casa", "fr": "la maison"},
    "the girl": {"uk": "дівчинка (означена)", "es": "la niña", "fr": "la fille"},
    "the boy": {"uk": "хлопчик (означений)", "es": "el niño", "fr": "le garçon"},
    "the dog": {"uk": "собака (означена)", "es": "el perro", "fr": "le chien"},
    "big": {"uk": "великий", "es": "grande", "fr": "grand"},
    "big (f)": {"uk": "велика", "es": "grande (f.)", "fr": "grande"},
    "a big boy": {"uk": "великий хлопчик", "es": "un niño grande", "fr": "un grand garçon"},
    "a big girl": {"uk": "велика дівчинка", "es": "una niña grande", "fr": "une grande fille"},
    "the big book (הספר הגדול)": {"uk": "велика книга (הספר הגדול)", "es": "el libro grande (הספר הגדול)", "fr": "le grand livre (הספר הגדול)"},
    "handwritten cursive": {"uk": "рукописний курсив", "es": "cursiva manuscrita", "fr": "cursive manuscrite"},
    "square print only": {"uk": "лише друкований квадратний шрифт", "es": "solo letra cuadrada impresa", "fr": "seulement l’écriture carrée"},
    "bet with dagesh": {"uk": "бет із дагешем", "es": "bet con dagesh", "fr": "bet avec dagesh"},
    "plural only": {"uk": "лише множина", "es": "solo plural", "fr": "pluriel seulement"},
    "a prefix ה־": {"uk": "префікс ה־", "es": "un prefijo ה־", "fr": "un préfixe ה־"},
    "a separate word": {"uk": "окреме слово", "es": "una palabra aparte", "fr": "un mot séparé"},
    "also takes ה־": {"uk": "теж бере ה־", "es": "también lleva ה־", "fr": "prend aussi ה־"},
    "never takes ה־": {"uk": "ніколи не бере ה־", "es": "nunca lleva ה־", "fr": "ne prend jamais ה־"},
    "boy is after big": {"uk": "хлопчик стоїть після «великий»", "es": "el niño va después de grande", "fr": "garçon vient après grand"},
    "ha": {"uk": "га", "es": "ha", "fr": "ha"},
    "e": {"uk": "е", "es": "e", "fr": "e"},
    "3 letters": {"uk": "3 літери", "es": "3 letras", "fr": "3 lettres"},
    "1 letter": {"uk": "1 літера", "es": "1 letra", "fr": "1 lettre"},
    "he wrote": {"uk": "він написав", "es": "él escribió", "fr": "il a écrit"},
    "letter": {"uk": "лист", "es": "carta", "fr": "lettre"},
    "letter (mail)": {"uk": "лист (пошта)", "es": "carta (correo)", "fr": "lettre (courrier)"},
    "the root letters כתב": {"uk": "літери кореня כתב", "es": "las letras de la raíz כתב", "fr": "les lettres de la racine כתב"},
    "Pa'al / Qal": {"uk": "Пааль / Каль", "es": "Pa'al / Qal", "fr": "Pa'al / Qal"},
    "Pi'el": {"uk": "Піель", "es": "Pi'el", "fr": "Pi'el"},
    "Hif'il": {"uk": "Гіфіль", "es": "Hif'il", "fr": "Hif'il"},
    "writes (m)": {"uk": "пише (чол.)", "es": "escribe (m.)", "fr": "écrit (m.)"},
    "writes (f)": {"uk": "пише (жін.)", "es": "escribe (f.)", "fr": "écrit (f.)"},
    "I write (m)": {"uk": "я пишу (чол.)", "es": "yo escribo (m.)", "fr": "j’écris (m.)"},
    "hello / peace": {"uk": "привіт / мир", "es": "hola / paz", "fr": "bonjour / paix"},
    "good morning": {"uk": "доброго ранку", "es": "buenos días", "fr": "bonjour (matin)"},
    "good evening": {"uk": "доброго вечора", "es": "buenas tardes/noches", "fr": "bonsoir"},
    "please / you're welcome": {"uk": "будь ласка / нема за що", "es": "por favor / de nada", "fr": "s’il vous plaît / de rien"},
    "Greetings": {"uk": "Вітання", "es": "Saludos", "fr": "Salutations"},
    "Family": {"uk": "Сім’я", "es": "Familia", "fr": "Famille"},
    "At the shuk": {"uk": "На ринку", "es": "En el shuk", "fr": "Au shouk"},
    "greetings": {"uk": "вітання", "es": "saludos", "fr": "salutations"},
    "at the shuk": {"uk": "на ринку", "es": "en el shuk", "fr": "au shouk"},
    "market": {"uk": "ринок", "es": "mercado", "fr": "marché"},
    "tomato": {"uk": "помідор", "es": "tomate", "fr": "tomate"},
    "cucumber": {"uk": "огірок", "es": "pepino", "fr": "concombre"},
    "how much is it": {"uk": "скільки це коштує", "es": "cuánto cuesta", "fr": "combien ça coûte"},
    "shekel": {"uk": "шекель", "es": "séquel", "fr": "shekel"},
    "Numbers 1–10": {"uk": "Числа 1–10", "es": "Números 1–10", "fr": "Nombres 1–10"},
    "numbers 1–10": {"uk": "числа 1–10", "es": "números 1–10", "fr": "nombres 1–10"},
    "one (f)": {"uk": "одна", "es": "una", "fr": "une"},
    "two (f)": {"uk": "дві", "es": "dos", "fr": "deux"},
    "three (f)": {"uk": "три", "es": "tres", "fr": "trois"},
    "four (f)": {"uk": "чотири", "es": "cuatro", "fr": "quatre"},
    "five (f)": {"uk": "п’ять", "es": "cinco", "fr": "cinq"},
    "ten (f)": {"uk": "десять", "es": "diez", "fr": "dix"},
    "Colors": {"uk": "Кольори", "es": "Colores", "fr": "Couleurs"},
    "colors": {"uk": "кольори", "es": "colores", "fr": "couleurs"},
    "red": {"uk": "червоний", "es": "rojo", "fr": "rouge"},
    "blue": {"uk": "синій", "es": "azul", "fr": "bleu"},
    "green": {"uk": "зелений", "es": "verde", "fr": "vert"},
    "yellow": {"uk": "жовтий", "es": "amarillo", "fr": "jaune"},
    "white": {"uk": "білий", "es": "blanco", "fr": "blanc"},
    "black": {"uk": "чорний", "es": "negro", "fr": "noir"},
    "At home": {"uk": "Вдома", "es": "En casa", "fr": "À la maison"},
    "at home": {"uk": "вдома", "es": "en casa", "fr": "à la maison"},
    "house / home": {"uk": "дім / оселя", "es": "casa / hogar", "fr": "maison / foyer"},
    "room": {"uk": "кімната", "es": "habitación", "fr": "pièce"},
    "kitchen": {"uk": "кухня", "es": "cocina", "fr": "cuisine"},
    "table": {"uk": "стіл", "es": "mesa", "fr": "table"},
    "chair": {"uk": "стілець", "es": "silla", "fr": "chaise"},
    "Introductions": {"uk": "Знайомство", "es": "Presentaciones", "fr": "Présentations"},
    "introductions": {"uk": "знайомство", "es": "presentaciones", "fr": "présentations"},
    "hello, what is your name (m)": {"uk": "привіт, як тебе звати (чол.)", "es": "hola, ¿cómo te llamas? (m.)", "fr": "bonjour, comment t’appelles-tu ? (m.)"},
    "goodbye": {"uk": "бувай", "es": "adiós", "fr": "au revoir"},
    "my name is": {"uk": "мене звати", "es": "me llamo", "fr": "je m’appelle"},
    "nice to meet you": {"uk": "приємно познайомитися", "es": "encantado/a", "fr": "enchanté"},
    "I am from Russia": {"uk": "я з Росії", "es": "soy de Rusia", "fr": "je viens de Russie"},
    "I live in Tel Aviv (m)": {"uk": "я живу в Тель-Авіві (чол.)", "es": "vivo en Tel Aviv (m.)", "fr": "j’habite à Tel-Aviv (m.)"},
    "Buying at the shuk": {"uk": "Покупка на ринку", "es": "Compras en el shuk", "fr": "Achats au shouk"},
    "buying at the shuk": {"uk": "покупка на ринку", "es": "compras en el shuk", "fr": "achats au shouk"},
    "do you have tomatoes": {"uk": "чи є в тебе помідори", "es": "¿tienes tomates?", "fr": "as-tu des tomates"},
    "can I have a kilo": {"uk": "можна кіло", "es": "¿puedo un kilo?", "fr": "je peux prendre un kilo"},
    "thank you very much": {"uk": "дуже дякую", "es": "muchas gracias", "fr": "merci beaucoup"},
    "Transport": {"uk": "Транспорт", "es": "Transporte", "fr": "Transports"},
    "transport": {"uk": "транспорт", "es": "transporte", "fr": "transports"},
    "where is the stop": {"uk": "де зупинка", "es": "dónde está la parada", "fr": "où est l’arrêt"},
    "bus": {"uk": "автобус", "es": "autobús", "fr": "bus"},
    "train": {"uk": "поїзд", "es": "tren", "fr": "train"},
    "ticket": {"uk": "квиток", "es": "billete", "fr": "billet"},
    "when is the next bus": {"uk": "коли наступний автобус", "es": "cuándo es el próximo autobús", "fr": "quand est le prochain bus"},
    "At the café": {"uk": "У кафе", "es": "En el café", "fr": "Au café"},
    "at the café": {"uk": "у кафе", "es": "en el café", "fr": "au café"},
    "can I have a coffee": {"uk": "можна каву", "es": "¿puedo un café?", "fr": "je peux prendre un café"},
    "tea": {"uk": "чай", "es": "té", "fr": "thé"},
    "the bill": {"uk": "рахунок", "es": "la cuenta", "fr": "l’addition"},
    "without sugar": {"uk": "без цукру", "es": "sin azúcar", "fr": "sans sucre"},
    "On the phone": {"uk": "По телефону", "es": "Por teléfono", "fr": "Au téléphone"},
    "on the phone": {"uk": "по телефону", "es": "por teléfono", "fr": "au téléphone"},
    "hello (phone)": {"uk": "алло", "es": "¿diga?", "fr": "allô"},
    "who is speaking": {"uk": "хто говорить", "es": "quién habla", "fr": "qui est à l’appareil"},
    "may I speak with": {"uk": "можна з … поговорити", "es": "¿puedo hablar con…?", "fr": "puis-je parler avec"},
    "I will call later": {"uk": "я зателефоную пізніше", "es": "llamaré más tarde", "fr": "je rappellerai plus tard"},
    "Asking for help": {"uk": "Прохання про допомогу", "es": "Pedir ayuda", "fr": "Demander de l’aide"},
    "asking for help": {"uk": "прохання про допомогу", "es": "pedir ayuda", "fr": "demander de l’aide"},
    "I need help (m)": {"uk": "мені потрібна допомога (чол.)", "es": "necesito ayuda (m.)", "fr": "j’ai besoin d’aide (m.)"},
    "police": {"uk": "поліція", "es": "policía", "fr": "police"},
    "ambulance": {"uk": "швидка", "es": "ambulancia", "fr": "ambulance"},
    "I am lost": {"uk": "я заблукав", "es": "estoy perdido", "fr": "je suis perdu"},
    "I don't feel well (m)": {"uk": "мені погано (чол.)", "es": "no me siento bien (m.)", "fr": "je ne me sens pas bien (m.)"},
    "what is your name (m, unpointed מה שמך)": {
        "uk": "як тебе звати (чол., без ніккуду מה שמך)",
        "es": "cómo te llamas (m., sin niqqud מה שמך)",
        "fr": "comment t’appelles-tu (m., sans niqqud מה שמך)",
    },
    "I (only)": {"uk": "я (лише)", "es": "yo (solo)", "fr": "je (seulement)"},
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
    "Recognize and type ו–ל.": {
        "uk": "Упізнати й набрати ו–ל.",
        "es": "Reconocer y escribir ו–ל.",
        "fr": "Reconnaître et taper ו–ל.",
    },
    "Recognize and type מ–ת.": {
        "uk": "Упізнати й набрати מ–ת.",
        "es": "Reconocer y escribir מ–ת.",
        "fr": "Reconnaître et taper מ–ת.",
    },
    "Use ךםןףץ at the end of a word.": {
        "uk": "Уживайте ךםןףץ на кінці слова.",
        "es": "Usa ךםןףץ al final de la palabra.",
        "fr": "Employez ךםןףץ en fin de mot.",
    },
    "Five letters change shape at the end of a word. Grading is strict: a non-final form is not accepted.": {
        "uk": "П’ять літер змінюють форму в кінці слова. Перевірка сувора: некінцеву форму не приймають.",
        "es": "Cinco letras cambian de forma al final de la palabra. La corrección es estricta: no se acepta la forma no final.",
        "fr": "Cinq lettres changent de forme en fin de mot. La notation est stricte : la forme non finale est refusée.",
    },
    "Tell ב/כ, ד/ר, ה/ח/ת apart.": {
        "uk": "Розрізняйте ב/כ, ד/ר, ה/ח/ת.",
        "es": "Distingue ב/כ, ד/ר, ה/ח/ת.",
        "fr": "Distinguez ב/כ, ד/ר, ה/ח/ת.",
    },
    "Bet has a base; kaf is open at the bottom. Dalet has an ear to the right; resh is rounded.": {
        "uk": "У бет є «днище»; каф знизу відкрита. У далет є «вушко» праворуч; реш заокруглена.",
        "es": "Bet tiene base; kaf está abierta abajo. Dálet tiene una oreja a la derecha; resh es redondeada.",
        "fr": "Le bet a une base ; le kaf est ouvert en bas. Le dalet a une oreille à droite ; le resh est arrondi.",
    },
    "Spot dagesh and know print vs cursive exist.": {
        "uk": "Помітити дагеш і знати, що є друк і рукопис.",
        "es": "Detectar el dagesh y saber que existen letra impresa y cursiva.",
        "fr": "Repérer le dagesh et savoir qu’il existe imprimé et cursive.",
    },
    "A dagesh is a dot in a letter. Tracing uses a canvas; cursive font is not vendored yet so strokes are labeled print-first.": {
        "uk": "Дагеш — крапка в літері. Обведення на полотні; рукописний шрифт ще не підключено, тож штрихи позначені як друковані.",
        "es": "El dagesh es un punto en la letra. El trazo usa un lienzo; la fuente cursiva aún no está incluida, así que las marcas son de imprenta.",
        "fr": "Un dagesh est un point dans la lettre. Le tracé utilise un canevas ; la police cursive n’est pas encore fournie, les traits sont donc marqués comme imprimés.",
    },
    "Classify common nouns as masculine or feminine.": {
        "uk": "Визначати рід поширених іменників.",
        "es": "Clasificar nombres comunes como masculinos o femeninos.",
        "fr": "Classer des noms courants au masculin ou au féminin.",
    },
    "Most feminine nouns end in ה or ת. סֵפֶר is masculine; מִחְבָּרָה is feminine.": {
        "uk": "Більшість жіночих іменників закінчуються на ה або ת. סֵפֶר — чоловічий рід; מִחְבָּרָה — жіночий.",
        "es": "La mayoría de los femeninos terminan en ה o ת. סֵפֶר es masculino; מִחְבָּרָה es femenino.",
        "fr": "La plupart des féminins se terminent par ה ou ת. סֵפֶר est masculin ; מִחְבָּרָה est féminin.",
    },
    "Add ה־ to make a noun definite.": {
        "uk": "Додати ה־, щоб зробити іменник означеним.",
        "es": "Añade ה־ para definir el nombre.",
        "fr": "Ajoutez ה־ pour rendre le nom défini.",
    },
    "Hebrew attaches הַ to the noun: סֵפֶר → הַסֵּפֶר. There is no separate word for 'the'.": {
        "uk": "Іврит приєднує הַ до іменника: סֵפֶר → הַסֵּפֶר. Окремого слова «the» немає.",
        "es": "El hebreo une הַ al nombre: סֵפֶר → הַסֵּפֶר. No hay una palabra aparte para «the».",
        "fr": "L’hébreu attache הַ au nom : סֵפֶר → הַסֵּפֶר. Il n’y a pas de mot séparé pour « the ».",
    },
    "Adjective agreement": {"uk": "Узгодження прикметника", "es": "Concordancia del adjetivo", "fr": "Accord de l’adjectif"},
    "Make adjectives agree in gender and number.": {
        "uk": "Узгоджувати прикметники за родом і числом.",
        "es": "Haz que el adjetivo concuerde en género y número.",
        "fr": "Accordez l’adjectif en genre et en nombre.",
    },
    "The adjective follows the noun and copies gender/number: יֶלֶד גָּדוֹל, יַלְדָּה גְּדוֹלָה.": {
        "uk": "Прикметник стоїть після іменника і копіює рід/число: יֶלֶד גָּדוֹל, יַלְדָּה גְּדוֹלָה.",
        "es": "El adjetivo va detrás del nombre y copia género/número: יֶלֶד גָּדוֹל, יַלְדָּה גְּדוֹלָה.",
        "fr": "L’adjectif suit le nom et reprend le genre/nombre : יֶלֶד גָּדוֹל, יַלְדָּה גְּדוֹלָה.",
    },
    "Subject pronouns": {"uk": "Особові займенники", "es": "Pronombres personales", "fr": "Pronoms personnels"},
    "Use אני אתה את הוא היא.": {
        "uk": "Уживайте אני אתה את הוא היא.",
        "es": "Usa אני אתה את הוא היא.",
        "fr": "Employez אני אתה את הוא היא.",
    },
    "אני I, אַתָּה you m., אַתְּ you f., הוּא he, הִיא she. Present-tense verbs still show gender.": {
        "uk": "אני — я, אַתָּה — ти (чол.), אַתְּ — ти (жін.), הוּא — він, הִיא — вона. Дієслово теперішнього часу все одно показує рід.",
        "es": "אני yo, אַתָּה tú m., אַתְּ tú f., הוּא él, הִיא ella. El presente sigue marcando el género.",
        "fr": "אני je, אַתָּה tu m., אַתְּ tu f., הוּא il, הִיא elle. Le présent marque encore le genre.",
    },
    "The shoresh": {"uk": "Шореш (корінь)", "es": "El shoresh", "fr": "Le shoresh"},
    "Identify a three-letter root in related words.": {
        "uk": "Упізнати трилітерний корінь у споріднених словах.",
        "es": "Identificar una raíz de tres letras en palabras emparentadas.",
        "fr": "Repérer une racine de trois lettres dans des mots apparentés.",
    },
    "Hebrew words are built on a shoresh. כ־ת־ב appears in כתב, מכתב, לכתוב.": {
        "uk": "Івритські слова будуються на шореші. כ־ת־ב є в כתב, מכתב, לכתוב.",
        "es": "Las palabras hebreas se construyen sobre un shoresh. כ־ת־ב aparece en כתב, מכתב, לכתוב.",
        "fr": "Les mots hébreux reposent sur un shoresh. כ־ת־ב apparaît dans כתב, מכתב, לכתוב.",
    },
    "Pa'al present": {"uk": "Пааль, теперішній час", "es": "Presente de pa'al", "fr": "Présent du pa'al"},
    "Conjugate כותב / כותבת / כותבים / כותבות.": {
        "uk": "Відмінюйте כותב / כותבת / כותבים / כותבות.",
        "es": "Conjuga כותב / כותבת / כותבים / כותבות.",
        "fr": "Conjuguez כותב / כותבת / כותבים / כותבות.",
    },
    "Pa'al (קל) present uses a participle: כּוֹתֵב, כּוֹתֶבֶת, כּוֹתְבִים, כּוֹתְבוֹת.": {
        "uk": "Пааль (קל) у теперішньому — дієприкметник: כּוֹתֵב, כּוֹתֶבֶת, כּוֹתְבִים, כּוֹתְבוֹת.",
        "es": "El presente de pa'al (קל) usa un participio: כּוֹתֵב, כּוֹתֶבֶת, כּוֹתְבִים, כּוֹתְבוֹת.",
        "fr": "Le présent du pa'al (קל) utilise un participe : כּוֹתֵב, כּוֹתֶבֶת, כּוֹתְבִים, כּוֹתְבוֹת.",
    },
    "Say the Hebrew aloud. Transliteration is a hint, not the answer.": {
        "uk": "Промовте іврит уголос. Транскрипція — підказка, не відповідь.",
        "es": "Di el hebreo en voz alta. La transcripción es una pista, no la respuesta.",
        "fr": "Dites l’hébreu à voix haute. La transcription est un indice, pas la réponse.",
    },
    "Ulpan style: learn a whole useful line, then the pieces. Listening is optional while TTS is unavailable.": {
        "uk": "Як в ульпані: спочатку ціла корисна фраза, потім частини. Аудіювання не обов’язкове, поки немає TTS.",
        "es": "Estilo ulpán: primero una frase útil entera, luego las piezas. Escuchar es opcional mientras no hay TTS.",
        "fr": "Style oulpan : d’abord une phrase utile entière, puis les morceaux. L’écoute est facultative tant que le TTS manque.",
    },
    "Read letters and say hello.": {
        "uk": "Прочитати літери й привітатися.",
        "es": "Leer letras y saludar.",
        "fr": "Lire des lettres et dire bonjour.",
    },
    "A short check before Aleph work.": {
        "uk": "Коротка перевірка перед рівнем алеф.",
        "es": "Un control corto antes del trabajo de álef.",
        "fr": "Un court contrôle avant le travail d’aleph.",
    },
    "Combine script, a verb, and a greeting.": {
        "uk": "Поєднати письмо, дієслово й вітання.",
        "es": "Combinar escritura, un verbo y un saludo.",
        "fr": "Combiner l’écriture, un verbe et une salutation.",
    },
    "Boss node for Aleph.": {"uk": "Контрольний вузол рівня алеф.", "es": "Nodo jefe de álef.", "fr": "Nœud boss d’aleph."},
    "Type the word for peace / hello (plain letters)": {
        "uk": "Наберіть слово «мир / привіт» (звичайні літери)",
        "es": "Escribe la palabra paz / hola (letras simples)",
        "fr": "Tapez le mot paix / bonjour (lettres simples)",
    },
    "Type bet (no niqqud required)": {
        "uk": "Наберіть бет (ніккуд не обов’язковий)",
        "es": "Escribe bet (sin niqqud obligatorio)",
        "fr": "Tapez bet (niqqud non obligatoire)",
    },
    "Trace print Alef (fallback canvas)": {
        "uk": "Обведіть друкований алеф (запасне полотно)",
        "es": "Traza álef impresa (lienzo de reserva)",
        "fr": "Tracez l’alef imprimé (canevas de repli)",
    },
    "Tap the letter you would hear (audio unavailable → skip)": {
        "uk": "Натисніть літеру, яку почули б (немає звуку → пропустіть)",
        "es": "Toca la letra que oirías (sin audio → omitir)",
        "fr": "Touchez la lettre que vous entendriez (pas d’audio → passer)",
    },
    "Say Alef": {"uk": "Промовте алеф", "es": "Di álef", "fr": "Dites alef"},
    "Say the root": {"uk": "Промовте корінь", "es": "Di la raíz", "fr": "Dites la racine"},
    "Which letter has dagesh?": {"uk": "У якій літері є дагеш?", "es": "¿Qué letra tiene dagesh?", "fr": "Quelle lettre a un dagesh ?"},
    "Ktav yad is…": {"uk": "Ктав яд — це…", "es": "Ktav yad es…", "fr": "Le ktav yad est…"},
    "Final kaf is…": {"uk": "Кінцева каф — це…", "es": "La kaf final es…", "fr": "Le kaf final est…"},
    "ספר is…": {"uk": "ספר — це…", "es": "ספר es…", "fr": "ספר est…"},
    "מחברת is…": {"uk": "מחברת — це…", "es": "מחברת es…", "fr": "מחברת est…"},
    "A ת ending often marks…": {"uk": "Закінчення ת часто позначає…", "es": "Una terminación ת suele marcar…", "fr": "Une finale ת marque souvent…"},
    "'The' is…": {"uk": "«The» — це…", "es": "«The» es…", "fr": "« The » est…"},
    "הַ is read roughly…": {"uk": "הַ читається приблизно…", "es": "הַ se lee más o menos…", "fr": "הַ se lit à peu près…"},
    "Feminine of גדול": {"uk": "Жіночий рід від גדול", "es": "Femenino de גדול", "fr": "Féminin de גדול"},
    "ילד גדול means…": {"uk": "ילד גדול означає…", "es": "ילד גדול significa…", "fr": "ילד גדול veut dire…"},
    "When the noun is definite the adjective…": {
        "uk": "Коли іменник означений, прикметник…",
        "es": "Cuando el nombre es definido, el adjetivo…",
        "fr": "Quand le nom est défini, l’adjectif…",
    },
    "Type גדולה": {"uk": "Наберіть גדולה", "es": "Escribe גדולה", "fr": "Tapez גדולה"},
    "אַתָּה is…": {"uk": "אַתָּה — це…", "es": "אַתָּה es…", "fr": "אַתָּה est…"},
    "אַתְּ is…": {"uk": "אַתְּ — це…", "es": "אַתְּ es…", "fr": "אַתְּ est…"},
    "Root of מכתב": {"uk": "Корінь מכתב", "es": "Raíz de מכתב", "fr": "Racine de מכתב"},
    "Root of כותב": {"uk": "Корінь כותב", "es": "Raíz de כותב", "fr": "Racine de כותב"},
    "Which word shares כ־ת־ב?": {"uk": "Яке слово має корінь כ־ת־ב?", "es": "¿Qué palabra comparte כ־ת־ב?", "fr": "Quel mot partage כ־ת־ב ?"},
    "A typical shoresh has…": {"uk": "Типовий шореш має…", "es": "Un shoresh típico tiene…", "fr": "Un shoresh typique a…"},
    "He writes (unpointed)": {"uk": "Він пише (без ніккуду)", "es": "Él escribe (sin niqqud)", "fr": "Il écrit (sans niqqud)"},
    "She writes": {"uk": "Вона пише", "es": "Ella escribe", "fr": "Elle écrit"},
    "They write (m)": {"uk": "Вони пишуть (чол.)", "es": "Ellos escriben", "fr": "Ils écrivent"},
    "They write (f)": {"uk": "Вони пишуть (жін.)", "es": "Ellas escriben", "fr": "Elles écrivent"},
    "Binyan of כותב": {"uk": "Біньян слова כותב", "es": "Binian de כותב", "fr": "Binyan de כותב"},
    "Type the key phrase": {"uk": "Наберіть ключову фразу", "es": "Escribe la frase clave", "fr": "Tapez la phrase clé"},
    "Order the greeting": {"uk": "Розставте вітання", "es": "Ordena el saludo", "fr": "Ordonnez la salutation"},
}


def _lookup(en: str) -> dict[str, str]:
    return DRAFTS.get(en) or {}


def drafts_for(en: str) -> dict[str, str]:
    """Resolve uk/es/fr drafts. Patterns compose from lemmas; never copy Russian."""
    hit = _lookup(en)
    if hit:
        return hit

    def wrap(uk: str, es: str, fr: str, inner: dict[str, str]) -> dict[str, str]:
        return {"uk": uk.format(**inner), "es": es.format(**inner), "fr": fr.format(**inner)}

    m = re.fullmatch(r"Which letter is (.+)\?", en)
    if m and _lookup(m.group(1)):
        return wrap("Яка літера — {uk}?", "¿Cuál es {es}?", "Quelle lettre est {fr} ?", _lookup(m.group(1)))
    m = re.fullmatch(r"Which is (.+)\?", en)
    if m and _lookup(m.group(1)):
        return wrap("Яке з них — {uk}?", "¿Cuál es {es}?", "Lequel est {fr} ?", _lookup(m.group(1)))
    m = re.fullmatch(r"Type (.+) \([^)]+\)", en)
    if m and _lookup(m.group(1)):
        return wrap("Наберіть {uk}", "Escribe {es}", "Tapez {fr}", _lookup(m.group(1)))
    m = re.fullmatch(r"Type: (.+)", en)
    if m and _lookup(m.group(1)):
        return wrap("Наберіть: {uk}", "Escribe: {es}", "Tapez : {fr}", _lookup(m.group(1)))
    m = re.fullmatch(r"Type '(.+)'(?: \(unpointed\))?", en)
    if m and _lookup(m.group(1)):
        return wrap("Наберіть «{uk}»", "Escribe «{es}»", "Tapez « {fr} »", _lookup(m.group(1)))
    m = re.fullmatch(r"What is (.+)\?", en)
    if m and _lookup(m.group(1)):
        return wrap("Як івритом сказати: {uk}?", "¿Cómo se dice {es} en hebreo?", "Comment dit-on {fr} en hébreu ?", _lookup(m.group(1)))
    m = re.fullmatch(r"Type the final letter (.+)", en)
    if m and _lookup(m.group(1)):
        return wrap("Наберіть кінцеву літеру {uk}", "Escribe la letra final {es}", "Tapez la lettre finale {fr}", _lookup(m.group(1)))
    m = re.fullmatch(r"Final form of (.+) is…", en)
    if m:
        glyph = m.group(1)
        return {"uk": f"Кінцева форма {glyph} — це…", "es": f"La forma final de {glyph} es…", "fr": f"La forme finale de {glyph} est…"}
    m = re.fullmatch(r"Use the (.+) set\.", en)
    if m and _lookup(m.group(1)):
        return wrap("Вправи з набору «{uk}».", "Usa el conjunto «{es}».", "Utilisez le jeu « {fr} ».", _lookup(m.group(1)))
    m = re.fullmatch(r"Handle a short (.+) exchange\.", en)
    if m and _lookup(m.group(1)):
        return wrap("Короткий діалог: {uk}.", "Gestiona un diálogo corto: {es}.", "Gérez un échange court : {fr}.", _lookup(m.group(1)))
    m = re.fullmatch(r"Order: (.+)", en)
    if m and _lookup(m.group(1)):
        return wrap("Порядок: {uk}", "Ordena: {es}", "Ordre : {fr}", _lookup(m.group(1)))
    m = re.fullmatch(r"Type (.+)", en)
    if m and _lookup(m.group(1)):
        return wrap("Наберіть {uk}", "Escribe {es}", "Tapez {fr}", _lookup(m.group(1)))
    m = re.fullmatch(r"Meaning of (.+)", en)
    if m:
        he = m.group(1)
        return {"uk": f"Значення: {he}", "es": f"Significado de {he}", "fr": f"Sens de {he}"}
    m = re.fullmatch(r"Recognize and type (.+)\.", en)
    if m:
        span = m.group(1)
        return {"uk": f"Упізнати й набрати {span}.", "es": f"Reconocer y escribir {span}.", "fr": f"Reconnaître et taper {span}."}
    return {}


def fill_loc(record: dict[str, Any] | None) -> dict[str, str]:
    if not record:
        return {"en": "", "ru": "", "he": "", "uk": "", "es": "", "fr": ""}
    en = str(record.get("en") or "")
    draft = drafts_for(en)
    return {
        "en": en,
        "ru": str(record.get("ru") or ""),
        "he": str(record.get("he") or ""),
        "uk": str(record.get("uk") or draft.get("uk") or ""),
        "es": str(record.get("es") or draft.get("es") or ""),
        "fr": str(record.get("fr") or draft.get("fr") or ""),
    }


def fill_choice(choice: dict[str, Any]) -> dict[str, Any]:
    clone = dict(choice)
    en = str(clone.get("en") or "")
    draft = drafts_for(en)
    for lang in ("uk", "es", "fr"):
        if not clone.get(lang) and draft.get(lang):
            clone[lang] = draft[lang]
    return clone


def fill_vocab(item: dict[str, Any]) -> dict[str, Any]:
    clone = dict(item)
    en = str(clone.get("en") or "")
    draft = drafts_for(en)
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

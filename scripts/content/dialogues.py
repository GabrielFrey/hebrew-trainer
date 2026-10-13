"""Бытовые диалоги: id = {unit.id}-d0. Никуд обязателен; транскрипцию пишет repair."""

LEVELS = ("elementary", "basic", "intermediate", "advanced", "expert")


def _split_unit(unit_id):
    for level in LEVELS:
        prefix = level + "-"
        if unit_id.startswith(prefix):
            return level, unit_id[len(prefix) :]
    raise ValueError(unit_id)


def d(unit_id, title, title_en, lines, replies):
    level, theme = _split_unit(unit_id)
    return {
        "id": f"{unit_id}-d0",
        "level": level,
        "theme": theme,
        "title": title,
        "titleEn": title_en,
        "lines": lines,
        "replies": replies,
    }


def L(speaker, nikud, ru, en):
    return {"speaker": speaker, "nikud": nikud, "ru": ru, "en": en}


def R(nikud, ru, en, correct):
    return {"nikud": nikud, "ru": ru, "en": en, "correct": correct}


DIALOGUES = [
    d(
        "elementary-greetings",
        "Знакомство",
        "Meeting someone",
        [
            L("a", "שָׁלוֹם, מָה שִׁמְךָ?", "Привет, как тебя зовут?", "Hi, what's your name?"),
            L("b", "אֲנִי דָּנִי. וְאַתָּה?", "Я Дани. А ты?", "I'm Dani. And you?"),
        ],
        [
            R("אֲנִי נוֹעַם, נָעִים מְאֹד.", "Я Ноам, очень приятно.", "I'm Noam, nice to meet you.", True),
            R("לֹא, תּוֹדָה.", "Нет, спасибо.", "No, thanks.", False),
            R("הַחֶשְׁבּוֹן בְּבַקָּשָׁה.", "Счёт, пожалуйста.", "The bill, please.", False),
        ],
    ),
    d(
        "elementary-core",
        "Да и нет",
        "Yes and no",
        [
            L("a", "אַתָּה רוֹצֶה קָפֶה?", "Хочешь кофе?", "Do you want coffee?"),
            L("b", "כֵּן, בְּבַקָּשָׁה. וְלָךְ?", "Да, пожалуйста. А тебе?", "Yes, please. And you?"),
        ],
        [
            R("גַּם אֲנִי, תּוֹדָה.", "Мне тоже, спасибо.", "Me too, thanks.", True),
            R("אֵיפֹה הַתַּחֲנָה?", "Где остановка?", "Where is the station?", False),
            R("אֲנִי רוֹפֵא.", "Я врач.", "I'm a doctor.", False),
        ],
    ),
    d(
        "elementary-verbs",
        "Что ты делаешь",
        "What are you doing",
        [
            L("a", "מָה אַתָּה עוֹשֶׂה עַכְשָׁו?", "Что ты сейчас делаешь?", "What are you doing now?"),
            L("b", "אֲנִי קוֹרֵא. וְאַתָּה?", "Я читаю. А ты?", "I'm reading. And you?"),
        ],
        [
            R("אֲנִי כּוֹתֵב הוֹדָעָה.", "Пишу сообщение.", "I'm writing a message.", True),
            R("שְׁנֵי כַּרְטִיסִים.", "Два билета.", "Two tickets.", False),
            R("בְּשָׁלוֹשׁ.", "В три.", "At three.", False),
        ],
    ),
    d(
        "elementary-clothes",
        "Что надеть",
        "What to wear",
        [
            L("a", "קַר בַּחוּץ. תִּלְבַּשׁ מְעִיל?", "На улице холодно. Наденешь пальто?", "It's cold outside. Will you wear a coat?"),
            L("b", "כֵּן. אַתָּה רוֹאֶה אֶת הַכּוֹבַע שֶׁלִּי?", "Да. Видишь мою шапку?", "Yes. Do you see my hat?"),
        ],
        [
            R("הִיא עַל הַכִּסֵּא.", "Она на стуле.", "It's on the chair.", True),
            R("אֲנִי רָעֵב.", "Я голоден.", "I'm hungry.", False),
            R("נֵלֵךְ בָּרַכֶּבֶת.", "Поедем на поезде.", "We'll take the train.", False),
        ],
    ),
    d(
        "elementary-people",
        "Кто это",
        "Who is that",
        [
            L("a", "מִי זֹאת לְיָד דָּנִי?", "Кто это рядом с Дани?", "Who is that next to Dani?"),
            L("b", "זֹאת מָיָה, חֲבֵרָה שֶׁלִּי מֵהָעֲבוֹדָה.", "Это Майя, подруга с работы.", "That's Maya, a friend from work."),
        ],
        [
            R("נָעִים מְאֹד.", "Очень приятно.", "Nice to meet you.", True),
            R("כַּמָּה זֶה עוֹלֶה?", "Сколько это стоит?", "How much is that?", False),
            R("יֵשׁ פַּקָּק.", "Пробка.", "There's traffic.", False),
        ],
    ),
    d(
        "elementary-feelings",
        "Как ты",
        "How you feel",
        [
            L("a", "אַתָּה בְּסֵדֶר? אַתָּה נִרְאֶה עָיֵף.", "Ты в порядке? Выглядишь усталым.", "Are you okay? You look tired."),
            L("b", "קְצָת. הָיָה יוֹם אָרֹךְ.", "Немного. День был длинный.", "A bit. It was a long day."),
        ],
        [
            R("לֵךְ לִישׁוֹן מֻקְדָּם הַיּוֹם.", "Ляг пораньше сегодня.", "Go to sleep early today.", True),
            R("שְׁתֵּי חַפּוֹת.", "Две халы.", "Two challahs.", False),
            R("הַמָּטוֹס בְּעֶשֶׂר.", "Самолёт в десять.", "The plane is at ten.", False),
        ],
    ),
    d(
        "elementary-daily",
        "Утро",
        "Morning",
        [
            L("a", "בֹּקֶר טוֹב. יֵשׁ קָפֶה?", "Доброе утро. Есть кофе?", "Good morning. Is there coffee?"),
            L("b", "כֵּן, עַל הַשֻּׁלְחָן. תִּרְצֶה גַּם לֶחֶם?", "Да, на столе. Хочешь ещё хлеб?", "Yes, on the table. Want bread too?"),
        ],
        [
            R("כֵּן, תּוֹדָה רַבָּה.", "Да, большое спасибо.", "Yes, thanks a lot.", True),
            R("אֲנִי גָּר בְּחֵיפָה.", "Я живу в Хайфе.", "I live in Haifa.", False),
            R("זֶה אָדֹם.", "Это красное.", "That's red.", False),
        ],
    ),
    d(
        "elementary-abstract",
        "Проще",
        "Keep it simple",
        [
            L("a", "זֶה מְסֻבָּךְ. יֵשׁ דֶּרֶךְ פְּשׁוּטָה?", "Это сложно. Есть простой способ?", "This is complicated. Is there a simple way?"),
            L("b", "כֵּן. נַעֲשֶׂה אֶת זֶה לְאַט.", "Да. Сделаем это медленно.", "Yes. We'll do it slowly."),
        ],
        [
            R("טוֹב, בּוֹא נַתְחִיל.", "Хорошо, давай начнём.", "Good, let's start.", True),
            R("כַּרְטִיס לְתֵל אָבִיב.", "Билет в Тель-Авив.", "A ticket to Tel Aviv.", False),
            R("כְּאֵב לִי הָרֹאשׁ.", "У меня болит голова.", "I have a headache.", False),
        ],
    ),
    d(
        "elementary-body",
        "Болит голова",
        "Headache",
        [
            L("a", "מָה קָרָה? אַתָּה חִוֵּר.", "Что случилось? Ты бледный.", "What happened? You're pale."),
            L("b", "כְּאֵב לִי הָרֹאשׁ. יֵשׁ מַיִם?", "Голова болит. Есть вода?", "My head hurts. Is there water?"),
        ],
        [
            R("הִנֵּה, וְשֵׁב רֶגַע.", "Вот, и сядь на секунду.", "Here, and sit for a moment.", True),
            R("הַמִּכְנָסַיִם כְּחוּלִים.", "Брюки синие.", "The trousers are blue.", False),
            R("נִסַּע בַּמְּכוֹנִית.", "Поедем на машине.", "We'll go by car.", False),
        ],
    ),
    d(
        "elementary-city",
        "Где остановка",
        "Where is the stop",
        [
            L("a", "סְלִיחָה, אֵיפֹה תַּחֲנַת הָאוֹטוֹבּוּס?", "Извините, где автобусная остановка?", "Excuse me, where is the bus stop?"),
            L("b", "יָשָׁר וְאַחַר כָּךְ יָמִינָה.", "Прямо и потом направо.", "Straight and then right."),
        ],
        [
            R("תּוֹדָה רַבָּה!", "Большое спасибо!", "Thanks a lot!", True),
            R("אֲנִי רוֹצֶה מָרָק.", "Хочу суп.", "I want soup.", False),
            R("זֶה אָח שֶׁלִּי.", "Это мой брат.", "That's my brother.", False),
        ],
    ),
    d(
        "elementary-family",
        "Семья в гостях",
        "Family visiting",
        [
            L("a", "אִמָּא בָּאָה הַיּוֹם. אַבָּא גַּם?", "Мама сегодня приходит. Папа тоже?", "Mom is coming today. Dad too?"),
            L("b", "כֵּן, וְגַם אָחוֹת שֶׁלִּי.", "Да, и моя сестра тоже.", "Yes, and my sister too."),
        ],
        [
            R("יוֹפִי, נָכִין אֹכֶל.", "Отлично, приготовим еду.", "Great, we'll make food.", True),
            R("הָרַכֶּבֶת מְאֻחֶרֶת.", "Поезд опаздывает.", "The train is late.", False),
            R("כָּחוֹל אוֹ אָדֹם?", "Синий или красный?", "Blue or red?", False),
        ],
    ),
    d(
        "elementary-time",
        "Во сколько",
        "What time",
        [
            L("a", "מָתַי אֲנַחְנוּ נִפְגָּשִׁים?", "Когда встречаемся?", "When are we meeting?"),
            L("b", "בְּשֵׁשׁ. זֶה בְּסֵדֶר?", "В шесть. Нормально?", "At six. Is that okay?"),
        ],
        [
            R("בְּסֵדֶר, אֲנִי אֶהְיֶה שָׁם.", "Ладно, я буду там.", "Okay, I'll be there.", True),
            R("זֶה הַכֶּלֶב שֶׁלִּי.", "Это моя собака.", "That's my dog.", False),
            R("אֲנִי לֹא אוֹהֵב דָּג.", "Я не люблю рыбу.", "I don't like fish.", False),
        ],
    ),
    d(
        "elementary-school",
        "Урок",
        "Class",
        [
            L("a", "יֵשׁ שִׁעוּר הַיּוֹם?", "Сегодня есть урок?", "Is there class today?"),
            L("b", "כֵּן, בְּעֶשֶׂר. הֵבֵאתָ אֶת הַסֵּפֶר?", "Да, в десять. Книгу взял?", "Yes, at ten. Did you bring the book?"),
        ],
        [
            R("כֵּן, הוּא בַּתִּיק.", "Да, она в сумке.", "Yes, it's in the bag.", True),
            R("תָּבִיא חֶשְׁבּוֹן.", "Принеси счёт.", "Bring the bill.", False),
            R("יֵשׁ גֶּשֶׁם.", "Дождь.", "It's raining.", False),
        ],
    ),
    d(
        "elementary-food",
        "В кафе",
        "At a café",
        [
            L("a", "שָׁלוֹם, אֶפְשָׁר קָפֶה וְחַלָּה?", "Здравствуйте, можно кофе и халу?", "Hi, can I have coffee and a pastry?"),
            L("b", "בֶּטַח. לִשְׁתּוֹת פֹּה אוֹ לָקַחַת?", "Конечно. Здесь или с собой?", "Sure. For here or to go?"),
        ],
        [
            R("לִשְׁתּוֹת פֹּה, תּוֹדָה.", "Здесь, спасибо.", "For here, thanks.", True),
            R("אֲנִי גָּר רָחוֹק.", "Я живу далеко.", "I live far away.", False),
            R("זֶה הַמַּפְתֵּחַ?", "Это ключ?", "Is this the key?", False),
        ],
    ),
    d(
        "elementary-numbers",
        "Два билета",
        "Two tickets",
        [
            L("a", "שְׁנֵי כַּרְטִיסִים לְחֵיפָה, בְּבַקָּשָׁה.", "Два билета в Хайфу, пожалуйста.", "Two tickets to Haifa, please."),
            L("b", "בְּסֵדֶר. זֶה אַרְבָּעִים שְׁקָלִים.", "Хорошо. Это сорок шекелей.", "Okay. That's forty shekels."),
        ],
        [
            R("הִנֵּה, תּוֹדָה.", "Вот, спасибо.", "Here, thanks.", True),
            R("אֲנִי עָיֵף.", "Я устал.", "I'm tired.", False),
            R("פְּתַח אֶת הַחַלּוֹן.", "Открой окно.", "Open the window.", False),
        ],
    ),
    d(
        "elementary-news",
        "Ты слышал",
        "Did you hear",
        [
            L("a", "שָׁמַעְתָּ אֶת הַחֲדָשׁוֹת הַבֹּקֶר?", "Слышал утренние новости?", "Did you hear the news this morning?"),
            L("b", "לֹא. מָה קָרָה?", "Нет. Что случилось?", "No. What happened?"),
        ],
        [
            R("סַפֵּר לִי אַחַר כָּךְ, אֲנִי מְמַהֵר.", "Расскажи потом, я спешу.", "Tell me later, I'm in a hurry.", True),
            R("כּוֹס חָלָב.", "Стакан молока.", "A glass of milk.", False),
            R("הַנָּעֲלַיִם לְמַטָּה.", "Ботинки внизу.", "The shoes are downstairs.", False),
        ],
    ),
    d(
        "elementary-nature",
        "На море",
        "At the sea",
        [
            L("a", "בּוֹא נֵלֵךְ לַיָּם. חַם הַיּוֹם.", "Пойдём к морю. Сегодня жарко.", "Let's go to the sea. It's hot today."),
            L("b", "כֵּן. תָּבִיא מַיִם?", "Да. Воду возьмёшь?", "Yes. Will you bring water?"),
        ],
        [
            R("בֶּטַח, וְגַם כּוֹבַע.", "Конечно, и шапку тоже.", "Of course, and a hat too.", True),
            R("זֶה הַמּוֹרֶה.", "Это учитель.", "That's the teacher.", False),
            R("אֲנִי כּוֹתֵב מִכְתָּב.", "Я пишу письмо.", "I'm writing a letter.", False),
        ],
    ),
    d(
        "elementary-work",
        "Опаздываю на работу",
        "Late for work",
        [
            L("a", "אֲנִי מְאַחֵר לָעֲבוֹדָה. תַּעֲזֹר?", "Я опаздываю на работу. Поможешь?", "I'm late for work. Can you help?"),
            L("b", "כֵּן, אֲנִי אָקִיחַ אוֹתְךָ.", "Да, я тебя подвезу.", "Yes, I'll give you a ride."),
        ],
        [
            R("תּוֹדָה, אַתָּה מַצִּיל אוֹתִי.", "Спасибо, ты меня спасаешь.", "Thanks, you're saving me.", True),
            R("זֶה כֶּלֶב גָּדוֹל.", "Это большая собака.", "That's a big dog.", False),
            R("אֲנִי רוֹצֶה תַּפּוּז.", "Хочу апельсин.", "I want an orange.", False),
        ],
    ),
    d(
        "elementary-colors",
        "Какой цвет",
        "Which color",
        [
            L("a", "אֵיזֶה חֻלְצָה? הַכְּחֻלָּה אוֹ הַלְּבָנָה?", "Какая рубашка? Синяя или белая?", "Which shirt? The blue or the white?"),
            L("b", "הַכְּחֻלָּה. הִיא יוֹתֵר נְעִימָה.", "Синюю. Она приятнее.", "The blue. It's nicer."),
        ],
        [
            R("בְּסֵדֶר, אֲנִי לוֹבֵשׁ אֶת הַכְּחֻלָּה.", "Ладно, надеваю синюю.", "Okay, I'll wear the blue one.", True),
            R("הָאוֹטוֹבּוּס בָּא.", "Автобус идёт.", "The bus is coming.", False),
            R("יֵשׁ לִי חוֹם.", "У меня температура.", "I have a fever.", False),
        ],
    ),
    d(
        "elementary-home",
        "Ключ",
        "The key",
        [
            L("a", "אֵיפֹה הַמַּפְתֵּחַ? אֲנִי לֹא מוֹצֵא.", "Где ключ? Не могу найти.", "Where is the key? I can't find it."),
            L("b", "עַל הַשֻּׁלְחָן בַּמִּטְבָּח.", "На столе на кухне.", "On the table in the kitchen."),
        ],
        [
            R("מָצָאתִי, תּוֹדָה.", "Нашёл, спасибо.", "Found it, thanks.", True),
            R("נִקְנֶה בָּנָנוֹת.", "Купим бананы.", "We'll buy bananas.", False),
            R("הוּא מוֹרֶה.", "Он учитель.", "He's a teacher.", False),
        ],
    ),
    d(
        "elementary-weather",
        "Дождь",
        "Rain",
        [
            L("a", "יֵשׁ גֶּשֶׁם. תִּקַּח מִטְרִיָּה?", "Дождь. Возьмёшь зонт?", "It's raining. Will you take an umbrella?"),
            L("b", "כֵּן. וְאַתָּה? אַתָּה יוֹצֵא?", "Да. А ты? Ты выходишь?", "Yes. And you? Are you going out?"),
        ],
        [
            R("לֹא, אֲנִי נִשְׁאַר בַּבַּיִת.", "Нет, остаюсь дома.", "No, I'm staying home.", True),
            R("זֶה אָחִיהָ.", "Это её брат.", "That's her brother.", False),
            R("שָׁלוֹשׁ מֵאוֹת.", "Триста.", "Three hundred.", False),
        ],
    ),
    d(
        "elementary-tech",
        "Нет сети",
        "No signal",
        [
            L("a", "אַתָּה שׁוֹמֵעַ אוֹתִי? אֵין קְלִיטָה.", "Ты меня слышишь? Нет связи.", "Can you hear me? No signal."),
            L("b", "קְצָת. תִּכְתֹּב לִי בַּוּוֹטְסַאפּ.", "Немного. Напиши в вотсап.", "A bit. Text me on WhatsApp."),
        ],
        [
            R("בְּסֵדֶר, אֲנִי שׁוֹלֵחַ.", "Ладно, отправляю.", "Okay, I'm sending it.", True),
            R("בֹּקֶר טוֹב.", "Доброе утро.", "Good morning.", False),
            R("אֲנִי אוֹהֵב דָּג.", "Я люблю рыбу.", "I like fish.", False),
        ],
    ),
    d(
        "basic-numbers",
        "На кассе",
        "At the till",
        [
            L("a", "כַּמָּה זֶה עוֹלֶה בְּיַחַד?", "Сколько это всё вместе?", "How much is that altogether?"),
            L("b", "שִׁבְעִים וּשְׁנַיִם שְׁקָלִים.", "Семьдесят два шекеля.", "Seventy-two shekels."),
        ],
        [
            R("יֵשׁ לִי רַק חֲמִשִּׁים מְזוּמָן. אֶפְשָׁר בְּכַרְטִיס?", "Наличных только пятьдесят. Можно картой?", "I only have fifty in cash. Card okay?", True),
            R("אֲנִי גָּר בַּצָּפוֹן.", "Я живу на севере.", "I live in the north.", False),
            R("הַכֶּלֶב בַּחוּץ.", "Собака на улице.", "The dog is outside.", False),
        ],
    ),
    d(
        "basic-family",
        "Кто заберёт",
        "Who's picking up",
        [
            L("a", "מִי לוֹקֵחַ אֶת הַיְּלָדִים הַיּוֹם?", "Кто сегодня забирает детей?", "Who's picking up the kids today?"),
            L("b", "אֲנִי. אַבָּא עוֹבֵד עַד שֶׁבַע.", "Я. Папа работает до семи.", "I am. Dad works until seven."),
        ],
        [
            R("טוֹב, אֲנִי אָכִין אֹכֶל.", "Хорошо, я приготовлю еду.", "Good, I'll make food.", True),
            R("כַּרְטִיס אָדֹם.", "Красный билет.", "A red ticket.", False),
            R("יֵשׁ שֶׁלֶג.", "Снег.", "There's snow.", False),
        ],
    ),
    d(
        "basic-food",
        "Заказ за столом",
        "Ordering at the table",
        [
            L("a", "מָה אַתְּ לוֹקַחַת?", "Что берёшь?", "What are you having?"),
            L("b", "שׁוּעִית וְעָלִים. וְאַתָּה?", "Шакшуку и салат. А ты?", "Shakshuka and a salad. And you?"),
        ],
        [
            R("פָּלָאפֶל וְעָלִים, בְּלִי חָרִיף.", "Фалафель и салат, без острого.", "Falafel and salad, no hot sauce.", True),
            R("הָרַכֶּבֶת בְּתֵשַׁע.", "Поезд в девять.", "The train is at nine.", False),
            R("הוּא אָח שֶׁלִּי.", "Он мой брат.", "He's my brother.", False),
        ],
    ),
    d(
        "basic-verbs",
        "Помоги закрыть",
        "Help me finish",
        [
            L("a", "אַתָּה יָכוֹל לַעֲזֹר לִי לִסְגֹּר אֶת זֶה?", "Можешь помочь мне это закрыть?", "Can you help me finish this?"),
            L("b", "כֵּן, תֵּן לִי שְׁנִיָּה לִגְמֹר שִׂיחָה.", "Да, дай секунду закончить разговор.", "Yes, give me a second to finish a call."),
        ],
        [
            R("בְּסֵדֶר, אֲנִי מְחַכֶּה בַּמִּטְבָּח.", "Ладно, жду на кухне.", "Okay, I'll wait in the kitchen.", True),
            R("זֶה כָּתוֹם.", "Это оранжевое.", "That's orange.", False),
            R("יֵשׁ לִי כֶּלֶב.", "У меня есть собака.", "I have a dog.", False),
        ],
    ),
    d(
        "basic-people",
        "Сосед",
        "The neighbor",
        [
            L("a", "אַתָּה מַכִּיר אֶת הַשָּׁכֵן מִמּוּל?", "Знаешь соседа напротив?", "Do you know the neighbor across the way?"),
            L("b", "קְצָת. קוֹרְאִים לוֹ יוֹסִי, הוּא נֶחְמָד.", "Немного. Его зовут Йоси, он приятный.", "A bit. His name is Yossi, he's nice."),
        ],
        [
            R("בּוֹא נַזְמִין אוֹתוֹ לְקָפֶה.", "Давай позовём его на кофе.", "Let's invite him for coffee.", True),
            R("שְׁנֵי כִּלּוֹ.", "Два кило.", "Two kilos.", False),
            R("הַמָּטוֹס מְאֻחָר.", "Самолёт опаздывает.", "The plane is late.", False),
        ],
    ),
    d(
        "basic-time",
        "Успеем?",
        "Will we make it",
        [
            L("a", "יֵשׁ לָנוּ זְמַן לִפְנֵי הָרַכֶּבֶת?", "У нас есть время до поезда?", "Do we have time before the train?"),
            L("b", "עֶשֶׂר דַּקּוֹת. אִם נָרוּץ — כֵּן.", "Десять минут. Если побежим — да.", "Ten minutes. If we run — yes."),
        ],
        [
            R("יַאלָּה, בּוֹא נָרוּץ.", "Давай, бежим.", "Come on, let's run.", True),
            R("זֹאת דּוֹדָה שֶׁלִּי.", "Это моя тётя.", "That's my aunt.", False),
            R("אֲנִי רוֹצֶה מָרָק.", "Хочу суп.", "I want soup.", False),
        ],
    ),
    d(
        "basic-core",
        "Не понял",
        "I didn't catch that",
        [
            L("a", "סְלִיחָה, לֹא הֵבַנְתִּי. תּוּכַל לַחְזֹר?", "Прости, не понял. Можешь повторить?", "Sorry, I didn't get that. Can you repeat?"),
            L("b", "בֶּטַח. אָמַרְתִּי: נִפְגָּשִׁים לְיַד הַדֹּאַר.", "Конечно. Я сказал: встречаемся у почты.", "Sure. I said: we meet by the post office."),
        ],
        [
            R("אַה, בְּסֵדֶר. אֲנִי בַּדֶּרֶךְ.", "А, ладно. Я в пути.", "Ah, okay. I'm on my way.", True),
            R("כּוֹס יַיִן.", "Бокал вина.", "A glass of wine.", False),
            R("הַחֻלְצָה יְרֻקָּה.", "Рубашка зелёная.", "The shirt is green.", False),
        ],
    ),
    d(
        "basic-daily",
        "Кто выносит мусор",
        "Who takes the trash",
        [
            L("a", "מִי מוֹצִיא אֶת הַזֶּבֶל הַיּוֹם?", "Кто сегодня выносит мусор?", "Who's taking the trash out today?"),
            L("b", "אֲנִי, רַק אַחֲרֵי הַמָּקלַחַת.", "Я, только после душа.", "I am, just after the shower."),
        ],
        [
            R("סָגוּר, תּוֹדָה.", "Договорились, спасибо.", "Deal, thanks.", True),
            R("כַּרְטִיס לְאֵילַת.", "Билет в Эйлат.", "A ticket to Eilat.", False),
            R("הוּא רוֹפֵא.", "Он врач.", "He's a doctor.", False),
        ],
    ),
    d(
        "basic-clothes",
        "Это мало",
        "This is too small",
        [
            L("a", "הַחֻלְצָה הַזֹּאת קְטַנָּה עָלַי. יֵשׁ מִדָּה יוֹתֵר?", "Эта футболка мне мала. Есть размер больше?", "This shirt is too small. Is there a bigger size?"),
            L("b", "כֵּן, בַּמִּדְף הַהוּא. תְּנַסֶּה אֶת הַכְּחֻלָּה.", "Да, на той полке. Примерь синюю.", "Yes, on that shelf. Try the blue one."),
        ],
        [
            R("תּוֹדָה, אֲנִי אֲנַסֶּה.", "Спасибо, примерю.", "Thanks, I'll try it.", True),
            R("יֵשׁ גֶּשֶׁם חָזָק.", "Сильный дождь.", "Heavy rain.", False),
            R("אֲנִי לוֹמֵד עִבְרִית.", "Я учу иврит.", "I'm learning Hebrew.", False),
        ],
    ),
    d(
        "basic-greetings",
        "Случайная встреча",
        "Running into someone",
        [
            L("a", "וַאלְּלָה, מָה נִשְׁמָע? הַרְבֵּה זְמַן.", "Ого, как дела? Давно не виделись.", "Wow, how's it going? It's been a while."),
            L("b", "הַכֹּל טוֹב. אַתָּה גָּר פֹּה עַכְשָׁו?", "Всё хорошо. Ты теперь здесь живёшь?", "All good. Do you live here now?"),
        ],
        [
            R("כֵּן, מִן הַחֹדֶשׁ. בּוֹא נֵשֵׁב לְקָפֶה.", "Да, с этого месяца. Давай сядем на кофе.", "Yes, since this month. Let's sit for coffee.", True),
            R("שְׁנֵי כִּלּוֹ תַּפּוּחִים.", "Два кило яблок.", "Two kilos of apples.", False),
            R("הַמְּכוֹנִית שְׁחֹרָה.", "Машина чёрная.", "The car is black.", False),
        ],
    ),
    d(
        "basic-body",
        "Спина",
        "Back pain",
        [
            L("a", "לָמָּה אַתָּה הוֹלֵךְ לְאַט?", "Почему ты идёшь медленно?", "Why are you walking slowly?"),
            L("b", "כְּאֵב לִי הַגַּב. עָבַדְתִּי הַרְבֵּה אֶתְמוֹל.", "Спина болит. Вчера много работал.", "My back hurts. I worked a lot yesterday."),
        ],
        [
            R("שֵׁב, אֲנִי אָבִיא לְךָ כַּדּוּר.", "Сядь, я принесу тебе таблетку.", "Sit, I'll bring you a pill.", True),
            R("נִקְנֶה כַּרְטִיסִים.", "Купим билеты.", "We'll buy tickets.", False),
            R("זֶה הַמּוֹרֶה הַחָדָשׁ.", "Это новый учитель.", "That's the new teacher.", False),
        ],
    ),
    d(
        "basic-work",
        "Совещание",
        "The meeting",
        [
            L("a", "הַיְּשִׁיבָה בְּעֶשֶׂר אוֹ בְּאַחַת עֶשְׂרֵה?", "Совещание в десять или в одиннадцать?", "Is the meeting at ten or eleven?"),
            L("b", "בְּעֶשֶׂר, בְּזוּם. אֲנִי אֶשְׁלַח קִשּׁוּר.", "В десять, в зуме. Я пришлю ссылку.", "At ten, on Zoom. I'll send a link."),
        ],
        [
            R("סָגוּר, אֲנִי אֶהְיֶה.", "Договорились, я буду.", "Deal, I'll be there.", True),
            R("הַתַּפּוּז חָמוּץ.", "Апельсин кислый.", "The orange is sour.", False),
            R("יֵשׁ כֶּלֶב בַּגִּנָּה.", "В саду собака.", "There's a dog in the garden.", False),
        ],
    ),
    d(
        "basic-news",
        "Ты читал",
        "Did you read it",
        [
            L("a", "קָרָאתָ אֶת הַכַּתָּבָה עַל הַתַּחְבּוּרָה?", "Читал статью про транспорт?", "Did you read the article about transport?"),
            L("b", "רַק אֶת הַכּוֹתֶרֶת. זֶה חָשׁוּב?", "Только заголовок. Это важно?", "Just the headline. Is it important?"),
        ],
        [
            R("כֵּן, יֵשׁ שִׁנּוּי בַּקַּו.", "Да, на маршруте изменения.", "Yes, there's a change on the line.", True),
            R("אֲנִי רוֹצֶה גְּלִידָה.", "Хочу мороженое.", "I want ice cream.", False),
            R("הַנָּעֲלַיִם לְמַעְלָה.", "Ботинки наверху.", "The shoes are upstairs.", False),
        ],
    ),
    d(
        "basic-colors",
        "Какой автобус",
        "Which bus",
        [
            L("a", "אֵיזֶה אוֹטוֹבּוּס? הָאָדֹם אוֹ הַכָּחֹל?", "Какой автобус? Красный или синий?", "Which bus? The red or the blue?"),
            L("b", "הַכָּחֹל. הוּא עוֹצֵר פֹּה.", "Синий. Он здесь останавливается.", "The blue. It stops here."),
        ],
        [
            R("טוֹב, אֲנַחְנוּ מְחַכִּים לַכָּחֹל.", "Хорошо, ждём синий.", "Good, we're waiting for the blue one.", True),
            R("תּוֹדָה עַל הָאֹכֶל.", "Спасибо за еду.", "Thanks for the food.", False),
            R("הוּא סָבָא שֶׁלִּי.", "Он мой дедушка.", "He's my grandfather.", False),
        ],
    ),
    d(
        "basic-feelings",
        "Нервы",
        "On edge",
        [
            L("a", "אַתְּ בְּסֵדֶר? אַתְּ שְׁקֵטָה הַיּוֹם.", "Ты в порядке? Сегодня тихая.", "Are you okay? You're quiet today."),
            L("b", "יֵשׁ לִי לַחַץ לִפְנֵי הַשִּׂיחָה.", "Нервничаю перед разговором.", "I'm stressed before the call."),
        ],
        [
            R("יִהְיֶה בְּסֵדֶר. אַתְּ מוּכָנָה.", "Будет нормально. Ты готова.", "It'll be okay. You're ready.", True),
            R("שְׁנֵי כַּרְטִיסִים.", "Два билета.", "Two tickets.", False),
            R("הַדָּג טָרִי.", "Рыба свежая.", "The fish is fresh.", False),
        ],
    ),
    d(
        "basic-school",
        "Домашка",
        "Homework",
        [
            L("a", "יֵשׁ שִׁעוּרֵי בַּיִת לְמָחָר?", "На завтра есть домашка?", "Is there homework for tomorrow?"),
            L("b", "כֵּן, לִקְרֹא פֶּרֶק וְלִכְתֹּב חָמֵשׁ מִשְׁפָּטִים.", "Да, прочитать главу и написать пять предложений.", "Yes, read a chapter and write five sentences."),
        ],
        [
            R("בּוֹא נַעֲשֶׂה אֶת זֶה הַעֶרֶב.", "Давай сделаем это вечером.", "Let's do it this evening.", True),
            R("הַמְּכוֹנִית לְבָנָה.", "Машина белая.", "The car is white.", False),
            R("אֲנִי צָמֵא.", "Я хочу пить.", "I'm thirsty.", False),
        ],
    ),
    d(
        "basic-animals",
        "Можно погладить",
        "Can I pet it",
        [
            L("a", "אֵיזֶה כֶּלֶב חָמוּד. אֶפְשָׁר לְלַטֵּף?", "Какая милая собака. Можно погладить?", "What a cute dog. Can I pet it?"),
            L("b", "כֵּן, הוּא סַבַּבָּה עִם אֲנָשִׁים.", "Да, он спокойный с людьми.", "Yes, he's fine with people."),
        ],
        [
            R("יוֹפִי, תּוֹדָה.", "Класс, спасибо.", "Nice, thanks.", True),
            R("הָרַכֶּבֶת מָלֵאָה.", "Поезд полный.", "The train is full.", False),
            R("אֲנִי כּוֹתֵב מִכְתָּב.", "Я пишу письмо.", "I'm writing a letter.", False),
        ],
    ),
    d(
        "basic-abstract",
        "Это важно",
        "This matters",
        [
            L("a", "זֶה חָשׁוּב לְךָ, נָכוֹן?", "Тебе это важно, да?", "This matters to you, right?"),
            L("b", "כֵּן. אִם לֹא נְדַבֵּר עַכְשָׁו, זֶה יִשָּׁאֵר.", "Да. Если не поговорим сейчас, это останется.", "Yes. If we don't talk now, it'll sit there."),
        ],
        [
            R("בְּסֵדֶר, בּוֹא נְדַבֵּר.", "Ладно, давай поговорим.", "Okay, let's talk.", True),
            R("כּוֹס תֵּה.", "Чашка чая.", "A cup of tea.", False),
            R("הַכּוֹבַע שָׁחֹר.", "Шапка чёрная.", "The hat is black.", False),
        ],
    ),
    d(
        "basic-nature",
        "В парке",
        "In the park",
        [
            L("a", "בּוֹא נֵשֵׁב תַּחַת הָעֵץ. יֵשׁ צֵל.", "Давай сядем под деревом. Есть тень.", "Let's sit under the tree. There's shade."),
            L("b", "כֵּן. אַתָּה הֵבֵאתָ מַיִם?", "Да. Воду взял?", "Yes. Did you bring water?"),
        ],
        [
            R("כֵּן, בַּתִּיק.", "Да, в сумке.", "Yes, in the bag.", True),
            R("הַמּוֹרֶה חָדָשׁ.", "Учитель новый.", "The teacher is new.", False),
            R("אֲנִי קוֹנֶה לֶחֶם.", "Покупаю хлеб.", "I'm buying bread.", False),
        ],
    ),
    d(
        "basic-home",
        "Окно",
        "The window",
        [
            L("a", "חַם פֹּה. אֶפְשָׁר לִפְתֹּחַ אֶת הַחַלּוֹן?", "Здесь жарко. Можно открыть окно?", "It's hot in here. Can we open the window?"),
            L("b", "כֵּן, רַק לֹא לְגַמְרֵי — יֵשׁ רוּחַ.", "Да, только не до конца — ветрено.", "Yes, just not all the way — it's windy."),
        ],
        [
            R("בְּסֵדֶר, אֶפְתַּח קְצָת.", "Ладно, открою чуть-чуть.", "Okay, I'll open it a bit.", True),
            R("שְׁנֵי כַּרְטִיסִים לְחֵיפָה.", "Два билета в Хайфу.", "Two tickets to Haifa.", False),
            R("הוּא סַבָּא שֶׁלִּי.", "Он мой дедушка.", "He's my grandfather.", False),
        ],
    ),
    d(
        "basic-city",
        "Такси или автобус",
        "Taxi or bus",
        [
            L("a", "מוֹנִית אוֹ אוֹטוֹבּוּס? אֲנַחְנוּ מְאַחֲרִים.", "Такси или автобус? Мы опаздываем.", "Taxi or bus? We're late."),
            L("b", "מוֹנִית. יֵשׁ תַּחֲנָה מֵעֵבֶר לַכְּבִישׁ.", "Такси. Стоянка через дорогу.", "Taxi. There's a stand across the road."),
        ],
        [
            R("יַאלָּה, בּוֹא נַעֲבֹר.", "Давай, переходим.", "Come on, let's cross.", True),
            R("הַגְּבִינָה מְלוּחָה.", "Сыр солёный.", "The cheese is salty.", False),
            R("אֲנִי קוֹרֵא סֵפֶר.", "Я читаю книгу.", "I'm reading a book.", False),
        ],
    ),
    d(
        "basic-weather",
        "Слишком жарко",
        "Too hot",
        [
            L("a", "חַם מְאוֹד. נֵלֵךְ לַיָּם?", "Очень жарко. Пойдём к морю?", "It's very hot. Shall we go to the sea?"),
            L("b", "כֵּן, אֲבָל נִקַּח מַיִם וְכּוֹבַע.", "Да, но возьмём воду и шапку.", "Yes, but let's take water and a hat."),
        ],
        [
            R("סָגוּר, אֲנִי מָכִין תִּיק.", "Договорились, собираю сумку.", "Deal, I'll pack a bag.", True),
            R("זֶה הַמּוֹרֶה.", "Это учитель.", "That's the teacher.", False),
            R("כַּרְטִיס יָרוֹק.", "Зелёный билет.", "A green ticket.", False),
        ],
    ),
    d(
        "basic-travel",
        "На вокзале",
        "At the station",
        [
            L("a", "הָרַכֶּבֶת הַזֹּאת הוֹלֶכֶת לִירוּשָׁלַיִם?", "Этот поезд идёт в Иерусалим?", "Does this train go to Jerusalem?"),
            L("b", "כֵּן, רֶצֶף שְׁלוֹשׁ. יֵשׁ לְךָ כַּרְטִיס?", "Да, путь три. Билет есть?", "Yes, platform three. Do you have a ticket?"),
        ],
        [
            R("כֵּן, עַל הַטֶּלֶפוֹן.", "Да, в телефоне.", "Yes, on my phone.", True),
            R("אֲנִי אוֹהֵב מָרָק.", "Я люблю суп.", "I like soup.", False),
            R("הַחֻלְצָה קְטַנָּה.", "Рубашка мала.", "The shirt is small.", False),
        ],
    ),
    d(
        "basic-tech",
        "Вайфай",
        "The wifi",
        [
            L("a", "מָה הַסִּסְמָה שֶׁל הַוַּיְיפָאי?", "Какой пароль от вайфая?", "What's the wifi password?"),
            L("b", "עַל הַפֶּתֶק לְיַד הַקָּפֶה.", "На бумажке у кофемашины.", "On the note by the coffee machine."),
        ],
        [
            R("מָצָאתִי, תּוֹדָה.", "Нашёл, спасибо.", "Found it, thanks.", True),
            R("נִסַּע לַיָּם.", "Поедем к морю.", "We'll go to the sea.", False),
            R("הוּא אָח שֶׁלָּהּ.", "Он её брат.", "He's her brother.", False),
        ],
    ),
    d(
        "basic-health",
        "К врачу",
        "At the clinic",
        [
            L("a", "שָׁלוֹם, יֵשׁ לִי תּוֹר לְדוֹקְטוֹר כֹּהֵן.", "Здравствуйте, у меня запись к доктору Коэну.", "Hi, I have an appointment with Dr. Cohen."),
            L("b", "בְּסֵדֶר, שֵׁב. הוּא יִקְרָא לְךָ בְּעֶשֶׂר דַּקּוֹת.", "Хорошо, садитесь. Он позовёт через десять минут.", "Okay, sit. He'll call you in ten minutes."),
        ],
        [
            R("תּוֹדָה, אֲנִי מְחַכֶּה.", "Спасибо, подожду.", "Thanks, I'll wait.", True),
            R("פָּלָאפֶל בְּלִי חָרִיף.", "Фалафель без острого.", "Falafel without hot sauce.", False),
            R("הַכּוֹבַע אָדֹם.", "Шапка красная.", "The hat is red.", False),
        ],
    ),
    d(
        "intermediate-verbs",
        "Кто закрывает",
        "Who's wrapping up",
        [
            L("a", "מִי סוֹגֵר אֶת הַמִּסְמָךְ הַיּוֹם?", "Кто сегодня закрывает документ?", "Who's wrapping up the document today?"),
            L("b", "אֲנִי אֶכְתֹּב, אַתָּה תִּבְדֹּק, וְנִשְׁלַח לִפְנֵי אַרְבַּע.", "Я напишу, ты проверишь, и отправим до четырёх.", "I'll write, you'll check, and we'll send before four."),
        ],
        [
            R("סָגוּר, אֲנִי עַל הַבְּדִיקָה.", "Договорились, я на проверке.", "Deal, I'm on the check.", True),
            R("כּוֹס חָלָב קָר.", "Стакан холодного молока.", "A glass of cold milk.", False),
            R("הַכֶּלֶב בָּרְחוֹב.", "Собака на улице.", "The dog is in the street.", False),
        ],
    ),
    d(
        "intermediate-daily",
        "Очередь в супермаркете",
        "Supermarket queue",
        [
            L("a", "אַתָּה עוֹמֵד בַּתּוֹר? אֲנִי רַק מַחֲזִיר מַשֶּׁהוּ.", "Ты в очереди? Я только возвращаю одну вещь.", "Are you in line? I'm just returning something."),
            L("b", "כֵּן, אֲבָל תַּעֲבֹר — אֲנִי עוֹד בּוֹדֵק מְחִירִים.", "Да, но проходи — я ещё смотрю цены.", "Yes, but go ahead — I'm still checking prices."),
        ],
        [
            R("תּוֹדָה, רַק שְׁנִיָּה.", "Спасибо, секунду.", "Thanks, just a second.", True),
            R("הַמָּטוֹס בְּשָׁלוֹשׁ.", "Самолёт в три.", "The plane is at three.", False),
            R("זֹאת דּוֹדָה שֶׁלִּי.", "Это моя тётя.", "That's my aunt.", False),
        ],
    ),
    d(
        "intermediate-people",
        "Коллега",
        "A colleague",
        [
            L("a", "אַתְּ מַכִּירָה אֶת רָוִית מֵהַשּׁוּק?", "Ты знаешь Равит с рынка?", "Do you know Ravit from marketing?"),
            L("b", "כֵּן, הִיא סָגְרָה אִתָּנוּ אֶת הַפְּרוֹיֶקְט בַּחֹדֶשׁ שֶׁעָבַר.", "Да, она закрывала с нами проект в прошлом месяце.", "Yes, she wrapped the project with us last month."),
        ],
        [
            R("יָפֶה, אֲנִי אֶשְׁאַל אוֹתָהּ עֵצָה.", "Хорошо, спрошу у неё совет.", "Good, I'll ask her for advice.", True),
            R("שְׁנֵי תַּפּוּזִים.", "Два апельсина.", "Two oranges.", False),
            R("הַגֶּשֶׁם חָזָק.", "Дождь сильный.", "The rain is heavy.", False),
        ],
    ),
    d(
        "intermediate-core",
        "Короче",
        "Bottom line",
        [
            L("a", "בְּקִצּוּר, אֲנַחְנוּ בָּאִים אוֹ לֹא?", "Короче, мы идём или нет?", "Bottom line, are we coming or not?"),
            L("b", "בָּאִים. רַק נְאַחֵר רֶבַע שָׁעָה.", "Идём. Только опоздаем на четверть часа.", "We're coming. We'll just be fifteen minutes late."),
        ],
        [
            R("סַבַּבָּה, אֲנִי אֶשְׁמֹר מָקוֹם.", "Ок, я займу место.", "Cool, I'll save a seat.", True),
            R("הַחֻלְצָה לְבָנָה.", "Рубашка белая.", "The shirt is white.", False),
            R("אֲנִי קוֹנֶה דָּג.", "Покупаю рыбу.", "I'm buying fish.", False),
        ],
    ),
    d(
        "intermediate-body",
        "У врача",
        "At the doctor",
        [
            L("a", "מָה כּוֹאֵב לְךָ בְּדִיּוּק?", "Что именно болит?", "What exactly hurts?"),
            L("b", "הַגָּרוֹן כְּבָר שְׁלוֹשָׁה יָמִים, וְיֵשׁ לִי קְצָת חֹם.", "Горло уже три дня, и небольшая температура.", "My throat for three days, and a bit of fever."),
        ],
        [
            R("אֶפְתַּח אֶת הַפֶּה, בְּבַקָּשָׁה.", "Откройте рот, пожалуйста.", "Open your mouth, please.", True),
            R("כַּרְטִיס לְחֵיפָה.", "Билет в Хайфу.", "A ticket to Haifa.", False),
            R("הַכֶּלֶב רָעֵב.", "Собака голодная.", "The dog is hungry.", False),
        ],
    ),
    d(
        "intermediate-school",
        "Экзамен",
        "The exam",
        [
            L("a", "אַתָּה מוּכָן לַמִּבְחָן מָחָר?", "Ты готов к завтрашнему экзамену?", "Are you ready for tomorrow's exam?"),
            L("b", "כִּמְעַט. עוֹד פֶּרֶק אֶחָד וְאֲנִי הוֹלֵךְ לִישׁוֹן.", "Почти. Ещё одна глава — и спать.", "Almost. One more chapter and I'm going to sleep."),
        ],
        [
            R("בְּהַצְלָחָה, תִּכְתֹּב לִי אַחַר כָּךְ.", "Удачи, напиши потом.", "Good luck, text me later.", True),
            R("הַמָּרָק חַם.", "Суп горячий.", "The soup is hot.", False),
            R("זֶה הַדּוֹד שֶׁלִּי.", "Это мой дядя.", "That's my uncle.", False),
        ],
    ),
    d(
        "intermediate-shopping",
        "Это слишком дорого",
        "That's too expensive",
        [
            L("a", "שְׁלוֹשׁ מֵאוֹת שְׁקָל עַל חֻלְצָה? זֶה יָקָר.", "Триста шекелей за рубашку? Дорого.", "Three hundred shekels for a shirt? That's expensive."),
            L("b", "יֵשׁ הַנָּחָה אִם לוֹקְחִים שְׁתַּיִם. רֶגַע, אֲנִי בּוֹדֵק.", "Есть скидка, если берёте две. Секунду, проверю.", "There's a discount if you take two. One sec, I'll check."),
        ],
        [
            R("בְּסֵדֶר, תַּרְאֶה לִי אֶת הַמְּחִיר הַסּוֹפִי.", "Ладно, покажи конечную цену.", "Okay, show me the final price.", True),
            R("הָרַכֶּבֶת מְאֻחֶרֶת.", "Поезд опаздывает.", "The train is late.", False),
            R("אֲנִי עָיֵף מְאוֹד.", "Я очень устал.", "I'm very tired.", False),
        ],
    ),
    d(
        "intermediate-clothes",
        "В примерочной",
        "In the fitting room",
        [
            L("a", "הַמִּכְנָסַיִם אֲרֻכִּים עָלַי. יֵשׁ לְקַצֵּר?", "Брюки мне длинные. Можно укоротить?", "The trousers are long on me. Can they be hemmed?"),
            L("b", "כֵּן, הַחַיָּט כָּאן עַד שֵׁשׁ. תַּשְׁאִיר אוֹתָם.", "Да, портной здесь до шести. Оставьте их.", "Yes, the tailor is here until six. Leave them."),
        ],
        [
            R("טוֹב, אֲנִי אֶקַּח וְאָשׁוּב מָחָר.", "Хорошо, возьму и вернусь завтра.", "Good, I'll take them and come back tomorrow.", True),
            R("יֵשׁ גֶּשֶׁם.", "Дождь.", "It's raining.", False),
            R("הוּא מוֹרֶה לְעִבְרִית.", "Он учитель иврита.", "He's a Hebrew teacher.", False),
        ],
    ),
    d(
        "intermediate-abstract",
        "Другое мнение",
        "A different view",
        [
            L("a", "אֲנִי לֹא מַסְכִּים. יֵשׁ כָּאן בְּעָיָה שֶׁל אֵמוּן.", "Я не согласен. Тут проблема доверия.", "I don't agree. There's a trust issue here."),
            L("b", "אָז תַּגִּיד בְּדִיּוּק מָה חָסֵר לְךָ.", "Тогда скажи точно, чего тебе не хватает.", "Then say exactly what's missing for you."),
        ],
        [
            R("אֲנִי צָרִיךְ לִרְאוֹת אֶת הַמִּסְפָּרִים.", "Мне нужно увидеть цифры.", "I need to see the numbers.", True),
            R("כּוֹס קָפֶה קָטָן.", "Маленький кофе.", "A small coffee.", False),
            R("הַכֶּלֶב יָשֵׁן.", "Собака спит.", "The dog is asleep.", False),
        ],
    ),
    d(
        "intermediate-travel",
        "В аэропорту",
        "At the airport",
        [
            L("a", "הַטִּסָּה בְּאִחוּר שֶׁל שָׁעָה. יֵשׁ הוֹדָעָה?", "Рейс задерживается на час. Есть объявление?", "The flight is an hour late. Is there an announcement?"),
            L("b", "כֵּן, עַל הַמָּסָךְ. הַשַּׁעַר נִשְׁאַר אוֹתוֹ הַשַּׁעַר.", "Да, на табло. Выход тот же.", "Yes, on the screen. The gate is the same."),
        ],
        [
            R("טוֹב, בּוֹא נֵשֵׁב לְקָפֶה.", "Хорошо, сядем на кофе.", "Good, let's sit for coffee.", True),
            R("אֲנִי קוֹנֶה לֶחֶם.", "Покупаю хлеб.", "I'm buying bread.", False),
            R("זֶה אָח שֶׁלִּי.", "Это мой брат.", "That's my brother.", False),
        ],
    ),
    d(
        "intermediate-news",
        "Что пишут",
        "What's in the news",
        [
            L("a", "רָאִיתָ מָה כָּתְבוּ עַל הַשְּׁבִיתָה?", "Видел, что написали про забастовку?", "Did you see what they wrote about the strike?"),
            L("b", "כֵּן. אִם זֶה נָכוֹן, הָרַכֶּבֶת לֹא תִּנְסַע בַּבֹּקֶר.", "Да. Если правда, утром поезд не пойдёт.", "Yes. If it's true, the train won't run in the morning."),
        ],
        [
            R("אָז נֵצֵא יוֹתֵר מֻקְדָּם בַּמְּכוֹנִית.", "Тогда выедем раньше на машине.", "Then we'll leave earlier by car.", True),
            R("הַחֻלְצָה קְטַנָּה.", "Рубашка мала.", "The shirt is small.", False),
            R("אֲנִי רוֹצֶה גְּלִידָה.", "Хочу мороженое.", "I want ice cream.", False),
        ],
    ),
    d(
        "intermediate-work",
        "Дедлайн",
        "The deadline",
        [
            L("a", "הַדֶּדְלַיִן מָחָר בְּעֶשֶׂר. אֲנַחְנוּ עוֹמְדִים בָּזֶה?", "Дедлайн завтра в десять. Успеваем?", "The deadline is tomorrow at ten. Are we on track?"),
            L("b", "אִם תִּסְגֹּר אֶת הַטְּיוּטָה הַלַּיְלָה — כֵּן.", "Если закроешь черновик сегодня вечером — да.", "If you wrap the draft tonight — yes."),
        ],
        [
            R("אֲנִי עַל זֶה, אַל תִּדְאַג.", "Я этим займусь, не переживай.", "I'm on it, don't worry.", True),
            R("הַכֶּלֶב בַּגִּנָּה.", "Собака в саду.", "The dog is in the garden.", False),
            R("כּוֹס תֵּה עִם לֵימוֹן.", "Чай с лимоном.", "Tea with lemon.", False),
        ],
    ),
    d(
        "intermediate-food",
        "Без острого",
        "No heat",
        [
            L("a", "אֶפְשָׁר בְּלִי חָרִיף? אֲנִי לֹא עוֹמֵד בָּזֶה.", "Можно без острого? Я не выдерживаю.", "Can I have it without hot sauce? I can't take it."),
            L("b", "בֶּטַח. וְלַשְּׁתִיָּה? מַיִם אוֹ לִימוֹנָדָה?", "Конечно. И напиток? Вода или лимонад?", "Sure. And to drink? Water or lemonade?"),
        ],
        [
            R("מַיִם, תּוֹדָה.", "Воду, спасибо.", "Water, thanks.", True),
            R("הַמָּטוֹס בְּשֶׁבַע.", "Самолёт в семь.", "The plane is at seven.", False),
            R("הוּא סָבָא שֶׁלִּי.", "Он мой дедушка.", "He's my grandfather.", False),
        ],
    ),
    d(
        "intermediate-family",
        "Ужин в пятницу",
        "Friday dinner",
        [
            L("a", "מִי בָּא לְעֶרֶב שַׁבָּת?", "Кто приходит на пятничный ужин?", "Who's coming for Friday dinner?"),
            L("b", "אִמָּא, דּוֹדָה וְהַיְּלָדִים. אַבָּא עוֹבֵד מְאֻחָר.", "Мама, тётя и дети. Папа работает допоздна.", "Mom, aunt, and the kids. Dad is working late."),
        ],
        [
            R("אֲנִי אֶקְנֶה עוּגָה בַּדֶּרֶךְ.", "Заодно куплю торт.", "I'll buy a cake on the way.", True),
            R("הָרַכֶּבֶת מְלֵאָה.", "Поезд полный.", "The train is full.", False),
            R("הַכּוֹבַע שָׁחֹר.", "Шапка чёрная.", "The hat is black.", False),
        ],
    ),
    d(
        "intermediate-numbers",
        "Счёт в ресторане",
        "Splitting the bill",
        [
            L("a", "הַחֶשְׁבּוֹן מֵאָה וּשְׁמוֹנִים. נְחַלֵּק?", "Счёт сто восемьдесят. Делим?", "The bill is a hundred and eighty. Shall we split?"),
            L("b", "כֵּן, תִּשְׁעִים לְכָל אֶחָד. אֲנִי אָשִׂים כַּרְטִיס.", "Да, по девяносто. Я приложу карту.", "Yes, ninety each. I'll put a card."),
        ],
        [
            R("סַבַּבָּה, אֲנִי אַעֲבִיר לְךָ בַּבַּנְק.", "Ок, переведу тебе в банке.", "Cool, I'll transfer you in the bank app.", True),
            R("יֵשׁ כֶּלֶב בַּחֲצֵר.", "Во дворе собака.", "There's a dog in the yard.", False),
            R("הַחֻלְצָה יְרֻקָּה.", "Рубашка зелёная.", "The shirt is green.", False),
        ],
    ),
    d(
        "intermediate-colors",
        "Какая машина",
        "Which car",
        [
            L("a", "אֵיזוֹ מְכוֹנִית שֶׁלָּךְ? הַלְּבָנָה אוֹ הַכְּחֻלָּה?", "Какая машина твоя? Белая или синяя?", "Which car is yours? The white or the blue?"),
            L("b", "הַכְּחֻלָּה, לְיַד הָעֵץ. תַּעֲמֹד שָׁם, אֲנִי מַגִּיעַ.", "Синяя, у дерева. Стой там, я подъеду.", "The blue, by the tree. Stand there, I'm coming."),
        ],
        [
            R("בְּסֵדֶר, אֲנִי לְיַד הָעֵץ.", "Ладно, я у дерева.", "Okay, I'm by the tree.", True),
            R("אֲנִי רוֹצֶה מָרָק.", "Хочу суп.", "I want soup.", False),
            R("זֶה הַמּוֹרֶה.", "Это учитель.", "That's the teacher.", False),
        ],
    ),
    d(
        "intermediate-greetings",
        "После долгого перерыва",
        "After a long gap",
        [
            L("a", "מָה קָרָה אִתְּךָ? נֶעֱלַמְתָּ.", "Что с тобой? Ты пропал.", "What happened to you? You disappeared."),
            L("b", "הָיָה לַחַץ בָּעֲבוֹדָה. סְלִיחָה שֶׁלֹּא כָּתַבְתִּי.", "Был завал на работе. Прости, что не писал.", "Work was intense. Sorry I didn't write."),
        ],
        [
            R("לֹא נּוֹרָא. בּוֹא נִפְגַּשׁ הַשָּׁבוּעַ.", "Не страшно. Давай встретимся на этой неделе.", "No big deal. Let's meet this week.", True),
            R("כַּרְטִיס אָדֹם.", "Красный билет.", "A red ticket.", False),
            R("הַדָּג טָרִי.", "Рыба свежая.", "The fish is fresh.", False),
        ],
    ),
    d(
        "intermediate-tech",
        "Не открывается",
        "It won't open",
        [
            L("a", "הַקּוֹבֶץ לֹא נִפְתָּח אֶצְלִי. שָׁלַחְתָּ אֶת הַגִּרְסָה הַנְּכוֹנָה?", "Файл у меня не открывается. Ты отправил верную версию?", "The file won't open for me. Did you send the right version?"),
            L("b", "רֶגַע, אֲנִי שׁוֹלֵחַ שׁוּב בַּוּוֹטְסַאפּ.", "Секунду, перешлю ещё раз в вотсап.", "One sec, I'll send it again on WhatsApp."),
        ],
        [
            R("סַבַּבָּה, אֲנִי מְחַכֶּה.", "Ок, жду.", "Cool, I'll wait.", True),
            R("נֵלֵךְ לַיָּם.", "Пойдём к морю.", "Let's go to the sea.", False),
            R("הוּא אָח שֶׁלִּי.", "Он мой брат.", "He's my brother.", False),
        ],
    ),
    d(
        "intermediate-animals",
        "Кошка на площадке",
        "Cat in the yard",
        [
            L("a", "יֵשׁ חָתוּל בַּחֲצֵר כָּל הַבֹּקֶר. שֶׁלָּךְ?", "Во дворе всё утро кошка. Твоя?", "There's a cat in the yard all morning. Yours?"),
            L("b", "כֵּן, הִיא בָּרְחָה כְּשֶׁפָּתַחְתִּי אֶת הַדֶּלֶת.", "Да, она выскочила, когда я открыл дверь.", "Yes, she slipped out when I opened the door."),
        ],
        [
            R("אֲנִי אֶקְרָא לָהּ, הִיא מַכִּירָה אוֹתִי.", "Позову её, она меня знает.", "I'll call her, she knows me.", True),
            R("כַּרְטִיס לְאֵילַת.", "Билет в Эйлат.", "A ticket to Eilat.", False),
            R("הַקָּפֶה חָם.", "Кофе горячий.", "The coffee is hot.", False),
        ],
    ),
    d(
        "intermediate-time",
        "Перенести",
        "Reschedule",
        [
            L("a", "אֶפְשָׁר לְהַעֲבִיר אֶת הַפְּגִישָׁה לְאַרְבַּע?", "Можно перенести встречу на четыре?", "Can we move the meeting to four?"),
            L("b", "לְאַרְבַּע קָשֶׁה לִי. חָמֵשׁ עוֹבֵד?", "В четыре мне сложно. Пять подойдёт?", "Four is hard for me. Does five work?"),
        ],
        [
            R("חָמֵשׁ סַבַּבָּה, אֲנִי מְעַדְכֵּן.", "Пять ок, я обновлю.", "Five is cool, I'll update it.", True),
            R("אֲנִי קוֹנֶה בָּנָנוֹת.", "Покупаю бананы.", "I'm buying bananas.", False),
            R("הַכֶּלֶב רָץ.", "Собака бежит.", "The dog is running.", False),
        ],
    ),
    d(
        "intermediate-home",
        "Сосед сверху",
        "The upstairs neighbor",
        [
            L("a", "הַשָּׁכֵן לְמַעְלָה עוֹשֶׂה רַעַשׁ כָּל הַלַּיְלָה.", "Сосед сверху шумит всю ночь.", "The upstairs neighbor makes noise all night."),
            L("b", "תִּכְתֹּב לוֹ בַּקְּבוּצָה שֶׁל הַבִּנְיָן. זֶה עוֹזֵר.", "Напиши ему в чат дома. Это помогает.", "Text him in the building group. That helps."),
        ],
        [
            R("בְּסֵדֶר, אֲנִי אֶכְתֹּב בְּנִימוּס.", "Ладно, напишу вежливо.", "Okay, I'll write politely.", True),
            R("פָּלָאפֶל וְעָלִים.", "Фалафель и салат.", "Falafel and salad.", False),
            R("הַמָּטוֹס מְאֻחָר.", "Самолёт опаздывает.", "The plane is late.", False),
        ],
    ),
    d(
        "intermediate-city",
        "Какой автобус до рынка",
        "Which bus to the market",
        [
            L("a", "אֵיזֶה קַו הוֹלֵךְ לַשּׁוּק הַכַּרְמֶל?", "Какой маршрут идёт на Кармельский рынок?", "Which line goes to Carmel Market?"),
            L("b", "הַחָמֵשׁ. הוּא עוֹצֵר אַחֲרֵי הָרְמָזוֹר.", "Пятый. Останавливается после светофора.", "The five. It stops after the light."),
        ],
        [
            R("תּוֹדָה, אֲנִי עוֹלֶה עַל הַחָמֵשׁ.", "Спасибо, сажусь на пятый.", "Thanks, I'll get on the five.", True),
            R("אֲנִי עָיֵף.", "Я устал.", "I'm tired.", False),
            R("הַחֻלְצָה אֲדֻמָּה.", "Рубашка красная.", "The shirt is red.", False),
        ],
    ),
    d(
        "intermediate-feelings",
        "Не в настроении",
        "Not in the mood",
        [
            L("a", "בּוֹא נֵצֵא הַלַּיְלָה. מָה אַתָּה אוֹמֵר?", "Пойдём сегодня вечером. Что скажешь?", "Let's go out tonight. What do you say?"),
            L("b", "לֹא בָּא לִי אֲנָשִׁים הַיּוֹם. נִשְׁאַר בַּבַּיִת?", "Не хочется людей сегодня. Останемся дома?", "I don't feel like people today. Stay in?"),
        ],
        [
            R("בְּסֵדֶר, נִזְמִין אֹכֶל וְנִרְאֶה סֶרֶט.", "Ладно, закажем еду и посмотрим кино.", "Okay, we'll order food and watch a film.", True),
            R("כַּרְטִיס לְחֵיפָה.", "Билет в Хайфу.", "A ticket to Haifa.", False),
            R("הַכֶּלֶב בַּחוּץ.", "Собака на улице.", "The dog is outside.", False),
        ],
    ),
    d(
        "intermediate-weather",
        "Хасиен",
        "The hamsin",
        [
            L("a", "יֵשׁ שָׁרָב מָחָר. עֲדַיִן רוֹצִים לָלֶכֶת?", "Завтра хасиен. Всё ещё хотим идти?", "There's a heatwave tomorrow. Still want to go?"),
            L("b", "נֵצֵא מֻקְדָּם וְנַחֲזֹר לִפְנֵי שְׁתַּיִם.", "Выйдем рано и вернёмся до двух.", "We'll leave early and be back before two."),
        ],
        [
            R("סָגוּר, אֲנִי אָבִיא מַיִם.", "Договорились, я возьму воду.", "Deal, I'll bring water.", True),
            R("זֶה הַמּוֹרֶה.", "Это учитель.", "That's the teacher.", False),
            R("אֲנִי קוֹנֶה גְּבִינָה.", "Покупаю сыр.", "I'm buying cheese.", False),
        ],
    ),
    d(
        "intermediate-nature",
        "На тропе",
        "On the trail",
        [
            L("a", "נִשְׁאַר עוֹד קִילוֹמֶטֶר עַד הַמַּבָּט. אַתָּה בְּסֵדֶר?", "Ещё километр до смотровой. Ты нормально?", "One more kilometer to the lookout. You okay?"),
            L("b", "כֵּן, רַק נַעֲצֹר לִשְׁתּוֹת.", "Да, только остановимся попить.", "Yes, let's just stop for a drink."),
        ],
        [
            R("בְּסֵדֶר, יֵשׁ לִי מַיִם בַּתִּיק.", "Ладно, у меня в сумке вода.", "Okay, I've got water in the bag.", True),
            R("הַחֻלְצָה לְבָנָה.", "Рубашка белая.", "The shirt is white.", False),
            R("הוּא רוֹפֵא.", "Он врач.", "He's a doctor.", False),
        ],
    ),
    d(
        "advanced-news",
        "Что решили",
        "What was decided",
        [
            L("a", "שָׁמַעְתָּ אֶת הַהַחְלָטָה עַל הַתַּקְצִיב?", "Слышал решение по бюджету?", "Did you hear the decision on the budget?"),
            L("b", "כֵּן. בַּשֶּׁטַח זֶה יִשְׁנֶה אֶת הַתַּחְבּוּרָה בָּעִיר.", "Да. На деле это изменит транспорт в городе.", "Yes. On the ground it'll change city transport."),
        ],
        [
            R("אָז כְּדַאי לִקְרֹא אֶת הַפִּרְסוּם הַמָּלֵא.", "Тогда стоит прочитать полный текст.", "Then it's worth reading the full notice.", True),
            R("כּוֹס חָלָב.", "Стакан молока.", "A glass of milk.", False),
            R("הַכֶּלֶב רָעֵב.", "Собака голодная.", "The dog is hungry.", False),
        ],
    ),
    d(
        "advanced-abstract",
        "На бумаге и в жизни",
        "On paper and in life",
        [
            L("a", "עַל הַנְּיָר זֶה נִרְאֶה פָּשׁוּט.", "На бумаге это выглядит просто.", "On paper it looks simple."),
            L("b", "בַּשֶּׁטַח צָרִיךְ עוֹד שְׁנֵי אֲנָשִׁים וְעוֹד שָׁבוּעַ.", "На деле нужны ещё двое и ещё неделя.", "On the ground we need two more people and another week."),
        ],
        [
            R("אָז נְבַקֵּשׁ אֶת הַזְּמַן הַזֶּה מֵהַהַנְהָלָה.", "Тогда запросим это время у руководства.", "Then we'll ask management for that time.", True),
            R("פָּלָאפֶל בְּלִי חָרִיף.", "Фалафель без острого.", "Falafel without hot sauce.", False),
            R("הַכּוֹבַע אָדֹם.", "Шапка красная.", "The hat is red.", False),
        ],
    ),
    d(
        "advanced-people",
        "Новый человек в команде",
        "A new teammate",
        [
            L("a", "הִיא הִתְחִילָה הַשָּׁבוּעַ. תַּכִּיר לָהּ אֶת הַצַּד הַטִּכְנִי?", "Она начала на этой неделе. Покажешь ей техническую сторону?", "She started this week. Will you show her the technical side?"),
            L("b", "כֵּן, קָבַעְתִּי אִתָּהּ רֶבַע שָׁעָה אַחֲרֵי הַיְּשִׁיבָה.", "Да, назначил с ней четверть часа после совещания.", "Yes, I set fifteen minutes with her after the meeting."),
        ],
        [
            R("יוֹפִי, אֲנִי אַעֲבִיר לָהּ אֶת הַמִּסְמָכִים.", "Отлично, я перешлю ей документы.", "Great, I'll send her the papers.", True),
            R("יֵשׁ גֶּשֶׁם.", "Дождь.", "It's raining.", False),
            R("אֲנִי קוֹנֶה לֶחֶם.", "Покупаю хлеб.", "I'm buying bread.", False),
        ],
    ),
    d(
        "advanced-core",
        "По сути",
        "The actual point",
        [
            L("a", "תַּכְלֶס, מָה אַתָּה צָרִיךְ מִמֶּנִּי?", "По сути, что тебе от меня нужно?", "Bottom line, what do you need from me?"),
            L("b", "חֲתִימָה עַל הַהֶסְכֵּם עַד סוֹף הַיּוֹם. בְּלִי זֶה לֹא זָזִים.", "Подпись на договоре до конца дня. Без этого не двигаемся.", "A signature on the agreement by end of day. Without it we don't move."),
        ],
        [
            R("אֲנִי חוֹתֵם אַחֲרֵי שֶׁאֶקְרָא פַּעַם אַחֲרוֹנָה.", "Подпишу после последней вычитки.", "I'll sign after one last read.", True),
            R("הַכֶּלֶב בַּגִּנָּה.", "Собака в саду.", "The dog is in the garden.", False),
            R("כּוֹס תֵּה.", "Чашка чая.", "A cup of tea.", False),
        ],
    ),
    d(
        "advanced-body",
        "После тренировки",
        "After the workout",
        [
            L("a", "הַבֶּרֶךְ כּוֹאֶבֶת לְךָ? אַתָּה חוֹלֵעַ.", "Колено болит? Ты хромаешь.", "Does your knee hurt? You're limping."),
            L("b", "קְצָת. אִם זֶה יִשָּׁאֵר מָחָר, אֵלֵךְ לְפִיזְיוֹתֵרָפִּיָה.", "Немного. Если завтра останется — пойду к физиотерапевту.", "A bit. If it's still there tomorrow, I'll go to physio."),
        ],
        [
            R("שֵׁב, אָשִׂים קֶרַח.", "Сядь, положу лёд.", "Sit, I'll put ice on it.", True),
            R("כַּרְטִיס לְחֵיפָה.", "Билет в Хайфу.", "A ticket to Haifa.", False),
            R("הַמָּרָק חַם.", "Суп горячий.", "The soup is hot.", False),
        ],
    ),
    d(
        "advanced-tech",
        "Сервер лёг",
        "The server is down",
        [
            L("a", "הַאֲתַר לֹא עוֹלֶה. זֶה אֶצְלֵנוּ אוֹ אֶצְלָם?", "Сайт не открывается. Это у нас или у них?", "The site won't load. Is it on our side or theirs?"),
            L("b", "אֶצְלָם. יֵשׁ הוֹדָעָה, עוֹד עֶשֶׂר דַּקּוֹת.", "У них. Есть объявление, ещё десять минут.", "Theirs. There's a notice, ten more minutes."),
        ],
        [
            R("אָז נַמְתִּין וְלֹא נִשְׁלַח כְּלוּם.", "Тогда ждём и ничего не отправляем.", "Then we wait and send nothing.", True),
            R("נֵלֵךְ לַיָּם.", "Пойдём к морю.", "Let's go to the sea.", False),
            R("זֶה אָח שֶׁלִּי.", "Это мой брат.", "That's my brother.", False),
        ],
    ),
    d(
        "advanced-greetings",
        "Деловой вход",
        "Walking into a meeting",
        [
            L("a", "בֹּקֶר טוֹב, סְלִיחָה עַל הָאִחוּר. יֵשׁ עוֹד מָקוֹם?", "Доброе утро, извините за опоздание. Есть ещё место?", "Good morning, sorry I'm late. Is there still a seat?"),
            L("b", "כֵּן, שֵׁב פֹּה. רַק הִתְחַלְנוּ אֶת הַסִּכּוּם.", "Да, садись сюда. Мы только начали итог.", "Yes, sit here. We just started the recap."),
        ],
        [
            R("תּוֹדָה, אֲנִי נִכְנָס לְשֶׁקֶט.", "Спасибо, дальше молчу.", "Thanks, I'll stay quiet.", True),
            R("פָּלָאפֶל וְעָלִים.", "Фалафель и салат.", "Falafel and salad.", False),
            R("הַכֶּלֶב בַּחוּץ.", "Собака на улице.", "The dog is outside.", False),
        ],
    ),
    d(
        "advanced-shopping",
        "Возврат",
        "A return",
        [
            L("a", "קָנִיתִי אֶת זֶה אֶתְמוֹל, הַמִּרְאֶה לֹא מַתְאִים. אֶפְשָׁר לְהַחְזִיר?", "Купил это вчера, размер не тот. Можно вернуть?", "I bought this yesterday, the size doesn't fit. Can I return it?"),
            L("b", "יֵשׁ חֲשְׁבוֹנִית? בְּלִי חֲשְׁבוֹנִית רַק זִכּוּי, לֹא מְזוּמָן.", "Есть чек? Без чека только на карту, не наличные.", "Do you have the receipt? Without it it's store credit, not cash."),
        ],
        [
            R("יֵשׁ, עַל הַטֶּלֶפוֹן. אֲנִי רוֹצֶה זִכּוּי.", "Есть, в телефоне. Хочу на карту.", "Yes, on the phone. I'll take store credit.", True),
            R("הָרַכֶּבֶת מְאֻחֶרֶת.", "Поезд опаздывает.", "The train is late.", False),
            R("אֲנִי עָיֵף.", "Я устал.", "I'm tired.", False),
        ],
    ),
    d(
        "advanced-family",
        "Кто остаётся с детьми",
        "Who stays with the kids",
        [
            L("a", "מִי נִשְׁאָר עִם הַיְּלָדִים בַּשַּׁבָּת בַּבֹּקֶר?", "Кто остаётся с детьми в субботу утром?", "Who's staying with the kids Saturday morning?"),
            L("b", "אֲנִי עַד שְׁתַּיִם, אַחַר כָּךְ אַתְּ. סָבָא מַגִּיעַ בְּאַרְבַּע.", "Я до двух, потом ты. Дед приедет в четыре.", "Me until two, then you. Grandad arrives at four."),
        ],
        [
            R("סָגוּר, אֲנִי אַעֲדַכֵּן אֶת סָבָא.", "Договорились, я напишу деду.", "Deal, I'll update grandad.", True),
            R("כּוֹס קָפֶה.", "Чашка кофе.", "A cup of coffee.", False),
            R("הַמָּטוֹס בְּעֶשֶׂר.", "Самолёт в десять.", "The plane is at ten.", False),
        ],
    ),
    d(
        "advanced-home",
        "Протек кран",
        "A leaking tap",
        [
            L("a", "הַבֶּרֶז בַּמִּטְבָּח מְטַפְטֵף כָּל הַלַּיְלָה.", "Кран на кухне капал всю ночь.", "The kitchen tap dripped all night."),
            L("b", "אֲנִי אֶקְרָא לְשַׁבְרַק. יֵשׁ לוֹ זְמַן הַיּוֹם?", "Позвоню сантехнику. У него есть время сегодня?", "I'll call a plumber. Does he have time today?"),
        ],
        [
            R("תִּבְדֹּק, וְאִם לֹא — נִסְגֹּר אֶת הַשּׁוֹסְתוֹת.", "Проверь, и если нет — перекроем воду.", "Check, and if not we'll shut the mains.", True),
            R("נִקְנֶה בָּנָנוֹת.", "Купим бананы.", "We'll buy bananas.", False),
            R("הוּא מוֹרֶה.", "Он учитель.", "He's a teacher.", False),
        ],
    ),
    d(
        "advanced-clothes",
        "На собеседование",
        "For the interview",
        [
            L("a", "מָה לוֹבְשִׁים לָרֵאָיוֹן? זֶה הִיּוּטֶק אוֹ מִשְׂרָד יָשָׁן?", "Что надеть на собеседование? Это хайтек или старый офис?", "What do we wear to the interview? Is it high-tech or an old office?"),
            L("b", "הִיּוּטֶק. חֻלְצָה נְקִיָּה, בְּלִי עֲנִיבָה.", "Хайтек. Чистая рубашка, без галстука.", "High-tech. A clean shirt, no tie."),
        ],
        [
            R("טוֹב, אֲנִי לוֹקֵחַ אֶת הַכְּחֻלָּה.", "Хорошо, беру синюю.", "Good, I'll take the blue one.", True),
            R("יֵשׁ כֶּלֶב בַּחֲצֵר.", "Во дворе собака.", "There's a dog in the yard.", False),
            R("אֲנִי רוֹצֶה מָרָק.", "Хочу суп.", "I want soup.", False),
        ],
    ),
    d(
        "advanced-colors",
        "Покраска стены",
        "Painting a wall",
        [
            L("a", "אֵיזֶה צֶבַע לַקִּיר? לָבָן שֶׁבֶר אוֹ אָפֹר בָּהִיר?", "Какой цвет для стены? Слоновая кость или светло-серый?", "Which color for the wall? Off-white or light grey?"),
            L("b", "אָפֹר בָּהִיר. עִם הָאוֹר מִן הַחַלּוֹן זֶה יִרְאֶה נָקִי.", "Светло-серый. Со светом из окна будет чисто.", "Light grey. With the window light it'll look clean."),
        ],
        [
            R("סָגוּר, אֶקְנֶה פַּח אֶחָד לְנִסָּיוֹן.", "Договорились, куплю одну банку на пробу.", "Deal, I'll buy one tin to test.", True),
            R("הָרַכֶּבֶת מְלֵאָה.", "Поезд полный.", "The train is full.", False),
            R("הוּא סַבָּא שֶׁלִּי.", "Он мой дедушка.", "He's my grandfather.", False),
        ],
    ),
    d(
        "advanced-city",
        "Велодорожка",
        "The bike lane",
        [
            L("a", "אֶפְשָׁר לִנְסֹעַ פֹּה בְּאוֹפַנַּיִם? יֵשׁ שְׁבִיל?", "Тут можно на велосипеде? Есть дорожка?", "Can you ride a bike here? Is there a lane?"),
            L("b", "כֵּן, מִיָּמִין. רַק תִּזָּהֵר בָּרִמְזוֹר הַבָּא, הַמְּכוֹנִיּוֹת חוֹתְכוֹת.", "Да, справа. Только осторожно на следующем светофоре, машины режут.", "Yes, on the right. Watch the next light, cars cut in."),
        ],
        [
            R("תּוֹדָה, אֶסַּע לְאַט.", "Спасибо, поеду медленно.", "Thanks, I'll go slowly.", True),
            R("כּוֹס קָפֶה הָפוּךְ.", "Чашка хафуха.", "A cup of hafukh.", False),
            R("זֶה אָחוֹת שֶׁלִּי.", "Это моя сестра.", "That's my sister.", False),
        ],
    ),
    d(
        "advanced-verbs",
        "Кто пишет, кто проверяет",
        "Who writes, who checks",
        [
            L("a", "מִי כּוֹתֵב אֶת הַסִּכּוּם וּמִי בּוֹדֵק?", "Кто пишет итог и кто проверяет?", "Who writes the recap and who checks?"),
            L("b", "אֲנִי אֶכְתֹּב הַלַּיְלָה, אַתְּ תִּבְדְּקִי בַּבֹּקֶר, וְנִשְׁלַח לִפְנֵי הַיְּשִׁיבָה.", "Я напишу вечером, ты проверишь утром, отправим до совещания.", "I'll write tonight, you'll check in the morning, we'll send before the meeting."),
        ],
        [
            R("סָגוּר, אֲנִי שָׂמָה תִּזְכֹּרֶת.", "Договорились, ставлю напоминание.", "Deal, I'll set a reminder.", True),
            R("הַכֶּלֶב יָשֵׁן.", "Собака спит.", "The dog is asleep.", False),
            R("נִקְנֶה תַּפּוּזִים.", "Купим апельсины.", "We'll buy oranges.", False),
        ],
    ),
    d(
        "advanced-work",
        "После совещания",
        "After the meeting",
        [
            L("a", "מָה יָצָא לָנוּ מֵהַיְּשִׁיבָה, תַּכְלֶס?", "Что нам по сути вышло с совещания?", "What did we actually get out of the meeting?"),
            L("b", "שְׁנֵי תַּאֲרִיכִים חֲדָשִׁים וְאַחֲרָיוּת עָלַי עַל הַלָּקוֹחַ.", "Две новые даты и клиент на мне.", "Two new dates, and the client is on me."),
        ],
        [
            R("אֲנִי אֶשְׁלַח סִכּוּם לַקְּבוּצָה.", "Я пришлю итог в чат.", "I'll send a recap to the group.", True),
            R("הַחֻלְצָה קְטַנָּה.", "Рубашка мала.", "The shirt is small.", False),
            R("יֵשׁ גֶּשֶׁם חָזָק.", "Сильный дождь.", "Heavy rain.", False),
        ],
    ),
    d(
        "advanced-time",
        "Сдвиг по неделе",
        "Sliding the week",
        [
            L("a", "אִם נַעֲבִיר הַכֹּל לְיוֹם רְבִיעִי, אַתָּה פָּנוּי?", "Если перенесём всё на среду, ты свободен?", "If we move everything to Wednesday, are you free?"),
            L("b", "בַּבֹּקֶר כֵּן, אַחֲרֵי שָׁלוֹשׁ יֵשׁ לִי רוֹפֵא.", "Утром да, после трёх у меня врач.", "Morning yes, after three I have a doctor."),
        ],
        [
            R("אָז נִקְבַּע לִשְׁתַּיִם עֶשְׂרֵה.", "Тогда поставим на двенадцать.", "Then we'll set it for twelve.", True),
            R("אֲנִי אוֹהֵב דָּג.", "Я люблю рыбу.", "I like fish.", False),
            R("הַכּוֹבַע שָׁחֹר.", "Шапка чёрная.", "The hat is black.", False),
        ],
    ),
    d(
        "advanced-daily",
        "Кто платит арнону",
        "Who pays the city tax",
        [
            L("a", "מִי מְשַׁלֵּם אֶת הָאַרְנוֹנָה הַחֹדֶשׁ?", "Кто в этом месяце платит арнону?", "Who's paying the city tax this month?"),
            L("b", "אֲנִי, אַתָּה תִּקַּח חַשְׁמַל וְאִינְטֶרְנֶט.", "Я, ты берёшь свет и интернет.", "Me, you take electricity and internet."),
        ],
        [
            R("סָגוּר, אֲנִי אֶשְׁלַם הַיּוֹם בָּעֶרֶב.", "Договорились, вечером оплачу.", "Deal, I'll pay tonight.", True),
            R("נִסַּע לַיָּם.", "Поедем к морю.", "We'll go to the sea.", False),
            R("זֶה הַמּוֹרֶה הַחָדָשׁ.", "Это новый учитель.", "That's the new teacher.", False),
        ],
    ),
    d(
        "advanced-food",
        "Аллергия",
        "An allergy",
        [
            L("a", "יֵשׁ בַּמָּנָה אֱגוֹזִים? יֵשׁ לִי אֲלֶרְגִּיָּה.", "В блюде есть орехи? У меня аллергия.", "Are there nuts in the dish? I have an allergy."),
            L("b", "בַּסַּלָּט כֵּן. בַּמָּנָה הָעִקָּרִית לֹא, אֲנִי אוּדֵא בַּמִּטְבָּח.", "В салате да. В основном блюде нет, уточню на кухне.", "In the salad yes. Not in the main, I'll check with the kitchen."),
        ],
        [
            R("תּוֹדָה, בְּלִי סַלָּט אָז.", "Спасибо, тогда без салата.", "Thanks, then without the salad.", True),
            R("הָרַכֶּבֶת בְּתֵשַׁע.", "Поезд в девять.", "The train is at nine.", False),
            R("הוּא אָח שֶׁלִּי.", "Он мой брат.", "He's my brother.", False),
        ],
    ),
    d(
        "advanced-numbers",
        "Скидка не сходится",
        "The discount doesn't add up",
        [
            L("a", "כָּתוּב עֶשְׂרִים אָחוּז, אֲבָל שִׁלַּמְתִּי מֵאָה וְאַרְבָּעִים עַל מֵאָה וְשִׁשִּׁים.", "Написано двадцать процентов, а я заплатил сто сорок за сто шестьдесят.", "It says twenty percent, but I paid a hundred forty on a hundred sixty."),
            L("b", "רֶגַע, אֲנִי בּוֹדֵק אֶת הַקֻּפָּה. אִם טָעִינוּ — נַחְזִיר.", "Секунду, проверю кассу. Если ошиблись — вернём.", "One sec, I'll check the till. If we erred we'll refund."),
        ],
        [
            R("תּוֹדָה, אֲנִי מְחַכֶּה כָּאן.", "Спасибо, подожду здесь.", "Thanks, I'll wait here.", True),
            R("הַכֶּלֶב בַּגִּנָּה.", "Собака в саду.", "The dog is in the garden.", False),
            R("אֲנִי קוֹרֵא סֵפֶר.", "Я читаю книгу.", "I'm reading a book.", False),
        ],
    ),
    d(
        "advanced-school",
        "Родительское собрание",
        "Parents' evening",
        [
            L("a", "יֵשׁ אֲסֵפַת הוֹרִים בְּרִאשׁוֹן. אַתְּ הוֹלֶכֶת?", "В воскресенье родительское. Ты идёшь?", "There's a parents' evening on Sunday. Are you going?"),
            L("b", "כֵּן, אֲבָל רַק עַד שְׁמוֹנֶה. תִּשְׁאֲלִי אוֹתִי מָה הֵם אָמְרוּ עַל הַמִּבְחָן.", "Да, но только до восьми. Спроси, что сказали про экзамен.", "Yes, but only until eight. Ask me what they said about the test."),
        ],
        [
            R("בְּסֵדֶר, אֲנִי אֶכְתֹּב לָךְ אַחֲרֵי.", "Ладно, напишу тебе после.", "Okay, I'll text you afterwards.", True),
            R("כּוֹס יַיִן.", "Бокал вина.", "A glass of wine.", False),
            R("הַמְּכוֹנִית לְבָנָה.", "Машина белая.", "The car is white.", False),
        ],
    ),
    d(
        "advanced-health",
        "Результаты анализа",
        "Test results",
        [
            L("a", "הַתּוֹצָאוֹת הִגִּיעוּ? מָה כָּתְבוּ?", "Результаты пришли? Что написали?", "Did the results arrive? What did they say?"),
            L("b", "הַכֹּל בְּסֵדֶר, רַק בַּרְזֶל קְצָת נָמוּךְ. צָרִיךְ כַּדּוּר לְחֹדֶשׁ.", "Всё нормально, только железо чуть низкое. Нужна таблетка на месяц.", "All fine, just iron a bit low. Need a pill for a month."),
        ],
        [
            R("אֲנִי אֶקַּח בֵּין הָאֳכָלוֹת, כְּמוֹ שֶׁאָמְרוּ.", "Буду пить между едой, как сказали.", "I'll take it between meals, as they said.", True),
            R("נִסַּע לַיָּם.", "Поедем к морю.", "We'll go to the sea.", False),
            R("הַחֻלְצָה יְרֻקָּה.", "Рубашка зелёная.", "The shirt is green.", False),
        ],
    ),
    d(
        "advanced-animals",
        "К ветеринару",
        "At the vet",
        [
            L("a", "הוּא לֹא אוֹכֵל יוֹמַיִם. צָרִיךְ לְוֶטֶרִינָר הַיּוֹם?", "Он не ест два дня. К ветеринару сегодня?", "He hasn't eaten in two days. Vet today?"),
            L("b", "כֵּן. יֵשׁ תּוֹר בְּאַרְבַּע, תָּבִיא אֶת הַכֶּלֶב בַּכְּלוּב.", "Да. Есть запись на четыре, принеси собаку в переноске.", "Yes. There's a slot at four, bring the dog in the carrier."),
        ],
        [
            R("סָגוּר, אֲנִי יוֹצֵא בְּשָׁלוֹשׁ.", "Договорились, выхожу в три.", "Deal, I'll leave at three.", True),
            R("כַּרְטִיס אָדֹם.", "Красный билет.", "A red ticket.", False),
            R("אֲנִי רוֹצֶה גְּלִידָה.", "Хочу мороженое.", "I want ice cream.", False),
        ],
    ),
    d(
        "advanced-travel",
        "На границе терминала",
        "At the terminal",
        [
            L("a", "הַדִּיסְרִי אֲרוּכָה. יֵשׁ מַשְׁקָאוֹת אַחֲרֵי הַבִּקּוֹרֶת?", "Досмотр длинный. После контроля есть напитки?", "Security is long. Are there drinks after the check?"),
            L("b", "כֵּן, אַחֲרֵי הַשַּׁעַר. שְׁמֹר אֶת הַמַּיִם עַד שָׁם, אַחֶרֶת יִזְרְקוּ.", "Да, после выхода. Воду держи дотуда, иначе выкинут.", "Yes, after the gate. Keep the water until then or they'll toss it."),
        ],
        [
            R("תּוֹדָה, אֶשְׁתֶּה אַחֲרֵי.", "Спасибо, попью после.", "Thanks, I'll drink after.", True),
            R("הַכֶּלֶב בַּחֲצֵר.", "Собака во дворе.", "The dog is in the yard.", False),
            R("זֶה הַמּוֹרֶה.", "Это учитель.", "That's the teacher.", False),
        ],
    ),
    d(
        "advanced-feelings",
        "Нужен разговор",
        "We need to talk",
        [
            L("a", "אֲנִי עַל עֲצַבִּים כָּל הַשָּׁבוּעַ. צָרִיךְ לְדַבֵּר.", "Я на нервах всю неделю. Надо поговорить.", "I've been on edge all week. We need to talk."),
            L("b", "בְּסֵדֶר. לֹא בַּוּוֹטְסַאפּ — נֵשֵׁב הַעֶרֶב.", "Ладно. Не в вотсапе — сядем вечером.", "Okay. Not on WhatsApp — we'll sit this evening."),
        ],
        [
            R("כֵּן, אַחֲרֵי שֶׁהַיְּלָדִים יְשֵׁנִים.", "Да, когда дети уснут.", "Yes, after the kids are asleep.", True),
            R("כּוֹס חָלָב.", "Стакан молока.", "A glass of milk.", False),
            R("הָרַכֶּבֶת מְלֵאָה.", "Поезд полный.", "The train is full.", False),
        ],
    ),
    d(
        "advanced-nature",
        "Слишком скользко",
        "Too slippery",
        [
            L("a", "הַשְּׁבִיל רָטֹב. נַמְשִׁיךְ אוֹ נַחֲזֹר?", "Тропа мокрая. Идём дальше или назад?", "The trail is wet. Keep going or turn back?"),
            L("b", "נַחֲזֹר. לֹא שָׁוֶה אֶת הָעֲצַבִּים עִם הַיְּלָדִים.", "Назад. Нервы того не стоят с детьми.", "Back. It's not worth the nerves with the kids."),
        ],
        [
            R("סָגוּר, בּוֹא נֵרֵד לְאַט.", "Договорились, спускаемся медленно.", "Deal, let's go down slowly.", True),
            R("אֲנִי קוֹנֶה לֶחֶם.", "Покупаю хлеб.", "I'm buying bread.", False),
            R("הוּא רוֹפֵא.", "Он врач.", "He's a doctor.", False),
        ],
    ),
    d(
        "advanced-weather",
        "Штормовое предупреждение",
        "A storm warning",
        [
            L("a", "יֵשׁ אַזְהָרָה עַל סְעָרָה בַּלַּיְלָה. סוֹגְרִים תְּרִיסִים?", "Есть предупреждение о шторме ночью. Закрываем ставни?", "There's a storm warning for tonight. Shall we close the shutters?"),
            L("b", "כֵּן, וְנוֹצִיא אֶת הָעֲצִיצִים מֵהַמִּרְפֶּסֶת.", "Да, и уберём горшки с балкона.", "Yes, and we'll bring the pots in from the balcony."),
        ],
        [
            R("אֲנִי מְטַפֵּל בַּמִּרְפֶּסֶת עַכְשָׁו.", "Я сейчас займусь балконом.", "I'll handle the balcony now.", True),
            R("כַּרְטִיס לְחֵיפָה.", "Билет в Хайфу.", "A ticket to Haifa.", False),
            R("הַקָּפֶה קָר.", "Кофе холодный.", "The coffee is cold.", False),
        ],
    ),
    d(
        "expert-abstract",
        "Провести черту",
        "Drawing a line",
        [
            L("a", "אֲנִי עוֹשֶׂה קַו: בְּלִי עוֹד אִחוּרִים עַל הַדֶּדְלַיִן הַזֶּה.", "Провожу черту: без новых опозданий по этому дедлайну.", "I'm drawing a line: no more slips on this deadline."),
            L("b", "מוּבָן. אִם יִהְיֶה עִכּוּב, אֲנִי כּוֹתֵב לְךָ בּוֹ בַּיּוֹם.", "Понял. Если будет задержка, напишу в тот же день.", "Understood. If there's a delay, I'll write that same day."),
        ],
        [
            R("זֶה כָּל מָה שֶׁבִּקַּשְׁתִּי.", "Это всё, что я просил.", "That's all I asked.", True),
            R("פָּלָאפֶל בְּלִי חָרִיף.", "Фалафель без острого.", "Falafel without hot sauce.", False),
            R("הַכֶּלֶב רָץ.", "Собака бежит.", "The dog is running.", False),
        ],
    ),
    d(
        "expert-core",
        "На равных",
        "At eye level",
        [
            L("a", "תְּדַבֵּר אִתִּי בְּגֹבַהּ הָעֵינַיִם, לֹא כְּמוֹ אֶל עוֹבֵד חָדָשׁ.", "Говори со мной на равных, не как с новым сотрудником.", "Talk to me at eye level, not like a new hire."),
            L("b", "צָדַקְתָּ. אֲנִי אֶחְזֹר עַל הַנְּקֻדָּה בְּלִי הַטּוֹן הַזֶּה.", "Ты прав. Повторю мысль без этого тона.", "You're right. I'll recap the point without that tone."),
        ],
        [
            R("תּוֹדָה, בּוֹא נַמְשִׁיךְ.", "Спасибо, давай дальше.", "Thanks, let's continue.", True),
            R("כּוֹס חָלָב.", "Стакан молока.", "A glass of milk.", False),
            R("הַמָּטוֹס מְאֻחָר.", "Самолёт опаздывает.", "The plane is late.", False),
        ],
    ),
    d(
        "expert-body",
        "Больничный",
        "Sick leave",
        [
            L("a", "הַגַּב לֹא מַרְפֶּה. אַתָּה לוֹקֵחַ יוֹם?", "Спина не отпускает. Берёшь отгул?", "Your back isn't letting up. Are you taking a day?"),
            L("b", "כֵּן, כָּתַבְתִּי לַהַנְהָלָה. אִם מָחָר יוֹתֵר טוֹב, אֶחְזֹר לַצָּהֳרַיִם.", "Да, написал руководству. Если завтра лучше — вернусь к обеду.", "Yes, I wrote to management. If tomorrow's better I'll come back at noon."),
        ],
        [
            R("תִּרְגַּע, נְכַסֶּה אוֹתְךָ בַּיְּשִׁיבָה.", "Отдохни, на совещании тебя закроем.", "Rest, we'll cover you in the meeting.", True),
            R("נִקְנֶה תַּפּוּחִים.", "Купим яблоки.", "We'll buy apples.", False),
            R("הַחֻלְצָה אֲדֻמָּה.", "Рубашка красная.", "The shirt is red.", False),
        ],
    ),
    d(
        "expert-news",
        "Как это читать",
        "How to read it",
        [
            L("a", "הַכַּתָּבָה קוֹרְנִית. מָה בָּאֱמֶת קָרָה, לְדַעְתְּךָ?", "Статья крикливая. Что на самом деле случилось, по-твоему?", "The article is shrill. What actually happened, in your view?"),
            L("b", "שִׁנּוּ קַו, לֹא סָגְרוּ אֶת הַשֵּׁרוּת. הַכּוֹתֶרֶת מַגְזִימָה.", "Сменили маршрут, сервис не закрыли. Заголовок врёт масштабом.", "They changed a line, they didn't shut the service. The headline oversells."),
        ],
        [
            R("אָז אֲנִי לֹא אֲבַטֵּל אֶת הַנְּסִיעָה.", "Тогда поездку не отменяю.", "Then I won't cancel the trip.", True),
            R("הַכֶּלֶב יָשֵׁן.", "Собака спит.", "The dog is asleep.", False),
            R("כּוֹס תֵּה.", "Чашка чая.", "A cup of tea.", False),
        ],
    ),
    d(
        "expert-people",
        "Поручиться",
        "Vouching",
        [
            L("a", "אַתָּה מוּכָן לַעֲמֹד מֵאֲחוֹרֶיהָ מוּל הַהַנְהָלָה?", "Готов прикрыть её перед руководством?", "Are you willing to stand behind her with management?"),
            L("b", "כֵּן, רָאִיתִי אֶת הָעֲבוֹדָה. אֲנִי אָגִיד דּוּגְרִי שֶׁהִיא סָגְרָה אֶת זֶה.", "Да, я видел работу. Скажу напрямую, что она это закрыла.", "Yes, I saw the work. I'll say straight that she closed it."),
        ],
        [
            R("תּוֹדָה, זֶה חָשׁוּב לָהּ.", "Спасибо, ей это важно.", "Thanks, that matters to her.", True),
            R("פָּלָאפֶל וְעָלִים.", "Фалафель и салат.", "Falafel and salad.", False),
            R("הָרַכֶּבֶת מְאֻחֶרֶת.", "Поезд опаздывает.", "The train is late.", False),
        ],
    ),
    d(
        "expert-clothes",
        "Платье на вечер",
        "A dress for the evening",
        [
            L("a", "הַשִּׂמְלָה הַזֹּאת נְכוֹנָה לַעֲרֶב, אוֹ יוֹתֵר מִדַּי?", "Это платье нормально для вечера, или слишком?", "Is this dress right for the evening, or too much?"),
            L("b", "הִיא מַתְאִימָה. רַק תַּחְלִיפִי אֶת הַנָּעֲלַיִם לְנוֹחוֹת, נְהַלֵּךְ הַרְבֵּה.", "Оно подходит. Только смени туфли на удобные, будем много ходить.", "It works. Just switch to comfortable shoes, we'll walk a lot."),
        ],
        [
            R("צָדַקְתְּ, אֲנִי לוֹקַחַת אֶת הַשְּׁטוּחוֹת.", "Ты права, беру удобные.", "You're right, I'll take the flats.", True),
            R("יֵשׁ גֶּשֶׁם.", "Дождь.", "It's raining.", False),
            R("אֲנִי קוֹנֶה דָּג.", "Покупаю рыбу.", "I'm buying fish.", False),
        ],
    ),
    d(
        "expert-colors",
        "Логотип",
        "The logo",
        [
            L("a", "הַכָּחֹל הַכֵּהֶה קוֹרֵא טוֹב עַל לָבָן, אֲבָל לֹא עַל אָפֹר.", "Тёмно-синий читается на белом, но не на сером.", "The dark blue reads well on white, but not on grey."),
            L("b", "אָז נַשְׁאִיר לָבָן לַכַּרְטִיס וְאָפֹר רַק לָרֶקַע בָּאֲתַר.", "Тогда белый оставим для визитки, серый только фоном на сайте.", "Then we'll keep white for the card and grey only as the site background."),
        ],
        [
            R("סָגוּר, אֲנִי מְעַדְכֵּן אֶת הַקּוֹבֶץ.", "Договорились, обновлю файл.", "Deal, I'll update the file.", True),
            R("הַכֶּלֶב בַּחוּץ.", "Собака на улице.", "The dog is outside.", False),
            R("כּוֹס קָפֶה.", "Чашка кофе.", "A cup of coffee.", False),
        ],
    ),
    d(
        "expert-verbs",
        "Кто берёт ответственность",
        "Who owns it",
        [
            L("a", "מִי לוֹקֵחַ אַחֲרָיוּת עַל הַטָּעוּת מוּל הַלָּקוֹחַ?", "Кто берёт на себя ошибку перед клиентом?", "Who takes responsibility for the mistake with the client?"),
            L("b", "אֲנִי. אֶכְתֹּב הַיּוֹם וְאַצִּיעַ תִּקּוּן עַד מָחָר.", "Я. Напишу сегодня и предложу исправление до завтра.", "I will. I'll write today and offer a fix by tomorrow."),
        ],
        [
            R("תּוֹדָה, זֶה הַדָּבָר הַנָּכוֹן.", "Спасибо, так и надо.", "Thanks, that's the right thing.", True),
            R("נִסַּע לַיָּם.", "Поедем к морю.", "We'll go to the sea.", False),
            R("הַחֻלְצָה לְבָנָה.", "Рубашка белая.", "The shirt is white.", False),
        ],
    ),
    d(
        "expert-food",
        "Счёт на компанию",
        "A group bill",
        [
            L("a", "יֵשׁ שְׁמוֹנָה אֲנָשִׁים. נְבַקֵּשׁ לְפַצֵּל אֶת הַחֶשְׁבּוֹן?", "Нас восемь. Попросить разделить счёт?", "There are eight of us. Shall we ask to split the bill?"),
            L("b", "כֵּן, שְׁנַיִם-שְׁנַיִם. אֲנִי אֶקְרָא לַמֶּלְצַר.", "Да, по двое. Я позову официанта.", "Yes, in pairs. I'll call the waiter."),
        ],
        [
            R("סַבַּבָּה, אֲנִי מַכִּין אֶת הַכַּרְטִיס.", "Ок, готовлю карту.", "Cool, I'll get the card ready.", True),
            R("הָרַכֶּבֶת מְלֵאָה.", "Поезд полный.", "The train is full.", False),
            R("הוּא סָבָא שֶׁלִּי.", "Он мой дедушка.", "He's my grandfather.", False),
        ],
    ),
    d(
        "expert-school",
        "Стипендия",
        "The scholarship",
        [
            L("a", "הַמִּכְתָּב עַל הַמִּלְגָּה הִגִּיעַ. אַתְּ שׁוֹלַחַת אֶת הַמִּסְמָכִים הַיּוֹם?", "Письмо про стипендию пришло. Документы сегодня отправишь?", "The scholarship letter arrived. Are you sending the papers today?"),
            L("b", "כֵּן, חָסֵר רַק אִישׁוּר בַּנְק. אֶסְרוֹק אוֹתוֹ בַּצָּהֳרַיִם.", "Да, не хватает только справки из банка. Отсканирую в обед.", "Yes, just missing a bank letter. I'll scan it at noon."),
        ],
        [
            R("אִם תִּצְטָרְכִי, אֲנִי אֶבְדֹּק אִתָּךְ אֶת הַקּוֹבֶץ.", "Если надо, сверю с тобой файл.", "If you need, I'll check the file with you.", True),
            R("כּוֹס יַיִן.", "Бокал вина.", "A glass of wine.", False),
            R("הַכֶּלֶב בַּגִּנָּה.", "Собака в саду.", "The dog is in the garden.", False),
        ],
    ),
    d(
        "expert-nature",
        "После дождя в вади",
        "After rain in the wadi",
        [
            L("a", "יָרַד גֶּשֶׁם בַּלַּיְלָה. נִכְנָסִים לַנַּחַל אוֹ מְחַכִּים?", "Ночью шёл дождь. Заходим в вади или ждём?", "It rained at night. Do we enter the wadi or wait?"),
            L("b", "מְחַכִּים. אַחֲרֵי שִׁטָּפוֹן לֹא נִכְנָסִים, נְנַסֶּה מָחָר בַּבֹּקֶר.", "Ждём. После паводка не заходят, попробуем завтра утром.", "We wait. You don't go in after a flood, we'll try tomorrow morning."),
        ],
        [
            R("צָדַקְתָּ, נַחֲזֹר לַמְּכוֹנִית.", "Ты прав, возвращаемся к машине.", "You're right, back to the car.", True),
            R("אֲנִי קוֹנֶה לֶחֶם.", "Покупаю хлеб.", "I'm buying bread.", False),
            R("הַחֻלְצָה קְטַנָּה.", "Рубашка мала.", "The shirt is small.", False),
        ],
    ),
    d(
        "expert-tech",
        "Двухфакторка",
        "Two-factor",
        [
            L("a", "הַקּוֹד לֹא מַגִּיעַ לַטֶּלֶפוֹן. מָה עוֹשִׂים?", "Код не приходит на телефон. Что делать?", "The code isn't arriving on the phone. What do we do?"),
            L("b", "תִּבְדֹּק אִם יֵשׁ רֶשֶׁת, וְאִם לֹא — נַעֲבִיר לְאִימֵייל לִפְעָמִים.", "Проверь, есть ли сеть, если нет — иногда переключаем на почту.", "Check if there's signal, and if not we sometimes switch to email."),
        ],
        [
            R("יֵשׁ רֶשֶׁת. אֲנִי מַמְתִּין עוֹד דַּקָּה.", "Сеть есть. Подожду ещё минуту.", "There's signal. I'll wait another minute.", True),
            R("נֵלֵךְ לַיָּם.", "Пойдём к морю.", "Let's go to the sea.", False),
            R("זֶה אָח שֶׁלִּי.", "Это мой брат.", "That's my brother.", False),
        ],
    ),
    d(
        "expert-city",
        "Ночная парковка",
        "Overnight parking",
        [
            L("a", "אֶפְשָׁר לַחֲנוֹת פֹּה בַּלַּיְלָה, אוֹ רַק עַד שְׁמוֹנֶה?", "Здесь можно ночью парковаться или только до восьми?", "Can you park here overnight, or only until eight?"),
            L("b", "עַד שְׁמוֹנֶה בַּבֹּקֶר יֵשׁ קְנָס. תַּעֲבֹר לַחֲנָיָה שֶׁל הָעִיר מֵאֲחוֹרֵי הַשּׁוּק.", "До восьми утра штраф. Переезжай на городскую стоянку за рынком.", "Until eight in the morning there's a fine. Move to the city lot behind the market."),
        ],
        [
            R("תּוֹדָה, אֲנִי מַעֲבִיר עַכְשָׁו.", "Спасибо, сейчас переставлю.", "Thanks, I'll move it now.", True),
            R("כּוֹס קָפֶה הָפוּךְ.", "Чашка хафуха.", "A cup of hafukh.", False),
            R("הוּא מוֹרֶה.", "Он учитель.", "He's a teacher.", False),
        ],
    ),
    d(
        "expert-numbers",
        "Ипотека в цифрах",
        "The mortgage in numbers",
        [
            L("a", "הַהֶחְזֵר הַחָדָשׁ יוֹצֵא אַרְבַּעַת אֲלָפִים וּמָאתַיִם. עוֹמְדִים בָּזֶה?", "Новый платёж выходит четыре тысячи двести. Тянем?", "The new payment comes to four thousand two hundred. Can we carry it?"),
            L("b", "אִם נְקַצֵּץ אֶת הַחוּג שֶׁל הַיְּלָדִים — כֵּן. אַחֶרֶת יִהְיֶה לָחַץ.", "Если урежем кружок у детей — да. Иначе будет напряг.", "If we cut the kids' after-school class — yes. Otherwise it'll be tight."),
        ],
        [
            R("בּוֹא נַעֲשֶׂה חִשּׁוּב הַעֶרֶב בִּשְׁקֶט.", "Давай вечером спокойно прикинем.", "Let's do the math this evening in quiet.", True),
            R("הַכֶּלֶב בַּחֲצֵר.", "Собака во дворе.", "The dog is in the yard.", False),
            R("אֲנִי רוֹצֶה גְּלִידָה.", "Хочу мороженое.", "I want ice cream.", False),
        ],
    ),
    d(
        "expert-family",
        "Разговор с родителями",
        "Talking to the parents",
        [
            L("a", "אָמַרְתְּ לְהוֹרִים שֶׁאֲנַחְנוּ לֹא בָּאִים בַּחַג?", "Ты сказала родителям, что мы не приедем на праздник?", "Did you tell your parents we're not coming for the holiday?"),
            L("b", "עוֹד לֹא. אֲנִי אֶתְקַשֵּׁר הַעֶרֶב, בְּלִי וַאטְסַאפּ.", "Ещё нет. Позвоню вечером, не вотсапом.", "Not yet. I'll call this evening, not WhatsApp."),
        ],
        [
            R("טוֹב, תַּגִּידִי שֶׁנָּבוֹא בַּשָּׁבוּעַ אַחֲרֵי.", "Хорошо, скажи, что приедем на следующей неделе.", "Good, tell them we'll come the week after.", True),
            R("כַּרְטִיס אָדֹם.", "Красный билет.", "A red ticket.", False),
            R("הַקָּפֶה חָם.", "Кофе горячий.", "The coffee is hot.", False),
        ],
    ),
    d(
        "expert-feelings",
        "Без драм",
        "No drama",
        [
            L("a", "לֹא בָּא לִי דְּרָמוֹת הַיּוֹם. תֹּאמַר יָשָׁר מָה כּוֹאֵב.", "Мне сегодня не нужны драмы. Скажи прямо, что не так.", "I don't want drama today. Say straight what's wrong."),
            L("b", "נִשְׁבַּר לִי שֶׁאַתָּה עוֹנֶה רַק בַּלַּיְלָה. זֶה הַכֹּל.", "Мне надоело, что ты отвечаешь только ночью. Вот и всё.", "I'm tired of you only answering at night. That's all."),
        ],
        [
            R("מוּבָן. מֵהַיּוֹם אֶעֱנֶה בַּצָּהֳרַיִם.", "Понял. С сегодня отвечаю днём.", "Understood. From today I'll answer at midday.", True),
            R("נִקְנֶה לֶחֶם.", "Купим хлеб.", "We'll buy bread.", False),
            R("הַמָּטוֹס בְּשֶׁבַע.", "Самолёт в семь.", "The plane is at seven.", False),
        ],
    ),
    d(
        "expert-animals",
        "Пока кто-то в отъезде",
        "While someone's away",
        [
            L("a", "אַתָּה יָכוֹל לָתֵת אֹכֶל לַחָתוּל שֶׁלָּנוּ בַּשַּׁלּוֹשׁ יָמִים?", "Можешь покормить нашего кота три дня?", "Can you feed our cat for three days?"),
            L("b", "כֵּן, בַּבֹּקֶר לִפְנֵי עֲבוֹדָה. תַּשְׁאִיר מַפְתֵּחַ אֵצֶל הַשּׁוֹעֵר.", "Да, утром до работы. Ключ оставь у консьержа.", "Yes, in the morning before work. Leave a key with the guard."),
        ],
        [
            R("סָגוּר, אֲנִי מַשְׁאִיר גַּם אֶת הַמִּסְפָּר שֶׁל הַוֶּטֶרִינָר.", "Договорились, оставлю ещё номер ветеринара.", "Deal, I'll also leave the vet's number.", True),
            R("כּוֹס תֵּה.", "Чашка чая.", "A cup of tea.", False),
            R("הַחֻלְצָה יְרֻקָּה.", "Рубашка зелёная.", "The shirt is green.", False),
        ],
    ),
    d(
        "expert-greetings",
        "После ссоры",
        "After a fight",
        [
            L("a", "שָׁלוֹם. אֲנִי לֹא בָּא לְהַמְשִׁיךְ אֶת אֶמֶשׁ, רַק לְבָרֵר.", "Привет. Я не для того, чтобы продолжать вчерашнее — только прояснить.", "Hi. I'm not here to continue last night, just to clear it up."),
            L("b", "בְּסֵדֶר. בּוֹא נְדַבֵּר לְאַט, בְּלִי לְהַגְבִּיהַּ אֶת הַקּוֹל.", "Ладно. Давай медленно, без повышения голоса.", "Okay. Let's talk slowly, without raising our voices."),
        ],
        [
            R("מַסְכִּים. אַתָּה מַתְחִיל.", "Согласен. Начинай ты.", "Agreed. You start.", True),
            R("פָּלָאפֶל וְעָלִים.", "Фалафель и салат.", "Falafel and salad.", False),
            R("הָרַכֶּבֶת מְלֵאָה.", "Поезд полный.", "The train is full.", False),
        ],
    ),
    d(
        "expert-weather",
        "Отмена пикника",
        "Calling off the picnic",
        [
            L("a", "הָרוּחַ חֲזָקָה וְיֵשׁ אַזְהָרָה. מְבַטְּלִים אֶת הַפִּקְנִיק?", "Ветер сильный и есть предупреждение. Отменяем пикник?", "The wind is strong and there's a warning. Call off the picnic?"),
            L("b", "כֵּן. נַעֲבִיר לְבַיִת: כָּל אֶחָד מֵבִיא מַשֶּׁהוּ קָטָן.", "Да. Переносим домой: каждый несёт по мелочи.", "Yes. We'll move it indoors: each person brings something small."),
        ],
        [
            R("אֲנִי אָבִיא סַלָּט וְלֶחֶם.", "Я принесу салат и хлеб.", "I'll bring salad and bread.", True),
            R("כַּרְטִיס לְחֵיפָה.", "Билет в Хайфу.", "A ticket to Haifa.", False),
            R("הַכֶּלֶב רָעֵב.", "Собака голодная.", "The dog is hungry.", False),
        ],
    ),
    d(
        "expert-travel",
        "Стыковка",
        "A tight connection",
        [
            L("a", "יֵשׁ לָנוּ אַרְבָּעִים דַּקּוֹת בֵּין טִיסוֹת. מַסְפִּיק?", "Между рейсами сорок минут. Хватит?", "We have forty minutes between flights. Enough?"),
            L("b", "אִם הַמִּזְוָדָה לֹא עוֹבֶרֶת — כֵּן. אִם צָרִיךְ לֶאֱסֹף אוֹתָהּ, יִהְיֶה לַחַץ.", "Если чемодан не сдаём — да. Если забирать — будет напряг.", "If the bag isn't checked — yes. If we have to collect it, it'll be tight."),
        ],
        [
            R("אָז טָסִים רַק עִם תִּיק, בְּלִי מִזְוָדָה.", "Тогда летим только с сумкой, без чемодана.", "Then we fly with a bag only, no suitcase.", True),
            R("אֲנִי קוֹנֶה גְּבִינָה.", "Покупаю сыр.", "I'm buying cheese.", False),
            R("הוּא רוֹפֵא.", "Он врач.", "He's a doctor.", False),
        ],
    ),
    d(
        "expert-time",
        "Календарь на месяц",
        "The month's calendar",
        [
            L("a", "סֶפְּטֶמְבֶּר מָלֵא. אִם לֹא נִסְגֹּר תַּאֲרִיךְ הַיּוֹם, נִדָּחֵק לְאוֹקְטוֹבֶּר.", "Сентябрь забит. Если сегодня не закроем дату, сползём на октябрь.", "September is full. If we don't lock a date today, we'll slip into October."),
            L("b", "אָז נִסְגֹּר אֶת הַשְּׁנֵים-עָשָׂר בְּאַרְבַּע. אֲנִי שׁוֹלֵחַ זִמּוּן.", "Тогда закрываем двенадцатое в четыре. Я шлю приглашение.", "Then we lock the twelfth at four. I'm sending a hold."),
        ],
        [
            R("סָגוּר, אֲנִי מְפַנֶּה אֶת הַיּוֹם הַזֶּה.", "Договорились, освобождаю этот день.", "Deal, I'll clear that day.", True),
            R("הַכֶּלֶב בַּגִּנָּה.", "Собака в саду.", "The dog is in the garden.", False),
            R("כּוֹס חָלָב.", "Стакан молока.", "A glass of milk.", False),
        ],
    ),
    d(
        "expert-health",
        "Второй врач",
        "A second opinion",
        [
            L("a", "הָרוֹפֵא מַמְלִיץ עַל נִתּוּחַ. אַתָּה רוֹצֶה עוֹד חוֹוַת דַּעַת?", "Врач советует операцию. Хочешь ещё одно мнение?", "The doctor recommends surgery. Do you want a second opinion?"),
            L("b", "כֵּן. תּוּכַל לִשְׁאֹל אֶת הַחֲבֵרָה שֶׁלָּךְ מֵהַמִּרְפָּאָה?", "Да. Можешь спросить свою знакомую из поликлиники?", "Yes. Can you ask your friend from the clinic?"),
        ],
        [
            R("אֶכְתֹּב לָהּ הַיּוֹם וְאֶקְבַּע תּוֹר.", "Напишу ей сегодня и запишу тебя.", "I'll text her today and book a slot.", True),
            R("נִסַּע לַיָּם.", "Поедем к морю.", "We'll go to the sea.", False),
            R("הַחֻלְצָה כְּחֻלָּה.", "Рубашка синяя.", "The shirt is blue.", False),
        ],
    ),
    d(
        "expert-shopping",
        "Гарантия",
        "The warranty",
        [
            L("a", "הַמְּקָרֵר עוֹשֶׂה רַעַשׁ כְּבָר שָׁבוּעַ. יֵשׁ אַחֲרָיוּת?", "Холодильник шумит уже неделю. Есть гарантия?", "The fridge has been noisy for a week. Is it under warranty?"),
            L("b", "כֵּן, עַד הַשָּׁנָה. תַּצְלֵם אֶת הַחֲשְׁבוֹנִית וַאֲנִי אֶפְתַּח קְרִיאָה.", "Да, до года. Сфоткай чек, я открою заявку.", "Yes, until the year is up. Photo the receipt and I'll open a ticket."),
        ],
        [
            R("שָׁלַחְתִּי לְךָ עַכְשָׁו בַּוּוֹטְסַאפּ.", "Отправил тебе сейчас в вотсап.", "I just sent it on WhatsApp.", True),
            R("הָרַכֶּבֶת בְּתֵשַׁע.", "Поезд в девять.", "The train is at nine.", False),
            R("אֲנִי עָיֵף.", "Я устал.", "I'm tired.", False),
        ],
    ),
    d(
        "expert-daily",
        "Разделение недели",
        "Splitting the week",
        [
            L("a", "מִי עוֹשֶׂה קְנִיּוֹת וּמִי מְבַשֵּׁל הַשָּׁבוּעַ?", "Кто на этой неделе за покупками, кто готовит?", "Who shops and who cooks this week?"),
            L("b", "אֲנִי הַקְּנִיּוֹת בָּרִאשׁוֹן, אַתְּ הַבִּשּׁוּל עַד רְבִיעִי, וְאַחַר כָּךְ מִתְחַלְּפִים.", "Я за покупками в воскресенье, ты готовишь до среды, потом меняемся.", "I shop on Sunday, you cook until Wednesday, then we swap."),
        ],
        [
            R("סָגוּר, אֲנִי כּוֹתֵב רְשִׁימָה.", "Договорились, пишу список.", "Deal, I'll write a list.", True),
            R("כַּרְטִיס אָדֹם.", "Красный билет.", "A red ticket.", False),
            R("הַכֶּלֶב יָשֵׁן.", "Собака спит.", "The dog is asleep.", False),
        ],
    ),
    d(
        "expert-work",
        "Клиент на взводе",
        "A tense client",
        [
            L("a", "הַלָּקוֹחַ יָצָא מֵהַכֵּלִים בַּשִּׂיחָה. מָה עוֹנִים?", "Клиент вышел из себя на звонке. Что отвечаем?", "The client lost it on the call. What do we reply?"),
            L("b", "קֹדֶם כֹּל סְלִיחָה קְצָרָה, אַחַר כָּךְ תַּאֲרִיךְ תִּקּוּן. בְּלִי לְהִתְוַכֵּחַ עַל הַטּוֹן.", "Сначала короткое извинение, потом дата исправления. Без спора про тон.", "First a short apology, then a fix date. Don't argue about the tone."),
        ],
        [
            R("אֲנִי אֶכְתֹּב כָּכָה וְאַעֲבִיר לְךָ לִפְנֵי הַשִּׁלּוּחַ.", "Напишу так и покажу тебе до отправки.", "I'll write it that way and pass it by you before sending.", True),
            R("נִקְנֶה בָּנָנוֹת.", "Купим бананы.", "We'll buy bananas.", False),
            R("הַמָּטוֹס מְאֻחָר.", "Самолёт опаздывает.", "The plane is late.", False),
        ],
    ),
    d(
        "expert-home",
        "Соседи и ремонт",
        "Neighbors and renovation",
        [
            L("a", "הַשְּׁכֵנִים מַתְחִילִים שִׁפּוּץ בָּרִאשׁוֹן. כָּתְבוּ בַּקְּבוּצָה.", "Соседи начинают ремонт в воскресенье. Написали в чат.", "The neighbors start renovation on Sunday. They wrote in the group."),
            L("b", "אָז נָכִין אֶת הַיְּלָדִים: בַּבֹּקֶר נֵצֵא מִן הַבַּיִת, בַּצָּהֳרַיִם נַחֲזֹר.", "Тогда подготовим детей: утром уйдём из дома, в обед вернёмся.", "Then we'll prep the kids: out in the morning, back at noon."),
        ],
        [
            R("טוֹב, אֲנִי אֶזְמִין אוֹתָם לְקָפֶה אֵצֶל מָיָה.", "Хорошо, приглашу их на кофе к Майе.", "Good, I'll invite them for coffee at Maya's.", True),
            R("כּוֹס יַיִן.", "Бокал вина.", "A glass of wine.", False),
            R("הַחֻלְצָה שְׁחֹרָה.", "Рубашка чёрная.", "The shirt is black.", False),
        ],
    ),
]

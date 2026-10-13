"""Единая латинская транскрипция с никуда: h=ה, kh=ח, sh=ש, ts=צ. Без кириллицы."""

VOWEL = {
    "\u05B0": "e",
    "\u05B1": "e",
    "\u05B2": "a",
    "\u05B3": "o",
    "\u05B4": "i",
    "\u05B5": "e",
    "\u05B6": "e",
    "\u05B7": "a",
    "\u05B8": "a",
    "\u05B9": "o",
    "\u05BA": "o",
    "\u05BB": "u",
    "\u05C7": "o",
}

SKIP = {chr(c) for c in range(0x0591, 0x05A0)} | set("\u05A0\u05A1\u05A2\u05A3\u05A4\u05A5\u05A6\u05A7\u05A8\u05A9\u05AA\u05AB\u05AC\u05AD\u05AE\u05AF\u05BD\u05BF\u05C0\u05C4\u05C5")

CYR = str.maketrans(
    {
        "а": "a", "б": "b", "в": "v", "г": "g", "д": "d", "е": "e", "ё": "e",
        "ж": "zh", "з": "z", "и": "i", "й": "y", "к": "k", "л": "l", "м": "m",
        "н": "n", "о": "o", "п": "p", "р": "r", "с": "s", "т": "t", "у": "u",
        "ф": "f", "х": "kh", "ц": "ts", "ч": "ch", "ш": "sh", "щ": "sh",
        "ъ": "", "ы": "y", "ь": "", "э": "e", "ю": "yu", "я": "ya",
        "\u0301": "",
    }
)


def strip_nikud(text: str) -> str:
    return "".join(ch for ch in text if not ("\u0591" <= ch <= "\u05C7"))


def latin_from_cyrillic(text: str) -> str:
    lowered = text.lower().translate(CYR)
    return " ".join(lowered.split())


def romanize(text: str) -> str:
    if not text:
        return ""
    letters = []
    i = 0
    n = len(text)
    while i < n:
        ch = text[i]
        if ch in SKIP or ("\u05B0" <= ch <= "\u05C7" and ch not in "\u05BC\u05C1\u05C2"):
            i += 1
            continue
        if ch in " \t\n":
            letters.append({"sp": True})
            i += 1
            continue
        if ch in ".,!?;:":
            letters.append({"p": ch})
            i += 1
            continue
        if ch in "-־":
            letters.append({"p": "-"})
            i += 1
            continue
        if not ("\u05D0" <= ch <= "\u05EA"):
            if "\u0400" <= ch <= "\u04FF":
                letters.append({"p": latin_from_cyrillic(ch)})
            elif ch.isascii() and ch not in "\"'()[]«»":
                letters.append({"p": ch.lower()})
            i += 1
            continue

        cluster = ch
        i += 1
        while i < n and ("\u0591" <= text[i] <= "\u05C7"):
            cluster += text[i]
            i += 1
        vowels = [VOWEL[c] for c in cluster if c in VOWEL]
        letters.append(
            {
                "ch": ch,
                "dagesh": "\u05BC" in cluster,
                "sin": "\u05C2" in cluster,
                "vowel": vowels[0] if vowels else "",
                "sheva": "\u05B0" in cluster and vowels == ["e"],
            }
        )

    out = []
    word_start = True
    last_was_vowel = False
    for idx, item in enumerate(letters):
        if item.get("sp"):
            if out and out[-1] != " ":
                out.append(" ")
            word_start = True
            last_was_vowel = False
            continue
        if "p" in item:
            out.append(item["p"])
            word_start = item["p"] in "- "
            last_was_vowel = False
            continue
        ch = item["ch"]
        vowel = item["vowel"]
        dagesh = item["dagesh"]
        nxt = next((x for x in letters[idx + 1 :] if "ch" in x or x.get("sp") or "p" in x), None)
        is_last = nxt is None or nxt.get("sp") or "p" in (nxt or {})

        if item["sheva"] and not word_start:
            vowel = ""

        if ch == "ו" and (vowel in ("o", "u") or (dagesh and not vowel)):
            out.append(vowel if vowel else "u")
            last_was_vowel = True
            word_start = False
            continue
        if ch == "ו" and vowel == "":
            # mater / consonant
            cons = "v"
            out.append(cons)
            last_was_vowel = False
            word_start = False
            continue
        if ch == "י" and vowel == "" and last_was_vowel:
            word_start = False
            continue
        if ch == "י" and vowel == "i" and last_was_vowel:
            prev = out[-1] if out else ""
            out.append("i" if prev.endswith("i") else "yi")
            last_was_vowel = True
            word_start = False
            continue
        if ch in "אה" and vowel == "" and is_last:
            word_start = False
            continue
        if ch == "א" and vowel == "":
            word_start = False
            continue
        if ch == "ע" and vowel == "":
            word_start = False
            continue

        if ch == "א":
            cons = ""
        elif ch == "ב":
            cons = "b" if dagesh or word_start else "v"
        elif ch == "ג":
            cons = "g"
        elif ch == "ד":
            cons = "d"
        elif ch == "ה":
            cons = "h"
        elif ch == "ו":
            cons = "v"
        elif ch == "ז":
            cons = "z"
        elif ch == "ח":
            cons = "kh"
        elif ch == "ט":
            cons = "t"
        elif ch == "י":
            cons = "y"
        elif ch in "ךכ":
            cons = "k" if dagesh else "kh"
        elif ch == "ל":
            cons = "l"
        elif ch in "םמ":
            cons = "m"
        elif ch in "ןנ":
            cons = "n"
        elif ch == "ס":
            cons = "s"
        elif ch == "ע":
            cons = ""
        elif ch in "ףפ":
            cons = "p" if dagesh or word_start else "f"
        elif ch in "ץצ":
            cons = "ts"
        elif ch == "ק":
            cons = "k"
        elif ch == "ר":
            cons = "r"
        elif ch == "ש":
            cons = "s" if item["sin"] else "sh"
        elif ch == "ת":
            cons = "t"
        else:
            cons = ""

        if dagesh and cons in ("l", "m", "n") and not word_start:
            cons = cons * 2

        piece = cons + vowel
        out.append(piece)
        last_was_vowel = bool(vowel) or piece[-1:] in "aeiou"
        word_start = False

    text_out = "".join(out)
    text_out = text_out.replace("--", "-")
    return " ".join(text_out.split()).strip(" '")


if __name__ == "__main__":
    samples = {
        "שָׁלוֹם": "shalom",
        "תּוֹדָה": "toda",
        "מֶמְשָׁלָה": "memshala",
        "יַאלָּה": "yalla",
        "הָיִיתִי": "hayiti",
        "סַבָּבָה": "sababa",
        "אַחְלָה": "akhla",
    }
    for src, expect in samples.items():
        got = romanize(src)
        print(f"{src} -> {got} (want {expect}) {'OK' if got == expect else 'NO'}")

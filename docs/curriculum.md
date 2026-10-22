# Curriculum map

Levels follow Israeli ulpan names and a CEFR overlay. Mapping is pedagogical, not a certified CEFR exam.

Five **courses** share this tree. Target language is always Modern Israeli Hebrew. Source (UI + gloss + translation-grade) is one of: Russian, Ukrainian, English, Spanish, French.

| Course id | Pair | Default UI |
| --- | --- | --- |
| `he-ru` | Hebrew↔Russian | ru |
| `he-uk` | Hebrew↔Ukrainian | uk |
| `he-en` | Hebrew–English | en |
| `he-es` | Hebrew↔Spanish | es |
| `he-fr` | Hebrew↔French | fr |

Progress (XP, completions, streak on the course record) is **per course**. Hearts stay on the account.

uk / es / fr strings shipped here are **real drafts** with editorial `l10n_status: in_review`. They are not silently marked approved. en / ru / he curriculum copy is `approved`.

| Product level | Ulpan | CEFR band | Lesson target | Vocab target | Niqqud default |
| --- | --- | --- | --- | --- | --- |
| Starter | pre-Aleph | pre-A1 | 80 | ~500 by the end of Aleph ramp | always on |
| Beginner | Aleph | A1–A2 | 180 | ~1500 | on |
| Elementary | Bet | A2–B1 | 180 | ~3000 | on for new words |
| Intermediate | Gimel | B1–B2 | 150 | ~6000 | off; optional |
| Upper | Dalet | B2–C1 | 120 | ~8000 | off |
| Advanced | Hey | C1–C2 | 100 | 10000+ slang/idioms | off |

The **schema and path** exist for the whole program (`biti/catalog.py`). Playable rows have exercises. The rest are `status: planned` (titled, themed, sequenced — not empty placeholders and not fake drills).

## Tracks

1. **Alef-Bet & Script** — print, cursive *ktav yad*, sofiyot, lookalikes, dagesh, character drills.
2. **Niqqud & Reading**
3. **Pronunciation**
4. **Grammar**
5. **Roots & Verbs**
6. **Vocabulary**
7. **Conversation**
8. **Listening** (optional while TTS is unavailable)
9. **Spoken / slang / SMS**
10. **Formal register**
11. **Advanced reading** — public-domain / licensed only

## Game loop (original Biti house — not Duolingo chrome)

Path of **units → skills → nodes**. Bite-size lessons (5–12 items). XP, hearts, streak, daily goal, combo on consecutive correct, mascot window glow, tap-tiles, matching pairs, listen-and-tap / type-what-you-hear when audio exists (honest skip otherwise), character drills, legendary/boss chests, practice hub.

## Published vs planned

Counts from `catalog_stats()` plus `all_lesson_specs()` (playable). Shared Hebrew tree; five source languages.

| Level | Ulpan | Mapped nodes | Published playable | Planned |
| --- | --- | ---: | ---: | ---: |
| Starter | pre-Aleph | 134 | 19 | 115 |
| Beginner | Aleph | 170 | 14 | 156 |
| Elementary | Bet | 162 | 0 | 162 |
| Intermediate | Gimel | 144 | 0 | 144 |
| Upper | Dalet | 102 | 0 | 102 |
| Advanced | Hey | 96 | 0 | 96 |
| **Total** | | **808** | **33** | **775** |

Per language pair (`he-ru`, `he-uk`, `he-en`, `he-es`, `he-fr`): the same 33 published lessons are playable; remaining nodes are titled/sequenced `planned` (not empty placeholders). uk / es / fr prompts are authored drafts with `l10n_status: in_review`.

Playable published slugs:

**pre-Aleph / Starter:** `script-alef-he`, `drill-alef-he`, `script-vav-lamed`, `drill-vav-lamed`, `script-mem-tav`, `drill-mem-tav`, `script-sofiyot`, `script-lookalikes`, `script-dagesh-ktav`, `vocab-greetings`, `tiles-greetings`, `match-greetings`, `words-yes-no`, `vocab-family`, `words-ima-aba`, `vocab-home`, `vocab-numbers`, `vocab-colors`, `boss-starter`

**Aleph / Beginner:** `grammar-gender`, `grammar-definite`, `grammar-adjectives`, `grammar-pronouns`, `roots-shoresh`, `verbs-paal-present`, `vocab-shuk`, `convo-introductions`, `convo-shuk`, `convo-transport`, `convo-cafe`, `convo-phone`, `convo-emergency`, `boss-beginner`

Bet / Gimel / Dalet / Hey: **planned units only** (past tense, smichut, clinic, rent, future, binyanim, slang, idioms, licensed reading, legendary keys). No fabricated exercises.

Priority for the next content drop: finish remaining pre-Aleph planned nodes in the first ten units, then the rest of Aleph, still in all five source languages, still `in_review` until native sign-off.

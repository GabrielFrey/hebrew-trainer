# Translation quality audit — Biti Hebrew / Biti Ivrit

**Date:** 22 Oct 2026  
**Branch:** `biti-ivrit`  
**Locales:** `en`, `ru`, `uk`, `es`, `fr` (Hebrew UI `he` checked for parity only)  
**Status rule:** `uk` / `es` / `fr` stay **`in_review`**. Nothing in this audit was marked `approved`. `en` / `ru` / `he` were already approved by prior authorship; this pass did not re-approve them.

## Method

1. Flattened all six UI dictionaries (`packages/i18n/src/*.ts`) and compared keys, `{placeholders}`, and plural leaves (`one` / `few` / `many` / `other`).
2. Read every UI string for meaning vs the English/Hebrew source, register, terminology, punctuation, and overflow risk.
3. Localized published lesson titles, objectives, explanations, prompts, choice labels, and vocab glosses through `draft_l10n.py` + `title_l10n.py`, checking glosses against the Hebrew lemma (gender/number, binyan, idiom).
4. Filled catalog skill/unit/planned titles so Russian is never a copy of English; Ukrainian is never a copy of Russian.
5. Reviewed App Store / Play listings per locale.
6. Added tests so missing keys, placeholder drift, and incomplete plural forms fail CI.

Hebrew source of truth for lesson items is the lemma / pointed form / accepted typing string. UI source of truth for product chrome is the English dictionary after the “Biti Hebrew” rename; other locales keep **Biti Ivrit**.

## Per-locale counts

Counts are **checked strings**, not unique words. “Lesson strings” = published title + objective + explanation + exercise prompt + vocab gloss. “Catalog strings” = unit/skill/lesson title + objective on the full pre-Aleph→Hey map (mostly planned nodes). “Fixed” = clear errors changed in this audit. “Uncertain” = items listed for a native speaker (not auto-approved).

| Locale | UI keys | Lesson strings | Catalog strings | Store files | Checked (sum) | Fixed | Still uncertain | `l10n_status` |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| en | 109 | 490 | 1747 | 2 | 2348 | 2 | 6 | `approved` (pre-existing) |
| ru | 109 | 490 | 1747 | 2 | 2348 | 14 | 11 | `approved` (pre-existing) |
| uk | 109 | 490 | 1747 | 2 | 2348 | 28 | 18 | **`in_review`** |
| es | 109 | 490 | 1747 | 2 | 2348 | 16 | 14 | **`in_review`** |
| fr | 109 | 490 | 1747 | 2 | 2348 | 24 | 16 | **`in_review`** |

Parity: **109 / 109 keys** in every locale including `he`. Published lesson `en/ru/uk/es/fr` fields are **490 / 490** filled (0 missing). Catalog `en/ru/uk/es/fr` fields are **1747 / 1747** filled. 21 Spanish and 28 French lesson glosses still match the English lemma on purpose (letter names, *shoresh*, *pa'al*, *kaf sofit*) — listed for native review, not treated as missing.

Russian `ё` is used only in dictionary forms that almost always keep it in teaching copy (`ещё`, `зелёный`, `жёлтый`, `чёрный`). Other words stay without `ё`. That choice is consistent and is listed as uncertain.

## Notable fixes

| Locale | Key / item | Before | After | Reason |
| --- | --- | --- | --- | --- |
| uk | `brand.tagline` | Сучасна іврит | Сучасний іврит | Іврит is masculine; adjective must agree. |
| uk | `onboarding.motivation` | Навіщо ви вчите іврит? | Навіщо ви вивчаєте іврит? | *Вчити* here is a Russian calque of *учить*; *вивчати* is the usual Ukrainian verb. |
| uk | `lesson.planned` | …це не заглушка. | …це не фіктивний урок. | *Заглушка* is Russian programmer slang. |
| uk | `states.empty` | Поки порожньо. | Тут поки нічого немає. | *Порожньо* calques Russian *пусто*. |
| uk | `states.error` | Щось пішло не так. | Сталася помилка. | Avoids the Russian *пошло не так* calque. |
| uk | `checkpoint.mistakes` | Ліміт помилок | Обмеження помилок | *Ліміт* is an unnecessary Russian/English loan. |
| uk | `practice.weak` | Уроки для шліфування | Уроки, які варто підтягти | Less metallic; matches the SRS “polish” sense. |
| uk | store body | У уроках | В уроках | *В* before a vowel. |
| uk | extra drills | Тренажер א–ה | Тренування літер א–ה | *Тренажер* is Russian; Ukrainian title should not copy it. |
| uk | extra match lesson | Пари: привітання | Зіставлення: вітання | *Пари* reads as Russian *пары*; *зіставлення* is the UI term. |
| uk | stage `starter` | До алефа | Перед алефом | Stops copying the Russian stage title. |
| ru | `lesson.incorrect` | Не то | Не совсем | Matches English “Not quite”; *Не то* is brusque. |
| ru | catalog “Native media clips” | Родные медиафрагменты | Фрагменты израильских медиа | *Родной* means kin, not “native-speaker media”. |
| ru | catalog “Clinic” | Поликлиника | Больничная касса (купат холим) | Source is קופת חולים, not a generic clinic. |
| ru | “Please and sorry” | Пожалуйста и извини | Пожалуйста и прости | *Извини* is intimate 2sg; סליחה is broader. |
| ru | sofiot glosses | kaf sofit (English) | каф софит | Vocab `ru` had been filled with the English name. |
| ru | “I am lost” / אבדתי | я потерялся | я потерялся / потерялась | Hebrew 1cs is gender-neutral; Russian past is not. |
| es | `onboarding.title` | Bienvenido a Biti Ivrit | Te damos la bienvenida a Biti Ivrit | Gender-neutral; *Bienvenido* is masculine-default. |
| es | `lesson.niqqudOn/Off` | sí / no | activado / desactivado | Toggle next to “Niqqud” was too terse. |
| es | `keyboard.clear` | Vaciar | Borrar todo | Matches the French/English “clear all” action. |
| es | “Match letter and name” | Une letra y nombre | Une la letra con el nombre | Missing article; read as a fragment. |
| es | store | esos ítems | esos ejercicios | *Ítems* is an English loan. |
| es | café / shuk prompts | me pones un kilo (already) | kept; added ¿ on question glosses | Spanish questions need ¿. |
| fr | `onboarding.skip` | Commencer à alef | Commencer par alef | *Commencer à* + letter name is a calque. |
| fr | `path.morePlanned` | {count} leçon encore sur la carte | {count} leçon de plus sur la carte | *Encore* read as “still”, not “more remaining”. |
| fr | `states.unavailable` | Fonction indisponible. | Cette fonction n’est pas disponible. | Full sentence; less MT-telegraphic. |
| fr | `practice.title` | Entraînement | Pratique | Same term as `nav.practice`. |
| fr | `profile.loadingCapabilities` | Chargement des capacités… | Chargement des fonctions… | *Capacités* is a false friend of English “capabilities”. |
| fr | punctuation | `?` / `%` / `:` with ASCII space | U+00A0 before `?`, `%`, `:` | French typographic space. |
| fr | “Disagree politely” | Contredire poliment | Exprimer un désaccord poli | *Contredire* is “contradict”, not “disagree politely”. |
| fr | store | ces items | ces exercices | English *items*. |
| he | `path.morePlanned.one` | שיעור נוסף אחד במפה | {count} שיעור נוסף במפה | Placeholder set must match English `{count}`. |
| all | catalog `_loc(skill)` | crashed (`ru` required) | `ru` optional; filled from titles | Seed/API could not boot. |
| all | planned objectives | English theme inside ru/uk/es/fr | Theme looked up per locale | Stopped leaking English into mapped copy. |
| all | conversation Russian | English gloss passed as `ru` | Real Russian 5-tuples | MC “meaning of X” showed English in the Russian course. |

## Terminology (locked this pass)

| Concept | en | ru | uk | es | fr |
| --- | --- | --- | --- | --- | --- |
| Product name | Biti Hebrew | Biti Ivrit | Biti Ivrit | Biti Ivrit | Biti Ivrit |
| Niqqud | Niqqud | Огласовки | Нікуд | Niqqud | Niqqud |
| Stage gate | Stage gate | Врата этапа | Брама етапу | Puerta de etapa | Porte d’étape |
| Test out | Test out | Сдать досрочно | Скласти достроково | Examinarte ahora | Valider plus tôt |
| Shoresh | shoresh | шореш | шореш | shoresh | shoresh |
| Pa'al / Qal | Pa'al / Qal | Пааль | Пааль | pa'al | pa'al |

Ukrainian keeps **абетка / мапа / брама / нікуд / пробіл** and does not copy Russian **алфавіт / карта / ворота / огласовки / пробел**.

## Items that need a native-speaker review

Do **not** flip `l10n_status` to `approved` until a named native reviewer signs these (and the rest of the draft). `editorial.native_reviewer` stays `null`.

### All in-review locales (uk, es, fr)

1. First-person gendered Hebrew (אני גר, צריך עזרה, לא מרגיש טוב, אבדתי) — dual glosses vs teaching only masculine first.
2. אבדתי as “I am lost”: literary/biblical vs Israeli הלכתי לאיבוד / אני אבוד.
3. Phone הלו — uk *алло*, es *¿aló?* (LatAm) vs Spain *¿diga?*, fr *allô*.
4. נעים מאוד as “nice to meet you” vs more literal “very pleasant”.
5. בבקשה covering both “please” and “you’re welcome”.
6. Game metaphor (gate / legendary / combo / hearts) — keep or replace with school language.
7. Letter-name transcriptions (Һе, ґімель, jet, Hé, Tsadé).
8. Binyan labels (Пааль / Піель / Гіфіль vs Qal / Pi'el / Hif'il).
9. Long chrome: `path.intro`, `checkpoint.startBody`, `onboarding.reviewFlag` on a 320px onboarding card.
10. 21 es / 28 fr glosses identical to English (letter names, technical terms).

### Ukrainian

11. Product-wide *іврит* (masculine) vs sometimes-heard feminine agreement.
12. *Репатріація* vs *алія* for עלייה.
13. *Нікуд* vs *ніккуд*.
14. *Залік* for a passed gate.
15. *Біті* transliteration of the mascot name.
16. Store *однозначна перевірка* for “deterministic grading”.
17. *Учень* (masculine default) on onboarding.

### Spanish

18. Tú throughout vs usted (Spain / formal).
19. *Shuk* vs *mercado*; *ulpán*; *séquel* vs *shekel*.
20. *Kupat holim (clínica)* for קופת חולים.
21. *Aliyá* spelling.
22. *Te damos la bienvenida* length vs *Bienvenido/a*.

### French

23. Vous in UI vs any tu that slipped into lesson drafts.
24. *Oulpan* / *shouk* / *alef* vs *souk* / *aleph*.
25. Thin space vs NBSP before `;` `!` in longer grammar notes.
26. *Juste* as the “correct” chip.
27. *Kupat holim (caisse maladie)*.

### Russian (already approved — still flag, do not silent-reapprove)

28. *Ё* policy (only a handful of words).
29. *Врата этапа* vs *контрольная* / *зачёт*.
30. *Не совсем* vs *Неверно*.
31. *Бити* vs *Бити* Latin *Biti* in the brand line.

### English (already approved)

32. “Biti opened a window for you.”
33. “Coming later — on the map, not a fake lesson.”
34. Feminine counting set (אחת…עשר) taught first — pedagogical, not a translation bug.
35. Gloss “he wrote” for כתב (pa'al 3ms past) vs citation-form “write”.

## Tests added

File: `apps/api/tests/test_i18n_parity.py`

- `test_no_missing_keys_across_locales` — same key set in en/ru/uk/es/fr/he.
- `test_placeholder_sets_match` — `{name}` sets identical per key.
- `test_plural_forms_are_valid` — `one`/`other` everywhere; `few`/`many` for ru/uk; `{count}` in every form; `one != other`.
- `test_slavic_and_french_plural_categories` — CLDR-style ru/uk one-few-many; French 0+1 as `one`.
- `test_uk_es_fr_l10n_status_stays_in_review` — Python `L10N_STATUS` and `packages/i18n` flags.
- `test_published_lesson_locales_are_filled` — every published title/objective/explanation/prompt/vocab has en/ru/uk/es/fr.
- `test_catalog_titles_are_not_english_in_ru` — catalog ru/uk/es/fr present and ru ≠ en.
- `test_spanish_ui_questions_use_inverted_marks`
- `test_french_ui_uses_nbsp_before_question_and_percent`
- `test_conversation_russian_glosses_are_russian`
- `test_ukrainian_tagline_agrees_in_gender`

## What this audit did not do

- No native-speaker sign-off. Do not ship uk/es/fr store listings as final.
- No device-length QA of every string on iPhone SE / Android small; overflow is flagged, not measured.
- Planned Bet–Hey lesson *bodies* are titles/objectives only (no vocab yet).
- TTS / speech copy stays on the honest “unavailable” strings.

## How to re-run

```bash
apps/api/.venv/bin/pytest apps/api/tests/test_i18n_parity.py apps/api/tests/test_en_locale.py apps/api/tests/test_courses.py
```

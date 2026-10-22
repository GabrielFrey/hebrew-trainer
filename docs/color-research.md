# Color research for Biti Hebrew

**Status:** decided. Tokens live in `packages/design-tokens/src/index.ts` and `apps/web/src/app/globals.css`.  
**Audience:** adults and children learning Modern Hebrew, UI in RU / UK / EN / ES / FR.  
**Constraint:** not Duolingo green. Feedback never uses color as the only cue.

This note separates **evidence** (peer-reviewed studies, WCAG 2.2, Apple HIG, Material color system, cited UX research) from **product opinion**. Where the literature is weak, mixed, or culture-dependent, that is stated in the same paragraph as the claim.

Contrast ratios below were computed from relative luminance in WCAG 2.2, using the sRGB piecewise transfer in the definition of *relative luminance*. Values are **not rounded** when compared to the 4.5:1 / 3:1 thresholds ([Understanding SC 1.4.3](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html)).

---

## 1. What the standards actually require

### Evidence

**WCAG 2.2** ([W3C Recommendation](https://www.w3.org/TR/WCAG22/)):

| SC | Rule we treat as a ship gate |
| --- | --- |
| [1.4.3 Contrast (Minimum)](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html) | Text and images of text ≥ **4.5:1**. Large text (18pt / 14pt bold, ≈ 24px / 18.5px) ≥ **3:1**. |
| [1.4.11 Non-text Contrast](https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html) | UI components and graphical objects needed to understand content ≥ **3:1** against adjacent colors. |
| [1.4.1 Use of Color](https://www.w3.org/WAI/WCAG22/Understanding/use-of-color.html) | Color is not the only visual means of conveying information. Icon, text, or pattern must travel with hue. A lightness difference of ≥ 3:1 can count as an extra cue, but identifying “this outline is the valid color” still needs a non-color indicator. |
| [1.4.12 Text Spacing](https://www.w3.org/WAI/WCAG22/Understanding/text-spacing.html) | Content remains readable when line height is 1.5× font size. Relevant to niqqud, which occupies extra vertical space. |

WCAG contrast is a **lightness** metric. Hue and saturation do not help people with low contrast sensitivity, and they do not help most color-vision deficiencies either (Understanding 1.4.3). Passing 4.5:1 does not make two hues distinguishable to a protanope.

**Apple Human Interface Guidelines — Color** ([developer.apple.com/design/human-interface-guidelines/color](https://developer.apple.com/design/human-interface-guidelines/color)):

- Prefer system semantic colors over one-off RGB so they adapt to light/dark, Increase Contrast, and tinted environments.
- Test with the color-filters accessibility setting (red/green and blue/yellow filters).
- Avoid conveying meaning with color alone — same requirement as WCAG 1.4.1.

**Apple HIG — Dark Mode** ([dark-mode](https://developer.apple.com/design/human-interface-guidelines/dark-mode)):

- Dark interfaces use a dark *canvas* and elevated, slightly lighter *surfaces*. Pure `#000000` is discouraged because it increases halation of light text.
- Recolor, do not merely invert. Saturated brand colors usually need a lighter, less-chroma companion in dark mode.

**Apple HIG — Materials / Liquid Glass** ([materials](https://developer.apple.com/design/human-interface-guidelines/materials), [Adopting Liquid Glass](https://developer.apple.com/documentation/technologyoverviews/adopting-liquid-glass)):

- Use **Regular** glass for chrome next to content. Ultra-clear / interactive glass is for isolated controls, not dense reading.
- Do not stack glass on glass.
- Honor **Reduce Transparency**: swap to an opaque surface.
- Text contrast is measured against the *composite* behind the type, not against the glass fill in isolation.

**Apple HIG — App Icons** ([app-icons](https://developer.apple.com/design/human-interface-guidelines/app-icons)):

- 1024×1024, **no transparency**, **no pre-rounded corners**. The system applies the mask.
- Light, dark, and tinted (template) variants. Keep a simple silhouette that survives 29pt.

**Material Design 3 color system** ([system overview](https://m3.material.io/styles/color/system/overview), [roles](https://m3.material.io/styles/color/roles), [static / HCT](https://m3.material.io/styles/color/static/baseline)):

- Seed a hue, then assign **roles** (primary, secondary, tertiary, error, surfaces, outlines) at specified tones rather than picking isolated hexes.
- Light surfaces sit at high tone; dark surfaces sit at low tone with higher-chroma *on-surface* roles.
- Error is a role, not “whatever red is in the brand.” Primary is allowed to be something other than green.

### Opinion (how we apply the standards)

We keep semantic roles in the token file (`primary`, `success`, `error`, `warning`, plus the older names `indigo` / `olive` / `pomegranate` so existing class names keep working). Lesson Hebrew never sits on glass. Chrome may.

---

## 2. Calm vs energizing hues, focus, and retention

### Evidence — stronger

**Valdez & Mehrabian (1994).** *Effects of color on emotions.* Journal of Experimental Psychology: General, 123(4), 394–409. [https://doi.org/10.1037/0096-3445.123.4.394](https://doi.org/10.1037/0096-3445.123.4.394)

Saturation and brightness predicted pleasure and arousal **more than hue**. Blue-ish samples were more pleasant; red-ish samples were more arousing. Adult, mostly Western lab sample.

**Wilms & Oberfeld (2018).** *Color and emotion: effects of hue, saturation, and brightness.* Psychological Research, 82, 896–914. [https://doi.org/10.1007/s00426-017-0880-8](https://doi.org/10.1007/s00426-017-0880-8)

Replication-minded follow-up: chroma and lightness again dominate. High saturation raises arousal. Hue effects are smaller once saturation is controlled.

**Ou, Luo, Woodcock & Wright (2004).** *A study of colour emotion and colour preference. Part I.* Color Research & Application, 29(3), 232–240. [https://doi.org/10.1002/col.20010](https://doi.org/10.1002/col.20010)

Factor structure of color emotion (activity, weight, heat) across British and Chinese observers. Cool, low-chroma samples load as calmer / less “active.” Cross-cultural agreement was better on activity than on preference.

**Elliot, Maier, Moller, Friedman & Meinhardt (2007).** *Color and psychological functioning: the effect of red on performance attainment.* Journal of Experimental Psychology: General, 136(1), 154–168. [https://doi.org/10.1037/0096-3445.136.1.154](https://doi.org/10.1037/0096-3445.136.1.154)

Brief exposure to red before an achievement task **impaired** performance relative to green or gray. Effect is about *task context* (evaluation, avoidance), not about “red is bad in UI.” Sample: undergraduates.

**Elliot & Maier (2014).** *Color psychology: effects of perceiving color on psychological functioning in humans.* Annual Review of Psychology, 65, 95–120. [https://doi.org/10.1146/annurev-psych-010213-115035](https://doi.org/10.1146/annurev-psych-010213-115035)

Review: color effects are real but **highly context-dependent**. Authors warn against treating hue as a universal lever for learning.

**Kwallek, Lewis, Lin-Hsiao & Woodson (1996).** *Effects of nine monochromatic office interior colors on clerical tasks and worker mood.* Color Research & Application, 21(6), 448–458. [https://doi.org/10.1002/(SICI)1520-6378(199612)21:6\<448::AID-COL5\>3.0.CO;2-W](https://doi.org/10.1002/(SICI)1520-6378(199612)21:6<448::AID-COL5>3.0.CO;2-W)

Red interiors were rated more stimulating; some error rates rose. Blue-green interiors were rated calmer. Office walls, not screens; ecological validity for an app is limited.

**Bartram, Patra & Stone (2017).** *Affective Color in Visualization.* CHI 2017. [https://doi.org/10.1145/3025453.3026041](https://doi.org/10.1145/3025453.3026041)

HCI evidence that palettes can be designed for “calm” vs “exciting” affect if lightness/chroma are controlled. Useful as a method, not as a prescription of particular hexes.

### Evidence — weak, failed, or often misquoted

**Mehta & Zhu (2009).** *Blue or red? Exploring the effect of color on cognitive task performances.* Science, 323(5918), 1226–1229. [https://doi.org/10.1126/science.1169144](https://doi.org/10.1126/science.1169144)

Claimed red aids detail / red “avoidance” and blue aids creative / “approach” tasks. **Do not treat this as settled.** Failed and qualified replications followed, including Steele (2014), *Failure to replicate the Mehta and Zhu (2009) color-priming effect on anagram performance,* Psychonomic Bulletin & Review / related commentary, and the broader caution in Elliot & Maier (2014). We **do not** pick blue because it “improves memory.”

**Dzulkifli & Mustafar (2013).** *The influence of colour on memory performance: a review.* Malaysian Journal of Medical Sciences, 20(2), 3–9. [https://www.ncbi.nlm.nih.gov/pmc/articles/PMC3743993/](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC3743993/)

Narrative review: color *can* aid memory when it is a distinctive cue (von Restorff), not because a particular hue is mnemonic. Evidence quality is mixed; many studies are underpowered classroom demos.

### Evidence — children vs adults

**Boyatzis & Varghese (1994).** *Children's emotional associations with colors.* The Journal of Genetic Psychology, 155(1), 77–85. [https://doi.org/10.1080/00221325.1994.9914760](https://doi.org/10.1080/00221325.1994.9914760)

US children linked bright colors with positive emotion and dark colors with negative emotion. Small, culture-bound sample.

**Hemphill (1996).** *A note on adults' color-emotion associations.* The Journal of Genetic Psychology, 157(3), 275–280. [https://doi.org/10.1080/00221325.1996.9914865](https://doi.org/10.1080/00221325.1996.9914865)

Adults also preferred brighter, lighter colors, with blue frequently named as pleasant. Again Western.

**Pope, Butler & Qualter (2012).** *Emotional understanding and color-emotion associations in children aged 7–8 years.* Child Development Research. [https://doi.org/10.1155/2012/975670](https://doi.org/10.1155/2012/975670)

Children can use color-emotion conventions, but agreement is imperfect. Do not rely on hue to teach “correct/wrong” to kids.

### Opinion

Lesson canvases stay **cool, low-chroma, high-lightness** (light) or **cool, mid-chroma on a dark navy canvas** (dark): that matches the calm / low-arousal region in Valdez & Mehrabian and Ou et al., without claiming a memory boost. Energy is isolated to a **warm CTA** (terracotta) and a **gold streak** accent so children still get a bright target. We reject red as the ambient lesson color because Elliot 2007 makes it a plausible distractor in evaluated tasks, and because red is already reserved for errors in Western UI convention.

---

## 3. Culture: RU / UK / EN / ES / FR

### Evidence

**Madden, Hewett & Roth (2000).** *Managing images in different cultures: a cross-national study of color meanings and preferences.* Journal of International Marketing, 8(4), 90–107. [https://doi.org/10.1509/jimk.8.4.90.19512](https://doi.org/10.1509/jimk.8.4.90.19512)

Blue was the most consistently liked color across the countries studied and associated with “high quality” / trustworthy. Black, brown, and gold meanings varied more. Sample is marketing students, not language learners, but it includes European clusters overlapping EN/ES/FR.

**Cyr, Head & Larios (2010).** *Colour appeal in website design within and across cultures: a multi-method evaluation.* International Journal of Human-Computer Studies, 68(1–2), 1–21. [https://doi.org/10.1016/j.ijhcs.2009.08.005](https://doi.org/10.1016/j.ijhcs.2009.08.005)

Website color appeal affected trust and satisfaction, and the *preferred* palette differed by culture (Canada, Germany, Japan). Blue-leaning schemes were relatively safe; highly localized “lucky” colors were not.

**Aslam (2006).** *Are you selling the right colour? A cross-cultural review of colour as a marketing cue.* Journal of Marketing Communications, 12(1), 15–30. [https://doi.org/10.1080/13527260500247827](https://doi.org/10.1080/13527260500247827)

Review: red is luck/celebration in several East Asian contexts and danger/stop in much of Europe. Our five UI languages are European (including Ukrainian and Russian). Traffic-light red/green is conventional there, but **green-as-brand** is also how Duolingo is recognized — a product reason to pick another success hue.

**Jacobs, Keown, Worthley & Ghymn (1991).** *Cross-cultural colour comparisons: global marketers beware!* International Marketing Review, 8(3). [https://doi.org/10.1108/eb008247](https://doi.org/10.1108/eb008247)

Older but widely cited: color-meaning tables are unstable across countries. Treat any single “Russians think X about blue” claim as anecdotal unless it is in a study.

### Opinion

For RU/UK/EN/ES/FR we assume Western traffic-light literacy (red ≈ stop / error, warm gold ≈ caution) and a generally positive reading of blue. We **do not** encode nation-specific flag colors into the product. Success is **teal**, not flag-green and not Duolingo green, so it remains “go” without looking like that brand.

Hebrew itself is RTL; that is independent of hue. Israeli Standard SI 5568 follows WCAG contrast; we apply the same numbers to Hebrew text as to Latin/Cyrillic.

---

## 4. Positive / negative feedback and color-blind safety

### Evidence

**WCAG 1.4.1** — color cannot be the only error/success cue. Sufficient techniques include G14 (text) and G111 (pattern). Failure F81 is “required or error fields identified by color differences only.”

**Harley (2016), Nielsen Norman Group.** *Visual Indicators to Differentiate Items in a List.* [https://www.nngroup.com/articles/visual-indicators-differentiators/](https://www.nngroup.com/articles/visual-indicators-differentiators/)

Quantitative click study (n = 96): users were about **37% faster** when indicators differed in **both color and icon** versus text alone. Icon-only beat color-only on some table tasks. Directly applicable to correct / almost / wrong sheets.

**Wong (2011).** *Points of view: Color blindness.* Nature Methods, 8, 441. [https://doi.org/10.1038/nmeth.1618](https://doi.org/10.1038/nmeth.1618)

Red/green is the worst default for categorical meaning. Recommend palettes that remain separable in grayscale and under deuteranopia.

**Okabe & Ito (2002/2008).** *Color Universal Design — how to make figures and presentations that are friendly to colorblind people.* [https://jfly.uni-koeln.de/color/](https://jfly.uni-koeln.de/color/)

The widely reused CUDO / “Okabe–Ito” palette: bluish green, orange, yellow, blue, vermillion — **not** saturated green vs saturated red.

**Brettel, Viénot & Mollon (1997).** *Computerized simulation of color appearance for dichromats.* JOSA A, 14(10), 2647–2655. [https://doi.org/10.1364/JOSAA.14.002647](https://doi.org/10.1364/JOSAA.14.002647)

Standard LMS-space simulation used in later tools.

**Machado, Oliveira & Fernandes (2009).** *A physiologically-based model for simulation of color vision deficiency.* IEEE Transactions on Visualization and Computer Graphics, 15(6), 1291–1298. [https://doi.org/10.1109/TVCG.2009.113](https://doi.org/10.1109/TVCG.2009.113)

Matrices we use in `scripts/check_contrast.py` for protanopia, deuteranopia, and tritanopia.

**Prevalence (context, not a palette rule):** roughly 8% of men and 0.5% of women of Northern European ancestry have some red-green deficiency (see Wong 2011). Our RU/UK/EN/ES/FR audience includes that cluster. Tritanopia is rare.

### Simulation result (this palette)

Success `#0C5F58` vs error `#9A3412` have almost the same lightness (**~1.03:1**). Under Machado protanopia / deuteranopia / tritanopia the two *hues* stay close (~1.0–1.3:1) and the sheet backgrounds also collapse (~1.0–1.2:1). **Hue cannot carry the meaning.**

What still works:

- Each sheet keeps **≥ 5.2:1** text-on-background under all three dichromacy simulations (see table in §8).
- Visible **✓ / ~ / ×** plus a text label (`Correct` / `Almost` / `Try again`) plus `role="status"`.
- Mascot face changes (smile / think / sad).

That is the WCAG 1.4.1 + NN/g recommendation, not an aesthetic extra.

### Opinion

We still color the sheets (teal wash vs apricot wash vs gold wash) for trichromats. We do not ship a red/green pair as the primary code. Terracotta error is warmer than teal success, which helps trichromats and does **not** harm dichromats because they have the icon and the word.

---

## 5. Dark mode and polarity

### Evidence

**Buchner & Baumgartner (2007).** *Text–background polarity affects performance irrespective of ambient illumination and colour contrast.* Ergonomics, 50(7), 1036–1063. [https://doi.org/10.1080/00140130701306413](https://doi.org/10.1080/00140130701306413)

**Positive polarity** (dark text on light ground) was faster and more accurate than negative polarity across lighting conditions.

**Piepenbrock, Mayr & Buchner (2013).** *Positive display polarity is particularly advantageous for small character sizes: implications for display design.* Human Factors, 55(4), 859–874. [https://doi.org/10.1177/0018720813509368](https://doi.org/10.1177/0018720813509368)  
(related: Piepenbrock, Mayr, Mund & Buchner, 2013, *Positive display polarity is advantageous for both younger and older adults,* Ergonomics. [https://doi.org/10.1080/00140139.2013.790485](https://doi.org/10.1080/00140139.2013.790485))

The advantage of dark-on-light grows as type gets smaller. Niqqud marks are smaller than the consonant, so they behave like “small character sizes.”

**Apple HIG Dark Mode** (link above): users still want dark UI at night; do not invert hue; keep a dark gray canvas rather than true black.

**Material 3 dark theme:** raise the chroma of key colors so they still look like themselves on dark surfaces; keep surfaces at distinct elevations.

### Opinion

Light mode is the default for lessons (positive polarity). Dark mode is a first-class theme, not an invert filter: canvas `#101820`, surface `#1A2432`, type `#E8EEF6`. Hebrew in dark mode uses the same 1.75–1.8 line-height and ≥ 32px lesson type so diacritics do not hairline.

---

## 6. Contrast on Liquid Glass / translucent surfaces

### Evidence

WCAG 1.4.3 is evaluated against the **rendered** background. A 86% white overlay on `#EEF2F7` composites to approximately `#FDFDFE`. Text must pass against that composite.

Apple: Regular glass; no glass-on-glass; Reduce Transparency → opaque.

Material / Android: scrims behind type on images; do not place body copy on an uncontrolled photo.

### Opinion / implementation

`--glass: rgba(255,255,255,0.86)` (light) and `rgba(26,36,50,0.86)` (dark). Ink on those composites is **16.09:1** and **13.72:1**. `prefers-reduced-transparency` sets `--glass` to `--paper`. Native iOS uses `GlassView` `glassEffectStyle="regular"` with the same fallback. Dense Hebrew (lesson prompt, niqqud, keyboard) stays on opaque `paper` / `sand`.

---

## 7. Legibility of Hebrew with niqqud

### Evidence

**WCAG 1.4.3 + 1.4.12.** Niqqud is body-or-smaller text, so it needs **4.5:1**, not the large-text 3:1. Line height 1.5× must not clip marks.

**Shimron (1993).** *The role of vowels in reading: a review of studies of English and Hebrew.* Psychological Bulletin, 114(1), 52–67. [https://doi.org/10.1037/0033-2909.114.1.52](https://doi.org/10.1037/0033-2909.114.1.52)

Pointed Hebrew is important for beginning readers; vowels are not optional decoration for that audience. Clipping or low-contrast niqqud is a literacy bug, not a style choice.

**Unicode Standard, Chapter 9 (Middle East-I — Hebrew).** Combining marks stack above and below the consonant (niqqud, dagesh, shin/sin dots). [https://www.unicode.org/versions/latest/chapter9.pdf](https://www.unicode.org/versions/latest/chapter9.pdf)

**Noto Sans Hebrew** (SIL OFL) is designed with mark positioning for screens; **Frank Ruhl Libre** is a reading face with generous vertical metrics. Both are the fonts in ADR 0004.

**Piepenbrock et al. (2013)** (above): small marks need higher contrast and benefit from positive polarity.

There is **no** high-quality RCT that says “use this hex for niqqud.” Claims that a particular hue “helps Hebrew learners remember” are unsupported.

### Opinion

- Lesson Hebrew: `clamp(1.65rem, 4vw, 2.15rem)`, line-height **1.75** (pointed) / **1.8** (reading), `lang="he"` + `dir="rtl"` + isolate.
- Color: `ink` on `sand` / `paper` / feedback sheets — all ≥ 13:1 in light mode, ≥ 7.7:1 in dark mode. Diacritics inherit that color; we do not paint niqqud in a lighter gray.
- Never put pointed words on glass.
- Dark mode uses a navy canvas, not black, to limit halo on thin marks.

---

## 8. Decided palette

Not Duolingo green (`#58CC02` and relatives). Primary is **Mediterranean indigo**. CTA / error is **pomegranate terracotta**. Success is **teal olive**. Warning / streak is **ink gold**. Neutrals are cool blue-grays.

### Light

| Role | Token | Hex | Why |
| --- | --- | --- | --- |
| Text | `ink` | `#142033` | Near-black navy; 14.55:1 on sand |
| Secondary text | `inkSoft` | `#3A4A5E` | 8.05:1 on sand (AA for helper copy) |
| Canvas | `sand` | `#EEF2F7` | Cool, low chroma (calm surfaces) |
| Canvas alt | `sandDeep` | `#E2E8F0` | Disabled / inset |
| Surface | `paper` | `#FFFFFF` | Cards, inputs |
| Primary | `primary` / `indigo` | `#184A82` | Blue trust cluster (Madden 2000; Cyr 2010); 8.97:1 with white |
| Secondary | `secondary` | `#5A4A9A` | Violet companion, 7.29:1 on white |
| Accent | `accent` | `#7C3AED` | Sparingly, 5.70:1 on white |
| CTA / error | `error` / `pomegranate` | `#9A3412` | Warm, not brand-green; 7.31:1 with white |
| Success | `success` / `olive` | `#0C5F58` | Teal (Okabe–Ito-ish), 7.52:1 with white |
| Warning | `warning` / `gold` | `#854D0E` | 6.85:1 with white |
| Outline | `line` | `#6B7787` | 4.05:1 on sand (UI 3:1) |
| Glass | `glass` | `rgba(255,255,255,0.86)` | Composite ~`#FDFDFE` |
| Correct sheet | `correctBg` | `#D7EDEA` | Success text 6.15:1 |
| Incorrect sheet | `incorrectBg` | `#FFEDD5` | Error text 6.38:1 |
| Almost sheet | `almostBg` | `#FEF3C7` | Warning text 6.15:1 |

### Dark

| Role | Token | Hex |
| --- | --- | --- |
| Text | `ink` | `#E8EEF6` |
| Secondary text | `inkSoft` | `#B8C4D4` |
| Canvas | `sand` | `#101820` |
| Canvas alt | `sandDeep` | `#182230` |
| Surface | `paper` | `#1A2432` |
| Primary | `primary` / `indigo` | `#8BB6EA` |
| Secondary / accent | `secondary` / `accent` | `#C4B5FD` |
| CTA | `pomegranate` | `#F0A36A` |
| Error | `error` | `#FDBA74` |
| Success | `success` / `olive` | `#5EEAD4` |
| Warning | `warning` / `gold` | `#FCD34D` |
| Outline | `line` | `#8AA0B5` |
| Glass | `glass` | `rgba(26,36,50,0.86)` (~`#19222F`) |
| Correct sheet | `correctBg` | `#134E4A` |
| Incorrect sheet | `incorrectBg` | `#7C2D12` |
| Almost sheet | `almostBg` | `#78350F` |

Mascot paints (not theme roles): cream `#F6F0E4`, outline/ink `#142033`, limbs/ears `#0A1628` (darker than brand `#184A82` so they do not blend on the icon), face-plate `#E7DCC8`, cheek `#E8C4B0`, antenna `#B45309`, streak gold `#FCD34D`. Character sits in the center ~80% of the 1024 icon so iOS corner masking does not crop the antenna.

### Contrast table (WCAG 2.2, unrounded)

| Pair | Ratio | Gate | Result |
| --- | ---: | --- | --- |
| **Light** | | | |
| ink `#142033` on sand `#EEF2F7` | 14.55:1 | 4.5 | Pass |
| ink on paper `#FFFFFF` | 16.35:1 | 4.5 | Pass |
| inkSoft `#3A4A5E` on sand | 8.05:1 | 4.5 | Pass |
| inkSoft on paper | 9.05:1 | 4.5 | Pass |
| primary `#184A82` on paper (and reverse) | 8.97:1 | 4.5 | Pass |
| white on CTA `#9A3412` | 7.31:1 | 4.5 | Pass |
| white on success `#0C5F58` | 7.52:1 | 4.5 | Pass |
| secondary `#5A4A9A` on paper | 7.29:1 | 4.5 | Pass |
| accent `#7C3AED` on paper | 5.70:1 | 4.5 | Pass |
| warning `#854D0E` on paper | 6.85:1 | 4.5 | Pass |
| success on correctBg `#D7EDEA` | 6.15:1 | 4.5 | Pass |
| error on incorrectBg `#FFEDD5` | 6.38:1 | 4.5 | Pass |
| warning on almostBg `#FEF3C7` | 6.15:1 | 4.5 | Pass |
| ink on correct / incorrect / almost sheets | 13.39 / 14.27 / 14.69:1 | 4.5 | Pass |
| line `#6B7787` on sand | 4.05:1 | 3.0 UI | Pass |
| line on paper | 4.55:1 | 3.0 UI | Pass |
| ink on glass composite `#FDFDFE` | 16.09:1 | 4.5 | Pass |
| **Dark** | | | |
| ink `#E8EEF6` on sand `#101820` | 15.33:1 | 4.5 | Pass |
| ink on paper `#1A2432` | 13.40:1 | 4.5 | Pass |
| inkSoft `#B8C4D4` on sand | 10.13:1 | 4.5 | Pass |
| inkSoft on paper | 8.85:1 | 4.5 | Pass |
| primary `#8BB6EA` on paper (and reverse) | 7.43:1 | 4.5 | Pass |
| paper on CTA `#F0A36A` | 7.56:1 | 4.5 | Pass |
| paper on success `#5EEAD4` | 10.58:1 | 4.5 | Pass |
| secondary `#C4B5FD` on paper | 8.47:1 | 4.5 | Pass |
| warning `#FCD34D` on paper | 10.85:1 | 4.5 | Pass |
| error `#FDBA74` on paper | 9.28:1 | 4.5 | Pass |
| success on correctBg `#134E4A` | 6.41:1 | 4.5 | Pass |
| error on incorrectBg `#7C2D12` | 5.56:1 | 4.5 | Pass |
| warning on almostBg `#78350F` | 6.29:1 | 4.5 | Pass |
| ink on dark sheets | 8.12 / 8.03 / 7.77:1 | 4.5 | Pass |
| line `#8AA0B5` on sand | 6.63:1 | 3.0 UI | Pass |
| line on paper | 5.79:1 | 3.0 UI | Pass |
| ink on glass composite `#19222F` | 13.72:1 | 4.5 | Pass |

`scripts/check_contrast.py` re-reads the token file and fails CI if any pair drops below the gate.

### CVD table (Machado 2009)

Text on its own sheet remains AA. Hue difference between success and error does **not**.

| Theme | Deficiency | Success text→sim | Error text→sim | Text/sheet success | Text/sheet error |
| --- | --- | --- | --- | ---: | ---: |
| Light | Protanopia | `#0C5F58`→`#595958` | `#9A3412`→`#52480B` | 5.83:1 | 7.82:1 |
| Light | Deuteranopia | `#0C5F58`→`#4F5159` | `#9A3412`→`#6B5F0C` | 6.40:1 | 5.69:1 |
| Light | Tritanopia | `#0C5F58`→`#00615D` | `#9A3412`→`#AA152E` | 5.99:1 | 6.28:1 |
| Dark | Protanopia | `#5EEAD4`→`#E0DDD3` | `#FDBA74`→`#D0BE6E` | 6.62:1 | 6.00:1 |
| Dark | Deuteranopia | `#5EEAD4`→`#CBCED6` | `#FDBA74`→`#E0CD75` | 6.26:1 | 5.32:1 |
| Dark | Tritanopia | `#5EEAD4`→`#00EEE3` | `#FDBA74`→`#FFABA9` | 6.36:1 | 5.22:1 |

---

## 9. Product rules that follow from this note

1. Tokens, not one-off hex, on web and mobile.
2. Correct / almost / wrong always include **icon + word + sheet**; mascot mood is extra, not a substitute.
3. Path nodes use shape (checkmark, star, muted fill) in addition to border color.
4. Glass is chrome-only; Reduce Transparency disables blur.
5. Icon: original rounded robot **Biti**, cream on indigo, readable at 29pt, 1024² PNG with no alpha and no pre-mask.

### Opinion summary (not evidence)

A cool indigo canvas with a terracotta CTA and teal success is a coherent Mediterranean story that is not Duolingo, is conventional for our five European UI languages, and survives the contrast and CVD gates above. We are not claiming it “increases retention” by hue magic.

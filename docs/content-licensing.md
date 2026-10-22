# Content licensing

Every asset that ships or is fetched must have a row here (or in `content/sources/`). Unpublished drafts cannot be served to learners.

| Asset | License | Source | Notes |
| --- | --- | --- | --- |
| Brand name "Biti Ivrit", UI copy, original lessons, original vocabulary glosses | Proprietary © Biti Ivrit project | This repository | Original teaching text. Do not copy other course structures or brand assets. |
| Biti mascot (SVG) | Proprietary | `packages/ui` / `apps/web` | Original house mark. Not derived from Duolingo, Mondly, or the legacy Gama mascot. |
| Design tokens / palette | Proprietary | `packages/design-tokens` | Mediterranean ink/sand/pomegranate/olive. Not a competitor palette clone. |
| Noto Sans Hebrew | SIL OFL 1.1 | Google Fonts via `next/font/google` | UI + niqqud-capable sans. |
| Frank Ruhl Libre | SIL OFL 1.1 | Google Fonts via `next/font/google` | Reading face; verify mark placement in browsers. |
| Source Serif 4 | SIL OFL 1.1 | Google Fonts via `next/font/google` | UI LTR serif for ru/en headings. |
| Legacy trainer in `legacy/ivrit-s-nulya` | Same as `main` | Copied on this branch only | Reuse source for verbs/keyboard. Not shipped as the product. |
| Wiktionary fetches | CC BY-SA | https://en.wiktionary.org/wiki/Wiktionary:Copyrights | Attribution + share-alike. Stored on `ContentSource`. Never auto-published. |
| Academy of the Hebrew Language pages | Respect site terms | https://hebrew-academy.org.il/ | Adapter records URL/date/checksum. Editorial decides if reuse is permitted. |
| Project Ben-Yehuda texts | Public domain (project terms) | https://benyehuda.org/ | Advanced reading only after editorial review. |
| Frequency lists | Only open lists with recorded license | `content/sources/` | First release uses an original short starter list, not a scraped corpus. |

## TTS / recordings

No TTS key is present. The audio module reports `capability: unavailable`. Native recordings require license + consent fields before publish. Cache key if a provider is added: `(pointed_text, voice, provider, version)`.

## Forbidden

- Copying Duolingo / Mondly / other course trees, audio, or characters.
- Shipping unlicensed news text.
- Auto-publishing fetched third-party text.
- Storing learner voice without explicit opt-in.

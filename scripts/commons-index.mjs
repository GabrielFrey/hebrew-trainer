// Строит индекс произношений иврита с Викисклада (Category:Hebrew pronunciation).
// Файлы Викисловаря называются He-<слово с огласовками>.ogg, поэтому огласованную
// форму можно взять прямо из имени файла и сопоставить с полем nikud.
//
// Запуск: node scripts/commons-index.mjs <путь-к-индексу.json>
import { writeFileSync } from 'node:fs';

const API = 'https://commons.wikimedia.org/w/api.php';
const CATEGORY = 'Category:Hebrew pronunciation';
const UA = 'hebrew-trainer-audio-indexer/1.0 (educational app)';

async function api(params) {
  const body = new URLSearchParams({ format: 'json', ...params });
  for (let attempt = 0; attempt < 5; attempt += 1) {
    try {
      const res = await fetch(API, {
        method: 'POST',
        headers: { 'User-Agent': UA, 'Content-Type': 'application/x-www-form-urlencoded' },
        body,
      });
      if (res.ok) return await res.json();
    } catch {
      // перебои сети — повторяем с задержкой
    }
    await new Promise((resolve) => setTimeout(resolve, 500 * 2 ** attempt));
  }
  throw new Error(`Не удалось получить ${params.action}/${params.list ?? params.prop}`);
}

export async function listCategory() {
  const titles = [];
  let cont;
  do {
    const data = await api({
      action: 'query',
      list: 'categorymembers',
      cmtitle: CATEGORY,
      cmtype: 'file',
      cmlimit: '500',
      ...(cont ? { cmcontinue: cont } : {}),
    });
    titles.push(...data.query.categorymembers.map((m) => m.title));
    cont = data.continue?.cmcontinue;
  } while (cont);
  return titles;
}

/** Из «File:He-אַחַת.ogg» достаёт «אַחַת». */
export function pointedFromTitle(title) {
  const match = /^File:He-(.+)\.(ogg|oga|wav|mp3|flac)$/i.exec(title);
  if (!match) return null;
  const value = match[1].replace(/_/g, ' ').trim();
  return /^[\u0590-\u05EA\u05F0-\u05F4 '-]+$/.test(value) ? value : null;
}

export async function describe(titles) {
  const out = [];
  for (let i = 0; i < titles.length; i += 20) {
    const batch = titles.slice(i, i + 20);
    const data = await api({
      action: 'query',
      prop: 'imageinfo',
      iiprop: 'url|mime|extmetadata',
      titles: batch.join('|'),
    });
    Object.values(data.query?.pages ?? {}).forEach((page) => {
      const info = page.imageinfo?.[0];
      if (!info) return;
      const meta = info.extmetadata ?? {};
      const value = (key) => meta[key]?.value;
      out.push({
        title: page.title,
        pointed: pointedFromTitle(page.title),
        url: info.url,
        mime: info.mime,
        license: value('LicenseShortName') ?? null,
        licenseUrl: value('LicenseUrl') ?? null,
        artist: (value('Artist') ?? '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim() || null,
        descriptionUrl:
          info.descriptionurl ??
          `https://commons.wikimedia.org/wiki/${encodeURIComponent(page.title)}`,
      });
    });
    process.stderr.write(`\rметаданные ${Math.min(i + 20, titles.length)}/${titles.length}`);
  }
  process.stderr.write('\n');
  return out;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const titles = await listCategory();
  process.stderr.write(`файлов в категории: ${titles.length}\n`);
  const pointed = titles
    .map((title) => ({ title, pointed: pointedFromTitle(title) }))
    .filter((entry) => entry.pointed !== null);
  process.stderr.write(`с огласованной формой в имени: ${pointed.length}\n`);
  writeFileSync(process.argv[2] ?? 'commons-titles.json', JSON.stringify(pointed, null, 2));
}

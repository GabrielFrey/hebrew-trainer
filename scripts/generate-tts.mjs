#!/usr/bin/env node
/**
 * Предварительная озвучка иврита нейросетевым голосом (не на устройстве).
 *
 * Azure:  AZURE_SPEECH_KEY + AZURE_SPEECH_REGION
 *         голоса he-IL-HilaNeural (ж) / he-IL-AvriNeural (м)
 * Google: GOOGLE_TTS_KEY  или  GOOGLE_APPLICATION_CREDENTIALS
 *         голос he-IL-Wavenet-A / he-IL-Wavenet-C
 *
 * Результат: assets/audio/tts/{level}/{id}.mp3 + lib/tts-assets.ts
 * Кэш: .tts-cache/{sha1}.mp3  Манифест: data/tts-manifest.json
 * Живые записи носителя (assets/audio/words|letters) имеют приоритет в приложении.
 * Пустые файлы не пишутся. Без ключа скрипт завершается 0 и ничего не синтезирует.
 */
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const cacheDir = join(root, '.tts-cache');
const outRoot = join(root, 'assets/audio/tts');
const manifestPath = join(root, 'data/tts-manifest.json');
const LEVELS = ['elementary', 'basic', 'intermediate', 'advanced', 'expert'];

function loadJson(path) {
  return JSON.parse(readFileSync(path, 'utf8'));
}

function sha1(text) {
  return createHash('sha1').update(text).digest('hex');
}

function entries() {
  const out = [];
  for (const level of LEVELS) {
    const words = loadJson(join(root, `data/lexicon/words-${level}.json`)).words ?? [];
    const slang = loadJson(join(root, `data/lexicon/slang-${level}.json`)).slang ?? [];
    for (const item of [...words, ...slang]) {
      out.push({
        id: item.id,
        level,
        text: item.nikud,
        voice: item.pos === 'slang' ? 'male' : 'female',
      });
    }
  }
  return out;
}

function nativeSet() {
  const set = new Set();
  for (const folder of ['words', 'letters']) {
    const dir = join(root, 'assets/audio', folder);
    if (!existsSync(dir)) continue;
    for (const file of readdirSync(dir)) {
      if (file.endsWith('.m4a') && statSync(join(dir, file)).size > 200) {
        set.add(`${folder}/${file}`);
      }
    }
  }
  return set;
}

async function azureSynth(text, voice, dest) {
  const key = process.env.AZURE_SPEECH_KEY;
  const region = process.env.AZURE_SPEECH_REGION || 'eastus';
  const name = voice === 'male' ? 'he-IL-AvriNeural' : 'he-IL-HilaNeural';
  const ssml = `<speak version="1.0" xml:lang="he-IL"><voice name="${name}">${escapeXml(text)}</voice></speak>`;
  const res = await fetch(`https://${region}.tts.speech.microsoft.com/cognitiveservices/v1`, {
    method: 'POST',
    headers: {
      'Ocp-Apim-Subscription-Key': key,
      'Content-Type': 'application/ssml+xml',
      'X-Microsoft-OutputFormat': 'audio-24khz-48kbitrate-mono-mp3',
      'User-Agent': 'hebrew-trainer',
    },
    body: ssml,
  });
  if (!res.ok) throw new Error(`Azure TTS ${res.status} ${await res.text()}`);
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.length < 200) throw new Error('Azure returned empty audio');
  writeFileSync(dest, buf);
}

async function googleSynth(text, voice, dest) {
  const key = process.env.GOOGLE_TTS_KEY;
  const name = voice === 'male' ? 'he-IL-Wavenet-C' : 'he-IL-Wavenet-A';
  const url = `https://texttospeech.googleapis.com/v1/text:synthesize?key=${key}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      input: { text },
      voice: { languageCode: 'he-IL', name },
      audioConfig: { audioEncoding: 'MP3' },
    }),
  });
  if (!res.ok) throw new Error(`Google TTS ${res.status} ${await res.text()}`);
  const json = await res.json();
  const buf = Buffer.from(json.audioContent, 'base64');
  if (buf.length < 200) throw new Error('Google returned empty audio');
  writeFileSync(dest, buf);
}

function escapeXml(text) {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function writeTtsAssets(files) {
  const lines = files
    .sort()
    .map((rel) => `  '${rel}': require('@/assets/audio/${rel}') as number,`)
    .join('\n');
  const body = `// Файл создаётся скриптом scripts/generate-tts.mjs. Не редактируйте вручную.
export const ttsAssets: Record<string, number> = {
${lines}
};
`;
  writeFileSync(join(root, 'lib/tts-assets.ts'), body);
}

const azure = Boolean(process.env.AZURE_SPEECH_KEY);
const google = Boolean(process.env.GOOGLE_TTS_KEY);
if (!azure && !google) {
  console.log('Нет AZURE_SPEECH_KEY / GOOGLE_TTS_KEY — синтез пропущен. В приложении будет «нет записи».');
  console.log('Azure: AZURE_SPEECH_KEY=... AZURE_SPEECH_REGION=eastus node scripts/generate-tts.mjs');
  console.log('Google: GOOGLE_TTS_KEY=... node scripts/generate-tts.mjs');
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    console.log('GOOGLE_APPLICATION_CREDENTIALS задан, но скрипт ждёт API-ключ GOOGLE_TTS_KEY.');
  }
  process.exit(0);
}

mkdirSync(cacheDir, { recursive: true });
const natives = nativeSet();
const manifest = existsSync(manifestPath) ? loadJson(manifestPath) : { files: {} };
const limit = Number(process.env.TTS_LIMIT || 0);
let done = 0;
let skippedNative = 0;
const present = [];

for (const item of entries()) {
  if (limit && done >= limit) break;
  const nativeGuess = `words/${item.id}.m4a`;
  if (natives.has(nativeGuess)) {
    skippedNative += 1;
    continue;
  }
  const cacheFile = join(cacheDir, `${sha1(`${item.voice}:${item.text}`)}.mp3`);
  const rel = `tts/${item.level}/${item.id}.mp3`;
  const dest = join(root, 'assets/audio', rel);
  mkdirSync(dirname(dest), { recursive: true });
  try {
    if (!existsSync(cacheFile) || statSync(cacheFile).size < 200) {
      if (azure) await azureSynth(item.text, item.voice, cacheFile);
      else await googleSynth(item.text, item.voice, cacheFile);
    }
    if (!existsSync(cacheFile) || statSync(cacheFile).size < 200) continue;
    writeFileSync(dest, readFileSync(cacheFile));
    manifest.files[item.id] = rel;
    present.push(rel);
    done += 1;
    if (done % 50 === 0) console.log(`tts ${done}`);
  } catch (err) {
    console.warn(`skip ${item.id}:`, err.message);
  }
}

writeFileSync(
  manifestPath,
  JSON.stringify({ generatedAt: new Date().toISOString(), provider: azure ? 'azure' : 'google', files: manifest.files }, null, 2)
);
writeTtsAssets(present);
console.log(`готово: ${done} файлов, пропущено из‑за записи носителя: ${skippedNative}`);
console.log(`манифест ${relative(root, manifestPath)}`);

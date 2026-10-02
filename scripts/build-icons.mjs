// Собирает иконку, splash и favicon.
//
// Глиф рисуется шрифтом Noto Sans Hebrew, а не подбирается на глаз: так буква
// точно остаётся настоящим алефом. Текста, кроме самой буквы, на картинках нет
// вообще, поэтому требование «без текста на иврите мельче 32» выполняется по
// построению.
//
// Запуск: node scripts/build-icons.mjs
import { execFileSync } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = new URL('..', import.meta.url).pathname;
const OUT = join(ROOT, 'assets/images');
const FONT = '/usr/share/fonts/truetype/noto/NotoSansHebrew-Bold.ttf';

const TEAL = '#0E4F63';
const CREAM = '#F6F1E3';
const GLYPH = 'א';

mkdirSync(OUT, { recursive: true });

function render({ file, size, background, fontSize, pixelFormat }) {
  const args = [
    '-y',
    '-loglevel',
    'error',
    '-f',
    'lavfi',
    '-i',
    `color=${background}:s=${size}x${size}`,
    '-vf',
    `drawtext=fontfile=${FONT}:text='${GLYPH}':fontcolor=${CREAM}:fontsize=${fontSize}:x=(w-text_w)/2:y=(h-text_h)/2`,
    '-frames:v',
    '1',
    '-pix_fmt',
    pixelFormat,
    join(OUT, file),
  ];
  execFileSync('ffmpeg', args, { stdio: ['ignore', 'ignore', 'inherit'] });
  process.stderr.write(`✓ ${file} ${size}x${size}\n`);
}

// Иконка App Store: без альфа-канала, глиф занимает ~60% стороны.
render({ file: 'icon.png', size: 1024, background: TEAL, fontSize: 620, pixelFormat: 'rgb24' });

// Android: передний план с запасом под обрезку по кругу.
render({
  file: 'adaptive-icon.png',
  size: 1024,
  background: `${TEAL}@0.0`,
  fontSize: 440,
  pixelFormat: 'rgba',
});

// Splash: много воздуха вокруг буквы.
render({
  file: 'splash-icon.png',
  size: 1024,
  background: `${TEAL}@0.0`,
  fontSize: 380,
  pixelFormat: 'rgba',
});

render({ file: 'favicon.png', size: 64, background: TEAL, fontSize: 40, pixelFormat: 'rgb24' });

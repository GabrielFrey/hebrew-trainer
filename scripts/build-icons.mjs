#!/usr/bin/env node
/** Зелёный квадрат, алеф и пятно-маскот. App Store берёт 1024 без альфы.
 *  Также собирает light/dark/tinted iOS 26+ варианты и исходник Icon Composer. */
import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = new URL('..', import.meta.url).pathname;
const OUT = join(ROOT, 'assets/images');
const FONT = '/usr/share/fonts/truetype/noto/NotoSansHebrew-Bold.ttf';
const GREEN = '0x58CC02';
const CREAM = '0xF7FFEF';
const SAND = '0xE8A05A';

mkdirSync(OUT, { recursive: true });

function run(args) {
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', ...args], { stdio: ['ignore', 'ignore', 'inherit'] });
}

function square(file, size, pixelFormat, fontSize) {
  run([
    '-f',
    'lavfi',
    '-i',
    `color=${GREEN}:s=${size}x${size}`,
    '-f',
    'lavfi',
    '-i',
    `color=${SAND}:s=${Math.round(size * 0.28)}x${Math.round(size * 0.28)}`,
    '-filter_complex',
    `[1:v]format=rgba,geq=lum='p(X,Y)':a='if(lt(pow((X-W/2)/W*2,2)+pow((Y-H/2)/H*2,2),1),255,0)'[blob];[0:v][blob]overlay=${Math.round(size * 0.12)}:${Math.round(size * 0.55)}:format=auto,drawtext=fontfile=${FONT}:text='א':fontcolor=${CREAM}:fontsize=${fontSize}:x=(w-text_w)/2:y=(h-text_h)/2-8`,
    '-frames:v',
    '1',
    '-pix_fmt',
    pixelFormat,
    join(OUT, file),
  ]);
  process.stderr.write(`✓ ${file} ${size}x${size}\n`);
}

square('icon.png', 1024, 'rgb24', 560);
square('adaptive-icon.png', 1024, 'rgba', 420);
square('splash-icon.png', 1024, 'rgba', 380);
square('favicon.png', 64, 'rgb24', 36);
square('icon-180.png', 180, 'rgb24', 100);
square('icon-167.png', 167, 'rgb24', 92);
square('icon-152.png', 152, 'rgb24', 84);
square('icon-120.png', 120, 'rgb24', 68);
square('icon-80.png', 80, 'rgb24', 46);
square('icon-76.png', 76, 'rgb24', 42);
square('icon-40.png', 40, 'rgb24', 22);

function squareOn(file, bg, size, pixelFormat, fontSize, glyph) {
  run([
    '-f',
    'lavfi',
    '-i',
    `color=${bg}:s=${size}x${size}`,
    '-f',
    'lavfi',
    '-i',
    `color=${SAND}:s=${Math.round(size * 0.28)}x${Math.round(size * 0.28)}`,
    '-filter_complex',
    `[1:v]format=rgba,geq=lum='p(X,Y)':a='if(lt(pow((X-W/2)/W*2,2)+pow((Y-H/2)/H*2,2),1),255,0)'[blob];[0:v][blob]overlay=${Math.round(size * 0.12)}:${Math.round(size * 0.55)}:format=auto,drawtext=fontfile=${FONT}:text='א':fontcolor=${glyph}:fontsize=${fontSize}:x=(w-text_w)/2:y=(h-text_h)/2-8`,
    '-frames:v',
    '1',
    '-pix_fmt',
    pixelFormat,
    join(OUT, file),
  ]);
  process.stderr.write(`✓ ${file} ${size}x${size}\n`);
}

squareOn('ios-light.png', GREEN, 1024, 'rgb24', 560, CREAM);
squareOn('ios-dark.png', '0x102016', 1024, 'rgb24', 560, CREAM);
function tintedSquare(file, size, fontSize) {
  run([
    '-f',
    'lavfi',
    '-i',
    `color=0x000000:s=${size}x${size}`,
    '-f',
    'lavfi',
    '-i',
    `color=0xFFFFFF:s=${Math.round(size * 0.28)}x${Math.round(size * 0.28)}`,
    '-filter_complex',
    `[1:v]format=rgba,geq=lum='p(X,Y)':a='if(lt(pow((X-W/2)/W*2,2)+pow((Y-H/2)/H*2,2),1),255,0)'[blob];[0:v][blob]overlay=${Math.round(size * 0.12)}:${Math.round(size * 0.55)}:format=auto,drawtext=fontfile=${FONT}:text='א':fontcolor=0xFFFFFF:fontsize=${fontSize}:x=(w-text_w)/2:y=(h-text_h)/2-8`,
    '-frames:v',
    '1',
    '-pix_fmt',
    'rgb24',
    join(OUT, file),
  ]);
  process.stderr.write(`✓ ${file} ${size}x${size}\n`);
}
tintedSquare('ios-tinted.png', 1024, 560);

const ICON = join(ROOT, 'assets/app.icon');
const ASSETS = join(ICON, 'Assets');
mkdirSync(ASSETS, { recursive: true });

run([
  '-f',
  'lavfi',
  '-i',
  'color=0x00000000:s=1024x1024,format=rgba',
  '-filter_complex',
  `drawtext=fontfile=${FONT}:text='א':fontcolor=0xFFFFFF:fontsize=560:x=(w-text_w)/2:y=(h-text_h)/2-8`,
  '-frames:v',
  '1',
  join(ASSETS, 'aleph.png'),
]);
run([
  '-f',
  'lavfi',
  '-i',
  `color=${SAND}:s=320x320`,
  '-filter_complex',
  `format=rgba,geq=lum='p(X,Y)':a='if(lt(pow((X-W/2)/W*2,2)+pow((Y-H/2)/H*2,2),1),255,0)'`,
  '-frames:v',
  '1',
  join(ASSETS, 'blob.png'),
]);

writeFileSync(
  join(ICON, 'icon.json'),
  `${JSON.stringify(
    {
      'fill-specializations': [
        { value: { solid: 'extended-srgb:0.34510,0.80000,0.00784,1.00000' } },
        { appearance: 'dark', value: { solid: 'extended-srgb:0.06275,0.12549,0.08627,1.00000' } },
      ],
      groups: [
        {
          name: 'Mark',
          lighting: 'individual',
          blurMaterial: 0.4,
          specular: true,
          translucency: { enabled: true, value: 0.22 },
          shadow: { kind: 'neutral', opacity: 0.32 },
          layers: [
            {
              name: 'Blob',
              'image-name': 'blob.png',
              glass: true,
              position: { scale: 1, 'translation-in-points': [-210, 160] },
            },
            {
              name: 'Aleph',
              'image-name': 'aleph.png',
              glass: true,
            },
          ],
        },
      ],
      'supported-platforms': { squares: ['iOS'] },
    },
    null,
    2
  )}\n`
);
process.stderr.write('✓ assets/app.icon (Icon Composer source)\n');

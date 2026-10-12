#!/usr/bin/env node
/** Зелёный квадрат, алеф и пятно-маскот. App Store берёт 1024 без альфы. */
import { execFileSync } from 'node:child_process';
import { mkdirSync } from 'node:fs';
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

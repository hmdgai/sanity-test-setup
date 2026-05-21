#!/usr/bin/env node
/**
 * optimise-hero-video.mjs
 * ─────────────────────────────────────────────────────────────
 * Encodes a self-hosted hero / background video to the canonical
 * MP4 H.264 spec used across HMDG clinic sites.
 *
 * INPUT      assets/videos/herovideo.mp4   (any container, any codec)
 * OUTPUT     public/videos/hero-loop.mp4   (H.264, AAC stripped, ≤10s, ≤1280×720)
 *
 * Why self-hosted MP4 H.264 (not YouTube, not WebM)
 *   - YouTube IFrame API costs ~1500 ms CPU + ~1 MB third-party JS
 *   - Self-hosted MP4 H.264 costs ~720 KB single file + 0 ms third-party CPU
 *   - Safari uses the OS-level hardware decoder for MP4 — fastest path
 *   - WebM is NOT a Safari fallback — Safari supports MP4 natively (since 2007).
 *     WebM only works in Safari 17+ on macOS Sonoma. MP4 is the universal
 *     format. WebM is a Chrome/Firefox optimisation, not a Safari requirement.
 *
 * Encode spec (libx264)
 *   -crf 28           quality target — lower is bigger
 *   -preset slow      better compression at one-shot encode time
 *   -pix_fmt yuv420p  NON-NEGOTIABLE for Safari (yuv444/yuv422 will not play)
 *   -movflags +faststart   moov atom at start — required for streaming
 *   -an               strip audio (muted-loop autoplay rules)
 *   -t 10             trim to first 10 seconds (loops well, small file)
 *   -vf scale         cap width at 1280, height auto by aspect ratio
 *
 * Usage
 *   npm run optimise-video                     # default IO paths
 *   npm run optimise-video -- --in path/in.mp4 --out path/out.mp4
 *   npm run optimise-video -- --duration 8     # custom trim length
 *   npm run optimise-video -- --width 1920     # custom max width
 *
 * Why @ffmpeg-installer/ffmpeg
 *   Bundles a static ffmpeg binary so no system install is required —
 *   works on a fresh dev machine, on a Cloudflare build runner, in CI.
 *   No PATH plumbing, no apt-get sudo dance.
 */

import { existsSync, mkdirSync, statSync } from 'node:fs';
import { dirname, join, resolve }          from 'node:path';
import { fileURLToPath }                   from 'node:url';

let ffmpegPath, ffmpeg;
try {
  ffmpegPath = (await import('@ffmpeg-installer/ffmpeg')).default.path;
  ffmpeg     = (await import('fluent-ffmpeg')).default;
  ffmpeg.setFfmpegPath(ffmpegPath);
} catch {
  console.error('[optimise-video] missing dependencies. Run:');
  console.error('  npm i -D @ffmpeg-installer/ffmpeg fluent-ffmpeg');
  process.exit(1);
}

const __dirname   = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, '..');

const args = process.argv.slice(2);
const argv = (flag, fallback) => {
  const i = args.indexOf(flag);
  return i >= 0 ? args[i + 1] : fallback;
};

const inputPath  = resolve(projectRoot, argv('--in',  'assets/videos/herovideo.mp4'));
const outputPath = resolve(projectRoot, argv('--out', 'public/videos/hero-loop.mp4'));
const duration   = Number(argv('--duration', '10'));
const maxWidth   = Number(argv('--width',    '1280'));
const crf        = Number(argv('--crf',      '28'));

if (!existsSync(inputPath)) {
  console.error(`[optimise-video] input not found: ${inputPath}`);
  console.error('Place your source video at assets/videos/herovideo.mp4 and re-run.');
  console.error('Sources live OUTSIDE public/ so they never ship to production.');
  process.exit(1);
}

const outDir = dirname(outputPath);
if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true });

const sourceSizeMb = (statSync(inputPath).size / (1024 * 1024)).toFixed(2);
console.log(`[optimise-video] source: ${inputPath} (${sourceSizeMb} MB)`);
console.log(`[optimise-video] target: ${outputPath}`);
console.log(`[optimise-video] crf=${crf}  duration≤${duration}s  max-width=${maxWidth}  pix_fmt=yuv420p  audio=stripped`);

await new Promise((resolveJob, rejectJob) => {
  ffmpeg(inputPath)
    .videoCodec('libx264')
    .outputOptions([
      `-crf ${crf}`,
      '-preset slow',
      '-pix_fmt yuv420p',
      '-movflags +faststart',
      `-t ${duration}`,
      '-an',
    ])
    .videoFilters([`scale='min(${maxWidth},iw)':-2`])
    .on('start', (cmd) => console.log(`[optimise-video] ffmpeg ${cmd}`))
    .on('progress', (p) => {
      if (p.percent != null) {
        process.stdout.write(`\r  encoding ${p.percent.toFixed(1)}%`);
      }
    })
    .on('end', () => { process.stdout.write('\n'); resolveJob(); })
    .on('error', rejectJob)
    .save(outputPath);
});

const outSizeMb = (statSync(outputPath).size / (1024 * 1024)).toFixed(2);
console.log(`[optimise-video] Done. Output: ${outSizeMb} MB`);

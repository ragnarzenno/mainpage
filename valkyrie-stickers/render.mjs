import { chromium } from 'playwright-core';
import { stickers } from './stickers.mjs';
import fs from 'fs';

// Chromium: use CHROMIUM_EXE if set, else fall back to Playwright's bundled build.
const EXE = process.env.CHROMIUM_EXE || undefined;
const OUT = process.argv[2] || './stickers';
fs.mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({ ...(EXE ? { executablePath: EXE } : {}), args: ['--no-sandbox'] });

// 1) render each sticker as transparent 512x512 PNG
for (const s of stickers) {
  const page = await browser.newPage({ viewport: { width: 512, height: 512 }, deviceScaleFactor: 1 });
  await page.setContent(`<style>html,body{margin:0;padding:0}</style>${s.svg}`);
  await page.screenshot({ path: `${OUT}/${s.name}.png`, omitBackground: true, clip: { x: 0, y: 0, width: 512, height: 512 } });
  await page.close();
  console.log('rendered', s.name, s.emoji);
}

// 2) contact sheet (4 cols) on a checkerboard so transparency + white outline are visible
const cols = 4, cell = 300, pad = 24, labelH = 40;
const rows = Math.ceil(stickers.length / cols);
const W = cols * cell + pad * (cols + 1);
const H = rows * (cell + labelH) + pad * (rows + 1);
const cards = stickers.map((s, i) => {
  const c = i % cols, r = Math.floor(i / cols);
  const x = pad + c * (cell + pad), y = pad + r * (cell + labelH + pad);
  return `<div style="position:absolute;left:${x}px;top:${y}px;width:${cell}px">
      <div style="width:${cell}px;height:${cell}px;border-radius:18px;
        background-image:linear-gradient(45deg,#d8dde3 25%,transparent 25%),linear-gradient(-45deg,#d8dde3 25%,transparent 25%),linear-gradient(45deg,transparent 75%,#d8dde3 75%),linear-gradient(-45deg,transparent 75%,#d8dde3 75%);
        background-size:28px 28px;background-position:0 0,0 14px,14px -14px,-14px 0;background-color:#eef1f4;
        display:flex;align-items:center;justify-content:center;overflow:hidden">
        <div style="width:${cell-20}px;height:${cell-20}px">${s.svg.replace('width="512" height="512"',`width="${cell-20}" height="${cell-20}"`)}</div>
      </div>
      <div style="text-align:center;font:600 18px system-ui;color:#1b2a3a;padding-top:8px">${s.emoji} ${s.title}</div>
    </div>`;
}).join('');
const sheetHtml = `<style>html,body{margin:0;background:#f4f6f8}</style>
  <div style="position:relative;width:${W}px;height:${H}px">${cards}</div>`;
const sheet = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });
await sheet.setContent(sheetHtml);
await sheet.screenshot({ path: `${OUT}/_contact_sheet.png`, clip: { x: 0, y: 0, width: W, height: H } });
await sheet.close();
console.log('contact sheet ->', `${OUT}/_contact_sheet.png`, `${W}x${H}`);

await browser.close();

// 3) sanity: all files <512KB (Telegram static sticker limit)
let big = 0;
for (const s of stickers) {
  const sz = fs.statSync(`${OUT}/${s.name}.png`).size;
  if (sz > 512 * 1024) { console.log('!! too big', s.name, sz); big++; }
}
console.log(big ? `${big} oversized` : 'all stickers within 512KB limit');

import { chromium } from '@playwright/test';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { validateTheme } from '../shared/theme-model.mjs';

const url = process.env.STUDIO_URL || 'http://127.0.0.1:5190/studio/';
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({
  viewport: { width: 1440, height: 1050 },
  reducedMotion: 'reduce'
});
const errors = [];
page.on('pageerror', error => errors.push(error.message));
await page.goto(url, { waitUntil: 'networkidle' });

for (const text of ['残卷入梦', '心有所向', '万行自明', '新建对话', '对话进行中', '小行者', '一图，两境']) {
  if (!await page.getByText(text, { exact: false }).count()) throw Error('Missing preview surface: ' + text);
}

assert(await page.locator('#preview').getAttribute('data-surface') === 'landing', 'Studio did not start in landing state');
const defaultImage = await page.locator('#preview').evaluate(element => element.style.getPropertyValue('--studio-image'));
assert(defaultImage.includes('great-sage-return.jpg'), 'Bundled user image was not loaded by default');

await page.locator('#showThread').click();
assert(await page.locator('#preview').getAttribute('data-surface') === 'thread', 'Thread preview did not activate');
assert(await page.locator('#wayfarer em').textContent() === '静候下一段行程', 'Companion thread state is wrong');
await page.locator('#showLanding').click();

await page.locator('#runtimeToggle').click();
assert(await page.locator('#preview').evaluate(element => element.classList.contains('native-preview')), 'Native preview did not activate');
assert(await page.locator('#runtimeToggle').getAttribute('aria-pressed') === 'false', 'Runtime toggle state is wrong');
await page.locator('#runtimeToggle').click();

const png = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Y9JfRgAAAAASUVORK5CYII=',
  'base64'
);
await page.locator('#localFile').setInputFiles({ name: 'mist.png', mimeType: 'image/png', buffer: png });
await page.locator('#position').selectOption('left center');
await page.locator('#landingPosition').selectOption('center center');
await page.locator('#dim').fill('62');
await page.locator('#art').fill('21');
await page.locator('#landingArt').fill('83');
const variables = await page.locator('#preview').evaluate(element => ({
  image: element.style.getPropertyValue('--studio-image'),
  position: element.style.getPropertyValue('--studio-position'),
  landingPosition: element.style.getPropertyValue('--studio-landing-position'),
  dim: element.style.getPropertyValue('--studio-dim'),
  intensity: element.style.getPropertyValue('--studio-intensity'),
  landingIntensity: element.style.getPropertyValue('--studio-landing-intensity')
}));
assert(variables.image.includes('data:image/png'), 'Local image did not reach the preview');
assert(variables.position === 'left center', 'Thread focus did not update');
assert(variables.landingPosition === 'center center', 'Landing focus did not update');
assert(variables.dim === '0.62', 'Dim did not update');
assert(variables.intensity === '0.21', 'Thread intensity did not update');
assert(variables.landingIntensity === '0.83', 'Landing intensity did not update');

await page.locator('#reducedMotion').check();
assert(await page.locator('#preview').evaluate(element => element.classList.contains('reduced-motion')), 'Reduced motion did not apply');
const wayfarer = page.locator('#wayfarer');
assert(await wayfarer.evaluate(element => getComputedStyle(element).pointerEvents) === 'none', 'Companion blocks pointer events');

const downloadPromise = page.waitForEvent('download');
await page.locator('#export').click();
const download = await downloadPromise;
const temp = path.join(os.tmpdir(), 'wukong-forge-export-v2.json');
await download.saveAs(temp);
const exported = JSON.parse(fs.readFileSync(temp, 'utf8'));
validateTheme(exported);
assert(exported.schemaVersion === 2, 'Studio exported the wrong schema');
fs.rmSync(temp, { force: true });

await page.locator('#preset').click();
assert(await page.locator('#preview').evaluate(element => element.classList.contains('high-read')), 'High readability preset did not apply');
assert(await page.locator('#preview').evaluate(element => element.style.getPropertyValue('--studio-image')) === 'none', 'High read retained the image');
await page.reload({ waitUntil: 'networkidle' });
assert(await page.locator('#preview').evaluate(element => element.classList.contains('high-read')), 'High readability did not persist');

await page.evaluate(() => localStorage.clear());
await page.reload({ waitUntil: 'networkidle' });
await page.screenshot({ path: 'docs/screenshots/theme-studio.png', fullPage: true });
await page.screenshot({ path: 'docs/screenshots/theme-studio-landing.png', fullPage: true });
await page.locator('#showThread').click();
await page.waitForTimeout(400);
assert(await page.locator('.thread-scene').evaluate(element => getComputedStyle(element).visibility) === 'visible', 'Thread scene stayed hidden');
assert(await page.locator('.landing-scene').evaluate(element => getComputedStyle(element).visibility) === 'hidden', 'Landing scene stayed visible');
await page.screenshot({ path: 'docs/screenshots/theme-studio-thread.png', fullPage: true });

for (const file of [
  'docs/screenshots/theme-studio.png',
  'docs/screenshots/theme-studio-landing.png',
  'docs/screenshots/theme-studio-thread.png'
]) {
  if (!fs.existsSync(file) || fs.statSync(file).size < 20000) throw Error('Studio screenshot is missing or empty: ' + file);
}
if (errors.length) throw Error('Studio page errors: ' + errors.join('; '));
await browser.close();
console.log('Studio dual-state design, toggle, local image, accessibility, export, and screenshots PASS');

function assert(condition, message) {
  if (!condition) throw Error(message);
}

import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { getBrowserVersion, getTargets, commandTarget, evaluateTarget, isCodexTarget } from './cdp-client.mjs';

const [,, portRaw, providedOutput, targetKind = 'main'] = process.argv;
const port = Number(portRaw);
if (!Number.isInteger(port) || port < 1024 || port > 65535) {
  throw new Error('Use capture-live.mjs <loopback-port> [output.png] [main|overlay].');
}
if (!['main', 'overlay'].includes(targetKind)) throw new Error('Capture target must be main or overlay.');
const root = path.resolve(process.cwd());
const output = path.resolve(providedOutput || 'docs/logs/live-codex-theme.png');
const relative = path.relative(root, output);
if (!relative || relative.startsWith('..') || path.isAbsolute(relative)) {
  throw new Error('Screenshot output must stay inside the current working directory.');
}

await getBrowserVersion(port);
const targets = (await getTargets(port)).filter(isCodexTarget);
const target = targetKind === 'overlay'
  ? targets.find(item => /[?&]initialRoute=%2Favatar-overlay(?:&|$)/i.test(item.url || ''))
  : targets.find(item => /^app:\/\/codex\//.test(item.url || '')) ||
    targets.find(item => item.url === 'app://-/index.html') ||
    targets.find(item => !/[?&]initialRoute=%2Favatar-overlay(?:&|$)/i.test(item.url || '')) ||
    targets[0];
if (!target) throw new Error('No Codex renderer target was found.');
// Retained diagnostic call: await commandTarget(target, 'Page.enable');
// Electron's app:// renderer can leave Page.enable unanswered; captureScreenshot works directly.
const shot = await commandTarget(target, 'Page.captureScreenshot', {
  format: 'png',
  fromSurface: true,
  captureBeyondViewport: false
});
if (!shot?.data) throw new Error('Codex renderer returned no screenshot data.');
fs.mkdirSync(path.dirname(output), { recursive: true });
fs.writeFileSync(output, Buffer.from(shot.data, 'base64'));

const summary = await evaluateTarget(target, `(() => ({
  url: location.href,
  title: document.title,
  surface: document.documentElement.dataset.forgeSurface || null,
  mode: document.documentElement.dataset.forgeMode || null,
  scene: document.documentElement.dataset.forgeScene || null,
  motifs: {
    gourdSafe: document.documentElement.dataset.forgeGourdSafe || null
  },
  stylePresent: Boolean(document.getElementById('wukong-forge-style')),
  styleLength: document.getElementById('wukong-forge-style')?.textContent.length || 0,
  markedElements: document.querySelectorAll('[data-forge-mark]').length,
  geometry: Object.fromEntries([
    ['sidebar', '.forge-sidebar'],
    ['composer', '.forge-composer'],
    ['environment', '.forge-right-card']
  ].map(([name, selector]) => {
    const rect = document.querySelector(selector)?.getBoundingClientRect();
    return [name, rect ? { x: rect.x, y: rect.y, width: rect.width, height: rect.height } : null];
  })),
  assistantFrameless: [...document.querySelectorAll('.forge-assistant-message')].every(element => {
    const style = getComputedStyle(element);
    return style.backgroundImage === 'none' && style.backgroundColor === 'rgba(0, 0, 0, 0)' && style.boxShadow === 'none';
  }),
  viewport: { width: innerWidth, height: innerHeight, scale: devicePixelRatio }
}))()`);
fs.writeFileSync(`${output}.json`, `${JSON.stringify(summary, null, 2)}\n`, 'utf8');
console.log(`CAPTURED: ${output}`);
console.log(JSON.stringify(summary));

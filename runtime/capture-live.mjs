import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { getBrowserVersion, getTargets, commandTarget, evaluateTarget, isCodexTarget } from './cdp-client.mjs';

const [,, portRaw, providedOutput] = process.argv;
const port = Number(portRaw);
if (!Number.isInteger(port) || port < 1024 || port > 65535) {
  throw new Error('Use capture-live.mjs <loopback-port> [output.png].');
}
const root = path.resolve(process.cwd());
const output = path.resolve(providedOutput || 'docs/logs/live-codex-theme.png');
const relative = path.relative(root, output);
if (!relative || relative.startsWith('..') || path.isAbsolute(relative)) {
  throw new Error('Screenshot output must stay inside the current working directory.');
}

await getBrowserVersion(port);
const targets = (await getTargets(port)).filter(isCodexTarget);
const target = targets.find(item => /^app:\/\/codex\//.test(item.url || '')) || targets[0];
if (!target) throw new Error('No Codex renderer target was found.');
await commandTarget(target, 'Page.enable');
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
  stylePresent: Boolean(document.getElementById('wukong-forge-style')),
  markedElements: document.querySelectorAll('[data-forge-mark]').length,
  viewport: { width: innerWidth, height: innerHeight, scale: devicePixelRatio }
}))()`);
fs.writeFileSync(`${output}.json`, `${JSON.stringify(summary, null, 2)}\n`, 'utf8');
console.log(`CAPTURED: ${output}`);
console.log(JSON.stringify(summary));

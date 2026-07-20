import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import {
  commandTarget,
  evaluateTarget,
  getBrowserVersion,
  getTargets,
  isCodexTarget
} from './cdp-client.mjs';

const [,, portRaw = '9222', outputRaw = 'docs/logs/live-codex-theme.png'] = process.argv;
const port = Number(portRaw);
if (!Number.isInteger(port) || port < 1024 || port > 65535) throw Error('Port must be 1024..65535');
const output = path.resolve(outputRaw);
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
const summaryExpression = `(() => {
  const rect = element => {
    const box = element.getBoundingClientRect();
    return { x: box.x, y: box.y, width: box.width, height: box.height };
  };
  const surfaces = [...document.body.children].map(element => ({
    tag: element.tagName,
    role: element.getAttribute('role'),
    className: element.getAttribute('class') || '',
    rect: rect(element),
    background: getComputedStyle(element).backgroundColor
  }));
  const marks = [...document.querySelectorAll('[data-forge-mark]')].map(element => ({
    tag: element.tagName,
    role: element.getAttribute('role'),
    forgeClass: [...element.classList].filter(name => name.startsWith('forge-')),
    text: (element.textContent || '').trim().slice(0, 80),
    rect: rect(element)
  }));
  return {
    title: document.title,
    url: location.href,
    readyState: document.readyState,
    visibility: document.visibilityState,
    viewport: { width: innerWidth, height: innerHeight, devicePixelRatio },
    rootTheme: document.documentElement.classList.contains('forge-ink-mountain'),
    surface: document.documentElement.dataset.forgeSurface || null,
    stylePresent: Boolean(document.getElementById('wukong-forge-style')),
    bodyOwnedNodes: document.body.querySelectorAll('[data-forge-owned]').length,
    bodyBackground: getComputedStyle(document.body).backgroundImage,
    mainBackground: document.querySelector('main') ? getComputedStyle(document.querySelector('main')).background : null,
    surfaces,
    marks
  };
})()`;

let selected = null;
let selectedSummary = null;
let lastError = null;
for (let attempt = 0; attempt < 45; attempt++) {
  try {
    await getBrowserVersion(port);
    const targets = (await getTargets(port)).filter(isCodexTarget);
    const candidates = [];
    for (const target of targets) {
      const summary = await evaluateTarget(target, summaryExpression).catch(() => null);
      if (summary?.viewport?.width > 500 && summary?.viewport?.height > 400) {
        candidates.push({ target, summary });
      }
    }
    candidates.sort((left, right) => {
      const visibility = Number(right.summary.visibility === 'visible') - Number(left.summary.visibility === 'visible');
      if (visibility) return visibility;
      const leftArea = left.summary.viewport.width * left.summary.viewport.height;
      const rightArea = right.summary.viewport.width * right.summary.viewport.height;
      return rightArea - leftArea;
    });
    if (candidates[0]?.summary?.stylePresent) {
      selected = candidates[0].target;
      selectedSummary = candidates[0].summary;
      break;
    }
  } catch (error) {
    lastError = error;
  }
  await sleep(750);
}

if (!selected) throw Error('No themed Codex renderer became ready: ' + (lastError?.message || 'timeout'));
const screenshot = await commandTarget(selected, 'Page.captureScreenshot', {
  format: 'png',
  fromSurface: true,
  captureBeyondViewport: false
});
if (!screenshot?.data) throw Error('CDP did not return screenshot data');
fs.mkdirSync(path.dirname(output), { recursive: true });
fs.writeFileSync(output, Buffer.from(screenshot.data, 'base64'));
fs.writeFileSync(output + '.json', JSON.stringify(selectedSummary, null, 2), 'utf8');
console.log(JSON.stringify({ output, metadata: output + '.json', viewport: selectedSummary.viewport }));

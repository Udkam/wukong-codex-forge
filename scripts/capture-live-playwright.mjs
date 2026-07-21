import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { chromium } from '@playwright/test';

const parseArgs = argv => {
  const values = {};
  for (let index = 0; index < argv.length; index += 2) {
    const flag = argv[index];
    const value = argv[index + 1];
    if (!flag?.startsWith('--') || value == null) throw Error(`Invalid argument near ${flag ?? '(end)'}`);
    values[flag.slice(2)] = value;
  }
  return values;
};

const values = parseArgs(process.argv.slice(2));
const port = Number(values.port);
if (!Number.isInteger(port) || port < 1024 || port > 65535) throw Error('Use --port PORT --output FILE.png');
if (!values.output) throw Error('Use --port PORT --output FILE.png');
const output = path.resolve(values.output);
const reportPath = output.replace(/\.png$/i, '.json');
for (const retainedPath of [output, reportPath]) {
  if (fs.existsSync(retainedPath)) throw Error(`Refusing to overwrite retained evidence: ${retainedPath}`);
}
fs.mkdirSync(path.dirname(output), { recursive: true });

const browser = await chromium.connectOverCDP(`http://127.0.0.1:${port}`);
try {
  const pages = browser.contexts().flatMap(context => context.pages());
  const page = pages.find(candidate => /^app:\/(?:\/codex\/|\/-\/index\.html)/.test(candidate.url()));
  if (!page) throw Error('No Codex app renderer page was found');
  if (values['open-task']) {
    const task = page.getByText(values['open-task'], { exact: true }).first();
    await task.click({ timeout: 15000 });
    await page.waitForTimeout(1800);
  } else if (values['open-new-task'] === 'true') {
    const newTask = page.getByText(/^(新建任务|新建对话|New task|New chat)$/).first();
    await newTask.click({ timeout: 15000 });
    await page.waitForTimeout(1800);
  }
  if (values['scroll-thread-top'] === 'true') {
    await page.evaluate(() => {
      const seed = document.querySelector(
        '[data-thread-find-target="conversation"], [data-virtualized-turn-content], [data-content-search-turn-key]'
      );
      let current = seed;
      while (current) {
        if (current.scrollHeight > current.clientHeight + 20) current.scrollTop = 0;
        current = current.parentElement;
      }
      if (document.scrollingElement) document.scrollingElement.scrollTop = 0;
    });
    await page.waitForTimeout(1400);
  }
  const report = await page.evaluate(() => {
    const rect = element => {
      if (!element) return null;
      const box = element.getBoundingClientRect();
      return { x: box.x, y: box.y, width: box.width, height: box.height };
    };
    const styleState = element => {
      if (!element) return null;
      const style = getComputedStyle(element);
      return {
        backgroundColor: style.backgroundColor,
        backgroundImage: style.backgroundImage,
        borderColor: style.borderColor,
        borderRadius: style.borderRadius,
        boxShadow: style.boxShadow,
        filter: style.filter,
        overflow: style.overflow,
        position: style.position
      };
    };
    const composer = document.querySelector('.forge-composer, .composer-surface-chrome');
    const assistant = document.querySelector('.forge-assistant-turn, [data-local-conversation-final-assistant]');
    const workspace = document.querySelector('.forge-workspace, main');
    const rightCard = document.querySelector('.forge-right-card, [data-pip-obstacle="thread-summary-panel"]');
    const backgroundImage = getComputedStyle(document.body, '::before').backgroundImage;
    return {
      url: location.href,
      title: document.title,
      viewport: { width: innerWidth, height: innerHeight, scale: devicePixelRatio },
      theme: {
        active: document.documentElement.classList.contains('forge-ink-mountain'),
        runtimeV9: Boolean(window.__wukongCodexForgeRuntimeV9),
        mode: document.documentElement.dataset.forgeMode || null,
        scene: document.documentElement.dataset.forgeScene || null,
        wukongSafe: document.documentElement.dataset.forgeWukongSafe || null,
        bajieSafe: document.documentElement.dataset.forgeBajieSafe || null,
        gourdSafe: document.documentElement.dataset.forgeGourdSafe || null,
        styleLength: document.getElementById('wukong-forge-style')?.textContent?.length || 0
      },
      geometry: {
        sidebar: rect(document.querySelector('.forge-sidebar, aside.app-shell-left-panel')),
        workspace: rect(workspace),
        composer: rect(composer),
        rightCard: rect(rightCard)
      },
      styles: {
        composer: styleState(composer),
        assistant: styleState(assistant),
        workspace: styleState(workspace),
        rightCard: styleState(rightCard),
        background: /data:image\/jpeg/i.test(backgroundImage) ? 'embedded-jpeg' : backgroundImage,
        backgroundSize: getComputedStyle(document.body, '::before').backgroundSize,
        veil: getComputedStyle(document.body, '::after').backgroundImage
      },
      composerChildren: composer
        ? [...composer.children].map(child => ({ tag: child.tagName, className: String(child.className || ''), role: child.getAttribute('role') }))
        : [],
      markedElements: document.querySelectorAll('[class*="forge-"]').length
    };
  });
  await page.screenshot({ path: output, type: 'png' });
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2) + '\n', { encoding: 'utf8', flag: 'wx' });
  console.log(JSON.stringify({ output, reportPath, report }));
} finally {
  await browser.close();
}

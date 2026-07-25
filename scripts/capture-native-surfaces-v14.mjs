import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { chromium } from '@playwright/test';
import { payloadFromThemeFile } from '../runtime/forge-runtime.mjs';
import { makeApplyExpression, RESTORE_EXPRESSION } from '../runtime/injection-plan-v13.mjs';
import {
  nativeUiBaseline,
  runtimeFixtureHtml
} from '../tests/runtime-fixture.mjs';

const root = path.resolve(import.meta.dirname, '..');
const stamp = new Date().toISOString().replace(/[:.]/g, '-');
const outputDirectory = path.resolve(
  process.argv[2] || path.join(root, 'artifacts', 'test-runs', `v15-native-surfaces-${stamp}`)
);
if (fs.existsSync(outputDirectory)) {
  throw new Error(`Capture directory already exists: ${outputDirectory}`);
}
fs.mkdirSync(outputDirectory, { recursive: true });

const styleSheet = fs.readFileSync(
  path.join(root, 'runtime', 'forge-background-v13.css'),
  'utf8'
);
const payload = payloadFromThemeFile(path.join(root, 'themes', 'active.json'));
const expression = makeApplyExpression({
  styleSheet,
  variables: payload.variables
});

const installComposerState = (page, state) => page.evaluate(selectedState => {
  const composerRoot = document.querySelector('[data-codex-composer-root]');
  if (selectedState === 'context') {
    const context = document.createElement('div');
    context.dataset.fixtureSurface = 'composer-context';
    context.style.cssText =
      'pointer-events:auto;display:flex;width:100%;height:var(--spacing-token-button-composer);' +
      'align-items:center;gap:var(--spacing-token-button-composer-gap);margin-bottom:8px';
    context.innerHTML = `
      <button data-composer-navigation-target="workspace-project">wukong-codex-forge</button>
      <button data-composer-navigation-target="environment">本地</button>
      <button data-composer-navigation-target="branch">main</button>`;
    composerRoot.prepend(context);
    return;
  }

  const planWrap = document.createElement('div');
  planWrap.dataset.fixtureSurface = 'plan-wrap';
  planWrap.style.cssText =
    'pointer-events:auto;display:flex;width:100%;height:var(--height-token-row);' +
    'align-items:center;justify-content:center;margin-bottom:8px';
  planWrap.innerHTML = `
    <button data-fixture-control="plan"
      style="display:flex;height:var(--spacing-token-button-composer);align-items:center;justify-content:center;gap:var(--spacing-token-button-composer-gap);white-space:nowrap">
      <span style="color:#78827b">◯</span>
      <span>第 1 / 5 步 · 10 个文件已更改</span>
      <span style="color:#398246">+691</span>
      <span style="color:#a23831">-226</span>
    </button>`;

  const stack = document.createElement('div');
  stack.className = 'order-2 flex min-w-0 flex-col';
  stack.dataset.fixtureSurface = 'composer-stack';
  stack.style.cssText =
    'pointer-events:auto;display:flex;width:100%;flex-direction:column;gap:8px;margin-bottom:8px';
  const guidance = selectedState === 'guided'
    ? `
      <div class="relative min-w-0 overflow-clip" data-fixture-surface="guide-panel"
        style="display:flex;width:100%;height:var(--height-token-row);align-items:center;padding:0 var(--padding-row-x)">
        <span style="font-size:20px;margin-right:12px">↪</span>
        <span>1</span>
        <span style="margin-left:auto">引导　⌫　…</span>
      </div>`
    : '';
  stack.innerHTML = `
    ${guidance}
    <div class="relative min-w-0 overflow-clip" data-fixture-surface="composer-panel"
      style="display:flex;width:100%;height:var(--height-token-row);align-items:center;padding:0 var(--padding-row-x)">
      <span style="margin-right:14px">◎</span>
      <strong>进行中的目标</strong>
      <span style="margin-left:12px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">
        需解决的问题：①解谜关卡选择页面中如果加上“当前…”
      </span>
      <span style="margin-left:auto;white-space:nowrap">30m 25s　⌕　Ⅱ　⌫　›</span>
    </div>`;
  const footer = composerRoot.querySelector('.composer-footer');
  const goal = document.createElement('button');
  goal.dataset.fixtureControl = 'goal';
  goal.innerHTML = '<span>◎</span><span>目标</span>';
  footer.querySelector('[data-native-slot="composer-model"]').before(goal);
  composerRoot.prepend(stack);
  composerRoot.prepend(planWrap);
}, state);

const browser = await chromium.launch({ headless: true });
try {
  const newPage = async state => {
    const page = await browser.newPage({
      viewport: { width: 1600, height: 900 },
      deviceScaleFactor: nativeUiBaseline.rendererDeviceScaleFactor
    });
    await page.route('http://wukong-v14-capture.test/**', route => route.fulfill({
      body: runtimeFixtureHtml,
      contentType: 'text/html; charset=utf-8'
    }));
    await page.goto(`http://wukong-v14-capture.test/?state=${state}`);
    if (state !== 'default') await installComposerState(page, state);
    await page.evaluate(expression);
    await page.waitForFunction(() => (
      document.querySelector('.composer-surface-chrome')
        ?.classList.contains('forge-composer-frame') &&
      document.querySelectorAll('.forge-topbar-menu-item').length === 4
    ));
    return page;
  };

  const page = await newPage('default');
  const files = {
    fullDefault: path.join(outputDirectory, '01-full-default.png'),
    sidebar: path.join(outputDirectory, '02-sidebar-levels.png'),
    composerDefault: path.join(outputDirectory, '03-composer-default.png'),
    topbarOpen: path.join(outputDirectory, '04-topbar-open.png'),
    composerContext: path.join(outputDirectory, '05-composer-context.png'),
    composerProgress: path.join(outputDirectory, '06-composer-progress.png'),
    composerGuided: path.join(outputDirectory, '07-composer-guided.png')
  };
  await page.screenshot({ path: files.fullDefault, fullPage: true });
  await page.locator('aside.app-shell-left-panel').screenshot({ path: files.sidebar });
  await page.locator('.composer-area').screenshot({ path: files.composerDefault });

  await page.locator('[data-native-slot="menu-view"]').evaluate(element => {
    element.setAttribute('aria-expanded', 'true');
  });
  await page.locator('[data-native-slot="project-temple-child"]').hover();
  await page.locator('[class~="group/application-menu-top-bar"]')
    .screenshot({ path: files.topbarOpen });

  const metrics = await page.evaluate(() => {
    const count = selector => document.querySelectorAll(selector).length;
    const rect = selector => {
      const box = document.querySelector(selector).getBoundingClientRect();
      return [box.x, box.y, box.width, box.height];
    };
    return {
      marked: count('[data-forge-mark]'),
      topbarMenuItems: count('.forge-topbar-menu-item'),
      sidebarActions: count('.forge-sidebar-action'),
      sidebarLevel1: count('.forge-sidebar-level1'),
      sidebarLevel2: count('.forge-sidebar-level2'),
      sidebarSelected: count('.forge-sidebar-selected'),
      composerFrames: count('.forge-composer-frame'),
      topbarRect: rect('[class~="group/application-menu-top-bar"]'),
      sidebarRect: rect('aside.app-shell-left-panel'),
      composerRect: rect('.composer-surface-chrome')
    };
  });
  await page.evaluate(RESTORE_EXPRESSION);
  const restoredMarks = await page.locator('[data-forge-mark]').count();
  await page.close();

  const contextPage = await newPage('context');
  await contextPage.waitForFunction(() => document.querySelector('.forge-composer-context'));
  await contextPage.locator('.composer-area').screenshot({ path: files.composerContext });
  const contextMarks = await contextPage.locator('.forge-composer-context').count();
  await contextPage.evaluate(RESTORE_EXPRESSION);
  await contextPage.close();

  const progressPage = await newPage('progress');
  await progressPage.waitForFunction(() => (
    document.querySelector('.forge-plan-pill') &&
    document.querySelector('.forge-composer-panel')
  ));
  await progressPage.locator('.composer-area').screenshot({ path: files.composerProgress });
  const progressMarks = {
    plan: await progressPage.locator('.forge-plan-pill').count(),
    panels: await progressPage.locator('.forge-composer-panel').count()
  };
  await progressPage.evaluate(RESTORE_EXPRESSION);
  await progressPage.close();

  const guidedPage = await newPage('guided');
  await guidedPage.waitForFunction(() => (
    document.querySelector('.forge-plan-pill') &&
    document.querySelectorAll('.forge-composer-panel').length === 2
  ));
  await guidedPage.locator('.composer-area').screenshot({ path: files.composerGuided });
  const guidedMarks = {
    plan: await guidedPage.locator('.forge-plan-pill').count(),
    panels: await guidedPage.locator('.forge-composer-panel').count()
  };
  await guidedPage.evaluate(RESTORE_EXPRESSION);
  await guidedPage.close();

  fs.writeFileSync(
    path.join(outputDirectory, 'capture.json'),
    `${JSON.stringify({
      generatedAt: new Date().toISOString(),
      source: 'headless native-structure fixture; not real Codex acceptance',
      files,
      metrics,
      states: {
        contextMarks,
        progressMarks,
        guidedMarks
      },
      restoredMarks
    }, null, 2)}\n`,
    'utf8'
  );
  console.log(outputDirectory);
} finally {
  await browser.close();
}

// Playwright's Windows driver can retain an otherwise idle stdio handle after
// browser.close(). The capture is complete at this point; exit explicitly so a
// QA screenshot never leaves a debug helper resident beside Codex.
process.exit(0);

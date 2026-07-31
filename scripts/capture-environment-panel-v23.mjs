import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { chromium } from '@playwright/test';
import { payloadFromThemeFile } from '../runtime/forge-runtime.mjs';
import {
  makeApplyExpression,
  RESTORE_EXPRESSION
} from '../runtime/injection-plan-v13.mjs';
import {
  installComposerState,
  nativeUiBaseline,
  runtimeFixtureHtml
} from '../tests/runtime-fixture.mjs';

const root = path.resolve(import.meta.dirname, '..');
const stamp = new Date().toISOString().replace(/[:.]/g, '-');
const outputDirectory = path.resolve(
  process.argv[2] ||
  path.join(root, 'artifacts', 'test-runs', `v23-environment-panel-${stamp}`)
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

const readGeometry = page => page.evaluate(() => {
  const rectOf = element => {
    if (!element) return null;
    const rect = element.getBoundingClientRect();
    return [rect.x, rect.y, rect.width, rect.height];
  };
  const card = document.querySelector('[data-native-slot="right-card"]');
  return {
    panel: rectOf(document.querySelector('[data-pip-obstacle="thread-summary-panel"]')),
    card: rectOf(card),
    title: rectOf(card?.querySelector('.summary-heading')),
    rows: [...(card?.querySelectorAll('[data-slot="thread-summary-panel-item"]') || [])]
      .map(rectOf),
    composer: rectOf(document.querySelector('.composer-surface-chrome')),
    queue: rectOf(document.querySelector('[data-fixture-surface="queued-panel"]')),
    goal: rectOf(document.querySelector('[data-fixture-surface="goal-panel"]'))
  };
});

const browser = await chromium.launch({ headless: true });
let page;
try {
  page = await browser.newPage({
    viewport: { width: 1600, height: 900 },
    deviceScaleFactor: nativeUiBaseline.rendererDeviceScaleFactor
  });
  await page.route('http://wukong-v23-environment-capture.test/**', route => route.fulfill({
    body: runtimeFixtureHtml,
    contentType: 'text/html; charset=utf-8'
  }));
  await page.goto('http://wukong-v23-environment-capture.test/', {
    waitUntil: 'networkidle'
  });
  await installComposerState(page, 'multi-guided');
  const before = await readGeometry(page);
  assert.equal(before.card?.[2], 300, 'native environment card width changed');
  assert.equal(before.rows.length, 4, 'native environment row count changed');

  await page.evaluate(expression);
  await page.waitForFunction(() => (
    document.querySelector('[data-native-slot="right-card"]')
      ?.classList.contains('forge-right-card') &&
    document.querySelectorAll('.forge-right-row').length === 4 &&
    document.querySelectorAll('.forge-composer-queue-item').length === 2 &&
    document.documentElement.dataset.forgeBackgroundReady === 'true'
  ));
  const after = await readGeometry(page);
  assert.deepEqual(
    {
      panel: after.panel,
      card: after.card,
      title: after.title,
      rows: after.rows
    },
    {
      panel: before.panel,
      card: before.card,
      title: before.title,
      rows: before.rows
    },
    'paint changed native environment-panel geometry'
  );
  assert.equal(after.composer[0], before.composer[0], 'composer x anchor changed');
  assert.equal(after.composer[2], before.composer[2], 'composer width changed');
  assert.equal(
    after.composer[1] + after.composer[3],
    before.composer[1] + before.composer[3],
    'composer bottom anchor changed'
  );
  assert.ok(
    after.composer[3] >= 96 && after.composer[3] <= 120,
    'custom composer height left its approved 96px–120px range'
  );
  const composerRise = before.composer[1] - after.composer[1];
  assert.equal(composerRise, after.composer[3] - before.composer[3]);
  for (const key of ['queue', 'goal']) {
    assert.deepEqual(
      [after[key][0], after[key][2], after[key][3]],
      [before[key][0], before[key][2], before[key][3]],
      `${key} size or x anchor changed`
    );
    assert.equal(
      before[key][1] - after[key][1],
      composerRise,
      `${key} did not follow the composer height adjustment as one native stack`
    );
  }

  const paint = await page.evaluate(() => {
    const card = document.querySelector('.forge-right-card');
    const paper = getComputedStyle(card, '::before');
    return {
      markedRows: document.querySelectorAll('.forge-right-row').length,
      cardBackground: getComputedStyle(card).backgroundImage,
      cardClipPath: getComputedStyle(card).clipPath,
      paperBackground: paper.backgroundImage,
      paperClipPath: paper.clipPath,
      paperPointerEvents: paper.pointerEvents,
      progressFadeOpacity: getComputedStyle(
        document.querySelector('.forge-composer-progress-fade')
      ).opacity
    };
  });
  assert.equal(paint.markedRows, 4);
  assert.equal(paint.cardBackground, 'none');
  assert.equal(paint.cardClipPath, 'none');
  assert.match(paint.paperBackground, /paper|data:image|url\(/i);
  assert.match(paint.paperClipPath, /^polygon\(/);
  assert.equal(paint.paperPointerEvents, 'none');
  assert.equal(paint.progressFadeOpacity, '0');

  const screenshot = path.join(outputDirectory, '01-full-multi-guided.png');
  await page.screenshot({ path: screenshot, fullPage: false });
  await page.evaluate(RESTORE_EXPRESSION);
  assert.equal(await page.locator('[data-forge-mark]').count(), 0);

  fs.writeFileSync(
    path.join(outputDirectory, 'capture.json'),
    `${JSON.stringify({
      generatedAt: new Date().toISOString(),
      source: 'headless native-structure fixture; not real Codex acceptance',
      screenshot,
      geometry: { before, after },
      paint
    }, null, 2)}\n`,
    'utf8'
  );
  console.log(outputDirectory);
} finally {
  await page?.close();
  await browser.close();
}

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
  nativeUiBaseline,
  runtimeFixtureHtml
} from '../tests/runtime-fixture.mjs';

const root = path.resolve(import.meta.dirname, '..');
const outputDirectory = path.resolve(
  process.argv[2] ||
    path.join(root, 'artifacts', 'test-runs', `v16-landing-composition-${Date.now()}`)
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

const browser = await chromium.launch({ headless: true });
try {
  const page = await browser.newPage({
    viewport: { width: 1600, height: 900 },
    deviceScaleFactor: nativeUiBaseline.rendererDeviceScaleFactor
  });
  await page.route('http://wukong-v16-capture.test/**', route => route.fulfill({
    body: runtimeFixtureHtml,
    contentType: 'text/html; charset=utf-8'
  }));
  await page.goto('http://wukong-v16-capture.test/');
  await page.evaluate(expression);
  await page.waitForFunction(() => {
    const runtime = window.__wukongCodexForgeRuntimeV13;
    return Boolean(
      runtime &&
      !runtime.transitionInFlight &&
      document.documentElement.dataset.forgeBackgroundReady === 'true' &&
      document.querySelector('.forge-landing-icon') &&
      document.querySelector('.forge-landing-title') &&
      document.querySelector('.forge-landing-kicker') &&
      document.querySelector('.forge-landing-subtitle')
    );
  });

  const records = [];
  const seenScenes = new Set();
  for (let index = 0; index < 12; index += 1) {
    const record = await page.evaluate(() => {
      const rootElement = document.documentElement;
      const icon = document.querySelector('.forge-landing-icon');
      const title = document.querySelector('.forge-landing-title');
      const kicker = document.querySelector('.forge-landing-kicker');
      const subtitle = document.querySelector('.forge-landing-subtitle');
      const rect = element => {
        const box = element.getBoundingClientRect();
        return {
          x: box.x,
          y: box.y,
          width: box.width,
          height: box.height
        };
      };
      const iconPaint = getComputedStyle(icon, '::before');
      const titlePaint = getComputedStyle(title, '::after');
      return {
        scene: Number.parseInt(rootElement.dataset.forgeScene, 10),
        iconHost: rect(icon),
        iconPaint: {
          width: iconPaint.width,
          height: iconPaint.height,
          left: iconPaint.left,
          top: iconPaint.top,
          transform: iconPaint.transform,
          backgroundImage: iconPaint.backgroundImage.slice(0, 64)
        },
        title: {
          ...rect(title),
          fontSize: titlePaint.fontSize,
          letterSpacing: titlePaint.letterSpacing
        },
        hiddenNativeLines: {
          kickerOpacity: getComputedStyle(kicker).opacity,
          subtitleOpacity: getComputedStyle(subtitle).opacity
        }
      };
    });
    if (seenScenes.has(record.scene)) break;
    seenScenes.add(record.scene);
    const fileName = `${String(index).padStart(2, '0')}-scene-${record.scene}.png`;
    await page.screenshot({
      path: path.join(outputDirectory, fileName),
      fullPage: true
    });
    records.push({ ...record, file: fileName });

    const priorScene = record.scene;
    await page.locator('[data-native-slot="new-task"]').click();
    await page.waitForFunction(previous => {
      const runtime = window.__wukongCodexForgeRuntimeV13;
      return Boolean(
        runtime &&
        runtime.currentScene !== previous &&
        !runtime.transitionInFlight &&
        !runtime.requestedScene
      );
    }, priorScene);
  }

  fs.writeFileSync(
    path.join(outputDirectory, 'capture.json'),
    `${JSON.stringify({
      source: 'headless native-structure fixture',
      viewport: { width: 1600, height: 900 },
      deviceScaleFactor: nativeUiBaseline.rendererDeviceScaleFactor,
      records
    }, null, 2)}\n`,
    'utf8'
  );
  await page.evaluate(RESTORE_EXPRESSION);
  await page.close();
  process.stdout.write(`${outputDirectory}\n`);
} finally {
  await browser.close();
}

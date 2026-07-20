import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { PNG } from 'pngjs';
import { chromium } from '@playwright/test';
import { makeTheme, cssFor } from '../shared/theme-model.mjs';
import { makeApplyExpression, RESTORE_EXPRESSION } from '../runtime/injection-plan.mjs';
import { runtimeFixtureHtml, enterThreadState, geometry } from './runtime-fixture.mjs';

const averageLuminance = (png, box) => {
  let total = 0;
  let count = 0;
  for (let y = box.y; y < box.y + box.height; y += 8) {
    for (let x = box.x; x < box.x + box.width; x += 8) {
      const index = (png.width * y + x) * 4;
      total += png.data[index] * .2126 + png.data[index + 1] * .7152 + png.data[index + 2] * .0722;
      count++;
    }
  }
  return total / count;
};

test('Wukong style visibly replaces background, navigation and composer without moving native slots', async t => {
  const browser = await chromium.launch({ headless: true });
  t.after(() => browser.close());
  const page = await browser.newPage({ viewport: { width: 1600, height: 900 }, deviceScaleFactor: 1 });
  await page.setContent(runtimeFixtureHtml);
  const nativeGeometry = await geometry(page);
  const image = `data:image/jpeg;base64,${fs.readFileSync(new URL('../themes/assets/great-sage-return.jpg', import.meta.url)).toString('base64')}`;
  const styleSheet = fs.readFileSync(new URL('../runtime/forge-theme.css', import.meta.url), 'utf8');
  await page.evaluate(makeApplyExpression({ styleSheet, variables: cssFor(makeTheme(), image) }));

  const landingStyles = await page.evaluate(() => ({
    colorScheme: getComputedStyle(document.documentElement).colorScheme,
    bodyBackground: getComputedStyle(document.body).backgroundImage,
    workspaceBackground: getComputedStyle(document.querySelector('.forge-workspace')).backgroundImage,
    composerRadius: getComputedStyle(document.querySelector('.forge-composer')).borderRadius,
    composerBackground: getComputedStyle(document.querySelector('.forge-composer')).backgroundImage,
    newTaskShadow: getComputedStyle(document.querySelector('.forge-new-task')).boxShadow,
    sidebarClip: getComputedStyle(document.querySelector('.forge-sidebar-action')).clipPath
  }));
  assert.equal(landingStyles.colorScheme, 'light');
  assert.match(landingStyles.bodyBackground, /data:image\/jpeg/);
  assert.match(landingStyles.workspaceBackground, /data:image\/jpeg/);
  assert.notEqual(landingStyles.composerBackground, 'none');
  assert.match(landingStyles.composerRadius, /3px 18px/);
  assert.notEqual(landingStyles.newTaskShadow, 'none');
  assert.notEqual(landingStyles.sidebarClip, 'none');
  assert.deepEqual(await geometry(page), nativeGeometry);

  const landingBuffer = await page.screenshot({ path: 'docs/screenshots/runtime-style-landing.png' });
  const landing = PNG.sync.read(landingBuffer);
  await enterThreadState(page);
  await page.waitForTimeout(180);
  const threadBuffer = await page.screenshot({ path: 'docs/screenshots/runtime-style-thread.png' });
  const thread = PNG.sync.read(threadBuffer);
  assert.deepEqual(await geometry(page), nativeGeometry);

  const artBox = { x: 790, y: 110, width: 480, height: 430 };
  const landingLight = averageLuminance(landing, artBox);
  const threadLight = averageLuminance(thread, artBox);
  assert.ok(landingLight > 155, `landing must stay bright: ${landingLight.toFixed(2)}`);
  assert.ok(threadLight > 155, `thread must stay bright: ${threadLight.toFixed(2)}`);
  assert.ok(Math.abs(landingLight - threadLight) > 5, `landing and thread should remain visually distinct: ${landingLight.toFixed(2)} vs ${threadLight.toFixed(2)}`);

  await page.evaluate(RESTORE_EXPRESSION);
  const restored = await page.evaluate(() => ({
    backgroundImage: getComputedStyle(document.body).backgroundImage,
    workspaceBackground: getComputedStyle(document.querySelector('main')).backgroundImage,
    rootClass: document.documentElement.classList.contains('forge-ink-mountain'),
    stylePresent: Boolean(document.getElementById('wukong-forge-style'))
  }));
  assert.deepEqual(restored, {
    backgroundImage: 'none',
    workspaceBackground: 'none',
    rootClass: false,
    stylePresent: false
  });
});

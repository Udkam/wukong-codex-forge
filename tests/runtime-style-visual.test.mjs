import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { PNG } from 'pngjs';
import { chromium } from '@playwright/test';
import { makeTheme, cssFor } from '../shared/theme-model.mjs';
import { makeApplyExpression, RESTORE_EXPRESSION } from '../runtime/injection-plan.mjs';
import {
  runtimeFixtureHtml,
  enterThreadState,
  geometry,
  conversationGeometry,
  conversationText
} from './runtime-fixture.mjs';

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
    composerClip: getComputedStyle(document.querySelector('.forge-composer')).clipPath,
    composerBackground: getComputedStyle(document.querySelector('.forge-composer')).backgroundImage,
    newTaskShadow: getComputedStyle(document.querySelector('.forge-new-task')).boxShadow,
    sidebarClip: getComputedStyle(document.querySelector('.forge-sidebar-action')).clipPath,
    landingSeal: getComputedStyle(document.querySelector('.forge-landing-title'), '::before').backgroundImage,
    sidebarIconRing: getComputedStyle(document.querySelector('.forge-sidebar-action > :first-child')).boxShadow,
    composerWidth: document.querySelector('.forge-composer').getBoundingClientRect().width
  }));
  assert.equal(landingStyles.colorScheme, 'dark');
  assert.match(landingStyles.bodyBackground, /data:image\/jpeg/);
  assert.match(landingStyles.workspaceBackground, /data:image\/jpeg/);
  assert.notEqual(landingStyles.composerBackground, 'none');
  assert.equal(landingStyles.composerRadius, '18px 8px');
  assert.equal(landingStyles.composerClip, 'none');
  assert.notEqual(landingStyles.newTaskShadow, 'none');
  assert.equal(landingStyles.sidebarClip, 'none');
  assert.match(landingStyles.landingSeal, /repeating-conic-gradient/);
  assert.notEqual(landingStyles.sidebarIconRing, 'none');
  assert.equal(landingStyles.composerWidth, 736);
  assert.deepEqual(await geometry(page), nativeGeometry);

  const landingBuffer = await page.screenshot({ path: 'docs/screenshots/runtime-style-landing.png' });
  const landing = PNG.sync.read(landingBuffer);
  const authored = await enterThreadState(page);
  await page.waitForTimeout(180);
  const threadBuffer = await page.screenshot({ path: 'docs/screenshots/runtime-style-thread.png' });
  const thread = PNG.sync.read(threadBuffer);
  assert.deepEqual(await geometry(page), nativeGeometry);
  assert.deepEqual(await conversationGeometry(page), authored.geometry);
  assert.equal(await conversationText(page), authored.text);

  const assistantFrame = await page.locator('.forge-assistant-message').evaluate(element => {
    const style = getComputedStyle(element);
    return [style.backgroundImage, style.backgroundColor, style.borderColor, style.boxShadow];
  });
  assert.deepEqual(assistantFrame, ['none', 'rgba(0, 0, 0, 0)', 'rgba(0, 0, 0, 0)', 'none']);

  const artBox = { x: 790, y: 110, width: 480, height: 430 };
  const landingLight = averageLuminance(landing, artBox);
  const threadLight = averageLuminance(thread, artBox);
  assert.ok(landingLight > 70 && landingLight < 150, `landing must remain balanced, not black or bleached: ${landingLight.toFixed(2)}`);
  assert.ok(threadLight > 55 && threadLight < 130, `thread must remain balanced, not black or bleached: ${threadLight.toFixed(2)}`);
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

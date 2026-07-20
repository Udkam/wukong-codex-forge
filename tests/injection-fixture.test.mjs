import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
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

test('runtime restyles native surfaces, follows dynamic thread state, and restores cleanly', async t => {
  const browser = await chromium.launch({ headless: true });
  t.after(() => browser.close());
  const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
  await page.setContent(runtimeFixtureHtml);
  const nativeGeometry = await geometry(page);
  const nativeBodyChildren = await page.locator('body > *').count();
  const styleSheet = fs.readFileSync(new URL('../runtime/forge-theme.css', import.meta.url), 'utf8');
  const expression = makeApplyExpression({
    styleSheet,
    variables: cssFor(makeTheme(), 'data:image/jpeg;base64,AA==')
  });

  await page.evaluate(expression);
  assert.equal(await page.locator('html').getAttribute('data-forge-surface'), 'landing');
  assert.deepEqual(await geometry(page), nativeGeometry);
  assert.equal(await page.locator('body > *').count(), nativeBodyChildren);
  assert.equal(await page.locator('body [data-forge-owned]').count(), 0);
  assert.equal(await page.locator('.forge-workspace').count(), 1);
  assert.equal(await page.locator('.forge-taskbar').count(), 1);
  assert.equal(await page.locator('.forge-sidebar').count(), 1);
  assert.equal(await page.locator('.forge-new-task').count(), 1);
  assert.equal(await page.locator('.forge-composer').count(), 1);
  assert.equal(await page.locator('.forge-landing-title').count(), 1);
  assert.equal(await page.locator('.forge-sidebar-action').first().evaluate(element => getComputedStyle(element).clipPath), 'none');
  assert.notEqual(await page.locator('.forge-sidebar-action > :first-child').first().evaluate(element => getComputedStyle(element).boxShadow), 'none');
  assert.equal(nativeGeometry.composer[2], 736);

  const authored = await enterThreadState(page);
  await page.waitForTimeout(180);
  assert.equal(await page.locator('html').getAttribute('data-forge-surface'), 'thread');
  assert.equal(await page.locator('.forge-turn').count(), 2);
  assert.equal(await page.locator('.forge-user-message').count(), 1);
  assert.equal(await page.locator('.forge-assistant-message').count(), 1);
  assert.equal(await page.locator('.forge-code-block').count(), 1);
  assert.deepEqual(await geometry(page), nativeGeometry);
  assert.deepEqual(await conversationGeometry(page), authored.geometry);
  assert.equal(await conversationText(page), authored.text);
  assert.equal(await page.locator('[data-local-conversation-user-anchor].forge-user-message').count(), 0);

  const assistantFrame = await page.locator('.forge-assistant-message').evaluate(element => {
    const style = getComputedStyle(element);
    return {
      backgroundImage: style.backgroundImage,
      backgroundColor: style.backgroundColor,
      borderColor: style.borderColor,
      boxShadow: style.boxShadow
    };
  });
  assert.deepEqual(assistantFrame, {
    backgroundImage: 'none',
    backgroundColor: 'rgba(0, 0, 0, 0)',
    borderColor: 'rgba(0, 0, 0, 0)',
    boxShadow: 'none'
  });

  await page.evaluate(RESTORE_EXPRESSION);
  await page.waitForTimeout(150);
  assert.equal(await page.locator('[data-forge-mark]').count(), 0);
  assert.equal(await page.locator('#wukong-forge-style').count(), 0);
  assert.equal(await page.locator('html').getAttribute('data-forge-surface'), null);
  assert.equal(await page.locator('html').evaluate(element => element.classList.contains('forge-ink-mountain')), false);
});

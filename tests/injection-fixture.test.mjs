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
  const nativeShapes = await page.evaluate(() => ({
    composerRadius: getComputedStyle(document.querySelector('.composer-native')).borderRadius,
    sidebarRadius: getComputedStyle(document.querySelector('.sidebar-row')).borderRadius,
    rightCardRadius: getComputedStyle(document.querySelector('.summary-panel-card')).borderRadius,
    sendRadius: getComputedStyle(document.querySelector('.send')).borderRadius
  }));
  const nativeBodyChildren = await page.locator('body > *').count();
  const styleSheet = fs.readFileSync(new URL('../runtime/forge-theme.css', import.meta.url), 'utf8');
  const expression = makeApplyExpression({
    styleSheet,
    variables: cssFor(makeTheme(), [
      { id: 'great-sage', url: 'data:image/jpeg;base64,AA==', position: 'right center', mode: 'scenery' },
      { id: 'erlang', url: 'data:image/jpeg;base64,AQ==', position: 'center center', mode: 'battle-primary' },
      { id: 'mountain', url: 'data:image/jpeg;base64,Ag==', position: 'center center', mode: 'scenery' }
    ])
  });

  await page.evaluate(expression);
  assert.equal(await page.locator('html').getAttribute('data-forge-surface'), 'landing');
  assert.equal(await page.locator('html').getAttribute('data-forge-mode'), 'battle');
  assert.equal(await page.locator('html').getAttribute('data-forge-scene'), '1');
  assert.deepEqual(await geometry(page), nativeGeometry);
  assert.equal(await page.locator('body > *').count(), nativeBodyChildren);
  assert.equal(await page.locator('body [data-forge-owned]').count(), 0);
  assert.equal(await page.locator('.forge-workspace').count(), 1);
  assert.equal(await page.locator('.forge-taskbar').count(), 1);
  assert.equal(await page.locator('.forge-sidebar').count(), 1);
  assert.equal(await page.locator('.forge-new-task').count(), 1);
  assert.equal(await page.locator('.forge-composer').count(), 1);
  assert.equal(await page.locator('.composer-native.forge-composer').count(), 1);
  assert.equal(await page.locator('[data-thread-find-composer].forge-composer').count(), 0);
  assert.equal(await page.locator('.forge-landing-title').count(), 1);
  assert.equal(await page.locator('.forge-sidebar-action').first().evaluate(element => getComputedStyle(element).clipPath), 'none');
  assert.equal(nativeGeometry.composer[2], 736);
  assert.deepEqual(await page.evaluate(() => ({
    composerRadius: getComputedStyle(document.querySelector('.forge-composer')).borderRadius,
    sidebarRadius: getComputedStyle(document.querySelector('.forge-sidebar-action')).borderRadius,
    rightCardRadius: getComputedStyle(document.querySelector('.forge-right-card')).borderRadius,
    sendRadius: getComputedStyle(document.querySelector('.send')).borderRadius
  })), nativeShapes);

  const authored = await enterThreadState(page);
  await page.waitForTimeout(180);
  assert.equal(await page.locator('html').getAttribute('data-forge-surface'), 'thread');
  assert.equal(await page.locator('html').getAttribute('data-forge-mode'), 'scenery');
  assert.ok(['0', '2'].includes(await page.locator('html').getAttribute('data-forge-scene')));
  assert.equal(await page.locator('.forge-turn').count(), 2);
  assert.equal(await page.locator('.forge-user-message').count(), 1);
  assert.equal(await page.locator('.forge-assistant-message').count(), 1);
  assert.equal(await page.locator('[data-local-conversation-final-assistant].forge-assistant-message').count(), 1);
  assert.equal(await page.locator('.forge-code-block').count(), 1);
  assert.deepEqual(await geometry(page), nativeGeometry);
  assert.deepEqual(await conversationGeometry(page), authored.geometry);
  assert.equal(await conversationText(page), authored.text);
  assert.equal(await page.locator('[data-local-conversation-user-anchor].forge-user-message').count(), 0);

  const assistantFrame = await page.locator('[data-local-conversation-final-assistant].forge-assistant-message').evaluate(element => {
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
  assert.equal(await page.locator('html').getAttribute('data-forge-scene'), null);
  assert.equal(await page.locator('html').getAttribute('data-forge-mode'), null);
  assert.equal(await page.locator('html').evaluate(element => element.classList.contains('forge-ink-mountain')), false);
});

test('runtime refuses an oversized outer composer shell instead of stretching it', async t => {
  const browser = await chromium.launch({ headless: true });
  t.after(() => browser.close());
  const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
  await page.setContent(runtimeFixtureHtml);
  await page.evaluate(() => {
    const semanticShell = document.querySelector('[data-thread-find-composer="true"]');
    const editor = document.querySelector('.ProseMirror');
    semanticShell.replaceChildren(editor);
  });
  const styleSheet = fs.readFileSync(new URL('../runtime/forge-theme.css', import.meta.url), 'utf8');
  await page.evaluate(makeApplyExpression({ styleSheet, variables: cssFor(makeTheme()) }));
  assert.equal(await page.locator('[data-thread-find-composer].forge-composer').count(), 0);
  assert.equal(await page.locator('.forge-composer').count(), 0);
  assert.equal(await page.locator('.forge-input').count(), 1);
});

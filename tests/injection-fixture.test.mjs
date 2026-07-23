import nodeTest from 'node:test';
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

// V11 surface-replacement cases are retained as executable history. V12 has a
// new background-only contract covered by background-runtime-v12.test.mjs.
const test = nodeTest.skip;

const V11_MOTIFS = {
  xiangfeiGourd: 'data:image/webp;base64,Aw=='
};

const surfaceShapes = page => page.evaluate(() => ({
  composerRadius: getComputedStyle(document.querySelector('.composer-native')).borderRadius,
  sidebarRadius: getComputedStyle(document.querySelector('.sidebar-row')).borderRadius,
  rightCardRadius: getComputedStyle(document.querySelector('.summary-panel-card')).borderRadius,
  sendRadius: getComputedStyle(document.querySelector('.send')).borderRadius
}));

const fixtureExpression = styleSheet => makeApplyExpression({
  styleSheet,
  variables: cssFor(makeTheme(), [
    { id: 'great-sage', url: 'data:image/jpeg;base64,AA==', position: 'right center', mode: 'scenery' },
    { id: 'erlang', url: 'data:image/jpeg;base64,AQ==', position: 'center center', mode: 'battle-primary' },
    { id: 'mountain', url: 'data:image/jpeg;base64,Ag==', position: 'center center', mode: 'scenery' }
  ], V11_MOTIFS)
});

test('runtime restyles native surfaces, follows dynamic thread state, and restores cleanly', async t => {
  const browser = await chromium.launch({ headless: true });
  t.after(() => browser.close());
  const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
  await page.setContent(runtimeFixtureHtml);
  const nativeGeometry = await geometry(page);
  const nativeShapes = await surfaceShapes(page);
  const nativeBodyChildren = await page.locator('body > *').count();
  const nativeBodyText = await page.locator('body').innerText();
  const nativePlaceholder = await page.locator('.ProseMirror').getAttribute('data-placeholder');
  const styleSheet = fs.readFileSync(new URL('../runtime/forge-theme.css', import.meta.url), 'utf8');
  const expression = fixtureExpression(styleSheet);

  await page.evaluate(expression);
  assert.equal(await page.locator('html').getAttribute('data-forge-surface'), 'landing');
  assert.equal(await page.locator('html').getAttribute('data-forge-mode'), 'battle');
  assert.equal(await page.locator('html').getAttribute('data-forge-scene'), '1');
  assert.deepEqual(await geometry(page), nativeGeometry);
  assert.equal(await page.locator('body > *').count(), nativeBodyChildren + 1);
  assert.equal(await page.locator('body').innerText(), nativeBodyText);
  assert.equal(await page.locator('.ProseMirror').getAttribute('data-placeholder'), nativePlaceholder);
  assert.equal(await page.locator('body > #wukong-forge-motif-overlay[data-forge-owned="motif-overlay"]').count(), 1);
  assert.equal(await page.locator('#wukong-forge-motif-overlay > [data-forge-motif]').count(), 1);
  assert.equal(await page.locator('[data-forge-pet]').count(), 0);
  assert.equal(await page.locator('.forge-workspace').count(), 1);
  assert.equal(await page.locator('.forge-taskbar').count(), 1);
  assert.equal(await page.locator('.forge-sidebar').count(), 1);
  assert.equal(await page.locator('.forge-new-task').count(), 1);
  assert.equal(await page.locator('.forge-composer').count(), 1);
  assert.equal(await page.locator('.composer-native.forge-composer').count(), 1);
  assert.equal(await page.locator('[data-thread-find-composer].forge-composer').count(), 0);
  assert.equal(await page.locator('.summary-panel-card.forge-right-card').count(), 1);
  assert.equal(await page.locator('[data-pip-obstacle="thread-summary-panel"].forge-right-card').count(), 0);
  assert.equal(await page.locator('.forge-landing-title').count(), 1);
  assert.equal(await page.locator('.forge-sidebar-action').first().evaluate(element => getComputedStyle(element).clipPath), 'none');
  assert.equal(nativeGeometry.composer[2], 736);
  const themedShapes = await surfaceShapes(page);
  assert.notEqual(themedShapes.composerRadius, nativeShapes.composerRadius);
  assert.notEqual(themedShapes.sidebarRadius, nativeShapes.sidebarRadius);
  assert.notEqual(themedShapes.rightCardRadius, nativeShapes.rightCardRadius);
  assert.notEqual(themedShapes.sendRadius, nativeShapes.sendRadius);
  assert.equal(await page.locator('html').getAttribute('data-forge-gourd-safe'), 'true');

  const motifStyle = await page.locator('[data-forge-motif="xiangfei-gourd"]').evaluate(element => ({
    backgroundImage: getComputedStyle(element).backgroundImage,
    pointerEvents: getComputedStyle(element).pointerEvents
  }));
  assert.match(motifStyle.backgroundImage, /data:image\/webp/);
  assert.equal(motifStyle.pointerEvents, 'none');
  assert.notEqual(await page.locator('.forge-new-task').evaluate(element => getComputedStyle(element, '::after').content), 'none');
  assert.notEqual(await page.locator('.forge-right-card').evaluate(element => getComputedStyle(element, '::after').content), 'none');
  assert.equal(await page.locator('.summary-heading.forge-right-title').count(), 1);
  assert.equal(await page.locator('.summary-row.forge-right-row').count(), 4);

  await enterThreadState(page);
  await page.evaluate(() => {
    const turn = document.querySelector('[data-local-conversation-final-assistant]');
    const answer = document.createElement('div');
    answer.setAttribute('data-local-conversation-final-assistant', 'true');
    while (turn.firstChild) answer.append(turn.firstChild);
    turn.removeAttribute('data-local-conversation-final-assistant');
    turn.style.backgroundColor = 'rgb(52, 44, 40)';
    turn.style.borderRadius = '14px';
    turn.style.boxShadow = '0 8px 24px rgba(0, 0, 0, .4)';
    turn.append(answer);
    window.dispatchEvent(new Event('resize'));
  });
  const authored = {
    geometry: await conversationGeometry(page),
    text: await conversationText(page)
  };
  await page.waitForTimeout(760);
  assert.equal(await page.locator('html').getAttribute('data-forge-surface'), 'thread');
  assert.equal(await page.locator('html').getAttribute('data-forge-mode'), 'scenery');
  assert.ok(['0', '2'].includes(await page.locator('html').getAttribute('data-forge-scene')));
  assert.equal(await page.locator('.forge-turn').count(), 2);
  assert.equal(await page.locator('.forge-user-message').count(), 1);
  assert.ok(await page.locator('.forge-assistant-message').count() >= 2);
  assert.equal(await page.locator('[data-virtualized-turn-content].forge-assistant-turn').count(), 1);
  assert.equal(await page.locator('[data-virtualized-turn-content].forge-assistant-message').count(), 1);
  assert.equal(await page.locator('[data-virtualized-turn-content].forge-assistant-turn').count(), 1);
  assert.equal(await page.locator('[data-local-conversation-final-assistant].forge-assistant-message').count(), 1);
  assert.equal(await page.locator('.forge-code-block').count(), 1);
  assert.deepEqual(await geometry(page), nativeGeometry);
  assert.deepEqual(await conversationGeometry(page), authored.geometry);
  assert.equal(await conversationText(page), authored.text);
  assert.equal(await page.locator('[data-local-conversation-user-anchor].forge-user-message').count(), 0);

  const assistantFrames = await page.locator('.forge-assistant-message').evaluateAll(elements => elements.map(element => {
    const style = getComputedStyle(element);
    return {
      backgroundImage: style.backgroundImage,
      backgroundColor: style.backgroundColor,
      borderWidths: [style.borderTopWidth, style.borderRightWidth, style.borderBottomWidth, style.borderLeftWidth],
      boxShadow: style.boxShadow,
      outlineStyle: style.outlineStyle
    };
  }));
  assert.ok(assistantFrames.every(frame => (
    frame.backgroundImage === 'none' &&
    frame.backgroundColor === 'rgba(0, 0, 0, 0)' &&
    frame.borderWidths.every(width => width === '0px') &&
    frame.boxShadow === 'none' &&
    frame.outlineStyle === 'none'
  )));
  await page.evaluate(RESTORE_EXPRESSION);
  await page.waitForTimeout(150);
  assert.equal(await page.locator('[data-forge-mark]').count(), 0);
  assert.equal(await page.locator('#wukong-forge-style').count(), 0);
  assert.equal(await page.locator('html').getAttribute('data-forge-surface'), null);
  assert.equal(await page.locator('html').getAttribute('data-forge-scene'), null);
  assert.equal(await page.locator('html').getAttribute('data-forge-mode'), null);
  assert.equal(await page.locator('html').getAttribute('data-forge-gourd-safe'), null);
  assert.equal(await page.locator('html').getAttribute('data-forge-gourd-placement'), null);
  assert.equal(await page.locator('#wukong-forge-pet-overlay').count(), 0);
  assert.equal(await page.locator('#wukong-forge-motif-overlay').count(), 0);
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

test('runtime ignores a lower decoy editor and selects the titled environment card inside a larger wrapper', async t => {
  const browser = await chromium.launch({ headless: true });
  t.after(() => browser.close());
  const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
  await page.setContent(runtimeFixtureHtml);
  await page.evaluate(() => {
    const decoy = document.createElement('textarea');
    decoy.dataset.testDecoy = 'editor';
    decoy.style.cssText = 'position:fixed;left:520px;bottom:0;width:620px;height:60px;';
    document.body.append(decoy);

    const card = document.querySelector('.summary-panel-card');
    const host = card.parentElement;
    const wrapper = document.createElement('section');
    wrapper.dataset.testEnvironmentWrapper = 'true';
    wrapper.style.cssText = 'width:320px;height:500px;border:1px solid transparent;border-radius:24px;';
    host.replaceChildren(wrapper);
    wrapper.append(card);
  });
  const styleSheet = fs.readFileSync(new URL('../runtime/forge-theme.css', import.meta.url), 'utf8');
  await page.evaluate(fixtureExpression(styleSheet));
  assert.equal(await page.locator('.composer-native.forge-composer').count(), 1);
  assert.equal(await page.locator('[data-test-decoy="editor"].forge-input').count(), 0);
  assert.equal(await page.locator('.ProseMirror.forge-input').count(), 1);
  assert.equal(await page.locator('.summary-panel-card.forge-right-card').count(), 1);
  assert.equal(await page.locator('[data-test-environment-wrapper].forge-right-card').count(), 0);
});

test('sidebar navigation refresh catches a text-only route transition', async t => {
  const browser = await chromium.launch({ headless: true });
  t.after(() => browser.close());
  const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
  await page.setContent(runtimeFixtureHtml);
  const styleSheet = fs.readFileSync(new URL('../runtime/forge-theme.css', import.meta.url), 'utf8');
  await page.evaluate(fixtureExpression(styleSheet));
  assert.equal(await page.locator('html').getAttribute('data-forge-surface'), 'landing');

  await page.evaluate(() => {
    const button = [...document.querySelectorAll('button')].find(element => element.textContent.trim() === '新建任务');
    button.addEventListener('click', () => {
      setTimeout(() => {
        document.querySelector('[data-feature="game-source"] span').firstChild.nodeValue = '历史任务';
      }, 240);
    }, { once: true });
    button.click();
  });
  await page.waitForTimeout(720);
  assert.equal(await page.locator('html').getAttribute('data-forge-surface'), 'thread');
  assert.equal(await page.locator('html').getAttribute('data-forge-mode'), 'scenery');
});

test('V11 Xiangfei motif is noninteractive, collision-safe, and forced-color safe', async t => {
  const browser = await chromium.launch({ headless: true });
  t.after(() => browser.close());
  const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
  await page.setContent(runtimeFixtureHtml);
  const styleSheet = fs.readFileSync(new URL('../runtime/forge-theme.css', import.meta.url), 'utf8');
  await page.evaluate(fixtureExpression(styleSheet));

  const motifStyle = await page.locator('[data-forge-motif="xiangfei-gourd"]').evaluate(element => ({
    backgroundImage: getComputedStyle(element).backgroundImage,
    pointerEvents: getComputedStyle(element).pointerEvents
  }));
  assert.match(motifStyle.backgroundImage, /data:image\/webp/);
  assert.equal(motifStyle.pointerEvents, 'none');
  assert.equal(await page.locator('#wukong-forge-motif-overlay').getAttribute('aria-hidden'), 'true');
  assert.equal(await page.locator('#wukong-forge-motif-overlay').getAttribute('inert'), '');
  assert.equal(await page.locator('#wukong-forge-motif-overlay').innerText(), '');
  assert.equal(await page.locator('#wukong-forge-motif-overlay').evaluate(element => element.closest('.forge-composer') === null), true);
  assert.doesNotMatch(await page.locator('[data-forge-motif="xiangfei-gourd"]').getAttribute('data-forge-placement'), /composer/i);

  await page.evaluate(() => {
    const blocker = document.createElement('div');
    blocker.setAttribute('role', 'dialog');
    blocker.style.cssText = 'position:fixed;inset:0;z-index:9999;';
    document.body.append(blocker);
  });
  await page.waitForTimeout(760);
  assert.equal(await page.locator('html').getAttribute('data-forge-gourd-safe'), 'false');
  assert.equal(await page.locator('[data-forge-motif="xiangfei-gourd"]').getAttribute('hidden'), '');

  await page.emulateMedia({ forcedColors: 'active' });
  assert.equal(await page.locator('#wukong-forge-motif-overlay').evaluate(element => getComputedStyle(element).display), 'none');
  await page.emulateMedia({ forcedColors: 'none' });

  await page.emulateMedia({ reducedMotion: 'reduce' });
  const reducedMotion = await page.locator('[data-forge-motif="xiangfei-gourd"]').evaluate(element => ({
    duration: getComputedStyle(element).animationDuration,
    iterations: getComputedStyle(element).animationIterationCount
  }));
  assert.ok(['0.01ms', '1e-05s'].includes(reducedMotion.duration));
  assert.equal(reducedMotion.iterations, '1');
});

test('assistant frame ancestors are cleared without changing authored content or geometry', async t => {
  const browser = await chromium.launch({ headless: true });
  t.after(() => browser.close());
  const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
  await page.setContent(runtimeFixtureHtml);
  const nativeBodyChildren = await page.locator('body > *').count();
  const styleSheet = fs.readFileSync(new URL('../runtime/forge-theme.css', import.meta.url), 'utf8');
  await page.evaluate(fixtureExpression(styleSheet));
  await enterThreadState(page);
  await page.evaluate(() => {
    const turn = document.querySelector('[data-local-conversation-final-assistant]');
    const answer = document.createElement('div');
    answer.setAttribute('data-local-conversation-final-assistant', 'true');
    while (turn.firstChild) answer.append(turn.firstChild);
    turn.removeAttribute('data-local-conversation-final-assistant');
    turn.style.backgroundColor = 'rgb(52, 44, 40)';
    turn.style.borderRadius = '14px';
    turn.style.boxShadow = '0 8px 24px rgba(0, 0, 0, .4)';
    turn.append(answer);
    window.dispatchEvent(new Event('resize'));
  });
  const authoredGeometry = await conversationGeometry(page);
  const authoredText = await conversationText(page);
  await page.waitForTimeout(760);

  assert.equal(await page.locator('[data-virtualized-turn-content].forge-assistant-message').count(), 1);
  assert.equal(await page.locator('[data-local-conversation-final-assistant].forge-assistant-message').count(), 1);
  assert.deepEqual(await conversationGeometry(page), authoredGeometry);
  assert.equal(await conversationText(page), authoredText);
  assert.equal(await page.locator('body > *').count(), nativeBodyChildren + 1);

  const frames = await page.locator('.forge-assistant-message').evaluateAll(elements => elements.map(element => {
    const style = getComputedStyle(element);
    return {
      backgroundImage: style.backgroundImage,
      backgroundColor: style.backgroundColor,
      borderWidths: [style.borderTopWidth, style.borderRightWidth, style.borderBottomWidth, style.borderLeftWidth],
      boxShadow: style.boxShadow,
      outlineStyle: style.outlineStyle
    };
  }));
  assert.ok(frames.every(frame => (
    frame.backgroundImage === 'none' &&
    frame.backgroundColor === 'rgba(0, 0, 0, 0)' &&
    frame.borderWidths.every(width => width === '0px') &&
    frame.boxShadow === 'none' &&
    frame.outlineStyle === 'none'
  )));
});

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { chromium } from '@playwright/test';
import { makeTheme, cssFor } from '../shared/theme-model.mjs';
import { makeApplyExpression, RESTORE_EXPRESSION } from '../runtime/injection-plan.mjs';

test('runtime detects surfaces, re-marks dynamic DOM, toggles native mode, and restores cleanly', async t => {
  const browser = await chromium.launch({ headless: true });
  t.after(() => browser.close());
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  await page.setContent(
    '<style>html,body{min-height:100%;margin:0;background:#202124;color:#eee}' +
    'header{height:48px}nav{width:220px}main{margin-left:220px;min-height:700px}' +
    'form{position:fixed;left:260px;right:260px;bottom:30px}</style>' +
    '<header>Codex</header>' +
    '<nav role="navigation"><button>New chat</button>' +
    '<div role="tree"><div role="treeitem" aria-selected="true">Active</div></div></nav>' +
    '<main><section aria-label="starter prompts"><button>Inspect</button></section>' +
    '<form><textarea placeholder="Message Codex"></textarea><div role="toolbar"><button>Tool</button></div></form></main>' +
    '<aside role="complementary">Inspector</aside>'
  );

  const styleSheet = fs.readFileSync(new URL('../runtime/forge-theme.css', import.meta.url), 'utf8');
  const theme = makeTheme({ background: { asset: null } });
  const expression = makeApplyExpression({
    styleSheet,
    variables: cssFor(theme, 'data:image/jpeg;base64,AA=='),
    companion: {
      enabled: true,
      side: 'right',
      size: 72,
      motion: 'still',
      image: 'data:image/png;base64,iVBORw0KGgo='
    }
  });
  await page.evaluate(expression);

  assert.equal(await page.locator('html').getAttribute('data-forge-surface'), 'landing');
  assert.equal(await page.locator('.forge-landing-mark').count(), 1);
  assert.equal(await page.locator('.forge-theme-toggle').getAttribute('aria-pressed'), 'true');
  assert.equal(await page.locator('.forge-new-task').count(), 1);
  assert.equal(await page.locator('.forge-composer-anchor').count(), 1);
  assert.equal(await page.locator('.forge-wayfarer span').textContent(), '候你启程');

  await page.evaluate(() => {
    const article = document.createElement('article');
    article.innerHTML = '<p>Dynamic assistant message</p><pre><code>npm test</code></pre>';
    document.querySelector('main').prepend(article);
  });
  await page.waitForTimeout(220);
  assert.equal(await page.locator('html').getAttribute('data-forge-surface'), 'thread');
  assert.equal(await page.locator('article.forge-message').count(), 1);
  assert.equal(await page.locator('pre.forge-code-block').count(), 1);
  assert.equal(await page.locator('.forge-wayfarer span').textContent(), '静候下一段行程');

  await page.evaluate(() => {
    const button = document.createElement('button');
    button.textContent = 'Dynamic action';
    document.querySelector('main').append(button);
  });
  await page.waitForTimeout(220);
  assert.equal(await page.getByText('Dynamic action').evaluate(element => element.classList.contains('forge-button')), true);

  await page.locator('.forge-theme-toggle').click();
  assert.equal(await page.locator('html').evaluate(element => element.classList.contains('forge-ink-mountain')), false);
  assert.equal(await page.locator('.forge-theme-toggle').getAttribute('aria-pressed'), 'false');
  assert.equal(await page.locator('.forge-wayfarer').evaluate(element => getComputedStyle(element).display), 'none');
  assert.equal(await page.evaluate(() => getComputedStyle(document.body).backgroundImage), 'none');

  await page.locator('.forge-theme-toggle').click();
  assert.equal(await page.locator('html').evaluate(element => element.classList.contains('forge-ink-mountain')), true);

  await page.evaluate(RESTORE_EXPRESSION);
  await page.waitForTimeout(180);
  assert.equal(await page.locator('[data-forge-mark]').count(), 0);
  assert.equal(await page.locator('[data-forge-owned]').count(), 0);
  assert.equal(await page.locator('#wukong-forge-style').count(), 0);
  assert.equal(await page.locator('html').getAttribute('data-forge-surface'), null);
  assert.equal(await page.evaluate(() => {
    try { return localStorage.getItem('wukong-codex-forge.enabled.v2'); }
    catch { return null; }
  }), null);

  await page.evaluate(() => {
    const button = document.createElement('button');
    button.id = 'post-restore';
    button.textContent = 'Unthemed';
    document.querySelector('main').append(button);
  });
  await page.waitForTimeout(220);
  assert.equal(await page.locator('#post-restore').evaluate(element => element.hasAttribute('data-forge-mark')), false);
});

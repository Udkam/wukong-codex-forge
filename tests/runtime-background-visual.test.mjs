import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { PNG } from 'pngjs';
import { chromium } from '@playwright/test';
import { makeTheme, cssFor } from '../shared/theme-model.mjs';
import { makeApplyExpression, RESTORE_EXPRESSION } from '../runtime/injection-plan.mjs';

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

test('landing image is prominent, thread image is subdued, and restore removes both', async t => {
  const browser = await chromium.launch({ headless: true });
  t.after(() => browser.close());
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.setContent(String.raw`
    <style>
      * { box-sizing: border-box; }
      html, body { min-height: 100%; margin: 0; background: #111412; font: 14px/1.45 system-ui, sans-serif; }
      header { height: 52px; padding: 14px 24px; display: flex; justify-content: space-between; }
      nav { position: fixed; inset: 52px auto 0 0; width: 244px; padding: 18px 12px; }
      nav button { width: 100%; text-align: left; }
      [role="tree"] { margin-top: 20px; }
      [role="treeitem"] { padding: 8px 10px; }
      main { min-height: 848px; margin: 0 240px 0 244px; padding: 32px; }
      article { max-width: 760px; margin-bottom: 18px; padding: 16px; }
      pre { margin: 10px 0 0; padding: 12px; }
      form { position: fixed; right: 278px; bottom: 34px; left: 282px; padding: 12px; }
      textarea { width: 100%; min-height: 74px; resize: none; }
      [role="toolbar"] { display: flex; justify-content: space-between; margin-top: 8px; }
      aside { position: fixed; inset: 52px 0 0 auto; width: 240px; padding: 18px; }
    </style>
    <header><span>Codex / Wukong Forge</span><span>Runtime state fixture</span></header>
    <nav role="navigation">
      <button>New chat</button>
      <div role="tree" aria-label="Projects">
        <div role="treeitem">Pinned</div>
        <div role="treeitem" aria-selected="true">Great Sage theme</div>
      </div>
    </nav>
    <main>
      <form><textarea aria-label="Message composer" placeholder="此去欲往何方？"></textarea>
      <div role="toolbar"><span>Attach</span><button>Run</button></div></form>
    </main>
    <aside role="complementary"><strong>Inspector</strong><p>Surface: automatic</p></aside>
  `);

  const jpeg = fs.readFileSync(new URL('../themes/assets/great-sage-return.jpg', import.meta.url)).toString('base64');
  const image = 'data:image/jpeg;base64,' + jpeg;
  const theme = makeTheme();
  const styleSheet = fs.readFileSync(new URL('../runtime/forge-theme.css', import.meta.url), 'utf8');
  await page.evaluate(makeApplyExpression({
    styleSheet,
    variables: cssFor(theme, image),
    companion: { enabled: false }
  }));

  assert.equal(await page.locator('html').getAttribute('data-forge-surface'), 'landing');
  const landingBuffer = await page.screenshot({ path: 'docs/screenshots/runtime-landing-fixture.png' });
  const landing = PNG.sync.read(landingBuffer);
  assert.match(await page.evaluate(() => getComputedStyle(document.body).backgroundImage), /data:image\/jpeg/);

  await page.evaluate(() => {
    document.querySelector('main').insertAdjacentHTML('afterbegin',
      '<article><strong>Theme request</strong><p>Keep content readable during a long task.</p></article>' +
      '<article><strong>Runtime response</strong><pre><code>surface = "thread"</code></pre></article>'
    );
  });
  await page.waitForTimeout(220);
  assert.equal(await page.locator('html').getAttribute('data-forge-surface'), 'thread');
  assert.equal(await page.locator('.forge-landing-mark').evaluate(element => getComputedStyle(element).display), 'none');
  const threadBuffer = await page.screenshot({ path: 'docs/screenshots/runtime-background-fixture.png' });
  const thread = PNG.sync.read(threadBuffer);

  const workspaceBox = { x: 320, y: 110, width: 760, height: 500 };
  const landingLight = averageLuminance(landing, workspaceBox);
  const threadLight = averageLuminance(thread, workspaceBox);
  assert.ok(
    landingLight > threadLight + 6,
    'landing should be visibly brighter than thread: ' +
      landingLight.toFixed(2) + ' vs ' + threadLight.toFixed(2)
  );

  await page.evaluate(RESTORE_EXPRESSION);
  const restored = await page.evaluate(() => ({
    backgroundImage: getComputedStyle(document.body).backgroundImage,
    forgeRoot: document.documentElement.classList.contains('forge-ink-mountain'),
    forgeStyle: Boolean(document.getElementById('wukong-forge-style')),
    forgeSurface: document.documentElement.dataset.forgeSurface || null
  }));
  assert.deepEqual(restored, {
    backgroundImage: 'none',
    forgeRoot: false,
    forgeStyle: false,
    forgeSurface: null
  });
});

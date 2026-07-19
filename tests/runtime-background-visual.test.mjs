import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { PNG } from 'pngjs';
import { chromium } from '@playwright/test';
import { makeTheme, cssFor } from '../shared/theme-model.mjs';
import { makeApplyExpression, RESTORE_EXPRESSION } from '../runtime/injection-plan.mjs';

const pixel = (png, x, y) => {
  const i = (png.width * y + x) * 4;
  return { r: png.data[i], g: png.data[i + 1], b: png.data[i + 2] };
};

test('runtime body background is visible at full task intensity and restore removes it', async t => {
  const browser = await chromium.launch({ headless: true });
  t.after(() => browser.close());
  const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
  const svg = 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="900"><rect width="1600" height="900" fill="#e12b1f"/><path d="M0 720L1600 120V900H0Z" fill="#e7b83f"/><circle cx="1240" cy="210" r="170" fill="#d52a24"/></svg>');
  await page.setContent(`
    <style>
      * { box-sizing: border-box; }
      html, body { min-height: 100%; margin: 0; background: #111412; font: 14px/1.45 system-ui, sans-serif; }
      header { height: 52px; padding: 14px 24px; display: flex; justify-content: space-between; }
      nav { position: fixed; inset: 52px auto 0 0; width: 244px; padding: 18px 12px; }
      nav button { width: 100%; text-align: left; }
      [role="tree"] { margin-top: 20px; }
      [role="treeitem"] { padding: 8px 10px; }
      main { min-height: 848px; margin: 0 260px 0 244px; padding: 26px; }
      article { margin-bottom: 18px; padding: 16px; }
      pre { margin: 10px 0 0; padding: 12px; }
      form { position: relative; margin-top: 180px; padding: 12px; }
      textarea { width: 100%; min-height: 74px; resize: none; }
      [role="toolbar"] { display: flex; justify-content: space-between; margin-top: 8px; }
      aside { position: fixed; inset: 52px 0 0 auto; width: 260px; padding: 18px; }
      [role="menu"] { position: fixed; right: 282px; top: 84px; padding: 8px; }
      [role="menu"] div { padding: 6px 12px; }
    </style>
    <header><span>Codex / Wukong Forge</span><span>Local runtime fixture</span></header>
    <nav role="navigation">
      <button>New task</button>
      <div role="tree" aria-label="Projects">
        <div role="treeitem">Pinned</div>
        <div role="treeitem" aria-selected="true">Mountain task / active</div>
        <div role="treeitem">Installed</div>
      </div>
    </nav>
    <main>
      <article><strong>Design review</strong><br>Verify the local backdrop can remain visible behind readable work surfaces.</article>
      <article><strong>Runtime response</strong><pre><code>apply(theme) // scoped semantic marks</code></pre></article>
      <form><textarea aria-label="Message composer" placeholder="Message Codex"></textarea><div role="toolbar"><span>Attach</span><span>Run</span></div></form>
    </main>
    <aside role="complementary"><strong>Inspector</strong><p>Background: local SVG</p><p>Focus: right center</p></aside>
    <div role="menu"><div>Theme actions</div><div>Restore</div></div>
  `);
  const theme = makeTheme({ background: { mode: 'local', source: 'abstract.svg', asset: null, position: 'right center', dim: .45, taskIntensity: 1 } });
  const styleSheet = fs.readFileSync(new URL('../runtime/forge-theme.css', import.meta.url), 'utf8');
  await page.evaluate(makeApplyExpression({ styleSheet, variables: cssFor(theme, svg), companion: { enabled: false } }));
  const before = PNG.sync.read(await page.screenshot({ path: 'docs/screenshots/runtime-background-fixture.png' }));
  // This exposed workspace point is in the red field, above the gold diagonal.
  const sample = pixel(before, 500, 400);
  assert.ok(sample.r > 45 && sample.r > sample.g + 15, 'background colour is not visible: ' + JSON.stringify(sample));
  await page.evaluate(RESTORE_EXPRESSION);
  const restored = await page.evaluate(() => ({
    backgroundImage: getComputedStyle(document.body).backgroundImage,
    forgeRoot: document.documentElement.classList.contains('forge-ink-mountain'),
    forgeStyle: Boolean(document.getElementById('forge-style'))
  }));
  assert.deepEqual(restored, { backgroundImage: 'none', forgeRoot: false, forgeStyle: false }, 'restore left a managed background behind the fixture');
});

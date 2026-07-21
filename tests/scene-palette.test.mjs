import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { chromium } from '@playwright/test';
import { SCENE_TONES, cssFor, validateTheme } from '../shared/theme-model.mjs';

const active = JSON.parse(fs.readFileSync('themes/active.json', 'utf8').replace(/^\uFEFF/, ''));

test('all eleven cinematic scenes declare a validated adaptive tone', () => {
  assert.equal(active.schemaVersion, 3);
  assert.equal(active.background.gallery.length, 11);
  assert.deepEqual(
    active.background.gallery.map(scene => scene.tone),
    Object.keys(SCENE_TONES)
  );
  for (const scene of active.background.gallery) {
    const tone = SCENE_TONES[scene.tone];
    for (const key of ['ink', 'inkSoft', 'lacquer', 'jade', 'jadeLight', 'gold', 'goldLight', 'paper', 'composer', 'sidebar', 'rightCard', 'veil']) {
      assert.ok(tone[key], `${scene.id} is missing ${key}`);
    }
  }
  const invalid = structuredClone(active);
  delete invalid.background.gallery[3].tone;
  assert.throws(() => validateTheme(invalid), /Invalid background\.gallery entry/);
});

test('scene switching updates image, shell surfaces and text minerals together', async t => {
  const browser = await chromium.launch({ headless: true });
  t.after(() => browser.close());
  const page = await browser.newPage();
  const assets = active.background.gallery.map((scene, index) => ({
    ...scene,
    url: `data:image/jpeg;base64,${Buffer.from(String(index)).toString('base64')}`
  }));
  const variables = cssFor(active, assets, {});
  await page.setContent('<style id="theme"></style>');
  await page.evaluate(css => {
    document.getElementById('theme').textContent = css;
    document.documentElement.classList.add('forge-ink-mountain');
  }, variables);

  const states = [];
  for (let index = 0; index < active.background.gallery.length; index += 1) {
    states.push(await page.evaluate(scene => {
      document.documentElement.dataset.forgeScene = String(scene);
      const style = getComputedStyle(document.documentElement);
      return {
        ink: style.getPropertyValue('--forge-ink').trim(),
        paper: style.getPropertyValue('--forge-paper').trim(),
        sidebar: style.getPropertyValue('--forge-sidebar-bg').trim(),
        composer: style.getPropertyValue('--forge-composer-bg').trim(),
        rightCard: style.getPropertyValue('--forge-right-card-bg').trim(),
        sceneBackground: style.getPropertyValue('--forge-scene-bg').trim()
      };
    }, index));
  }

  assert.equal(new Set(states.map(state => state.composer)).size, 11);
  assert.equal(new Set(states.map(state => state.sidebar)).size, 11);
  assert.equal(new Set(states.map(state => state.rightCard)).size, 11);
  assert.equal(new Set(states.map(state => state.paper)).size, 11);
  states.forEach((state, index) => {
    const tone = SCENE_TONES[active.background.gallery[index].tone];
    assert.equal(state.ink, tone.ink);
    assert.equal(state.paper, tone.paper);
    assert.match(state.sceneBackground, /data:image\/jpeg/);
  });
});

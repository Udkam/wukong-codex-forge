import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { DEFAULT_THEME, makeTheme, validateTheme, cssFor } from '../shared/theme-model.mjs';
import { payloadFromThemeFile } from '../runtime/forge-runtime.mjs';
import { makeApplyExpression } from '../runtime/injection-plan.mjs';

test('default schema v2 theme is valid and uses the bundled user image', () => {
  assert.equal(validateTheme(DEFAULT_THEME).schemaVersion, 2);
  assert.equal(DEFAULT_THEME.id, 'great-sage-scroll');
  assert.equal(DEFAULT_THEME.background.asset, 'assets/great-sage-return.jpg');
  assert.ok(DEFAULT_THEME.background.landingIntensity > DEFAULT_THEME.background.taskIntensity);
});

test('theme JSON round-trips with independent landing and thread settings', () => {
  const exported = JSON.parse(JSON.stringify(makeTheme({
    name: '本地验收主题',
    background: {
      mode: 'local',
      source: 'mist.png',
      asset: null,
      position: 'left center',
      landingPosition: 'right center',
      dim: .62,
      taskIntensity: .18,
      landingIntensity: .76
    },
    accessibility: { preset: 'workbench', reducedMotion: true }
  })));
  assert.deepEqual(validateTheme(exported), exported);
});

test('CSS variables carry the complete dual-state visual contract', () => {
  const css = cssFor(makeTheme({
    palette: {
      ink: '#112233',
      lacquer: '#221b18',
      jade: '#334455',
      gold: '#cc9955',
      paper: '#ddeeff'
    },
    background: {
      mode: 'local',
      source: 'mist.png',
      asset: null,
      position: 'left center',
      landingPosition: 'right center',
      dim: .62,
      taskIntensity: .18,
      landingIntensity: .76
    }
  }), 'data:image/png;base64,AA==');
  assert.match(css, /--forge-ink:#112233/);
  assert.match(css, /--forge-lacquer:#221b18/);
  assert.match(css, /--forge-gold:#cc9955/);
  assert.match(css, /--forge-bg:url\("data:image\/png/);
  assert.match(css, /--forge-position:left center/);
  assert.match(css, /--forge-landing-position:right center/);
  assert.match(css, /--forge-task-wash:rgba/);
  assert.match(css, /--forge-landing-wash:rgba/);
  assert.match(css, /--forge-landing-intensity:0.76/);
});

test('solid and high-read themes suppress the runtime image', () => {
  const highRead = makeTheme({
    background: { mode: 'local' },
    accessibility: { preset: 'high-read', reducedMotion: true }
  });
  assert.match(cssFor(highRead, 'data:image/png;base64,AA=='), /--forge-bg:none/);
  assert.match(
    cssFor(makeTheme({ background: { mode: 'solid' } }), 'data:image/png;base64,AA=='),
    /--forge-bg:none/
  );
});

test('bundled managed asset becomes a real injected data URL', () => {
  const payload = payloadFromThemeFile('themes/active.json');
  assert.match(payload.assetUrl, /^data:image\/jpeg;base64,/);
  assert.match(payload.variables, /--forge-bg:url/);
  assert.equal(payload.theme.background.source, 'great-sage-return.jpg');
});

test('runtime accepts UTF-8 BOM schema v2 input', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'forge-bom-'));
  const file = path.join(root, 'theme.json');
  fs.writeFileSync(file, '\uFEFF' + JSON.stringify({ ...DEFAULT_THEME, background: {
    ...DEFAULT_THEME.background,
    asset: null
  } }), 'utf8');
  assert.equal(payloadFromThemeFile(file).theme.name, '大圣归来 · 残卷入梦');
  fs.rmSync(root, { recursive: true, force: true });
});

test('injection expression is Forge-scoped and includes state and toggle logic', () => {
  const expression = makeApplyExpression({
    styleSheet: '.forge-new-task{}',
    variables: '--forge-bg:url("x")',
    companion: { enabled: false }
  });
  assert.match(expression, /--forge-bg:url/);
  assert.match(expression, /forge-theme-toggle/);
  assert.match(expression, /forgeSurface/);
  assert.doesNotMatch(expression, /\[class\*=/);
});

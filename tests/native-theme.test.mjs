import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { MAX_MOTIF_BYTES, payloadFromThemeFile } from '../runtime/forge-runtime.mjs';
import {
  applyNativeTheme,
  loadThemeDefinition,
  restoreNativeTheme,
  upgradeNativeTheme
} from '../scripts/native-theme.mjs';

const definition = loadThemeDefinition('themes/native-wukong.json');
const activeThemePath = 'themes/active.json';
const activeTheme = JSON.parse(fs.readFileSync(activeThemePath, 'utf8').replace(/^\uFEFF/, ''));

test('V10 theme packages Xiangfei gourd and generated independent pets', () => {
  const expectedMotifs = ['littleBajie', 'littleWukong', 'xiangfeiGourd'];
  assert.deepEqual(Object.keys(activeTheme.motifs).sort(), expectedMotifs);

  const motifFiles = Object.values(activeTheme.motifs);
  assert.ok(motifFiles.every(asset => asset.endsWith('.webp')), 'V10 motifs must use compact alpha WebP assets');
  assert.equal(activeTheme.motifs.xiangfeiGourd, 'motifs/xiangfei-gourd-icon.webp');
  assert.equal(activeTheme.motifs.littleWukong, 'motifs/pets/little-wukong-pet-v1.webp');
  assert.equal(activeTheme.motifs.littleBajie, 'motifs/pets/little-bajie-pet-v1.webp');
  assert.equal(activeTheme.companion.enabled, true, 'independent pet overlay must be enabled');
  assert.ok(motifFiles.every(asset => fs.statSync(`themes/${asset}`).isFile()));
  const motifBytes = motifFiles.reduce((total, asset) => total + fs.statSync(`themes/${asset}`).size, 0);
  assert.ok(motifBytes <= MAX_MOTIF_BYTES, `V10 motif payload exceeds ${MAX_MOTIF_BYTES} bytes`);

  const payload = payloadFromThemeFile(activeThemePath);
  assert.deepEqual(Object.keys(payload.motifs).sort(), expectedMotifs);
  for (const motif of Object.values(payload.motifs)) assert.match(motif, /^data:image\/webp;base64,/);
  assert.match(payload.variables, /--forge-motif-xiangfei-gourd:url\(/);
  assert.match(payload.variables, /--forge-motif-little-wukong:url\(/);
  assert.match(payload.variables, /--forge-motif-little-bajie:url\(/);
  assert.doesNotMatch(payload.variables, /forge-motif-(?:yaksha|fanged-cyan)/);

  const modes = activeTheme.background.gallery.map(scene => scene.mode);
  assert.ok(modes.includes('battle-primary'));
  assert.ok(modes.includes('battle-secondary'));
  assert.ok(modes.includes('scenery'));
  assert.equal(activeTheme.schemaVersion, 3);
  assert.equal(new Set(activeTheme.background.gallery.map(scene => scene.tone)).size, 11);
});

test('native definition stays within the current Codex chrome theme schema', () => {
  const identities = definition.settings.map(setting => `${setting.section}.${setting.key}`);
  assert.deepEqual(definition.unsupportedByNativeLoader, ['backgroundImage', 'companion', 'customCss']);
  assert.ok(identities.includes('desktop.appearanceTheme'));
  assert.ok(identities.includes('desktop.appearanceDarkChromeTheme.accent'));
  assert.ok(identities.includes('desktop.appearanceDarkChromeTheme.semanticColors.skill'));
  assert.equal(fs.statSync('themes/assets/great-sage-return.jpg').size < 100_000, true);
});

test('install and uninstall round-trip only managed native appearance values', () => {
  const original = [
    'model = "gpt-5.6-sol"',
    '',
    '[desktop]',
    'localeOverride = "zh-CN"',
    'appearanceTheme = "system" # keep user preference',
    'appearanceLightCodeThemeId = "vscode-plus"',
    '',
    '[desktop.appearanceLightChromeTheme]',
    'accent = "#007acc"',
    'contrast = 60',
    'ink = "#d4d4d4"',
    'opaqueWindows = false',
    'surface = "#1e1e1e"',
    '',
    '[desktop.appearanceLightChromeTheme.semanticColors]',
    'diffAdded = "#369432"',
    'diffRemoved = "#f44747"',
    'skill = "#000080"',
    '',
    '[features]',
    'memories = true',
    ''
  ].join('\r\n');
  const applied = applyNativeTheme(original, definition.settings);
  assert.match(applied.text, /appearanceTheme = "dark"/);
  assert.match(applied.text, /accent = "#a88755"/);
  assert.match(applied.text, /ui = "\\"Microsoft YaHei UI\\""/);
  assert.match(applied.text, /\[features\]\r\nmemories = true/);

  const restored = restoreNativeTheme(applied.text, applied.state);
  assert.deepEqual(restored.warnings, []);
  assert.equal(restored.text, original);
});

test('uninstall preserves a managed value changed by the user after install', () => {
  const original = '[desktop]\nappearanceTheme = "system"\n';
  const applied = applyNativeTheme(original, definition.settings);
  const userChanged = applied.text.replace('accent = "#a88755"', 'accent = "#ff00aa"');
  const restored = restoreNativeTheme(userChanged, applied.state);
  assert.match(restored.text, /accent = "#ff00aa"/);
  assert.ok(restored.warnings.some(warning => warning.includes('appearanceDarkChromeTheme.accent')));
  assert.match(restored.text, /appearanceTheme = "system"/);
});

test('upgrade replaces an older managed theme while preserving the pre-theme baseline', () => {
  const original = [
    '[desktop]',
    'appearanceTheme = "system"',
    'appearanceLightCodeThemeId = "vscode-plus"',
    '',
    '[desktop.appearanceLightChromeTheme]',
    'accent = "#007acc"',
    'surface = "#ffffff"',
    ''
  ].join('\n');
  const legacy = [
    { section: 'desktop', key: 'appearanceTheme', value: 'dark' },
    { section: 'desktop.appearanceLightChromeTheme', key: 'accent', value: '#d6a85f' }
  ];
  const oldApplied = applyNativeTheme(original, legacy);
  const upgraded = upgradeNativeTheme(oldApplied.text, oldApplied.state, definition.settings);
  assert.deepEqual(upgraded.warnings, []);
  assert.match(upgraded.text, /appearanceTheme = "dark"/);
  assert.match(upgraded.text, /accent = "#a88755"/);
  const restored = restoreNativeTheme(upgraded.text, upgraded.state);
  assert.deepEqual(restored.warnings, []);
  assert.equal(restored.text, original);
});

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
  applyNativeTheme,
  loadThemeDefinition,
  restoreNativeTheme
} from '../scripts/native-theme.mjs';

const definition = loadThemeDefinition('themes/native-wukong.json');

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
    'appearanceDarkCodeThemeId = "vscode-plus"',
    '',
    '[desktop.appearanceDarkChromeTheme]',
    'accent = "#007acc"',
    'contrast = 60',
    'ink = "#d4d4d4"',
    'opaqueWindows = false',
    'surface = "#1e1e1e"',
    '',
    '[desktop.appearanceDarkChromeTheme.semanticColors]',
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
  assert.match(applied.text, /accent = "#d6a85f"/);
  assert.match(applied.text, /ui = "\\"Microsoft YaHei UI\\""/);
  assert.match(applied.text, /\[features\]\r\nmemories = true/);

  const restored = restoreNativeTheme(applied.text, applied.state);
  assert.deepEqual(restored.warnings, []);
  assert.equal(restored.text, original);
});

test('uninstall preserves a managed value changed by the user after install', () => {
  const original = '[desktop]\nappearanceTheme = "system"\n';
  const applied = applyNativeTheme(original, definition.settings);
  const userChanged = applied.text.replace('accent = "#d6a85f"', 'accent = "#ff00aa"');
  const restored = restoreNativeTheme(userChanged, applied.state);
  assert.match(restored.text, /accent = "#ff00aa"/);
  assert.ok(restored.warnings.some(warning => warning.includes('appearanceDarkChromeTheme.accent')));
  assert.match(restored.text, /appearanceTheme = "system"/);
});

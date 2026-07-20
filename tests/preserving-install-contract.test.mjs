import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = path => fs.readFileSync(path, 'utf8');

test('public install and disable entry points preserve every existing file', () => {
  const install = read('scripts/install-preserving.ps1');
  const launch = read('scripts/launch.ps1');
  const disable = read('scripts/disable.ps1');
  const installCmd = read('install-theme.cmd');
  const removeCmd = read('remove-theme.cmd');

  for (const [name, script] of Object.entries({ install, launch, disable })) {
    assert.doesNotMatch(script, /\bRemove-Item\b|\bMove-Item\b|\.Delete\(|rmSync|unlinkSync|rmdirSync/, `${name} contains a destructive file operation`);
  }
  assert.match(install, /releases/);
  assert.match(install, /release\.json/);
  assert.match(install, /history/);
  assert.match(launch, /runtime-events\.jsonl/);
  assert.match(disable, /disableRequest/);
  assert.match(installCmd, /install-preserving\.ps1/);
  assert.match(removeCmd, /disable\.ps1/);
  assert.doesNotMatch(removeCmd, /-Uninstall/);
});

test('watcher probes the current V5 renderer runtime instead of reinjecting continuously', () => {
  const watcher = read('runtime/watch.mjs');
  assert.match(watcher, /__wukongCodexForgeRuntimeV5/);
  assert.doesNotMatch(watcher, /__wukongCodexForgeRuntimeV4/);
});

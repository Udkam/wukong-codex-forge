import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = path => fs.readFileSync(path, 'utf8');

test('public install and disable entry points preserve every existing file', () => {
  const install = read('scripts/install-preserving.ps1');
  const launch = read('scripts/launch.ps1');
  const disable = read('scripts/disable.ps1');
  const hook = read('scripts/install-chatgpt-hook.ps1');
  const start = read('scripts/start.ps1');
  const installCmd = read('install-theme.cmd');
  const removeCmd = read('remove-theme.cmd');
  const startCmd = read('start-theme.cmd');
  const stopCmd = read('stop-theme.cmd');

  for (const [name, script] of Object.entries({ install, launch, disable, hook, start })) {
    assert.doesNotMatch(script, /\bRemove-Item\b|\bMove-Item\b|\.Delete\(|rmSync|unlinkSync|rmdirSync/, `${name} contains a destructive file operation`);
  }
  assert.match(install, /releases/);
  assert.match(install, /release\.json/);
  assert.match(install, /history/);
  assert.match(install, /runtime-only theme never writes config\.toml/);
  assert.doesNotMatch(install, /-Destination\s+\$configPath|(?:WriteAllText|AppendAllText)\(\s*\$configPath|(?:upgrade|apply|restore)\s+--config/i);
  assert.match(launch, /runtime-events\.jsonl/);
  assert.match(disable, /retained = \$true/);
  assert.match(disable, /All theme releases, assets, logs and request records were retained/);
  assert.match(installCmd, /install-preserving\.ps1/);
  assert.match(removeCmd, /disable\.ps1/);
  assert.doesNotMatch(removeCmd, /restore\.ps1|-Uninstall/);
  assert.match(startCmd, /start\.ps1/);
  assert.match(stopCmd, /disable\.ps1/);
  assert.match(stopCmd, /-Portable/);
  assert.match(install, /install-chatgpt-hook\.ps1/);
  assert.match(hook, /ChatGPT-before-wukong-/);
  assert.match(hook, /Copy-Item -LiteralPath \$shortcutPath -Destination \$backupPath/);
  assert.match(hook, /launcher-bridges/);
  assert.match(hook, /-File `"\$bridgePath`"/);
  assert.match(hook, /\$expectedArguments\.Length -ge 900/);
  assert.doesNotMatch(hook, /EncodedCommand/);
  assert.match(hook, /\$managed\.Count -eq 1 -and `\$watching\.Count -ge 1/);
  assert.match(hook, /if \(\(Test-Path -LiteralPath `\$launcher\)/);
});

test('managed lifecycle uses Codex embedded Node and no WebSocket dependency tree', () => {
  for (const file of ['scripts/install-preserving.ps1', 'scripts/launch.ps1', 'scripts/disable.ps1']) {
    const script = read(file);
    assert.match(script, /app\\resources\\cua_node\\bin\\node\.exe/, `${file} does not use Codex embedded Node`);
    assert.doesNotMatch(script, /Get-Command\s+node(?:\.exe)?\b/i, `${file} still requires external Node`);
  }
  assert.doesNotMatch(read('scripts/package-runtime.mjs'), /node_modules/);
  assert.doesNotMatch(read('scripts/package-runtime.mjs'), /runtime\/ws-client(?:-node)?\.mjs/);
  assert.doesNotMatch(read('runtime/cdp-client.mjs'), /from '\.\/ws-client(?:-node)?\.mjs'/);
  assert.match(read('runtime/cdp-client.mjs'), /export const commandTarget = rawCommandTarget/);
  assert.deepEqual(JSON.parse(read('package.json')).dependencies, {});
  assert.doesNotMatch(read('package-lock.json'), /"node_modules\/ws"|"ws"\s*:/);
});

test('V10 watcher and disable path prove native restoration before reporting success', () => {
  const watcher = read('runtime/watch.mjs');
  const disable = read('scripts/disable.ps1');
  const injector = read('runtime/injector.mjs');

  assert.match(watcher, /__wukongCodexForgeRuntimeV10/);
  assert.match(watcher, /states\.every\(isNativeThemeState\)/);
  assert.match(watcher, /\.confirmed\.json/);
  assert.match(disable, /Managed watcher did not acknowledge the restore request; native state was not claimed/);
  assert.match(disable, /--assert-native \$port/);
  assert.match(disable, /Live native restoration could not be verified/);
  assert.match(injector, /mode === '--assert-native'/);
  assert.match(injector, /Codex renderer still contains managed theme state/);
  assert.ok(
    disable.indexOf('--assert-native $port') < disable.indexOf("state = 'disable-confirmed'"),
    'disable-confirmed is emitted before native-state verification'
  );
});

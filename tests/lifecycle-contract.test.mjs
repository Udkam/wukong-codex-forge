import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { isCodexTarget } from '../runtime/cdp-client.mjs';

const read = file => fs.readFileSync(file, 'utf8');

test('managed lifecycle scripts parse and keep host mutations bounded', () => {
  for (const file of ['scripts/install.ps1', 'scripts/launch.ps1', 'scripts/restore.ps1']) {
    const absolute = path.resolve(file).replaceAll("'", "''");
    const command =
      '$tokens=$null;$errors=$null;' +
      `[System.Management.Automation.Language.Parser]::ParseFile('${absolute}',[ref]$tokens,[ref]$errors)|Out-Null;` +
      'if($errors.Count){$errors|ForEach-Object{Write-Error $_.Message};exit 1}';
    const result = spawnSync('powershell.exe', ['-NoProfile', '-Command', command], {
      cwd: process.cwd(),
      encoding: 'utf8'
    });
    assert.equal(result.status, 0, file + ' parse failure: ' + result.stdout + result.stderr);
  }

  const install = read('scripts/install.ps1');
  const launch = read('scripts/launch.ps1');
  const restore = read('scripts/restore.ps1');
  const watcher = read('runtime/watch.mjs');
  const capture = read('runtime/capture-live.mjs');
  const installEntry = read('install-theme.cmd');
  const removeEntry = read('remove-theme.cmd');

  assert.match(install, /\.codex\\themes\\wukong-codex-forge/);
  assert.match(install, /package-runtime\.mjs/);
  assert.match(install, /Codex - Wukong Theme\.lnk/);
  assert.match(install, /WukongCodexForgeRuntime/);
  assert.match(install, /\$engine upgrade --config/);
  assert.match(install, /No app\.asar, WindowsApps package file, Codex executable/);
  assert.doesNotMatch(install, /Copy-Item[^\r\n]*(?:app\.asar|ChatGPT\.exe|WindowsApps)/i);

  assert.match(launch, /--remote-debugging-address=127\.0\.0\.1/);
  assert.match(launch, /--remote-debugging-port=0/);
  assert.match(launch, /--user-data-dir/);
  assert.match(launch, /CODEX_ELECTRON_USER_DATA_PATH/);
  assert.match(launch, /Get-AppxPackage -Name 'OpenAI\.Codex'/);
  assert.match(launch, /runtime\\watch\.mjs/);
  assert.doesNotMatch(launch, /Stop-Process|taskkill/i);

  assert.match(watcher, /disableRequest/);
  assert.match(watcher, /RESTORE_EXPRESSION/);
  assert.match(watcher, /await sleep\(1700\)/);
  assert.match(capture, /Page\.captureScreenshot/);
  assert.match(capture, /Screenshot output must stay inside the current working directory/);
  assert.match(restore, /state\.managedBy -ne 'WukongCodexForgeNativeTheme'/);
  assert.match(restore, /expectedShortcut/);
  assert.match(restore, /ReparsePoint/);
  assert.match(restore, /Remove-Item -LiteralPath \$target -Recurse -Force/);
  assert.doesNotMatch(restore, /Stop-Process|taskkill/i);

  assert.match(installEntry, /scripts\\install\.ps1/);
  assert.match(removeEntry, /scripts\\restore\.ps1" -Uninstall/);
  assert.equal(isCodexTarget({ type: 'page', url: 'app://codex/index.html' }), true);
  assert.equal(isCodexTarget({ type: 'page', url: 'http://127.0.0.1:3000/' }), true);
  assert.equal(isCodexTarget({ type: 'page', url: 'https://example.com/' }), false);
});

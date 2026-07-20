import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { isCodexTarget } from '../runtime/cdp-client.mjs';

const read = file => fs.readFileSync(file, 'utf8');

test('PowerShell lifecycle scripts parse and keep destructive scope managed', () => {
  for (const file of ['scripts/install.ps1', 'scripts/launch.ps1', 'scripts/start.ps1', 'scripts/restore.ps1']) {
    const absolute = path.resolve(file).replaceAll("'", "''");
    const command =
      '$tokens=$null;$errors=$null;' +
      "[System.Management.Automation.Language.Parser]::ParseFile('" + absolute + "',[ref]$tokens,[ref]$errors)|Out-Null;" +
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
  assert.match(install, /\[switch\]\$CreateShortcut/);
  assert.match(install, /ChatGPT - Wukong Theme\.lnk/);
  assert.match(launch, /--remote-debugging-address=127\.0\.0\.1/);
  assert.match(launch, /runtime\/watch\.mjs/);
  assert.match(launch, /Get-AppxPackage -Name 'OpenAI\.Codex'/);
  assert.doesNotMatch(launch, /Stop-Process|taskkill/i);
  assert.match(restore, /state\.managedBy -ne 'WukongCodexForge'/);
  assert.match(restore, /expectedShortcut/);
  assert.match(restore, /Remove-Item -LiteralPath \$target -Recurse -Force/);
});

test('watcher probes cheaply and stops after the loopback lifecycle disappears', () => {
  const watcher = read('runtime/watch.mjs');
  const client = read('runtime/cdp-client.mjs');
  assert.match(watcher, /Boolean\(document\.getElementById/);
  assert.match(watcher, /await sleep\(1400\)/);
  assert.match(watcher, /disconnectFailures\+\+ < 2/);
  assert.match(client, /Refusing non-loopback CDP endpoint/);
  assert.equal(isCodexTarget({ type: 'page', url: 'app://codex/index.html' }), true);
  assert.equal(isCodexTarget({ type: 'page', url: 'http://127.0.0.1:3000/' }), true);
  assert.equal(isCodexTarget({ type: 'page', url: 'https://example.com/' }), false);
});

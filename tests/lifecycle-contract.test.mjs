import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const read = file => fs.readFileSync(file, 'utf8');

test('native lifecycle scripts parse and only manage the Codex theme directory', () => {
  for (const file of ['scripts/install.ps1', 'scripts/restore.ps1']) {
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
  const restore = read('scripts/restore.ps1');
  const installEntry = read('install-theme.cmd');
  const removeEntry = read('remove-theme.cmd');
  assert.match(install, /\.codex\\themes\\wukong-codex-forge/);
  assert.match(install, /native-theme\.mjs/);
  assert.match(install, /native-wukong\.json/);
  assert.doesNotMatch(install, /ChatGPT\.exe|remote-debugging|Start-Process|WScript\.Shell/);
  assert.match(restore, /managed CODEX_HOME Wukong theme directory/);
  assert.match(restore, /Remove-Item -LiteralPath \$target -Recurse -Force/);
  assert.doesNotMatch(restore, /ChatGPT\.exe|Stop-Process|taskkill|remote-debugging/);
  assert.match(installEntry, /scripts\\install\.ps1/);
  assert.match(removeEntry, /scripts\\restore\.ps1" -Uninstall/);
});

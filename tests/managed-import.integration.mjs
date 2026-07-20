import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const root = process.cwd();
const parent = path.dirname(root);
const project = path.basename(root);
const managed = path.join(process.env.LOCALAPPDATA, 'WukongCodexForge');
const run = (file, args, cwd = root) => {
  const result = spawnSync(
    'powershell.exe',
    ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', file, ...args],
    { cwd, encoding: 'utf8' }
  );
  if (result.status !== 0) throw Error((result.stdout || '') + (result.stderr || ''));
};

if (fs.existsSync(managed)) throw Error('Refusing integration test: managed runtime already exists.');
try {
  run(path.join(root, 'scripts', 'install.ps1'), []);
  for (const omitted of ['.git', 'docs', 'studio', 'tests']) {
    assert.equal(fs.existsSync(path.join(managed, 'app', omitted)), false, 'development-only path was copied: ' + omitted);
  }
  assert.ok(fs.existsSync(path.join(managed, 'app', 'node_modules', 'ws')), 'minimal ws runtime is missing');
  const relativeImport = '.\\' + project + '\\themes\\active.json';
  const relativeImage = '.\\' + project + '\\themes\\assets\\great-sage-return.jpg';
  run(
    path.join(managed, 'app', 'scripts', 'theme.ps1'),
    ['-Import', relativeImport, '-Image', relativeImage],
    parent
  );
  const active = path.join(managed, 'app', 'themes', 'active.json');
  const image = path.join(managed, 'app', 'themes', 'assets', 'background.jpg');
  assert.ok(fs.existsSync(active), 'active theme missing');
  assert.ok(fs.existsSync(image), 'managed image missing');
  assert.equal(JSON.parse(fs.readFileSync(active, 'utf8')).background.asset, 'assets/background.jpg');
  console.log('Relative Import + Great Sage image managed integration PASS');
} finally {
  if (fs.existsSync(managed)) run(path.join(root, 'scripts', 'restore.ps1'), ['-Uninstall']);
}

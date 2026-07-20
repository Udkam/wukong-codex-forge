import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { packageRuntime } from '../scripts/package-runtime.mjs';

test('minimal managed package imports independently and omits development surfaces', async t => {
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'wukong-runtime-'));
  t.after(() => fs.rmSync(temp, { recursive: true, force: true }));
  const target = path.join(temp, 'app');
  packageRuntime({ source: process.cwd(), destination: target });

  for (const omitted of ['.git', 'docs', 'studio', 'tests']) {
    assert.equal(fs.existsSync(path.join(target, omitted)), false, `development-only path copied: ${omitted}`);
  }
  for (const required of [
    'runtime/forge-theme.css',
    'runtime/watch.mjs',
    'runtime/capture-live.mjs',
    'scripts/launch.ps1',
    'themes/active.json',
    'themes/assets/great-sage-return.jpg',
    'node_modules/ws/package.json'
  ]) {
    assert.equal(fs.existsSync(path.join(target, required)), true, `managed file missing: ${required}`);
  }

  const runtime = await import(pathToFileURL(path.join(target, 'runtime', 'forge-runtime.mjs')));
  const payload = runtime.payloadFromThemeFile(path.join(target, 'themes', 'active.json'));
  assert.match(payload.variables, /data:image\/jpeg;base64/);
  assert.equal(payload.theme.name, '大圣归来 · 六根墨幕');
  assert.deepEqual(payload.theme.palette, {
    ink: '#d6cfbd',
    lacquer: '#7f352e',
    jade: '#596b61',
    gold: '#a68b58',
    paper: '#20221e'
  });
  assert.match(payload.variables, /--forge-paper:#20221e/);
  const client = await import(pathToFileURL(path.join(target, 'runtime', 'cdp-client.mjs')));
  assert.equal(typeof client.getTargets, 'function');
});

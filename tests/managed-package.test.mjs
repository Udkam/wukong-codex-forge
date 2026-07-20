import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { packageRuntime } from '../scripts/package-runtime.mjs';

test('minimal managed package imports independently and omits development surfaces', async t => {
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'wukong-runtime-'));
  t.diagnostic(`retained package proof: ${temp}`);
  const target = path.join(temp, 'app');
  packageRuntime({ source: process.cwd(), destination: target });
  const sourceTheme = JSON.parse(fs.readFileSync('themes/active.json', 'utf8'));

  for (const omitted of ['.git', 'docs', 'studio', 'tests']) {
    assert.equal(fs.existsSync(path.join(target, omitted)), false, `development-only path copied: ${omitted}`);
  }
  for (const required of [
    'runtime/forge-theme.css',
    'runtime/watch.mjs',
    'runtime/capture-live.mjs',
    'scripts/launch.ps1',
    'scripts/disable.ps1',
    'themes/active.json',
    ...sourceTheme.background.gallery.map(entry => `themes/${entry.asset}`),
    ...Object.values(sourceTheme.motifs).map(asset => `themes/${asset}`),
    'node_modules/ws/package.json'
  ]) {
    assert.equal(fs.existsSync(path.join(target, required)), true, `managed file missing: ${required}`);
  }
  for (const rejected of [
    'themes/assets/erlang-meishan.jpg',
    'themes/assets/yaksha-king.jpg',
    'themes/motifs/yaksha-plate.svg',
    'themes/motifs/shenfeng-profile.svg'
  ]) assert.equal(fs.existsSync(path.join(target, rejected)), false, `rejected asset packaged: ${rejected}`);

  const runtime = await import(pathToFileURL(path.join(target, 'runtime', 'forge-runtime.mjs')));
  const payload = runtime.payloadFromThemeFile(path.join(target, 'themes', 'active.json'));
  assert.match(payload.variables, /data:image\/jpeg;base64/);
  assert.match(payload.variables, /data:image\/png;base64/);
  assert.equal(payload.assets.length, 11);
  assert.deepEqual(payload.assets.map(asset => asset.id), [
    'erlang-ink-duel',
    'great-sage',
    'great-sage-staff',
    'yaksha-king-rift',
    'storm-bearer',
    'shadow-confrontation',
    'ridge-gate',
    'forest-shrine',
    'mountain-path',
    'stone-buddhas',
    'sunset-ravine'
  ]);
  assert.deepEqual(Object.keys(payload.motifs).sort(), ['fangedCyanStaff', 'yakshaSet']);
  assert.equal(payload.theme.name, '大圣归来 · 玄锋双境');
  assert.deepEqual(payload.theme.palette, {
    ink: '#e2ddd3',
    lacquer: '#9d3029',
    jade: '#69777b',
    gold: '#bd914d',
    paper: '#181a19'
  });
  assert.match(payload.variables, /--forge-paper:#181a19/);
  assert.match(payload.variables, /--forge-scene-count:11/);
  assert.match(payload.variables, /--forge-primary-scene-count:3/);
  assert.match(payload.variables, /--forge-scenery-scenes:6 7 8 9 10/);
  assert.match(payload.variables, /--forge-battle-primary-scenes:0 1 2/);
  assert.match(payload.variables, /--forge-battle-secondary-scenes:3 4 5/);
  assert.match(payload.variables, /--forge-art-yaksha-king-rift:url\("data:image\/jpeg;base64,/);
  assert.match(payload.variables, /--forge-art-great-sage-staff:url\("data:image\/jpeg;base64,/);
  assert.match(payload.variables, /--forge-motif-yaksha-set:url\("data:image\/png;base64,/);
  assert.match(payload.variables, /--forge-motif-fanged-cyan-staff:url\("data:image\/png;base64,/);
  const client = await import(pathToFileURL(path.join(target, 'runtime', 'cdp-client.mjs')));
  assert.equal(typeof client.getTargets, 'function');
  assert.equal(client.isCodexTarget({ type: 'page', title: 'Codex', url: 'app://-/index.html' }), true);
  assert.equal(client.isCodexTarget({ type: 'page', title: 'Other', url: 'app://-/index.html' }), false);
  assert.equal(client.isCodexTarget({ type: 'page', title: 'Codex', url: 'https://example.com/' }), false);
});

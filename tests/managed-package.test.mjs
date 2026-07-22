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

  for (const omitted of ['.git', 'docs', 'studio', 'tests', 'node_modules']) {
    assert.equal(fs.existsSync(path.join(target, omitted)), false, `development-only path copied: ${omitted}`);
  }
  for (const required of [
    'runtime/forge-theme.css',
    'runtime/watch.mjs',
    'scripts/launch.ps1',
    'scripts/start.ps1',
    'scripts/install-native-pets.ps1',
    'scripts/install-chatgpt-hook.ps1',
    'scripts/disable.ps1',
    'start-theme.cmd',
    'stop-theme.cmd',
    'remove-theme.cmd',
    'PORTABLE-README.txt',
    'themes/active.json',
    'pets/little-wukong-yaksha-shenfeng/pet.json',
    'pets/little-wukong-yaksha-shenfeng/spritesheet.webp',
    'pets/little-wukong-yaksha-shenfeng/validation.json',
    'pets/little-wukong-yaksha-shenfeng/package-proof.json',
    'pets/little-bajie-v3-inart/pet.json',
    'pets/little-bajie-v3-inart/spritesheet.webp',
    'pets/little-bajie-v3-inart/validation.json',
    'pets/little-bajie-v3-inart/package-proof.json',
    ...sourceTheme.background.gallery.map(entry => `themes/${entry.asset}`),
    ...Object.values(sourceTheme.motifs).map(asset => `themes/${asset}`)
  ]) {
    assert.equal(fs.existsSync(path.join(target, required)), true, `managed file missing: ${required}`);
  }
  assert.equal(fs.existsSync(path.join(target, 'node_modules', 'ws')), false, 'ws runtime dependency was packaged');
  assert.equal(fs.existsSync(path.join(target, 'runtime', 'ws-client.mjs')), false, 'superseded ws bundle was packaged');
  assert.equal(fs.existsSync(path.join(target, 'runtime', 'ws-client-node.mjs')), false, 'diagnostic ws bundle was packaged');
  const packagedManifest = JSON.parse(fs.readFileSync(path.join(target, 'package.json'), 'utf8'));
  assert.equal(packagedManifest.version, '0.10.0');
  assert.deepEqual(packagedManifest.dependencies, {});
  for (const rejected of [
    'themes/assets/erlang-meishan.jpg',
    'themes/assets/yaksha-king.jpg',
    'themes/motifs/yaksha-plate.svg',
    'themes/motifs/shenfeng-profile.svg',
    'themes/motifs/yaksha-set.png',
    'themes/motifs/fanged-cyan-staff.png',
    'themes/motifs/little-wukong.webp',
    'themes/motifs/little-bajie.webp',
    'themes/motifs/little-wukong-v2.png',
    'themes/motifs/little-bajie-v2.png',
    'themes/motifs/little-wukong-gameplay-v6.png',
    'themes/motifs/little-bajie-gameplay-v6.png',
    'themes/motifs/pets/little-wukong-pet-v1.png',
    'themes/motifs/pets/little-bajie-pet-v1.png',
    'themes/motifs/pets/little-wukong-pet-v1-chroma.png',
    'themes/motifs/pets/little-bajie-pet-v1-chroma.png',
    'themes/motifs/xiangfei-gourd.png'
  ]) assert.equal(fs.existsSync(path.join(target, rejected)), false, `rejected asset packaged: ${rejected}`);
  assert.equal(fs.existsSync(path.join(target, 'runtime', 'capture-live.mjs')), false);

  const runtime = await import(pathToFileURL(path.join(target, 'runtime', 'forge-runtime.mjs')));
  const payload = runtime.payloadFromThemeFile(path.join(target, 'themes', 'active.json'));
  assert.match(payload.variables, /data:image\/jpeg;base64/);
  assert.match(payload.variables, /data:image\/webp;base64/);
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
  assert.deepEqual(Object.keys(payload.motifs).sort(), ['xiangfeiGourd']);
  assert.match(payload.theme.name, /\S/);
  assert.match(payload.variables, /--forge-paper:#[0-9a-f]{6}/i);
  assert.match(payload.variables, /--forge-scene-count:11/);
  assert.match(payload.variables, /--forge-primary-scene-count:3/);
  assert.match(payload.variables, /--forge-scenery-scenes:6 7 8 9 10/);
  assert.match(payload.variables, /--forge-battle-primary-scenes:0 1 2/);
  assert.match(payload.variables, /--forge-battle-secondary-scenes:3 4 5/);
  assert.match(payload.variables, /--forge-art-yaksha-king-rift:var\(--forge-bg-3\)/);
  assert.match(payload.variables, /--forge-art-great-sage-staff:var\(--forge-bg-2\)/);
  assert.equal((payload.variables.match(/data:image\/jpeg;base64,/g) || []).length, 11, 'each gallery image must be embedded only once');
  assert.match(payload.variables, /--forge-motif-xiangfei-gourd:url\("data:image\/webp;base64,/);
  assert.doesNotMatch(payload.variables, /--forge-motif-little-(?:wukong|bajie):/);
  assert.equal(payload.theme.motifs.xiangfeiGourd, 'motifs/xiangfei-gourd-icon.webp');
  assert.deepEqual(payload.assets.map(asset => asset.tone), payload.theme.background.gallery.map(scene => scene.tone));
  const client = await import(pathToFileURL(path.join(target, 'runtime', 'cdp-client.mjs')));
  assert.equal(typeof client.getTargets, 'function');
  assert.equal(typeof client.commandTarget, 'function');
  assert.equal(client.isCodexTarget({ type: 'page', title: 'Codex', url: 'app://-/index.html' }), true);
  assert.equal(client.isCodexTarget({ type: 'page', title: 'Other', url: 'app://-/index.html' }), false);
  assert.equal(client.isCodexTarget({ type: 'page', title: 'Codex', url: 'https://example.com/' }), false);
});

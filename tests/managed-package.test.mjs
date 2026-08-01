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
    'runtime/forge-background-v13.css',
    'runtime/injection-plan-v13.mjs',
    'runtime/host.mjs',
    'runtime/watch.mjs',
    'scripts/launch.ps1',
    'scripts/start.ps1',
    'scripts/install-native-pets.ps1',
    'scripts/install-chatgpt-hook.ps1',
    'scripts/verify-launch-adapter.ps1',
    'scripts/disable.ps1',
    'start-theme.cmd',
    'stop-theme.cmd',
    'remove-theme.cmd',
    'PORTABLE-README.txt',
    'pets/release-policy.json',
    'themes/active.json',
    'themes/native-wukong.json',
    ...sourceTheme.background.gallery.map(entry => `themes/${entry.asset}`),
    ...Object.values(sourceTheme.motifs || {}).map(asset => `themes/${asset}`),
    ...Object.values(sourceTheme.uiAssets || {}).map(asset => `themes/${asset}`)
  ]) {
    assert.equal(fs.existsSync(path.join(target, required)), true, `managed file missing: ${required}`);
  }
  assert.equal(
    fs.existsSync(path.join(target, 'themes', 'ink-mountain.json')),
    false,
    'legacy theme manifest with retired motifs was packaged'
  );
  const packagedPetPolicy = JSON.parse(fs.readFileSync(path.join(target, 'pets', 'release-policy.json'), 'utf8'));
  assert.deepEqual(packagedPetPolicy.releasedPetIds, []);
  assert.deepEqual(packagedPetPolicy.pendingPetIds, [
    'little-bajie-v4-inart-game-motion',
    'little-wukong-v5-yaksha-shenfeng'
  ]);
  assert.deepEqual(packagedPetPolicy.frozenPetIds, [
    'little-bajie-v3-inart',
    'little-wukong-yaksha-shenfeng'
  ]);
  assert.deepEqual(fs.readdirSync(path.join(target, 'pets')).sort(), ['release-policy.json']);
  for (const frozenPetFile of [
    'pets/little-bajie-v3-inart/pet.json',
    'pets/little-bajie-v3-inart/spritesheet.webp',
    'pets/little-bajie-v3-inart/validation.json',
    'pets/little-bajie-v3-inart/package-proof.json',
    'pets/little-wukong-yaksha-shenfeng/pet.json',
    'pets/little-wukong-yaksha-shenfeng/spritesheet.webp',
    'pets/little-wukong-yaksha-shenfeng/validation.json',
    'pets/little-wukong-yaksha-shenfeng/package-proof.json'
  ]) {
    assert.equal(fs.existsSync(path.join(target, frozenPetFile)), false, `unapproved pet file packaged: ${frozenPetFile}`);
  }
  assert.equal(fs.existsSync(path.join(target, 'node_modules', 'ws')), false, 'ws runtime dependency was packaged');
  assert.equal(fs.existsSync(path.join(target, 'runtime', 'ws-client.mjs')), false, 'superseded ws bundle was packaged');
  assert.equal(fs.existsSync(path.join(target, 'runtime', 'ws-client-node.mjs')), false, 'diagnostic ws bundle was packaged');
  const packagedManifest = JSON.parse(fs.readFileSync(path.join(target, 'package.json'), 'utf8'));
  assert.equal(packagedManifest.version, '0.13.0');
  assert.deepEqual(packagedManifest.dependencies, {});
  for (const rejected of [
    'themes/assets/erlang-meishan.jpg',
    'themes/assets/yaksha-king.jpg',
    'themes/assets/yaksha-king-rift.jpg',
    'themes/assets/destined-afterimage.jpg',
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
    'themes/motifs/xiangfei-gourd.png',
    'themes/motifs/xiangfei-gourd.webp',
    'themes/motifs/xiangfei-gourd-icon.webp'
  ]) assert.equal(fs.existsSync(path.join(target, rejected)), false, `rejected asset packaged: ${rejected}`);
  assert.equal(fs.existsSync(path.join(target, 'runtime', 'capture-live.mjs')), false);
  const portableReadme = fs.readFileSync(path.join(target, 'PORTABLE-README.txt'), 'utf8');
  assert.match(portableReadme, /CURRENT V34 RELEASE CANDIDATE/);
  assert.match(portableReadme, /HISTORICAL V12 INSTRUCTIONS \(retained; superseded above\)/);
  assert.match(portableReadme, /releasedPetIds is empty/);
  assert.match(portableReadme, /Codex embedded Node -> append-only bridge -> event-driven lifecycle host -> official ChatGPT/);
  assert.match(portableReadme, /Pets are deferred and excluded from this release gate/);
  assert.doesNotMatch(portableReadme.split('HISTORICAL V12 INSTRUCTIONS')[0], /V12 changes only/);

  const runtime = await import(pathToFileURL(path.join(target, 'runtime', 'forge-runtime.mjs')));
  const payload = runtime.payloadFromThemeFile(path.join(target, 'themes', 'active.json'));
  assert.match(payload.variables, /data:image\/jpeg;base64/);
  assert.match(payload.variables, /data:image\/webp;base64/);
  assert.equal(payload.assets.length, 9);
  assert.deepEqual(payload.assets.map(asset => asset.id), [
    'erlang-ink-duel',
    'great-sage-staff',
    'storm-bearer',
    'shadow-confrontation',
    'ridge-gate',
    'forest-shrine',
    'mountain-path',
    'stone-buddhas',
    'sunset-ravine'
  ]);
  assert.deepEqual(payload.motifs, {});
  assert.deepEqual(Object.keys(payload.uiAssets), [
    'composerMain',
    'composerStrip',
    'composerPill',
    'paperTile',
    'sidebarLevel1',
    'sidebarSelected',
    'sidebarLevel2Hover',
    'landingMark',
    'landingMarkDark'
  ]);
  assert.match(payload.theme.name, /\S/);
  assert.match(payload.variables, /--forge-paper:#[0-9a-f]{6}/i);
  assert.match(payload.variables, /--forge-scene-count:9/);
  assert.doesNotMatch(payload.variables, /--forge-primary-scene-count:/);
  assert.match(payload.variables, /--forge-scenery-scenes:4 5 6 7 8/);
  assert.match(payload.variables, /--forge-battle-primary-scenes:0 1/);
  assert.match(payload.variables, /--forge-battle-secondary-scenes:2 3/);
  assert.match(payload.variables, /--forge-battle-scenes:0 1 2 3/);
  assert.doesNotMatch(payload.variables, /--forge-art-yaksha-king-rift:/);
  assert.match(payload.variables, /--forge-art-great-sage-staff:var\(--forge-bg-1\)/);
  assert.equal((payload.variables.match(/data:image\/jpeg;base64,/g) || []).length, 9, 'each gallery image must be embedded only once');
  assert.match(payload.variables, /--forge-motif-xiangfei-gourd:none/);
  assert.match(payload.variables, /--forge-ui-composer-main:url\("data:image\/webp;base64,/);
  assert.match(payload.variables, /--forge-ui-sidebar-level2-hover:url\("data:image\/webp;base64,/);
  assert.match(payload.variables, /--forge-ui-landing-mark:url\("data:image\/webp;base64,/);
  assert.match(payload.variables, /--forge-ui-landing-mark-dark:url\("data:image\/webp;base64,/);
  assert.doesNotMatch(payload.variables, /--forge-motif-little-(?:wukong|bajie):/);
  assert.equal('motifs' in payload.theme, false);
  assert.deepEqual(payload.assets.map(asset => asset.tone), payload.theme.background.gallery.map(scene => scene.tone));
  const client = await import(pathToFileURL(path.join(target, 'runtime', 'cdp-client.mjs')));
  assert.equal(typeof client.getTargets, 'function');
  assert.equal(typeof client.commandTarget, 'function');
  assert.equal(client.isCodexTarget({ type: 'page', title: 'Codex', url: 'app://-/index.html' }), true);
  assert.equal(client.isCodexTarget({ type: 'page', title: 'Other', url: 'app://-/index.html' }), false);
  assert.equal(client.isCodexTarget({ type: 'page', title: 'Codex', url: 'https://example.com/' }), false);
});

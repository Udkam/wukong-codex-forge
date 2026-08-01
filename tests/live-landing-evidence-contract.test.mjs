import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const evidence = JSON.parse(fs.readFileSync(
  new URL(
    '../artifacts/test-runs/v30-live-landing-contract-20260801/acceptance.json',
    import.meta.url
  ),
  'utf8'
));

test('V30 real Codex landing evidence is complete, private-safe, and bounded', () => {
  assert.equal(evidence.schemaVersion, 1);
  assert.match(evidence.source, /real Codex renderer/i);
  assert.equal(evidence.appUrl, 'app://-/index.html');
  assert.match(evidence.screenshotPolicy, /locally only/i);
  assert.match(evidence.screenshotPolicy, /workspace identifiers/i);
  assert.match(evidence.screenshotSha256, /^[0-9A-F]{64}$/);
  assert.match(evidence.reportSha256, /^[0-9A-F]{64}$/);

  assert.deepEqual(evidence.viewport, {
    width: 1280,
    height: 820,
    deviceScaleFactor: 1.25
  });
  assert.deepEqual(evidence.theme, {
    active: true,
    runtime: 'V13',
    surface: 'landing',
    mode: 'battle',
    scene: '1',
    markedElements: 60
  });

  assert.equal(evidence.geometry.sidebar.width, 275);
  assert.equal(evidence.geometry.sidebar.height, 784);
  assert.equal(evidence.geometry.workspace.width, 1005);
  assert.equal(evidence.geometry.composerPaperSurface.width, 736);
  assert.equal(evidence.geometry.composerPaperSurface.height, 100);

  assert.equal(evidence.background.loadedActiveLayers, 1);
  assert.equal(evidence.background.backgroundSize, 'cover');
  assert.equal(evidence.background.pointerEvents, 'none');
  assert.equal(evidence.background.inert, true);
  assert.equal(evidence.background.ariaHidden, true);

  assert.equal(evidence.composer.surfacePresent, true);
  assert.equal(evidence.composer.surfaceMarked, true);
  assert.equal(evidence.composer.editorPresent, true);
  assert.equal(evidence.composer.contenteditable, 'true');

  assert.equal(evidence.releaseGate.wukongPetPresent, false);
  assert.equal(evidence.releaseGate.bajiePetPresent, false);
  assert.match(evidence.releaseGate.reason, /pending explicit user approval/i);

  assert.equal(evidence.cleanup.rootReleased, true);
  assert.equal(evidence.cleanup.launcherReleased, true);
  assert.equal(evidence.cleanup.portReleased, true);
  assert.equal(evidence.cleanup.remainingProjectProcesses, 0);

  assert.match(evidence.acceptanceBoundary, /technical pre-acceptance only/i);
  assert.match(evidence.acceptanceBoundary, /not user visual approval/i);
  assert.match(evidence.acceptanceBoundary, /queue/i);
  assert.match(evidence.acceptanceBoundary, /goal/i);
  assert.match(evidence.acceptanceBoundary, /pet/i);
  assert.match(evidence.acceptanceBoundary, /final lifecycle/i);
});

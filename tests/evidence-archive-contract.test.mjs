import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const v23Root = path.join(
  root,
  'artifacts',
  'test-runs',
  'v23-environment-panel-2026-07-31T23-14-14-461Z'
);
const v24Root = path.join(
  root,
  'artifacts',
  'test-runs',
  'v24-background-transition-2026-07-31T23-55-59-699Z'
);

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function pngSize(file) {
  const payload = fs.readFileSync(file);
  assert.deepEqual([...payload.subarray(1, 4)], [80, 78, 71], `${file} is not a PNG`);
  return [payload.readUInt32BE(16), payload.readUInt32BE(20)];
}

test('V23 environment-panel evidence is a full-page fixture with paint-only geometry', () => {
  const image = path.join(v23Root, '01-full-multi-guided.png');
  const capture = readJson(path.join(v23Root, 'capture.json'));

  assert.deepEqual(pngSize(image), [2000, 1125]);
  assert.match(capture.source, /headless native-structure fixture/i);
  assert.match(capture.source, /not real Codex acceptance/i);
  assert.deepEqual(capture.geometry.before.panel, capture.geometry.after.panel);
  assert.deepEqual(capture.geometry.before.card, capture.geometry.after.card);
  assert.deepEqual(capture.geometry.before.title, capture.geometry.after.title);
  assert.deepEqual(capture.geometry.before.rows, capture.geometry.after.rows);
  assert.equal(capture.geometry.after.card[2], 300);
  assert.equal(capture.paint.markedRows, 4);
  assert.equal(capture.paint.cardBackground, 'none');
  assert.equal(capture.paint.cardClipPath, 'none');
  assert.equal(capture.paint.paperPointerEvents, 'none');
  assert.equal(capture.paint.progressFadeOpacity, '0');
});

test('V24 transition evidence keeps four full-page stages and bounded textures', () => {
  const capture = readJson(path.join(v24Root, 'capture.json'));
  const expectedScreenshots = [
    '01-full-landing-stable.png',
    '02-full-transition-to-thread.png',
    '03-full-thread-stable.png',
    '04-full-landing-returned.png'
  ];

  assert.match(capture.source, /single headless native-structure fixture/i);
  assert.match(capture.source, /not real Codex acceptance/i);
  assert.deepEqual(capture.screenshots, expectedScreenshots);
  for (const screenshot of expectedScreenshots) {
    assert.deepEqual(pngSize(path.join(v24Root, screenshot)), [2000, 1125]);
  }

  const stages = [
    capture.evidence.landing,
    capture.evidence.toThread,
    capture.evidence.thread,
    capture.evidence.returnedLanding
  ];
  const expectedLoadedLayers = [1, 2, 1, 1];
  for (const [index, stage] of stages.entries()) {
    assert.deepEqual(stage.viewport, [0, 0, 1600, 900]);
    for (const layer of ['overlay', 'active', 'image', 'veil']) {
      assert.deepEqual(stage.coverage[layer], stage.viewport, `${layer} missed the viewport`);
    }
    assert.equal(stage.paint.backgroundSize, 'cover');
    assert.equal(stage.paint.filter, 'none');
    assert.equal(stage.paint.willChange, 'auto');
    assert.equal(stage.state.backgroundLoadedLayerCount, expectedLoadedLayers[index]);
    assert.equal(stage.state.preloadInFlight, 0);
    assert.equal(stage.state.backgroundReady, true);
  }
  assert.deepEqual(
    stages.map(stage => stage.state.surface),
    ['landing', 'thread', 'thread', 'landing']
  );
  assert.deepEqual(
    stages.map(stage => stage.state.mode),
    ['battle', 'scenery', 'scenery', 'battle']
  );
});

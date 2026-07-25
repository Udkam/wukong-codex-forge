import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {
  MAX_BACKGROUND_PIXELS,
  MAX_DECORATION_PIXELS,
  MAX_GALLERY_PIXELS,
  MAX_TRANSITION_PIXELS,
  assertRasterPixelBudget,
  payloadFromThemeFile,
  readRasterDimensions
} from '../runtime/forge-runtime.mjs';

const themePath = path.resolve('themes/active.json');
const themeRoot = path.dirname(themePath);
const theme = JSON.parse(fs.readFileSync(themePath, 'utf8').replace(/^\uFEFF/, ''));

const dimensionsFor = relativeAsset => {
  const assetPath = path.resolve(themeRoot, relativeAsset);
  const dimensions = readRasterDimensions(fs.readFileSync(assetPath), path.extname(assetPath));
  assert.ok(dimensions, `unable to read raster dimensions: ${relativeAsset}`);
  return {
    asset: relativeAsset,
    ...dimensions,
    pixels: dimensions.width * dimensions.height
  };
};

test('active gallery stays inside decoded-pixel and two-scene transition budgets', t => {
  const unique = [...new Set(theme.background.gallery.map(scene => scene.asset))]
    .map(dimensionsFor);
  const totalPixels = unique.reduce((sum, asset) => sum + asset.pixels, 0);
  const transitionPixels = unique
    .map(asset => asset.pixels)
    .sort((left, right) => right - left)
    .slice(0, 2)
    .reduce((sum, pixels) => sum + pixels, 0);

  for (const asset of unique) {
    assert.ok(asset.pixels <= MAX_BACKGROUND_PIXELS, `${asset.asset} exceeds the per-background budget`);
  }
  assert.ok(totalPixels <= MAX_GALLERY_PIXELS, 'gallery exceeds its decoded-pixel budget');
  assert.ok(transitionPixels <= MAX_TRANSITION_PIXELS, 'crossfade exceeds its two-scene decoded-pixel budget');

  const greatSage = unique.find(asset => asset.asset.endsWith('great-sage-return.jpg'));
  assert.deepEqual(
    { width: greatSage?.width, height: greatSage?.height },
    { width: 1256, height: 707 },
    'update this known-quality assertion when the approved 1080p-or-higher Great Sage replacement lands'
  );
  t.diagnostic(
    `decoded gallery: ${totalPixels.toLocaleString('en-US')} px; transition: ${transitionPixels.toLocaleString('en-US')} px; ` +
    'great-sage-return.jpg remains a documented sub-1080p visual-quality gap'
  );

  assert.equal(payloadFromThemeFile(themePath).assets.length, theme.background.gallery.length);
});

test('active UI materials remain bounded after decode', () => {
  for (const relativeAsset of Object.values(theme.uiAssets)) {
    const asset = dimensionsFor(relativeAsset);
    assert.ok(asset.pixels <= MAX_DECORATION_PIXELS, `${asset.asset} exceeds the decoration budget`);
  }
});

test('pixel guard rejects oversized and malformed rasters before payload assembly', () => {
  const oversizedPng = Buffer.alloc(24);
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]).copy(oversizedPng, 0);
  oversizedPng.writeUInt32BE(13, 8);
  oversizedPng.write('IHDR', 12, 'ascii');
  oversizedPng.writeUInt32BE(100_000, 16);
  oversizedPng.writeUInt32BE(100_000, 20);

  assert.throws(
    () => assertRasterPixelBudget(oversizedPng, '.png', MAX_BACKGROUND_PIXELS, 'Synthetic background'),
    /exceeds decoded pixel limit/
  );
  assert.throws(
    () => assertRasterPixelBudget(Buffer.from('not-an-image'), '.png', MAX_BACKGROUND_PIXELS),
    /invalid or unsupported raster dimensions/
  );
});

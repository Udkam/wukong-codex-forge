import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const root = process.cwd();
const petRoot = path.join(root, 'pets');
const expectedIds = [
  'little-bajie-v3-inart',
  'little-wukong-yaksha-shenfeng'
];
const expectedInstallIds = expectedIds.map(id => `${id}-wukong-forge`);
const approvedSources = Object.freeze({
  'little-bajie-v3-inart': {
    atlasSha256: '511bc2b8ca7c197407ab8e3be194aaa5f2036428c05fdcb811400525005c2277',
    validationSha256: 'c3d40c54805f4aeb4f6042d70933853c9f4d4a06472fd7a8d09476160ad8cad8',
    qaSummarySha256: '32497cfb1c7bbcff83feab125e8f2c9e8712b04453d57c0cfb8727db2b577f60',
    sourceRun: 'artifacts/native-pets/little-bajie-v3-inart',
    sourceAtlas: 'artifacts/native-pets/little-bajie-v3-inart/final/spritesheet-extended-candidate-c-v1.webp',
    sourceValidation: 'artifacts/native-pets/little-bajie-v3-inart/final/validation-extended-candidate-c-v1.json',
    sourceQaSummary: 'artifacts/native-pets/little-bajie-v3-inart/qa/run-summary-candidate-c-v1.json'
  },
  'little-wukong-yaksha-shenfeng': {
    atlasSha256: '018c3447368c23f963335710ca09086efd634b2826b2913a920f3960e3d77d87',
    validationSha256: 'fa8acf13c459ec8293fc3e25b2cfb42ecaf74487b46dcc92e8206632a1dc9c1c',
    qaSummarySha256: 'be2c2961a03d7a957aaf1c38a04c640fe62e70ba04d3b7a4157c6604b1750aac',
    sourceRun: 'artifacts/native-pets/little-wukong-v4-yaksha-shenfeng',
    sourceAtlas: 'artifacts/native-pets/little-wukong-v4-yaksha-shenfeng/final/spritesheet-extended-v7.webp',
    sourceValidation: 'artifacts/native-pets/little-wukong-v4-yaksha-shenfeng/final/validation-extended-v7.json',
    sourceQaSummary: 'artifacts/native-pets/little-wukong-v4-yaksha-shenfeng/qa/run-summary-v7.json'
  }
});

const sha256 = bytes => crypto.createHash('sha256').update(bytes).digest('hex');

function webpDimensions(bytes, label) {
  assert.equal(bytes.subarray(0, 4).toString('ascii'), 'RIFF', `${label} RIFF header`);
  assert.equal(bytes.subarray(8, 12).toString('ascii'), 'WEBP', `${label} WebP header`);
  assert.equal(bytes.readUInt32LE(4) + 8, bytes.length, `${label} RIFF length`);
  const codec = bytes.subarray(12, 16).toString('ascii');
  const chunkLength = bytes.readUInt32LE(16);
  assert.ok(20 + chunkLength + (chunkLength & 1) <= bytes.length, `${label} first chunk is complete`);
  if (codec === 'VP8X') {
    return {
      width: 1 + bytes[24] + (bytes[25] << 8) + (bytes[26] << 16),
      height: 1 + bytes[27] + (bytes[28] << 8) + (bytes[29] << 16)
    };
  }
  if (codec === 'VP8L') {
    assert.equal(bytes[20], 0x2f, `${label} VP8L signature`);
    return {
      width: 1 + bytes[21] + ((bytes[22] & 0x3f) << 8),
      height: 1 + ((bytes[22] >> 6) | (bytes[23] << 2) | ((bytes[24] & 0x0f) << 10))
    };
  }
  assert.equal(codec, 'VP8 ', `${label} supported codec`);
  assert.deepEqual([...bytes.subarray(23, 26)], [0x9d, 0x01, 0x2a], `${label} VP8 signature`);
  return {
    width: (bytes[26] | (bytes[27] << 8)) & 0x3fff,
    height: (bytes[28] | (bytes[29] << 8)) & 0x3fff
  };
}

function assertDirectFile(file, label) {
  const item = fs.lstatSync(file);
  assert.equal(item.isFile(), true, `${label} must be a file`);
  assert.equal(item.isSymbolicLink(), false, `${label} must not be linked`);
  return fs.readFileSync(file);
}

test('the release contains exactly two direct, proof-bound Hatch Pet v2 packages', () => {
  const actualIds = fs.readdirSync(petRoot, { withFileTypes: true })
    .filter(item => item.isDirectory())
    .map(item => item.name)
    .sort();
  assert.deepEqual(actualIds, expectedIds);

  for (const id of expectedIds) {
    const directory = path.join(petRoot, id);
    const directoryItem = fs.lstatSync(directory);
    assert.equal(directoryItem.isSymbolicLink(), false, `${id} package directory must be direct`);
    assert.deepEqual(fs.readdirSync(directory).sort(), [
      'package-proof.json',
      'pet.json',
      'spritesheet.webp',
      'validation.json'
    ]);

    const manifestBytes = assertDirectFile(path.join(directory, 'pet.json'), `${id} manifest`);
    const atlasBytes = assertDirectFile(path.join(directory, 'spritesheet.webp'), `${id} atlas`);
    const validationBytes = assertDirectFile(path.join(directory, 'validation.json'), `${id} validation`);
    const proofBytes = assertDirectFile(path.join(directory, 'package-proof.json'), `${id} proof`);
    const manifest = JSON.parse(manifestBytes.toString('utf8'));
    const validation = JSON.parse(validationBytes.toString('utf8'));
    const proof = JSON.parse(proofBytes.toString('utf8'));

    assert.equal(manifest.id, id);
    assert.equal(manifest.spriteVersionNumber, 2);
    assert.equal(manifest.spritesheetPath, 'spritesheet.webp');
    assert.match(manifest.displayName, /\S/);
    assert.match(manifest.description, /\S/);
    assert.deepEqual(webpDimensions(atlasBytes, id), { width: 1536, height: 2288 });
    assert.deepEqual({
      ok: validation.ok,
      format: validation.format,
      mode: validation.mode,
      columns: validation.columns,
      rows: validation.rows,
      spriteVersionNumber: validation.sprite_version_number,
      width: validation.width,
      height: validation.height,
      transparentRgbResidue: validation.transparent_rgb_residue_pixels,
      errors: validation.errors
    }, {
      ok: true,
      format: 'WEBP',
      mode: 'RGBA',
      columns: 8,
      rows: 11,
      spriteVersionNumber: 2,
      width: 1536,
      height: 2288,
      transparentRgbResidue: 0,
      errors: []
    });
    assert.equal(proof.schemaVersion, 1);
    assert.equal(proof.petId, id);
    assert.equal(proof.manifestSha256, sha256(manifestBytes));
    assert.equal(proof.atlasSha256, sha256(atlasBytes));
    assert.equal(proof.validationSha256, sha256(validationBytes));
    assert.deepEqual({
      atlasSha256: proof.atlasSha256,
      validationSha256: proof.validationSha256,
      qaSummarySha256: proof.qaSummarySha256,
      sourceRun: proof.sourceRun,
      sourceAtlas: proof.sourceAtlas,
      sourceValidation: proof.sourceValidation,
      sourceQaSummary: proof.sourceQaSummary
    }, approvedSources[id], `${id} must be bound to the reviewed candidate, not an unversioned atlas`);
    assert.deepEqual(proof.atlas, {
      format: 'WEBP',
      width: 1536,
      height: 2288,
      columns: 8,
      rows: 11,
      spriteVersionNumber: 2
    });
  }
});

test('Windows linker reuses retained identical content without creating duplicate pet ids', {
  skip: process.platform !== 'win32'
}, t => {
  const retained = fs.mkdtempSync(path.join(os.tmpdir(), 'wukong-native-pet-link-proof-'));
  const codexHome = path.join(retained, 'codex-home');
  const roots = ['a', 'b', 'c'].map(name => path.join(retained, `release-${name}`));
  t.diagnostic(`retained native pet linker proof: ${retained}`);

  for (const releaseRoot of roots) {
    fs.mkdirSync(releaseRoot, { recursive: true });
    fs.cpSync(petRoot, path.join(releaseRoot, 'pets'), { recursive: true, errorOnExist: true, force: false });
    const result = spawnSync('powershell.exe', [
      '-NoProfile',
      '-ExecutionPolicy', 'Bypass',
      '-File', path.join(root, 'scripts', 'install-native-pets.ps1'),
      '-Root', releaseRoot,
      '-CodexHome', codexHome
    ], { encoding: 'utf8', windowsHide: true });
    assert.equal(result.status, 0, `${releaseRoot}\nstdout: ${result.stdout}\nstderr: ${result.stderr}`);
  }

  const installedNames = fs.readdirSync(path.join(codexHome, 'pets')).sort();
  assert.deepEqual(installedNames, expectedInstallIds, 'content-identical retained releases must reuse the discoverable install ids');
  for (const id of expectedIds) {
    const installId = `${id}-wukong-forge`;
    const installedPath = path.join(codexHome, 'pets', installId);
    const installed = fs.lstatSync(installedPath);
    assert.equal(installed.isDirectory(), true, `${installId} must be a direct directory visible to Codex discovery`);
    assert.equal(installed.isSymbolicLink(), false, `${installId} discovery directory must not be linked`);
    assert.deepEqual(fs.readdirSync(installedPath).sort(), [
      'package-proof.json',
      'payload',
      'pet.json',
      'source-pet.json',
      'validation.json'
    ]);
    for (const file of ['package-proof.json', 'pet.json', 'source-pet.json', 'validation.json']) {
      const installedFile = fs.lstatSync(path.join(installedPath, file));
      assert.equal(installedFile.isFile(), true, `${installId}/${file} must be readable as a file`);
      assert.equal(installedFile.isSymbolicLink(), false, `${installId}/${file} must be direct`);
    }
    const payloadPath = path.join(installedPath, 'payload');
    assert.equal(fs.lstatSync(payloadPath).isSymbolicLink(), true, `${installId}/payload must be a retained junction`);
    assert.equal(fs.statSync(payloadPath).isDirectory(), true, `${installId}/payload must resolve to a package directory`);
    const sourceManifest = JSON.parse(fs.readFileSync(path.join(installedPath, 'source-pet.json'), 'utf8'));
    const installedManifest = JSON.parse(fs.readFileSync(path.join(installedPath, 'pet.json'), 'utf8'));
    assert.equal(installedManifest.id, sourceManifest.id);
    assert.equal(installedManifest.displayName, sourceManifest.displayName);
    assert.equal(installedManifest.description, sourceManifest.description);
    assert.equal(installedManifest.spriteVersionNumber, 2);
    assert.equal(installedManifest.spritesheetPath, 'payload/spritesheet.webp');
    const resolvedAtlas = path.resolve(installedPath, installedManifest.spritesheetPath);
    const relativeAtlas = path.relative(installedPath, resolvedAtlas);
    assert.ok(relativeAtlas && relativeAtlas !== '..' && !relativeAtlas.startsWith(`..${path.sep}`) && !path.isAbsolute(relativeAtlas));
    assert.equal(sha256(fs.readFileSync(resolvedAtlas)), approvedSources[id].atlasSha256);
  }
  const officiallyDiscoverable = fs.readdirSync(path.join(codexHome, 'pets'), { withFileTypes: true })
    .filter(entry => entry.isDirectory())
    .map(entry => entry.name)
    .sort();
  assert.deepEqual(officiallyDiscoverable, expectedInstallIds, 'official Dirent.isDirectory discovery must see both custom pets');

  const records = roots.flatMap(releaseRoot => fs.readFileSync(
    path.join(releaseRoot, '.wukong-runtime', 'native-pet-links.jsonl'),
    'utf8'
  ).trim().split(/\r?\n/).filter(Boolean).map(line => JSON.parse(line)));
  assert.equal(records.length, 6);
  assert.equal(records.filter(record => record.action === 'linked-payload').length, 2);
  assert.equal(records.filter(record => record.action === 'already-present').length, 4);
  assert.ok(records.every(record => record.spriteVersionNumber === 2));
  assert.ok(records.every(record => record.installMode === 'linked-payload'));

  const legacyReleaseRoot = path.join(retained, 'release-legacy-copy');
  const legacyCodexHome = path.join(retained, 'codex-home-legacy-copy');
  fs.mkdirSync(legacyReleaseRoot, { recursive: true });
  fs.cpSync(petRoot, path.join(legacyReleaseRoot, 'pets'), { recursive: true, errorOnExist: true, force: false });
  for (const id of expectedIds) {
    const legacyInstallPath = path.join(legacyCodexHome, 'pets', `${id}-wukong-forge`);
    fs.mkdirSync(path.dirname(legacyInstallPath), { recursive: true });
    fs.cpSync(path.join(legacyReleaseRoot, 'pets', id), legacyInstallPath, {
      recursive: true,
      errorOnExist: true,
      force: false
    });
  }
  const legacyResult = spawnSync('powershell.exe', [
    '-NoProfile',
    '-ExecutionPolicy', 'Bypass',
    '-File', path.join(root, 'scripts', 'install-native-pets.ps1'),
    '-Root', legacyReleaseRoot,
    '-CodexHome', legacyCodexHome
  ], { encoding: 'utf8', windowsHide: true });
  assert.equal(legacyResult.status, 0, `legacy migration\nstdout: ${legacyResult.stdout}\nstderr: ${legacyResult.stderr}`);
  for (const id of expectedIds) {
    const migratedPath = path.join(legacyCodexHome, 'pets', `${id}-wukong-forge`);
    assert.equal(fs.existsSync(path.join(migratedPath, 'spritesheet.webp')), true, 'retained copied atlas must not be deleted');
    assert.equal(fs.lstatSync(path.join(migratedPath, 'payload')).isSymbolicLink(), true);
    assert.equal(
      JSON.parse(fs.readFileSync(path.join(migratedPath, 'pet.json'), 'utf8')).spritesheetPath,
      'payload/spritesheet.webp'
    );
    assert.equal(
      sha256(fs.readFileSync(path.join(migratedPath, 'source-pet.json'))),
      sha256(fs.readFileSync(path.join(legacyReleaseRoot, 'pets', id, 'pet.json'))),
      'legacy manifest bytes must be preserved before deriving the discovery manifest'
    );
  }
  const legacyRecords = fs.readFileSync(
    path.join(legacyReleaseRoot, '.wukong-runtime', 'native-pet-links.jsonl'),
    'utf8'
  ).trim().split(/\r?\n/).filter(Boolean).map(line => JSON.parse(line));
  assert.equal(legacyRecords.length, 2);
  assert.ok(legacyRecords.every(record => record.action === 'migrated-retained-copy'));
  assert.ok(legacyRecords.every(record => record.installMode === 'linked-payload'));

  const conflictRoot = path.join(retained, 'release-conflict');
  fs.mkdirSync(conflictRoot, { recursive: true });
  fs.cpSync(petRoot, path.join(conflictRoot, 'pets'), { recursive: true, errorOnExist: true, force: false });
  const conflictPackage = path.join(conflictRoot, 'pets', 'little-wukong-yaksha-shenfeng');
  const conflictManifestPath = path.join(conflictPackage, 'pet.json');
  const conflictProofPath = path.join(conflictPackage, 'package-proof.json');
  const conflictManifest = JSON.parse(fs.readFileSync(conflictManifestPath, 'utf8'));
  conflictManifest.description = `${conflictManifest.description} retained-conflict-proof`;
  const conflictManifestBytes = Buffer.from(`${JSON.stringify(conflictManifest, null, 2)}\n`, 'utf8');
  fs.writeFileSync(conflictManifestPath, conflictManifestBytes, { flag: 'w' });
  const conflictProof = JSON.parse(fs.readFileSync(conflictProofPath, 'utf8'));
  conflictProof.manifestSha256 = sha256(conflictManifestBytes);
  fs.writeFileSync(conflictProofPath, `${JSON.stringify(conflictProof, null, 2)}\n`, { encoding: 'utf8', flag: 'w' });

  const conflictResult = spawnSync('powershell.exe', [
    '-NoProfile',
    '-ExecutionPolicy', 'Bypass',
    '-File', path.join(root, 'scripts', 'install-native-pets.ps1'),
    '-Root', conflictRoot,
    '-CodexHome', codexHome
  ], { encoding: 'utf8', windowsHide: true });
  assert.notEqual(conflictResult.status, 0, 'different content with the same manifest id must fail closed');
  assert.match(`${conflictResult.stdout}\n${conflictResult.stderr}`, /different retained pet already uses install id/i);
  assert.deepEqual(fs.readdirSync(path.join(codexHome, 'pets')).sort(), expectedInstallIds, 'a conflict must not add a duplicate pet folder');
  assert.equal(fs.existsSync(path.join(conflictRoot, '.wukong-runtime')), false, 'conflict preflight must not create runtime state');
});

import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const packageRoot = path.join(repositoryRoot, 'pets');
const expectedAtlas = Object.freeze({
  format: 'WEBP',
  width: 1536,
  height: 2288,
  columns: 8,
  rows: 11,
  spriteVersionNumber: 2
});

const pets = [
  {
    run: 'artifacts/native-pets/little-wukong-v4-yaksha-shenfeng',
    atlas: 'final/spritesheet-extended-v7.webp',
    validation: 'final/validation-extended-v7.json',
    qaSummary: 'qa/run-summary-v7.json',
    atlasSha256: '018c3447368c23f963335710ca09086efd634b2826b2913a920f3960e3d77d87',
    validationSha256: 'fa8acf13c459ec8293fc3e25b2cfb42ecaf74487b46dcc92e8206632a1dc9c1c',
    qaSummarySha256: 'be2c2961a03d7a957aaf1c38a04c640fe62e70ba04d3b7a4157c6604b1750aac',
    id: 'little-wukong-yaksha-shenfeng',
    displayName: '小悟空·厌火夜叉',
    description: '身披厌火夜叉套、手持兽棍·神锋的天命人。'
  },
  {
    run: 'artifacts/native-pets/little-bajie-v3-inart',
    atlas: 'final/spritesheet-extended-candidate-c-v1.webp',
    validation: 'final/validation-extended-candidate-c-v1.json',
    qaSummary: 'qa/run-summary-candidate-c-v1.json',
    atlasSha256: '511bc2b8ca7c197407ab8e3be194aaa5f2036428c05fdcb811400525005c2277',
    validationSha256: 'c3d40c54805f4aeb4f6042d70933853c9f4d4a06472fd7a8d09476160ad8cad8',
    qaSummarySha256: '32497cfb1c7bbcff83feab125e8f2c9e8712b04453d57c0cfb8727db2b577f60',
    id: 'little-bajie-v3-inart',
    displayName: '小八戒',
    description: '身着旧青衣、手持完整九齿钉耙的可爱小八戒。'
  }
];

const sha256 = value => crypto.createHash('sha256').update(value).digest('hex');
const jsonBytes = value => Buffer.from(`${JSON.stringify(value, null, 2)}\n`, 'utf8');
const inside = (parent, child) => {
  const relative = path.relative(parent, child);
  return relative && !relative.startsWith('..') && !path.isAbsolute(relative);
};

function assertNoLinkedExistingSegments(candidate, label) {
  const resolved = path.resolve(candidate);
  const parsed = path.parse(resolved);
  let cursor = parsed.root;
  for (const segment of resolved.slice(parsed.root.length).split(path.sep).filter(Boolean)) {
    cursor = path.join(cursor, segment);
    if (!fs.existsSync(cursor)) break;
    if (fs.lstatSync(cursor).isSymbolicLink()) {
      throw new Error(`${label} passes through a symbolic link or junction: ${cursor}`);
    }
  }
}

function directFile(file, root, label) {
  const resolved = path.resolve(file);
  if (!inside(root, resolved)) throw new Error(`${label} escapes its pet run: ${resolved}`);
  const item = fs.lstatSync(resolved);
  if (!item.isFile() || item.isSymbolicLink()) throw new Error(`${label} must be a direct file: ${resolved}`);
  const real = fs.realpathSync.native(resolved);
  const realRoot = fs.realpathSync.native(root);
  if (!inside(realRoot, real)) throw new Error(`${label} resolves outside its pet run: ${resolved}`);
  return fs.readFileSync(resolved);
}

function webpDimensions(bytes, label) {
  if (bytes.length < 30 || bytes.subarray(0, 4).toString('ascii') !== 'RIFF' || bytes.subarray(8, 12).toString('ascii') !== 'WEBP') {
    throw new Error(`${label} is not a complete WebP file.`);
  }
  const riffLength = bytes.readUInt32LE(4) + 8;
  if (riffLength !== bytes.length) {
    throw new Error(`${label} has an invalid RIFF length (${riffLength} declared, ${bytes.length} actual).`);
  }
  const codec = bytes.subarray(12, 16).toString('ascii');
  const chunkLength = bytes.readUInt32LE(16);
  const paddedChunkEnd = 20 + chunkLength + (chunkLength & 1);
  if (paddedChunkEnd > bytes.length) {
    throw new Error(`${label} has a truncated ${codec} chunk.`);
  }
  if (codec === 'VP8X') {
    if (chunkLength < 10) throw new Error(`${label} has an incomplete VP8X header.`);
    return {
      width: 1 + bytes[24] + (bytes[25] << 8) + (bytes[26] << 16),
      height: 1 + bytes[27] + (bytes[28] << 8) + (bytes[29] << 16)
    };
  }
  if (codec === 'VP8L') {
    if (chunkLength < 5) throw new Error(`${label} has an incomplete VP8L header.`);
    if (bytes[20] !== 0x2f) throw new Error(`${label} has an invalid VP8L header.`);
    return {
      width: 1 + bytes[21] + ((bytes[22] & 0x3f) << 8),
      height: 1 + ((bytes[22] >> 6) | (bytes[23] << 2) | ((bytes[24] & 0x0f) << 10))
    };
  }
  if (codec === 'VP8 ') {
    if (chunkLength < 10) throw new Error(`${label} has an incomplete VP8 frame header.`);
    if (bytes[23] !== 0x9d || bytes[24] !== 0x01 || bytes[25] !== 0x2a) throw new Error(`${label} has an invalid VP8 frame header.`);
    return {
      width: (bytes[26] | (bytes[27] << 8)) & 0x3fff,
      height: (bytes[28] | (bytes[29] << 8)) & 0x3fff
    };
  }
  throw new Error(`${label} uses unsupported WebP codec ${codec}.`);
}

function assertValidation(validation, label) {
  const errors = Array.isArray(validation.errors) ? validation.errors : [];
  if (
    validation.ok !== true ||
    validation.format !== expectedAtlas.format ||
    validation.mode !== 'RGBA' ||
    validation.columns !== expectedAtlas.columns ||
    validation.rows !== expectedAtlas.rows ||
    validation.sprite_version_number !== expectedAtlas.spriteVersionNumber ||
    validation.width !== expectedAtlas.width ||
    validation.height !== expectedAtlas.height ||
    validation.transparent_rgb_residue_pixels !== 0 ||
    errors.length !== 0
  ) {
    throw new Error(`${label} does not prove a clean Hatch Pet v2 atlas.`);
  }
}

function assertDirectDirectory(directory, label) {
  assertNoLinkedExistingSegments(directory, label);
  fs.mkdirSync(directory, { recursive: true });
  assertNoLinkedExistingSegments(directory, label);
  const item = fs.lstatSync(directory);
  if (!item.isDirectory() || item.isSymbolicLink()) throw new Error(`${label} must be a direct directory: ${directory}`);
}

function writeNewOrIdentical(file, bytes, label) {
  if (fs.existsSync(file)) {
    const item = fs.lstatSync(file);
    if (!item.isFile() || item.isSymbolicLink()) throw new Error(`${label} is not a direct file: ${file}`);
    const existing = fs.readFileSync(file);
    if (!existing.equals(bytes)) throw new Error(`${label} already exists with different content; it was preserved: ${file}`);
    return 'already-present';
  }
  fs.writeFileSync(file, bytes, { flag: 'wx' });
  return 'created';
}

const prepared = pets.map(spec => {
  const runRoot = path.join(repositoryRoot, spec.run);
  const atlasPath = path.join(runRoot, ...spec.atlas.split('/'));
  const validationPath = path.join(runRoot, ...spec.validation.split('/'));
  const qaSummaryPath = path.join(runRoot, ...spec.qaSummary.split('/'));
  const atlasBytes = directFile(atlasPath, runRoot, `${spec.id} atlas`);
  const validationBytes = directFile(validationPath, runRoot, `${spec.id} validation`);
  const qaSummaryBytes = directFile(qaSummaryPath, runRoot, `${spec.id} QA summary`);
  const atlasSha256 = sha256(atlasBytes);
  const validationSha256 = sha256(validationBytes);
  const qaSummarySha256 = sha256(qaSummaryBytes);
  if (atlasSha256 !== spec.atlasSha256) {
    throw new Error(`${spec.id} approved atlas hash changed; expected ${spec.atlasSha256}, got ${atlasSha256}.`);
  }
  if (validationSha256 !== spec.validationSha256) {
    throw new Error(`${spec.id} approved validation hash changed; expected ${spec.validationSha256}, got ${validationSha256}.`);
  }
  if (qaSummarySha256 !== spec.qaSummarySha256) {
    throw new Error(`${spec.id} approved QA summary hash changed; expected ${spec.qaSummarySha256}, got ${qaSummarySha256}.`);
  }
  const validation = JSON.parse(validationBytes.toString('utf8'));
  const qaSummary = JSON.parse(qaSummaryBytes.toString('utf8'));
  assertValidation(validation, `${spec.id} validation`);
  if (
    qaSummary.ok !== true ||
    qaSummary.petId !== spec.id ||
    qaSummary.atlas?.sha256 !== spec.atlasSha256 ||
    qaSummary.validation?.sha256 !== spec.validationSha256 ||
    qaSummary.blindDirectionValidation?.ok !== true ||
    qaSummary.finalVisualReview?.ok !== true ||
    Array.isArray(qaSummary.blockingIssues) === false ||
    qaSummary.blockingIssues.length !== 0
  ) {
    throw new Error(`${spec.id} QA summary does not approve this exact atlas without blockers.`);
  }
  const dimensions = webpDimensions(atlasBytes, `${spec.id} atlas`);
  if (dimensions.width !== expectedAtlas.width || dimensions.height !== expectedAtlas.height) {
    throw new Error(`${spec.id} atlas is ${dimensions.width}x${dimensions.height}; expected 1536x2288.`);
  }

  const manifestBytes = jsonBytes({
    id: spec.id,
    displayName: spec.displayName,
    description: spec.description,
    spriteVersionNumber: 2,
    spritesheetPath: 'spritesheet.webp'
  });
  const proofBytes = jsonBytes({
    schemaVersion: 1,
    petId: spec.id,
    manifestSha256: sha256(manifestBytes),
    atlasSha256,
    validationSha256,
    qaSummarySha256,
    atlas: expectedAtlas,
    sourceRun: spec.run.replaceAll('\\', '/'),
    sourceAtlas: `${spec.run}/${spec.atlas}`.replaceAll('\\', '/'),
    sourceValidation: `${spec.run}/${spec.validation}`.replaceAll('\\', '/'),
    sourceQaSummary: `${spec.run}/${spec.qaSummary}`.replaceAll('\\', '/')
  });
  return { spec, atlasBytes, validationBytes, manifestBytes, proofBytes };
});

assertDirectDirectory(packageRoot, 'Native pet package root');
for (const item of prepared) {
  const destination = path.join(packageRoot, item.spec.id);
  assertDirectDirectory(destination, `Native pet package ${item.spec.id}`);
  const results = {
    manifest: writeNewOrIdentical(path.join(destination, 'pet.json'), item.manifestBytes, `${item.spec.id} manifest`),
    atlas: writeNewOrIdentical(path.join(destination, 'spritesheet.webp'), item.atlasBytes, `${item.spec.id} atlas`),
    validation: writeNewOrIdentical(path.join(destination, 'validation.json'), item.validationBytes, `${item.spec.id} validation`),
    proof: writeNewOrIdentical(path.join(destination, 'package-proof.json'), item.proofBytes, `${item.spec.id} package proof`)
  };
  console.log(`${item.spec.id}: ${JSON.stringify(results)} -> ${destination}`);
}

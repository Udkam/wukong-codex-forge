import fs from 'node:fs';
import path from 'node:path';

const petIdPattern = /^[a-z0-9][a-z0-9-]{2,63}$/;

const requireIdList = (value, label) => {
  if (!Array.isArray(value)) throw new Error(`${label} must be an array.`);
  const ids = value.map(id => {
    if (typeof id !== 'string' || !petIdPattern.test(id)) {
      throw new Error(`${label} contains an invalid Hatch Pet id: ${String(id)}`);
    }
    return id;
  });
  if (new Set(ids).size !== ids.length) throw new Error(`${label} contains duplicate ids.`);
  return Object.freeze(ids);
};

export function loadNativePetReleasePolicy(repositoryRoot) {
  const policyPath = path.join(path.resolve(repositoryRoot), 'pets', 'release-policy.json');
  const item = fs.lstatSync(policyPath);
  if (!item.isFile() || item.isSymbolicLink()) {
    throw new Error(`Native pet release policy must be a direct file: ${policyPath}`);
  }
  const policy = JSON.parse(fs.readFileSync(policyPath, 'utf8'));
  if (policy.schemaVersion !== 1) throw new Error('Native pet release policy schemaVersion must be 1.');
  const releasedPetIds = requireIdList(policy.releasedPetIds, 'releasedPetIds');
  const frozenPetIds = requireIdList(policy.frozenPetIds, 'frozenPetIds');
  for (const id of releasedPetIds) {
    if (frozenPetIds.includes(id)) throw new Error(`Native pet id cannot be both released and frozen: ${id}`);
  }
  if (typeof policy.approvalGate !== 'string' || !policy.approvalGate.trim()) {
    throw new Error('Native pet release policy approvalGate is required.');
  }
  return Object.freeze({
    policyPath,
    schemaVersion: 1,
    releasedPetIds,
    frozenPetIds,
    approvalGate: policy.approvalGate
  });
}

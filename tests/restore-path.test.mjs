import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('retained restore entry delegates to verified disable and cannot execute archived deletion', () => {
  const script = fs.readFileSync('scripts/restore.ps1', 'utf8');
  const livePrefix = script.slice(0, script.indexOf('<# Archived legacy implementation'));
  assert.match(livePrefix, /disable\.ps1/);
  assert.match(livePrefix, /Deletion is not performed/);
  assert.match(livePrefix, /\breturn\b/);
  assert.doesNotMatch(livePrefix, /\bRemove-Item\b|\bMove-Item\b|Stop-Process|taskkill/i);
});

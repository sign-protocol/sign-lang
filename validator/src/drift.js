'use strict';

// Source drift detection (RFC §1.7). Did a Layer-0 artifact move out from under the
// contract that governs it? For each anchored doc, if artifacts it governs changed in
// <since>..HEAD but the governing doc itself did not, that is drift — the contract may no
// longer describe its source. Runs with nothing but the open packages and a git checkout
// (no platform dependency); the platform layer turns these signals into review workflow.

const path = require('node:path');
const { execFileSync } = require('node:child_process');
const { listFiles, resolveAnchor } = require('./coverage');

// Files changed between <sinceRef> and HEAD, as repo-relative posix paths.
function changedFiles(repoRoot, sinceRef) {
  const out = execFileSync('git', ['-C', repoRoot, 'diff', '--name-only', sinceRef, 'HEAD'], {
    encoding: 'utf8',
  });
  return new Set(out.split('\n').map(s => s.trim()).filter(Boolean));
}

function toRepoRel(repoRoot, filePath) {
  return path.relative(repoRoot, path.resolve(filePath)).split(path.sep).join('/');
}

/**
 * Compute drift for a parsed corpus against a git ref.
 * docs: { doc, filePath }[]
 * Returns { driftSignals: {docId, changedArtifacts[], docChanged:false}[], checked }
 *   or { error } if git is unavailable / the ref is bad.
 */
function computeDrift(docs, repoRoot, sinceRef) {
  let changed;
  try {
    changed = changedFiles(repoRoot, sinceRef);
  } catch (err) {
    return { error: `git diff failed (need a git checkout and a valid ref): ${err.message}` };
  }

  const allFiles = listFiles(repoRoot);
  const driftSignals = [];
  let checked = 0;

  for (const { doc, filePath } of docs) {
    if (!doc.anchor || !doc.anchor.include.length) continue;
    checked++;

    const governed = resolveAnchor(doc.anchor, allFiles);
    const changedArtifacts = [...governed].filter(f => changed.has(f)).sort();
    if (changedArtifacts.length === 0) continue;

    const docChanged = changed.has(toRepoRel(repoRoot, filePath));
    if (!docChanged) {
      driftSignals.push({
        docId: doc.id || filePath,
        changedArtifacts,
        docChanged: false,
      });
    }
  }

  return { driftSignals, checked };
}

module.exports = { computeDrift, changedFiles };

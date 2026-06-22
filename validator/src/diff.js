'use strict';

// Breaking-change classification (RFC §1.6 / spec §9.2 made executable).
//
//   meaning-breaking   change to @def/@include/@exclude/@rules/@rel/@constraints/@infer  -> MAJOR
//   coverage-narrowing @anchor include removed, or exclude added that drops coverage      -> MINOR + DRIFT
//   additive           @anchor include widened, exclude removed; new optional content     -> MINOR/PATCH
//
// @anchor changes are never meaning-breaking. Narrowing is not meaning-breaking either, but
// silently un-governing an artifact is itself a governance failure, so it surfaces as a
// drift-signal even though the version bump is only MINOR.

const { parseFile } = require('./parse');
const { matchGlob, listFiles } = require('./coverage');

// Sigils whose content carries meaning per spec §9.2.
const MEANING_SIGILS = ['def', 'include', 'exclude', 'rules', 'rel', 'constraints', 'infer'];

// Split raw .sign text into a map of sigil -> concatenated normalized body. Repeatable
// sigils (infer, edges, …) accumulate in source order. Independent of the parser AST so it
// stays robust to content the structured parser does not retain.
function meaningSignature(raw) {
  const sig = {};
  const lines = (raw || '').split('\n');
  let current = null;
  for (const rawLine of lines) {
    const line = rawLine.trimEnd();
    if (line.startsWith('@')) {
      const sp = line.indexOf(' ');
      const name = sp === -1 ? line.slice(1) : line.slice(1, sp);
      current = MEANING_SIGILS.includes(name) ? name : null;
      if (current) sig[current] = (sig[current] || '') + line.trim() + '\n';
      continue;
    }
    if (line.trimStart().startsWith('#')) continue;   // comments do not change meaning
    if (current && line.trim()) sig[current] += line.trim() + '\n';
  }
  return sig;
}

function meaningChanged(beforeRaw, afterRaw) {
  const a = meaningSignature(beforeRaw);
  const b = meaningSignature(afterRaw);
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
  for (const k of keys) {
    if ((a[k] || '') !== (b[k] || '')) return true;
  }
  return false;
}

function anchorOf(raw) {
  const parsed = parseFile('<diff>', raw || '');
  const doc = parsed.documents[0];
  return doc ? doc.anchor : null;
}

/**
 * Classify the change between two versions of one document.
 * Returns { changeClass, droppedPatterns: string[] }.
 * Precedence: meaning-breaking > coverage-narrowing > additive.
 */
function classifyDocChange(beforeRaw, afterRaw) {
  if (meaningChanged(beforeRaw, afterRaw)) {
    return { changeClass: 'meaning-breaking', droppedPatterns: [] };
  }

  const before = anchorOf(beforeRaw);
  const after = anchorOf(afterRaw);
  const beforeInc = new Set(before ? before.include : []);
  const afterInc = new Set(after ? after.include : []);
  const beforeExc = new Set(before ? before.exclude : []);
  const afterExc = new Set(after ? after.exclude : []);

  // Include patterns removed → coverage lost.
  const droppedIncludes = [...beforeInc].filter(p => !afterInc.has(p));
  // Exclude patterns newly added → coverage carved out.
  const addedExcludes = [...afterExc].filter(p => !beforeExc.has(p));

  const droppedPatterns = [...droppedIncludes, ...addedExcludes];
  if (droppedPatterns.length) {
    return { changeClass: 'coverage-narrowing', droppedPatterns };
  }
  return { changeClass: 'additive', droppedPatterns: [] };
}

/**
 * Diff a corpus between two points in time.
 * beforeDocs / afterDocs: { id, raw }[]
 * repoRoot (optional): if given, dropped patterns are resolved to affected artifacts.
 * Returns { changes: {docId, changeClass}[], driftSignals: {docId, droppedPatterns, affectedArtifacts}[] }.
 */
function diffCorpus(beforeDocs, afterDocs, repoRoot = null) {
  const beforeById = new Map(beforeDocs.map(d => [d.id, d.raw]));
  const allFiles = repoRoot ? listFiles(repoRoot) : null;

  const changes = [];
  const driftSignals = [];

  for (const { id, raw } of afterDocs) {
    if (!beforeById.has(id)) {
      changes.push({ docId: id, changeClass: 'additive' });   // brand-new doc
      continue;
    }
    const { changeClass, droppedPatterns } = classifyDocChange(beforeById.get(id), raw);
    changes.push({ docId: id, changeClass });

    if (changeClass === 'coverage-narrowing') {
      const affectedArtifacts = allFiles
        ? allFiles.filter(f => droppedPatterns.some(p => matchGlob(p, f)))
        : [];
      driftSignals.push({ docId: id, droppedPatterns, affectedArtifacts });
    }
  }

  return { changes, driftSignals };
}

module.exports = {
  MEANING_SIGILS,
  meaningSignature,
  classifyDocChange,
  diffCorpus,
};

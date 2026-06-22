'use strict';

// Coverage resolution for @anchor (RFC §1.7). The parser treats anchor patterns as
// opaque strings; this is the *consumer* that gives them glob/path semantics against a
// real repository tree. Dependency-free by contract — the open packages add no deps.

const fs   = require('node:fs');
const path = require('node:path');

// ─── Glob → RegExp ────────────────────────────────────────────────────────────
// Supported tokens (POSIX-style, '/' separated):
//   **  matches any number of path segments (including none)
//   *   matches within a single segment (not '/')
//   ?   matches a single character (not '/')
// All other characters are matched literally.
function globToRegExp(glob) {
  let re = '';
  for (let i = 0; i < glob.length; i++) {
    const c = glob[i];
    if (c === '*' && glob[i + 1] === '*' && glob[i + 2] === '/') {
      // leading '**/' — zero or more leading path segments
      re += '(?:.*/)?';
      i += 2;
    } else if (c === '/' && glob[i + 1] === '*' && glob[i + 2] === '*') {
      // trailing '/**' — the slash and everything under it are optional, so 'a/**' matches 'a'
      re += '(?:/.*)?';
      i += 2;
    } else if (c === '*' && glob[i + 1] === '*') {
      re += '.*';
      i += 1;
    } else if (c === '*') {
      re += '[^/]*';
    } else if (c === '?') {
      re += '[^/]';
    } else if ('\\^$.|+()[]{}'.includes(c)) {
      re += '\\' + c;
    } else {
      re += c;
    }
  }
  return new RegExp('^' + re + '$');
}

// Does an opaque anchor pattern match a repo-relative posix path?
function matchGlob(pattern, relPath) {
  return globToRegExp(pattern).test(relPath);
}

// Literal leading prefix of a glob (everything before the first wildcard), used for the
// static exclude-intersection heuristic (ANCHOR003) where no filesystem is available.
function globLiteralPrefix(glob) {
  const wild = glob.search(/[*?]/);
  const head = wild === -1 ? glob : glob.slice(0, wild);
  // Trim back to the last complete path segment.
  const slash = head.lastIndexOf('/');
  return slash === -1 ? '' : head.slice(0, slash);
}

// Static check: could an exclude pattern remove anything an include pattern covers?
// Used by ANCHOR003 in the single-file pass (no repo root). Conservative — only flags an
// exclude as "outside" when its literal prefix provably cannot overlap any include's.
function excludeIntersectsIncludes(excludePattern, includePatterns) {
  // A leading wildcard exclude (e.g. **/*.test.ts) can match under any include — keep it.
  if (/^[*?]/.test(excludePattern)) return true;
  const exPrefix = globLiteralPrefix(excludePattern);
  for (const inc of includePatterns) {
    if (/^[*?]/.test(inc)) return true;
    const incPrefix = globLiteralPrefix(inc);
    if (exPrefix === incPrefix) return true;
    if (exPrefix.startsWith(incPrefix + '/') || exPrefix === incPrefix) return true;
    if (incPrefix.startsWith(exPrefix + '/')) return true;
  }
  return false;
}

// ─── Repository walk ────────────────────────────────────────────────────────────
const IGNORED_DIRS = new Set(['.git', 'node_modules', '.hg', '.svn']);

function listFiles(root) {
  const out = [];
  function walk(dir) {
    let entries;
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries) {
      if (entry.isDirectory()) {
        if (IGNORED_DIRS.has(entry.name)) continue;
        walk(path.join(dir, entry.name));
      } else if (entry.isFile()) {
        out.push(path.join(dir, entry.name));
      }
    }
  }
  walk(root);
  return out.map(p => path.relative(root, p).split(path.sep).join('/')).sort();
}

// Resolve the set of repo-relative files an anchor governs: union of include matches
// minus exclude matches.
function resolveAnchor(anchor, allFiles) {
  const included = new Set();
  for (const pat of anchor.include) {
    for (const f of allFiles) if (matchGlob(pat, f)) included.add(f);
  }
  if (anchor.exclude.length) {
    for (const f of [...included]) {
      if (anchor.exclude.some(pat => matchGlob(pat, f))) included.delete(f);
    }
  }
  return included;
}

// Collapse a set of ungoverned files into top-level prefixes for a readable report.
function summariseUngoverned(files) {
  const prefixes = new Set();
  for (const f of files) {
    const seg = f.indexOf('/');
    prefixes.add(seg === -1 ? f : f.slice(0, seg) + '/**');
  }
  return [...prefixes].sort();
}

/**
 * Compute repository coverage for a parsed corpus.
 * docs: { doc, filePath }[]  (doc carries doc.id and doc.anchor)
 * Returns { governed: number(0..1), ungoverned: string[], overlaps: {artifact, docs[]}[] }
 */
function computeCoverage(docs, repoRoot) {
  const allFiles = listFiles(repoRoot);
  const total = allFiles.length;

  const governedBy = new Map();   // file -> Set(docId)
  for (const { doc } of docs) {
    if (!doc.anchor || !doc.anchor.include.length) continue;
    const files = resolveAnchor(doc.anchor, allFiles);
    for (const f of files) {
      if (!governedBy.has(f)) governedBy.set(f, new Set());
      governedBy.get(f).add(doc.id || '(anonymous)');
    }
  }

  const governedCount = governedBy.size;
  const ungoverned = summariseUngoverned(allFiles.filter(f => !governedBy.has(f)));
  const overlaps = [];
  for (const [artifact, ids] of governedBy) {
    if (ids.size > 1) overlaps.push({ artifact, docs: [...ids].sort() });
  }
  overlaps.sort((a, b) => a.artifact.localeCompare(b.artifact));

  return {
    governed: total === 0 ? 0 : Number((governedCount / total).toFixed(4)),
    ungoverned,
    overlaps,
  };
}

module.exports = {
  globToRegExp,
  matchGlob,
  globLiteralPrefix,
  excludeIntersectsIncludes,
  listFiles,
  resolveAnchor,
  computeCoverage,
};

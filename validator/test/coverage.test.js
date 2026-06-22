'use strict';

const { test } = require('node:test');
const assert   = require('node:assert/strict');
const fs   = require('node:fs');
const os   = require('node:os');
const path = require('node:path');
const { parseFile } = require('../src/parse');
const { matchGlob, globLiteralPrefix, excludeIntersectsIncludes, computeCoverage } = require('../src/coverage');

// ── Glob matcher ────────────────────────────────────────────────────────────────

test('matchGlob: ** spans path segments and matches the bare prefix', () => {
  assert.ok(matchGlob('a/**', 'a/b/c.ts'));
  assert.ok(matchGlob('a/**', 'a'));
  assert.ok(!matchGlob('a/**', 'b/c.ts'));
});

test('matchGlob: * stays within a single segment', () => {
  assert.ok(matchGlob('src/*.ts', 'src/file.ts'));
  assert.ok(!matchGlob('src/*.ts', 'src/sub/file.ts'));
});

test('matchGlob: **/*.test.ts matches nested test files', () => {
  assert.ok(matchGlob('**/*.test.ts', 'src/a/b.test.ts'));
  assert.ok(matchGlob('**/*.test.ts', 'b.test.ts'));
  assert.ok(!matchGlob('**/*.test.ts', 'src/a/b.ts'));
});

test('globLiteralPrefix returns the leading literal segment', () => {
  assert.equal(globLiteralPrefix('services/billing-core/**'), 'services/billing-core');
  assert.equal(globLiteralPrefix('**/*.test.ts'), '');
});

test('excludeIntersectsIncludes is conservative about wildcards', () => {
  assert.ok(excludeIntersectsIncludes('**/*.test.ts', ['src/**']));   // leading wildcard — keep
  assert.ok(excludeIntersectsIncludes('src/a.ts', ['src/**']));       // inside coverage
  assert.ok(!excludeIntersectsIncludes('docs/readme.md', ['src/**'])); // outside coverage
});

// ── computeCoverage over a real temp tree ───────────────────────────────────────

function buildTree() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'sign-cov-'));
  const files = [
    'src/billing/a.ts',
    'src/billing/a.test.ts',
    'libs/money/m.ts',
    'tools/scratch/x.js',
  ];
  for (const rel of files) {
    const full = path.join(root, rel);
    fs.mkdirSync(path.dirname(full), { recursive: true });
    fs.writeFileSync(full, '// stub\n');
  }
  return root;
}

test('computeCoverage reports governed fraction, ungoverned prefixes, and overlaps', () => {
  const root = buildTree();
  try {
    const src = `@doc D [std, active, agents] v1
@anchor [repo:x]
  + src/billing/**
  + libs/money/**
  ! **/*.test.ts
@def x
  body
`;
    const { documents } = parseFile('d.sign', src);
    const docs = documents.map(doc => ({ doc, filePath: 'd.sign' }));
    const report = computeCoverage(docs, root);

    // 4 files; a.test.ts is excluded -> 2 governed of 4.
    assert.equal(report.governed, 0.5);
    assert.ok(report.ungoverned.includes('tools/**'));
    assert.deepEqual(report.overlaps, []);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('computeCoverage flags artifacts governed by two documents as overlaps', () => {
  const root = buildTree();
  try {
    const mk = (id) => parseFile(`${id}.sign`,
      `@doc ${id} [std, active, agents] v1\n@anchor\n  + src/billing/**\n@def x\n y\n`).documents[0];
    const docs = [{ doc: mk('A'), filePath: 'A.sign' }, { doc: mk('B'), filePath: 'B.sign' }];
    const report = computeCoverage(docs, root);
    assert.ok(report.overlaps.length >= 1);
    assert.ok(report.overlaps.every(o => o.docs.includes('A') && o.docs.includes('B')));
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

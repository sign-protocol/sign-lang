'use strict';

const { test } = require('node:test');
const assert   = require('node:assert/strict');
const { parseFile } = require('../src/parse');
const { runAllRules } = require('../src/rules');
const { summariseAnchor } = require('../src/compile');

function lint(name, src) {
  const { documents } = parseFile(name, src);
  return { doc: documents[0], ...runAllRules(documents.map(doc => ({ doc, filePath: name }))) };
}
function anchorMessages(res) {
  return [...res.errors, ...res.warnings].filter(m => /ANCHOR\d/.test(m));
}

// ── Parsing: block form ────────────────────────────────────────────────────────

test('parses block-form @anchor with property bag, includes, and excludes', () => {
  const src = `@doc D [std, active, agents] v1
@anchor [repo:platform, vcs:git]
  + services/billing-core/**
  + libs/money/**
  ! **/*.test.ts
@def x
  body
`;
  const { documents, parseErrors } = parseFile('a.sign', src);
  assert.deepEqual(parseErrors, []);
  const a = documents[0].anchor;
  assert.deepEqual(a.source, { repo: 'platform', vcs: 'git' });
  assert.deepEqual(a.include, ['services/billing-core/**', 'libs/money/**']);
  assert.deepEqual(a.exclude, ['**/*.test.ts']);
  assert.equal(a.compact, false);
});

test('parses compact-form @anchor', () => {
  const src = `@doc D [std, active, agents] v1\n@anchor a/**, b/**\n`;
  const { documents } = parseFile('a.sign', src);
  const a = documents[0].anchor;
  assert.deepEqual(a.include, ['a/**', 'b/**']);
  assert.deepEqual(a.exclude, []);
  assert.equal(a.compact, true);
});

test('records source prefixes from @xwalk for ANCHOR005', () => {
  const src = `@doc D [std, active, agents] v1
@anchor [okf:bundle]
  + concepts/**
@xwalk
  okf:concepts/x.md => std:x [method:okf-import, type:asserted]
`;
  const { documents } = parseFile('a.sign', src);
  assert.ok(documents[0].xwalkSources.includes('okf'));
});

test('two @anchor blocks is a parse error (singular)', () => {
  const src = `@doc D [std, active, agents] v1\n@anchor\n  + a/**\n@anchor\n  + b/**\n`;
  const { parseErrors } = parseFile('a.sign', src);
  assert.ok(parseErrors.some(e => /anchor must be singular/.test(e)));
});

// ── Lint rules ANCHOR001–ANCHOR005 ───────────────────────────────────────────────

test('ANCHOR001 — @anchor with no + patterns is an error', () => {
  const res = lint('a.sign', `@doc D [std, active, agents] v1\n@anchor [repo:x]\n  ! a/**\n@def x\n y\n`);
  assert.ok(res.errors.some(e => /ANCHOR001/.test(e)));
});

test('ANCHOR002 — same pattern in two documents warns (corpus pass)', () => {
  const a = parseFile('o1.sign', `@doc A [std, active, agents] v1\n@anchor\n  + shared/**\n@def x\n y\n`).documents[0];
  const b = parseFile('o2.sign', `@doc B [std, active, agents] v1\n@anchor\n  + shared/**\n@def x\n y\n`).documents[0];
  const res = runAllRules([{ doc: a, filePath: 'o1.sign' }, { doc: b, filePath: 'o2.sign' }]);
  assert.ok(res.warnings.some(w => /ANCHOR002/.test(w) && /shared\/\*\*/.test(w)));
});

test('ANCHOR003 — exclude outside the include set warns', () => {
  const res = lint('a.sign', `@doc D [std, active, agents] v1\n@anchor\n  + src/**\n  ! docs/readme.md\n@def x\n y\n`);
  assert.ok(res.warnings.some(w => /ANCHOR003/.test(w)));
});

test('ANCHOR003 — a leading-wildcard exclude inside coverage does NOT warn', () => {
  const res = lint('a.sign', `@doc D [std, active, agents] v1\n@anchor\n  + src/**\n  ! **/*.test.ts\n@def x\n y\n`);
  assert.ok(!res.warnings.some(w => /ANCHOR003/.test(w)));
});

test('ANCHOR004 — compact form authored in a full doc is an error', () => {
  const res = lint('a.sign', `@doc D [std, active, agents] v1\n@anchor a/**, b/**\n@def x\n y\n`);
  assert.ok(res.errors.some(e => /ANCHOR004/.test(e)));
});

test('ANCHOR005 — okf source without a matching @xwalk warns', () => {
  const res = lint('a.sign', `@doc D [std, active, agents] v1\n@anchor [okf:bundle, src:fin]\n  + concepts/**\n@def x\n y\n`);
  assert.ok(res.warnings.some(w => /ANCHOR005/.test(w)));
});

test('ANCHOR005 — okf source WITH a matching @xwalk does not warn', () => {
  const res = lint('a.sign', `@doc D [std, active, agents] v1
@anchor [okf:bundle]
  + concepts/**
@xwalk
  okf:concepts/x.md => std:x [method:okf-import, type:asserted]
`);
  assert.ok(!res.warnings.some(w => /ANCHOR005/.test(w)));
});

test('a well-formed anchored document raises no ANCHOR findings', () => {
  const res = lint('ok.sign', `@doc D [std, active, agents] v1
@anchor [repo:platform, vcs:git]
  + src/**
  ! **/*.test.ts
@def x
  body
`);
  assert.deepEqual(anchorMessages(res), []);
});

// ── Layer-1 summarisation ─────────────────────────────────────────────────────

test('summariseAnchor lists includes verbatim under the cap', () => {
  const anchor = { include: ['services/billing-core/**', 'libs/money/**'], exclude: ['**/*.test.ts'] };
  assert.equal(summariseAnchor(anchor), 'services/billing-core/**, libs/money/**');
});

test('summariseAnchor caps at INDEX_ANCHOR_MAX with (+N) overflow', () => {
  const anchor = { include: ['a/**', 'b/**', 'c/**', 'd/**', 'e/**', 'f/**'], exclude: [] };
  assert.equal(summariseAnchor(anchor), 'a/**, b/**, c/**, d/** (+2)');
});

'use strict';

const { test } = require('node:test');
const assert   = require('node:assert/strict');
const path     = require('node:path');
const { parseFile } = require('../src/parse');

const FIXTURES = path.join(__dirname, 'fixtures');
const EXAMPLES = path.join(__dirname, '../../examples');
const fs = require('node:fs');

function fixture(name) {
  return fs.readFileSync(path.join(FIXTURES, name), 'utf8');
}

function example(name) {
  return fs.readFileSync(path.join(EXAMPLES, name), 'utf8');
}

// ── @doc header parsing ───────────────────────────────────────────────────────

test('parses @doc header fields', () => {
  const content = `@doc WFI-008 [std, active, agents+employees] v2 sha:7d4a1f\n## A summary line\n`;
  const { documents } = parseFile('test.sign', content);
  assert.equal(documents.length, 1);
  const doc = documents[0];
  assert.equal(doc.id,        'WFI-008');
  assert.equal(doc.type,      'std');
  assert.equal(doc.status,    'active');
  assert.equal(doc.audiences, 'agents+employees');
  assert.equal(doc.version,   'v2');
  assert.equal(doc.sha,       '7d4a1f');
  assert.equal(doc.summaryLine, 'A summary line');
});

test('parses @links', () => {
  const content = `@doc WFI-001 [ref, active, agents] v1\n@links WFI-002,WFI-003,WFI-004\n`;
  const { documents } = parseFile('test.sign', content);
  assert.deepEqual(documents[0].links, ['WFI-002', 'WFI-003', 'WFI-004']);
});

// ── Multiple documents in one file (index format) ─────────────────────────────

test('parses multiple @doc entries from index file', () => {
  const content = example('01-canon-index.sign');
  const { documents } = parseFile('01-canon-index.sign', content);
  assert.equal(documents.length, 9, 'canon index has 9 documents');
  assert.equal(documents[0].id, 'WFI-001');
  assert.equal(documents[8].id, 'WFI-009');
});

test('parses inactive doc status from index', () => {
  const content = example('01-canon-index.sign');
  const { documents } = parseFile('01-canon-index.sign', content);
  const wfi005 = documents.find(d => d.id === 'WFI-005');
  assert.ok(wfi005, 'WFI-005 should be found');
  assert.equal(wfi005.status, 'inactive');
});

// ── @vocab parsing ────────────────────────────────────────────────────────────

test('parses @vocab predicates from full document', () => {
  const content = example('02-full-document.sign');
  const { documents } = parseFile('02-full-document.sign', content);
  assert.equal(documents.length, 1);
  const vocab = documents[0].vocab;
  assert.ok(vocab.includes('depends_on'),    'depends_on in vocab');
  assert.ok(vocab.includes('adjacent_to'),   'adjacent_to in vocab');
  assert.ok(vocab.includes('progression_to'),'progression_to in vocab');
});

// ── @rel parsing ──────────────────────────────────────────────────────────────

test('parses @rel declarations with directions', () => {
  const content = example('02-full-document.sign');
  const { documents } = parseFile('02-full-document.sign', content);
  const rels = documents[0].relDeclarations;
  assert.ok(rels.some(r => r.predicate === 'depends_on'    && r.direction === '->'));
  assert.ok(rels.some(r => r.predicate === 'adjacent_to'   && r.direction === '<=>'));
  assert.ok(rels.some(r => r.predicate === 'progression_to'&& r.direction === '->'));
  assert.ok(rels.some(r => r.predicate === 'requires'      && r.direction === '<-'));
});

// ── @infer parsing ────────────────────────────────────────────────────────────

test('parses @infer rules and their fields', () => {
  const content = example('04-inference-rules.sign');
  const { documents } = parseFile('04-inference-rules.sign', content);
  const doc = documents[0];
  assert.ok(doc.infers.length >= 3, 'at least 3 @infer rules');

  const eroding = doc.infers.find(i => i.id === 'skill-trajectory-eroding');
  assert.ok(eroding, 'skill-trajectory-eroding found');
  assert.ok(eroding.when);
  assert.ok(eroding.then);
  assert.ok(eroding.confidence);
  assert.ok(eroding.src);
});

// ── @cluster parsing ──────────────────────────────────────────────────────────

test('parses @cluster declarations', () => {
  const content = example('03-clusters.sign');
  const { documents } = parseFile('03-clusters.sign', content);
  const doc = documents[0];
  assert.ok(doc.clusters.length >= 4, 'at least 4 clusters');
  const cap = doc.clusters.find(c => c.id === 'capability:workforce-intelligence');
  assert.ok(cap, 'capability cluster found');
  assert.equal(cap.type, 'capability');
});

// ── @edges parsing ────────────────────────────────────────────────────────────

test('parses edge predicates from @edges block', () => {
  const content = example('05-crosswalk-provenance.sign');
  const { documents } = parseFile('05-crosswalk-provenance.sign', content);
  const doc = documents[0];
  assert.ok(doc.edgeUsages.length >= 3, 'at least 3 edges');
  assert.ok(doc.edgeUsages.some(e => e.predicate === 'depends_on'));
  assert.ok(doc.edgeUsages.some(e => e.predicate === 'adjacent_to'));
});

// ── Block order tracking ──────────────────────────────────────────────────────

test('records block sequence for full document', () => {
  const content = example('02-full-document.sign');
  const { documents } = parseFile('02-full-document.sign', content);
  const sigils = documents[0].blockSequence.map(b => b.sigil);
  assert.ok(sigils.indexOf('vocab') < sigils.indexOf('rel'),  '@vocab before @rel');
  assert.ok(sigils.indexOf('rel')   < sigils.indexOf('attrs'),'@rel before @attrs');
});

// ── Parse errors ──────────────────────────────────────────────────────────────

test('reports parse error for malformed @doc header', () => {
  const content = `@doc [broken header]\n`;
  const { parseErrors } = parseFile('bad.sign', content);
  assert.ok(parseErrors.length > 0, 'should have parse error');
});

// ── Incomplete @infer fixture ─────────────────────────────────────────────────

test('detects missing infer fields in fixture', () => {
  const content = fixture('invalid-infer.sign');
  const { documents } = parseFile('invalid-infer.sign', content);
  const infer = documents[0].infers[0];
  assert.ok(infer, 'infer rule found');
  assert.ok(infer.when,        'when: present');
  assert.ok(!infer.then,       'then: missing');
  assert.ok(!infer.confidence, 'confidence: missing');
  assert.ok(!infer.src,        'src: missing');
});

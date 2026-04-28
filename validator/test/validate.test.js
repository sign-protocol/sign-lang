'use strict';

const { test } = require('node:test');
const assert   = require('node:assert/strict');
const path     = require('node:path');
const { parseFile }  = require('../src/parse');
const { runAllRules, checkBlockOrder, checkVocabCompleteness, checkInferCompleteness } = require('../src/rules');
const { validate }   = require('../src/validate');
const fs = require('node:fs');

const FIXTURES = path.join(__dirname, 'fixtures');
const EXAMPLES = path.join(__dirname, '../../examples');

function fixtureDoc(name) {
  const content = fs.readFileSync(path.join(FIXTURES, name), 'utf8');
  const { documents } = parseFile(name, content);
  return { doc: documents[0], filePath: name };
}

// ── Block order rule ──────────────────────────────────────────────────────────

test('checkBlockOrder passes for correct order', () => {
  const content = fs.readFileSync(path.join(EXAMPLES, '02-full-document.sign'), 'utf8');
  const { documents } = parseFile('02-full-document.sign', content);
  const { errors } = checkBlockOrder(documents[0], '02-full-document.sign');
  assert.equal(errors.length, 0, `unexpected errors: ${errors.join('; ')}`);
});

test('checkBlockOrder fails when @rel appears before @vocab', () => {
  const { doc, filePath } = fixtureDoc('invalid-block-order.sign');
  const { errors } = checkBlockOrder(doc, filePath);
  assert.ok(errors.length > 0, 'expected a block order error');
  assert.ok(errors[0].includes('block order violation'), errors[0]);
});

// ── Vocab completeness rule ───────────────────────────────────────────────────

test('checkVocabCompleteness passes when all predicates declared', () => {
  const content = fs.readFileSync(path.join(EXAMPLES, '02-full-document.sign'), 'utf8');
  const { documents } = parseFile('02-full-document.sign', content);
  const { errors } = checkVocabCompleteness(documents[0], '02-full-document.sign');
  assert.equal(errors.length, 0, `unexpected errors: ${errors.join('; ')}`);
});

test('checkVocabCompleteness fails when predicate not in @vocab', () => {
  const { doc, filePath } = fixtureDoc('invalid-vocab.sign');
  const { errors } = checkVocabCompleteness(doc, filePath);
  assert.ok(errors.length > 0, 'expected vocab error');
  assert.ok(errors.some(e => e.includes('adjacent_to')), `expected adjacent_to error, got: ${errors.join('; ')}`);
});

// ── Infer completeness rule ───────────────────────────────────────────────────

test('checkInferCompleteness passes for complete @infer rules', () => {
  const content = fs.readFileSync(path.join(EXAMPLES, '04-inference-rules.sign'), 'utf8');
  const { documents } = parseFile('04-inference-rules.sign', content);
  const { errors } = checkInferCompleteness(documents[0], '04-inference-rules.sign');
  assert.equal(errors.length, 0, `unexpected errors: ${errors.join('; ')}`);
});

test('checkInferCompleteness fails for incomplete @infer rule', () => {
  const { doc, filePath } = fixtureDoc('invalid-infer.sign');
  const { errors } = checkInferCompleteness(doc, filePath);
  assert.ok(errors.length > 0, 'expected infer completeness error');
  assert.ok(errors[0].includes('incomplete-rule'), errors[0]);
  assert.ok(errors[0].includes('then:'), 'missing then: should be reported');
});

// ── validate() integration ────────────────────────────────────────────────────

test('validate passes for examples directory', async () => {
  const result = await validate(EXAMPLES);
  // Examples are illustrative fragments — they may not all have @doc headers.
  // We just assert validate() runs without throwing and reports a result.
  assert.ok(typeof result.ok === 'boolean', 'result.ok is boolean');
  assert.ok(Array.isArray(result.errors),   'result.errors is array');
  assert.ok(Array.isArray(result.warnings), 'result.warnings is array');
});

test('validate fails for fixture with block order violation', async () => {
  const result = await validate(path.join(FIXTURES, 'invalid-block-order.sign'));
  assert.ok(!result.ok, 'should fail');
  assert.ok(result.errors.some(e => e.includes('block order')), `expected block order error, got: ${result.errors.join('; ')}`);
});

test('validate fails for fixture with missing infer fields', async () => {
  const result = await validate(path.join(FIXTURES, 'invalid-infer.sign'));
  assert.ok(!result.ok, 'should fail');
  assert.ok(result.errors.some(e => e.includes('incomplete-rule')), `expected infer error, got: ${result.errors.join('; ')}`);
});

test('validate fails for fixture with undeclared vocab predicate', async () => {
  const result = await validate(path.join(FIXTURES, 'invalid-vocab.sign'));
  assert.ok(!result.ok, 'should fail');
  assert.ok(result.errors.some(e => e.includes('adjacent_to')), `expected vocab error, got: ${result.errors.join('; ')}`);
});

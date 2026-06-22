'use strict';

const { test } = require('node:test');
const assert   = require('node:assert/strict');
const { classifyDocChange, diffCorpus } = require('../src/diff');

const base = `@doc D [std, active, agents] v1
@anchor [repo:x]
  + a/**
  + b/**
@def thing
  the definition
`;

test('widening the include set is additive', () => {
  const after = base.replace('  + b/**\n', '  + b/**\n  + c/**\n');
  assert.equal(classifyDocChange(base, after).changeClass, 'additive');
});

test('removing an include is coverage-narrowing with dropped patterns', () => {
  const after = base.replace('  + b/**\n', '');
  const r = classifyDocChange(base, after);
  assert.equal(r.changeClass, 'coverage-narrowing');
  assert.deepEqual(r.droppedPatterns, ['b/**']);
});

test('adding an exclude is coverage-narrowing', () => {
  const after = base.replace('  + b/**\n', '  + b/**\n  ! b/internal/**\n');
  const r = classifyDocChange(base, after);
  assert.equal(r.changeClass, 'coverage-narrowing');
  assert.deepEqual(r.droppedPatterns, ['b/internal/**']);
});

test('changing @def is meaning-breaking and outranks anchor changes', () => {
  const after = base.replace('  the definition\n', '  a different definition\n').replace('  + b/**\n', '');
  assert.equal(classifyDocChange(base, after).changeClass, 'meaning-breaking');
});

test('a comment-only change is not meaning-breaking', () => {
  const after = base.replace('  the definition\n', '  the definition\n  # an added comment\n');
  assert.equal(classifyDocChange(base, after).changeClass, 'additive');
});

test('diffCorpus aggregates drift signals for narrowing', () => {
  const before = [{ id: 'D', raw: base }];
  const after  = [{ id: 'D', raw: base.replace('  + b/**\n', '') }];
  const { changes, driftSignals } = diffCorpus(before, after);
  assert.equal(changes[0].changeClass, 'coverage-narrowing');
  assert.equal(driftSignals.length, 1);
  assert.equal(driftSignals[0].docId, 'D');
  assert.deepEqual(driftSignals[0].droppedPatterns, ['b/**']);
});

test('a brand-new doc is additive', () => {
  const { changes } = diffCorpus([], [{ id: 'NEW', raw: base }]);
  assert.equal(changes[0].changeClass, 'additive');
});

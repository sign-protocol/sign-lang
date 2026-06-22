'use strict';

const { test } = require('node:test');
const assert   = require('node:assert/strict');
const { summariseAnchor, INDEX_ANCHOR_MAX } = require('../src/compile');

// Rough token estimate consistent with the index budget rule (chars / 4).
const tokens = (s) => Math.ceil(s.length / 4);

// RFC §5: the Layer-1 anchor summary must stay under a per-entry token ceiling, no matter
// how many include patterns the authoritative Layer-2 anchor carries — the cap + (+N)
// overflow is what keeps the always-injected index bounded as a corpus scales.
const PER_ENTRY_CEILING = 50;

test('anchor summary stays bounded (cap + overflow) across a 200-doc corpus', () => {
  for (let d = 0; d < 200; d++) {
    // A doc with far more includes than the cap — overflow must keep it bounded.
    const include = [];
    for (let i = 0; i < 12; i++) include.push(`services/area-${d}-${i}/sub/module/**`);
    const summary = summariseAnchor({ include, exclude: [] });
    const full = include.join(', ');

    assert.ok(summary.includes(`(+${include.length - INDEX_ANCHOR_MAX})`), 'overflow marker present');
    assert.ok(summary.length < full.length, 'capped summary is shorter than listing every include');
    assert.ok(
      tokens(`@anchor ${summary}`) <= PER_ENTRY_CEILING,
      `doc ${d}: anchor summary ~${tokens(`@anchor ${summary}`)} tokens exceeds ${PER_ENTRY_CEILING}`
    );
  }
});

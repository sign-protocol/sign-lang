# Proposal: `@sources` and `@currency` blocks

**Status: accepted 2026-08-16** (sponsor decision; motivated by the CareerHighways canon
legal corpus, the largest SIGN deployment).

## Problem

Two kinds of content have no legal home in the v1.0 block set, and the largest corpus is
routing them through workarounds that lose structure:

1. **Citations.** 158 legal documents cite external authority (statutes, regulations, agency
   guidance). The interim home is `@props + source | …`, which caps values at ~200 characters,
   fits `authority / pin-cite / URL` triples badly, and makes citation extraction
   non-deterministic. For legal content, citations are load-bearing: an agent that cannot
   enumerate a document's authorities cannot support a verify-before-use posture.

2. **Research currency.** Regulatory content goes stale on external schedules. The corpus's
   state-law batch invented a `@currency` convention (`research-pulled` / `volatility` /
   `verify-before-use`) that had to be smuggled into `@status` because the block set is closed.
   Volatility is also the natural driver for per-document review cadence, which v1.0 cannot
   express (cadence derives from `doc_type` only).

## Change (normative, v1.1)

Two new full-document blocks, ordered after `@status` and before `@reserved`:

```
@currency
  # research currency and verification posture
  research-pulled: {ISO date}
  volatility: {high | medium | low}
  verify-before-use: {yes | no}

@sources
  # authoritative citations, one per line
  {authority} | {citation} | {url}
```

- `@currency` takes `key: value` lines (same line grammar as `@status`). The three keys above
  are the governed vocabulary; consumers may define bands over `volatility` (e.g. review
  cadence ceilings).
- `@sources` takes pipe-separated rows: authority (issuer), citation (pin cite), url. The
  third field is optional.
- Neither block appears in the Layer-1 index entry.
- Both are optional for every document type.

## Compatibility

Additive: no existing document changes meaning, no existing parser output changes for corpora
that do not use the blocks. Parsers older than v1.1 treat the new sigils per §10.2
forward-compatibility (unknown sigils warn, content preserved).

## Migration (consumer-side, out of scope here)

The CareerHighways corpus migrates `@props + source | …` rows to `@sources` and
`@currency`-shaped `@status` rows to `@currency` in a staged content pass after its toolchain
adopts v1.1.

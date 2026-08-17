# Proposal: `::` group labels in list blocks

**Status: accepted 2026-08-16** (sponsor decision; ships in v1.1 alongside
`@sources`/`@currency`).

## Problem

Authors group entries inside `@vocab`, `@attrs`, `@include`, and `@exclude` — the largest
corpus carries ~82 such labels (`# Employee`, `# Eligibility & enrollment`) — but the only
available line form is `#`, which §2.6 defines as *ignored by the parser*. Real structure is
invisible to every agent. `@edges` has a workaround (a `group:` bag property); the four list
blocks have none.

## Change (normative, v1.1)

A line beginning `::` inside `@vocab`, `@attrs`, `@include`, or `@exclude` is a **group
label**: parsed structure naming the entries that follow it, until the next `::` line or the
end of the block.

```
@vocab
  :: Binding strength
  extends  | a content overlay specializes a base
  applies  | a contract overlay instantiates a base
  :: Citation without inheritance
  references | points at canon it depends on
```

- A group label is content, not a comment — agents may see it.
- Groups do not nest.
- `@edges` continues to group via the `group:` bag property; `::` is not legal there.

## Compatibility

Additive. Pre-v1.1 parsers treat `::` lines as unrecognized block content (preserved,
ignored) per §10.2. Existing `#` labels remain comments; converting them to `::` is a
deliberate per-corpus migration, not an automatic reinterpretation.

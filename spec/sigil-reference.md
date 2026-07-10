# SIGN Sigil Quick Reference — v1.0

| Sigil | Layer | Purpose |
|---|---|---|
| `@canon` | Bundle | Version + SHA header |
| `@doc` | Both | Document identity, type, status, audiences |
| `## {summary}` | Index | Agent summary line — one per `@doc` |
| `@links` | Both | Related document edges |
| `@anchor` | Both | Source-artifact coverage binding — repository globs / OKF paths this document governs |
| `@cycle` | Full | Review cadence |
| `@reviewed` | Full | Last reviewed date |
| `@vocab` | Full | Governed relationship-type predicates and/or closed controlled value vocabularies (`name \| meaning`) |
| `@def` | Full | Primary canonical definition |
| `@props` | Full | Named core properties |
| `@include` | Full | Inclusion criteria |
| `@exclude` | Full | Exclusion criteria |
| `@rules` | Full | Numbered operational rules |
| `@boundary` | Full | Identity and scope boundary |
| `@constraints` | Full | Structural rules agents must enforce |
| `@cluster` | Full | Named typed skill set with threshold semantics |
| `@infer` | Full | Governed inference rule |
| `@rel` | Full | Schema-level relationship declarations |
| `@edges` | Full | Instance-level graph edges |
| `@xwalk` | Full | Crosswalk identity resolution mappings |
| `@attrs` | Full | Attribute declarations |
| `@disallowed` | Full | Prohibited patterns |
| `@phases` | Full | Phase plan |
| `@status` | Full | Current-state snapshot |
| `@reserved` | Full | Forward roadmap sigil declarations |
| `->` | Full | Outbound directed edge |
| `<-` | Full | Inbound directed edge |
| `<=>` | Full | Symmetric bidirectional edge |
| `=>` | Full | Crosswalk resolution mapping |
| `+` | Full | Cluster member / property entry |
| `?` | Full | Inclusion criterion |
| `!` | Full | Exclusion / disallowed entry |
| `[...]` | Full | Property bag |
| `\|` | Full | Name/description separator |
| `#` | Full | Comment — ignored by parser |

## Block Order (enforced by build pipeline)

```
@doc → @links → @anchor → @cycle → @reviewed → @vocab → @def → @props → @include → @exclude
→ @rules → @boundary → @constraints → @cluster → @infer → @rel → @edges → @xwalk
→ @attrs (required) → @attrs (optional) → @disallowed → @phases → @status → @reserved
```

## `@anchor` Property-Bag Keys

Reserved keys (validated by lint, not grammar): `repo` · `vcs` · `okf` · `src`. Patterns are
opaque strings — glob / path / OKF-concept-path semantics are resolved by the consumer (CLI or
platform), not the grammar. `+` adds a coverage pattern, `!` excludes one.

## Document Types

`ref` · `std` · `pol` · `adr` · `pln` · `gls`

## Status Tokens

`active` · `inactive` · `draft` · `deprecated` · `imported`

`imported` marks a machine-imported skeleton (e.g. from an OKF bundle) that is **not yet
authoritative**. Like `draft`, it is excluded from the published Layer-1 index; an approver
lands it via the authoring tool, which bumps a real version.

## Phase Tokens

`[done]` · `[next]` · `[later]`

## Cluster Types

`capability` · `cooccurrence` · `transition` · `ai-impact`

## Threshold Rules

`all` · `any` · `{n}-of-{m}`

## Namespace Prefixes

An identifier may carry a `prefix:` namespace declaring its identity space (e.g. `skill:workforce-planning`).
Prefixes are **opaque to the grammar** and **validated by lint, not grammar** — the set of valid prefixes
is registered by the **consuming implementation**, not by this notation. SIGN reserves no namespaces of
its own. Unknown prefixes are preserved and warned on, never dropped (forward compatibility). Prefix
values may themselves be namespaced (`cluster:capability:workforce-intelligence`).

Prefixes appearing in examples throughout this reference are **illustrative**, drawn from a
workforce-ontology consumer; they are not part of the notation.

## `@xwalk` Crosswalk Conventions

`@xwalk` maps an external/legacy identifier to a canonical id: `source => target [method, conf, type]`.
Reserved source prefix and method for machine import (no grammar change):

- `okf:` — the source identifier is an OKF concept path, e.g. `okf:concepts/metrics/mrr.md`.
- `method:okf-import` — distinguishes machine import from `exact` / `mapped` / `alias`.

```
@xwalk
  okf:concepts/metrics/mrr.md => metric:monthly-recurring-revenue [method:okf-import, type:asserted]
```

`ANCHOR005` enforces that an `okf:`-sourced `@anchor` records a matching `@xwalk okf:` line.
`prov:` ids are provisional, import-time identities (`prov:<bundle>.<slug>`); an approver rebinds
them to a canonical namespace when landing the doc.

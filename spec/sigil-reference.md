# SIGN Sigil Quick Reference — v1.0

| Sigil | Layer | Purpose |
|---|---|---|
| `@canon` | Bundle | Version + SHA header |
| `@doc` | Both | Document identity, type, status, audiences |
| `## {summary}` | Index | Agent summary line — one per `@doc` |
| `@links` | Both | Related document edges |
| `@cycle` | Full | Review cadence |
| `@reviewed` | Full | Last reviewed date |
| `@vocab` | Full | Governed relationship type definitions |
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
@doc → @links → @cycle → @reviewed → @vocab → @def → @props → @include → @exclude
→ @rules → @boundary → @constraints → @cluster → @infer → @rel → @edges → @xwalk
→ @attrs (required) → @attrs (optional) → @disallowed → @phases → @status → @reserved
```

## Document Types

`ref` · `std` · `pol` · `adr` · `pln` · `gls`

## Status Tokens

`active` · `inactive` · `draft` · `deprecated`

## Phase Tokens

`[done]` · `[next]` · `[later]`

## Cluster Types

`capability` · `cooccurrence` · `transition` · `ai-impact`

## Threshold Rules

`all` · `any` · `{n}-of-{m}`

## Namespace Prefixes

`skill:` · `role:` · `cluster:` · `legacy:` · `onet:` · `esco:` · `customer:` · `doc:`

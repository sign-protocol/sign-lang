# SIGN Specification v1.0 — Skill Reference

Authoritative sigil vocabulary, syntax rules, operators, and governance model
for use by the sign-draft skill. Sourced from SIGN whitepaper v1.0.

> **Canonical source.** This file is the single source of truth for the `sign-draft`
> skill reference. The copy at
> `sign-tools/packages/sign-draft/.claude/skills/sign-draft/references/sign-spec.md`
> is synced from here — edit this file, then run `npm run sync` in the sign-draft package.
> Do not edit the synced copy directly.

---

## Document Structure Sigils

| Sigil | Purpose |
|---|---|
| `@canon` | Bundle header — version and SHA-256 integrity hash of the compiled artifact |
| `@doc` | Document identity — type token, status, audience scope, related-document edges |
| `##` | Agent summary line — one per document in the always-injected index layer |
| `@links` | Related document graph edges — builds the navigable knowledge graph |

### `@doc` syntax

```
@doc  <ID> [<type>, <status>, <audience>] v<N> sha:<hash>
```

Type tokens: `std` | `pol` | `ref` | `proc` | `xwalk`
Status tokens: `active` | `draft` | `deprecated` | `review-pending`
Audience tokens: `agents` | `employees` | `agents+employees`

---

## Content Sigils

| Sigil | Prefix | Purpose |
|---|---|---|
| `@def` | — | Primary canonical definition of the subject concept |
| `@props` | `+` | Named core properties |
| `@include` | `?` | Positive inclusion criteria |
| `@exclude` | `!` | Negative exclusion criteria |
| `@rules` | numbered | Operational or classification rules |
| `@boundary` | — | Identity and scope boundary — prevents semantic overlap |

### `@def` — write as continuous prose, not bullets. One primary definition.

### `@props` syntax

```
@props
  + property-name  │ value or description
```

### `@include` / `@exclude` syntax

```
@include
  ? single bounded unit with a clear definition and scope
  ? demonstrable through execution, behavior, or outcomes

@exclude
  ! a broad bundle comprising multiple distinct units
  ! a process step, workflow state, or outcome
```

### `@rules` syntax

```
@rules
  1. Rule text as a complete, imperative sentence
  2. Each rule independently actionable by an agent
```

---

## Governance Sigils

| Sigil | Purpose |
|---|---|
| `@constraints` | Structural rules agents must enforce — mutex, requires, forbids |
| `@infer` | Governed inference rules — derive new facts from existing knowledge |
| `@cluster` | Named typed sets with threshold semantics |
| `@attrs` | Required and optional attribute declarations with type information |

### `@constraints` syntax

```
@constraints
  <constraint-name>
    mutex:   <condition-A> AND <condition-B>
    requires: <fact> IS PRESENT when <condition>
    forbids:  <action or state>
    enforced-by: <system or layer name>
```

`mutex` — two conditions that cannot both be true simultaneously.
`requires` — a fact that must be present when a condition holds.
`forbids` — an action or state that is unconditionally prohibited.

Constraints are hard limits. Violating a constraint is a governance failure,
not a judgment call.

### `@infer` syntax

```
@infer <rule-name>
  applies-to: <entity type>
  when:  <condition>
  and:   <additional condition>
  then:  <derived fact> = <value>
  and:   <additional derived fact>
  confidence: derived | estimated | asserted
  src:   <rule-source-identifier>
```

`confidence: derived` — computed from rules with high certainty
`confidence: estimated` — computed with uncertainty
`confidence: asserted` — validated by human authority (requires `src:` with human reviewer)

LLM-estimated facts must carry `confidence: derived` or `confidence: estimated`
and cannot be promoted to `confidence: asserted` without human review.

### `@cluster` syntax

```
@cluster <cluster-name> [<cluster-type>]
  + member-one
  + member-two
  [review-cycle:annual, authority:<governing-body>]
```

Cluster types: `policy-exclusion` | `approved-enterprise` | `approved-learner` |
`approved-list` | or any domain-appropriate label in kebab-case.

---

## Relationship Sigils

| Sigil | Purpose |
|---|---|
| `@rel` | Schema-level relationship type declarations |
| `@edges` | Instance-level graph edges with typed predicates and edge properties |
| `@xwalk` | Crosswalk identity resolution — maps external/legacy IDs to canonical |
| `@vocab` | Governed definitions of every relationship predicate used in the document |

### `@vocab` syntax

Required whenever `@rel` or `@edges` are present.

```
@vocab
  predicate-name     │ definition of what this predicate asserts
  second-predicate   │ definition
```

### `@rel` syntax

```
@rel
  predicate-name     -> TargetType
  symmetric-pred     <=> TargetType
  inbound-pred       <- SourceType
```

### `@edges` syntax

```
@edges
  subject-id -> predicate -> target-id [prop:value, prop:value]
```

### `@xwalk` syntax

```
@xwalk
  legacy:TERM-ID    => canonical:canonical-id  [method:exact, type:asserted]
  external:FRAME-ID => canonical:canonical-id  [method:mapped, conf:0.92, type:asserted]
```

Method tokens: `exact` | `mapped` | `fuzzy`
Confidence: 0.0–1.0 (omit for `method:exact`)

---

## Lifecycle Sigils

| Sigil | Purpose |
|---|---|
| `@cycle` | Review cadence in days — e.g. `@cycle 90d` |
| `@reviewed` | ISO date of last authoritative review |
| `@status` | Current-state key-value snapshot for operational reference documents |
| `@phases` | Lifecycle phase plan with `[done]` / `[next]` / `[later]` tokens |

### `@cycle` + `@reviewed` syntax

```
@cycle 90d
@reviewed 2026-06-01
```

Standard cadences by domain:
- Regulatory / compliance: 30–60d
- Risk policy: 30d
- Brand standards: 90–180d
- Workforce / competency: 90–180d
- Strategic / reference: 180–365d

### `@status` syntax

```
@status
  + key   │ value
  + key   │ value
```

### `@phases` syntax

```
@phases
  phase-name  [done]   │ description
  phase-name  [next]   │ description
  phase-name  [later]  │ description
```

---

## Relationship Operators

| Operator | Semantics |
|---|---|
| `->` | Outbound directed edge: subject → predicate → target |
| `<-` | Inbound directed edge: inverted for authoring readability |
| `<=>` | Symmetric bidirectional edge: valid only for inherently symmetric predicates |
| `=>` | Crosswalk resolution: source maps to canonical target |

`<=>` is only valid for predicates that are logically symmetric (e.g. `adjacent_to`,
`co-occurs-with`). Do not use `<=>` for hierarchical or directional predicates.

---

## Governance Model

### Breaking change rules

Any change to the following sigils in an `active` document is a **breaking change**
requiring a major version bump:

`@def` `@include` `@exclude` `@rules` `@rel` `@constraints` `@infer`

Non-breaking changes (minor version): `@cycle`, `@reviewed`, `@status`, `@links`,
`@edges` (additions only), `@xwalk` (additions only), `@props` (additions only).

Every agent package declaring the affected document must be re-validated before
production promotion when a breaking change lands.

### Provenance model

Facts in SIGN carry one of three provenance types:

- `type:asserted` — validated by a human authority. Authoritative.
- `type:inferred` — derived by a rule or model. Must be tagged; cannot be promoted
  without human review.
- `type:estimated` — model-estimated with uncertainty. Must carry confidence score.

### SHA integrity

`sha:` in `@canon` and `@doc` is the SHA-256 hash of the compiled artifact.
Use `sha:pending` for unregistered documents. Never fabricate a hash value.

---

## Two-Layer Delivery Architecture

| Layer | Content | Token budget |
|---|---|---|
| Layer 1 — Index | `@canon`, `@doc`, `@links`, `##` summary | ~10 tokens per document |
| Layer 2 — Full document | Complete SIGN structure | 300–500 tokens typical |

The Layer 1 index is always injected into agent context. Layer 2 documents are
retrieved on demand. Every document must have both forms.

Index scaling limit: ~200 documents before the Layer 1 index exceeds typical
injection budgets. Three-layer extension (meta-index, selective index, full document)
is defined for SIGN v1.1.

---

## Token Efficiency Reference

| Structure | SIGN | JSON equivalent | Reduction |
|---|---|---|---|
| Single full knowledge document | 379 tokens | 978 tokens | 61% |
| 9-document index | 406 tokens | 818 tokens | 50% |
| Single `@constraints` block | 24 tokens | 51 tokens | 53% |
| Single `@infer` rule | 31 tokens | 74 tokens | 58% |
| Single `@cluster` declaration | 18 tokens | 44 tokens | 59% |

---

## Extension Sigil

| Sigil | Purpose |
|---|---|
| `@reserved` | Forward roadmap sigil declarations — governs the extension namespace |
| `@disallowed` | Prohibited structural or naming patterns |
| `@attrs` | Required and optional attribute declarations with type information |

`@reserved` is for human authors declaring planned extensions. Do not generate
`@reserved` blocks automatically — they require deliberate human judgment about
the forward roadmap.

---

## Inline Syntax Reference

| Token | Meaning |
|---|---|
| `+` | Cluster member or property entry |
| `?` | Inclusion criterion |
| `!` | Exclusion or disallowed entry |
| `[...]` | Inline property bag |
| `│` | Name/description separator in `@props` and `@vocab` |
| `[done]` / `[next]` / `[later]` | Phase state tokens in `@phases` |

---

## Complete Layer 2 Example — Reference

From SIGN whitepaper v1.0, Section 3.2. Use this as the quality benchmark.

```
@doc CONCEPT-001 [std, active, agents+employees] v1 sha:7d4a1f
@links CONCEPT-002,CONCEPT-003,REF-001
@cycle 90d
@reviewed 2026-04-01

@vocab
  depends_on     │ subject cannot function effectively without target present
  adjacent_to    │ subjects frequently co-occur and complement; symmetric
  progression_to │ target represents natural advancement from source; not symmetric

@def core-concept
  Atomic, distinct, demonstrable unit of knowledge or capability with stable identity.
  Acquired through learning or experience. Observable through behavior or outcomes.
  Identity stable across organizational contexts.

@include
  ? single bounded unit with a clear definition and scope
  ? demonstrable through execution, behavior, or outcomes
  ? intentionally developable or acquirable
  ? stable identity independent of specific organization or context

@exclude
  ! a broad bundle comprising multiple distinct units
  ! a process step, workflow state, or outcome
  ! a role, title, or organizational designation
  ! a platform or tool without distinct underlying capability

@constraints
  concept-identity
    mutex:   concept.type = bundled AND atomicity-validation = passed
    forbids: external label promoted to canonical without crosswalk validation
    forbids: process step used as identity anchor
    enforced-by: ontology-governance-layer

@infer concept-trajectory
  applies-to: concept
  when:  concept.lifecycleStatus = Declining
  and:   concept.substitutionRisk = High
  then:  concept.trajectorySignal = Eroding
  confidence: derived
  src:   lifecycle-rule-003

@rel
  depends_on     -> Concept
  adjacent_to    <=> Concept
  progression_to -> Concept
```

Layer 1 index entry for the above:

```
@canon v1.0 sha:a3f9c2
@doc CONCEPT-001 [std, active, agents+employees] v1
@links CONCEPT-002,CONCEPT-003,REF-001
## Canonical definition; inclusion/exclusion criteria; governed constraints; inference rules
```

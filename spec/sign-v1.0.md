# SIGN v1.0 — Complete Specification

**Sigil Intelligence Graph Notation**
Open Source Specification · v1.0 · April 2026 · Originated at Career Highways

---

## 1. Overview

SIGN — Sigil Intelligence Graph Notation — is a strongly typed, human readable, token-optimized notation language designed for the agentic consumer. It is the contract layer between a governed knowledge graph and the AI agents that consume it.

SIGN is not a general-purpose serialization format and is not competing with JSON. JSON is machine-readable with parser overhead designed for programmatic consumption. SIGN is designed specifically around how agents read: by pattern recognition, sigil semantics, and attention over a token budget. Every design decision follows from that constraint.

SIGN expresses structure, relationships, inference rules, constraints, clusters, and provenance in a form agents can reason over — not just retrieve from.

---

## 2. Complete Sigil Reference

Sigils are the structural primitives of SIGN. Each sigil is a short `@`-prefixed token that declares the type and purpose of the block that follows. The sigil system is self-describing — an agent encountering SIGN for the first time can infer complete structural meaning from sigils alone. No schema document required in context.

This is the core design insight. LLM agents parse by pattern recognition and semantic attention. A sigil like `@constraints` or `@infer` carries meaning agents recognize immediately. A JSON key like `"structural_rules"` carries the same meaning but costs more tokens and relies on the agent inferring intent from a prose label.

### 2.1 Document Sigils

| Sigil | Name | Meaning |
|---|---|---|
| `@canon` | Bundle header | Version and SHA-256 hash of the compiled artifact |
| `@doc` | Document declaration | Identity, type token, status, audience scope. May carry a provisional trailing landing-status flag after audiences (e.g. `machine-drafted`; lint, not grammar — see §7). |
| `## Agent summary` | Compressed summary | One per `@doc` in the index layer — self-contained for retrieval decision-making |
| `@links` | Related documents | Comma-separated related canon doc IDs. Optionally typed. |
| `@anchor` | Source coverage binding | The Layer-0 source artifacts this document governs (repository globs, OKF concept paths, or system identifiers). The only content-binding sigil permitted in Layer 1. |
| `@cycle` | Review cycle | Review cadence in days: `@cycle 60d` |
| `@reviewed` | Last reviewed | ISO date of last authoritative review |

### 2.2 Content Block Sigils

| Sigil | Name | Meaning |
|---|---|---|
| `@def` | Primary definition | Canonical definition of the subject concept. Required in `std` and `gls` documents. |
| `@props` | Core properties | Named property list using `+` prefix. Format: `+ name \| description`. |
| `@include` | Inclusion criteria | Positive inclusion tests using `?` prefix. |
| `@exclude` | Exclusion criteria | Negative exclusion tests using `!` prefix. |
| `@rules` | Operational rules | Numbered classification or operational rules. |
| `@boundary` | Identity boundary | Scope and identity clarification. Prevents semantic overlap. |
| `@attrs` | Attributes | Required and optional attribute declarations. |
| `@disallowed` | Disallowed forms | Prohibited structural or naming patterns using `!` prefix. |
| `@status` | Current state | Key:value snapshot for operational reference documents. |
| `@phases` | Phase plan | Lifecycle phases with `[done]`/`[next]`/`[later]` tokens. |

### 2.3 Relationship Sigils

| Sigil | Name | Meaning |
|---|---|---|
| `@rel` | Schema-level | Declares what relationship types the entity class supports. Schema, not instance data. |
| `@edges` | Instance-level | Actual graph edges between specific canonical objects with edge properties. |
| `@xwalk` | Crosswalk | Identity resolution mappings from legacy, external, or customer terms to canonical IDs. |
| `->` | Outbound edge | Directional relationship from subject to target entity. |
| `<-` | Inbound edge | Directional relationship inverted for readability. |
| `<=>` | Symmetric edge | Bidirectional relationship. Valid only for inherently symmetric predicates. |
| `=>` | Resolution mapping | Used exclusively in `@xwalk`. Source term resolves to canonical target. |

### 2.4 Knowledge Sigils

These sigils elevate SIGN from a notation format to a decision language. They express the reasoning layer of the ontology — not just what exists, but what it means and what follows from it.

| Sigil | Name | Meaning |
|---|---|---|
| `@cluster` | Skill cluster | Named typed set of skills with threshold semantics. First-class node in the graph. |
| `@infer` | Inference rule | Governed rule that derives new facts from existing graph state. |
| `@constraints` | Structural constraints | Rules agents must enforce: mutex, requires, forbids, enforced-by. |
| `@vocab` | Vocabulary | Governed definitions of all relationship type predicates used in the document. |
| `@reserved` | Reserved namespace | Forward roadmap sigils declared but not yet fully specified. |

### 2.5 Cluster Operator

| Operator | Meaning |
|---|---|
| `+` | Set membership — joins cluster members as an unordered set: `skill:a + skill:b + skill:c` |

### 2.6 Inline Tokens

| Token | Name | Meaning |
|---|---|---|
| `+` | Property entry | In `@props`: `+ name \| description` |
| `?` | Inclusion signal | In `@include`: `? criterion` |
| `!` | Exclusion signal | In `@exclude` and `@disallowed`: `! pattern` |
| `[...]` | Property bag | Edge, cluster, or crosswalk properties. Format: `[key:value, key:value]` |
| `\|` | Field separator | Separates name from description in `@props` and `@attrs` |
| `#` | Comment | Line comment. Ignored by parser. |

---

## 3. Property Reference

### 3.1 Edge Properties

| Key | Name | Meaning |
|---|---|---|
| `str:{0.0-1.0}` | Strength | Numeric edge strength |
| `conf:{level}` | Confidence | `high`, `medium`, `low` |
| `status:{state}` | Edge status | `validated`, `proposed`, `deprecated` |
| `type:{kind}` | Epistemic type | `asserted` — explicitly declared; `inferred` — derived from rules |
| `from:{date}` | Valid from | ISO date edge becomes valid |
| `to:{date}` | Valid to | ISO date edge expires |
| `when:{condition}` | Context condition | Constrains edge to specific facet context. Format: `when:industry=healthcare` |
| `src:{source}` | Evidence source | `sme`, `inferred`, `onet`, `esco`, `labor-market`, `llm-extraction` (an LLM's reading of source), `csproj` (mechanically extracted) |
| `rule:{id}` | Deriving rule | ID of the `@infer` rule that produced this edge |
| `provenance:{chain}` | Provenance chain | Full derivation history. Format: `inferred:agent-v2 -> reviewed:sme -> validated:onet` |
| `weight:{level}` | Importance | `critical`, `high`, `medium`, `low` |
| `prof:{n}` | Proficiency | Required proficiency level integer |

### 3.2 Cluster Properties

| Key | Name | Meaning |
|---|---|---|
| `type:{kind}` | Cluster type | `capability` \| `cooccurrence` \| `transition` \| `ai-impact` |
| `threshold:{rule}` | Satisfaction rule | `all` \| `any` \| `{n}-of-{m}` |
| `pattern:{kind}` | AI impact pattern | For `ai-impact` clusters: `automated` \| `augmented` \| `amplified` \| `stable` |
| `min:{n}` | Minimum members | Minimum skills required for cluster activation |
| `from:role:{id}` | Source role | For transition clusters: origin role |
| `to:role:{id}` | Target role | For transition clusters: destination role |
| `industry:{id}` | Industry scope | Scopes cluster to specific industry context |
| `status:{state}` | Cluster status | `validated`, `proposed`, `deprecated` |
| `src:{source}` | Evidence source | Origin of cluster definition |

### 3.3 Inference Rule Properties

| Key | Name | Meaning |
|---|---|---|
| `when:` | Condition | Antecedent condition on graph state |
| `and:` | Additional condition | Additional conjunctive condition |
| `or:` | Alternative condition | Disjunctive condition |
| `then:` | Consequence | Derived fact or signal to assert |
| `confidence:` | Output confidence | `derived` \| `high` \| `medium` \| `low` |
| `src:` | Rule source | Ontology rule ID or derivation origin |
| `applies-to:` | Scope | Entity type the rule applies to |

### 3.4 Document Type Tokens

| Token | Meaning |
|---|---|
| `ref` | Reference — authoritative factual reference, e.g. ontology status, taxonomy counts |
| `std` | Standard — normative specification governing platform behavior |
| `pol` | Policy — governing rules and constraints for agent or platform operation |
| `adr` | Architectural Decision Record — binding design decision with rationale |
| `pln` | Plan — forward-looking execution plan or roadmap |
| `gls` | Glossary — term definitions and vocabulary governance |

### 3.5 Status and Phase Tokens

| Token | Meaning |
|---|---|
| `active` | Authoritative and in use. Agents may rely on it. |
| `inactive` | Not authoritative. Agents must not use for execution. |
| `draft` | Under review. Not yet authoritative. |
| `deprecated` | Superseded. Retained for reference only. |
| `[done]` | Phase complete. |
| `[next]` | Current active target. |
| `[later]` | Deferred. |

### 3.6 Namespace Prefixes

| Prefix | Meaning |
|---|---|
| `skill:` | Canonical skill — `skill:workforce-planning` |
| `role:` | Role entity — `role:data-scientist-ii` |
| `cluster:` | Named cluster — `cluster:capability:workforce-intelligence` |
| `legacy:` | Legacy skill ID — `legacy:4421` |
| `onet:` | O\*NET reference — `onet:2.4.1` |
| `esco:` | ESCO reference |
| `customer:` | Customer-imported label — `customer:hr-planning` |
| `doc:` | Canon document — `doc:WFI-008` |

### 3.7 Anchor Property Keys

Reserved keys on the `@anchor` property bag. Validated by lint, not grammar — unknown keys are
preserved and warned on, never dropped.

| Key | Name | Meaning |
|---|---|---|
| `repo:{id}` | Repository | Source repository the patterns are rooted in |
| `vcs:{kind}` | Version control | `git` etc. — informs `sign drift` |
| `okf:{bundle}` | OKF source | Marks an OKF-imported anchor; requires a matching `@xwalk okf:` line |
| `src:{name}` | Source bundle | Logical name of the imported source |
| `generated-from:{source}` | Generation source *(proposed)* | Marks the anchored content as mechanically generated from the named source (e.g. `csproj`), not authored. **Proposed, not ratified** — see `proposals/2026-07-codebase-canon-reinforcement.md`. |

Patterns under `@anchor` are **opaque strings** — glob, path, OKF-concept-path, or system-identifier
semantics are resolved by the consumer (`sign coverage` / `sign drift` / the platform), not the
grammar. `+` adds a coverage pattern; `!` carves one out.

---

## 4. Document Anatomy

### 4.1 Index Entry Format

```
@doc {ID} [{type}, {status}, {audiences}] [v{n}]
@links {related_ids}
## {agent_summary}

# audiences: agents | employees | agents+employees
# @links is optional; omit if no related documents
# ## must be self-contained for retrieval decision-making
```

### 4.2 Full Document Block Order

Block order is enforced by the build pipeline. Not all blocks are required for every document type.

```
@doc {ID} [{type}, {status}, {audiences}] v{n} sha:{hash}
@links {related_ids}
@anchor [{key}:{value}, ...]
  # source artifacts this document governs (opaque patterns)
  + {pattern}
  ! {pattern}
@cycle {n}d
@reviewed {date}
@vocab
  # governed relationship type definitions
  {predicate} | {definition}
@def {concept}
  # std and gls documents
  {definition text}
@props
  # core properties
  + {name} | {description}
@include
  # inclusion criteria
  ? {criterion}
@exclude
  # exclusion criteria
  ! {criterion}
@rules
  # operational or classification rules
  1. {rule text}
@boundary
  # identity and scope boundary
  {boundary text}
@constraints
  # structural rules agents must enforce
  mutex: {condition} AND {condition}
  requires: {condition} when {condition}
  forbids: {condition}
  enforced-by: {rule-layer-id}
@cluster {id} [{type}]
  # named skill set with threshold semantics
  {ns}:{skill} + {ns}:{skill} + {ns}:{skill} [{cluster_props}]
@infer {rule-id}
  # governed inference rule
  applies-to: {entity-type}
  when: {condition}
  and: {condition}
  then: {fact-to-assert}
  confidence: {level}
  src: {rule-source}
@rel
  # schema-level relationship declarations
  {predicate} -> {TargetType} [{edge_props}]
  {predicate} <- {SourceType} [{edge_props}]
  {predicate} <=> {TargetType}   # symmetric
@edges {scope_id}
  # instance-level graph edges
  {ns}:{id} {predicate} {ns}:{id} [{edge_props}]
  {ns}:{id} {predicate} @cluster:{id} [{edge_props}]
@xwalk
  # identity resolution mappings
  {ns}:{source} => {ns}:{target} [{method}, {conf}]
@attrs required
  {attr} | {description}
@attrs optional
  {attr} | {description}
@disallowed
  ! {prohibited pattern}
@phases
  [done] {phase}: {description}
  [next] {phase}: {description}
  [later] {phase}: {description}
@status
  {key}: {value}
@reserved
  {sigil} # {description and target version}
```

---

## 5. Clusters

Clusters are one of the most important constructs SIGN adds over existing formats. A cluster is a named, typed set of concepts with threshold semantics. It is a first-class graph node — it can be referenced in edges, required by roles, targeted by inference rules, and evaluated for satisfaction scores in planning workflows.

Four cluster types cover the primary knowledge graph use cases:

| Type | Semantics | Threshold |
|---|---|---|
| `capability` | Skills that together constitute a higher-order capability. No single member is sufficient. | Typically `all` |
| `cooccurrence` | Concepts that empirically appear together. Observational, not structural. | Typically `n-of-m` |
| `transition` | Concepts that must be acquired together for a state change to be viable. | Typically `all` |
| `ai-impact` | Concepts sharing the same automation exposure pattern. Planning unit for transformation scenarios. | Typically `any` |

---

## 6. Inference Rules and Constraints

This is what makes SIGN a decision language rather than a description language.

Inference rules express the governed logic that derives new facts from graph state. Constraints express the structural rules agents must enforce. Together they give agents the reasoning layer — not just the data, but what it means and what follows from it.

### Inference Rules

```
# Skill trajectory derived from combined AI signals
@infer skill-trajectory-eroding
  applies-to: skill
  when: skill.lifecycleStatus = Declining
  and: skill.AIImpactCategory = Automated
  then: skill.trajectorySignal = Eroding
  confidence: derived
  src: ontology-rule-007

# Mobility readiness from cluster satisfaction
@infer transition-readiness
  applies-to: individual
  when: individual satisfies @cluster:transition:analyst-to-strategist [threshold:2-of-3]
  then: individual.mobilitySignal = Ready
  confidence: derived
  src: mobility-model-v2
```

### Constraints

```
@constraints
  skill
  mutex: lifecycleStatus=Active AND lifecycleStatus=Deprecated
  requires: AIImpactCategory IS SET when AiWorkforceReductionPercent > 0
  forbids: depends_on cycle-length > 3
  enforced-by: ontology-rule-layer
```

---

## 7. Provenance and Trust

Ontologies are only trustworthy if you can trace where every fact came from. SIGN carries two provenance mechanisms as first-class edge properties.

The `type:asserted` / `type:inferred` distinction marks the epistemic status of every edge — explicitly declared by a human or expert system vs derived by an inference rule. Agents treat these differently: asserted edges are governed commitments, inferred edges are soft and revisable.

The `provenance:` chain captures the full derivation history of a fact — who produced it, who reviewed it, what external source validated it.

> **Machine-drafted content (proposed convention).** In codebase-type bundles the descriptive
> prose is an LLM's reading of the code (`src:llm-extraction`) and must never be marked
> `type:asserted` — only mechanically-verifiable facts (e.g. `@edges` from csproj,
> `[type:asserted, src:csproj]`) may. Such documents carry a provisional `machine-drafted`
> landing-status token in the `@doc` bag until a human landing step clears it. See
> `proposals/2026-07-codebase-canon-reinforcement.md` (open decisions D-1/D-2).

```
@edges skill:workforce-planning

# Asserted edge — explicitly validated
skill:workforce-planning depends_on skill:data-analysis
  [str:0.8, conf:high, status:validated, type:asserted,
   provenance:inferred:relationship-miner-v2 -> reviewed:sme-panel-2026Q1 -> validated:onet]

# Inferred edge — derived by rule, proposed status
skill:workforce-planning adjacent_to skill:org-design
  [str:0.6, conf:medium, status:proposed, type:inferred, rule:adjacency-miner-v2]

# Context-scoped edge — only valid in healthcare
skill:workforce-planning depends_on skill:regulatory-knowledge
  [str:0.7, when:industry=healthcare, type:asserted, src:sme]
```

---

## 8. Two-Layer Delivery

SIGN delivers knowledge in two layers with different injection strategies. The separation is fundamental to how it achieves token efficiency without sacrificing depth.

| Layer | Purpose and cost |
|---|---|
| **Layer 1 — Index** | Injected into every agent system prompt. Contains document identity, status, graph edges, one summary line per document. ~400 tokens for a 9-document corpus. |
| **Layer 2 — Full document** | Retrieved on demand via `get_canon_doc(id)`. Full SIGN structure for a specific document. Agents only pay for documents they actually need. Scoped by per-agent allowlist. |

```
# Layer 1 — always injected
@canon v1.0 sha:a3f9c2
@doc KNOW-001 [std, active, agents] v1
@links KNOW-002,KNOW-003
## Skill definition; atomic demonstrable capability; inclusion/exclusion; required attrs

@doc KNOW-002 [ref, active, agents] v1
@links KNOW-001
## Taxonomy; 4 domains, 20 categories; single-home classification enforced

# Layer 2 — retrieved on demand
# Agent calls: get_canon_doc("KNOW-001")
# Returns: full SIGN document with @def, @props, @include, @exclude,
#          @constraints, @cluster, @infer, @rel, @attrs, @disallowed
```

---

## 9. Governance

### 9.1 Version Contract

| Bump | Triggers |
|---|---|
| Patch (1.0.x) | Summary updates, new documents. |
| Minor (1.x.0) | New sigil blocks, new clusters, additive documents. |
| Major (x.0.0) | Breaking changes to definitions, rules, constraints, relationship schemas, or inference logic. |

Consumers pin to a specific canon version. They do not silently pick up updates.

### 9.2 Breaking Change Definition

Any change to `@def`, `@include`, `@exclude`, `@rules`, `@rel`, `@constraints`, or `@infer` in an existing active document is a breaking change. Major version bump required. Consumers of the affected document must be re-validated before production promotion.

`@anchor` changes are **never meaning-breaking** — they bind a document to source, they do not change what it means. They form a distinct class:

| Class | Trigger | Bump |
|---|---|---|
| `meaning-breaking` | change to `@def`/`@include`/`@exclude`/`@rules`/`@rel`/`@constraints`/`@infer` | MAJOR |
| `coverage-narrowing` | an `@anchor` include removed, or an exclude added that drops covered artifacts | MINOR + DRIFT |
| `additive` | an `@anchor` include widened, an exclude removed, or new optional content | MINOR / PATCH |

`coverage-narrowing` is not meaning-breaking, but silently un-governing an artifact is itself a governance failure, so it emits a **drift-signal** (`{docId, droppedPatterns, affectedArtifacts}`) even though the version bump is only MINOR. `sign diff` reports it in a `coverage` block.

### 9.3 Authoring Rules

- SIGN is never authored directly. Humans author markdown. The build pipeline compiles to SIGN.
- The `agent_summary` field is the source for the `##` index line. Must be accurate and self-contained on every update.
- `@links` edges must be bidirectional where the relationship is symmetric. Build pipeline validates.
- `@vocab` must define every relationship predicate used in `@rel` or `@edges` within the same document.
- New `@cluster` definitions require SME validation before `status:validated`. `status:proposed` is permitted for pipeline-inferred clusters.

### 9.4 Reserved Namespace

SIGN governs its own extension namespace through `@reserved`. This prevents incompatible community extensions and creates a clear contribution surface for future versions.

```
@reserved
  @pathway      # ordered skill sequence for learning path modeling (v2)
  min:/max:     # cardinality constraints on @rel declarations (v2)
  @signal       # workforce market signal attach point (v2)
  @benchmark    # external framework alignment block (v2)
```

---

## 10. Parser Specification

### 10.1 Lexical Rules

- Lines beginning with `@` followed by a lowercase token are sigil declarations.
- Lines beginning with `##` are agent summary lines. Valid only immediately inside `@doc` in the index layer.
- Lines beginning with `+`, `?`, or `!` are list entries within their parent sigil block.
- Lines containing `->` or `<-` are relationship declarations within `@rel` or `@edges`.
- Lines containing `<=>` are symmetric relationship declarations.
- Lines containing `=>` are crosswalk mappings within `@xwalk`.
- Indentation is two spaces. Indented lines belong to the most recent sigil block.
- Inline brackets `[...]` after a relationship or cluster entry contain properties as comma-separated `key:value` pairs.
- The `|` character separates name from description in `@props` and `@attrs`.
- Lines beginning with `#` are comments. Ignored by the parser.
- Content is UTF-8. Dates are ISO 8601. Decimal separator is period.

### 10.3 `@anchor` Grammar

`@anchor` binds a document to the Layer-0 source artifacts it governs. The parser treats
patterns as **opaque strings**; glob/path/symbol semantics are resolved by the consumer (CLI or
platform), not the grammar. It is dual-layer (`Index | Full`) — the same eligibility class as
`@doc` and `@links` — and the only content-binding sigil permitted in Layer 1.

```ebnf
anchor          = anchor-block | anchor-compact

anchor-block    = "@anchor" [ SP property-bag ] NL anchor-entry { anchor-entry }
anchor-entry    = INDENT ( "+" | "!" ) SP pattern NL
anchor-compact  = "@anchor" SP pattern { "," SP pattern } NL   ; Layer-1 index form only

property-bag    = "[" kv { "," SP kv } "]"
kv              = key ":" value
pattern         = { ANYCHAR - NL }                              ; opaque to the parser
```

- Emit one anchor per document. A second `@anchor` block is a parse error (`anchor must be
  singular`) — coverage is a single set per identity.
- `+` patterns are includes, `!` patterns are excludes; both preserve source order.
- The **compact** form (single-line, comma-separated) is produced by the compiler for the
  Layer-1 index only. Authoring it in a full document is a lint error (`ANCHOR004`).
- The Layer-1 emission drops excludes and caps the include list (see §8); excludes are an
  authority concern, and Layer 1 is a locator.

### 10.2 Error Handling

| Condition | Handling |
|---|---|
| Unknown sigil | Log warning. Skip block. Do not fail parse. Forward compatibility requires graceful handling. |
| Malformed edge property | Log warning. Use edge without properties. |
| Unresolvable `@links` reference | Build pipeline rejects at compile time. Parser skips edge and logs warning. |
| Inactive document in bundle | Build pipeline excludes. If present, parser marks inactive and suppresses from agent context. |
| Unresolvable `@cluster` reference in `@edges` | Log warning. Skip edge. Do not fail parse. |
| `@infer` rule with missing condition | Build pipeline rejects. Parser logs error and skips rule. |

---

## 11. Positioning

| Comparison | Distinction |
|---|---|
| **vs JSON** | JSON serializes data for machine parsers. SIGN declares knowledge for agent consumers. Different design targets, different consumption models. Not competing. |
| **vs YAML** | YAML is a configuration format. SIGN is a knowledge notation with relationship semantics, inference rules, constraints, and agent-optimized compression. Different purpose class. |
| **vs RDF / OWL** | RDF has the right semantic ambitions but failed the adoption test — academic syntax, heavy toolchain, no presence in agent context window patterns. SIGN delivers equivalent semantic expressiveness at engineering-team adoption cost. |
| **vs Markdown** | Markdown is human-first without structural typing. SIGN compiles from markdown source but adds sigil typing, relationship structure, inference rules, and token compression for the agent consumption layer. |
| **vs Prompt engineering** | Embedding rules in prompts is ungoverned, unversioned, unauditable, non-reusable. SIGN makes knowledge a governed artifact separate from the prompt. |
| **vs GraphQL** | GraphQL is a query language for data graphs. SIGN is a declaration language for knowledge graphs. SIGN describes what the graph means, not how to query it. |

---

## 12. Build Pipeline

| Step | Description |
|---|---|
| 1. Discover | Find all markdown files in canon source directory. Read YAML frontmatter. |
| 2. Filter | Exclude `status != active`. Exclude non-agent audience docs for agent bundle. |
| 3. Validate | Validate frontmatter schema. Verify `@links` references resolve. Check bidirectionality of symmetric edges. |
| 4. Compile | Transform each document into SIGN block structure. Apply sigil encoding. Validate `@infer` and `@constraints` syntax. |
| 5. Index | Extract `@doc` declarations and `##` summaries into Layer 1 index artifact. |
| 6. Hash | Compute SHA-256 of full-document bundle. Embed in `@canon` header. |
| 7. Publish | Register compiled artifacts with artifact registry or serving layer. |

### Artifact Outputs

```
canon-index.sign         # Layer 1: always-injected index
canon-bundle.sign        # Layer 2: full documents on demand
canon-manifest.json      # version, sha, doc count, build timestamp
canon-bundle.sign.sha256 # integrity file
```

---
*SIGN v1.0 · © 2026 Career Highways · MIT License*
*Whitepaper and citation: https://doi.org/10.17605/OSF.IO/6YZJ7*

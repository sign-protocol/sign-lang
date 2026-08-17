# Changelog

## Unreleased

- **v1.1 grammar: `::` group labels in list blocks**
  (`proposals/2026-08-list-block-group-labels.md`, accepted 2026-08-16). A line beginning
  `::` inside `@vocab`, `@attrs`, `@include`, or `@exclude` names the group of entries that
  follow it — parsed structure, unlike `#` comments, which stay ignored. Additive; motivated
  by ~82 grouping labels the largest corpus carries as parser-invisible comments.
- **v1.1 grammar: `@currency` and `@sources` blocks**
  (`proposals/2026-08-sources-currency-blocks.md`, accepted 2026-08-16). Two new optional
  full-document blocks ordered after `@status`: `@currency` (research currency —
  `research-pulled` / `volatility` / `verify-before-use`, `key: value` lines) and `@sources`
  (authoritative citations, `authority | citation | url` rows). Additive; motivated by the
  CareerHighways legal corpus, which was routing citations through `@props` and currency
  through `@status` because the block set was closed. Spec §4.2, sigil reference, and
  validator `BLOCK_ORDER` updated.

- **Proposal: codebase-canon reinforcement** (`proposals/2026-07-codebase-canon-reinforcement.md`).
  Provisional/proposed additions, none changing the normative grammar:
  - `generated-from:` `@anchor` property-bag key *(proposed)* — noted in §3.7.
  - `machine-drafted` `@doc` landing-status token *(provisional, D-2)* — noted in §2.1/§7.
  - `src:llm-extraction` recognized evidence-source value; codebase prose must never be
    `type:asserted` (§7).
  - Cross-repo edge target convention `codebase.<slug>#<DOC-ID>`.
  - Open decisions D-1 (parser default for unmarked prose), D-2 (token name), D-3 (coverage
    denominator), D-4 (normative-doc drift) recorded as open.

## v1.0.0 — April 2026

Initial open source release.

- Complete sigil reference: `@canon`, `@doc`, `@vocab`, `@def`, `@props`, `@include`, `@exclude`,
  `@rules`, `@boundary`, `@constraints`, `@cluster`, `@infer`, `@rel`, `@edges`, `@xwalk`,
  `@attrs`, `@disallowed`, `@phases`, `@status`, `@reserved`
- Knowledge sigils (`@cluster`, `@infer`, `@constraints`, `@vocab`) elevating SIGN to a decision language
- Two-layer delivery model: injected index (~400 tokens) + on-demand full document retrieval
- Four cluster types with threshold semantics: capability, cooccurrence, transition, ai-impact
- Full property reference: edge properties, cluster properties, inference rule properties
- Document type tokens: `ref`, `std`, `pol`, `adr`, `pln`, `gls`
- Namespace prefix system: `skill:`, `role:`, `cluster:`, `legacy:`, `onet:`, `esco:`, `customer:`, `doc:`
- Provenance model: `type:asserted` / `type:inferred` distinction with full derivation chain
- Parser specification with error handling and forward-compatibility rules
- Reserved namespace: `@pathway`, `@signal`, `@benchmark`, `min:/max:`
- Governance model: versioning contract, breaking change definition, authoring rules
- Worked examples for all major constructs
- Validator specification

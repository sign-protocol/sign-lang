# Changelog

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

# Proposal — Codebase-Canon Reinforcement additions

**Status:** Proposed (open) · **Date:** 2026-07-06 · **Origin:** CH codebase-canon reinforcement spec v1

This proposal collects the SIGN-touching pieces of the codebase-canon reinforcement effort so
they are visible and reviewable **before** any of them is treated as ratified syntax. Nothing
here changes the normative `spec/sign-v1.0.md` grammar; the compiler (`ch-canon-tools`) emits
these forms behind the codebase canon type and flags them as provisional.

`@anchor` itself is already ratified (spec §2.1, §3.7, §4.2, §9.2, §10.3) — the reinforcement
work is a *usage* convention on top of it plus the four items below.

## 1. `@anchor` usage convention for codebase bundles (no grammar change)

Codebase bundles carry the four-document pattern `*-ARCH / *-DEPS / *-OVERVIEW / *-STANDARDS`.
Convention:

- `*-ARCH` → bind to the source projects: `+ src/<Project>.*/**`, excluding `**/*.Tests/**`,
  `**/bin/**`, `**/obj/**`.
- `*-DEPS` → bind to its actual source of truth: `+ **/*.csproj` (or the repo's real dependency
  manifest for non-.NET repos, e.g. `**/package.json`).
- `*-OVERVIEW` → bind to entrypoints/config it describes (API project, migrations/infra, `README.md`).
- `*-STANDARDS` → **no spatial `@anchor`.** Its scope matches ~every source file; a spatial
  anchor would be index noise and force ~100% coverage regardless of real depth. Its drift lives
  on `@links` (see D-4).

## 2. `generated-from:` anchor property key — **PROPOSED, not ratified**

A new key on the `@anchor` property bag marking that the anchored content is mechanically
generated from the named source, not authored:

```
@anchor [repo:ch-fluid-iq, vcs:git, generated-from:csproj]
  + **/*.csproj
```

The `[...]` bag is already open (spec §3.7 preserves and warns on unknown keys), so this is
non-breaking. It should be added to the §3.7 reserved-key table if accepted. Values seen so far:
`csproj`, `package-json`.

## 3. `machine-drafted` `@doc` landing-status token — **PROVISIONAL (D-2)**

An optional trailing token in the `@doc` bag marking a document as machine-drafted and
not-yet-human-landed:

```
@doc CP-ARCH [std, active, agents, machine-drafted] v1 sha:...
```

It is cleared only through a human landing step (out of scope for the generator). The token
name and placement are a live open engineering decision (D-2); `machine-drafted` is provisional —
do not standardize it here. The compiler parses the bag as three positional tokens
(type, status, audiences) + trailing flag(s), validated by lint, not grammar.

## 4. `src:llm-extraction` provenance value + prose-never-asserted rule

Codebase prose (`@def`, `@rules`, `@boundary`, `@props`, `@constraints`) is an LLM's reading of
the code. Its evidence source is `src:llm-extraction`, and it must **never** carry
`type:asserted` — only mechanically-verifiable `@edges` extracted from csproj may
(`[type:asserted, src:csproj]`). The compiler enforces the negative rule (prose asserted → build
error). `src:` is already an open value set (spec §3.1), so `llm-extraction` is additive.

## 5. Block-level provenance on prose headers — **DEFERRED (gated on D-1)**

The reinforcement spec sketches per-block provenance, e.g. `@def architecture [type:inferred,
src:llm-extraction]`, reusing `type:`/`src:` but extending them to block-header lines (a small
syntax extension). **Deferred by decision (2026-07-06):** ship the doc-level `machine-drafted`
token only; do not emit block-level tags and do not rely on a parser default until D-1 is ruled.

## 6. Cross-repo edges in registry-resolvable ID form

Cross-repo `@edges`/`consumes` targets are emitted as the registry doc-key form
`codebase.<slug>#<DOC-ID>` (the same identity `canon.source.json` / the MCP layer already use),
so the resolver (separate platform work) can light them up without rewriting DEPS documents:

```
repo:ch-fluid-iq consumes codebase.control-plane#CP-OVERVIEW [via:http, when:runtime, type:asserted]
```

Target format only; the generator does not resolve. This replaces today's bare `repo:<name>`
strings.

## Open decisions — require a ruling; do not guess

- **D-1 — Parser default for unmarked prose.** Should unmarked prose blocks in a *codebase*-type
  bundle default to `inferred` at parse time? Spec-touching. *Provisional:* emit explicit
  provenance / rely on the doc-level token; do not change the parser default. Block-level tags
  deferred behind this.
- **D-2 — Landing-status token name/placement.** A live roadmap decision. *Provisional:*
  `machine-drafted` in the `@doc` bag. Do not standardize a name.
- **D-3 — Coverage denominator.** Confirm the source-glob set + exclusions (tracked
  `**/*.cs`, `**/*.csproj`, `config/**`, `infrastructure/**`, `README.md`, ADRs, minus
  `**/*.Tests/**`, `**/bin/**`, `**/obj/**`, vendored/generated) before any coverage % is
  published externally.
- **D-4 — Normative-doc drift.** Confirm `*-STANDARDS` is excluded from spatial coverage and
  tracked via `@links`-dependency drift once the central canon mirror makes `ENG-STD-*`
  references resolvable.

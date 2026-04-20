# ADR-0001 — TextMate Grammar Over LSP for v1 Editor Support

Status: Accepted
Date: 2026-04-20

## Context

SIGN files need editor support so authors get immediate visual feedback while writing canon
documents. Two approaches exist for VS Code (and compatible editors):

**TextMate grammar** — a declarative JSON pattern file that maps regex matches to TextMate scope
names. VS Code uses these scopes to apply syntax highlighting. No runtime process required.
Produces color-coded output for sigils, operators, list markers, property bags, namespace
references, and comments.

**Language Server Protocol (LSP)** — a running server process that responds to editor events
over JSON-RPC. Enables semantic features: hover documentation, go-to-definition, inline
diagnostics (validation errors), auto-completion, and rename refactoring. Requires a parser
that produces an AST, a language server binary, and editor-side wiring to start and communicate
with that server.

SIGN currently has a regex-based validator in `sign-lang/validator/` but no AST-producing
parser. The notation is at v1.0 and used internally across approximately three repos.

## Decision

Ship a TextMate grammar for v1 editor support. Defer LSP to phase 4 (open-source publication).

The VS Code extension (`sign-lang/editor-support/vscode/`) packages the TextMate grammar with
a `language-configuration.json` that handles comment toggling (`#`) and bracket auto-closing
(`[]`). This covers the primary author pain point — visual differentiation between sigil types,
operators, and list markers — without requiring a parser or a running server.

## Alternatives Considered

### LSP backed by the existing validator

The `sign-lang/validator/` performs structural checks via regex, not AST traversal. Wiring
it into an LSP server would give inline diagnostics but the validation surface would be
the same as running the validator in CI. The operational overhead — server process management,
activation events, crash recovery, version compatibility with VS Code's LSP client library —
is not justified while the notation is pre-stabilization and the author population is small.

### Separate VS Code Marketplace extension repo

Keeping the extension in a dedicated repo (`sign-vscode`) rather than inside `sign-lang` would
match the pattern of many popular grammar extensions. Rejected because:

- sign-lang is the authoritative source for the SIGN spec and tooling
- a separate repo creates a synchronization obligation every time sigils are added or renamed
- the extension is a tooling artifact of the language, not a standalone product
- the extension is not yet published to the Marketplace; a dedicated repo adds overhead with
  no current benefit

### No editor support

Acceptable for machine-generated artifacts but SIGN source documents are hand-authored in
markdown (compiled to `.sign`). Authors working in `.sign` dist files for debugging or
inspection benefit meaningfully from highlighting. The TextMate approach is low-cost enough
that deferring entirely is not warranted.

## Consequences

**Accepted limitations:**

- No in-editor validation — authors cannot see structural errors until they run the validator
  in CI or locally via `sign-lang/validator/`.
- No hover documentation — sigil semantics are not surfaced inline; authors must consult
  `SIGN-001.sign` or the spec.
- No auto-completion — sigil names must be typed manually.
- No go-to-definition — `@links` references are not navigable from the editor.

These limitations are accepted for the internal-use, pre-open-source phase.

**Forward path:**

When phase 4 (open-source publication) is initiated, an LSP server should be designed
alongside a proper AST-producing parser. The TextMate grammar remains valid as the
highlighting layer even when LSP is added — the two are not mutually exclusive.

The trigger to revisit this decision:

- phase 4 open-source publication is approved
- the `sign-lang/validator/` is refactored to produce an AST (enabling semantic LSP features)
- author population grows to the point where inline diagnostics provide meaningful productivity
  return on the LSP investment

## Related Docs

- `sign-lang/editor-support/vscode/` — VS Code extension (v1.0.0)
- `sign-lang/editor-support/sign.tmLanguage.json` — standalone TextMate grammar
- `career-highways-canon/sign/SIGN-001.sign` — SIGN spec; `@status.editorExtensionStatus`
- `sign-lang/spec/sign-v1.0.md` — notation spec

## Supersedes / Superseded By

None.

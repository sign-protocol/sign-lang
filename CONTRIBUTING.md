# Contributing to SIGN

SIGN is an open specification. Contributions to the spec, examples, and validator are welcome.

## What you can contribute

- **Bug reports** — ambiguities, contradictions, or gaps in the spec
- **Examples** — additional worked examples for underrepresented constructs
- **Validator implementations** — reference implementations in any language
- **Clarifications** — editorial improvements that do not change normative behavior

## What requires a proposal first

- **New sigils** — must be proposed via issue before implementation; reserved namespace is governed
- **Breaking changes** — changes to `@def`, `@include`, `@exclude`, `@rules`, `@rel`, `@constraints`,
  or `@infer` semantics require a proposal, discussion, and major version bump
- **New cluster types** — must be proposed with real-world use cases

## Proposing a reserved namespace extension

The `@reserved` block in the spec governs the extension namespace. To propose a reserved sigil
for a future version:

1. Open an issue with the sigil name, purpose, and at least one worked example.
2. Discuss with maintainers. We need to validate it covers a gap not addressable by existing sigils.
3. If approved, it is added to `@reserved` in the next minor release with a target version note.
4. Full specification happens in the target version release cycle.

## Pull request process

1. Fork the repo.
2. Create a branch: `spec/your-change` or `example/your-topic` or `validator/your-impl`.
3. Make your change. Update examples if you change normative spec text.
4. Open a PR with a clear description of what changed and why.
5. Maintainers review for spec consistency and normative alignment.

## Normative vs informative

The spec distinguishes normative text (MUST, MUST NOT, SHALL, SHALL NOT, REQUIRED, FORBIDDEN)
from informative text (SHOULD, MAY, examples, rationale). Changes to normative text require
more scrutiny than changes to informative text or examples.

## Code of Conduct

Be direct, specific, and constructive. Spec discussions benefit from concrete examples.
Vague objections without worked examples are not actionable.

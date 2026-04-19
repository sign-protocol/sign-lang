# SIGN Validator

The SIGN validator enforces the structural rules defined in the spec that cannot be caught by a linter alone.

## What the Validator Enforces

### Block order
Documents must follow the canonical block order defined in [spec/sign-v1.0.md](../spec/sign-v1.0.md#42-full-document-block-order). Any block appearing out of order is a build error, not a warning.

### Reference resolution
- All `@links` targets must resolve to a known document ID in the bundle.
- All `@cluster` references in `@edges` must resolve to a declared `@cluster` block.
- All `@infer` rule references in edge `rule:` properties must resolve to a declared `@infer` block.

### Vocabulary completeness
Every predicate used in `@rel` or `@edges` must be declared in `@vocab` within the same document.

### Symmetric edge bidirectionality
Predicates declared as `<=>` in `@rel` must appear in both directions across the document set. Build pipeline validates at bundle level.

### Index budget
The Layer 1 index must not exceed ~400 tokens. Build fails if the compiled index exceeds the budget. Each `@doc` entry must have exactly one `##` summary line.

### Inference rule completeness
`@infer` rules must have `when:`, `then:`, `confidence:`, and `src:`. Missing required fields are build errors.

### Status enforcement
Documents with `status: inactive` or `status: deprecated` are excluded from the agent bundle. If referenced by an `@links` edge, the pipeline logs a warning but does not fail.

## Validator Interface (reference implementation target)

```
sign validate --source ./knowledge
# Outputs: pass | fail with block order violations, unresolved refs, and budget overages

sign compile --source ./knowledge --output ./dist
# Runs validation then produces:
#   canon-index.sign
#   canon-bundle.sign
#   canon-manifest.json
#   canon-bundle.sign.sha256
```

## Error vs Warning

| Condition | Severity |
|---|---|
| Block out of order | Error — build fails |
| Unresolved `@links` | Error — build fails |
| `@infer` missing required field | Error — build fails |
| Index budget exceeded | Error — build fails |
| Unknown sigil | Warning — block skipped, build continues |
| Malformed edge property | Warning — edge used without properties |
| Unresolved `@cluster` in `@edges` | Warning — edge skipped |
| Deprecated document in `@links` | Warning — logged, build continues |

## Contributing a Validator Implementation

See [CONTRIBUTING.md](../CONTRIBUTING.md). Reference implementations in any language are welcome.
The validator interface above is the target contract; internal implementation is unconstrained.

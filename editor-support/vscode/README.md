# SIGN Language Support for VS Code

Syntax highlighting for **SIGN** (Sigil Intelligence Graph Notation) `.sign` files.

> SIGN is the ontology-to-agent contract language built by Career Highways.  
> Spec: SIGN-001 in `career-highways-canon/sign/SIGN-001.sign`

## Token color map

| SIGN construct | TextMate scope | Typical theme color |
|---|---|---|
| `@canon` | `keyword.control.bundle` | bright yellow / gold |
| `@infer` | `keyword.control.inference` | orange / amber |
| `@constraints` `@disallowed` `@boundary` `@exclude` | `keyword.control.constraint` | red / coral |
| `@rel` `@edges` `@xwalk` `@vocab` `@links` | `keyword.control.relationship` | blue / teal |
| `@cluster` | `keyword.control.cluster` | purple / violet |
| `@doc` `@status` `@phases` `@attrs` etc. | `keyword.control.governance` | green |
| `@def` `@props` `@include` `@rules` | `keyword.other.sigil` | cyan |
| `->` `<-` | `keyword.operator.outbound/inbound` | yellow |
| `<=>` | `keyword.operator.symmetric` | bright cyan |
| `=>` | `keyword.operator.crosswalk` | lime |
| `? inclusion criterion` | `markup.inserted` | green |
| `! exclusion criterion` | `markup.deleted` | red |
| `+ property member` | `variable.other.property` | teal |
| `[key:value, ...]` property bags | `support.type.property-name` / `string.unquoted.value` | orange key, white value |
| `skill:` `role:` `cluster:` namespaced refs | `entity.name.tag` | bold teal |
| `# comment` | `comment.line` | grey |
| `## agent summary` | `markup.heading` | bright white / bold |

## Installation (local dev)

```bash
# Option A — copy to VS Code extensions folder
cp -r sign-vscode ~/.vscode/extensions/career-highways.sign-language-1.0.0

# Option B — package as .vsix (requires vsce)
npm install -g @vscode/vsce
cd sign-lang/editor-support/vscode
vsce package
# → sign-language-1.0.0.vsix
# Install: code --install-extension sign-language-1.0.0.vsix
```

## Scope reference

Scopes follow standard TextMate conventions and work with any VS Code theme (Dark+, One Dark Pro, Tokyo Night, etc.).

## Files

| File | Purpose |
|---|---|
| `package.json` | VS Code extension manifest |
| `language-configuration.json` | Comment character (`#`), bracket pairs (`[]`), auto-closing |
| `syntaxes/sign.tmLanguage.json` | TextMate grammar — all sigil, operator, list, and namespace patterns |

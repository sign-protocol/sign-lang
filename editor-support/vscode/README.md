# SIGN Language Support for VS Code

**Authored and maintained by Career Highways | Dr. Joe Shepherd.**

Syntax highlighting and file icons for **SIGN** (Sigil Intelligence Graph Notation) `.sign` files.

**SIGN** is an open notation for **governed knowledge** — canonical definitions, numbered rules, constraints, relationships, clusters, and inference — expressed in a form AI agents can read and reason over at runtime. The notation is domain-agnostic: any rule-dense, audit-critical knowledge domain (workforce intelligence, healthcare compliance, brand and marketing governance, financial services risk policy) can be expressed in it.

The format is open (Apache-2.0). The authoritative corpus is governed by Career Highways.

> Spec: `sign-lang/spec/sign-v1.0.md` and `sign-lang/spec/sigil-reference.md`  
> Canon reference: SIGN-001 in `career-highways-canon/sign/SIGN-001.sign`

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

## File icon

`.sign` files render with a custom icon in the VS Code file explorer — a stylized `@` (the universal SIGN block sigil) with a Mint graph-node accent, in CH brand colors. The icon shows in any icon theme (Seti, Material, etc.) because it is contributed via `languages[].icon`, not as an icon-theme override. Two SVG variants ship in `icons/`: dark glyph for light themes, light glyph for dark themes.

## Installation (local dev)

### Option A — copy into the VS Code extensions folder (fastest)

macOS / Linux:

```bash
cp -r sign-lang/editor-support/vscode ~/.vscode/extensions/career-highways.sign-language-1.1.0
```

Windows (PowerShell):

```powershell
Copy-Item -Recurse -Force C:\CareerHighways\sign-lang\editor-support\vscode `
  "$env:USERPROFILE\.vscode\extensions\career-highways.sign-language-1.1.0"
```

Then reload VS Code: `Ctrl+Shift+P` → `Developer: Reload Window`.

### Option B — package as a .vsix (requires the vsce CLI)

```bash
npm install -g @vscode/vsce
cd sign-lang/editor-support/vscode
vsce package
```

`vsce package` produces `sign-language-1.1.0.vsix` in the current directory. Install it:

```bash
code --install-extension sign-language-1.1.0.vsix
```

## Scope reference

Scopes follow standard TextMate conventions and work with any VS Code theme (Dark+, One Dark Pro, Tokyo Night, etc.).

## Files

| File | Purpose |
|---|---|
| `package.json` | VS Code extension manifest |
| `language-configuration.json` | Comment character (`#`), bracket pairs (`[]`), auto-closing |
| `syntaxes/sign.tmLanguage.json` | TextMate grammar — all sigil, operator, list, and namespace patterns |
| `icons/sign-file-dark.svg` | File icon glyph for light themes (Midnight `@` + Mint node) |
| `icons/sign-file-light.svg` | File icon glyph for dark themes (Mint `@` + Mint node) |

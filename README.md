# SIGN — Sigil Intelligence Graph Notation

**Strongly typed · Human readable · Token optimized · For the agentic consumer**

JSON serializes data for machines. SIGN declares knowledge for agents.

---

## The Gap SIGN Fills

Every team building production agent systems eventually hits the same wall. How do you give agents access to your domain knowledge, business rules, and governance constraints — at scale, with governance, without burning your token budget — in a form agents can actually reason over rather than just retrieve?

Three partial answers exist today. None of them are complete.

| Existing approach | Why it falls short |
|---|---|
| JSON | Machine-readable but agent-hostile. 50–60% of tokens are structural noise. No relationship semantics. No inference. No constraints. |
| Raw markdown | Token-efficient but structurally untyped. An agent cannot distinguish a rule from a property from a constraint. No relationship model. |
| RDF / OWL | Semantically rigorous but adoption-hostile. Academic syntax, heavy toolchain, near-zero presence in LLM training data. |
| Prompt engineering | Fast but ungoverned. Unversioned, unauditable, non-reusable. Breaks at scale. |

The gap is not a format problem. It is a design-target problem. Every existing approach was designed for a different consumer. None were designed for the LLM agent context window as the primary unit of consumption.

SIGN was.

---

## What SIGN Is

SIGN is the contract layer between a governed knowledge graph and the agents that consume it. It expresses structure, relationships, inference rules, constraints, clusters, and provenance in a form agents can reason over — not just retrieve from.

### What SIGN Expresses

| Layer | What it covers |
|---|---|
| Structure | Entities, taxonomy, definitions, properties, attributes |
| Relationships | Schema-level declarations, instance graph edges, symmetric relationships, crosswalk mappings |
| Clusters | Named typed sets with threshold semantics — capability, co-occurrence, transition, AI impact |
| Inference rules | Governed rules that derive new facts from existing graph state |
| Constraints | Structural rules agents must enforce: mutex, requires, forbids |
| Vocabulary | Governed definitions of every relationship predicate — makes the graph self-describing |
| Provenance | Full derivation chains on every fact — asserted vs inferred, source, validation history |
| Context | Scope-bounded relationships that hold only under specific conditions |
| Governance | Lifecycle status, versioning, review cycles, authority, breaking change signals |

---

## Token Efficiency

The token comparison is real and measurable.

| Metric | SIGN | JSON | Reduction |
|---|---|---|---|
| Full knowledge document | 379 tokens | 978 tokens | 61% |
| 9-document index | 406 tokens | 818 tokens | 50% |

At 1000 agent invocations per day, that is roughly 400,000 tokens saved daily on index injection alone — before counting document retrievals.

---

## Two-Layer Delivery

SIGN delivers canon in two layers with different injection strategies.

| Layer | Purpose |
|---|---|
| **Layer 1 — Index** | Injected into every agent system prompt. ~400 tokens for a full corpus. Document identity, status, graph edges, one summary line per document. Orientation without rule text. |
| **Layer 2 — Full document** | Retrieved on demand via `get_canon_doc(id)`. Agents only pay for documents they actually need. |

---

## Quick Start

### 1 — Author in Markdown

```yaml
---
id: KNOW-001
title: My Knowledge Standard
doc_type: std
status: active
audiences: [agents]
related_docs: [KNOW-002]
agent_summary: >
  One-sentence agent-consumable summary of what this document governs.
---
```

### 2 — Compile

```bash
sign compile --source ./knowledge --output ./dist
# Produces:
# dist/canon-index.sign       Layer 1: always-injected index
# dist/canon-bundle.sign      Layer 2: full documents on demand
# dist/canon-manifest.json    Version, sha, doc count, timestamp
```

### 3 — Inject the Index

```js
const index = fs.readFileSync("dist/canon-index.sign", "utf8");
const systemPrompt = `
You operate under the following knowledge canon:
${index}
Call get_canon_doc(id) when you need full rule text for a document.
`;
```

### 4 — Wire Document Retrieval

```js
tools: [{
  name: "get_canon_doc",
  description: "Retrieve full SIGN document by ID",
  parameters: { id: { type: "string" } },
  handler: async ({ id }) => canonBundle.getDoc(id)
}]
```

---

## Documentation

- [spec/sign-v1.0.md](spec/sign-v1.0.md) — Complete specification
- [spec/sigil-reference.md](spec/sigil-reference.md) — Quick reference card
- [examples/](examples/) — Worked examples for all major constructs
- [validator/README.md](validator/README.md) — Validator specification for implementors

---

## Status

**v1.0 — April 2026**

Originated at [Career Highways](https://careerhighways.com). Open source under Apache 2.0.

SIGN is production-validated against a 9-document ontology corpus serving multiple agent workflows.

---

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md).

Reserved namespace extensions (`@pathway`, `@signal`, `@benchmark`, `min:/max:`) are tracked in the spec under `@reserved`. Propose new sigils via issue before implementing.

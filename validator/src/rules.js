'use strict';

const { BLOCK_RANK } = require('./parse');

// Each rule returns { errors: string[], warnings: string[] }
// Bundle-level rules receive all parsed docs from all files.
// Document-level rules receive a single doc and its filePath.

// ─── Rule: block order ───────────────────────────────────────────────────────
// Blocks within a document must follow the canonical order from spec §4.2.
// Multiple occurrences of the same sigil (cluster, infer) are fine; they must
// not regress to an earlier sigil.
function checkBlockOrder(doc, filePath) {
  const errors = [];
  let maxRankSeen = -1;
  let maxSigilSeen = null;

  for (const { sigil, lineNumber } of doc.blockSequence) {
    const rank = BLOCK_RANK[sigil] ?? BLOCK_RANK['doc']; // unknown sigils are warnings, not errors
    if (rank === undefined) continue; // reserved/unknown — handled elsewhere
    if (rank < maxRankSeen) {
      errors.push(
        `${filePath}:${lineNumber} block order violation — @${sigil} appears after @${maxSigilSeen} (must follow canonical order)`
      );
    } else {
      maxRankSeen = rank;
      maxSigilSeen = sigil;
    }
  }
  return { errors, warnings: [] };
}

// ─── Rule: vocab completeness ────────────────────────────────────────────────
// Every predicate used in @rel or @edges must be declared in @vocab within
// the same document.
function checkVocabCompleteness(doc, filePath) {
  const errors = [];
  const declared = new Set(doc.vocab);

  // Only outbound (-> and <=>) rel predicates need @vocab; inbound (<-) predicates
  // originate from other entity types and belong in their respective documents' @vocab.
  const relPredicates = doc.relDeclarations
    .filter(r => r.direction === '->' || r.direction === '<=>')
    .map(r => r.predicate);
  const edgePredicates = doc.edgeUsages.map(e => e.predicate);
  const used = new Set([...relPredicates, ...edgePredicates]);

  for (const pred of used) {
    if (!declared.has(pred)) {
      errors.push(
        `${filePath} vocab completeness — predicate "${pred}" used in @rel or @edges but not declared in @vocab`
      );
    }
  }
  return { errors, warnings: [] };
}

// ─── Rule: inference rule completeness ───────────────────────────────────────
// @infer rules must have when:, then:, confidence:, and src:.
// Missing required fields are build errors.
function checkInferCompleteness(doc, filePath) {
  const errors = [];
  for (const infer of doc.infers) {
    const missing = [];
    if (!infer.when)       missing.push('when:');
    if (!infer.then)       missing.push('then:');
    if (!infer.confidence) missing.push('confidence:');
    if (!infer.src)        missing.push('src:');
    if (missing.length) {
      errors.push(
        `${filePath}:${infer.lineNumber} @infer ${infer.id} — missing required fields: ${missing.join(', ')}`
      );
    }
  }
  return { errors, warnings: [] };
}

// ─── Rule: reference resolution ──────────────────────────────────────────────
// All @links targets must resolve to a known document ID in the bundle.
// All @cluster references in @edges must resolve to a declared @cluster.
// Rule references in @edges (rule:id) must resolve to a declared @infer.
//
// strictLinks: true (compile) = unresolved @links are errors
//              false (validate) = unresolved @links are warnings (partial bundle OK)
function checkRefResolution(doc, filePath, allDocIds, allClusterIds, allInferIds, strictLinks = false) {
  const errors = [];
  const warnings = [];

  // @links resolution
  for (const linkedId of doc.links) {
    if (!allDocIds.has(linkedId)) {
      const msg = `${filePath} @links "${linkedId}" — no document with this ID found in the bundle`;
      if (strictLinks) errors.push(msg);
      else warnings.push(msg);
    }
  }

  // @cluster refs in @edges
  for (const clusterId of doc.clusterRefs) {
    if (!allClusterIds.has(clusterId)) {
      warnings.push(
        `${filePath} @edges references @cluster:${clusterId} — not declared in any document in the bundle`
      );
    }
  }

  // rule: refs in @edges
  for (const ruleId of doc.ruleRefs) {
    if (!allInferIds.has(ruleId)) {
      warnings.push(
        `${filePath} @edges property rule:${ruleId} — no matching @infer rule found in the bundle`
      );
    }
  }

  return { errors, warnings };
}

// ─── Rule: symmetric edge bidirectionality ───────────────────────────────────
// Predicates declared as <=> in @rel must appear in both directions across
// the document set. Checked at bundle level.
function checkSymmetricEdges(allDocs) {
  const errors = [];

  // Collect all symmetric predicates and all edge directions
  const symmetricPredicates = new Set();
  for (const { doc } of allDocs) {
    for (const rel of doc.relDeclarations) {
      if (rel.direction === '<=>') symmetricPredicates.add(rel.predicate);
    }
  }

  if (symmetricPredicates.size === 0) return { errors, warnings: [] };

  // Build a map of predicate → Set of "subject→target" pairs
  const edgePairs = new Map();
  for (const { doc } of allDocs) {
    for (const edge of doc.edgeUsages) {
      if (!symmetricPredicates.has(edge.predicate)) continue;
      if (!edgePairs.has(edge.predicate)) edgePairs.set(edge.predicate, new Set());
      edgePairs.get(edge.predicate).add(`${edge.subject}→${edge.target}`);
    }
  }

  for (const [pred, pairs] of edgePairs) {
    for (const pair of pairs) {
      const [a, b] = pair.split('→');
      const reverse = `${b}→${a}`;
      if (!pairs.has(reverse)) {
        errors.push(
          `symmetric edge violation — predicate "${pred}" declared <=> but "${b} ${pred} ${a}" not found (reverse of "${a} ${pred} ${b}")`
        );
      }
    }
  }

  return { errors, warnings: [] };
}

// ─── Rule: index budget ───────────────────────────────────────────────────────
// The Layer 1 index must not exceed ~400 tokens.
// Approximation: chars / 4 (standard estimate for mixed English + identifiers).
// Only active documents contribute to the index.
// Each active @doc must have exactly one ## summary line.
const INDEX_TOKEN_BUDGET = 400;

function checkIndexBudget(allDocs) {
  const errors = [];
  const warnings = [];

  let indexChars = 0;
  const activeDocs = allDocs.filter(({ doc }) =>
    doc.id && doc.status === 'active'
  );

  for (const { doc } of activeDocs) {
    if (!doc.summaryLine) {
      warnings.push(
        `${doc.id} — active document has no ## summary line; required when compiled into Layer 1 index`
      );
    }
    // Estimate chars for this doc's index entry:
    // @doc line + @links line (if any) + ## line
    const docLine   = `@doc ${doc.id} [${doc.type}, ${doc.status}, ${doc.audiences}] ${doc.version || 'v1'}`;
    const linksLine = doc.links.length ? `@links ${doc.links.join(',')}` : '';
    const summary   = doc.summaryLine ? `## ${doc.summaryLine}` : '';
    indexChars += docLine.length + linksLine.length + summary.length + 3; // +3 for newlines
  }

  const estimatedTokens = Math.ceil(indexChars / 4);
  if (estimatedTokens > INDEX_TOKEN_BUDGET) {
    errors.push(
      `index budget exceeded — estimated ${estimatedTokens} tokens (budget: ${INDEX_TOKEN_BUDGET}); reduce summary lines or doc count`
    );
  } else {
    // Informational
    warnings.push(
      `index budget: ~${estimatedTokens} / ${INDEX_TOKEN_BUDGET} tokens (${activeDocs.length} active documents)`
    );
  }

  return { errors, warnings };
}

// ─── Rule: status enforcement ─────────────────────────────────────────────────
// Documents with status inactive or deprecated must not be referenced by @links
// in active documents (generates a warning, not an error per spec §10.2).
function checkStatusEnforcement(allDocs) {
  const warnings = [];
  const inactiveDocs = new Set(
    allDocs
      .filter(({ doc }) => doc.id && (doc.status === 'inactive' || doc.status === 'deprecated'))
      .map(({ doc }) => doc.id)
  );

  for (const { doc, filePath } of allDocs) {
    if (doc.status !== 'active') continue;
    for (const linkedId of doc.links) {
      if (inactiveDocs.has(linkedId)) {
        warnings.push(
          `${filePath} @links "${linkedId}" — referenced document is ${allDocs.find(d => d.doc.id === linkedId)?.doc.status}; excluded from agent bundle`
        );
      }
    }
  }

  return { errors: [], warnings };
}

// ─── Bundle-level runner ──────────────────────────────────────────────────────
// allDocs: { doc, filePath }[]
// options.strictLinks: if true, unresolved @links are errors (used by compile)
function runAllRules(allDocs, options = {}) {
  const { strictLinks = false } = options;
  const errors = [];
  const warnings = [];

  // Build cross-document lookup sets
  const allDocIds     = new Set(allDocs.map(({ doc }) => doc.id).filter(Boolean));
  const allClusterIds = new Set(allDocs.flatMap(({ doc }) => doc.clusters.map(c => c.id)));
  const allInferIds   = new Set(allDocs.flatMap(({ doc }) => doc.infers.map(i => i.id)));

  for (const { doc, filePath } of allDocs) {
    const results = [
      checkBlockOrder(doc, filePath),
      checkVocabCompleteness(doc, filePath),
      checkInferCompleteness(doc, filePath),
      checkRefResolution(doc, filePath, allDocIds, allClusterIds, allInferIds, strictLinks),
    ];
    for (const r of results) {
      errors.push(...r.errors);
      warnings.push(...r.warnings);
    }
  }

  const bundleResults = [
    checkSymmetricEdges(allDocs),
    checkIndexBudget(allDocs),
    checkStatusEnforcement(allDocs),
  ];
  for (const r of bundleResults) {
    errors.push(...r.errors);
    warnings.push(...r.warnings);
  }

  return { errors, warnings };
}

module.exports = {
  checkBlockOrder,
  checkVocabCompleteness,
  checkInferCompleteness,
  checkRefResolution,
  checkSymmetricEdges,
  checkIndexBudget,
  checkStatusEnforcement,
  runAllRules,
};

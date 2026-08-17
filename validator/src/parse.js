'use strict';

// Canonical block order from spec §4.2 (currency/sources added in v1.1)
const BLOCK_ORDER = [
  'doc', 'links', 'anchor', 'cycle', 'reviewed', 'vocab', 'def', 'props',
  'include', 'exclude', 'rules', 'boundary', 'constraints',
  'cluster', 'infer', 'rel', 'edges', 'xwalk',
  'attrs', 'disallowed', 'phases', 'status', 'currency', 'sources', 'reserved',
];

const BLOCK_RANK = Object.fromEntries(BLOCK_ORDER.map((s, i) => [s, i]));

// Namespaced ID pattern: word:anything or @cluster:anything
const NS_ID_RE = /^[@\w][\w-]*:.+/;

// @doc WFI-008 [std, active, agents+employees] v2 sha:7d4a1f
function parseDocHeader(line) {
  const m = line.match(/^@doc\s+(\S+)\s+\[([^\]]+)\](?:\s+(v\d+))?(?:\s+sha:(\S+))?/);
  if (!m) return null;
  const parts = m[2].split(',').map(s => s.trim());
  return {
    id:        m[1],
    type:      parts[0] || null,
    status:    parts[1] || null,
    audiences: parts[2] || null,
    version:   m[3] || null,
    sha:       m[4] || null,
  };
}

// @cluster capability:workforce-intelligence [type:capability, threshold:all]
function parseClusterSigil(rest) {
  const m = rest.trim().match(/^(\S+)(?:\s+\[([^\]]*)\])?/);
  if (!m) return { id: rest.trim(), type: null };
  const typeM = (m[2] || '').match(/type:([\w-]+)/);
  return { id: m[1], type: typeM ? typeM[1] : null };
}

// @anchor [repo:platform, vcs:git]                    (block form — patterns on following lines)
// @anchor services/billing-core/**, libs/money/**     (compact form — Layer-1 index only)
// Returns { source: {key:value}, compactPatterns: string[] }. Patterns are opaque (§1).
function parseAnchorSigil(rest) {
  const source = {};
  let remainder = rest.trim();
  if (remainder.startsWith('[')) {
    const end = remainder.indexOf(']');
    if (end !== -1) {
      const body = remainder.slice(1, end);
      for (const kv of body.split(',')) {
        const idx = kv.indexOf(':');
        if (idx === -1) continue;
        const key = kv.slice(0, idx).trim();
        const val = kv.slice(idx + 1).trim();
        if (key) source[key] = val;
      }
      remainder = remainder.slice(end + 1).trim();
    }
  }
  const compactPatterns = remainder
    ? remainder.split(',').map(s => s.trim()).filter(Boolean)
    : [];
  return { source, compactPatterns };
}

// Determine if a content line within @edges is an edge declaration
// Pattern: subject predicate target [optional props]
// subject/target are namespaced IDs; predicate is a plain word
function parseEdgeLine(line) {
  const trimmed = line.trimStart();
  const tokens = trimmed.split(/\s+/);
  if (tokens.length < 3) return null;
  const [subject, predicate, target] = tokens;
  if (!NS_ID_RE.test(subject)) return null;
  if (!/^\w[\w-]*$/.test(predicate)) return null;
  if (!NS_ID_RE.test(target) && !target.startsWith('@cluster:')) return null;
  return { subject, predicate, target };
}

// Extract predicates and direction from @rel content lines
// depends_on    -> Skill [conf:high]
// adjacent_to   <=> Skill
// requires      <- Role
function parseRelLine(line) {
  const m = line.match(/^\s+(\w[\w-]*)\s+(->|<-|<=>)\s+\S+/);
  if (!m) return null;
  return { predicate: m[1], direction: m[2] };
}

// Extract @infer fields from block content lines
function extractInferFields(lines) {
  const fields = { when: false, then: false, confidence: false, src: false, appliesTo: false };
  for (const line of lines) {
    const t = line.trimStart();
    if (t.startsWith('when:'))       fields.when = true;
    if (t.startsWith('then:'))       fields.then = true;
    if (t.startsWith('confidence:')) fields.confidence = true;
    if (t.startsWith('src:'))        fields.src = true;
    if (t.startsWith('applies-to:')) fields.appliesTo = true;
  }
  return fields;
}

// Extract rule: references from property bags in @edges content
function extractRuleRefs(lines) {
  const refs = [];
  for (const line of lines) {
    const m = line.match(/rule:([\w-]+)/g);
    if (m) refs.push(...m.map(r => r.replace('rule:', '')));
  }
  return refs;
}

// Extract @cluster: references from @edges content lines
function extractClusterRefs(lines) {
  const refs = [];
  for (const line of lines) {
    const m = line.match(/@cluster:([\w:/-]+)/g);
    if (m) refs.push(...m.map(r => r.replace('@cluster:', '')));
  }
  return refs;
}

/**
 * Parse a single .sign file.
 * Returns { filePath, documents: ParsedDoc[], parseErrors: string[] }
 *
 * ParsedDoc: {
 *   id, type, status, audiences, version, sha,
 *   lineNumber, summaryLine,
 *   links: string[],
 *   blockSequence: { sigil, lineNumber }[],
 *   vocab: string[],
 *   relDeclarations: { predicate, direction }[],
 *   edgeUsages: { predicate, subject, target, lineNumber }[],
 *   clusterRefs: string[],
 *   ruleRefs: string[],
 *   infers: { id, lineNumber, when, then, confidence, src, appliesTo }[],
 *   clusters: { id, type, lineNumber }[],
 * }
 */
function parseFile(filePath, content) {
  const lines = content.split('\n');
  const parseErrors = [];
  const documents = [];

  let currentDoc = null;
  let currentSigil = null;   // e.g. 'vocab', 'rel', 'edges', 'infer'
  let currentSigilId = null; // id portion from sigil line (e.g. rule-id for @infer)
  let currentLines = [];     // accumulated content lines for current block
  let currentLineNo = 0;

  // For fragment files (no @doc header), create an implicit document on demand
  function ensureDoc(lineNumber) {
    if (!currentDoc) {
      currentDoc = makeEmptyDoc(null, null, null, null, null, null, lineNumber);
      documents.push(currentDoc);
    }
  }

  function makeEmptyDoc(id, type, status, audiences, version, sha, lineNumber) {
    return {
      id, type, status, audiences, version, sha,
      lineNumber,
      summaryLine: null,
      links: [],
      anchor: null,        // single AnchorNode: { source, include[], exclude[], compact, lineNumber }
      xwalkSources: [],    // source prefixes seen in @xwalk (e.g. "okf"), for ANCHOR005
      blockSequence: [],
      vocab: [],
      relDeclarations: [],
      edgeUsages: [],
      clusterRefs: [],
      ruleRefs: [],
      infers: [],
      clusters: [],
    };
  }

  function startDoc(header, lineNumber) {
    finalizeBlock();
    currentDoc = makeEmptyDoc(
      header.id, header.type, header.status,
      header.audiences, header.version, header.sha,
      lineNumber
    );
    documents.push(currentDoc);
    currentSigil = 'doc';
    currentSigilId = null;
    currentLines = [];
  }

  function recordBlock(sigil, lineNumber) {
    if (currentDoc) {
      currentDoc.blockSequence.push({ sigil, lineNumber });
    }
  }

  function finalizeBlock() {
    if (!currentDoc || !currentSigil) return;
    processBlock(currentDoc, currentSigil, currentSigilId, currentLines, currentLineNo);
    currentLines = [];
  }

  function startBlock(sigil, sigilId, lineNumber) {
    finalizeBlock();
    currentSigil = sigil;
    currentSigilId = sigilId;
    recordBlock(sigil, lineNumber);
  }

  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i];
    const line = raw.trimEnd();
    currentLineNo = i + 1;

    // Blank lines
    if (/^\s*$/.test(line)) continue;

    // Agent summary line (## inside index @doc) — must check before comment check
    if (line.startsWith('## ')) {
      if (currentDoc) currentDoc.summaryLine = line.slice(3).trim();
      continue;
    }

    // Comments (single # — not ##)
    if (line.trimStart().startsWith('#')) continue;

    // Sigil line
    if (line.startsWith('@')) {
      const spaceIdx = line.indexOf(' ');
      const sigilFull = spaceIdx === -1 ? line.slice(1) : line.slice(1, spaceIdx);
      const rest      = spaceIdx === -1 ? '' : line.slice(spaceIdx + 1).trim();

      if (sigilFull === 'doc') {
        const header = parseDocHeader(line);
        if (!header) {
          parseErrors.push(`line ${i + 1}: malformed @doc header`);
          continue;
        }
        startDoc(header, i + 1);
        continue;
      }

      if (sigilFull === 'links') {
        ensureDoc(i + 1);
        startBlock('links', null, i + 1);
        currentDoc.links = rest.split(',').map(s => s.trim()).filter(Boolean);
        continue;
      }

      if (sigilFull === 'anchor') {
        ensureDoc(i + 1);
        if (currentDoc.anchor) {
          // Coverage is a single set per identity (§1.3). A second block is a parse error.
          parseErrors.push(`line ${i + 1}: anchor must be singular`);
        }
        const { source, compactPatterns } = parseAnchorSigil(rest);
        startBlock('anchor', null, i + 1);
        if (!currentDoc.anchor) {
          currentDoc.anchor = {
            source,
            include: compactPatterns.slice(),  // compact list; empty in block form
            exclude: [],
            compact: compactPatterns.length > 0,
            lineNumber: i + 1,
          };
        }
        continue;
      }

      if (sigilFull === 'canon') {
        // Bundle header — not a doc-level block, just skip
        continue;
      }

      if (sigilFull === 'infer') {
        ensureDoc(i + 1);
        startBlock('infer', rest, i + 1);
        continue;
      }

      if (sigilFull === 'cluster') {
        ensureDoc(i + 1);
        const clusterInfo = parseClusterSigil(rest);
        startBlock('cluster', clusterInfo.id, i + 1);
        currentDoc.clusters.push({ id: clusterInfo.id, type: clusterInfo.type, lineNumber: i + 1 });
        continue;
      }

      if (sigilFull === 'edges') {
        ensureDoc(i + 1);
        startBlock('edges', rest, i + 1);
        continue;
      }

      if (sigilFull === 'attrs') {
        ensureDoc(i + 1);
        startBlock('attrs', null, i + 1);
        continue;
      }

      // All other sigils: cycle, reviewed, vocab, def, props, include, exclude,
      // rules, boundary, constraints, rel, xwalk, disallowed, phases, status, reserved
      ensureDoc(i + 1);
      startBlock(sigilFull, null, i + 1);
      continue;
    }

    // Content line — belongs to current block
    currentLines.push({ text: line, lineNumber: i + 1 });
  }

  finalizeBlock();

  return { filePath, documents, parseErrors };
}

function processBlock(doc, sigil, sigilId, lines, endLineNo) {
  const rawLines = lines.map(l => l.text);

  switch (sigil) {
    case 'anchor':
      // Block form: collect "+" includes and "!" excludes, preserving source order.
      // Compact form leaves no content lines, so nothing is appended here.
      if (doc.anchor) {
        for (const { text } of lines) {
          const t = text.trimStart();
          if (t.startsWith('+')) {
            const pat = t.slice(1).trim();
            if (pat) doc.anchor.include.push(pat);
          } else if (t.startsWith('!')) {
            const pat = t.slice(1).trim();
            if (pat) doc.anchor.exclude.push(pat);
          }
        }
      }
      break;

    case 'xwalk':
      // Capture the source prefix of each mapping (e.g. "okf" from okf:path => ...) for ANCHOR005.
      for (const { text } of lines) {
        const t = text.trimStart();
        if (!t || t.startsWith('#')) continue;
        const m = t.match(/^([\w-]+):/);
        if (m) doc.xwalkSources.push(m[1]);
      }
      break;

    case 'vocab':
      for (const { text } of lines) {
        const t = text.trimStart();
        // '::' is a v1.1 group label — named structure, not a predicate entry.
        if (!t || t.startsWith('#') || t.startsWith('::')) continue;
        const pred = t.split(/\s+/)[0];
        if (pred && /^\w[\w-]*$/.test(pred)) doc.vocab.push(pred);
      }
      break;

    case 'rel':
      for (const { text } of lines) {
        const decl = parseRelLine(text);
        if (decl) doc.relDeclarations.push(decl);
      }
      break;

    case 'edges':
      // Join continuation lines (lines starting with [ or that are clearly props)
      const joined = joinContinuations(lines);
      for (const { text, lineNumber } of joined) {
        const edge = parseEdgeLine(text);
        if (edge) {
          doc.edgeUsages.push({ ...edge, lineNumber });
          // Cluster refs in target
          if (edge.target.startsWith('@cluster:')) {
            doc.clusterRefs.push(edge.target.replace('@cluster:', ''));
          }
        }
        // Rule refs in property bags anywhere in the line
        const ruleRefs = text.match(/rule:([\w-]+)/g);
        if (ruleRefs) doc.ruleRefs.push(...ruleRefs.map(r => r.replace('rule:', '')));
        // Cluster refs inside property bags
        const clusterRefs = text.match(/@cluster:([\w:/-]+)/g);
        if (clusterRefs) {
          doc.clusterRefs.push(...clusterRefs.map(r => r.replace('@cluster:', '')));
        }
      }
      break;

    case 'infer':
      const fields = extractInferFields(rawLines);
      doc.infers.push({
        id:         sigilId,
        lineNumber: lines[0] ? lines[0].lineNumber : endLineNo,
        ...fields,
      });
      break;

    default:
      break;
  }
}

// Join lines where a property bag [...] opens on one line and closes on a later line
function joinContinuations(lines) {
  const result = [];
  let current = null;
  let openCount = 0;

  for (const { text, lineNumber } of lines) {
    if (!text.trimStart() || text.trimStart().startsWith('#')) continue;

    if (current === null) {
      current = { text, lineNumber };
      openCount = countBrackets(text);
    } else {
      current.text += ' ' + text.trimStart();
      openCount += countBrackets(text);
    }

    if (openCount <= 0) {
      result.push(current);
      current = null;
      openCount = 0;
    }
  }

  if (current) result.push(current);
  return result;
}

function countBrackets(text) {
  let count = 0;
  for (const ch of text) {
    if (ch === '[') count++;
    if (ch === ']') count--;
  }
  return count;
}

// Discover and parse all .sign files under a directory (or a single file)
const fs   = require('node:fs');
const path = require('node:path');

function discoverFiles(sourcePath) {
  const stat = fs.statSync(sourcePath);
  if (stat.isFile()) return [sourcePath];
  const found = [];
  function walk(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (entry.name.endsWith('.sign')) found.push(full);
    }
  }
  walk(sourcePath);
  return found;
}

function parseSource(sourcePath) {
  const files = discoverFiles(sourcePath);
  const results = [];
  for (const filePath of files) {
    const content = fs.readFileSync(filePath, 'utf8');
    results.push(parseFile(filePath, content));
  }
  return results;
}

module.exports = { parseFile, parseSource, BLOCK_ORDER, BLOCK_RANK };

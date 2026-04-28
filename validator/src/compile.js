'use strict';

const fs     = require('node:fs');
const path   = require('node:path');
const crypto = require('node:crypto');
const { parseSource } = require('./parse');
const { runAllRules } = require('./rules');

/**
 * Compile all .sign files under sourcePath into the 4 standard artifacts
 * under outputPath:
 *   canon-index.sign         — Layer 1: active docs only (@doc + @links + ##)
 *   canon-bundle.sign        — Layer 2: full content of active docs
 *   canon-manifest.json      — version, sha, doc count, build timestamp
 *   canon-bundle.sign.sha256 — integrity file
 *
 * Returns { ok, errors, warnings, summary }
 */
async function compile(sourcePath, outputPath) {
  const errors = [];
  const warnings = [];

  // ── 1. Parse ──────────────────────────────────────────────────────────────
  let parsed;
  try {
    parsed = parseSource(sourcePath);
  } catch (err) {
    return { ok: false, errors: [`cannot read source: ${err.message}`], warnings, summary: '' };
  }

  for (const file of parsed) {
    for (const e of file.parseErrors) {
      errors.push(`${file.filePath}: ${e}`);
    }
  }

  const allDocs = parsed.flatMap(file =>
    file.documents.map(doc => ({ doc, filePath: file.filePath }))
  );

  // ── 2. Validate ───────────────────────────────────────────────────────────
  const validationResult = runAllRules(allDocs, { strictLinks: true });
  errors.push(...validationResult.errors);
  warnings.push(...validationResult.warnings);

  if (errors.length > 0) {
    return {
      ok: false,
      errors,
      warnings,
      summary: `compile aborted — ${errors.length} error(s) must be resolved`,
    };
  }

  // ── 3. Filter to active documents ─────────────────────────────────────────
  const activeDocs = allDocs.filter(({ doc }) => doc.id && doc.status === 'active');

  // ── 4. Build index (Layer 1) ──────────────────────────────────────────────
  const indexLines = [
    `# SIGN Canon Index — compiled ${new Date().toISOString()}`,
    `@canon v1.0`,
    '',
  ];

  for (const { doc } of activeDocs) {
    const docLine = `@doc ${doc.id} [${doc.type}, ${doc.status}, ${doc.audiences}] ${doc.version || 'v1'}`;
    indexLines.push(docLine);
    if (doc.links.length) {
      indexLines.push(`@links ${doc.links.join(',')}`);
    }
    if (doc.summaryLine) {
      indexLines.push(`## ${doc.summaryLine}`);
    }
    indexLines.push('');
  }

  const indexContent = indexLines.join('\n');

  // ── 5. Build bundle (Layer 2) ─────────────────────────────────────────────
  // Re-read the source files and emit the full content of each active doc.
  // We use the raw file content for each file that contributes active docs,
  // rather than reconstructing from the parsed AST, to preserve exact authoring.
  const activeIds = new Set(activeDocs.map(({ doc }) => doc.id));
  const bundleParts = [];

  for (const file of parsed) {
    const hasActiveDocs = file.documents.some(d => d.id && activeIds.has(d.id));
    if (!hasActiveDocs) continue;

    // Re-read and annotate the raw file content
    const raw = fs.readFileSync(file.filePath, 'utf8');
    bundleParts.push(`# --- ${path.basename(file.filePath)} ---`);
    bundleParts.push(raw.trimEnd());
    bundleParts.push('');
  }

  const bundleContent = bundleParts.join('\n');

  // ── 6. Hash ───────────────────────────────────────────────────────────────
  const sha256 = crypto.createHash('sha256').update(bundleContent, 'utf8').digest('hex');
  const shortSha = sha256.slice(0, 6);

  // Embed sha in index header
  const finalIndex = indexContent.replace('@canon v1.0', `@canon v1.0 sha:${shortSha}`);

  // ── 7. Write artifacts ────────────────────────────────────────────────────
  try {
    fs.mkdirSync(outputPath, { recursive: true });
  } catch (err) {
    return { ok: false, errors: [`cannot create output directory: ${err.message}`], warnings, summary: '' };
  }

  const manifest = {
    version:       '1.0',
    sha256,
    shortSha,
    docCount:      activeDocs.length,
    buildTimestamp: new Date().toISOString(),
    documents:     activeDocs.map(({ doc }) => ({
      id:       doc.id,
      type:     doc.type,
      status:   doc.status,
      version:  doc.version,
    })),
  };

  fs.writeFileSync(path.join(outputPath, 'canon-index.sign'),    finalIndex,                   'utf8');
  fs.writeFileSync(path.join(outputPath, 'canon-bundle.sign'),   bundleContent,                'utf8');
  fs.writeFileSync(path.join(outputPath, 'canon-manifest.json'), JSON.stringify(manifest, null, 2), 'utf8');
  fs.writeFileSync(path.join(outputPath, 'canon-bundle.sign.sha256'), sha256 + '\n',           'utf8');

  const summary = `pass — compiled ${activeDocs.length} active document(s) → ${outputPath}`;
  return { ok: true, errors, warnings, summary };
}

module.exports = { compile };

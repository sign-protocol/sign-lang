'use strict';

const { parseSource } = require('./parse');
const { runAllRules } = require('./rules');

/**
 * Validate all .sign files under sourcePath.
 * Returns { ok: boolean, errors: string[], warnings: string[], summary: string }
 */
async function validate(sourcePath) {
  const errors = [];
  const warnings = [];

  let parsed;
  try {
    parsed = parseSource(sourcePath);
  } catch (err) {
    return { ok: false, errors: [`cannot read source: ${err.message}`], warnings, summary: '' };
  }

  // Collect parse errors
  for (const file of parsed) {
    for (const e of file.parseErrors) {
      errors.push(`${file.filePath}: ${e}`);
    }
  }

  // Flatten to { doc, filePath } pairs
  const allDocs = parsed.flatMap(file =>
    file.documents.map(doc => ({ doc, filePath: file.filePath }))
  );

  if (allDocs.length === 0) {
    warnings.push(`no documents found in ${sourcePath}`);
    return { ok: true, errors, warnings, summary: 'pass — 0 documents' };
  }

  const result = runAllRules(allDocs);
  errors.push(...result.errors);
  warnings.push(...result.warnings);

  const docCount  = allDocs.filter(({ doc }) => doc.id).length;
  const fileCount = parsed.length;
  const ok = errors.length === 0;
  const summary = ok
    ? `pass — ${docCount} documents across ${fileCount} file(s)`
    : `fail — ${errors.length} error(s), ${warnings.length} warning(s)`;

  return { ok, errors, warnings, summary };
}

module.exports = { validate };

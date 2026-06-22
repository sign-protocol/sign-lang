#!/usr/bin/env node
'use strict';

const { execFileSync } = require('node:child_process');
const { validate } = require('../src/validate');
const { compile } = require('../src/compile');
const { parseSource } = require('../src/parse');
const { computeCoverage } = require('../src/coverage');
const { computeDrift } = require('../src/drift');
const { diffCorpus } = require('../src/diff');

const args = process.argv.slice(2);
const command = args[0];

function arg(flag) {
  const i = args.indexOf(flag);
  return i !== -1 ? args[i + 1] : null;
}

// First non-flag operand after the command (e.g. the <corpus> positional).
function positional() {
  for (let i = 1; i < args.length; i++) {
    if (args[i].startsWith('--')) { i++; continue; }
    return args[i];
  }
  return null;
}

function usage() {
  console.error([
    'Usage:',
    '  sign validate --source <path>',
    '  sign compile  --source <path> --output <path>',
    '  sign coverage <corpus> --root <repo-root> [--format json]',
    '  sign drift    <corpus> --root <repo-root> --since <git-ref>',
    '  sign diff     <corpus> --root <repo-root> --since <git-ref>',
  ].join('\n'));
  process.exit(1);
}

// Parse a corpus into the { doc, filePath }[] shape the analysis modules expect.
function loadDocs(sourcePath) {
  return parseSource(sourcePath).flatMap(file =>
    file.documents.map(doc => ({ doc, filePath: file.filePath }))
  );
}

async function main() {
  if (command === 'validate') {
    const source = arg('--source');
    if (!source) usage();
    const result = await validate(source);
    printResult(result);
    process.exit(result.ok ? 0 : 1);

  } else if (command === 'compile') {
    const source = arg('--source');
    const output = arg('--output');
    if (!source || !output) usage();
    const result = await compile(source, output);
    printResult(result);
    process.exit(result.ok ? 0 : 1);

  } else if (command === 'coverage') {
    const corpus = positional();
    const root = arg('--root');
    if (!corpus || !root) usage();
    const report = computeCoverage(loadDocs(corpus), root);
    if (arg('--format') === 'json') {
      console.log(JSON.stringify(report, null, 2));
    } else {
      console.log(`governed:   ${(report.governed * 100).toFixed(1)}%`);
      console.log(`ungoverned: ${report.ungoverned.length ? report.ungoverned.join(', ') : '(none)'}`);
      if (report.overlaps.length) {
        console.log('overlaps:');
        for (const o of report.overlaps) console.log(`  ${o.artifact} — ${o.docs.join(', ')}`);
      }
    }
    process.exit(0);

  } else if (command === 'drift') {
    const corpus = positional();
    const root = arg('--root');
    const since = arg('--since');
    if (!corpus || !root || !since) usage();
    const result = computeDrift(loadDocs(corpus), root, since);
    if (result.error) {
      console.error(`error ${result.error}`);
      process.exit(2);
    }
    if (result.driftSignals.length === 0) {
      console.log(`pass — no drift across ${result.checked} anchored document(s)`);
      process.exit(0);
    }
    for (const s of result.driftSignals) {
      console.warn(`drift ${s.docId} — source changed but doc did not: ${s.changedArtifacts.join(', ')}`);
    }
    console.error(`fail — ${result.driftSignals.length} document(s) drifted`);
    process.exit(1);

  } else if (command === 'diff') {
    const corpus = positional();
    const root = arg('--root');
    const since = arg('--since');
    if (!corpus || !since) usage();
    runDiff(corpus, root, since);

  } else {
    usage();
  }
}

// `sign diff` compares the corpus at <since> against the working tree, classifying each doc's
// change (additive / coverage-narrowing / meaning-breaking) and surfacing drift signals.
function runDiff(corpus, root, since) {
  const after = loadDocs(corpus)
    .filter(({ doc }) => doc.id)
    .map(({ doc, filePath }) => ({ id: doc.id, raw: readFile(filePath) }));

  let before;
  try {
    before = loadDocsAtRef(corpus, since, root);
  } catch (err) {
    console.error(`error cannot read corpus at ${since}: ${err.message}`);
    process.exit(2);
  }

  const { changes, driftSignals } = diffCorpus(before, after, root || null);
  for (const c of changes) {
    if (c.changeClass !== 'additive') console.log(`${c.changeClass.padEnd(18)} ${c.docId}`);
  }
  if (driftSignals.length) {
    console.log('coverage:');
    for (const s of driftSignals) {
      const affected = s.affectedArtifacts.length ? ` (${s.affectedArtifacts.length} artifact(s))` : '';
      console.log(`  drift ${s.docId} dropped: ${s.droppedPatterns.join(', ')}${affected}`);
    }
  }
  const breaking = changes.some(c => c.changeClass === 'meaning-breaking');
  process.exit(breaking ? 1 : 0);
}

function readFile(filePath) {
  return require('node:fs').readFileSync(filePath, 'utf8');
}

// Reconstruct each doc's content as it was at <ref> via `git show <ref>:<repo-rel-path>`.
function loadDocsAtRef(corpus, ref, root) {
  const path = require('node:path');
  const docs = loadDocs(corpus).filter(({ doc }) => doc.id);
  const repoRoot = root || process.cwd();
  const out = [];
  for (const { doc, filePath } of docs) {
    const rel = path.relative(repoRoot, path.resolve(filePath)).split(path.sep).join('/');
    let raw = '';
    try {
      raw = execFileSync('git', ['-C', repoRoot, 'show', `${ref}:${rel}`], { encoding: 'utf8' });
    } catch {
      raw = ''; // file did not exist at <ref> — treated as a new doc (additive)
    }
    out.push({ id: doc.id, raw });
  }
  return out;
}

function printResult(result) {
  for (const w of result.warnings) console.warn(`warn  ${w}`);
  for (const e of result.errors)   console.error(`error ${e}`);
  if (result.ok) {
    console.log(result.summary || 'pass');
  } else {
    console.error('fail');
  }
}

main().catch(err => {
  console.error(err.message);
  process.exit(2);
});

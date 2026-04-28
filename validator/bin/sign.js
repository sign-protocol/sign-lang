#!/usr/bin/env node
'use strict';

const { validate } = require('../src/validate');
const { compile } = require('../src/compile');

const args = process.argv.slice(2);
const command = args[0];

function arg(flag) {
  const i = args.indexOf(flag);
  return i !== -1 ? args[i + 1] : null;
}

function usage() {
  console.error([
    'Usage:',
    '  sign validate --source <path>',
    '  sign compile  --source <path> --output <path>',
  ].join('\n'));
  process.exit(1);
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

  } else {
    usage();
  }
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

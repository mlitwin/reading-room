#!/usr/bin/env node
// CLI: npm run validate -- --suite=<grammar|lexicon|glossary|concordance|all>
//                          [--data=<json-path>]
//
// In Phase 0.5 there is no canonical data yet (grammar.json, lexicon.json,
// etc. don't exist in the repo). The --data flag is required for now; later
// phases will default it to the canonical paths under content/_language/.

import { readFile } from 'node:fs/promises';
import { parseArgs } from 'node:util';

import { runSuite, formatReport } from './validate/runner.js';
import { grammarInvariants } from './validate/grammar.invariants.js';
import { lexiconInvariants } from './validate/lexicon.invariants.js';
import { glossaryInvariants } from './validate/glossary.invariants.js';
import { concordanceInvariants } from './validate/concordance.invariants.js';

const SUITES = {
  grammar: { invariants: grammarInvariants, needs: [] },
  lexicon: { invariants: lexiconInvariants, needs: ['grammar'] },
  glossary: { invariants: glossaryInvariants, needs: ['grammar', 'lexicon'] },
  concordance: { invariants: concordanceInvariants, needs: ['grammar', 'glossary', 'lexicon'] },
};

async function loadJson(path) {
  const text = await readFile(path, 'utf8');
  return JSON.parse(text);
}

async function main() {
  const { values } = parseArgs({
    options: {
      suite: { type: 'string' },
      data: { type: 'string' },
      grammar: { type: 'string' },
      lexicon: { type: 'string' },
      glossary: { type: 'string' },
      concordance: { type: 'string' },
      'source-tokens': { type: 'string' },
      'max-examples': { type: 'string' },
    },
  });

  const suiteName = values.suite;
  if (!suiteName || !SUITES[suiteName]) {
    console.error(`Usage: validate --suite=<${Object.keys(SUITES).join('|')}> --data=<path> [--grammar=<path> ...]`);
    process.exit(2);
  }

  const suite = SUITES[suiteName];
  const dataPath = values.data ?? values[suiteName];
  if (!dataPath) {
    console.error(`error: --data (or --${suiteName}) is required`);
    process.exit(2);
  }

  const data = await loadJson(dataPath);
  const ctx = {};
  for (const dep of suite.needs) {
    const depPath = values[dep];
    if (!depPath) {
      console.error(`error: suite "${suiteName}" requires --${dep}=<path>`);
      process.exit(2);
    }
    ctx[dep] = await loadJson(depPath);
  }
  if (values['source-tokens']) {
    ctx.sourceTokens = await loadJson(values['source-tokens']);
  }

  const report = runSuite(suiteName, suite.invariants, data, ctx);
  const max = values['max-examples'] ? Number(values['max-examples']) : undefined;
  console.log(formatReport(report, { maxExamples: max }));
  process.exit(report.passed ? 0 : 1);
}

main().catch((err) => {
  console.error(err.stack ?? err);
  process.exit(2);
});

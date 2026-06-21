#!/usr/bin/env node
// Validation CLI.
//
//   npm run validate                                    # all suites, canonical paths
//   npm run validate -- --suite=lexicon                 # one suite, canonical paths
//   npm run validate -- --suite=grammar --data=<path>   # one suite, custom data path
//
// Canonical paths (defaults when --data / --grammar / --lexicon / --glossary /
// --concordance / --source-tokens are omitted):
//
//   grammar     content/_language/latin/grammar.json
//   lexicon     content/_language/latin/lexicon.json
//   glossary    docs/assets/latin-glossary.json
//   concordance docs/assets/concordance/{text}.json    (--text=<slug>; default: ovid-metamorphoses)
//   source-tokens docs/assets/concordance/{text}.source-tokens.json
//
// Exit codes:
//   0  no failures (or warnings only)
//   1  at least one error-severity invariant failed
//   2  usage error / CLI misuse

import { readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';

import { runSuite, formatReport } from './validate/runner.js';
import { grammarInvariants } from './validate/grammar.invariants.js';
import { lexiconInvariants } from './validate/lexicon.invariants.js';
import { glossaryInvariants } from './validate/glossary.invariants.js';
import { concordanceInvariants } from './validate/concordance.invariants.js';
import { referenceGrammarInvariants } from './validate/reference-grammar.invariants.js';
import { buildGlossary } from './build-glossary.js';
import { buildConcordance } from './build-concordance.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, '..', '..');
const LANG_DIR = join(REPO_ROOT, 'content', '_language', 'latin');

const SUITE_ORDER = ['grammar', 'lexicon', 'glossary', 'concordance', 'reference'];

const SUITES = {
  grammar: { invariants: grammarInvariants, needs: [] },
  lexicon: { invariants: lexiconInvariants, needs: ['grammar'] },
  glossary: { invariants: glossaryInvariants, needs: ['grammar', 'lexicon'] },
  concordance: { invariants: concordanceInvariants, needs: ['grammar', 'glossary', 'lexicon'] },
  reference: { invariants: referenceGrammarInvariants, needs: ['grammar'] },
};

const CANONICAL_PATHS = {
  grammar: join(LANG_DIR, 'grammar.json'),
  lexicon: join(LANG_DIR, 'lexicon.json'),
  glossary: join(REPO_ROOT, 'docs', 'assets', 'latin-glossary.json'),
  reference: join(LANG_DIR, 'reference-grammar.json'),
};

function canonicalConcordancePath(textSlug) {
  return join(REPO_ROOT, 'docs', 'assets', 'concordance', `${textSlug}.json`);
}
function canonicalSourceTokensPath(textSlug) {
  return join(REPO_ROOT, 'docs', 'assets', 'concordance', `${textSlug}.source-tokens.json`);
}

async function loadJson(path) {
  const text = await readFile(path, 'utf8');
  return JSON.parse(text);
}

// Try loading from a path; on ENOENT, derive in-memory via the build helper.
// This makes validate self-contained: it works on a fresh checkout without
// requiring `make build` to have been run first.
async function loadOrDerive(suiteName, textSlug, explicitPath, lexiconDoc) {
  if (explicitPath) return loadJson(explicitPath);
  const canonical = suiteName === 'concordance'
    ? canonicalConcordancePath(textSlug)
    : CANONICAL_PATHS[suiteName];
  try {
    return await loadJson(canonical);
  } catch (err) {
    if (err.code !== 'ENOENT') throw err;
  }
  // Derive in-memory.
  if (suiteName === 'glossary') {
    const { glossary } = buildGlossary(lexiconDoc);
    return glossary;
  }
  if (suiteName === 'concordance') {
    const sourceDir = join(REPO_ROOT, 'content', textSlug);
    const { concordance } = await buildConcordance(textSlug, sourceDir);
    return concordance;
  }
  throw new Error(`cannot derive ${suiteName}: ${canonical} missing and no in-memory builder`);
}

async function loadOrDeriveSourceTokens(textSlug, explicitPath) {
  if (explicitPath) {
    try { return await loadJson(explicitPath); } catch (e) { if (e.code !== 'ENOENT') throw e; }
  }
  const canonical = canonicalSourceTokensPath(textSlug);
  try {
    return await loadJson(canonical);
  } catch (err) {
    if (err.code !== 'ENOENT') throw err;
  }
  // Derive in-memory.
  const sourceDir = join(REPO_ROOT, 'content', textSlug);
  const { sourceTokens } = await buildConcordance(textSlug, sourceDir);
  return sourceTokens;
}

async function runOne(suiteName, values, sharedCtx) {
  const suite = SUITES[suiteName];
  const textSlug = values.text ?? 'ovid-metamorphoses';

  // Dependencies (grammar, lexicon, glossary) load from explicit flag, the
  // shared cache, or canonical path — in that order.
  const ctx = {};
  for (const dep of suite.needs) {
    if (sharedCtx[dep]) {
      ctx[dep] = sharedCtx[dep];
    } else {
      ctx[dep] = await loadOrDerive(dep, textSlug, values[dep], sharedCtx.lexicon);
      sharedCtx[dep] = ctx[dep];
    }
  }

  // The data under test for this suite.
  const data = values.data
    ? await loadJson(values.data)
    : await loadOrDerive(suiteName, textSlug, null, sharedCtx.lexicon);

  if (suiteName === 'concordance') {
    try {
      ctx.sourceTokens = await loadOrDeriveSourceTokens(textSlug, values['source-tokens']);
    } catch {
      // C8/C9 skipped if unavailable.
    }
  }
  return runSuite(suiteName, suite.invariants, data, ctx);
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
      text: { type: 'string' },
      'max-examples': { type: 'string' },
    },
  });

  const suiteName = values.suite ?? 'all';
  if (suiteName !== 'all' && !SUITES[suiteName]) {
    console.error(`Unknown suite "${suiteName}". Valid: all, ${Object.keys(SUITES).join(', ')}.`);
    process.exit(2);
  }

  const suitesToRun = suiteName === 'all' ? SUITE_ORDER : [suiteName];
  const maxExamples = values['max-examples'] ? Number(values['max-examples']) : undefined;

  let anyErrors = false;
  let totalWarnings = 0;
  let totalErrors = 0;
  // sharedCtx caches grammar/lexicon/glossary across suites so we don't reread
  // them. Derived artifacts (glossary, concordance) populate on demand.
  const sharedCtx = {};

  for (const name of suitesToRun) {
    const report = await runOne(name, values, sharedCtx);
    console.log(formatReport(report, { maxExamples }));
    if (suitesToRun.length > 1) console.log('');
    if (report.hasErrors) anyErrors = true;
    for (const inv of report.invariants) {
      if (inv.passed) continue;
      if (inv.severity === 'error') totalErrors += inv.violations.length;
      else totalWarnings += inv.violations.length;
    }
  }

  if (suitesToRun.length > 1) {
    const verdict = anyErrors ? 'FAIL' : (totalWarnings > 0 ? 'WARN' : 'PASS');
    console.log(`[${verdict}] all suites: ${totalErrors} error-violation(s), ${totalWarnings} warning-violation(s)`);
  }

  process.exit(anyErrors ? 1 : 0);
}

main().catch((err) => {
  console.error(err.stack ?? err);
  process.exit(2);
});

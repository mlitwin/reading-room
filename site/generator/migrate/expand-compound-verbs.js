#!/usr/bin/env node
// Editorial backlog: apply the prefix to each hyphenated compound verb's
// paradigm cells (L9 / C1 / C3 fix).
//
// A hyphenated lemma like `ex-ardeo_v` was seeded with the BASE verb's cells
// ("ardeo", "ardes", "ardet" …) rather than the compound's ("exardeo",
// "exardes", "exardet" …). Markdown spans correctly tag tokens like "exarsit"
// as `ex-ardeo_v:3sg.perf.ind.act`, but those forms never enter the glossary
// because the cell value is just "arsit", not "exarsit".
//
// Fix: for each hyphenated lemma, split on the first "-", treat the left
// portion as the prefix, and prepend it to every cell value (including
// ppp_paradigm if present). Also:
//   - prepend the prefix to each principal part
//   - rewrite the lemma string and head to the un-hyphenated compound (so
//     L9 stops flagging "ex-ardeo" as absent from its own paradigm)
//
// The lemma ID is preserved so markdown data-matches references stay valid.
// Stray characters in the prefix (e.g. "de_-prehendo" has an underscore) are
// stripped — they're seeding noise, not philology.
//
// Re-runs are idempotent: detection is by the lemma string still containing
// a hyphen.
//
// Usage: node migrate/expand-compound-verbs.js [--dry-run]

import { readFile, writeFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, '..', '..', '..');
const LEXICON_PATH = join(REPO_ROOT, 'content', '_language', 'latin', 'lexicon.json');

function splitOnFirstHyphen(s) {
  const ix = s.indexOf('-');
  if (ix < 0) return null;
  return { prefix: s.slice(0, ix).replace(/[^A-Za-z]/g, ''), base: s.slice(ix + 1) };
}

function prependPrefixToCells(paradigm, prefix) {
  if (!paradigm || !paradigm.cells) return;
  for (const [k, v] of Object.entries(paradigm.cells)) {
    if (Array.isArray(v)) {
      paradigm.cells[k] = v.map((f) => prefix + f);
    } else {
      paradigm.cells[k] = prefix + v;
    }
  }
}

async function main() {
  const { values } = parseArgs({ options: { 'dry-run': { type: 'boolean' } } });
  const dryRun = values['dry-run'] ?? false;

  const lex = JSON.parse(await readFile(LEXICON_PATH, 'utf8'));
  let applied = 0;
  const log = [];
  for (const lemma of lex.lemmata) {
    if (lemma.pos !== 'verb' || !lemma.lemma.includes('-')) continue;
    const split = splitOnFirstHyphen(lemma.lemma);
    if (!split || !split.prefix || !split.base) continue;
    const { prefix, base } = split;
    const compound = prefix + base;

    prependPrefixToCells(lemma.paradigm, prefix);
    prependPrefixToCells(lemma.ppp_paradigm, prefix);

    // Principal parts: prepend prefix to the verb-form parts. Leave entries
    // like "-um" alone (placeholder for missing supine).
    if (Array.isArray(lemma.principal_parts)) {
      lemma.principal_parts = lemma.principal_parts.map((p) =>
        (p && p !== '-um' && !/^[-_]/.test(p)) ? prefix + p.replace(/^[A-Za-z]+-/, '') : p,
      );
    }

    // Rewrite lemma string to the joined compound — keeps L9 happy and the
    // form rendered to readers without the philological hyphen.
    log.push({ id: lemma.id, old: lemma.lemma, neu: compound });
    lemma.lemma = compound;
    // Tidy the head field: replace "ex-ardeo," with "exardeo,". Only if the
    // hyphenated form appears at the start.
    if (typeof lemma.head === 'string') {
      lemma.head = lemma.head.replace(/^[A-Za-z_-]+,/, (m) => compound + ',');
    }
    applied += 1;
  }

  if (!dryRun) {
    await writeFile(LEXICON_PATH, JSON.stringify(lex, null, 2) + '\n', 'utf8');
  }
  console.log(`${dryRun ? '[dry-run] ' : ''}applied prefix to ${applied} compound verbs:`);
  for (const l of log) console.log(`  ${l.id}: "${l.old}" → "${l.neu}"`);
}

main().catch((err) => {
  console.error(err.stack ?? err);
  process.exit(1);
});

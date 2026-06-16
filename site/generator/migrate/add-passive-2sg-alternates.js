#!/usr/bin/env node
// Editorial backlog: the Latin passive 2sg ending -ris has a productive -re
// variant ("amaris" / "amare", "diceris" / "dicere") that's especially common
// in classical poetry — Ovid in particular. Many verb cells in the lexicon
// were seeded with only the -ris form, so the markdown spans that tag a
// surface like "dicere" as `dico_v:2sg.pres.ind.pass` don't find a matching
// cell value.
//
// For every 2sg passive cell whose value is a single string ending in "ris",
// promote it to an array `[…ris, …re]` so the -re alternate enters the
// glossary. Affects: 2sg.pres.ind.pass, 2sg.imperf.ind.pass, 2sg.fut.ind.pass,
// 2sg.pres.subj.pass, 2sg.imperf.subj.pass.
//
// Idempotent — values already structured as arrays are left alone.
//
// Usage: node migrate/add-passive-2sg-alternates.js [--dry-run]

import { readFile, writeFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, '..', '..', '..');
const LEXICON_PATH = join(REPO_ROOT, 'content', '_language', 'latin', 'lexicon.json');

const KEYS = [
  '2sg.pres.ind.pass',
  '2sg.imperf.ind.pass',
  '2sg.fut.ind.pass',
  '2sg.pres.subj.pass',
  '2sg.imperf.subj.pass',
];

async function main() {
  const { values } = parseArgs({ options: { 'dry-run': { type: 'boolean' } } });
  const dryRun = values['dry-run'] ?? false;

  const lex = JSON.parse(await readFile(LEXICON_PATH, 'utf8'));
  let added = 0;
  for (const l of lex.lemmata) {
    if (l.pos !== 'verb' || !l.paradigm?.cells) continue;
    for (const k of KEYS) {
      const v = l.paradigm.cells[k];
      if (typeof v !== 'string') continue;
      if (!v.endsWith('ris')) continue;
      l.paradigm.cells[k] = [v, v.slice(0, -3) + 're'];
      added += 1;
    }
  }
  if (!dryRun) await writeFile(LEXICON_PATH, JSON.stringify(lex, null, 2) + '\n', 'utf8');
  console.log(`${dryRun ? '[dry-run] ' : ''}promoted ${added} cells to [-ris, -re] alternates`);
}

main().catch((err) => {
  console.error(err.stack ?? err);
  process.exit(1);
});

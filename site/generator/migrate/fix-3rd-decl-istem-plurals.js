#!/usr/bin/env node
// Editorial backlog: 48 third-declension i-stem nouns were seeded with the
// genitive singular form ("-is") in the nominative/vocative/accusative plural
// slots — the result is e.g. `mons_n.nom.pl = "montis"` instead of "montes".
// Detection: noun whose nom.pl ends in "is" and gen.pl ends in "ium" (the
// telltale i-stem ending).
//
// Fix: derive the stem from gen.sg (drop "is"); set nom.pl = stem+"es",
// voc.pl = stem+"es", acc.pl as an array [stem+"es", stem+"is"] (both
// classical alternates for the accusative; nom/voc rarely take "-is" in prose).
// Preserve the original "-is" value as an alternate on nom.pl/voc.pl too so
// poetic usage stays in glossary.
//
// Usage: node migrate/fix-3rd-decl-istem-plurals.js [--dry-run]

import { readFile, writeFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, '..', '..', '..');
const LEXICON_PATH = join(REPO_ROOT, 'content', '_language', 'latin', 'lexicon.json');

function stemFromGenSg(genSg) {
  if (typeof genSg !== 'string' || !genSg.endsWith('is')) return null;
  return genSg.slice(0, -2);
}

async function main() {
  const { values } = parseArgs({ options: { 'dry-run': { type: 'boolean' } } });
  const dryRun = values['dry-run'] ?? false;

  const lex = JSON.parse(await readFile(LEXICON_PATH, 'utf8'));
  let touched = 0;
  const log = [];

  for (const l of lex.lemmata) {
    if (l.pos !== 'noun' || !l.paradigm) continue;
    const c = l.paradigm.cells;
    const np = c['nom.pl'];
    const gp = c['gen.pl'];
    const gs = c['gen.sg'];
    if (typeof np !== 'string' || !np.endsWith('is')) continue;
    if (typeof gp !== 'string' || !gp.endsWith('ium')) continue;
    const stem = stemFromGenSg(gs);
    if (!stem) continue;
    const esForm = stem + 'es';
    const isForm = stem + 'is';
    // Avoid breaking lemmata where the seeded value already matches stem+"es"
    // (none should hit this branch given our detection criteria).
    if (np === esForm) continue;

    // nom.pl / voc.pl: prefer "-es" with "-is" as alternate.
    c['nom.pl'] = [esForm, isForm];
    if (c['voc.pl']) c['voc.pl'] = [esForm, isForm];
    // acc.pl already commonly carries either; promote to array if it's just "-is".
    const ap = c['acc.pl'];
    if (typeof ap === 'string' && ap === isForm) {
      c['acc.pl'] = [esForm, isForm];
    }
    log.push(`${l.id}: nom.pl ${JSON.stringify(np)} → ${JSON.stringify(c['nom.pl'])}`);
    touched += 1;
  }

  if (!dryRun) await writeFile(LEXICON_PATH, JSON.stringify(lex, null, 2) + '\n', 'utf8');
  console.log(`${dryRun ? '[dry-run] ' : ''}fixed ${touched} i-stem noun paradigms`);
  for (const s of log.slice(0, 10)) console.log(`  ${s}`);
  if (log.length > 10) console.log(`  ... and ${log.length - 10} more`);
}

main().catch((err) => {
  console.error(err.stack ?? err);
  process.exit(1);
});

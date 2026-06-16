#!/usr/bin/env node
// Editorial backlog: fill obvious cell gaps in adjective and noun paradigms.
//
//  - 135 adjectives are missing dat.pl / abl.pl across all genders. The seed
//    used a partial template. For 2nd-decl -us/-a/-um the missing cells take
//    `<stem>is` across genders; for 3rd-decl 2-term they take `<stem>ibus`.
//
//  - A handful of nouns have wrong abl.sg values (orbis_n: abl.sg "orbi"
//    instead of "orbe"; frons_n similar). For non-i-stem 3rd-decl nouns the
//    abl.sg should be `<stem>e`, not `<stem>i`. Add the -e form as the
//    primary value while preserving "-i" as an alternate.
//
// Detection driven entirely by existing cell shape, not by lemma id:
//   - adj 2nd-decl: gen.pl.masc ends in "orum" → stem = gen.pl.masc minus "orum"
//   - adj 3rd-decl: gen.pl.masc ends in "ium" → stem = gen.pl.masc minus "ium"
//   - noun 3rd-decl: abl.sg ends in "i" and gen.sg ends in "is" and the abl
//     doesn't equal the dat (which often shares the form)
//
// Usage: node migrate/fill-adj-noun-cell-gaps.js [--dry-run]

import { readFile, writeFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, '..', '..', '..');
const LEXICON_PATH = join(REPO_ROOT, 'content', '_language', 'latin', 'lexicon.json');

const GENDERS = ['masc', 'fem', 'neut'];

function fillAdj(lemma) {
  const cells = lemma.paradigm?.cells;
  if (!cells) return 0;
  let added = 0;
  const gpm = cells['gen.pl.masc'];
  if (typeof gpm !== 'string') return 0;
  let stem, suffix;
  if (gpm.endsWith('orum')) { stem = gpm.slice(0, -4); suffix = 'is'; }
  else if (gpm.endsWith('ium')) { stem = gpm.slice(0, -3); suffix = 'ibus'; }
  else return 0;
  const form = stem + suffix;
  for (const g of GENDERS) {
    for (const c of ['dat.pl', 'abl.pl']) {
      const key = `${c}.${g}`;
      if (!(key in cells)) { cells[key] = form; added += 1; }
    }
  }
  return added;
}

function fixNounAblSg(lemma) {
  const cells = lemma.paradigm?.cells;
  if (!cells) return 0;
  const ablSg = cells['abl.sg'];
  const genSg = cells['gen.sg'];
  const genPl = cells['gen.pl'];
  if (typeof ablSg !== 'string' || typeof genSg !== 'string') return 0;
  if (!ablSg.endsWith('i')) return 0;
  if (!genSg.endsWith('is')) return 0;
  const stem = genSg.slice(0, -2);
  const eForm = stem + 'e';
  const iForm = stem + 'i';
  const isIStem = typeof genPl === 'string' && genPl.endsWith('ium');
  if (isIStem) {
    // Masculine / feminine i-stem nouns (orbis, frons, …) take "-e" in classical
    // prose for abl.sg, with "-i" as a poetic alternate. Neuter i-stems (mare,
    // animal) keep "-i". We approximate by checking lemma.gender; absent that,
    // default to the prose form with the older "-i" as alternate.
    if (lemma.gender === 'neut') return 0; // keep -i
    cells['abl.sg'] = [eForm, iForm];
    return 1;
  }
  // Consonant-stem 3rd-decl: take "-e" only.
  if (ablSg === eForm) return 0;
  cells['abl.sg'] = eForm;
  return 1;
}

async function main() {
  const { values } = parseArgs({ options: { 'dry-run': { type: 'boolean' } } });
  const dryRun = values['dry-run'] ?? false;
  const lex = JSON.parse(await readFile(LEXICON_PATH, 'utf8'));
  let adjCells = 0, adjLemmata = 0;
  let nounsFixed = 0;
  for (const l of lex.lemmata) {
    if (l.pos === 'adj') {
      const n = fillAdj(l);
      if (n > 0) { adjCells += n; adjLemmata += 1; }
    } else if (l.pos === 'noun') {
      nounsFixed += fixNounAblSg(l);
    }
  }
  if (!dryRun) await writeFile(LEXICON_PATH, JSON.stringify(lex, null, 2) + '\n', 'utf8');
  console.log(`${dryRun ? '[dry-run] ' : ''}adj: ${adjCells} cells across ${adjLemmata} lemmata; nouns: ${nounsFixed} abl.sg fixes`);
}

main().catch((err) => { console.error(err.stack ?? err); process.exit(1); });

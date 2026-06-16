#!/usr/bin/env node
// Editorial backlog steps L9 + C1 (partial). Passes over the lexicon adding
// the most-frequently-missing verb cells:
//
//   1. 1sg.pres.ind.act — the form the lemma itself names. Many verbs were
//      seeded with paradigms starting at 2sg, so the lemma's own surface
//      (e.g., "abscido") doesn't appear in any cell. Add lemma → 1sg.pres.ind.act.
//
//   2. inf.pres.act — the present active infinitive, conventionally the
//      second principal part. Add principal_parts[1] → inf.pres.act when
//      principal parts are present and the cell is absent.
//
//   3. Perfect-system active tenses — pluperfect indicative, future perfect
//      indicative, perfect subjunctive, pluperfect subjunctive. Built off
//      the perfect stem (principal_parts[2] minus trailing "i"). The original
//      seeding stopped at perfect indicative + perfect subjunctive, so forms
//      like "porrexerat" (plup.ind.act) are missing across ~600 verbs.
//
// Hyphenated compound lemmata (a-eo_v, ad-stringo_v, …) are skipped for the
// 1sg add: their paradigm cells come from the simple base verb, so re-deriving
// 1sg from the hyphenated string would emit garbage. Logged for follow-up.
//
// Usage: node migrate/expand-verb-paradigms.js [--dry-run]

import { readFile, writeFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, '..', '..', '..');
const LEXICON_PATH = join(REPO_ROOT, 'content', '_language', 'latin', 'lexicon.json');

// Compound-tense endings off the perfect stem. The 1sg of each tense is the
// stem + first ending. Person/number order: 1sg, 2sg, 3sg, 1pl, 2pl, 3pl.
const PERFECT_SYSTEM_ENDINGS = {
  'plup.ind.act':    ['eram', 'eras',  'erat',  'eramus',  'eratis',  'erant'],
  'futperf.ind.act': ['ero',  'eris',  'erit',  'erimus',  'eritis',  'erint'],
  'perf.subj.act':   ['erim', 'eris',  'erit',  'erimus',  'eritis',  'erint'],
  'plup.subj.act':   ['issem','isses', 'isset', 'issemus', 'issetis', 'issent'],
};
const PERSONS = ['1sg', '2sg', '3sg', '1pl', '2pl', '3pl'];

// Derive the perfect stem from the 1sg perfect (principal_parts[2]).
// Conventionally formed by stripping the final "-i" (porrexi → porrex,
// amavi → amav, monui → monu). Returns null if the value doesn't end in "i"
// (irregular forms left to manual authoring).
function perfectStemFrom(principalParts) {
  if (!Array.isArray(principalParts) || principalParts.length < 3) return null;
  // Some entries store the perfect as a comma-separated alternatives string —
  // take the first form. Also tolerate whitespace.
  let raw = String(principalParts[2]).split(',')[0].trim();
  // Strip macron / breve combining marks so "fuī" (ī) is treated as ending in i.
  raw = raw.normalize('NFD').replace(/[̀-ͯ]/g, '');
  if (!raw.endsWith('i')) return null;
  return raw.slice(0, -1);
}

function addPerfectSystem(paradigm, stem) {
  let added = 0;
  const cells = paradigm.cells;
  const addedTenses = [];
  for (const [tenseKey, endings] of Object.entries(PERFECT_SYSTEM_ENDINGS)) {
    let tenseHadAny = false;
    for (let i = 0; i < PERSONS.length; i += 1) {
      const parse = `${PERSONS[i]}.${tenseKey}`;
      if (parse in cells) { tenseHadAny = true; continue; }
      cells[parse] = stem + endings[i];
      added += 1;
      tenseHadAny = true;
    }
    if (tenseHadAny) addedTenses.push(tenseKey);
  }
  // Make sure the renderer sees the new columns (rows × cols lookup in
  // docs/assets/cards.js). Append any missing tenses to paradigm.cols.
  if (Array.isArray(paradigm.cols)) {
    for (const t of addedTenses) {
      if (!paradigm.cols.includes(t)) paradigm.cols.push(t);
    }
  }
  return added;
}

async function main() {
  const { values } = parseArgs({ options: { 'dry-run': { type: 'boolean' } } });
  const dryRun = values['dry-run'] ?? false;

  const lex = JSON.parse(await readFile(LEXICON_PATH, 'utf8'));
  let added1sg = 0;
  let addedInf = 0;
  let addedPerfSystemCells = 0;
  let perfSystemVerbs = 0;
  const skippedHyphenated = [];
  const skippedNoPerfStem = [];

  for (const lemma of lex.lemmata) {
    if (lemma.pos !== 'verb' || !lemma.paradigm) continue;
    const cells = lemma.paradigm.cells;

    if (!('1sg.pres.ind.act' in cells)) {
      if (lemma.lemma.includes('-')) {
        skippedHyphenated.push(lemma.id);
      } else {
        cells['1sg.pres.ind.act'] = lemma.lemma;
        added1sg += 1;
      }
    }

    if (!('inf.pres.act' in cells) && Array.isArray(lemma.principal_parts) && lemma.principal_parts.length >= 2) {
      cells['inf.pres.act'] = lemma.principal_parts[1];
      addedInf += 1;
    }

    const stem = perfectStemFrom(lemma.principal_parts);
    if (stem) {
      const n = addPerfectSystem(lemma.paradigm, stem);
      if (n > 0) {
        addedPerfSystemCells += n;
        perfSystemVerbs += 1;
      }
    } else if (lemma.principal_parts && lemma.principal_parts.length >= 3) {
      skippedNoPerfStem.push(lemma.id);
    }
  }

  if (!dryRun) {
    await writeFile(LEXICON_PATH, JSON.stringify(lex, null, 2) + '\n', 'utf8');
  }
  console.log(`${dryRun ? '[dry-run] ' : ''}added 1sg.pres.ind.act to ${added1sg} verbs`);
  console.log(`${dryRun ? '[dry-run] ' : ''}added inf.pres.act to ${addedInf} verbs`);
  console.log(`${dryRun ? '[dry-run] ' : ''}added ${addedPerfSystemCells} perfect-system cells across ${perfSystemVerbs} verbs`);
  console.log(`skipped ${skippedHyphenated.length} hyphenated verbs (needs compound-form handling):`);
  for (const id of skippedHyphenated.slice(0, 20)) console.log(`  ${id}`);
  if (skippedHyphenated.length > 20) console.log(`  ... and ${skippedHyphenated.length - 20} more`);
  if (skippedNoPerfStem.length) {
    console.log(`skipped ${skippedNoPerfStem.length} verbs whose perfect principal part doesn't end in -i:`);
    for (const id of skippedNoPerfStem.slice(0, 10)) console.log(`  ${id}`);
    if (skippedNoPerfStem.length > 10) console.log(`  ... and ${skippedNoPerfStem.length - 10} more`);
  }
}

main().catch((err) => {
  console.error(err.stack ?? err);
  process.exit(1);
});

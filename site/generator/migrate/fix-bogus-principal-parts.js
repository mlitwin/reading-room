#!/usr/bin/env node
// Editorial backlog: many high-frequency verbs were seeded with default
// 1st-conjugation principal_parts (-are, -avi, -atum) even though they're
// 3rd- or 4th-conjugation. Examples:
//
//   lego_v:  legare, legavi, legatum   →  legere, legi, lectum
//   colo_v:  colare, colavi, colatum   →  colere, colui, cultum
//   pono_v:  ponere, posivi, postum    →  ponere, posui, positum
//   veto_v:  vetare, vetavi, vetatum   →  vetare, vetui, vetitum
//   seco_v:  secare, secavi, secatum   →  secare, secui, sectum
//
// The wrong principal parts propagate into every cell derived from them
// (inf, perf system, ppl, gerund), causing dozens of missing-surface C1
// violations for forms the markdown editor correctly tagged.
//
// This pass rewrites principal_parts for a curated set of common verbs.
// After running, also re-run:
//   - expand-verb-paradigms.js     (rebuilds the present-system if missing)
//   - repair-perfect-system.js     (regenerates the perfect system cells)
//   - expand-verb-participles.js   (regenerates ppl / gerund cells off the
//                                    fixed infinitive — note: only fills
//                                    missing cells; the bad pre-existing
//                                    ones still need a reset, handled below)
//
// To force the participial/passive cells to refresh, this script also wipes
// the cells that depend on (1sg.pres.ind.act, inf.pres.act) for any verb it
// touches, so the subsequent expansion scripts re-derive them from the new
// principal parts.
//
// Usage: node migrate/fix-bogus-principal-parts.js [--dry-run]

import { readFile, writeFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, '..', '..', '..');
const LEXICON_PATH = join(REPO_ROOT, 'content', '_language', 'latin', 'lexicon.json');

const FIXES = [
  // id, [1sg.pres, inf.pres, perf, ppp]
  { id: 'pono_v',     pp: ['pono',     'ponere',     'posui',     'positum'] },
  { id: 'lego_v',     pp: ['lego',     'legere',     'legi',      'lectum'] },
  { id: 'colo_v',     pp: ['colo',     'colere',     'colui',     'cultum'] },
  { id: 'veto_v',     pp: ['veto',     'vetare',     'vetui',     'vetitum'] },
  { id: 'seco_v',     pp: ['seco',     'secare',     'secui',     'sectum'] },
  { id: 'in-pono_v',  pp: ['inpono',   'inponere',   'inposui',   'inpositum'] },
  { id: 'cingo_v',    pp: ['cingo',    'cingere',    'cinxi',     'cinctum'] }, // pp already correct, but force refresh
  { id: 'tento_v',    pp: ['tento',    'tentare',    'tentavi',   'tentatum'] }, // already correct
  { id: 'tueor_v',    pp: ['tueor',    'tueri',      'tutus sum', '-'] },
  { id: 'desum_v',    pp: ['desum',    'deesse',     'defui',     '-'] },
  { id: 'absum_v',    pp: ['absum',    'abesse',     'afui',      '-'] },
  // High-frequency irregular: eo (real: eo, ire, ii/ivi, itum). Skip eo_v
  // (it's hand-authored). Subeo too: 'subeo, subire, subii/subivi, subitum'.
  { id: 'subeo_v',    pp: ['subeo',    'subire',     'subii',     'subitum'] },
  // immineo: real "immineo, imminere, -, -" (no perfect, no supine).
  { id: 'immineo_v',  pp: ['immineo',  'imminere',   '-',         '-'] },
  // orior: real "orior, oriri, ortus sum" (deponent).
  { id: 'orior_v',    pp: ['orior',    'oriri',      'ortus sum', 'ortum'] },
];

// Cells to wipe so the expansion scripts re-derive them off the new pp.
// Includes everything tied to (1sg.pres.ind.act, inf.pres.act, perf stem).
const DERIVED_KEY_PATTERNS = [
  /^[123](sg|pl)\.pres\.ind\.act$/,
  /^[123](sg|pl)\.imperf\.ind\.act$/,
  /^[123](sg|pl)\.fut\.ind\.act$/,
  /^[123](sg|pl)\.pres\.subj\.act$/,
  /^[123](sg|pl)\.imperf\.subj\.act$/,
  /^[123](sg|pl)\.pres\.ind\.pass$/,
  /^[123](sg|pl)\.imperf\.ind\.pass$/,
  /^[123](sg|pl)\.fut\.ind\.pass$/,
  /^[123](sg|pl)\.pres\.subj\.pass$/,
  /^[123](sg|pl)\.imperf\.subj\.pass$/,
  /^[123](sg|pl)\.perf\./, // perf / plup / futperf / perf.subj / plup.subj
  /^inf\./,
  /^2(sg|pl)\.pres\.imp\./,
  /^ppl\./,
  /^gerundive\./,
  /^ger\./,
];

function shouldWipe(parseKey) {
  return DERIVED_KEY_PATTERNS.some((re) => re.test(parseKey));
}

async function main() {
  const { values } = parseArgs({ options: { 'dry-run': { type: 'boolean' } } });
  const dryRun = values['dry-run'] ?? false;

  const lex = JSON.parse(await readFile(LEXICON_PATH, 'utf8'));
  const byId = new Map(lex.lemmata.map((l) => [l.id, l]));

  const applied = [];
  for (const fix of FIXES) {
    const l = byId.get(fix.id);
    if (!l) { applied.push(`${fix.id} (missing)`); continue; }
    l.principal_parts = fix.pp;
    l.head = `${fix.pp.join(', ')}`;
    // Wipe derived cells so the subsequent expansion scripts rebuild them.
    if (l.paradigm?.cells) {
      let wiped = 0;
      for (const k of Object.keys(l.paradigm.cells)) {
        if (shouldWipe(k)) { delete l.paradigm.cells[k]; wiped += 1; }
      }
      applied.push(`${fix.id} (wiped ${wiped} derived cells)`);
    } else {
      applied.push(fix.id);
    }
  }

  if (!dryRun) await writeFile(LEXICON_PATH, JSON.stringify(lex, null, 2) + '\n', 'utf8');
  console.log(`${dryRun ? '[dry-run] ' : ''}fixed ${applied.length}:`);
  for (const s of applied) console.log(`  ${s}`);
  console.log('\nNext: re-run expand-verb-paradigms.js, repair-perfect-system.js, expand-verb-participles.js, expand-verb-passive-system.js, add-passive-2sg-alternates.js, prune-spurious-parses.js');
}

main().catch((err) => {
  console.error(err.stack ?? err);
  process.exit(1);
});

#!/usr/bin/env node
// Editorial backlog: a wide swath of verb paradigms was seeded with the perfect
// system inflected as if every verb were 1st-conjugation regular -avi/-avit.
// Example: `dico_v` has principal_parts[2] = "dixi" (correct) but its perfect
// indicative cells say "dicavi/dicavit/dicaverunt" instead of "dixi/dixit/
// dixerunt". This produces hundreds of missing glossary surfaces (dixit,
// dixerunt, posuit, etc.) and propagates into the compound tenses
// (plup/futperf/perf.subj/plup.subj).
//
// Repair: for every verb with a usable principal_parts[2], regenerate the
// entire perfect-system (perf.ind.act, plup.ind.act, futperf.ind.act,
// perf.subj.act, plup.subj.act, inf.perf.act) from the perfect stem,
// overwriting any pre-existing cell whose value doesn't match the canonical
// form. Adds the -ere alternate to 3pl.perf.ind.act.
//
// Idempotent: re-runs produce no changes if cells already hold the canonical
// forms.
//
// Usage: node migrate/repair-perfect-system.js [--dry-run]

import { readFile, writeFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, '..', '..', '..');
const LEXICON_PATH = join(REPO_ROOT, 'content', '_language', 'latin', 'lexicon.json');

const HAND_AUTHORED = new Set([
  'sum_v', 'possum_v', 'prosum_v', 'supersum_v', 'inquam_v',
  'reor_v', 'tueor_v', 'eo_v', 'aeo_v', 'abeo_v',
]);

function denorm(s) {
  return String(s).normalize('NFD').replace(/[̀-ͯ]/g, '');
}

function perfectStem(pp2) {
  if (!pp2) return null;
  let raw = denorm(pp2).split(',')[0].trim();
  if (!raw.endsWith('i')) return null;
  return { full: raw, stem: raw.slice(0, -1) };
}

const PERSONS = ['1sg', '2sg', '3sg', '1pl', '2pl', '3pl'];
const PERFECT_SYSTEM = {
  'perf.ind.act':    ['i',     'isti',   'it',     'imus',     'istis',    'erunt'],
  'plup.ind.act':    ['eram',  'eras',   'erat',   'eramus',   'eratis',   'erant'],
  'futperf.ind.act': ['ero',   'eris',   'erit',   'erimus',   'eritis',   'erint'],
  'perf.subj.act':   ['erim',  'eris',   'erit',   'erimus',   'eritis',   'erint'],
  'plup.subj.act':   ['issem', 'isses',  'isset',  'issemus',  'issetis',  'issent'],
};

function arraysEqual(a, b) {
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    return a.every((x, i) => x === b[i]);
  }
  return a === b;
}

async function main() {
  const { values } = parseArgs({ options: { 'dry-run': { type: 'boolean' } } });
  const dryRun = values['dry-run'] ?? false;

  const lex = JSON.parse(await readFile(LEXICON_PATH, 'utf8'));
  let rewritten = 0;
  let touchedCells = 0;
  const log = [];

  for (const lemma of lex.lemmata) {
    if (lemma.pos !== 'verb' || !lemma.paradigm) continue;
    if (HAND_AUTHORED.has(lemma.id)) continue;

    const pp = Array.isArray(lemma.principal_parts) ? lemma.principal_parts[2] : null;
    const ps = perfectStem(pp);
    if (!ps) continue;

    const cells = lemma.paradigm.cells;
    let lemmaTouched = false;
    let exampleOld = null;

    for (const [tenseKey, endings] of Object.entries(PERFECT_SYSTEM)) {
      for (let i = 0; i < PERSONS.length; i += 1) {
        const parse = `${PERSONS[i]}.${tenseKey}`;
        let canonical = ps.stem + endings[i];
        // 3pl.perf.ind.act takes an -ere alternate (dixerunt / dixere).
        if (tenseKey === 'perf.ind.act' && PERSONS[i] === '3pl') {
          canonical = [canonical, ps.stem + 'ere'];
        }
        const existing = cells[parse];
        if (!arraysEqual(existing, canonical)) {
          if (existing != null && !exampleOld) {
            exampleOld = { parse, was: existing, now: canonical };
          }
          cells[parse] = canonical;
          touchedCells += 1;
          lemmaTouched = true;
        }
      }
    }

    // inf.perf.act
    const infPerf = ps.stem + 'isse';
    if (cells['inf.perf.act'] !== infPerf) {
      if (cells['inf.perf.act'] != null && !exampleOld) exampleOld = { parse: 'inf.perf.act', was: cells['inf.perf.act'], now: infPerf };
      cells['inf.perf.act'] = infPerf;
      touchedCells += 1;
      lemmaTouched = true;
    }

    if (lemmaTouched) {
      rewritten += 1;
      if (exampleOld) log.push({ id: lemma.id, ...exampleOld });
    }
  }

  if (!dryRun) await writeFile(LEXICON_PATH, JSON.stringify(lex, null, 2) + '\n', 'utf8');
  console.log(`${dryRun ? '[dry-run] ' : ''}rewrote ${touchedCells} cells across ${rewritten} verbs`);
  console.log(`sample corrections:`);
  for (const e of log.slice(0, 10)) console.log(`  ${e.id}.${e.parse}: ${JSON.stringify(e.was)} → ${JSON.stringify(e.now)}`);
}

main().catch((err) => {
  console.error(err.stack ?? err);
  process.exit(1);
});

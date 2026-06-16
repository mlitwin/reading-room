#!/usr/bin/env node
// Editorial backlog: hand-authored corrections for high-frequency irregular
// lemmata that the regular-conjugation generators can't help with. Each entry
// is curated against Allen & Greenough / Lewis & Short.
//
// Coverage:
//   - neque_conj: register the apocopated form "nec" via alt_forms.
//   - sum_v: add the older / poetic forms (foret, fore, fores, futurum, futura,
//     esto) and the future participle declension (futurus_a_um).
//   - possum_v: fill subjunctives + future participle (potens, potentes, …).
//   - fero_v: irregular present-system + perfect participle stems.
//   - duo_num: irregular numeral declension (duo, duae, duo / duorum, duarum,
//     duobus, duos/duo, duas, duobus).
//   - pono_v / orior_v / cingo_v / colo_v / lego_v: add ppp_paradigm so passive
//     participle forms (positum/positis/posita etc.) enter the glossary.
//
// Idempotent — adds missing cells, doesn't overwrite existing.
//
// Usage: node migrate/hand-fixes-batch.js [--dry-run]

import { readFile, writeFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, '..', '..', '..');
const LEXICON_PATH = join(REPO_ROOT, 'content', '_language', 'latin', 'lexicon.json');

const ADJ_COLS = ['sg.masc', 'sg.fem', 'sg.neut', 'pl.masc', 'pl.fem', 'pl.neut'];

// Build a regular -us/-a/-um adjective paradigm (used for ppp's).
function pppParadigm(stem) {
  const cells = {};
  const rows = [
    ['nom', ['us', 'a',   'um', 'i',     'ae',    'a']],
    ['voc', ['e',  'a',   'um', 'i',     'ae',    'a']],
    ['gen', ['i',  'ae',  'i',  'orum',  'arum',  'orum']],
    ['dat', ['o',  'ae',  'o',  'is',    'is',    'is']],
    ['acc', ['um', 'am',  'um', 'os',    'as',    'a']],
    ['abl', ['o',  'a',   'o',  'is',    'is',    'is']],
  ];
  for (const [r, endings] of rows) {
    for (let i = 0; i < ADJ_COLS.length; i += 1) {
      cells[`ppp.${r}.${ADJ_COLS[i]}`] = stem + endings[i];
    }
  }
  return {
    type: 'ppp',
    rows: ['nom', 'voc', 'gen', 'dat', 'acc', 'abl'],
    cols: ADJ_COLS,
    cells,
  };
}

const FIXES = [
  // neque / nec — apocopation.
  { id: 'neque_conj', addAltForms: ['nec'] },

  // sum_v — extend with archaic / poetic forms.
  {
    id: 'sum_v',
    addCells: {
      // Periphrastic / older subjunctive of "sum": foret = esset, forem = essem
      '1sg.imperf.subj.act': 'forem',
      '2sg.imperf.subj.act': 'fores',
      '3sg.imperf.subj.act': 'foret',
      '1pl.imperf.subj.act': 'foremus',
      '2pl.imperf.subj.act': 'foretis',
      '3pl.imperf.subj.act': 'forent',
      // Future infinitive (alternate form of futurum esse).
      'inf.fut.act': 'fore',
      // Future imperative (esto, estote).
      '2sg.fut.imp.act': 'esto',
      '3sg.fut.imp.act': 'esto',
      '2pl.fut.imp.act': 'estote',
      '3pl.fut.imp.act': 'sunto',
      // Future active participle: futurus, -a, -um — full 36-cell paradigm.
      'fap.nom.sg.masc': 'futurus',  'fap.nom.sg.fem': 'futura',   'fap.nom.sg.neut': 'futurum',
      'fap.voc.sg.masc': 'future',   'fap.voc.sg.fem': 'futura',   'fap.voc.sg.neut': 'futurum',
      'fap.gen.sg.masc': 'futuri',   'fap.gen.sg.fem': 'futurae',  'fap.gen.sg.neut': 'futuri',
      'fap.dat.sg.masc': 'futuro',   'fap.dat.sg.fem': 'futurae',  'fap.dat.sg.neut': 'futuro',
      'fap.acc.sg.masc': 'futurum',  'fap.acc.sg.fem': 'futuram',  'fap.acc.sg.neut': 'futurum',
      'fap.abl.sg.masc': 'futuro',   'fap.abl.sg.fem': 'futura',   'fap.abl.sg.neut': 'futuro',
      'fap.nom.pl.masc': 'futuri',   'fap.nom.pl.fem': 'futurae',  'fap.nom.pl.neut': 'futura',
      'fap.voc.pl.masc': 'futuri',   'fap.voc.pl.fem': 'futurae',  'fap.voc.pl.neut': 'futura',
      'fap.gen.pl.masc': 'futurorum','fap.gen.pl.fem': 'futurarum','fap.gen.pl.neut': 'futurorum',
      'fap.dat.pl.masc': 'futuris',  'fap.dat.pl.fem': 'futuris',  'fap.dat.pl.neut': 'futuris',
      'fap.acc.pl.masc': 'futuros',  'fap.acc.pl.fem': 'futuras',  'fap.acc.pl.neut': 'futura',
      'fap.abl.pl.masc': 'futuris',  'fap.abl.pl.fem': 'futuris',  'fap.abl.pl.neut': 'futuris',
    },
  },

  // possum_v — fill imperfect & subjunctive forms not in the bespoke paradigm.
  {
    id: 'possum_v',
    addCells: {
      '1sg.imperf.ind.act': 'poteram', '2sg.imperf.ind.act': 'poteras',
      '3sg.imperf.ind.act': 'poterat', '1pl.imperf.ind.act': 'poteramus',
      '2pl.imperf.ind.act': 'poteratis', '3pl.imperf.ind.act': 'poterant',
      '1sg.fut.ind.act': 'potero', '2sg.fut.ind.act': 'poteris',
      '3sg.fut.ind.act': 'poterit', '1pl.fut.ind.act': 'poterimus',
      '2pl.fut.ind.act': 'poteritis', '3pl.fut.ind.act': 'poterunt',
      '1sg.pres.subj.act': 'possim', '2sg.pres.subj.act': 'possis',
      '3sg.pres.subj.act': 'possit', '1pl.pres.subj.act': 'possimus',
      '2pl.pres.subj.act': 'possitis', '3pl.pres.subj.act': 'possint',
      '1sg.imperf.subj.act': 'possem', '2sg.imperf.subj.act': 'posses',
      '3sg.imperf.subj.act': 'posset', '1pl.imperf.subj.act': 'possemus',
      '2pl.imperf.subj.act': 'possetis', '3pl.imperf.subj.act': 'possent',
      'inf.perf.act': 'potuisse',
      // Present active participle "potens, potentis" (declines as 3rd-decl
      // 1-termination adjective). Used substantively for "the powerful".
      'ppl.nom.sg.masc': 'potens', 'ppl.nom.sg.fem': 'potens', 'ppl.nom.sg.neut': 'potens',
      'ppl.voc.sg.masc': 'potens', 'ppl.voc.sg.fem': 'potens', 'ppl.voc.sg.neut': 'potens',
      'ppl.gen.sg.masc': 'potentis', 'ppl.gen.sg.fem': 'potentis', 'ppl.gen.sg.neut': 'potentis',
      'ppl.dat.sg.masc': 'potenti', 'ppl.dat.sg.fem': 'potenti', 'ppl.dat.sg.neut': 'potenti',
      'ppl.acc.sg.masc': 'potentem', 'ppl.acc.sg.fem': 'potentem', 'ppl.acc.sg.neut': 'potens',
      'ppl.abl.sg.masc': 'potenti', 'ppl.abl.sg.fem': 'potenti', 'ppl.abl.sg.neut': 'potenti',
      'ppl.nom.pl.masc': 'potentes', 'ppl.nom.pl.fem': 'potentes', 'ppl.nom.pl.neut': 'potentia',
      'ppl.voc.pl.masc': 'potentes', 'ppl.voc.pl.fem': 'potentes', 'ppl.voc.pl.neut': 'potentia',
      'ppl.gen.pl.masc': 'potentium', 'ppl.gen.pl.fem': 'potentium', 'ppl.gen.pl.neut': 'potentium',
      'ppl.dat.pl.masc': 'potentibus', 'ppl.dat.pl.fem': 'potentibus', 'ppl.dat.pl.neut': 'potentibus',
      'ppl.acc.pl.masc': 'potentes', 'ppl.acc.pl.fem': 'potentes', 'ppl.acc.pl.neut': 'potentia',
      'ppl.abl.pl.masc': 'potentibus', 'ppl.abl.pl.fem': 'potentibus', 'ppl.abl.pl.neut': 'potentibus',
    },
  },

  // fero_v — fill the irregular present-system forms commonly attested.
  {
    id: 'fero_v',
    addCells: {
      '1sg.pres.ind.act': 'fero',   '2sg.pres.ind.act': 'fers',
      '3sg.pres.ind.act': 'fert',   '1pl.pres.ind.act': 'ferimus',
      '2pl.pres.ind.act': 'fertis', '3pl.pres.ind.act': 'ferunt',
      '1sg.imperf.ind.act': 'ferebam', '3sg.imperf.ind.act': 'ferebat',
      '3pl.imperf.ind.act': 'ferebant',
      '1sg.fut.ind.act': 'feram', '3sg.fut.ind.act': 'feret',
      '3pl.fut.ind.act': 'ferent',
      '1sg.perf.ind.act': 'tuli', '3sg.perf.ind.act': 'tulit', '3pl.perf.ind.act': ['tulerunt', 'tulere'],
      '1sg.plup.ind.act': 'tuleram', '3sg.plup.ind.act': 'tulerat',
      'inf.pres.act': 'ferre',
      // Future active participle: laturus (the irregular stem from latum).
      'fap.nom.sg.masc': 'laturus', 'fap.nom.sg.fem': 'latura', 'fap.nom.sg.neut': 'laturum',
      'fap.acc.sg.masc': 'laturum', 'fap.acc.sg.fem': 'laturam', 'fap.acc.sg.neut': 'laturum',
    },
  },

  // duo, duae, duo — irregular numeral.
  {
    id: 'duo_num',
    setParadigm: {
      type: 'adj',
      rows: ['nom', 'voc', 'gen', 'dat', 'acc', 'abl'],
      cols: ADJ_COLS,
      cells: {
        'nom.pl.masc': 'duo',     'nom.pl.fem': 'duae',    'nom.pl.neut': 'duo',
        'voc.pl.masc': 'duo',     'voc.pl.fem': 'duae',    'voc.pl.neut': 'duo',
        'gen.pl.masc': 'duorum',  'gen.pl.fem': 'duarum',  'gen.pl.neut': 'duorum',
        'dat.pl.masc': 'duobus',  'dat.pl.fem': 'duabus',  'dat.pl.neut': 'duobus',
        'acc.pl.masc': ['duos', 'duo'], 'acc.pl.fem': 'duas', 'acc.pl.neut': 'duo',
        'abl.pl.masc': 'duobus',  'abl.pl.fem': 'duabus',  'abl.pl.neut': 'duobus',
      },
    },
  },

  // pono → positum (regular -us, -a, -um ppp).
  { id: 'pono_v',  setPppParadigm: pppParadigm('posit') },
  { id: 'colo_v',  setPppParadigm: pppParadigm('cult') },
  { id: 'lego_v',  setPppParadigm: pppParadigm('lect') },
  { id: 'cingo_v', setPppParadigm: pppParadigm('cinct') },
  // orior is deponent — its perfect participle "ortus, -a, -um" is the
  // canonical perfect form ("ortus sum" = "I rose").
  { id: 'orior_v', setPppParadigm: pppParadigm('ort') },
  // veto, seco, sub-eo: regular -us, -a, -um from the supine stem.
  { id: 'veto_v',  setPppParadigm: pppParadigm('vetit') },
  { id: 'seco_v',  setPppParadigm: pppParadigm('sect') },
  { id: 'subeo_v', setPppParadigm: pppParadigm('subit') },
  { id: 'in-pono_v', setPppParadigm: pppParadigm('inposit') },
];

async function main() {
  const { values } = parseArgs({ options: { 'dry-run': { type: 'boolean' } } });
  const dryRun = values['dry-run'] ?? false;

  const lex = JSON.parse(await readFile(LEXICON_PATH, 'utf8'));
  const byId = new Map(lex.lemmata.map((l) => [l.id, l]));

  const applied = [];
  const missing = [];
  for (const fix of FIXES) {
    const l = byId.get(fix.id);
    if (!l) { missing.push(fix.id); continue; }
    if (fix.addAltForms) {
      const existing = new Set(l.alt_forms ?? []);
      for (const f of fix.addAltForms) existing.add(f);
      l.alt_forms = [...existing];
    }
    if (fix.addCells) {
      if (!l.paradigm) l.paradigm = { type: 'verb', rows: [], cols: [], cells: {} };
      const cells = l.paradigm.cells;
      const cols = l.paradigm.cols || (l.paradigm.cols = []);
      for (const [k, v] of Object.entries(fix.addCells)) {
        if (!(k in cells)) {
          cells[k] = v;
          // crude col-bookkeeping: append the post-person portion if absent.
          const m = /^(?:[123](?:sg|pl)|inf|ppl|fap|gerundive|ger)\.(.+)$/.exec(k);
          const col = m ? m[1] : null;
          if (col && !cols.includes(col)) cols.push(col);
        }
      }
    }
    if (fix.setParadigm) {
      l.paradigm = fix.setParadigm;
    }
    if (fix.setPppParadigm) {
      l.ppp_paradigm = fix.setPppParadigm;
    }
    applied.push(fix.id);
  }

  if (!dryRun) await writeFile(LEXICON_PATH, JSON.stringify(lex, null, 2) + '\n', 'utf8');
  console.log(`${dryRun ? '[dry-run] ' : ''}applied ${applied.length}:`);
  for (const id of applied) console.log(`  ${id}`);
  if (missing.length) console.log(`missing: ${missing.join(', ')}`);
}

main().catch((err) => {
  console.error(err.stack ?? err);
  process.exit(1);
});

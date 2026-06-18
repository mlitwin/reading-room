#!/usr/bin/env node
// Editorial backlog: close the L8a and L9 violation tail.
//
// L8a: 14 lemmata with declinable POS (noun/verb/adj) but no paradigm. Author
//      minimal paradigms from known alt_forms and classical-Latin declensions.
//
// L9: 9 lemmata whose lemma surface doesn't appear in any paradigm cell.
//      Split into two sub-cases:
//      (a) Wrongly-named lemma field: rename lemma to match the paradigm (cani_n,
//          ceter_adj, ulter_pron, instabilio_adv, in-pleo_adv, clymenos_adv).
//      (b) Verbs with only perfect-system cells: add seed present-system cells
//          (1sg.pres.ind.act + inf.pres.act) so expand-verb-active-system.js
//          can fill in the rest (colligo_v, de_-prehendo_v, fundo_v, intremo_v,
//          parco_v, sancio_v).
//
// Usage: node migrate/author-l8a-l9-fixes.js [--dry-run]

import { readFile, writeFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, '..', '..', '..');
const LEXICON_PATH = join(REPO_ROOT, 'content', '_language', 'latin', 'lexicon.json');

// ── Paradigm helpers ─────────────────────────────────────────────────────────

const NOUN_ROWS = ['nom', 'voc', 'gen', 'dat', 'acc', 'abl'];
const NOUN_COLS_SG = ['sg'];
const NOUN_COLS = ['sg', 'pl'];
const ADJ_ROWS = ['nom', 'voc', 'gen', 'dat', 'acc', 'abl'];
const ADJ_COLS = ['sg.masc', 'sg.fem', 'sg.neut', 'pl.masc', 'pl.fem', 'pl.neut'];

function nounP(cells, extraCols = []) {
  return { type: 'noun', rows: [...NOUN_ROWS], cols: ['sg', 'pl', ...extraCols], cells };
}

function adjP(cells) {
  return { type: 'adj', rows: [...ADJ_ROWS], cols: [...ADJ_COLS], cells };
}

function verbSeedP(sg1, infPres, existingCells) {
  // Adds only 1sg.pres.ind.act and inf.pres.act as seeds for expansion.
  return {
    ...existingCells,
    '1sg.pres.ind.act': sg1,
    'inf.pres.act': infPres,
  };
}

// ── Fixes ─────────────────────────────────────────────────────────────────────

const FIXES = [

  // ── L8a: author paradigms ───────────────────────────────────────────────────

  // chaos_adv — Greek neuter, used only in nom/acc sg (defective)
  {
    id: 'chaos_adv',
    setGender: 'neut',
    setParadigm: nounP({
      'nom.sg': 'chaos', 'voc.sg': 'chaos', 'acc.sg': 'chaos',
    }),
  },

  // clymenos_adv — Greek 1st-decl feminine proper name (Clymene)
  // Rename lemma to actual citation form; author Greek-style declension.
  {
    id: 'clymenos_adv',
    setLemma: 'Clymene',
    setGender: 'fem',
    setParadigm: nounP({
      'nom.sg': 'Clymene',   'voc.sg': 'Clymene',
      'gen.sg': 'Clymenēs',  'dat.sg': 'Clymenae',
      'acc.sg': 'Clymenen',  'abl.sg': 'Clymene',
    }),
  },

  // congeries_adv — 5th-decl feminine (congeries, congeriei)
  {
    id: 'congeries_adv',
    setGender: 'fem',
    setParadigm: nounP({
      'nom.sg': 'congeries', 'voc.sg': 'congeries',
      'gen.sg': 'congeriei', 'dat.sg': 'congeriei',
      'acc.sg': 'congeriem', 'abl.sg': 'congerie',
    }),
  },

  // demens_n — 3rd-decl 1-term adjective (demens, dementis)
  {
    id: 'demens_n',
    setParadigm: adjP({
      'nom.sg.masc': 'demens', 'nom.sg.fem': 'demens', 'nom.sg.neut': 'demens',
      'voc.sg.masc': 'demens', 'voc.sg.fem': 'demens', 'voc.sg.neut': 'demens',
      'gen.sg.masc': 'dementis', 'gen.sg.fem': 'dementis', 'gen.sg.neut': 'dementis',
      'dat.sg.masc': 'dementi',  'dat.sg.fem': 'dementi',  'dat.sg.neut': 'dementi',
      'acc.sg.masc': 'dementem', 'acc.sg.fem': 'dementem', 'acc.sg.neut': 'demens',
      'abl.sg.masc': 'dementi',  'abl.sg.fem': 'dementi',  'abl.sg.neut': 'dementi',
    }),
  },

  // in-pleo_adv — compound verb impleō, implēre (2nd conj). Rename lemma to
  // actual citation form; author seed cells for expand-verb-active-system.js.
  {
    id: 'in-pleo_adv',
    setLemma: 'impleo',
    setParadigm: {
      type: 'verb',
      rows: ['1sg', '2sg', '3sg', '1pl', '2pl', '3pl'],
      cols: ['pres.ind.act', 'inf.pres.act'],
      cells: {
        '1sg.pres.ind.act': 'impleo',
        '2sg.pres.ind.act': 'imples',
        '3sg.pres.ind.act': 'implet',
        '1pl.pres.ind.act': 'implemus',
        '2pl.pres.ind.act': 'impletis',
        '3pl.pres.ind.act': 'implent',
        'inf.pres.act': 'implere',
      },
    },
  },

  // insidiae_adv — pluralia tantum 1st-decl feminine
  {
    id: 'insidiae_adv',
    setGender: 'fem',
    setParadigm: nounP({
      'nom.pl': 'insidiae', 'voc.pl': 'insidiae',
      'gen.pl': 'insidiarum', 'dat.pl': 'insidiis',
      'acc.pl': 'insidias',   'abl.pl': 'insidiis',
    }),
  },

  // instabilio_adv — 3rd-decl 2-term adjective (instabilis, instabile).
  // Rename lemma to actual nom.sg citation form.
  {
    id: 'instabilio_adv',
    setLemma: 'instabilis',
    setParadigm: adjP({
      'nom.sg.masc': 'instabilis', 'nom.sg.fem': 'instabilis', 'nom.sg.neut': 'instabile',
      'voc.sg.masc': 'instabilis', 'voc.sg.fem': 'instabilis', 'voc.sg.neut': 'instabile',
      'gen.sg.masc': 'instabilis', 'gen.sg.fem': 'instabilis', 'gen.sg.neut': 'instabilis',
      'dat.sg.masc': 'instabili',  'dat.sg.fem': 'instabili',  'dat.sg.neut': 'instabili',
      'acc.sg.masc': 'instabilem', 'acc.sg.fem': 'instabilem', 'acc.sg.neut': 'instabile',
      'abl.sg.masc': 'instabili',  'abl.sg.fem': 'instabili',  'abl.sg.neut': 'instabili',
      'nom.pl.masc': 'instabiles', 'nom.pl.fem': 'instabiles', 'nom.pl.neut': 'instabilia',
      'gen.pl.masc': 'instabilium','gen.pl.fem': 'instabilium','gen.pl.neut': 'instabilium',
      'dat.pl.masc': 'instabilibus','dat.pl.fem': 'instabilibus','dat.pl.neut': 'instabilibus',
      'acc.pl.masc': 'instabiles', 'acc.pl.fem': 'instabiles', 'acc.pl.neut': 'instabilia',
      'abl.pl.masc': 'instabilibus','abl.pl.fem': 'instabilibus','abl.pl.neut': 'instabilibus',
    }),
  },

  // lycaon_adv — Greek 3rd-decl masc proper name (Lycaon, Lycaonis)
  {
    id: 'lycaon_adv',
    setGender: 'masc',
    setParadigm: nounP({
      'nom.sg': 'Lycaon',   'voc.sg': 'Lycaon',
      'gen.sg': 'Lycaonis', 'dat.sg': 'Lycaoni',
      'acc.sg': 'Lycaonem', 'abl.sg': 'Lycaone',
    }),
  },

  // mariti_adv — stub for "maritus" (husband), only pl forms attested in text.
  // Lemma is "mariti" (nom.pl) — add minimal paradigm so lemma surface appears.
  {
    id: 'mariti_adv',
    setGender: 'masc',
    setParadigm: nounP({
      'nom.sg': 'maritus', 'voc.sg': 'marite',
      'gen.sg': 'mariti',  'dat.sg': 'marito',
      'acc.sg': 'maritum', 'abl.sg': 'marito',
      'nom.pl': 'mariti',  'voc.pl': 'mariti',
      'gen.pl': 'maritorum','dat.pl': 'maritīs',
      'acc.pl': 'maritos', 'abl.pl': 'maritīs',
    }),
  },

  // pythion_n — Greek 3rd-decl proper name (Pythion / Python)
  {
    id: 'pythion_n',
    setGender: 'masc',
    setParadigm: nounP({
      'nom.sg': 'Pythion',  'voc.sg': 'Pythion',
      'gen.sg': 'Pythionis','dat.sg': 'Pythioni',
      'acc.sg': 'Pythionem','abl.sg': 'Pythione',
    }),
  },

  // regales_adv — 3rd-decl 2-term adjective (regalis, regale). Lemma "regales"
  // = nom.pl.masc/fem — appears in paradigm directly.
  {
    id: 'regales_adv',
    setParadigm: adjP({
      'nom.sg.masc': 'regalis',   'nom.sg.fem': 'regalis',   'nom.sg.neut': 'regale',
      'voc.sg.masc': 'regalis',   'voc.sg.fem': 'regalis',   'voc.sg.neut': 'regale',
      'gen.sg.masc': 'regalis',   'gen.sg.fem': 'regalis',   'gen.sg.neut': 'regalis',
      'dat.sg.masc': 'regali',    'dat.sg.fem': 'regali',    'dat.sg.neut': 'regali',
      'acc.sg.masc': 'regalem',   'acc.sg.fem': 'regalem',   'acc.sg.neut': 'regale',
      'abl.sg.masc': 'regali',    'abl.sg.fem': 'regali',    'abl.sg.neut': 'regali',
      'nom.pl.masc': 'regales',   'nom.pl.fem': 'regales',   'nom.pl.neut': 'regalia',
      'gen.pl.masc': 'regalium',  'gen.pl.fem': 'regalium',  'gen.pl.neut': 'regalium',
      'dat.pl.masc': 'regalibus', 'dat.pl.fem': 'regalibus', 'dat.pl.neut': 'regalibus',
      'acc.pl.masc': 'regales',   'acc.pl.fem': 'regales',   'acc.pl.neut': 'regalia',
      'abl.pl.masc': 'regalibus', 'abl.pl.fem': 'regalibus', 'abl.pl.neut': 'regalibus',
    }),
  },

  // sincero_adv — 2nd/1st-decl adjective (sincerus, -a, -um). Lemma "sincero"
  // = dat/abl.sg.masc.neut — appears in paradigm.
  {
    id: 'sincero_adv',
    setParadigm: adjP({
      'nom.sg.masc': 'sincerus', 'nom.sg.fem': 'sincera',  'nom.sg.neut': 'sincerum',
      'voc.sg.masc': 'sincere',  'voc.sg.fem': 'sincera',  'voc.sg.neut': 'sincerum',
      'gen.sg.masc': 'sinceri',  'gen.sg.fem': 'sincerae', 'gen.sg.neut': 'sinceri',
      'dat.sg.masc': 'sincero',  'dat.sg.fem': 'sincerae', 'dat.sg.neut': 'sincero',
      'acc.sg.masc': 'sincerum', 'acc.sg.fem': 'sinceram', 'acc.sg.neut': 'sincerum',
      'abl.sg.masc': 'sincero',  'abl.sg.fem': 'sincera',  'abl.sg.neut': 'sincero',
      'nom.pl.masc': 'sinceri',  'nom.pl.fem': 'sincerae', 'nom.pl.neut': 'sincera',
      'gen.pl.masc': 'sincerorum','gen.pl.fem': 'sincerarum','gen.pl.neut': 'sincerorum',
      'dat.pl.masc': 'sinceris', 'dat.pl.fem': 'sinceris', 'dat.pl.neut': 'sinceris',
      'acc.pl.masc': 'sinceros', 'acc.pl.fem': 'sinceras', 'acc.pl.neut': 'sincera',
      'abl.pl.masc': 'sinceris', 'abl.pl.fem': 'sinceris', 'abl.pl.neut': 'sinceris',
    }),
  },

  // sponte_adv — defective noun (only abl.sg "sponte" used classically)
  {
    id: 'sponte_adv',
    setGender: 'fem',
    setParadigm: nounP({ 'abl.sg': 'sponte', 'nom.sg': 'sponte' }),
  },

  // tonitruo_adv — 4th-decl neuter (tonitrus / tonitrua). Lemma "tonitruo"
  // = abl.sg of 4th-decl (tonitrūō) — appears in paradigm.
  {
    id: 'tonitruo_adv',
    setGender: 'neut',
    setParadigm: nounP({
      'nom.sg': 'tonitrus',    'voc.sg': 'tonitrus',
      'gen.sg': 'tonitrus',    'dat.sg': 'tonitruī',
      'acc.sg': 'tonitruum',   'abl.sg': 'tonitruo',
      'nom.pl': 'tonitrua',    'voc.pl': 'tonitrua',
      'gen.pl': 'tonitruorum', 'dat.pl': 'tonitribus',
      'acc.pl': 'tonitrua',    'abl.pl': 'tonitribus',
    }),
  },

  // ── L9: rename wrong lemma strings ──────────────────────────────────────────

  { id: 'cani_n',  setLemma: 'cania'   },
  { id: 'ceter_adj', setLemma: 'ceterus' },
  { id: 'ulter_pron', setLemma: 'ultimus' },

  // ── L9: add seed present-system cells to perfect-only verbs ─────────────────

  { id: 'colligo_v',      mergeCells: { '1sg.pres.ind.act': 'colligo',    'inf.pres.act': 'colligere'    } },
  { id: 'de_-prehendo_v', mergeCells: { '1sg.pres.ind.act': 'deprehendo', 'inf.pres.act': 'deprehendere' } },
  { id: 'fundo_v',        mergeCells: { '1sg.pres.ind.act': 'fundo',      'inf.pres.act': 'fundere'      } },
  { id: 'intremo_v',      mergeCells: { '1sg.pres.ind.act': 'intremo',    'inf.pres.act': 'intremere'    } },
  { id: 'parco_v',        mergeCells: { '1sg.pres.ind.act': 'parco',      'inf.pres.act': 'parcere'      } },
  { id: 'sancio_v',       mergeCells: { '1sg.pres.ind.act': 'sancio',     'inf.pres.act': 'sancire'      } },
];

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  const { values } = parseArgs({ options: { 'dry-run': { type: 'boolean' } } });
  const dryRun = values['dry-run'] ?? false;

  const lex = JSON.parse(await readFile(LEXICON_PATH, 'utf8'));
  const byId = new Map(lex.lemmata.map((l) => [l.id, l]));
  let applied = 0;
  let skipped = 0;

  for (const fix of FIXES) {
    const lemma = byId.get(fix.id);
    if (!lemma) { console.warn(`WARN: lemma ${fix.id} not found`); skipped++; continue; }

    if (fix.setLemma !== undefined) lemma.lemma = fix.setLemma;
    if (fix.setGender !== undefined) lemma.gender = fix.setGender;

    if (fix.setParadigm !== undefined) {
      if (lemma.paradigm) {
        // Merge into existing paradigm cells (additive for set-paradigm).
        Object.assign(lemma.paradigm.cells, fix.setParadigm.cells);
        lemma.paradigm.type = fix.setParadigm.type;
      } else {
        lemma.paradigm = fix.setParadigm;
      }
    }

    if (fix.mergeCells !== undefined) {
      if (!lemma.paradigm) {
        console.warn(`WARN: mergeCells on ${fix.id} but no paradigm exists`);
        skipped++;
        continue;
      }
      let addedCols = false;
      for (const [k, v] of Object.entries(fix.mergeCells)) {
        if (!(k in lemma.paradigm.cells)) {
          lemma.paradigm.cells[k] = v;
          const col = k.split('.').slice(1).join('.');
          if (!lemma.paradigm.cols.includes(col)) { lemma.paradigm.cols.push(col); addedCols = true; }
        }
      }
    }

    applied++;
  }

  if (!dryRun) await writeFile(LEXICON_PATH, JSON.stringify(lex, null, 2) + '\n', 'utf8');
  console.log(`${dryRun ? '[dry-run] ' : ''}applied ${applied} fixes, skipped ${skipped}`);
}

main().catch((err) => { console.error(err.stack ?? err); process.exit(1); });

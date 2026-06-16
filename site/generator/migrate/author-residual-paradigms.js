#!/usr/bin/env node
// Editorial backlog: clean up the L8a/L8/L9 tail.
//
//   1. Truly indeclinable adjectives (tot, totidem) — single nom.sg.* cells
//      across all genders.
//   2. Stub-alias pronouns (illa, qua) used adverbially in Ovid's markdown —
//      reclassify to `adv`.
//   3. Stub-alias pronouns (omne, omnes, sua, ulter) covering a subset of a
//      base lemma's forms — author small paradigms keyed by the surfaces
//      they're actually tagged with in the concordance.
//   4. The simple regular verb `membro_v` (-are).
//   5. Defective irregular verbs (`inquam`, `reor`, `tueor`, `prosum`,
//      `supersum`) — small hand-authored paradigms covering the forms that
//      actually occur in classical Latin.
//
// Usage: node migrate/author-residual-paradigms.js [--dry-run]

import { readFile, writeFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, '..', '..', '..');
const LEXICON_PATH = join(REPO_ROOT, 'content', '_language', 'latin', 'lexicon.json');

const ADJ_ROWS = ['nom', 'voc', 'gen', 'dat', 'acc', 'abl'];
const ADJ_COLS = ['sg.masc', 'sg.fem', 'sg.neut', 'pl.masc', 'pl.fem', 'pl.neut'];
const NOUN_ROWS = ['nom', 'voc', 'gen', 'dat', 'acc', 'abl'];
const NOUN_COLS = ['sg', 'pl'];

function adjP(cells) {
  return { type: 'adj', rows: [...ADJ_ROWS], cols: [...ADJ_COLS], cells };
}

function pronP(cells) {
  return { type: 'pron', rows: [...ADJ_ROWS], cols: [...ADJ_COLS], cells };
}

// Indeclinable adjective — emit the lemma in every cell so the form is
// discoverable regardless of which gender/number the markdown tags.
function indeclAdj(form) {
  const cells = {};
  for (const c of ADJ_COLS) {
    for (const r of ADJ_ROWS) cells[`${r}.${c}`] = form;
  }
  return adjP(cells);
}

const FIXES = [];

// 1. Indeclinables
FIXES.push({ id: 'tot_adj',     setParadigm: indeclAdj('tot') });
FIXES.push({ id: 'totidem_adj', setParadigm: indeclAdj('totidem'), setHead: 'totidem (indeclinable)' });

// 2. Stub-aliases reclassified to adv
FIXES.push({ id: 'illa_pron', reclassifyAs: 'adv', setHead: 'illa (adv., abl.sg.fem of ille)' });
FIXES.push({ id: 'qua_pron',  reclassifyAs: 'adv', setHead: 'qua (adv.)' });

// 3. Stub-alias pronouns — full paradigms cribbed from the base lemma so the
//    inflected surfaces in markdown find an entry. These entries co-exist with
//    the base lemmata (omnis, ille, suus, alter); a future editorial pass
//    should merge them.
FIXES.push({ id: 'omne_pron', setParadigm: pronP({
  // Neuter of omnis (3rd-decl 2-term i-stem).
  'nom.sg.neut': 'omne', 'voc.sg.neut': 'omne',
  'gen.sg.neut': 'omnis', 'dat.sg.neut': 'omni',
  'acc.sg.neut': 'omne', 'abl.sg.neut': 'omni',
  'nom.pl.neut': 'omnia', 'voc.pl.neut': 'omnia',
  'gen.pl.neut': 'omnium', 'dat.pl.neut': 'omnibus',
  'acc.pl.neut': 'omnia', 'abl.pl.neut': 'omnibus',
}) });
FIXES.push({ id: 'omnes_pron', setParadigm: pronP({
  // Masc / fem plural of omnis.
  'nom.pl.masc': 'omnes', 'voc.pl.masc': 'omnes',
  'gen.pl.masc': 'omnium', 'dat.pl.masc': 'omnibus',
  'acc.pl.masc': 'omnes', 'abl.pl.masc': 'omnibus',
  'nom.pl.fem': 'omnes', 'voc.pl.fem': 'omnes',
  'gen.pl.fem': 'omnium', 'dat.pl.fem': 'omnibus',
  'acc.pl.fem': 'omnes', 'abl.pl.fem': 'omnibus',
}) });
FIXES.push({ id: 'sua_pron', setParadigm: pronP({
  // Fem (and neut.pl) forms of suus.
  'nom.sg.fem': 'sua', 'voc.sg.fem': 'sua',
  'gen.sg.fem': 'suae', 'dat.sg.fem': 'suae',
  'acc.sg.fem': 'suam', 'abl.sg.fem': 'sua',
  'nom.pl.fem': 'suae', 'voc.pl.fem': 'suae',
  'gen.pl.fem': 'suarum', 'dat.pl.fem': 'suis',
  'acc.pl.fem': 'suas', 'abl.pl.fem': 'suis',
}) });
FIXES.push({ id: 'ulter_pron', setParadigm: pronP({
  // Markdown tags surfaces ultima / ultra / ultimus against this stub. Cover
  // those forms via the ultimus_adj paradigm; further cleanup is editorial.
  'nom.sg.fem': 'ultima', 'voc.sg.fem': 'ultima', 'abl.sg.fem': 'ultima',
  'nom.sg.masc': 'ultimus', 'voc.sg.masc': 'ultime',
  'acc.sg.neut': 'ultimum',
  'nom.pl.neut': 'ultima', 'voc.pl.neut': 'ultima', 'acc.pl.neut': 'ultima',
}) });

// 4. Regular -are verb (membro)
{
  const stem = 'membr';
  const conjugate1stAct = {
    '1sg.pres.ind.act': `${stem}o`,
    '2sg.pres.ind.act': `${stem}as`,
    '3sg.pres.ind.act': `${stem}at`,
    '1pl.pres.ind.act': `${stem}amus`,
    '2pl.pres.ind.act': `${stem}atis`,
    '3pl.pres.ind.act': `${stem}ant`,
    '1sg.imperf.ind.act': `${stem}abam`,
    '2sg.imperf.ind.act': `${stem}abas`,
    '3sg.imperf.ind.act': `${stem}abat`,
    '1pl.imperf.ind.act': `${stem}abamus`,
    '2pl.imperf.ind.act': `${stem}abatis`,
    '3pl.imperf.ind.act': `${stem}abant`,
    '1sg.fut.ind.act': `${stem}abo`,
    '2sg.fut.ind.act': `${stem}abis`,
    '3sg.fut.ind.act': `${stem}abit`,
    '1pl.fut.ind.act': `${stem}abimus`,
    '2pl.fut.ind.act': `${stem}abitis`,
    '3pl.fut.ind.act': `${stem}abunt`,
    '2sg.pres.imp.act': `${stem}a`,
    '2pl.pres.imp.act': `${stem}ate`,
    'inf.pres.act': `${stem}are`,
  };
  FIXES.push({ id: 'membro_v', setParadigm: {
    type: 'verb',
    rows: ['1sg','2sg','3sg','1pl','2pl','3pl','inf'],
    cols: ['pres.ind.act','imperf.ind.act','fut.ind.act','pres.imp.act','pres.act'],
    cells: conjugate1stAct,
  } });
}

// 5. Defective irregular verbs
//
// inquam — defective verb meaning "say"; only ~6 forms attested.
FIXES.push({ id: 'inquam_v', setParadigm: {
  type: 'verb',
  rows: ['1sg','2sg','3sg','1pl','2pl','3pl'],
  cols: ['pres.ind.act','imperf.ind.act','fut.ind.act','perf.ind.act'],
  cells: {
    '1sg.pres.ind.act': 'inquam',
    '2sg.pres.ind.act': 'inquis',
    '3sg.pres.ind.act': 'inquit',
    '3pl.pres.ind.act': 'inquiunt',
    '2sg.fut.ind.act':  'inquies',
    '3sg.fut.ind.act':  'inquiet',
    '3sg.perf.ind.act': 'inquit', // identical to present in form
  },
} });

// reor — deponent verb "think, suppose". Treat as a verb paradigm with the
// passive endings (the markdown spans tag deponents as active-meaning forms;
// we expose all the standard forms here).
{
  const stem = 'r';
  FIXES.push({ id: 'reor_v', setParadigm: {
    type: 'verb',
    rows: ['1sg','2sg','3sg','1pl','2pl','3pl','inf'],
    cols: ['pres.ind.pass','imperf.ind.pass','fut.ind.pass','pres.pass'],
    cells: {
      '1sg.pres.ind.pass': `${stem}eor`,
      '2sg.pres.ind.pass': `${stem}eris`,
      '3sg.pres.ind.pass': `${stem}etur`,
      '1pl.pres.ind.pass': `${stem}emur`,
      '2pl.pres.ind.pass': `${stem}emini`,
      '3pl.pres.ind.pass': `${stem}entur`,
      'inf.pres.pass': `${stem}eri`,
    },
  } });
}

// tueor — deponent "look at, watch over". Same pattern as reor.
{
  const stem = 'tu';
  FIXES.push({ id: 'tueor_v', setParadigm: {
    type: 'verb',
    rows: ['1sg','2sg','3sg','1pl','2pl','3pl','inf'],
    cols: ['pres.ind.pass','pres.pass'],
    cells: {
      '1sg.pres.ind.pass': `${stem}eor`,
      '2sg.pres.ind.pass': `${stem}eris`,
      '3sg.pres.ind.pass': `${stem}etur`,
      '1pl.pres.ind.pass': `${stem}emur`,
      '2pl.pres.ind.pass': `${stem}emini`,
      '3pl.pres.ind.pass': `${stem}entur`,
      'inf.pres.pass': `${stem}eri`,
    },
  } });
}

// prosum, prodesse — "be of use". Built off sum with the prefix pro-, which
// becomes prod- before vowel-initial forms (prodest, prosumus, etc.).
FIXES.push({ id: 'prosum_v', setParadigm: {
  type: 'verb',
  rows: ['1sg','2sg','3sg','1pl','2pl','3pl','inf'],
  cols: ['pres.ind.act','imperf.ind.act','fut.ind.act','perf.ind.act','pres.act'],
  cells: {
    '1sg.pres.ind.act': 'prosum',
    '2sg.pres.ind.act': 'prodes',
    '3sg.pres.ind.act': 'prodest',
    '1pl.pres.ind.act': 'prosumus',
    '2pl.pres.ind.act': 'prodestis',
    '3pl.pres.ind.act': 'prosunt',
    '1sg.imperf.ind.act': 'proderam',
    '3sg.imperf.ind.act': 'proderat',
    '1sg.fut.ind.act': 'prodero',
    '3sg.fut.ind.act': 'proderit',
    '1sg.perf.ind.act': 'profui',
    '3sg.perf.ind.act': 'profuit',
    'inf.pres.act': 'prodesse',
  },
} });

// supersum — "be left over". Same pattern as sum with super- prefix.
FIXES.push({ id: 'supersum_v', setParadigm: {
  type: 'verb',
  rows: ['1sg','2sg','3sg','1pl','2pl','3pl','inf'],
  cols: ['pres.ind.act','imperf.ind.act','fut.ind.act','perf.ind.act','pres.act'],
  cells: {
    '1sg.pres.ind.act': 'supersum',
    '2sg.pres.ind.act': 'superes',
    '3sg.pres.ind.act': 'superest',
    '1pl.pres.ind.act': 'supersumus',
    '2pl.pres.ind.act': 'superestis',
    '3pl.pres.ind.act': 'supersunt',
    '1sg.imperf.ind.act': 'supereram',
    '3sg.imperf.ind.act': 'supererat',
    '1sg.fut.ind.act': 'supero',
    '3sg.fut.ind.act': 'supererit',
    '1sg.perf.ind.act': 'superfui',
    '3sg.perf.ind.act': 'superfuit',
    'inf.pres.act': 'superesse',
  },
} });

// Two L9 stragglers: suo_v / uno_v whose lemma is the 1sg.pres.ind.act ("suo",
// "uno") but their paradigm only contains ppp forms. Add the 1sg cell from
// the lemma string so L9 clears; downstream tense expansion (already run)
// will fill out the present-system.
FIXES.push({ id: 'suo_v', setCellIfMissing: { '1sg.pres.ind.act': 'suo' } });
FIXES.push({ id: 'uno_v', setCellIfMissing: { '1sg.pres.ind.act': 'uno' } });

// talis_pron has a sparse paradigm (only neut cells "tale"/"talia") — fill
// with the standard talis, -is, -e 3rd-decl pronominal-adjective pattern.
FIXES.push({ id: 'talis_pron', setParadigm: (() => {
  const stem = 'tal';
  return pronP({
    'nom.sg.masc': `${stem}is`, 'nom.sg.fem': `${stem}is`, 'nom.sg.neut': `${stem}e`,
    'voc.sg.masc': `${stem}is`, 'voc.sg.fem': `${stem}is`, 'voc.sg.neut': `${stem}e`,
    'gen.sg.masc': `${stem}is`, 'gen.sg.fem': `${stem}is`, 'gen.sg.neut': `${stem}is`,
    'dat.sg.masc': `${stem}i`,  'dat.sg.fem': `${stem}i`,  'dat.sg.neut': `${stem}i`,
    'acc.sg.masc': `${stem}em`, 'acc.sg.fem': `${stem}em`, 'acc.sg.neut': `${stem}e`,
    'abl.sg.masc': `${stem}i`,  'abl.sg.fem': `${stem}i`,  'abl.sg.neut': `${stem}i`,
    'nom.pl.masc': `${stem}es`, 'nom.pl.fem': `${stem}es`, 'nom.pl.neut': `${stem}ia`,
    'voc.pl.masc': `${stem}es`, 'voc.pl.fem': `${stem}es`, 'voc.pl.neut': `${stem}ia`,
    'gen.pl.masc': `${stem}ium`,'gen.pl.fem': `${stem}ium`,'gen.pl.neut': `${stem}ium`,
    'dat.pl.masc': `${stem}ibus`,'dat.pl.fem':`${stem}ibus`,'dat.pl.neut':`${stem}ibus`,
    'acc.pl.masc': `${stem}es`, 'acc.pl.fem': `${stem}es`, 'acc.pl.neut': `${stem}ia`,
    'abl.pl.masc': `${stem}ibus`,'abl.pl.fem':`${stem}ibus`,'abl.pl.neut':`${stem}ibus`,
  });
})() });

async function main() {
  const { values } = parseArgs({ options: { 'dry-run': { type: 'boolean' } } });
  const dryRun = values['dry-run'] ?? false;

  const lex = JSON.parse(await readFile(LEXICON_PATH, 'utf8'));
  const byId = new Map(lex.lemmata.map((l) => [l.id, l]));

  const applied = [];
  const missing = [];
  for (const f of FIXES) {
    const l = byId.get(f.id);
    if (!l) { missing.push(f.id); continue; }
    if (f.reclassifyAs) {
      l.pos = f.reclassifyAs;
      delete l.paradigm;
      delete l.ppp_paradigm;
      delete l.gender;
    }
    if (f.setParadigm) l.paradigm = f.setParadigm;
    if (f.setHead) l.head = f.setHead;
    if (f.setCellIfMissing && l.paradigm?.cells) {
      for (const [k, v] of Object.entries(f.setCellIfMissing)) {
        if (!(k in l.paradigm.cells)) l.paradigm.cells[k] = v;
      }
    }
    applied.push(f.id);
  }

  if (!dryRun) await writeFile(LEXICON_PATH, JSON.stringify(lex, null, 2) + '\n', 'utf8');
  console.log(`${dryRun ? '[dry-run] ' : ''}applied ${applied.length} residual fixes:`);
  for (const id of applied) console.log(`  ${id}`);
  if (missing.length) {
    console.log(`missing from lexicon: ${missing.length}`);
    for (const id of missing) console.log(`  ${id}`);
  }
}

main().catch((err) => {
  console.error(err.stack ?? err);
  process.exit(1);
});

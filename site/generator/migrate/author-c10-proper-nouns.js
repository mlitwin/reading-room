#!/usr/bin/env node
// Editorial backlog: add minimum paradigms for the proper nouns/adjectives
// that appear as hosts in unsplit C10 enclitic tokens (Nabataeaque, Persidaque,
// Stygiisque, faunique, Patareaque, conplexusque, Apidanusque, Aethiopasque).
//
// After running this script, re-run split-enclitics-json.js to split the tokens.
//
// Usage: node migrate/author-c10-proper-nouns.js [--dry-run]

import { readFile, writeFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, '..', '..', '..');
const LEXICON_PATH = join(REPO_ROOT, 'content', '_language', 'latin', 'lexicon.json');

const NOUN_ROWS = ['nom', 'voc', 'gen', 'dat', 'acc', 'abl'];
const ADJ_ROWS = ['nom', 'voc', 'gen', 'dat', 'acc', 'abl'];
const ADJ_COLS = ['sg.masc', 'sg.fem', 'sg.neut', 'pl.masc', 'pl.fem', 'pl.neut'];

function nounP(cells) {
  return { type: 'noun', rows: [...NOUN_ROWS], cols: ['sg', 'pl'], cells };
}
function adjP(cells) {
  return { type: 'adj', rows: [...ADJ_ROWS], cols: [...ADJ_COLS], cells };
}

const NEW_LEMMATA = [
  // Nabataeaque → Nabataea + que
  // Nabataeus, -a, -um (Nabataean adjective). Host = "Nabataea" (fem nom.sg or neut pl).
  {
    id: 'Nabataeus_adj',
    lemma: 'Nabataeus',
    pos: 'adj',
    glosses: ['Nabataean', 'of the Nabataeans'],
    head: 'Nabataeus, -a, -um',
    reviewed: false,
    paradigm: adjP({
      'nom.sg.masc': 'Nabataeus', 'nom.sg.fem': 'Nabataea',  'nom.sg.neut': 'Nabataeum',
      'voc.sg.masc': 'Nabataee',  'voc.sg.fem': 'Nabataea',  'voc.sg.neut': 'Nabataeum',
      'gen.sg.masc': 'Nabataei',  'gen.sg.fem': 'Nabataeae', 'gen.sg.neut': 'Nabataei',
      'dat.sg.masc': 'Nabataeo',  'dat.sg.fem': 'Nabataeae', 'dat.sg.neut': 'Nabataeo',
      'acc.sg.masc': 'Nabataeum', 'acc.sg.fem': 'Nabataeam', 'acc.sg.neut': 'Nabataeum',
      'abl.sg.masc': 'Nabataeo',  'abl.sg.fem': 'Nabataea',  'abl.sg.neut': 'Nabataeo',
    }),
  },

  // Persidaque → Persida + que
  // Persis, -idis f. (Persia; also used as adjective "Persian"). Acc.sg = Persidem / Persida.
  {
    id: 'Persis_n',
    lemma: 'Persis',
    pos: 'noun',
    gender: 'fem',
    glosses: ['Persia', 'the Persian woman'],
    head: 'Persis, -idis, f.',
    reviewed: false,
    paradigm: nounP({
      'nom.sg': 'Persis', 'voc.sg': 'Persi',
      'gen.sg': 'Persidis', 'dat.sg': 'Persidi',
      'acc.sg': ['Persidem', 'Persida'], 'abl.sg': 'Perside',
    }),
  },

  // Stygiisque → Stygiis + que
  // Stygius, -a, -um (Stygian). Host = "Stygiis" (dat/abl pl).
  {
    id: 'Stygius_adj',
    lemma: 'Stygius',
    pos: 'adj',
    glosses: ['Stygian', 'of the river Styx'],
    head: 'Stygius, -a, -um',
    reviewed: false,
    paradigm: adjP({
      'nom.sg.masc': 'Stygius',  'nom.sg.fem': 'Stygia',   'nom.sg.neut': 'Stygium',
      'voc.sg.masc': 'Stygie',   'voc.sg.fem': 'Stygia',   'voc.sg.neut': 'Stygium',
      'gen.sg.masc': 'Stygii',   'gen.sg.fem': 'Stygiae',  'gen.sg.neut': 'Stygii',
      'dat.sg.masc': 'Stygio',   'dat.sg.fem': 'Stygiae',  'dat.sg.neut': 'Stygio',
      'acc.sg.masc': 'Stygium',  'acc.sg.fem': 'Stygiam',  'acc.sg.neut': 'Stygium',
      'abl.sg.masc': 'Stygio',   'abl.sg.fem': 'Stygia',   'abl.sg.neut': 'Stygio',
      'nom.pl.masc': 'Stygii',   'nom.pl.fem': 'Stygiae',  'nom.pl.neut': 'Stygia',
      'gen.pl.masc': 'Stygiorum','gen.pl.fem': 'Stygiarum','gen.pl.neut': 'Stygiorum',
      'dat.pl.masc': 'Stygiis',  'dat.pl.fem': 'Stygiis',  'dat.pl.neut': 'Stygiis',
      'acc.pl.masc': 'Stygios',  'acc.pl.fem': 'Stygias',  'acc.pl.neut': 'Stygia',
      'abl.pl.masc': 'Stygiis',  'abl.pl.fem': 'Stygiis',  'abl.pl.neut': 'Stygiis',
    }),
  },

  // faunique → fauni + que
  // Faunus, -i m. (Faunus, Italian rustic deity). Host = "fauni" (gen.sg or nom.pl).
  {
    id: 'Faunus_n',
    lemma: 'Faunus',
    pos: 'noun',
    gender: 'masc',
    glosses: ['Faunus (Italic deity of forests and fields)'],
    head: 'Faunus, -i, m.',
    reviewed: false,
    paradigm: nounP({
      'nom.sg': 'Faunus', 'voc.sg': 'Faune',
      'gen.sg': 'Fauni',  'dat.sg': 'Fauno',
      'acc.sg': 'Faunum', 'abl.sg': 'Fauno',
      'nom.pl': 'Fauni',  'voc.pl': 'Fauni',
      'gen.pl': 'Faunorum','dat.pl': 'Faunis',
      'acc.pl': 'Faunos', 'abl.pl': 'Faunis',
    }),
  },

  // Patareaque → Patarea + que
  // Pataraeus, -a, -um (of Patara, a city in Lycia sacred to Apollo). Host = "Patarea".
  {
    id: 'Pataraeus_adj',
    lemma: 'Pataraeus',
    pos: 'adj',
    glosses: ['Pataraean', 'of Patara (Lycia)'],
    head: 'Pataraeus, -a, -um',
    reviewed: false,
    paradigm: adjP({
      'nom.sg.masc': 'Pataraeus', 'nom.sg.fem': 'Pataraea',  'nom.sg.neut': 'Pataraeum',
      'voc.sg.masc': 'Pataraee',  'voc.sg.fem': 'Pataraea',  'voc.sg.neut': 'Pataraeum',
      'gen.sg.masc': 'Pataraei',  'gen.sg.fem': 'Pataraee',  'gen.sg.neut': 'Pataraei',
      'dat.sg.masc': 'Pataraeo',  'dat.sg.fem': 'Pataraee',  'dat.sg.neut': 'Pataraeo',
      'acc.sg.masc': 'Pataraeum', 'acc.sg.fem': 'Pataraeem', 'acc.sg.neut': 'Pataraeum',
      'abl.sg.masc': 'Pataraeo',  'abl.sg.fem': 'Pataraea',  'abl.sg.neut': 'Pataraeo',
    }),
  },

  // conplexusque → conplexus + que
  // complexus, -us m. (embrace, encircling). The archaic spelling "conplexus" used by Ovid.
  {
    id: 'complexus_n',
    lemma: 'complexus',
    pos: 'noun',
    gender: 'masc',
    alt_forms: ['conplexus', 'conplexum', 'conplexu', 'conplexus'],
    glosses: ['embrace', 'encircling', 'grasp'],
    head: 'complexus, -us, m.',
    reviewed: false,
    paradigm: nounP({
      'nom.sg': ['complexus', 'conplexus'], 'voc.sg': ['complexus', 'conplexus'],
      'gen.sg': ['complexus', 'conplexus'], 'dat.sg': ['complexui', 'conplexui'],
      'acc.sg': ['complexum', 'conplexum'], 'abl.sg': ['complexu', 'conplexu'],
      'nom.pl': ['complexus', 'conplexus'], 'voc.pl': ['complexus', 'conplexus'],
      'gen.pl': ['complexuum', 'conplexuum'], 'dat.pl': ['complexibus', 'conplexibus'],
      'acc.pl': ['complexus', 'conplexus'], 'abl.pl': ['complexibus', 'conplexibus'],
    }),
  },

  // Apidanusque → Apidanus + que
  // Apidanus, -i m. (a river in Thessaly).
  {
    id: 'Apidanus_n',
    lemma: 'Apidanus',
    pos: 'noun',
    gender: 'masc',
    glosses: ['Apidanus (river in Thessaly)'],
    head: 'Apidanus, -i, m.',
    reviewed: false,
    paradigm: nounP({
      'nom.sg': 'Apidanus', 'voc.sg': 'Apidane',
      'gen.sg': 'Apidani',  'dat.sg': 'Apidano',
      'acc.sg': 'Apidanum', 'abl.sg': 'Apidano',
    }),
  },

  // Aethiopasque → Aethiopas + que
  // Aethiops, -opis m./f. (Ethiopian). Host = "Aethiopas" (acc.pl).
  {
    id: 'Aethiops_n',
    lemma: 'Aethiops',
    pos: 'noun',
    gender: ['masc', 'fem'],
    glosses: ['Ethiopian', 'person from Ethiopia'],
    head: 'Aethiops, -opis, m./f.',
    reviewed: false,
    paradigm: nounP({
      'nom.sg': 'Aethiops',    'voc.sg': 'Aethiops',
      'gen.sg': 'Aethiopum',   'dat.sg': 'Aethiopi',
      'acc.sg': 'Aethiopem',   'abl.sg': 'Aethiope',
      'nom.pl': 'Aethiopes',   'voc.pl': 'Aethiopes',
      'gen.pl': 'Aethiopum',   'dat.pl': 'Aethiopibus',
      'acc.pl': 'Aethiopas',   'abl.pl': 'Aethiopibus',
    }),
  },
];

// Also: fix equus_n voc.sg to include "eque" so C10 stops flagging it.
const FIXES = [
  {
    id: 'equus_n',
    setCell: { 'voc.sg': ['equus', 'eque'] },
  },
];

async function main() {
  const { values } = parseArgs({ options: { 'dry-run': { type: 'boolean' } } });
  const dryRun = values['dry-run'] ?? false;

  const lex = JSON.parse(await readFile(LEXICON_PATH, 'utf8'));
  const byId = new Map(lex.lemmata.map((l) => [l.id, l]));
  let added = 0;
  let fixed = 0;

  for (const newLemma of NEW_LEMMATA) {
    if (byId.has(newLemma.id)) {
      console.warn(`SKIP: ${newLemma.id} already exists`);
      continue;
    }
    lex.lemmata.push(newLemma);
    added++;
  }

  for (const fix of FIXES) {
    const lemma = byId.get(fix.id);
    if (!lemma) { console.warn(`WARN: ${fix.id} not found`); continue; }
    if (fix.setCell && lemma.paradigm) {
      Object.assign(lemma.paradigm.cells, fix.setCell);
      fixed++;
    }
  }

  if (!dryRun) await writeFile(LEXICON_PATH, JSON.stringify(lex, null, 2) + '\n', 'utf8');
  console.log(`${dryRun ? '[dry-run] ' : ''}added ${added} lemmata, fixed ${fixed} cells`);
}

main().catch((err) => { console.error(err.stack ?? err); process.exit(1); });

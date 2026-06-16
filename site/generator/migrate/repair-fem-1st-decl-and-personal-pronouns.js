#!/usr/bin/env node
// Editorial backlog:
//
//  - nos_pron / vos_pron were authored with cell keys ending in `.sg.masc`,
//    but these are plural-only common-gender pronouns. Re-key them so the
//    cells live at .pl.{masc,fem,neut}.
//
//  - mora_n / summa_n / avia_n / bucina_n / aura_n / pascua_n / tela_n /
//    sera_n / vena_n / vicina_n / calida_n / ara_n / diva_n had their gender
//    fixed (fix-noun-genders) but still carry 2nd-decl-neuter cells from the
//    seeder. Rebuild as 1st-decl feminine.
//
// Usage: node migrate/repair-fem-1st-decl-and-personal-pronouns.js [--dry-run]

import { readFile, writeFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, '..', '..', '..');
const LEXICON_PATH = join(REPO_ROOT, 'content', '_language', 'latin', 'lexicon.json');

const NOUN_ROWS = ['nom', 'voc', 'gen', 'dat', 'acc', 'abl'];

function firstDeclFem(lemma) {
  const stem = lemma.endsWith('a') ? lemma.slice(0, -1) : lemma;
  return {
    type: 'noun',
    rows: [...NOUN_ROWS],
    cols: ['sg', 'pl'],
    cells: {
      'nom.sg': `${stem}a`,   'voc.sg': `${stem}a`,
      'gen.sg': `${stem}ae`,  'dat.sg': `${stem}ae`,
      'acc.sg': `${stem}am`,  'abl.sg': `${stem}a`,
      'nom.pl': `${stem}ae`,  'voc.pl': `${stem}ae`,
      'gen.pl': `${stem}arum`,'dat.pl': `${stem}is`,
      'acc.pl': `${stem}as`,  'abl.pl': `${stem}is`,
    },
  };
}

const NOUN_REBUILDS = [
  'ara_n', 'aura_n', 'avia_n', 'bucina_n', 'calida_n', 'diva_n',
  'mora_n', 'sera_n', 'summa_n', 'vena_n', 'vicina_n', 'tela_n',
  'pascua_n',
];

const PERSONAL_PRONOUN_REBUILDS = {
  nos_pron: {
    'nom.pl.masc': 'nos',     'nom.pl.fem': 'nos',     'nom.pl.neut': 'nos',
    'voc.pl.masc': 'nos',     'voc.pl.fem': 'nos',     'voc.pl.neut': 'nos',
    'gen.pl.masc': ['nostrum', 'nostri'], 'gen.pl.fem': ['nostrum', 'nostri'], 'gen.pl.neut': ['nostrum', 'nostri'],
    'dat.pl.masc': 'nobis',   'dat.pl.fem': 'nobis',   'dat.pl.neut': 'nobis',
    'acc.pl.masc': 'nos',     'acc.pl.fem': 'nos',     'acc.pl.neut': 'nos',
    'abl.pl.masc': 'nobis',   'abl.pl.fem': 'nobis',   'abl.pl.neut': 'nobis',
  },
  vos_pron: {
    'nom.pl.masc': 'vos',     'nom.pl.fem': 'vos',     'nom.pl.neut': 'vos',
    'voc.pl.masc': 'vos',     'voc.pl.fem': 'vos',     'voc.pl.neut': 'vos',
    'gen.pl.masc': ['vestrum', 'vestri'], 'gen.pl.fem': ['vestrum', 'vestri'], 'gen.pl.neut': ['vestrum', 'vestri'],
    'dat.pl.masc': 'vobis',   'dat.pl.fem': 'vobis',   'dat.pl.neut': 'vobis',
    'acc.pl.masc': 'vos',     'acc.pl.fem': 'vos',     'acc.pl.neut': 'vos',
    'abl.pl.masc': 'vobis',   'abl.pl.fem': 'vobis',   'abl.pl.neut': 'vobis',
  },
};

const PRONOUN_ROWS = ['nom', 'voc', 'gen', 'dat', 'acc', 'abl'];
const PRONOUN_COLS = ['sg.masc', 'sg.fem', 'sg.neut', 'pl.masc', 'pl.fem', 'pl.neut'];

async function main() {
  const { values } = parseArgs({ options: { 'dry-run': { type: 'boolean' } } });
  const dryRun = values['dry-run'] ?? false;
  const lex = JSON.parse(await readFile(LEXICON_PATH, 'utf8'));
  const byId = new Map(lex.lemmata.map((l) => [l.id, l]));
  const log = [];
  for (const id of NOUN_REBUILDS) {
    const l = byId.get(id);
    if (!l) continue;
    l.paradigm = firstDeclFem(l.lemma);
    log.push(`noun ${id}`);
  }
  for (const [id, cells] of Object.entries(PERSONAL_PRONOUN_REBUILDS)) {
    const l = byId.get(id);
    if (!l) continue;
    l.paradigm = {
      type: 'pron',
      rows: [...PRONOUN_ROWS],
      cols: [...PRONOUN_COLS],
      cells,
    };
    log.push(`pronoun ${id}`);
  }
  if (!dryRun) await writeFile(LEXICON_PATH, JSON.stringify(lex, null, 2) + '\n', 'utf8');
  console.log(`${dryRun ? '[dry-run] ' : ''}rebuilt ${log.length}: ${log.join(', ')}`);
}

main().catch((err) => { console.error(err.stack ?? err); process.exit(1); });

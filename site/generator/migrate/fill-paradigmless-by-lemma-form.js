#!/usr/bin/env node
// Editorial backlog: for every paradigmless declinable (adj / noun / pron)
// whose lemma form looks like a regular declension citation form, emit a
// templated paradigm. This clears the L8a tail that accumulated after the
// batch6 reclassifications, plus any older stubs that classifyParadigmless
// in author-adj-paradigms.js couldn't read off their heads.
//
// Conservative: only acts when the lemma form unambiguously implies a stem.
// Skips lemmata whose form ends in something we don't recognize.
//
// Detection (lemma string → conjugation/declension):
//   ADJ ends "-us"  → 2nd-decl -us, -a, -um (stem = lemma minus "us")
//   ADJ ends "-um"  → same; lemma is the neut.sg form (stem = lemma minus "um")
//   ADJ ends "-a"   → same; lemma is the fem.sg form
//   ADJ ends "-is"  → 3rd-decl 2-term -is/-e (stem = lemma minus "is")
//   ADJ ends "-e"   → 3rd-decl 2-term (stem = lemma minus "e")
//   ADJ ends "-or"  → 3rd-decl 1-term (lemma = nom.sg, stem from gen as best guess "or-")
//   NOUN ends "-a"  → 1st-decl fem (stem = lemma minus "a")
//   NOUN ends "-us" → 2nd-decl (gender already set on the lemma)
//   NOUN ends "-um" → 2nd-decl neut
//
// Usage: node migrate/fill-paradigmless-by-lemma-form.js [--dry-run]

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

function adjFromRows(table) {
  const cells = {};
  for (const [r, row] of Object.entries(table)) {
    for (let i = 0; i < ADJ_COLS.length; i += 1) {
      if (row[i] != null) cells[`${r}.${ADJ_COLS[i]}`] = row[i];
    }
  }
  if (table.nom) {
    for (let i = 0; i < ADJ_COLS.length; i += 1) {
      if (table.nom[i] != null) cells[`voc.${ADJ_COLS[i]}`] = table.nom[i];
    }
  }
  return { type: 'adj', rows: [...ADJ_ROWS], cols: [...ADJ_COLS], cells };
}

function secondDeclUsAUm(stem) {
  return adjFromRows({
    nom: [`${stem}us`, `${stem}a`, `${stem}um`, `${stem}i`, `${stem}ae`, `${stem}a`],
    gen: [`${stem}i`, `${stem}ae`, `${stem}i`, `${stem}orum`, `${stem}arum`, `${stem}orum`],
    dat: [`${stem}o`, `${stem}ae`, `${stem}o`, `${stem}is`, `${stem}is`, `${stem}is`],
    acc: [`${stem}um`, `${stem}am`, `${stem}um`, `${stem}os`, `${stem}as`, `${stem}a`],
    abl: [`${stem}o`, `${stem}a`, `${stem}o`, `${stem}is`, `${stem}is`, `${stem}is`],
  });
}

function thirdDeclTwoTerm(stem) {
  return adjFromRows({
    nom: [`${stem}is`, `${stem}is`, `${stem}e`, `${stem}es`, `${stem}es`, `${stem}ia`],
    gen: [`${stem}is`, `${stem}is`, `${stem}is`, `${stem}ium`, `${stem}ium`, `${stem}ium`],
    dat: [`${stem}i`, `${stem}i`, `${stem}i`, `${stem}ibus`, `${stem}ibus`, `${stem}ibus`],
    acc: [`${stem}em`, `${stem}em`, `${stem}e`, `${stem}es`, `${stem}es`, `${stem}ia`],
    abl: [`${stem}i`, `${stem}i`, `${stem}i`, `${stem}ibus`, `${stem}ibus`, `${stem}ibus`],
  });
}

function firstDeclFem(stem) {
  return {
    type: 'noun', rows: [...NOUN_ROWS], cols: ['sg', 'pl'],
    cells: {
      'nom.sg': `${stem}a`, 'voc.sg': `${stem}a`,
      'gen.sg': `${stem}ae`, 'dat.sg': `${stem}ae`,
      'acc.sg': `${stem}am`, 'abl.sg': `${stem}a`,
      'nom.pl': `${stem}ae`, 'voc.pl': `${stem}ae`,
      'gen.pl': `${stem}arum`, 'dat.pl': `${stem}is`,
      'acc.pl': `${stem}as`, 'abl.pl': `${stem}is`,
    },
  };
}

function secondDeclMasc(stem) {
  return {
    type: 'noun', rows: [...NOUN_ROWS], cols: ['sg', 'pl'],
    cells: {
      'nom.sg': `${stem}us`, 'voc.sg': `${stem}e`,
      'gen.sg': `${stem}i`,  'dat.sg': `${stem}o`,
      'acc.sg': `${stem}um`, 'abl.sg': `${stem}o`,
      'nom.pl': `${stem}i`,  'voc.pl': `${stem}i`,
      'gen.pl': `${stem}orum`, 'dat.pl': `${stem}is`,
      'acc.pl': `${stem}os`, 'abl.pl': `${stem}is`,
    },
  };
}

function secondDeclNeut(stem) {
  return {
    type: 'noun', rows: [...NOUN_ROWS], cols: ['sg', 'pl'],
    cells: {
      'nom.sg': `${stem}um`, 'voc.sg': `${stem}um`,
      'gen.sg': `${stem}i`,  'dat.sg': `${stem}o`,
      'acc.sg': `${stem}um`, 'abl.sg': `${stem}o`,
      'nom.pl': `${stem}a`,  'voc.pl': `${stem}a`,
      'gen.pl': `${stem}orum`, 'dat.pl': `${stem}is`,
      'acc.pl': `${stem}a`, 'abl.pl': `${stem}is`,
    },
  };
}

function classifyAdj(lemma) {
  const s = lemma.lemma;
  if (s.endsWith('us')) return secondDeclUsAUm(s.slice(0, -2));
  if (s.endsWith('um')) return secondDeclUsAUm(s.slice(0, -2));
  if (s.endsWith('is')) return thirdDeclTwoTerm(s.slice(0, -2));
  if (s.endsWith('a'))  return secondDeclUsAUm(s.slice(0, -1));
  if (s.endsWith('e') && !s.endsWith('ae')) return thirdDeclTwoTerm(s.slice(0, -1));
  return null;
}

function classifyNoun(lemma) {
  const s = lemma.lemma;
  if (s.endsWith('a') && (lemma.gender === 'fem' || !lemma.gender)) return firstDeclFem(s.slice(0, -1));
  if (s.endsWith('us')) return secondDeclMasc(s.slice(0, -2));
  if (s.endsWith('um')) return secondDeclNeut(s.slice(0, -2));
  return null;
}

async function main() {
  const { values } = parseArgs({ options: { 'dry-run': { type: 'boolean' } } });
  const dryRun = values['dry-run'] ?? false;
  const lex = JSON.parse(await readFile(LEXICON_PATH, 'utf8'));
  let adjFilled = 0;
  let nounFilled = 0;
  const skipped = [];
  for (const l of lex.lemmata) {
    if (l.paradigm || l.ppp_paradigm) continue;
    let p = null;
    if (l.pos === 'adj') p = classifyAdj(l);
    else if (l.pos === 'noun') p = classifyNoun(l);
    else continue;
    if (!p) { skipped.push(l.id); continue; }
    l.paradigm = p;
    if (l.pos === 'adj') adjFilled += 1; else nounFilled += 1;
  }
  if (!dryRun) await writeFile(LEXICON_PATH, JSON.stringify(lex, null, 2) + '\n', 'utf8');
  console.log(`${dryRun ? '[dry-run] ' : ''}filled ${adjFilled} adj + ${nounFilled} noun paradigms`);
  if (skipped.length) console.log(`skipped ${skipped.length} (couldn't classify): ${skipped.slice(0, 8).join(', ')}${skipped.length > 8 ? '…' : ''}`);
}

main().catch((err) => { console.error(err.stack ?? err); process.exit(1); });

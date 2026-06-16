#!/usr/bin/env node
// Editorial backlog: fill missing cells across the active system for verbs.
//
// The earlier seeding pipeline left many verbs with incomplete active
// paradigms — e.g. only 1sg.pres.ind.act, no 2sg/3sg/1pl/2pl/3pl, or no
// imperfect / future / subjunctive. The fix-bogus-principal-parts migration
// also wipes derived cells, so anything that depended on bad principal parts
// needs re-derivation.
//
// For every verb that can be classified by conjugation, fill in any missing
// cells across:
//   - pres.ind.act          (6 persons)
//   - imperf.ind.act        (6 persons)
//   - fut.ind.act           (6 persons)
//   - pres.subj.act         (6 persons)
//   - imperf.subj.act       (6 persons)
//   - pres.imp.act          (2sg, 2pl)
//
// Existing cells are preserved (additive). Run AFTER fix-bogus-principal-parts
// (which wipes corrupt derived cells) so this pass re-derives them.
//
// Usage: node migrate/expand-verb-active-system.js [--dry-run]

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

const PERSONS = ['1sg', '2sg', '3sg', '1pl', '2pl', '3pl'];

function denorm(s) {
  return String(s).normalize('NFD').replace(/[̀-ͯ]/g, '');
}

function classifyConj(lemma1sg, infPres) {
  if (!infPres) return null;
  const inf = denorm(infPres).trim();
  const onesg = denorm(lemma1sg || '').trim();
  if (inf.endsWith('are')) return { conj: 1, stem: inf.slice(0, -3) };
  if (inf.endsWith('ire')) return { conj: 4, stem: inf.slice(0, -3) };
  if (inf.endsWith('ere')) {
    if (onesg.endsWith('eo')) return { conj: 2, stem: onesg.slice(0, -2) };
    if (onesg.endsWith('io')) return { conj: '3i', stem: onesg.slice(0, -2) };
    return { conj: 3, stem: inf.slice(0, -3) };
  }
  return null;
}

function presIndAct(cls) {
  const s = cls.stem;
  switch (cls.conj) {
    case 1: return [s+'o', s+'as', s+'at', s+'amus', s+'atis', s+'ant'];
    case 2: return [s+'eo', s+'es', s+'et', s+'emus', s+'etis', s+'ent'];
    case 3: return [s+'o', s+'is', s+'it', s+'imus', s+'itis', s+'unt'];
    case '3i': return [s+'io', s+'is', s+'it', s+'imus', s+'itis', s+'iunt'];
    case 4: return [s+'io', s+'is', s+'it', s+'imus', s+'itis', s+'iunt'];
  }
  return null;
}

function imperfIndAct(cls) {
  const s = cls.stem;
  const t = { 1: 'a', 2: 'e', 3: 'e', '3i': 'ie', 4: 'ie' }[cls.conj];
  if (!t) return null;
  const p = s + t + 'ba';
  return [p+'m', p+'s', p+'t', p+'mus', p+'tis', p.slice(0,-1)+'ant'];
}

function futIndAct(cls) {
  const s = cls.stem;
  switch (cls.conj) {
    case 1: return [s+'abo', s+'abis', s+'abit', s+'abimus', s+'abitis', s+'abunt'];
    case 2: return [s+'ebo', s+'ebis', s+'ebit', s+'ebimus', s+'ebitis', s+'ebunt'];
    case 3: return [s+'am', s+'es', s+'et', s+'emus', s+'etis', s+'ent'];
    case '3i': return [s+'iam', s+'ies', s+'iet', s+'iemus', s+'ietis', s+'ient'];
    case 4: return [s+'iam', s+'ies', s+'iet', s+'iemus', s+'ietis', s+'ient'];
  }
  return null;
}

function presSubjAct(cls) {
  const s = cls.stem;
  switch (cls.conj) {
    case 1: return [s+'em', s+'es', s+'et', s+'emus', s+'etis', s+'ent'];
    case 2: return [s+'eam', s+'eas', s+'eat', s+'eamus', s+'eatis', s+'eant'];
    case 3: return [s+'am', s+'as', s+'at', s+'amus', s+'atis', s+'ant'];
    case '3i': return [s+'iam', s+'ias', s+'iat', s+'iamus', s+'iatis', s+'iant'];
    case 4: return [s+'iam', s+'ias', s+'iat', s+'iamus', s+'iatis', s+'iant'];
  }
  return null;
}

function imperfSubjAct(cls, infActive) {
  const inf = denorm(infActive);
  if (!inf) return null;
  return [inf+'m', inf+'s', inf+'t', inf+'mus', inf+'tis', inf+'nt'];
}

function presImpAct(cls) {
  const s = cls.stem;
  switch (cls.conj) {
    case 1: return { '2sg': s+'a',  '2pl': s+'ate' };
    case 2: return { '2sg': s+'e',  '2pl': s+'ete' };
    case 3: return { '2sg': s+'e',  '2pl': s+'ite' };
    case '3i': return { '2sg': s+'e','2pl': s+'ite' };
    case 4: return { '2sg': s+'i',  '2pl': s+'ite' };
  }
  return null;
}

function addCellsByPerson(paradigm, tenseKey, forms) {
  if (!forms) return 0;
  const cols = paradigm.cols || (paradigm.cols = []);
  let added = 0;
  let touched = false;
  for (let i = 0; i < PERSONS.length; i += 1) {
    const v = forms[i];
    if (v == null) continue;
    const key = `${PERSONS[i]}.${tenseKey}`;
    if (key in paradigm.cells) continue;
    paradigm.cells[key] = v;
    added += 1;
    touched = true;
  }
  if (touched && !cols.includes(tenseKey)) cols.push(tenseKey);
  return added;
}

function addImperative(paradigm, forms) {
  if (!forms) return 0;
  const cols = paradigm.cols || (paradigm.cols = []);
  let added = 0;
  let touched = false;
  for (const [p, v] of Object.entries(forms)) {
    const key = `${p}.pres.imp.act`;
    if (key in paradigm.cells) continue;
    paradigm.cells[key] = v;
    added += 1;
    touched = true;
  }
  if (touched && !cols.includes('pres.imp.act')) cols.push('pres.imp.act');
  return added;
}

async function main() {
  const { values } = parseArgs({ options: { 'dry-run': { type: 'boolean' } } });
  const dryRun = values['dry-run'] ?? false;

  const lex = JSON.parse(await readFile(LEXICON_PATH, 'utf8'));
  const stats = { presInd: 0, imperfInd: 0, futInd: 0, presSubj: 0, imperfSubj: 0, imp: 0 };
  let skipped = 0;

  for (const lemma of lex.lemmata) {
    if (lemma.pos !== 'verb' || !lemma.paradigm) continue;
    if (HAND_AUTHORED.has(lemma.id)) continue;
    const cells = lemma.paradigm.cells;
    const cls = classifyConj(cells['1sg.pres.ind.act'], cells['inf.pres.act']);
    if (!cls) { skipped += 1; continue; }
    stats.presInd    += addCellsByPerson(lemma.paradigm, 'pres.ind.act',    presIndAct(cls));
    stats.imperfInd  += addCellsByPerson(lemma.paradigm, 'imperf.ind.act',  imperfIndAct(cls));
    stats.futInd     += addCellsByPerson(lemma.paradigm, 'fut.ind.act',     futIndAct(cls));
    stats.presSubj   += addCellsByPerson(lemma.paradigm, 'pres.subj.act',   presSubjAct(cls));
    stats.imperfSubj += addCellsByPerson(lemma.paradigm, 'imperf.subj.act', imperfSubjAct(cls, cells['inf.pres.act']));
    stats.imp        += addImperative(lemma.paradigm, presImpAct(cls));
  }

  if (!dryRun) await writeFile(LEXICON_PATH, JSON.stringify(lex, null, 2) + '\n', 'utf8');
  console.log(`${dryRun ? '[dry-run] ' : ''}`, stats);
  if (skipped) console.log(`skipped ${skipped}`);
}

main().catch((err) => {
  console.error(err.stack ?? err);
  process.exit(1);
});

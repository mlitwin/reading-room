#!/usr/bin/env node
// Editorial backlog: fill out the missing passive forms across all verbs.
//
// Current state (from `make validate`): ~625 verbs have 2sg/3sg.pres.ind.pass
// seeded, but only ~325 have the other persons/numbers of pres.ind.pass, and
// even fewer have imperf/fut.ind.pass. Present passive subjunctive, imperfect
// passive subjunctive, and passive imperative are universally empty. Many of
// the C3 "verb:2sg" violations come from markdown spans tagging a surface
// form with multiple alternative passive parses (e.g. dicere = 2sg.pres.imp.pass
// = 2sg.pres.ind.pass [alt] = 2sg.fut.ind.pass = inf.pres.act) when only one
// of those parses backs a glossary cell.
//
// For each verb whose conjugation can be classified (same helper as
// expand-verb-participles.js), generate the full passive system for the six
// passive tenses + the two imperative forms. Existing cells are preserved;
// only missing entries are added.
//
// Hand-authored irregulars and deponent stubs are skipped.
//
// Usage: node migrate/expand-verb-passive-system.js [--dry-run]

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

// Each builder returns a map {parseCode: form} for one tense+mood+voice.
//
// References: Bennett, New Latin Grammar §§100–125 (regular conjugations);
// Wheelock, Latin (7th ed.) chapters 18, 20, 22, 27.

function presIndPass(cls) {
  const s = cls.stem;
  switch (cls.conj) {
    case 1: return { '1sg': s+'or',     '2sg': [s+'aris',   s+'are'],   '3sg': s+'atur',   '1pl': s+'amur',   '2pl': s+'amini',   '3pl': s+'antur' };
    case 2: return { '1sg': s+'eor',    '2sg': [s+'eris',   s+'ere'],   '3sg': s+'etur',   '1pl': s+'emur',   '2pl': s+'emini',   '3pl': s+'entur' };
    case 3: return { '1sg': s+'or',     '2sg': [s+'eris',   s+'ere'],   '3sg': s+'itur',   '1pl': s+'imur',   '2pl': s+'imini',   '3pl': s+'untur' };
    case '3i': return { '1sg': s+'ior', '2sg': [s+'eris',   s+'ere'],   '3sg': s+'itur',   '1pl': s+'imur',   '2pl': s+'imini',   '3pl': s+'iuntur' };
    case 4: return { '1sg': s+'ior',    '2sg': [s+'iris',   s+'ire'],   '3sg': s+'itur',   '1pl': s+'imur',   '2pl': s+'imini',   '3pl': s+'iuntur' };
  }
  return null;
}

function imperfIndPass(cls) {
  const s = cls.stem;
  // theme vowel for imperfect: 1=a, 2=e, 3=e, 3i=ie, 4=ie
  const t = { 1: 'a', 2: 'e', 3: 'e', '3i': 'ie', 4: 'ie' }[cls.conj];
  if (!t) return null;
  const pre = s + t + 'ba';
  return {
    '1sg': pre + 'r',         '2sg': [pre + 'ris', pre + 're'],
    '3sg': pre + 'tur',       '1pl': pre + 'mur',
    '2pl': pre + 'mini',      '3pl': pre.slice(0, -1) + 'antur', // -bantur
  };
}

function futIndPass(cls) {
  const s = cls.stem;
  switch (cls.conj) {
    case 1: return { '1sg': s+'abor',   '2sg': [s+'aberis', s+'abere'], '3sg': s+'abitur', '1pl': s+'abimur', '2pl': s+'abimini', '3pl': s+'abuntur' };
    case 2: return { '1sg': s+'ebor',   '2sg': [s+'eberis', s+'ebere'], '3sg': s+'ebitur', '1pl': s+'ebimur', '2pl': s+'ebimini', '3pl': s+'ebuntur' };
    case 3: return { '1sg': s+'ar',     '2sg': [s+'eris',   s+'ere'],   '3sg': s+'etur',   '1pl': s+'emur',   '2pl': s+'emini',   '3pl': s+'entur' };
    case '3i': return { '1sg': s+'iar', '2sg': [s+'ieris',  s+'iere'],  '3sg': s+'ietur',  '1pl': s+'iemur',  '2pl': s+'iemini',  '3pl': s+'ientur' };
    case 4: return { '1sg': s+'iar',    '2sg': [s+'ieris',  s+'iere'],  '3sg': s+'ietur',  '1pl': s+'iemur',  '2pl': s+'iemini',  '3pl': s+'ientur' };
  }
  return null;
}

function presSubjPass(cls) {
  const s = cls.stem;
  switch (cls.conj) {
    case 1: return { '1sg': s+'er',     '2sg': [s+'eris',   s+'ere'],   '3sg': s+'etur',   '1pl': s+'emur',   '2pl': s+'emini',   '3pl': s+'entur' };
    case 2: return { '1sg': s+'ear',    '2sg': [s+'earis',  s+'eare'],  '3sg': s+'eatur',  '1pl': s+'eamur',  '2pl': s+'eamini',  '3pl': s+'eantur' };
    case 3: return { '1sg': s+'ar',     '2sg': [s+'aris',   s+'are'],   '3sg': s+'atur',   '1pl': s+'amur',   '2pl': s+'amini',   '3pl': s+'antur' };
    case '3i': return { '1sg': s+'iar', '2sg': [s+'iaris',  s+'iare'],  '3sg': s+'iatur',  '1pl': s+'iamur',  '2pl': s+'iamini',  '3pl': s+'iantur' };
    case 4: return { '1sg': s+'iar',    '2sg': [s+'iaris',  s+'iare'],  '3sg': s+'iatur',  '1pl': s+'iamur',  '2pl': s+'iamini',  '3pl': s+'iantur' };
  }
  return null;
}

// Imperfect passive subjunctive is built off the present active infinitive:
// inf + r, ris/re, tur, mur, mini, ntur.
function imperfSubjPass(cls, infActive) {
  const inf = denorm(infActive);
  if (!inf) return null;
  return {
    '1sg': inf + 'r',          '2sg': [inf + 'ris', inf + 're'],
    '3sg': inf + 'tur',        '1pl': inf + 'mur',
    '2pl': inf + 'mini',       '3pl': inf + 'ntur',
  };
}

// Present passive imperative: 2sg = active infinitive, 2pl = 2pl pres ind pass.
function presImpPass(cls, infActive) {
  const inf = denorm(infActive);
  const presPass = presIndPass(cls);
  if (!inf || !presPass) return null;
  return {
    '2sg': inf,
    '2pl': presPass['2pl'],
  };
}

function addCells(paradigm, tenseKey, byPerson) {
  if (!byPerson) return 0;
  const cols = paradigm.cols || (paradigm.cols = []);
  let added = 0;
  let touched = false;
  for (const p of PERSONS) {
    const v = byPerson[p];
    if (v == null) continue;
    const key = `${p}.${tenseKey}`;
    if (key in paradigm.cells) continue;
    paradigm.cells[key] = v;
    added += 1;
    touched = true;
  }
  if (touched && !cols.includes(tenseKey)) cols.push(tenseKey);
  return added;
}

function addImperative(paradigm, byPerson) {
  if (!byPerson) return 0;
  const cols = paradigm.cols || (paradigm.cols = []);
  let added = 0;
  let touched = false;
  for (const [p, v] of Object.entries(byPerson)) {
    const key = `${p}.pres.imp.pass`;
    if (key in paradigm.cells) continue;
    paradigm.cells[key] = v;
    added += 1;
    touched = true;
  }
  if (touched && !cols.includes('pres.imp.pass')) cols.push('pres.imp.pass');
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

    stats.presInd    += addCells(lemma.paradigm, 'pres.ind.pass',    presIndPass(cls));
    stats.imperfInd  += addCells(lemma.paradigm, 'imperf.ind.pass',  imperfIndPass(cls));
    stats.futInd     += addCells(lemma.paradigm, 'fut.ind.pass',     futIndPass(cls));
    stats.presSubj   += addCells(lemma.paradigm, 'pres.subj.pass',   presSubjPass(cls));
    stats.imperfSubj += addCells(lemma.paradigm, 'imperf.subj.pass', imperfSubjPass(cls, cells['inf.pres.act']));
    stats.imp        += addImperative(lemma.paradigm, presImpPass(cls, cells['inf.pres.act']));
  }

  if (!dryRun) await writeFile(LEXICON_PATH, JSON.stringify(lex, null, 2) + '\n', 'utf8');
  console.log(`${dryRun ? '[dry-run] ' : ''}`, stats);
  if (skipped) console.log(`skipped ${skipped} verbs (couldn't classify conjugation)`);
}

main().catch((err) => {
  console.error(err.stack ?? err);
  process.exit(1);
});

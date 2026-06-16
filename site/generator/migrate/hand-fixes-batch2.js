#!/usr/bin/env node
// Editorial backlog: second batch of hand-curated fixes for high-frequency
// alt-form / suppletive / Greek-flexion gaps.
//
// Strategy: where a base lemma's paradigm doesn't cover an attested form
// (because the form belongs to a related lemma — e.g. plus is the
// comparative of multus; magis is the adverb of magnus; phoebe is the Greek
// vocative of Phoebus), drop the form into the base lemma's `alt_forms` so
// the surface enters the glossary. A future editorial pass can split these
// into their own lemmata; for now this keeps the runtime lookup honest.
//
// Also fills:
//   - tueor_v's ppp_paradigm (tutus, -a, -um)
//   - atque_conj.alt_forms: "ac"
//   - ex_prep.alt_forms:    "e"
//   - sive_conj.alt_forms:  "seu"
//
// Usage: node migrate/hand-fixes-batch2.js [--dry-run]

import { readFile, writeFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, '..', '..', '..');
const LEXICON_PATH = join(REPO_ROOT, 'content', '_language', 'latin', 'lexicon.json');

const ADJ_COLS = ['sg.masc', 'sg.fem', 'sg.neut', 'pl.masc', 'pl.fem', 'pl.neut'];

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
  // alt forms for shortened/alternate conjunctions and prepositions
  { id: 'atque_conj', addAltForms: ['ac'] },
  { id: 'ex_prep',    addAltForms: ['e'] },
  { id: 'sive_conj',  addAltForms: ['seu'] },

  // tueor — deponent: ppp "tutus, -a, -um" (the safe form).
  { id: 'tueor_v', setPppParadigm: pppParadigm('tut') },

  // Suppletive comparison: park the suppletive forms as alt_forms on the base
  // lemma so they surface in the glossary while the lexicon model gets a
  // proper comparative/superlative facet.
  { id: 'multus_pron', addAltForms: ['plus', 'plura', 'plurimum', 'plurimus', 'plurima', 'plurimi', 'plurimas', 'plurimos', 'plurimis', 'maxima', 'maxime', 'maximus'] },
  { id: 'magnus_adj',  addAltForms: ['magis', 'maius', 'maior', 'maiores', 'maximus', 'maxima', 'maximum', 'maxime'] },
  { id: 'bonus_adj',   addAltForms: ['melior', 'melius', 'melioris', 'meliora', 'meliores', 'optimus', 'optima', 'optimum', 'optime'] },
  { id: 'malus_adj',   addAltForms: ['peior', 'peius', 'peioris', 'pessimus', 'pessima', 'pessimum'] },
  { id: 'parvus_adj',  addAltForms: ['minor', 'minus', 'minoris', 'minimus', 'minima', 'minimum'] },
  { id: 'certus_adj',  addAltForms: ['certe', 'certius', 'certior', 'certioris', 'certissimus'] },

  // Greek-flection vocatives & derivative adjectives — drop attested Ovidian
  // forms onto the base proper-noun lemma.
  { id: 'Phoebus_n',  addAltForms: ['Phoebe', 'Phoebes', 'Phoeben'] },
  // Saturnia / Saturnius — derived adjective from Saturnus.
  { id: 'saturnus_n', addAltForms: ['Saturnius', 'Saturnia', 'Saturnium', 'Saturniam'] },
  // Peneis / Peneides — Greek patronymic of Peneus (Daphne).
  { id: 'peneus_n',   addAltForms: ['Peneia', 'Peneide', 'Peneidas', 'Peneides'] },

  // bonus_n was the actual id observed in C1; some texts use it as a
  // substantival noun. Cover both ids.
  { id: 'bonus_n', addAltForms: ['melior', 'melioris', 'meliora'] },
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
      l.alt_forms = [...existing].sort();
    }
    if (fix.setPppParadigm) {
      l.ppp_paradigm = fix.setPppParadigm;
    }
    applied.push(fix.id);
  }
  if (!dryRun) await writeFile(LEXICON_PATH, JSON.stringify(lex, null, 2) + '\n', 'utf8');
  console.log(`${dryRun ? '[dry-run] ' : ''}applied ${applied.length}; missing: ${missing.join(', ') || 'none'}`);
}

main().catch((err) => {
  console.error(err.stack ?? err);
  process.exit(1);
});

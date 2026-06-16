#!/usr/bin/env node
// Editorial backlog: repair nouns whose paradigms were seeded from the wrong
// declension template entirely (so the lemma string doesn't appear in any
// cell — L9 — and the head field carries the wrong gender / genitive form).
//
// Each entry below ships:
//   - a corrected `head` field in the standard "lemma, gen-form, m/f/n."
//     convention,
//   - the canonical gender,
//   - a hand-authored paradigm built from the real stem.
//
// The reference is Allen & Greenough (1903) for declension tables, with
// Lewis & Short used to confirm gender on the handful of ambiguous-gender
// nouns (`dies`, `aer`).
//
// Five lemmata in the L9 list aren't really nouns at all (`cani_n`, `ceu_n`,
// `demens_n`, `super_n`, `vero_n`): `ceu` and `vero` are adverbs, `super` is
// a preposition, `demens` is an adjective, `cani` is unknown (likely a
// seeding artifact). They're reclassified to their proper POS here so L8a /
// L9 stop flagging them as broken nouns; the paradigm field is dropped.
//
// Usage: node migrate/repair-corrupt-nouns.js [--dry-run]

import { readFile, writeFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, '..', '..', '..');
const LEXICON_PATH = join(REPO_ROOT, 'content', '_language', 'latin', 'lexicon.json');

const ROWS = ['nom', 'voc', 'gen', 'dat', 'acc', 'abl'];
const COLS = ['sg', 'pl'];

function paradigm(cells) {
  return { type: 'noun', rows: [...ROWS], cols: [...COLS], cells };
}

// 3rd-decl consonant stem template. Stem may differ from lemma (e.g. pater →
// patr-, mors → mort-). voc.* defaults to nom.*.
function thirdDeclCons(lemma, stem) {
  return paradigm({
    'nom.sg': lemma,
    'voc.sg': lemma,
    'gen.sg': `${stem}is`,
    'dat.sg': `${stem}i`,
    'acc.sg': `${stem}em`,
    'abl.sg': `${stem}e`,
    'nom.pl': `${stem}es`,
    'voc.pl': `${stem}es`,
    'gen.pl': `${stem}um`,
    'dat.pl': `${stem}ibus`,
    'acc.pl': `${stem}es`,
    'abl.pl': `${stem}ibus`,
  });
}

// 3rd-decl i-stem (parisyllabic / consonant-cluster nouns: mors-mortis, plebs-plebis).
function thirdDeclIStem(lemma, stem) {
  return paradigm({
    'nom.sg': lemma,
    'voc.sg': lemma,
    'gen.sg': `${stem}is`,
    'dat.sg': `${stem}i`,
    'acc.sg': `${stem}em`,
    'abl.sg': `${stem}e`,
    'nom.pl': `${stem}es`,
    'voc.pl': `${stem}es`,
    'gen.pl': `${stem}ium`,
    'dat.pl': `${stem}ibus`,
    'acc.pl': `${stem}es`,
    'abl.pl': `${stem}ibus`,
  });
}

// 3rd-decl neuter consonant stem (mel-mellis, ver-veris, lac-lactis).
function thirdDeclConsNeut(lemma, stem) {
  return paradigm({
    'nom.sg': lemma,
    'voc.sg': lemma,
    'gen.sg': `${stem}is`,
    'dat.sg': `${stem}i`,
    'acc.sg': lemma,
    'abl.sg': `${stem}e`,
    'nom.pl': `${stem}a`,
    'voc.pl': `${stem}a`,
    'gen.pl': `${stem}um`,
    'dat.pl': `${stem}ibus`,
    'acc.pl': `${stem}a`,
    'abl.pl': `${stem}ibus`,
  });
}

// 2nd-decl masc -er retaining e (puer, pueri).
function secondDeclErKeepE(lemma) {
  const stem = lemma; // puer → puer (e retained)
  return paradigm({
    'nom.sg': lemma,
    'voc.sg': lemma,
    'gen.sg': `${stem}i`,
    'dat.sg': `${stem}o`,
    'acc.sg': `${stem}um`,
    'abl.sg': `${stem}o`,
    'nom.pl': `${stem}i`,
    'voc.pl': `${stem}i`,
    'gen.pl': `${stem}orum`,
    'dat.pl': `${stem}is`,
    'acc.pl': `${stem}os`,
    'abl.pl': `${stem}is`,
  });
}

// 2nd-decl masc -er dropping e (uter → utr-, ager → agr-).
function secondDeclErDropE(lemma, stem) {
  return paradigm({
    'nom.sg': lemma,
    'voc.sg': lemma,
    'gen.sg': `${stem}i`,
    'dat.sg': `${stem}o`,
    'acc.sg': `${stem}um`,
    'abl.sg': `${stem}o`,
    'nom.pl': `${stem}i`,
    'voc.pl': `${stem}i`,
    'gen.pl': `${stem}orum`,
    'dat.pl': `${stem}is`,
    'acc.pl': `${stem}os`,
    'abl.pl': `${stem}is`,
  });
}

// 2nd-decl masc with -ir → -iri (vir, viri).
function secondDeclIr(lemma) {
  return paradigm({
    'nom.sg': lemma,
    'voc.sg': lemma,
    'gen.sg': `${lemma}i`,
    'dat.sg': `${lemma}o`,
    'acc.sg': `${lemma}um`,
    'abl.sg': `${lemma}o`,
    'nom.pl': `${lemma}i`,
    'voc.pl': `${lemma}i`,
    'gen.pl': `${lemma}orum`,
    'dat.pl': `${lemma}is`,
    'acc.pl': `${lemma}os`,
    'abl.pl': `${lemma}is`,
  });
}

// 5th-decl (dies, diei).
function fifthDecl(lemma, stem) {
  return paradigm({
    'nom.sg': lemma,
    'voc.sg': lemma,
    'gen.sg': `${stem}ei`,
    'dat.sg': `${stem}ei`,
    'acc.sg': `${stem}em`,
    'abl.sg': `${stem}e`,
    'nom.pl': `${stem}es`,
    'voc.pl': `${stem}es`,
    'gen.pl': `${stem}erum`,
    'dat.pl': `${stem}ebus`,
    'acc.pl': `${stem}es`,
    'abl.pl': `${stem}ebus`,
  });
}

// Greek 1st-decl fem (daphne, daphnes).
function greekFirstFem(lemma, stem) {
  return paradigm({
    'nom.sg': lemma,
    'voc.sg': lemma,
    'gen.sg': `${stem}es`,
    'dat.sg': `${stem}ae`,
    'acc.sg': `${stem}en`,
    'abl.sg': `${stem}e`,
    'nom.pl': `${stem}ae`,
    'voc.pl': `${stem}ae`,
    'gen.pl': `${stem}arum`,
    'dat.pl': `${stem}is`,
    'acc.pl': `${stem}as`,
    'abl.pl': `${stem}is`,
  });
}

const REPAIRS = [
  // Genuine corrupted nouns — repair paradigm + head + gender.
  { id: 'aer_n',    gender: 'masc', head: 'aer, aeris, m.',       paradigm: thirdDeclCons('aer', 'aer') },
  { id: 'daphne_n', gender: 'fem',  head: 'daphne, daphnes, f.',  paradigm: greekFirstFem('daphne', 'daphn') },
  { id: 'dies_n',   gender: 'masc', head: 'dies, diei, m.',       paradigm: fifthDecl('dies', 'di') },
  { id: 'fors_n',   gender: 'fem',  head: 'fors, fortis, f.',     paradigm: thirdDeclCons('fors', 'fort') },
  { id: 'lac_n',    gender: 'neut', head: 'lac, lactis, n.',      paradigm: thirdDeclConsNeut('lac', 'lact') },
  { id: 'mel_n',    gender: 'neut', head: 'mel, mellis, n.',      paradigm: thirdDeclConsNeut('mel', 'mell') },
  { id: 'mens_n',   gender: 'fem',  head: 'mens, mentis, f.',     paradigm: thirdDeclIStem('mens', 'ment') },
  { id: 'mensor_n', gender: 'masc', head: 'mensor, mensoris, m.', paradigm: thirdDeclCons('mensor', 'mensor') },
  { id: 'mors_n',   gender: 'fem',  head: 'mors, mortis, f.',     paradigm: thirdDeclIStem('mors', 'mort') },
  { id: 'pater_n',  gender: 'masc', head: 'pater, patris, m.',    paradigm: thirdDeclCons('pater', 'patr') },
  { id: 'plebs_n',  gender: 'fem',  head: 'plebs, plebis, f.',    paradigm: thirdDeclIStem('plebs', 'pleb') },
  { id: 'puer_n',   gender: 'masc', head: 'puer, pueri, m.',      paradigm: secondDeclErKeepE('puer') },
  { id: 'sol_n',    gender: 'masc', head: 'sol, solis, m.',       paradigm: thirdDeclCons('sol', 'sol') },
  { id: 'uter_n',   gender: 'masc', head: 'uter, utris, m.',      paradigm: secondDeclErDropE('uter', 'utr') },
  { id: 'ver_n',    gender: 'neut', head: 'ver, veris, n.',       paradigm: thirdDeclConsNeut('ver', 'ver') },
  { id: 'vesper_n', gender: 'masc', head: 'vesper, vesperis, m.', paradigm: thirdDeclCons('vesper', 'vesper') },
  { id: 'vir_n',    gender: 'masc', head: 'vir, viri, m.',        paradigm: secondDeclIr('vir') },

  // Misclassified — drop paradigm, change POS to the correct one.
  // cani_n omitted: markdown still tags forms of "canis" against it; needs
  // an editorial pass to migrate those spans to a proper `canis_n` lemma
  // before we touch the entry.
  { id: 'ceu_n',    reclassifyAs: 'adv',  newId: 'ceu_adv',   newHead: 'ceu (adv.)' },
  { id: 'demens_n', reclassifyAs: 'adj',  newId: 'demens_adj', newHead: 'demens, dementis (adj.)' },
  { id: 'super_n',  reclassifyAs: 'prep', newId: 'super_prep', newHead: 'super (prep./adv.)' },
  { id: 'vero_n',   reclassifyAs: 'adv',  newId: 'vero_adv',  newHead: 'vero (adv.)' },
];

async function main() {
  const { values } = parseArgs({ options: { 'dry-run': { type: 'boolean' } } });
  const dryRun = values['dry-run'] ?? false;

  const lex = JSON.parse(await readFile(LEXICON_PATH, 'utf8'));
  const byId = new Map(lex.lemmata.map((l) => [l.id, l]));

  const log = { repaired: [], reclassified: [], deleted: [], missing: [] };
  const toDelete = new Set();
  for (const r of REPAIRS) {
    const l = byId.get(r.id);
    if (!l) { log.missing.push(r.id); continue; }
    if ('reclassifyAs' in r) {
      if (r.reclassifyAs === null) {
        toDelete.add(r.id);
        log.deleted.push(r.id);
        continue;
      }
      // Note: keeping the original lemma id so markdown references stay valid.
      // The id no longer matches the pattern {lemma}_{pos_abbrev} for the new
      // pos, but L2 is a regex on id format and accepts any pos-abbrev letters,
      // so e.g. `super_n` becoming pos=prep still validates structurally; the
      // ID-suffix → POS coherence rule isn't a hard invariant. (Renaming would
      // mean updating every markdown span.)
      l.pos = r.reclassifyAs;
      if (r.newHead) l.head = r.newHead;
      delete l.paradigm;
      delete l.ppp_paradigm;
      delete l.gender;
      log.reclassified.push(`${r.id} → ${r.reclassifyAs}`);
      continue;
    }
    l.gender = r.gender;
    l.head = r.head;
    l.paradigm = r.paradigm;
    log.repaired.push(r.id);
  }
  if (toDelete.size) {
    lex.lemmata = lex.lemmata.filter((l) => !toDelete.has(l.id));
  }

  if (!dryRun) {
    await writeFile(LEXICON_PATH, JSON.stringify(lex, null, 2) + '\n', 'utf8');
  }
  console.log(`${dryRun ? '[dry-run] ' : ''}repaired paradigms: ${log.repaired.length}`);
  for (const id of log.repaired) console.log(`  ${id}`);
  console.log(`reclassified: ${log.reclassified.length}`);
  for (const s of log.reclassified) console.log(`  ${s}`);
  console.log(`deleted: ${log.deleted.length}`);
  for (const id of log.deleted) console.log(`  ${id}`);
  if (log.missing.length) {
    console.log(`missing from lexicon: ${log.missing.length}`);
    for (const id of log.missing) console.log(`  ${id}`);
  }
}

main().catch((err) => {
  console.error(err.stack ?? err);
  process.exit(1);
});

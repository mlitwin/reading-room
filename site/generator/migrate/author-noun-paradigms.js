#!/usr/bin/env node
// Editorial backlog: author paradigms for the L8a-flagged nouns.
//
// Six of these (amor, cultor, dolor, genu, honor, vapor) inherited verb-style
// `head` and `principal_parts` fields during early seeding (e.g.
// "honor, honorare, honoravi, honoratum"). Their paradigms were stripped by
// strip-bogus-paradigms.js, leaving honest stubs that still carry the bogus
// head. This pass:
//
//   1. Rewrites those head fields to standard noun convention (lemma, gen, m./f./n.)
//      and drops the spurious principal_parts.
//   2. Adds standard paradigms for all 14 paradigmless declinable nouns from
//      declension templates (2nd, 3rd, 4th, Greek 1st, plural-only, indeclinable).
//
// Templates carry voc cells (== nom for non-2nd-decl-masc -us nouns; -e for
// 2nd-decl masc -us nouns). Cells are noun-style (no gender in the key); the
// glossary build stamps gender from lemma.gender.
//
// Usage: node migrate/author-noun-paradigms.js [--dry-run]

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

// 3rd-decl consonant stem (amor, amoris, m.). Stem == lemma; oblique forms
// take the standard -is/-i/-em/-e endings.
function thirdDeclConsonant(lemma, stem = lemma) {
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

// 2nd-decl -us. Voc.sg is -e (the famous "Brute"); rest standard. Works for
// both masc (animus-type) and fem (alvus, humus — same endings, fem gender).
function secondDeclUs(lemma) {
  const stem = lemma.replace(/us$/, '');
  return paradigm({
    'nom.sg': lemma,
    'voc.sg': `${stem}e`,
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

// 4th-decl neuter (cornu, cornus, n.).
function fourthDeclNeuter(stem) {
  return paradigm({
    'nom.sg': `${stem}u`,
    'voc.sg': `${stem}u`,
    'gen.sg': `${stem}us`,
    'dat.sg': `${stem}u`,
    'acc.sg': `${stem}u`,
    'abl.sg': `${stem}u`,
    'nom.pl': `${stem}ua`,
    'voc.pl': `${stem}ua`,
    'gen.pl': `${stem}uum`,
    'dat.pl': `${stem}ibus`,
    'acc.pl': `${stem}ua`,
    'abl.pl': `${stem}ibus`,
  });
}

// Greek 1st-decl fem (nymphe, nymphes, f.). Singular Hellenizes; plural reverts
// to the regular 1st-decl pattern (nymphae, nympharum, …).
function greekFirstDeclFem(stem) {
  return paradigm({
    'nom.sg': `${stem}e`,
    'voc.sg': `${stem}e`,
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

const NOUN_FIXES = [
  // 3rd-decl masc consonant stems with previously-bogus heads. Each head is
  // rewritten to "<lemma>, <gen-form>, m." and verb-style principal_parts dropped.
  { id: 'amor_n',   newHead: 'amor, amoris, m.',     paradigm: thirdDeclConsonant('amor'),     dropPrincipalParts: true },
  { id: 'cultor_n', newHead: 'cultor, cultoris, m.', paradigm: thirdDeclConsonant('cultor'),   dropPrincipalParts: true },
  { id: 'dolor_n',  newHead: 'dolor, doloris, m.',   paradigm: thirdDeclConsonant('dolor'),    dropPrincipalParts: true },
  { id: 'honor_n',  newHead: 'honor, honoris, m.',   paradigm: thirdDeclConsonant('honor'),    dropPrincipalParts: true },
  { id: 'vapor_n',  newHead: 'vapor, vaporis, m.',   paradigm: thirdDeclConsonant('vapor'),    dropPrincipalParts: true },

  // 4th-decl neuters. genu's head also had verb-style noise — rewrite.
  { id: 'genu_n',   newHead: 'genu, genus, n.',     paradigm: fourthDeclNeuter('gen'),  dropPrincipalParts: true },
  { id: 'cornu_n',  paradigm: fourthDeclNeuter('corn') },

  // 2nd-decl -us (mixed gender). Head was fine; just add paradigm.
  { id: 'alvus_n',  paradigm: secondDeclUs('alvus') },
  { id: 'humus_n',  paradigm: secondDeclUs('humus') },
  { id: 'radius_n', paradigm: secondDeclUs('radius') },

  // Greek 1st-decl fem.
  { id: 'nymphe_n', paradigm: greekFirstDeclFem('nymph') },

  // Indeclinable neuter. One form for everything; emit nom.sg only — Gl5 needs
  // at least one cell and downstream lookups all share the same surface anyway.
  { id: 'nefas_n', paradigm: paradigm({ 'nom.sg': 'nefas', 'voc.sg': 'nefas', 'gen.sg': 'nefas', 'dat.sg': 'nefas', 'acc.sg': 'nefas', 'abl.sg': 'nefas' }) },

  // Plural-only (3rd-decl i-stem). Penates, Penatium, …
  { id: 'Penates_n', paradigm: paradigm({
    'nom.pl': 'Penates',
    'voc.pl': 'Penates',
    'gen.pl': 'Penatium',
    'dat.pl': 'Penatibus',
    'acc.pl': 'Penates',
    'abl.pl': 'Penatibus',
  }) },

  // pythion_n: lemma field is "pythion" but head field is "Python, -onis, m."
  // — likely transliteration mix-up during seeding. Skip paradigm authoring;
  // this entry needs editorial review (rename to Python_n and re-seed) before
  // a paradigm makes sense.
];

async function main() {
  const { values } = parseArgs({ options: { 'dry-run': { type: 'boolean' } } });
  const dryRun = values['dry-run'] ?? false;

  const lex = JSON.parse(await readFile(LEXICON_PATH, 'utf8'));
  const byId = new Map(lex.lemmata.map((l) => [l.id, l]));

  const applied = [];
  const skipped = [];
  for (const fix of NOUN_FIXES) {
    const lemma = byId.get(fix.id);
    if (!lemma) { skipped.push(`${fix.id} (not in lexicon)`); continue; }
    if (lemma.paradigm) { skipped.push(`${fix.id} (already has a paradigm)`); continue; }
    lemma.paradigm = fix.paradigm;
    if (fix.newHead) lemma.head = fix.newHead;
    if (fix.dropPrincipalParts && lemma.principal_parts) delete lemma.principal_parts;
    applied.push(fix.id);
  }

  if (!dryRun) {
    await writeFile(LEXICON_PATH, JSON.stringify(lex, null, 2) + '\n', 'utf8');
  }
  console.log(`${dryRun ? '[dry-run] ' : ''}added paradigms to ${applied.length} nouns:`);
  for (const id of applied) console.log(`  ${id}`);
  if (skipped.length) {
    console.log(`skipped ${skipped.length}:`);
    for (const s of skipped) console.log(`  ${s}`);
  }
}

main().catch((err) => {
  console.error(err.stack ?? err);
  process.exit(1);
});

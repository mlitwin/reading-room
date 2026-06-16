#!/usr/bin/env node
// Editorial backlog: fill out adjective paradigms (L8 + L8a + L9).
//
// Three classes addressed mechanically:
//
//   A. Existing 3rd-decl 2-termination adjectives (mollis, -e) seeded with only
//      neuter cells. ~39 entries. Detected by lemma ending in -is and a sparse
//      paradigm; full paradigm built from stem.
//
//   B. Existing 3rd-decl 1-termination consonant-stem adjectives (fallax,
//      capax, ferox, …) seeded with only acc.sg.neut + nom.pl.neut.
//      ~24 entries. Stem extracted from the existing nom.pl.neut cell (drop
//      the trailing "ia"); full paradigm built.
//
//   C. Paradigmless aliases where the lemma is a non-citation form (imum,
//      molle, orba, sata, sublime, viride, nescium). ~7 entries. Type and
//      stem read from the standardized `head` field (e.g. "mollis, -e" →
//      3rd-decl 2-term; "imus, -a, -um" → 2nd-decl -us, -a, -um). The full
//      paradigm includes the lemma's own form so L9 clears.
//
// Skipped (irregular stems, need hand-authoring):
//   - discors, dispar, expers, deses, anceps, vetus … (varied consonant stems)
//   - tot_adj, totidem_adj (truly indeclinable)
//   - celeber, paluster (-er, -ris adjectives with vowel deletion)
//
// Usage: node migrate/author-adj-paradigms.js [--dry-run]

import { readFile, writeFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, '..', '..', '..');
const LEXICON_PATH = join(REPO_ROOT, 'content', '_language', 'latin', 'lexicon.json');

const ADJ_ROWS = ['nom', 'voc', 'gen', 'dat', 'acc', 'abl'];
const ADJ_COLS = ['sg.masc', 'sg.fem', 'sg.neut', 'pl.masc', 'pl.fem', 'pl.neut'];

function adjParadigm(cells) {
  return { type: 'adj', rows: [...ADJ_ROWS], cols: [...ADJ_COLS], cells };
}

function fromRows(table) {
  // Same compact format as the pronoun script: { nom: [m, f, n, pm, pf, pn], ... }
  const cells = {};
  for (const [caseId, row] of Object.entries(table)) {
    for (let i = 0; i < ADJ_COLS.length; i += 1) {
      if (row[i] != null) cells[`${caseId}.${ADJ_COLS[i]}`] = row[i];
    }
  }
  // voc defaults to nom for adjectives.
  if (table.nom) {
    for (let i = 0; i < ADJ_COLS.length; i += 1) {
      if (table.nom[i] != null) cells[`voc.${ADJ_COLS[i]}`] = table.nom[i];
    }
  }
  return adjParadigm(cells);
}

// 2nd-decl -us, -a, -um (bonus type).
function secondDeclUsAUm(stem) {
  return fromRows({
    nom: [`${stem}us`,  `${stem}a`,   `${stem}um`,  `${stem}i`,    `${stem}ae`,   `${stem}a`],
    gen: [`${stem}i`,   `${stem}ae`,  `${stem}i`,   `${stem}orum`, `${stem}arum`, `${stem}orum`],
    dat: [`${stem}o`,   `${stem}ae`,  `${stem}o`,   `${stem}is`,   `${stem}is`,   `${stem}is`],
    acc: [`${stem}um`,  `${stem}am`,  `${stem}um`,  `${stem}os`,   `${stem}as`,   `${stem}a`],
    abl: [`${stem}o`,   `${stem}a`,   `${stem}o`,   `${stem}is`,   `${stem}is`,   `${stem}is`],
  });
}

// 3rd-decl 2-termination -is/-e (mollis, molle).
function thirdDeclTwoTerm(stem) {
  return fromRows({
    nom: [`${stem}is`, `${stem}is`, `${stem}e`,  `${stem}es`,  `${stem}es`,  `${stem}ia`],
    gen: [`${stem}is`, `${stem}is`, `${stem}is`, `${stem}ium`, `${stem}ium`, `${stem}ium`],
    dat: [`${stem}i`,  `${stem}i`,  `${stem}i`,  `${stem}ibus`,`${stem}ibus`,`${stem}ibus`],
    acc: [`${stem}em`, `${stem}em`, `${stem}e`,  `${stem}es`,  `${stem}es`,  `${stem}ia`],
    abl: [`${stem}i`,  `${stem}i`,  `${stem}i`,  `${stem}ibus`,`${stem}ibus`,`${stem}ibus`],
  });
}

// 3rd-decl 1-termination consonant stem (fallax, fallacis). lemma is the
// nom.sg form (same for all three genders); stem from the oblique.
function thirdDeclOneTermConsonant(lemma, stem) {
  return fromRows({
    nom: [lemma,        lemma,        lemma,        `${stem}es`,  `${stem}es`,  `${stem}ia`],
    gen: [`${stem}is`,  `${stem}is`,  `${stem}is`,  `${stem}ium`, `${stem}ium`, `${stem}ium`],
    dat: [`${stem}i`,   `${stem}i`,   `${stem}i`,   `${stem}ibus`,`${stem}ibus`,`${stem}ibus`],
    acc: [`${stem}em`,  `${stem}em`,  lemma,        `${stem}es`,  `${stem}es`,  `${stem}ia`],
    abl: [`${stem}i`,   `${stem}i`,   `${stem}i`,   `${stem}ibus`,`${stem}ibus`,`${stem}ibus`],
  });
}

// Detect what we're looking at and derive the stem.
function classifyExistingSparse(lemma) {
  // 3rd-decl 2-term: lemma ends in -is, cells have neut "-e" forms.
  if (lemma.lemma.endsWith('is')) {
    return { kind: '3rd-2term', stem: lemma.lemma.slice(0, -2) };
  }
  // 3rd-decl 1-term consonant stem: try to read stem from nom.pl.neut cell
  // ("-ia" suffix).
  const np = lemma.paradigm?.cells?.['nom.pl.neut'];
  if (typeof np === 'string' && np.endsWith('ia')) {
    return { kind: '3rd-1term', stem: np.slice(0, -2) };
  }
  return null;
}

function classifyParadigmless(lemma) {
  // Read the head field — it carries the standardized dictionary form.
  // Common patterns:
  //   "X, -a, -um"     → 2nd-decl -us (stem = X minus "us")
  //   "X, -e"          → 3rd-decl 2-term (stem = X minus "is")
  //   "X, Yis"         → 3rd-decl 1-term (stem from Y)
  //   "X (indeclinable)" → indeclinable, skip
  const head = (lemma.head || '').trim();
  if (/\bindeclinable\b/i.test(head)) return { kind: 'indeclinable' };

  const m1 = /^([A-Za-z]+),\s*-a,\s*-um\b/.exec(head);
  if (m1) {
    const cite = m1[1];
    if (cite.endsWith('us')) return { kind: '2nd-us', stem: cite.slice(0, -2) };
  }

  const m2 = /^([A-Za-z]+),\s*-e\b/.exec(head);
  if (m2 && m2[1].endsWith('is')) return { kind: '3rd-2term', stem: m2[1].slice(0, -2) };

  return null;
}

async function main() {
  const { values } = parseArgs({ options: { 'dry-run': { type: 'boolean' } } });
  const dryRun = values['dry-run'] ?? false;

  const lex = JSON.parse(await readFile(LEXICON_PATH, 'utf8'));
  let applied2ndUs = 0, applied3rd2 = 0, applied3rd1 = 0;
  const skipped = [];
  const replacedSparse = [];

  for (const lemma of lex.lemmata) {
    if (lemma.pos !== 'adj') continue;
    const cellCount = lemma.paradigm ? Object.keys(lemma.paradigm.cells).length : 0;

    let cls = null;
    if (!lemma.paradigm) {
      cls = classifyParadigmless(lemma);
    } else if (cellCount < 12) {
      cls = classifyExistingSparse(lemma);
    } else {
      continue; // dense paradigm — leave alone
    }

    if (!cls) {
      skipped.push(lemma.id);
      continue;
    }

    let newP;
    if (cls.kind === '2nd-us') { newP = secondDeclUsAUm(cls.stem); applied2ndUs += 1; }
    else if (cls.kind === '3rd-2term') { newP = thirdDeclTwoTerm(cls.stem); applied3rd2 += 1; }
    else if (cls.kind === '3rd-1term') { newP = thirdDeclOneTermConsonant(lemma.lemma, cls.stem); applied3rd1 += 1; }
    else { skipped.push(lemma.id); continue; }

    if (lemma.paradigm) replacedSparse.push(lemma.id);
    lemma.paradigm = newP;
  }

  if (!dryRun) {
    await writeFile(LEXICON_PATH, JSON.stringify(lex, null, 2) + '\n', 'utf8');
  }
  console.log(`${dryRun ? '[dry-run] ' : ''}filled paradigms:`);
  console.log(`  2nd-decl -us, -a, -um:  ${applied2ndUs}`);
  console.log(`  3rd-decl 2-term -is/-e: ${applied3rd2}`);
  console.log(`  3rd-decl 1-term -x/-s:  ${applied3rd1}`);
  console.log(`  (replaced ${replacedSparse.length} sparse paradigms in place)`);
  if (skipped.length) {
    console.log(`skipped ${skipped.length} (needs hand-authoring):`);
    for (const id of skipped) console.log(`  ${id}`);
  }
}

main().catch((err) => {
  console.error(err.stack ?? err);
  process.exit(1);
});

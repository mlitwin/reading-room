#!/usr/bin/env node
// Editorial backlog step 1 (C3 reduction). Two passes over the consolidated
// lexicon:
//
//   1. Derive noun gender from each noun's head field (e.g., "animus, -i, m.")
//      and set lemma.gender. "c." (common) becomes ["masc", "fem"]. Heads that
//      don't carry a parseable gender tag fall back to markdown-span consensus
//      from content/ovid-metamorphoses/*.md; nouns with no signal stay
//      ungendered and continue to flag C3.
//
//   2. For every noun, adj, and pron paradigm, copy nom.* cells into voc.*
//      cells where voc.* is missing. Latin vocative typically equals
//      nominative; this single mechanical pass eliminates the bulk of C3
//      vocative violations.
//
// Run from site/generator/. Re-runs are idempotent.
//
// Usage: node migrate/add-gender-and-voc-cells.js [--dry-run]

import { readFile, readdir, writeFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, '..', '..', '..');
const LEXICON_PATH = join(REPO_ROOT, 'content', '_language', 'latin', 'lexicon.json');
const OVID_DIR = join(REPO_ROOT, 'content', 'ovid-metamorphoses');

const HEAD_GENDER_RE = /,\s*(m|f|n|c|mf)\.?\s*(?:pl\.|sg\.|\(.*\)|$)/i;
const PARSE_GENDER_RE = /\.(masc|fem|neut)(?:\.|$)/g;

function parseGenderFromHead(head) {
  // Look inside parentheticals too — many heads carry the gender as
  // "(indeclinable neuter noun)" rather than ", n.".
  const proseMatch = /\b(masculine|feminine|neuter)\b/i.exec(head);
  if (proseMatch) {
    switch (proseMatch[1].toLowerCase()) {
      case 'masculine': return 'masc';
      case 'feminine': return 'fem';
      case 'neuter': return 'neut';
    }
  }
  // Strip parens to avoid matching e.g. "(masc.)" inside an aside.
  const stripped = head.replace(/\([^)]*\)/g, '').trim();
  const m = HEAD_GENDER_RE.exec(stripped);
  if (!m) return null;
  switch (m[1].toLowerCase()) {
    case 'm': return 'masc';
    case 'f': return 'fem';
    case 'n': return 'neut';
    case 'c':
    case 'mf':
      return ['masc', 'fem'];
    default: return null;
  }
}

async function gatherMarkdownGenders() {
  // lemma_id -> { masc: n, fem: n, neut: n }
  const tally = new Map();
  const files = (await readdir(OVID_DIR)).filter((f) => f.endsWith('.md'));
  const spanRe = /<span\b([^>]*?)>/g;
  const attrRe = /data-matches="([^"]*)"/;
  for (const file of files) {
    const text = await readFile(join(OVID_DIR, file), 'utf8');
    let m;
    spanRe.lastIndex = 0;
    while ((m = spanRe.exec(text))) {
      const attr = attrRe.exec(m[1]);
      if (!attr) continue;
      for (const group of attr[1].split(';')) {
        const colon = group.indexOf(':');
        if (colon < 0) continue;
        const lemma_id = group.slice(0, colon).trim();
        const parses = group.slice(colon + 1);
        const seen = new Set();
        let g;
        PARSE_GENDER_RE.lastIndex = 0;
        while ((g = PARSE_GENDER_RE.exec(parses))) seen.add(g[1]);
        if (seen.size === 0) continue;
        if (!tally.has(lemma_id)) tally.set(lemma_id, { masc: 0, fem: 0, neut: 0 });
        const t = tally.get(lemma_id);
        for (const s of seen) t[s] += 1;
      }
    }
  }
  return tally;
}

function consensusGender(counts) {
  if (!counts) return null;
  // Strong consensus: one gender accounts for > 80% of taggings.
  const total = counts.masc + counts.fem + counts.neut;
  if (total === 0) return null;
  const entries = Object.entries(counts).filter(([, n]) => n > 0);
  if (entries.length === 1) return entries[0][0];
  // For common-gender candidates (e.g., parens), accept if two genders are
  // both well-attested (each ≥20% and together >90%).
  entries.sort((a, b) => b[1] - a[1]);
  const top = entries[0][1] / total;
  if (top > 0.85) return entries[0][0];
  const top2 = (entries[0][1] + entries[1][1]) / total;
  if (top2 > 0.9 && entries[1][1] / total > 0.2) {
    return [entries[0][0], entries[1][0]].sort();
  }
  return entries[0][0]; // best-effort
}

function addVocCells(paradigm) {
  if (!paradigm || !paradigm.cells) return 0;
  let added = 0;
  for (const [parse, value] of Object.entries(paradigm.cells)) {
    if (!parse.startsWith('nom.')) continue;
    const vocKey = 'voc.' + parse.slice(4);
    if (paradigm.cells[vocKey] !== undefined) continue;
    paradigm.cells[vocKey] = value;
    added += 1;
  }
  // Ensure 'voc' is in rows for the table renderer.
  if (added > 0 && Array.isArray(paradigm.rows) && !paradigm.rows.includes('voc')) {
    // Insert voc after nom by convention.
    const ix = paradigm.rows.indexOf('nom');
    if (ix >= 0) paradigm.rows.splice(ix + 1, 0, 'voc');
    else paradigm.rows.push('voc');
  }
  return added;
}

async function main() {
  const { values } = parseArgs({ options: { 'dry-run': { type: 'boolean' } } });
  const dryRun = values['dry-run'] ?? false;

  const lex = JSON.parse(await readFile(LEXICON_PATH, 'utf8'));
  const mdGenders = await gatherMarkdownGenders();

  let nounsSet = 0;
  let nounsFromHead = 0;
  let nounsFromMd = 0;
  let nounsUnresolved = [];
  let vocAddedTotal = 0;
  let vocLemmataTouched = 0;

  for (const lemma of lex.lemmata) {
    if (lemma.pos === 'noun' && !lemma.gender) {
      const fromHead = parseGenderFromHead(lemma.head);
      if (fromHead) {
        lemma.gender = fromHead;
        nounsFromHead += 1;
        nounsSet += 1;
      } else {
        const fromMd = consensusGender(mdGenders.get(lemma.id));
        if (fromMd) {
          lemma.gender = fromMd;
          nounsFromMd += 1;
          nounsSet += 1;
        } else {
          nounsUnresolved.push(lemma.id);
        }
      }
    }
    if (['noun', 'adj', 'pron'].includes(lemma.pos)) {
      const beforeP = vocAddedTotal;
      vocAddedTotal += addVocCells(lemma.paradigm);
      vocAddedTotal += addVocCells(lemma.ppp_paradigm);
      if (vocAddedTotal > beforeP) vocLemmataTouched += 1;
    }
  }

  // Reorder keys so gender appears right after pos for readability.
  const reordered = lex.lemmata.map((l) => {
    if (!l.gender) return l;
    const { id, lemma, pos, gender, ...rest } = l;
    return { id, lemma, pos, gender, ...rest };
  });
  lex.lemmata = reordered;

  if (!dryRun) {
    await writeFile(LEXICON_PATH, JSON.stringify(lex, null, 2) + '\n', 'utf8');
  }

  console.log(`${dryRun ? '[dry-run] ' : ''}noun gender: ${nounsSet} set (${nounsFromHead} from head, ${nounsFromMd} from markdown), ${nounsUnresolved.length} unresolved`);
  if (nounsUnresolved.length) {
    console.log('  unresolved noun ids:');
    for (const id of nounsUnresolved) console.log(`    ${id}`);
  }
  console.log(`${dryRun ? '[dry-run] ' : ''}voc cells: added ${vocAddedTotal} cells across ${vocLemmataTouched} lemmata`);
}

main().catch((err) => {
  console.error(err.stack ?? err);
  process.exit(1);
});

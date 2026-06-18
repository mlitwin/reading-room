#!/usr/bin/env node
// JSON-native replacement for clean-pos-hints.js.
//
// Aligns each word token's pos_hint with the actual POS of the first candidate
// lemma. Handles both plain tokens (tok.lemma_id) and stash tokens (__data_matches).
//
// Usage: node migrate/clean-pos-hints-json.js [--dry-run]

import { readFile, writeFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';

import { ManuscriptSchema } from '../schema/manuscript.schema.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, '..', '..', '..');
const LEXICON_PATH = join(REPO_ROOT, 'content', '_language', 'latin', 'lexicon.json');
const MS_PATH = join(REPO_ROOT, 'content', 'ovid-metamorphoses', 'manuscript.latin.json');

function firstLemmaId(tok) {
  if (tok.__data_matches) {
    const ix = tok.__data_matches.indexOf(':');
    return ix >= 0 ? tok.__data_matches.slice(0, ix).trim() : null;
  }
  return tok.lemma_id;
}

async function main() {
  const { values } = parseArgs({ options: { 'dry-run': { type: 'boolean' } } });
  const dryRun = values['dry-run'] ?? false;

  const lex = JSON.parse(await readFile(LEXICON_PATH, 'utf8'));
  const posById = new Map(lex.lemmata.map((l) => [l.id, l.pos]));

  const raw = JSON.parse(await readFile(MS_PATH, 'utf8'));
  let totalFixed = 0;
  const fixesByKind = {};

  for (const line of raw.lines) {
    for (const tok of line.tokens) {
      if (tok.kind !== 'word') continue;
      const lemmaId = firstLemmaId(tok);
      if (!lemmaId) continue;
      const newPos = posById.get(lemmaId);
      if (!newPos) continue;
      if (tok.pos_hint === newPos) continue;
      const key = `${tok.pos_hint ?? '<none>'} → ${newPos}`;
      fixesByKind[key] = (fixesByKind[key] || 0) + 1;
      totalFixed++;
      tok.pos_hint = newPos;
    }
  }

  const stripped = {
    ...raw,
    lines: raw.lines.map((ln) => ({
      ...ln,
      tokens: ln.tokens.map(({ __data_matches, ...rest }) => rest),
    })),
  };
  ManuscriptSchema.parse(stripped);

  if (!dryRun) await writeFile(MS_PATH, JSON.stringify(raw, null, 2) + '\n', 'utf8');
  console.log(`${dryRun ? '[dry-run] ' : ''}fixed ${totalFixed} pos_hint mismatches`);
  for (const [k, n] of Object.entries(fixesByKind).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${k}: ${n}`);
  }
}

main().catch((err) => { console.error(err.stack ?? err); process.exit(1); });

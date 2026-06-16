#!/usr/bin/env node
// Editorial backlog step C7a. The data-pos attribute on each <span> is an
// audit hint left by the stanza annotator. Many spans have hints that
// disagree with any of the candidate lemmata, or carry the literal sentinel
// "unknown". Align each hint with the first candidate's actual POS (taken
// from the lexicon).
//
// Spans with no data-matches, or with no candidate-resolvable POS, are left
// alone.
//
// Usage: node migrate/clean-pos-hints.js [--dry-run]

import { readFile, readdir, writeFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, '..', '..', '..');
const LEXICON_PATH = join(REPO_ROOT, 'content', '_language', 'latin', 'lexicon.json');
const OVID_DIR = join(REPO_ROOT, 'content', 'ovid-metamorphoses');

const SPAN_RE = /<span\b([^>]*?)>([^<]*)<\/span>/g;
const ATTR_RE = /([a-zA-Z][\w-]*)\s*=\s*"([^"]*)"/g;

function parseAttributes(attrBlock) {
  const out = {};
  ATTR_RE.lastIndex = 0;
  let m;
  while ((m = ATTR_RE.exec(attrBlock))) out[m[1]] = m[2];
  return out;
}

function parseMatches(value) {
  const out = [];
  for (const group of value.split(';')) {
    const colon = group.indexOf(':');
    if (colon < 0) continue;
    out.push({ lemma_id: group.slice(0, colon).trim() });
  }
  return out;
}

async function main() {
  const { values } = parseArgs({ options: { 'dry-run': { type: 'boolean' } } });
  const dryRun = values['dry-run'] ?? false;

  const lex = JSON.parse(await readFile(LEXICON_PATH, 'utf8'));
  const posById = new Map(lex.lemmata.map((l) => [l.id, l.pos]));

  const files = (await readdir(OVID_DIR)).filter((f) => f.endsWith('.md'));
  let totalFixed = 0;
  const fixesByKind = {};

  for (const file of files) {
    const path = join(OVID_DIR, file);
    const orig = await readFile(path, 'utf8');
    let changed = false;
    const next = orig.replace(SPAN_RE, (match, attrBlock, inner) => {
      const attrs = parseAttributes(attrBlock);
      if (!attrs['data-matches']) return match;
      const candidates = parseMatches(attrs['data-matches']);
      const candPos = candidates.map((c) => posById.get(c.lemma_id)).filter(Boolean);
      if (candPos.length === 0) return match;
      const hint = attrs['data-pos'];
      if (hint && candPos.includes(hint)) return match; // already consistent
      const newHint = candPos[0];
      const key = `${hint ?? '<none>'} → ${newHint}`;
      fixesByKind[key] = (fixesByKind[key] || 0) + 1;
      totalFixed += 1;
      const newAttrs = attrBlock.replace(/\sdata-pos="[^"]*"/, '');
      // Re-insert data-pos right after data-matches for stable diff.
      const replaced = newAttrs.replace(
        /(data-matches="[^"]*")/,
        `$1 data-pos="${newHint}"`,
      );
      changed = true;
      return `<span${replaced}>${inner}</span>`;
    });
    if (changed && !dryRun) await writeFile(path, next, 'utf8');
  }

  console.log(`${dryRun ? '[dry-run] ' : ''}fixed ${totalFixed} pos_hint mismatches`);
  for (const [k, n] of Object.entries(fixesByKind).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${k}: ${n}`);
  }
}

main().catch((err) => {
  console.error(err.stack ?? err);
  process.exit(1);
});

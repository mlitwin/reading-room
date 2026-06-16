#!/usr/bin/env node
// Editorial backlog: scan the Ovid concordance for missing-surface tokens
// whose lemma is an adjective/noun and whose surface looks like a
// comparative or superlative (the morphological "-ior" / "-ius" / "-ioris" /
// "-issimus" / "-errimus" / "-illimus" patterns). Register each as an
// alt_form on the base lemma so the glossary picks it up.
//
// Conservative: only acts on surfaces that the markdown editor actually tagged
// against a known lemma and that aren't already in the glossary. Idempotent.
//
// Usage: node migrate/auto-add-comparatives.js [--dry-run]

import { readFile, writeFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, '..', '..', '..');
const LEXICON_PATH = join(REPO_ROOT, 'content', '_language', 'latin', 'lexicon.json');
const CONCORDANCE_PATH = join(REPO_ROOT, 'docs', 'assets', 'concordance', 'ovid-metamorphoses.json');
const GLOSSARY_PATH = join(REPO_ROOT, 'docs', 'assets', 'latin-glossary.json');

const COMP_RE = /(?:ior|ius|ioris|iore|iorem|iores|ioribus|iorum|issim[uoa][sm]?|errim[uoa][sm]?|llim[uoa][sm]?|issim[ae]|errim[ae]|llim[ae])$/;

async function main() {
  const { values } = parseArgs({ options: { 'dry-run': { type: 'boolean' } } });
  const dryRun = values['dry-run'] ?? false;
  const lex = JSON.parse(await readFile(LEXICON_PATH, 'utf8'));
  const c = JSON.parse(await readFile(CONCORDANCE_PATH, 'utf8'));
  const g = JSON.parse(await readFile(GLOSSARY_PATH, 'utf8'));
  const lexById = new Map(lex.lemmata.map((l) => [l.id, l]));

  const additions = new Map(); // lemma_id → Set<surface>
  for (const tok of Object.values(c.tokens)) {
    if (g.entries[tok.surface]) continue;
    if (!COMP_RE.test(tok.surface)) continue;
    for (const cand of tok.candidates) {
      const lemma = lexById.get(cand.lemma_id);
      if (!lemma) continue;
      // Accept adj / noun (substantivized comparatives, e.g. liberioris on
      // liber_n) and verb (present-active-participle comparatives such as
      // ardentior on ardeo_v, metuentior on metuo_v).
      if (lemma.pos !== 'adj' && lemma.pos !== 'noun' && lemma.pos !== 'verb') continue;
      if (!additions.has(cand.lemma_id)) additions.set(cand.lemma_id, new Set());
      additions.get(cand.lemma_id).add(tok.surface);
    }
  }

  let totalForms = 0;
  for (const [id, surfaces] of additions) {
    const lemma = lexById.get(id);
    const existing = new Set(lemma.alt_forms ?? []);
    for (const s of surfaces) existing.add(s);
    lemma.alt_forms = [...existing].sort();
    totalForms += surfaces.size;
  }

  if (!dryRun) await writeFile(LEXICON_PATH, JSON.stringify(lex, null, 2) + '\n', 'utf8');
  console.log(`${dryRun ? '[dry-run] ' : ''}added ${totalForms} comparative/superlative alt_forms across ${additions.size} lemmata`);
  for (const [id, surfaces] of [...additions].slice(0, 12)) {
    console.log(`  ${id}: ${[...surfaces].join(', ')}`);
  }
}

main().catch((err) => { console.error(err.stack ?? err); process.exit(1); });

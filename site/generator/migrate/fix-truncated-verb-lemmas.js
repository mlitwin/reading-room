#!/usr/bin/env node
// Editorial backlog: fix verb lemmata that were truncated to a non-form during
// seeding. Examples: `ador_v` whose lemma string is "ador" but whose paradigm
// cells, head, and principal_parts all point at "adoro"/"adorare". Same for
// `decor_v`, `deterior_v`, `fabricator_v` — each carries a noun-shaped
// surface as the lemma even though the verb itself is regular -are.
//
// Diagnose: lemma.pos === 'verb', paradigm exists, and lemma string isn't
// in any cell, but the 1sg.pres.ind.act cell IS present (so we can use it).
// Fix: copy 1sg.pres.ind.act into the lemma string.
//
// Usage: node migrate/fix-truncated-verb-lemmas.js [--dry-run]

import { readFile, writeFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, '..', '..', '..');
const LEXICON_PATH = join(REPO_ROOT, 'content', '_language', 'latin', 'lexicon.json');

function normalize(s) {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/j/g, 'i').replace(/v/g, 'u');
}

async function main() {
  const { values } = parseArgs({ options: { 'dry-run': { type: 'boolean' } } });
  const dryRun = values['dry-run'] ?? false;

  const lex = JSON.parse(await readFile(LEXICON_PATH, 'utf8'));
  const log = [];
  for (const lemma of lex.lemmata) {
    if (lemma.pos !== 'verb' || !lemma.paradigm) continue;
    const cells = lemma.paradigm.cells || {};
    const onesg = typeof cells['1sg.pres.ind.act'] === 'string' ? cells['1sg.pres.ind.act'] : null;
    if (!onesg) continue;
    if (normalize(onesg) === normalize(lemma.lemma)) continue;

    // Don't touch entries whose lemma is already in some cell — those are fine.
    const allForms = new Set();
    for (const v of Object.values(cells)) {
      for (const f of (Array.isArray(v) ? v : [v])) allForms.add(normalize(f));
    }
    if (allForms.has(normalize(lemma.lemma))) continue;

    log.push({ id: lemma.id, old: lemma.lemma, neu: onesg });
    lemma.lemma = onesg;
  }

  if (!dryRun) {
    await writeFile(LEXICON_PATH, JSON.stringify(lex, null, 2) + '\n', 'utf8');
  }
  console.log(`${dryRun ? '[dry-run] ' : ''}fixed ${log.length} verb lemmata:`);
  for (const l of log) console.log(`  ${l.id}: "${l.old}" → "${l.neu}"`);
}

main().catch((err) => {
  console.error(err.stack ?? err);
  process.exit(1);
});

#!/usr/bin/env node
// One-off cleanup: nouns and pronouns occasionally inherited a sibling verb's
// paradigm during early seeding (e.g., amor_n carries amo's verb paradigm).
// Detect the mismatch via L6's allowed-type mapping and remove the bogus
// paradigm fields. The resulting entry becomes an honest stub (will fail L8a)
// rather than a structurally broken entry (failing L6).
//
// Runs against the per-lemma files under content/_latin-lexicon/, NOT the
// consolidated lexicon.json. Re-run consolidate-lexicon.js afterward.
//
// Usage: node migrate/strip-bogus-paradigms.js [--dry-run]

import { readFile, readdir, writeFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, '..', '..', '..');
const SOURCE_DIR = join(REPO_ROOT, 'content', '_latin-lexicon');

// Mirrors lexicon.invariants.js ALLOWED_PARADIGM_TYPES.
const ALLOWED_PARADIGM_TYPES = {
  noun: new Set(['noun']),
  verb: new Set(['verb', 'ppp']),
  adj: new Set(['adj']),
  pron: new Set(['pron', 'adj']),
};

async function main() {
  const { values } = parseArgs({ options: { 'dry-run': { type: 'boolean' } } });
  const dryRun = values['dry-run'] ?? false;

  const files = (await readdir(SOURCE_DIR)).filter((f) => f.endsWith('.json'));
  const fixed = [];
  for (const file of files) {
    const path = join(SOURCE_DIR, file);
    const data = JSON.parse(await readFile(path, 'utf8'));
    if (!data.paradigm) continue;
    const allowed = ALLOWED_PARADIGM_TYPES[data.pos];
    if (allowed && allowed.has(data.paradigm.type)) continue;
    // Bogus paradigm — strip it (and any ppp_paradigm if also incongruent).
    const note = `had paradigm.type "${data.paradigm.type}" inconsistent with pos "${data.pos}"`;
    delete data.paradigm;
    if (data.ppp_paradigm) delete data.ppp_paradigm;
    fixed.push({ file, id: data.id, note });
    if (!dryRun) {
      await writeFile(path, JSON.stringify(data, null, 2) + '\n', 'utf8');
    }
  }

  console.log(`${dryRun ? '[dry-run] would fix' : 'fixed'} ${fixed.length} files:`);
  for (const f of fixed) console.log(`  ${f.id} (${f.file}) — ${f.note}`);
}

main().catch((err) => {
  console.error(err.stack ?? err);
  process.exit(1);
});

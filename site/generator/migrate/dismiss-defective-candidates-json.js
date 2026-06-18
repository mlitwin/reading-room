#!/usr/bin/env node
// Correct word tokens whose lemma assignment is a morphologically spurious
// defective-verb candidate. Resolves C2 (concordance candidate not in glossary)
// for the handful of surfaces where a defective verb's "matching" cell does not
// actually exist in its paradigm.
//
// Cases handled:
//   surface "in" (or "In"), lemma_id "inquam_v" → "in_prep" (the editorial
//     analysis "inque" = imperative of inquam is wrong; inquam is defective and
//     has no imperative; the surface is just `in` + the enclitic `-que`).
//   surface "aderis", spurious candidate "ador_v" in __data_matches → drop the
//     ador_v candidate (adoro's 2sg.pres.subj.pass is "adoreris", not "aderis";
//     the real lemma is adsum_v 2sg.fut.ind.act).
//
// Out of scope (handled elsewhere): surface "molles" × lemma_id "molleo_adv"
// is a lexicon-gap (mollis_adj doesn't exist); requires adding a new lemma
// entry, not a token-level rewrite.
//
// The build pipeline reads content/{slug}/*.md (gitignored build artifacts)
// as the concordance source. This script edits the JSON and then regenerates
// the .md so a subsequent `node build.js` picks the change up.
//
// Usage: node migrate/dismiss-defective-candidates-json.js [--dry-run]

import { readFile, writeFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';

import { ManuscriptSchema } from '../schema/manuscript.schema.js';
import { buildManuscriptMd } from '../build-manuscript-md.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, '..', '..', '..');
const TEXT_SLUG = 'ovid-metamorphoses';
const CONTENT_DIR = join(REPO_ROOT, 'content', TEXT_SLUG);
const MS_PATH = join(CONTENT_DIR, 'manuscript.latin.json');

// (surface, spurious-lemma) → token rewrite. Disjoint by design — at most one
// rule matches a given token, so order is irrelevant.
const RULES = [
  {
    id: 'inquam→in_prep',
    match: (tok) => (tok.surface === 'in' || tok.surface === 'In')
                 && tok.lemma_id === 'inquam_v',
    apply: (tok) => {
      tok.lemma_id = 'in_prep';
      tok.parses = ['prep'];
      tok.stanza = 'in_prep';
      tok.pos_hint = 'prep';
      if ('__data_matches' in tok) delete tok.__data_matches;
    },
  },
  {
    id: 'aderis-drop-ador_v',
    match: (tok) => tok.surface === 'aderis'
                 && typeof tok.__data_matches === 'string'
                 && tok.__data_matches.includes('ador_v:'),
    apply: (tok) => {
      tok.lemma_id = 'adsum_v';
      tok.parses = ['2sg.fut.ind.act'];
      tok.stanza = 'adsum_v';
      tok.pos_hint = 'verb';
      delete tok.__data_matches;
    },
  },
];

async function main() {
  const { values } = parseArgs({ options: { 'dry-run': { type: 'boolean' } } });
  const dryRun = values['dry-run'] ?? false;

  const raw = JSON.parse(await readFile(MS_PATH, 'utf8'));
  const counts = Object.fromEntries(RULES.map((r) => [r.id, 0]));

  for (const line of raw.lines) {
    for (const tok of line.tokens) {
      if (tok.kind !== 'word') continue;
      for (const rule of RULES) {
        if (!rule.match(tok)) continue;
        rule.apply(tok);
        counts[rule.id] += 1;
        break; // one rule per token; rules are disjoint by design
      }
    }
  }

  // Schema-validate the cleaned manuscript (strip the editor-only
  // __data_matches stash before validating, same as build-manuscript-md does).
  const stripped = {
    ...raw,
    lines: raw.lines.map((ln) => ({
      ...ln,
      tokens: ln.tokens.map(({ __data_matches, ...rest }) => rest),
    })),
  };
  ManuscriptSchema.parse(stripped);

  if (!dryRun) await writeFile(MS_PATH, JSON.stringify(raw, null, 2) + '\n', 'utf8');
  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  console.log(`${dryRun ? '[dry-run] ' : ''}corrected ${total} defective-candidate tokens`);
  for (const [id, n] of Object.entries(counts)) {
    console.log(`  ${id}: ${n}`);
  }

  if (!dryRun && total > 0) {
    // Regenerate the gitignored chapter markdown so build-concordance picks
    // up the change. The build pipeline reads .md, not the manuscript JSON.
    await buildManuscriptMd(TEXT_SLUG, CONTENT_DIR);
    console.log(`regenerated chapter markdown in ${CONTENT_DIR}`);
  }
}

main().catch((err) => { console.error(err.stack ?? err); process.exit(1); });

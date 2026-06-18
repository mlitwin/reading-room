#!/usr/bin/env node
// Stage 3 of the C11 (homograph disambiguation) pipeline. Reads the LLM
// resolutions JSONL produced by resolve-c11-llm.js and writes
// selected_lemma_id back to the appropriate word tokens in
// manuscript.latin.json. Regenerates the gitignored chapter markdown so the
// next `node build.js` picks the changes up.
//
// Rules:
//   - Resolutions are looked up by token_ref (b{book}-{chapter}-{NNN}), which
//     this script recomputes from the manuscript JSON exactly as Stage 1 did.
//   - A resolution is skipped if the token already carries a selected_lemma_id
//     (an earlier editorial decision wins).
//   - A resolution is skipped (with a warning) if the proposed lemma_id is not
//     in the token's candidate list — C4 would flag the invariant otherwise.
//   - Resolutions whose selected_lemma_id is null (LLM abstained) are ignored.
//
// Usage: node migrate/apply-c11-resolutions-json.js [--text=<slug>]
//                                                   [--in=<path>] [--dry-run]

import { readFile, writeFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';

import { ManuscriptSchema } from '../schema/manuscript.schema.js';
import { buildManuscriptMd } from '../build-manuscript-md.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, '..', '..', '..');
const GENERATOR_ROOT = join(__dirname, '..');

const DEFAULT_TEXT = 'ovid-metamorphoses';
const DEFAULT_IN = join(GENERATOR_ROOT, '.build', 'c11-resolutions.jsonl');

function parseDataMatches(value) {
  const out = [];
  for (const group of value.split(';')) {
    const colon = group.indexOf(':');
    if (colon < 0) continue;
    const lemma_id = group.slice(0, colon).trim();
    const parses = group.slice(colon + 1).split(',').map((s) => s.trim()).filter(Boolean);
    if (!lemma_id || parses.length === 0) continue;
    out.push({ lemma_id, parses });
  }
  return out;
}

// Dedupe-by-token_ref, latest wins (so iterative re-resolve runs can append
// to the JSONL without manual cleanup).
function loadResolutions(text) {
  const byRef = new Map();
  for (const raw of text.split('\n')) {
    const line = raw.trim();
    if (!line) continue;
    let rec;
    try { rec = JSON.parse(line); }
    catch (e) { console.warn(`skip malformed JSONL line: ${e.message}`); continue; }
    if (!rec.token_ref) continue;
    byRef.set(rec.token_ref, rec);
  }
  return byRef;
}

async function main() {
  const { values } = parseArgs({
    options: {
      text: { type: 'string' },
      in:   { type: 'string' },
      'dry-run': { type: 'boolean' },
    },
  });
  const textSlug = values.text ?? DEFAULT_TEXT;
  const inPath = values.in ?? DEFAULT_IN;
  const dryRun = values['dry-run'] ?? false;
  const contentDir = join(REPO_ROOT, 'content', textSlug);
  const msPath = join(contentDir, 'manuscript.latin.json');

  const resolutions = loadResolutions(await readFile(inPath, 'utf8'));
  const ms = JSON.parse(await readFile(msPath, 'utf8'));

  let applied = 0;
  let skippedExistingSelection = 0;
  let skippedAbstain = 0;
  let skippedOffList = 0;
  let skippedNoMatch = 0;

  let currentSection = null;
  let spanIndex = 0;
  for (const line of ms.lines) {
    if (line.section !== currentSection) {
      currentSection = line.section;
      spanIndex = 0;
    }
    for (const tok of line.tokens) {
      if (tok.kind !== 'word') continue;
      spanIndex += 1;

      const candidates = tok.__data_matches
        ? parseDataMatches(tok.__data_matches)
        : [{ lemma_id: tok.lemma_id, parses: tok.parses }];
      if (candidates.length <= 1) continue;

      const [book, chapter] = line.section.split('.');
      const tokenRef = `b${book}-${chapter}-${String(spanIndex).padStart(3, '0')}`;
      const rec = resolutions.get(tokenRef);
      if (!rec) continue;

      if (rec.selected_lemma_id === null || rec.selected_lemma_id === undefined) {
        skippedAbstain += 1;
        continue;
      }

      // Don't overwrite a prior editorial decision (data-stanza promoted to
      // selected_lemma_id, or an earlier pass).
      if (tok.selected_lemma_id) {
        skippedExistingSelection += 1;
        continue;
      }

      const candidateIds = new Set(candidates.map((c) => c.lemma_id));
      if (!candidateIds.has(rec.selected_lemma_id)) {
        console.warn(`${tokenRef}: proposed lemma "${rec.selected_lemma_id}" not in candidates [${[...candidateIds].join(',')}] — skipping`);
        skippedOffList += 1;
        continue;
      }

      tok.selected_lemma_id = rec.selected_lemma_id;
      applied += 1;
    }
  }

  // Schema-validate (strip the __data_matches stash, same as build pipeline).
  const stripped = {
    ...ms,
    lines: ms.lines.map((ln) => ({
      ...ln,
      tokens: ln.tokens.map(({ __data_matches, ...rest }) => rest),
    })),
  };
  ManuscriptSchema.parse(stripped);

  if (!dryRun) {
    await writeFile(msPath, JSON.stringify(ms, null, 2) + '\n', 'utf8');
    if (applied > 0) {
      await buildManuscriptMd(textSlug, contentDir);
    }
  }

  console.log(`${dryRun ? '[dry-run] ' : ''}applied ${applied} resolutions to ${textSlug}`);
  console.log(`  skipped (already selected): ${skippedExistingSelection}`);
  console.log(`  skipped (LLM abstained):    ${skippedAbstain}`);
  console.log(`  skipped (off-list lemma):   ${skippedOffList}`);
  console.log(`  resolutions with no matching token: ${resolutions.size - applied - skippedAbstain - skippedExistingSelection - skippedOffList}`);
}

main().catch((err) => { console.error(err.stack ?? err); process.exit(1); });

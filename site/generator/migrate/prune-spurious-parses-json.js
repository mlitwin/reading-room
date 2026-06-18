#!/usr/bin/env node
// JSON-native replacement for prune-spurious-parses.js.
//
// Reads manuscript.latin.json directly, prunes parse codes from each word
// token's candidate list when the candidate lemma's paradigm doesn't yield
// the token's surface at that parse key.
//
// Handles both plain word tokens (single candidate in tok.lemma_id / tok.parses)
// and multi-candidate tokens (stash in tok.__data_matches).
//
// Idempotent — already-clean tokens pass through unchanged.
// Usage: node migrate/prune-spurious-parses-json.js [--dry-run]

import { readFile, writeFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';

import { normalizeSurface } from '../lib/normalize.js';
import { cellForms, noParadigmParse, genderStampParses } from '../lib/paradigm.js';
import { ManuscriptSchema } from '../schema/manuscript.schema.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, '..', '..', '..');
const LEXICON_PATH = join(REPO_ROOT, 'content', '_language', 'latin', 'lexicon.json');
const MS_PATH = join(REPO_ROOT, 'content', 'ovid-metamorphoses', 'manuscript.latin.json');

function buildLemmaParseMap(lex) {
  const map = new Map();
  for (const lemma of lex.lemmata) {
    const parses = new Map();
    let hadParadigm = false;
    for (const which of ['paradigm', 'ppp_paradigm']) {
      const p = lemma[which];
      if (!p) continue;
      hadParadigm = true;
      for (const [parse, value] of Object.entries(p.cells)) {
        for (const form of cellForms(value)) {
          const norm = normalizeSurface(form);
          for (const stamped of genderStampParses(parse, lemma)) {
            if (!parses.has(stamped)) parses.set(stamped, new Set());
            parses.get(stamped).add(norm);
          }
        }
      }
    }
    if (!hadParadigm) {
      const norm = normalizeSurface(lemma.lemma);
      for (const p of noParadigmParse(lemma)) {
        if (!parses.has(p)) parses.set(p, new Set());
        parses.get(p).add(norm);
      }
    }
    map.set(lemma.id, parses);
  }
  return map;
}

function parseStash(stash) {
  const out = [];
  for (const group of stash.split(';')) {
    const ix = group.indexOf(':');
    if (ix < 0) continue;
    out.push({
      lemma_id: group.slice(0, ix).trim(),
      parses: group.slice(ix + 1).split(',').map((s) => s.trim()).filter(Boolean),
    });
  }
  return out;
}

function serializeStash(candidates) {
  return candidates.map((c) => `${c.lemma_id}:${c.parses.join(',')}`).join(';');
}

function pruneCandidates(surface, candidates, lemmaParseMap) {
  let didPrune = false;
  const keptCandidates = [];
  for (const cand of candidates) {
    const parseMap = lemmaParseMap.get(cand.lemma_id);
    if (!parseMap || parseMap.size === 0) {
      keptCandidates.push(cand);
      continue;
    }
    const kept = [];
    for (const p of cand.parses) {
      const forms = parseMap.get(p);
      if (forms && forms.has(surface)) { kept.push(p); continue; }
      let matched = false;
      for (const pre of ['ppl.', 'ppp.', 'gerundive.', 'ger.', 'fap.', 'fpp.']) {
        const f = parseMap.get(pre + p);
        if (f && f.has(surface)) { matched = true; break; }
      }
      if (matched) { kept.push(p); continue; }
      didPrune = true;
    }
    if (kept.length === 0) {
      const otherViable = candidates.some(
        (other) => other !== cand && (() => {
          const m = lemmaParseMap.get(other.lemma_id);
          if (!m || m.size === 0) return true;
          return other.parses.some((p) => m.get(p)?.has(surface));
        })(),
      );
      if (otherViable) { didPrune = true; continue; }
      keptCandidates.push(cand);
      continue;
    }
    if (kept.length !== cand.parses.length) keptCandidates.push({ lemma_id: cand.lemma_id, parses: kept });
    else keptCandidates.push(cand);
  }
  return { keptCandidates, didPrune };
}

async function main() {
  const { values } = parseArgs({ options: { 'dry-run': { type: 'boolean' } } });
  const dryRun = values['dry-run'] ?? false;

  const lex = JSON.parse(await readFile(LEXICON_PATH, 'utf8'));
  const lemmaParseMap = buildLemmaParseMap(lex);

  const raw = JSON.parse(await readFile(MS_PATH, 'utf8'));
  let prunedParses = 0;
  let prunedCandidates = 0;
  let unchanged = 0;
  let untouched = 0;

  for (const line of raw.lines) {
    for (const tok of line.tokens) {
      if (tok.kind !== 'word') continue;
      const surface = normalizeSurface(tok.surface);

      if (tok.__data_matches) {
        const candidates = parseStash(tok.__data_matches);
        if (candidates.length === 0) continue;
        const before = candidates.map((c) => c.parses.length).reduce((a, b) => a + b, 0);
        const { keptCandidates, didPrune } = pruneCandidates(surface, candidates, lemmaParseMap);
        if (!didPrune) { unchanged++; continue; }
        if (keptCandidates.length === 0) { untouched++; continue; }
        const after = keptCandidates.map((c) => c.parses.length).reduce((a, b) => a + b, 0);
        prunedParses += before - after;
        prunedCandidates += candidates.length - keptCandidates.length;
        tok.__data_matches = serializeStash(keptCandidates);
      } else {
        const candidates = [{ lemma_id: tok.lemma_id, parses: tok.parses }];
        const { keptCandidates, didPrune } = pruneCandidates(surface, candidates, lemmaParseMap);
        if (!didPrune) { unchanged++; continue; }
        if (keptCandidates.length === 0) { untouched++; continue; }
        const kept = keptCandidates[0];
        const before = tok.parses.length;
        tok.parses = kept.parses;
        prunedParses += before - kept.parses.length;
      }
    }
  }

  // Validate stripped copy (schema doesn't include __data_matches).
  const stripped = {
    ...raw,
    lines: raw.lines.map((ln) => ({
      ...ln,
      tokens: ln.tokens.map(({ __data_matches, ...rest }) => rest),
    })),
  };
  ManuscriptSchema.parse(stripped);

  if (!dryRun) await writeFile(MS_PATH, JSON.stringify(raw, null, 2) + '\n', 'utf8');
  console.log(`${dryRun ? '[dry-run] ' : ''}pruned ${prunedParses} spurious parses (${prunedCandidates} candidates dropped)`);
  console.log(`spans unchanged: ${unchanged}; spans with no kept cands: ${untouched}`);
}

main().catch((err) => { console.error(err.stack ?? err); process.exit(1); });

#!/usr/bin/env node
// Editorial backlog: every C3 violation that survives the structural fixes
// comes from a markdown span tagging a token with parse codes whose cell
// values don't actually produce the token's surface form. Example:
//
//   <span data-matches="caelum_n:gen.pl.neut,nom.sg.neut,voc.sg.neut,acc.sg.neut">caelum</span>
//
//   `gen.pl.neut` would yield "caelorum", not "caelum"; the analyser
//   over-generated.
//
// For each span, drop parses whose lemma's paradigm doesn't actually carry
// the span's surface at that parse key. If pruning would empty the parse set
// for a candidate, keep the candidate untouched (the surface form is genuinely
// missing from the paradigm — a paradigm-gap signal, not a markdown error).
//
// Pruning also rewrites the data-matches attribute to drop now-emptied
// candidates entirely (but leaves the span if doing so would leave it with
// no candidates at all).
//
// Idempotent — already-clean spans pass through unchanged.
//
// Usage: node migrate/prune-spurious-parses.js [--dry-run]

import { readFile, readdir, writeFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';

import { normalizeSurface } from '../lib/normalize.js';
import { cellForms, noParadigmParse, genderStampParses } from '../lib/paradigm.js';

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

// Build per-lemma { parse-code → Set<normalized-form> } map. Mirrors how
// build-glossary expands cells, including gender stamping on nouns.
function buildLemmaParseMap(lex) {
  const map = new Map();
  for (const lemma of lex.lemmata) {
    const parses = new Map(); // parseCode → Set<normalized form>
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

async function main() {
  const { values } = parseArgs({ options: { 'dry-run': { type: 'boolean' } } });
  const dryRun = values['dry-run'] ?? false;

  const lex = JSON.parse(await readFile(LEXICON_PATH, 'utf8'));
  const lemmaParseMap = buildLemmaParseMap(lex);

  const files = (await readdir(OVID_DIR)).filter((f) => f.endsWith('.md'));
  let prunedParses = 0;
  let prunedCandidates = 0;
  let unchanged = 0;
  let untouched = 0;

  for (const file of files) {
    const path = join(OVID_DIR, file);
    const orig = await readFile(path, 'utf8');
    let changed = false;
    const next = orig.replace(SPAN_RE, (match, attrBlock, inner) => {
      const attrs = parseAttributes(attrBlock);
      if (!attrs['data-matches']) return match;
      const surface = normalizeSurface(inner);
      const candidates = attrs['data-matches'].split(';').map((g) => {
        const ix = g.indexOf(':');
        if (ix < 0) return null;
        return {
          lemma_id: g.slice(0, ix).trim(),
          parses: g.slice(ix + 1).split(',').map((s) => s.trim()).filter(Boolean),
        };
      }).filter(Boolean);

      const keptCandidates = [];
      let didPrune = false;
      for (const cand of candidates) {
        const parseMap = lemmaParseMap.get(cand.lemma_id);
        if (!parseMap || parseMap.size === 0) {
          // Lemma has no glossary forms at all (sparse stubs). Leave alone.
          keptCandidates.push(cand);
          continue;
        }
        const kept = [];
        for (const p of cand.parses) {
          const forms = parseMap.get(p);
          if (forms && forms.has(surface)) kept.push(p);
          else didPrune = true;
        }
        if (kept.length === 0) {
          // All parses pruned — none of them yield this surface in the
          // candidate lemma's paradigm. If other candidates survive the prune,
          // drop this one entirely (a genuine analyser misclassification like
          // "alta" tagged with alo_v alongside altus_adj). If this is the only
          // candidate, keep it as a sentinel so the C1/C2 signal stays visible
          // and the editorial backlog item doesn't quietly disappear.
          const otherCandidatesViable = candidates.some(
            (other) =>
              other !== cand &&
              (() => {
                const m = lemmaParseMap.get(other.lemma_id);
                if (!m || m.size === 0) return true;
                return other.parses.some((p) => m.get(p)?.has(surface));
              })(),
          );
          if (otherCandidatesViable) {
            didPrune = true;
            prunedCandidates += 1;
            continue;
          }
          keptCandidates.push(cand);
          continue;
        }
        if (kept.length !== cand.parses.length) prunedParses += (cand.parses.length - kept.length);
        keptCandidates.push({ lemma_id: cand.lemma_id, parses: kept });
      }
      if (keptCandidates.length === 0) {
        untouched += 1;
        return match;
      }
      if (!didPrune) {
        unchanged += 1;
        return match;
      }

      const newMatches = keptCandidates
        .map((c) => `${c.lemma_id}:${c.parses.join(',')}`)
        .join(';');
      changed = true;
      // Rebuild attrs block preserving order.
      const newAttrBlock = attrBlock.replace(/data-matches="[^"]*"/, `data-matches="${newMatches}"`);
      return `<span${newAttrBlock}>${inner}</span>`;
    });
    if (changed && !dryRun) await writeFile(path, next, 'utf8');
  }

  console.log(`${dryRun ? '[dry-run] ' : ''}pruned ${prunedParses} spurious parses (${prunedCandidates} fully-emptied candidates dropped)`);
  console.log(`spans left unchanged: ${unchanged}; spans with no kept cands: ${untouched}`);
}

main().catch((err) => {
  console.error(err.stack ?? err);
  process.exit(1);
});

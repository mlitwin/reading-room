#!/usr/bin/env node
// Stage 1 of the C11 (homograph disambiguation) pipeline. Walks the manuscript
// JSON, computes the per-chapter span_index that matches the concordance's
// token_ref convention (b{book}-{chapter}-{NNN}), and emits a JSONL worklist
// of every multi-candidate word token with no selected_lemma_id, enriched
// with line context and candidate glosses.
//
// Output: site/generator/.build/c11-worklist.jsonl  (one record per line)
//
// The worklist feeds resolve-c11-llm.js (Stage 2) and apply-c11-resolutions.js
// (Stage 3). See remaining-validate.md.
//
// Usage: node migrate/extract-c11-worklist.js [--text=<slug>] [--out=<path>]

import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, '..', '..', '..');
const GENERATOR_ROOT = join(__dirname, '..');
const LEXICON_PATH = join(REPO_ROOT, 'content', '_language', 'latin', 'lexicon.json');

const DEFAULT_TEXT = 'ovid-metamorphoses';
const DEFAULT_OUT = join(GENERATOR_ROOT, '.build', 'c11-worklist.jsonl');

// Parse a __data_matches string: "lemma_a:p1,p2;lemma_b:p3" →
// [{ lemma_id, parses[] }, ...]. Same shape as build-concordance.js.
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

// Reconstruct the visible Latin text of a line. Word tokens contribute their
// surface; punct/ws contribute their text. The target token is wrapped in
// double square brackets so the LLM (and a human reader) can locate it
// unambiguously in the rendered line.
function renderLine(line, targetIndex = -1) {
  let out = '';
  for (let i = 0; i < line.tokens.length; i += 1) {
    const t = line.tokens[i];
    let chunk;
    if (t.kind === 'word') chunk = t.surface;
    else if (t.kind === 'punct') chunk = t.text;
    else if (t.kind === 'ws') chunk = t.text ?? ' ';
    else chunk = '';
    if (i === targetIndex) chunk = `[[${chunk}]]`;
    out += chunk;
  }
  return out;
}

// Build the candidate record for the worklist. Pulls lemma metadata
// (citation form, POS, glosses) from the lexicon; falls back gracefully when
// a lemma isn't in the index.
function makeCandidate({ lemma_id, parses }, lexByLemmaId) {
  const lex = lexByLemmaId.get(lemma_id);
  return {
    lemma_id,
    lemma: lex?.lemma ?? lemma_id,
    pos: lex?.pos ?? null,
    parses,
    // Trim to the first two glosses to keep records compact; the LLM only
    // needs enough to distinguish the candidates, not the full sense list.
    glosses: (lex?.glosses ?? []).slice(0, 2),
  };
}

async function main() {
  const { values } = parseArgs({
    options: {
      text: { type: 'string' },
      out:  { type: 'string' },
    },
  });
  const textSlug = values.text ?? DEFAULT_TEXT;
  const outPath = values.out ?? DEFAULT_OUT;
  const msPath = join(REPO_ROOT, 'content', textSlug, 'manuscript.latin.json');

  const ms = JSON.parse(await readFile(msPath, 'utf8'));
  const lex = JSON.parse(await readFile(LEXICON_PATH, 'utf8'));
  const lexByLemmaId = new Map(lex.lemmata.map((l) => [l.id, l]));

  // Walk lines in order, group word tokens by section to compute span_index
  // exactly as build-concordance.js does (1-based, resets per chapter file).
  // Lines in a section are contiguous in the JSON, so a running counter works.
  let currentSection = null;
  let spanIndex = 0;

  // Buffer of lines grouped by section so we can attach prev/next context.
  // Each entry: { section, n, tokens, renderedByWordIdx: Map(tokenIdx → null), candidates: [...] }
  const linesBySection = new Map(); // section → array of line refs

  // First pass: assign span_index and collect multi-candidate hits.
  const hits = []; // { tokenRef, section, lineIdx, tokenIdx, surface, candidates }
  for (let li = 0; li < ms.lines.length; li += 1) {
    const line = ms.lines[li];
    if (line.section !== currentSection) {
      currentSection = line.section;
      spanIndex = 0;
    }
    if (!linesBySection.has(line.section)) linesBySection.set(line.section, []);
    linesBySection.get(line.section).push({ li, line });

    for (let ti = 0; ti < line.tokens.length; ti += 1) {
      const tok = line.tokens[ti];
      if (tok.kind !== 'word') continue;
      spanIndex += 1;

      // Determine candidate list. Multi-candidate tokens carry __data_matches.
      // Single-candidate tokens have just lemma_id + parses.
      const candidates = tok.__data_matches
        ? parseDataMatches(tok.__data_matches)
        : [{ lemma_id: tok.lemma_id, parses: tok.parses }];

      if (candidates.length <= 1) continue;
      // Skip tokens that already have an editorial selection — they're not
      // C11 violations (build-concordance.js promotes data-stanza hints to
      // selected_lemma_id only when the hint matches a candidate).
      // The selected lemma lives in tok.stanza (data-stanza) at the JSON
      // layer; mirror the same matching rule.
      if (tok.stanza && candidates.some((c) => c.lemma_id === tok.stanza)) continue;

      const [book, chapter] = line.section.split('.');
      const tokenRef = `b${book}-${chapter}-${String(spanIndex).padStart(3, '0')}`;
      hits.push({
        tokenRef,
        section: line.section,
        lineN: line.n,
        lineIdx: li,
        tokenIdx: ti,
        surface: tok.surface,
        candidates,
      });
    }
  }

  // Second pass: build records. For each hit, render its line (with the
  // target surface marked) and look up prev/next lines from the same section.
  const lineLookup = new Map(); // section → Map(lineN → lineIdx)
  for (const [section, items] of linesBySection) {
    const m = new Map();
    for (const { line, li } of items) m.set(line.n, li);
    lineLookup.set(section, m);
  }

  const records = hits.map((h) => {
    const line = ms.lines[h.lineIdx];
    const sectionLines = lineLookup.get(h.section);
    const prevLineIdx = sectionLines.get(h.lineN - 1);
    const nextLineIdx = sectionLines.get(h.lineN + 1);
    return {
      token_ref: h.tokenRef,
      surface: h.surface,
      section: h.section,
      line_n: h.lineN,
      line_text: renderLine(line, h.tokenIdx),
      prev_line: prevLineIdx !== undefined ? renderLine(ms.lines[prevLineIdx]) : null,
      next_line: nextLineIdx !== undefined ? renderLine(ms.lines[nextLineIdx]) : null,
      candidates: h.candidates.map((c) => makeCandidate(c, lexByLemmaId)),
    };
  });

  await mkdir(dirname(outPath), { recursive: true });
  const jsonl = records.map((r) => JSON.stringify(r)).join('\n') + (records.length ? '\n' : '');
  await writeFile(outPath, jsonl, 'utf8');

  console.log(`extracted ${records.length} multi-candidate tokens → ${outPath}`);
  const byCandidateCount = {};
  for (const r of records) {
    const k = r.candidates.length;
    byCandidateCount[k] = (byCandidateCount[k] || 0) + 1;
  }
  for (const [k, n] of Object.entries(byCandidateCount).sort()) {
    console.log(`  ${k} candidates: ${n} tokens`);
  }
}

main().catch((err) => { console.error(err.stack ?? err); process.exit(1); });

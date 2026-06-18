#!/usr/bin/env node
// Phase 4: build a per-text concordance from inline markdown spans.
//
// Walk content/{text_slug}/*.md (chapter files matching the b{book}-{chapter}
// naming convention), extract every <span data-matches="…"> element in document
// order, and emit:
//   docs/assets/concordance/{text_slug}.json
//
// Token IDs are deterministic: b{book}-{chapter}-{span_index:03d} where
// span_index is the 1-based ordinal of the span within its chapter file.
//
// Usage:
//   node build-concordance.js --text=<slug> [--out=<path>]
// e.g.
//   node build-concordance.js --text=ovid-metamorphoses

import { readFile, readdir, mkdir, writeFile } from 'node:fs/promises';
import { dirname, join, basename } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';

import { ConcordanceSchema } from './schema/concordance.schema.js';
import { normalizeSurface } from './lib/normalize.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, '..', '..');

// Filename → { book, chapter }. Supported convention:
//   book{N}-{NN}.md      e.g. book1-01.md → { book: "1", chapter: "01" }
// Anything that doesn't match is skipped with a warning.
const CHAPTER_FILE_RE = /^book(\d+)-(\w+)\.md$/;

function parseChapterFilename(filename) {
  const m = CHAPTER_FILE_RE.exec(filename);
  if (!m) return null;
  return { book: m[1], chapter: m[2] };
}

// Span match. Capture the attributes block and the inner text.
// The inner text is the surface; the build wraps it in <span>…</span> per the
// editorial convention so it's never a nested tag.
const SPAN_RE = /<span\b([^>]*?)>([^<]*)<\/span>/g;
const ATTR_RE = /([a-zA-Z][\w-]*)\s*=\s*"([^"]*)"/g;

function parseAttributes(attrBlock) {
  const out = {};
  ATTR_RE.lastIndex = 0;
  let m;
  while ((m = ATTR_RE.exec(attrBlock))) {
    out[m[1]] = m[2];
  }
  return out;
}

// Parse a data-matches value:
//   "lemma_id_a:parse1,parse2;lemma_id_b:parse3"
// → [{ lemma_id: "lemma_id_a", parses: ["parse1", "parse2"] },
//    { lemma_id: "lemma_id_b", parses: ["parse3"] }]
//
// Some legacy spans use the bare POS string as the parse (e.g. "in_prep:prep"
// for indeclinable prepositions). Those parses are preserved verbatim — they
// match the "inv" marker convention or the corresponding bare-POS code that
// the glossary entry will carry for invariant lemmata.
function parseMatches(value) {
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

/**
 * @param {string} fileText
 * @param {{ book: string, chapter: string }} loc
 * @returns {Array<{
 *   id: string, surface: string, candidates: any[],
 *   selected_lemma_id?: string, selected_parses?: string[], pos_hint?: string,
 *   raw_surface: string,    // pre-normalization
 *   span_index: number,     // 1-based
 * }>}
 */
function extractTokens(fileText, loc) {
  const tokens = [];
  let spanIndex = 0;
  SPAN_RE.lastIndex = 0;
  let m;
  while ((m = SPAN_RE.exec(fileText))) {
    const attrs = parseAttributes(m[1]);
    if (!attrs['data-matches']) continue; // not a lexicon span
    spanIndex += 1;
    const rawSurface = m[2];
    const surface = normalizeSurface(rawSurface);
    const candidates = parseMatches(attrs['data-matches']);
    const id = `b${loc.book}-${loc.chapter}-${String(spanIndex).padStart(3, '0')}`;
    const tok = {
      id,
      surface,
      candidates,
      raw_surface: rawSurface,
      span_index: spanIndex,
    };
    // data-selected-lemma is the explicit editorial selection (takes priority).
    // data-stanza is the legacy stanza-model hint (fallback).
    if (attrs['data-selected-lemma']) {
      const selId = attrs['data-selected-lemma'];
      const matching = candidates.find((c) => c.lemma_id === selId);
      if (matching) tok.selected_lemma_id = selId;
    } else if (attrs['data-stanza']) {
      const stanzaId = attrs['data-stanza'];
      // Promote to selected_lemma_id only if it matches one of the candidates;
      // otherwise the stanza-model hint pointed at a lemma we no longer expose,
      // so leave the field absent (C4 would flag the inconsistency otherwise).
      const matching = candidates.find((c) => c.lemma_id === stanzaId);
      if (matching) {
        tok.selected_lemma_id = stanzaId;
        // Decision per plan: when only the lemma is narrowed, do not further
        // narrow parses — that's the editorial layer's job. Leave
        // selected_parses unset rather than guess.
      }
    }
    if (attrs['data-pos']) tok.pos_hint = attrs['data-pos'];
    tokens.push(tok);
  }
  return tokens;
}

/**
 * Build a concordance for one text source directory. Returns the concordance,
 * a source-tokens manifest (for C8/C9 validation), and aggregate stats.
 * @param {string} textSlug
 * @param {string} sourceDir absolute path to content/{slug}/
 */
export async function buildConcordance(textSlug, sourceDir) {
  const files = (await readdir(sourceDir))
    .filter((f) => f.endsWith('.md'))
    .sort();

  const tokens = {};
  const sourceTokens = [];
  const stats = {
    files: 0,
    skippedFiles: 0,
    totalSpans: 0,
    candidateCounts: { 1: 0, 2: 0, 3: 0, '4+': 0 },
    withSelectedLemma: 0,
  };

  for (const file of files) {
    const loc = parseChapterFilename(file);
    if (!loc) {
      stats.skippedFiles += 1;
      continue;
    }
    stats.files += 1;
    const text = await readFile(join(sourceDir, file), 'utf8');
    const extracted = extractTokens(text, loc);
    for (const tok of extracted) {
      const { raw_surface, span_index, ...stored } = tok;
      tokens[tok.id] = stored;
      sourceTokens.push({ id: tok.id, location: `${file}:span#${span_index}` });
      stats.totalSpans += 1;
      const k = tok.candidates.length;
      stats.candidateCounts[k >= 4 ? '4+' : String(k)] += 1;
      if (tok.selected_lemma_id) stats.withSelectedLemma += 1;
    }
  }

  const concordance = {
    text_id: textSlug,
    language_id: 'latin',
    generated_at: new Date().toISOString(),
    tokens,
  };

  const result = ConcordanceSchema.safeParse(concordance);
  if (!result.success) {
    const issues = result.error.issues
      .slice(0, 10)
      .map((i) => `  ${i.path.join('.')}: ${i.message}`)
      .join('\n');
    throw new Error(`generated concordance failed schema validation:\n${issues}`);
  }

  return { concordance, sourceTokens, stats };
}

async function buildAndWrite(textSlug, outPath) {
  const sourceDir = join(REPO_ROOT, 'content', textSlug);
  const { concordance, sourceTokens, stats } = await buildConcordance(textSlug, sourceDir);

  await mkdir(dirname(outPath), { recursive: true });
  await writeFile(outPath, JSON.stringify(concordance, null, 2) + '\n', 'utf8');

  const manifestPath = outPath.replace(/\.json$/, '.source-tokens.json');
  await writeFile(manifestPath, JSON.stringify(sourceTokens, null, 2) + '\n', 'utf8');

  console.log(`wrote concordance to ${outPath}`);
  console.log(`wrote source-token manifest to ${manifestPath}`);
  console.log(`  chapter files processed: ${stats.files}`);
  if (stats.skippedFiles) console.log(`  files skipped (non-chapter): ${stats.skippedFiles}`);
  console.log(`  total spans extracted: ${stats.totalSpans}`);
  console.log(`  spans by candidate count: 1=${stats.candidateCounts['1']}, 2=${stats.candidateCounts['2']}, 3=${stats.candidateCounts['3']}, 4+=${stats.candidateCounts['4+']}`);
  console.log(`  spans with selected lemma (data-stanza): ${stats.withSelectedLemma}`);
}

async function main() {
  const { values } = parseArgs({
    options: {
      text: { type: 'string' },
      out: { type: 'string' },
    },
  });
  if (!values.text) {
    console.error('Usage: build-concordance.js --text=<slug> [--out=<path>]');
    process.exit(2);
  }
  const outPath = values.out ?? join(REPO_ROOT, 'docs', 'assets', 'concordance', `${values.text}.json`);
  await buildAndWrite(values.text, outPath);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((err) => {
    console.error(err.stack ?? err);
    process.exit(2);
  });
}

#!/usr/bin/env node
// Editorial backlog: back-port the existing per-chapter Ovid markdown files
// to the manuscript JSON shape defined in Plans/manuscript-format-plan.md.
//
// Reads:  content/ovid-metamorphoses/book{N}-{NN}.md  (28 files)
// Writes: content/ovid-metamorphoses/manuscript.latin.json
//         content/ovid-metamorphoses/manuscript.english.json
//         content/ovid-metamorphoses/correspondences.json
//
// Round-trip is the regression bar (see build-manuscript-md.js): emitting
// markdown from these JSON files must reproduce the original twenty-eight
// files byte-for-byte (modulo agreed normalizations). Anything this script
// can't faithfully represent should fail loudly rather than silently.
//
// Usage: node migrate/manuscript-from-markdown.js [--dry-run]

import { readFile, readdir, writeFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';

import matter from 'gray-matter';

import { ManuscriptSchema } from '../schema/manuscript.schema.js';
import { CorrespondencesSchema } from '../schema/correspondences.schema.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, '..', '..', '..');
const TEXT_SLUG = 'ovid-metamorphoses';
const TEXT_TITLE = 'Metamorphoses';
const TEXT_AUTHOR = 'Ovid';
const SOURCE_DIR = join(REPO_ROOT, 'content', TEXT_SLUG);

const CHAPTER_FILE_RE = /^book(\d+)-(\w+)\.md$/;

// Matches a <span data-matches="..."> ... </span> element. Greedy attr block,
// lazy inner text (no nested tags expected in the Latin passage).
const SPAN_RE = /<span\b([^>]*?)>([^<]*)<\/span>/g;
const ATTR_RE = /([a-zA-Z][\w-]*)\s*=\s*"([^"]*)"/g;
const BR_RE = /<br\s*\/?>/;

function parseAttributes(attrBlock) {
  const out = {};
  ATTR_RE.lastIndex = 0;
  let m;
  while ((m = ATTR_RE.exec(attrBlock))) out[m[1]] = m[2];
  return out;
}

// "lemma_id_a:parse1,parse2;lemma_id_b:parse3" — same shape build-concordance
// already parses; reuse the algorithm.
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

// Tokenize a fragment of text that lies BETWEEN two spans (or between span
// and <br>). Per Decision 4, punctuation that ends with a trailing space
// (", ", "; ") collapses into one punct token; pure whitespace is a ws token.
function tokenizeBetweenSpans(text) {
  const tokens = [];
  if (!text) return tokens;
  // Common Latin punctuation lumped into one token with any trailing space.
  // Cluster:  one-or-more {punct chars} optionally followed by spaces.
  // Or:       run of whitespace alone.
  const re = /([(){}[\]\-—,.;:!?'"]+\s*)|(\s+)/g;
  let i = 0;
  let m;
  while ((m = re.exec(text))) {
    if (m.index > i) {
      // Untokenized residue (unlikely given the cluster regex above).
      tokens.push({ kind: 'punct', text: text.slice(i, m.index) });
    }
    if (m[1] !== undefined) {
      tokens.push({ kind: 'punct', text: m[1] });
    } else if (m[2] !== undefined) {
      // Whitespace-only segment.
      if (m[2] === ' ') tokens.push({ kind: 'ws' });
      else tokens.push({ kind: 'ws', text: m[2] });
    }
    i = m.index + m[0].length;
  }
  if (i < text.length) {
    tokens.push({ kind: 'punct', text: text.slice(i) });
  }
  return tokens;
}

// Walk the latin-passage block. Returns an array of line objects:
//   { tokens: Token[] }
// One line per <br>; the final line ends at </div>.
function parseLatinPassage(body) {
  // body is the inner HTML between <div class="latin-passage"> and </div>.
  // Strategy: walk forward, alternating between <span> matches and the
  // intervening text. <br> in the text closes the current line.
  const lines = [{ tokens: [] }];
  const pushTok = (t) => { lines[lines.length - 1].tokens.push(t); };
  const flushBetween = (raw) => {
    // Split on <br>; everything before each <br> is appended to the current
    // line as tokens, then a new line starts. Strip a leading newline from
    // each piece — that's the physical markdown line break between source
    // lines, not editorial whitespace inside a line. Decision 4: line
    // breaks are implicit in the JSON model.
    const pieces = raw.split(BR_RE);
    for (let i = 0; i < pieces.length; i += 1) {
      // Strip leading + trailing newlines: those are the physical markdown
      // line breaks between source lines / before </div>, not editorial
      // whitespace inside a line. Decision 4: line breaks are implicit.
      const seg = pieces[i].replace(/^\n+/, '').replace(/\n+$/, '');
      for (const t of tokenizeBetweenSpans(seg)) pushTok(t);
      if (i < pieces.length - 1) lines.push({ tokens: [] });
    }
  };

  SPAN_RE.lastIndex = 0;
  let cursor = 0;
  let m;
  while ((m = SPAN_RE.exec(body))) {
    if (m.index > cursor) flushBetween(body.slice(cursor, m.index));
    const attrs = parseAttributes(m[1]);
    const surface = m[2];
    if (attrs['data-matches']) {
      const candidates = parseMatches(attrs['data-matches']);
      if (candidates.length !== 1) {
        // Multi-candidate spans (forma_n:...;formo_v:...) collapse into one
        // word token because the editorial line stores the surface once.
        // The token carries the FIRST candidate's lemma_id and the union of
        // parses across candidates is preserved verbatim from data-matches.
        // (Phase 1: faithful round-trip; phase 2 can split candidates.)
        const tok = {
          kind: 'word',
          surface,
          lemma_id: candidates[0].lemma_id,
          parses: candidates.flatMap((c) => c.parses),
        };
        if (attrs['data-stanza']) tok.stanza = attrs['data-stanza'];
        if (attrs['data-pos']) tok.pos_hint = attrs['data-pos'];
        // Stash the original data-matches so the emitter can reproduce it
        // verbatim (multi-candidate spans don't round-trip via lemma_id +
        // parses alone). Round-trip representation only — strips before
        // schema validation.
        tok.__data_matches = attrs['data-matches'];
        pushTok(tok);
      } else {
        const tok = {
          kind: 'word',
          surface,
          lemma_id: candidates[0].lemma_id,
          parses: candidates[0].parses,
        };
        if (attrs['data-stanza']) tok.stanza = attrs['data-stanza'];
        if (attrs['data-pos']) tok.pos_hint = attrs['data-pos'];
        pushTok(tok);
      }
    } else {
      // <span> without data-matches isn't expected in latin-passage; emit
      // the surface as a punct token so the round-trip stays exact.
      pushTok({ kind: 'punct', text: surface });
    }
    cursor = m.index + m[0].length;
  }
  if (cursor < body.length) flushBetween(body.slice(cursor));

  // Trim a possible empty final line (from a trailing newline after </div>).
  while (lines.length > 1 && lines[lines.length - 1].tokens.length === 0) lines.pop();
  return lines;
}

// Extract the <div class="latin-passage">…</div> block from the markdown
// body and return its inner HTML.
function extractLatinPassage(body) {
  const open = /<div\s+class="latin-passage">/i.exec(body);
  if (!open) return null;
  const closeIx = body.indexOf('</div>', open.index + open[0].length);
  if (closeIx < 0) return null;
  return body.slice(open.index + open[0].length, closeIx);
}

// Split the markdown body into the three editorial blocks. Returns
//   { latinHtml, translation, notes }
// where any block may be null if absent.
function splitBlocks(body) {
  const latinHtml = extractLatinPassage(body);

  const translationMatch = /\n## Translation\n+([\s\S]*?)(?=\n## |\n#|$)/.exec(body);
  const notesMatch = /\n## Notes on the passage\n+([\s\S]*?)(?=\n## |\n#|$)/.exec(body);
  return {
    latinHtml,
    translation: translationMatch ? translationMatch[1].trim() : null,
    notes: notesMatch ? notesMatch[1].trim() : null,
  };
}

function parseChapterFilename(filename) {
  const m = CHAPTER_FILE_RE.exec(filename);
  if (!m) return null;
  return { book: m[1], chapter: m[2] };
}

function sectionPath(book, chapter) {
  return `${book}.${chapter}`;
}

async function main() {
  const { values } = parseArgs({ options: { 'dry-run': { type: 'boolean' } } });
  const dryRun = values['dry-run'] ?? false;

  const files = (await readdir(SOURCE_DIR))
    .filter((f) => f.endsWith('.md') && CHAPTER_FILE_RE.test(f))
    .sort();

  // Build the per-book section index. For the current corpus this is always
  // book "1"; the code is general so a future book2/book3 just works.
  const bookIds = new Set();
  const latinSections = [];
  const englishSections = [];
  const latinLines = [];
  const correspondenceMappings = [];

  // English manuscript today is the per-chapter translation blob; lines stay
  // empty (Decision 3, deferred). Correspondences therefore map per chapter
  // to a virtual english line range of [1, 1] for each chapter — a sentinel
  // that future per-line work refines.
  let englishLineCursor = 1;

  for (const file of files) {
    const loc = parseChapterFilename(file);
    if (!loc) continue;
    const text = await readFile(join(SOURCE_DIR, file), 'utf8');
    const parsed = matter(text);
    const fm = parsed.data ?? {};
    const path = sectionPath(loc.book, loc.chapter);
    bookIds.add(loc.book);

    const blocks = splitBlocks(parsed.content);
    if (!blocks.latinHtml) {
      console.error(`skipping ${file} — no latin-passage div found`);
      continue;
    }

    const chapterLines = parseLatinPassage(blocks.latinHtml);
    const startLine = Array.isArray(fm.lines) ? fm.lines[0] : 1;
    chapterLines.forEach((line, i) => {
      latinLines.push({
        n: startLine + i,
        section: path,
        tokens: line.tokens,
      });
    });

    const latinSection = {
      path,
      level: 'chapter',
      label: `Chapter ${loc.chapter}`,
      title: typeof fm.title === 'string' ? fm.title : undefined,
      line_range: Array.isArray(fm.lines)
        ? [fm.lines[0], fm.lines[1]]
        : [startLine, startLine + chapterLines.length - 1],
    };
    if (blocks.notes) latinSection.notes = blocks.notes;
    latinSections.push(latinSection);

    const englishSection = {
      path,
      level: 'chapter',
      label: `Chapter ${loc.chapter}`,
      title: latinSection.title,
    };
    if (blocks.translation) englishSection.translation = blocks.translation;
    englishSections.push(englishSection);

    // One mapping per chapter: Latin line_range → english [cursor, cursor]
    // sentinel. Updated later when English gets tokenized.
    correspondenceMappings.push({
      source: latinSection.line_range,
      target: [englishLineCursor, englishLineCursor],
    });
    englishLineCursor += 1;
  }

  // Top-level book sections (one per discovered book id).
  const bookSections = [...bookIds].sort().map((b) => ({
    path: b,
    level: 'book',
    label: `Book ${b}`,
  }));

  const hierarchy = [
    { id: 'book', label: 'Book' },
    { id: 'chapter', label: 'Chapter' },
  ];

  // Strip the round-trip-only __data_matches stash before schema validation;
  // the markdown emitter reads it off the raw object before this point.
  function stripDataMatches(obj) {
    const copy = JSON.parse(JSON.stringify(obj));
    for (const line of copy.lines ?? []) {
      for (const t of line.tokens) delete t.__data_matches;
    }
    return copy;
  }

  const latinManuscript = {
    text_id: TEXT_SLUG,
    language_id: 'latin',
    title: TEXT_TITLE,
    author: TEXT_AUTHOR,
    hierarchy,
    sections: [...bookSections, ...latinSections],
    lines: latinLines,
  };
  const englishManuscript = {
    text_id: TEXT_SLUG,
    language_id: 'english',
    title: TEXT_TITLE,
    author: TEXT_AUTHOR,
    hierarchy,
    sections: [...bookSections, ...englishSections],
    lines: [],
  };
  const correspondences = {
    text_id: TEXT_SLUG,
    pairs: [
      { source: 'latin', target: 'english', mappings: correspondenceMappings },
    ],
  };

  // Schema-validate before writing.
  const latinForValidation = stripDataMatches(latinManuscript);
  const mResult = ManuscriptSchema.safeParse(latinForValidation);
  if (!mResult.success) {
    console.error('latin manuscript failed schema validation:');
    for (const i of mResult.error.issues.slice(0, 12)) {
      console.error(`  ${i.path.join('.')}: ${i.message}`);
    }
    process.exit(1);
  }
  const eResult = ManuscriptSchema.safeParse(englishManuscript);
  if (!eResult.success) {
    console.error('english manuscript failed schema validation:');
    for (const i of eResult.error.issues.slice(0, 12)) {
      console.error(`  ${i.path.join('.')}: ${i.message}`);
    }
    process.exit(1);
  }
  const cResult = CorrespondencesSchema.safeParse(correspondences);
  if (!cResult.success) {
    console.error('correspondences failed schema validation:');
    for (const i of cResult.error.issues.slice(0, 12)) {
      console.error(`  ${i.path.join('.')}: ${i.message}`);
    }
    process.exit(1);
  }

  const latinPath = join(SOURCE_DIR, 'manuscript.latin.json');
  const englishPath = join(SOURCE_DIR, 'manuscript.english.json');
  const corrPath = join(SOURCE_DIR, 'correspondences.json');
  if (!dryRun) {
    await writeFile(latinPath, JSON.stringify(latinManuscript, null, 2) + '\n', 'utf8');
    await writeFile(englishPath, JSON.stringify(englishManuscript, null, 2) + '\n', 'utf8');
    await writeFile(corrPath, JSON.stringify(correspondences, null, 2) + '\n', 'utf8');
  }

  console.log(`${dryRun ? '[dry-run] ' : ''}wrote 3 files:`);
  console.log(`  ${latinPath}`);
  console.log(`    ${latinSections.length} chapters, ${latinLines.length} lines`);
  console.log(`  ${englishPath}`);
  console.log(`    ${englishSections.length} chapters, ${englishSections.filter((s) => s.translation).length} with translation blob`);
  console.log(`  ${corrPath}`);
  console.log(`    ${correspondenceMappings.length} chapter-level mappings`);
}

main().catch((err) => {
  console.error(err.stack ?? err);
  process.exit(1);
});

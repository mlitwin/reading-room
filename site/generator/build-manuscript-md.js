#!/usr/bin/env node
// Emit per-chapter markdown from a manuscript JSON pair + correspondences.
// See Plans/manuscript-format-plan.md.
//
// Reads:  content/{text_slug}/manuscript.{latin,english}.json
//         content/{text_slug}/correspondences.json
// Writes: site/generator/.build/manuscript-md/{text_slug}/book{N}-{NN}.md
//
// The output is a build artifact (Decision 2): gitignored, regenerated on
// every build, byte-for-byte the same as today's authored markdown during
// the transition period. After cutover the existing
// content/{text_slug}/book*.md sources move to a gitignored location and
// the build feeds the downstream stages (build-concordance, build.js) off
// the output here.
//
// Usage:
//   node build-manuscript-md.js --text=ovid-metamorphoses [--out=<dir>]

import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';

import { ManuscriptSchema } from './schema/manuscript.schema.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, '..', '..');
const DEFAULT_OUT_ROOT = join(__dirname, '.build', 'manuscript-md');

function emitYamlFrontmatter(section) {
  const lines = ['---'];
  if (section.title) lines.push(`title: "${section.title.replace(/"/g, '\\"')}"`);
  if (section.line_range) lines.push(`lines: [${section.line_range[0]}, ${section.line_range[1]}]`);
  lines.push('---');
  return lines.join('\n');
}

function emitSpan(tok) {
  // Round-trip stash: multi-candidate spans stored their original
  // data-matches verbatim so the emitter can reproduce it exactly. Phase 1
  // back-port leaves __data_matches off the schema; phase 2 will replace
  // the field with a clean candidates[] array.
  const matchesAttr = tok.__data_matches
    ?? `${tok.lemma_id}:${tok.parses.join(',')}`;
  let out = `<span data-matches="${matchesAttr}"`;
  if (tok.pos_hint) out += ` data-pos="${tok.pos_hint}"`;
  if (tok.stanza) out += ` data-stanza="${tok.stanza}"`;
  if (tok.selected_lemma_id) out += ` data-selected-lemma="${tok.selected_lemma_id}"`;
  out += `>${tok.surface}</span>`;
  return out;
}

function emitToken(tok) {
  switch (tok.kind) {
    case 'word':  return emitSpan(tok);
    case 'punct': return tok.text;
    case 'ws':    return tok.text ?? ' ';
    default:      throw new Error(`unknown token kind: ${tok.kind}`);
  }
}

// Render a single line's tokens. The existing markdown convention is to
// separate adjacent <span>s with two literal spaces; the source data has
// either a {ws} token or an explicit {text:"  "} ws token between them.
// We don't insert any padding here — the round-trip relies on those
// inter-word ws tokens already living in the line.tokens stream.
function renderLine(line) {
  return line.tokens.map(emitToken).join('');
}

// Emit the latin-passage div + Translation + Notes blocks for one chapter.
function emitChapter(latinSection, englishSection, latinLines) {
  const lines = [
    emitYamlFrontmatter(latinSection),
    '',
    '<div class="latin-passage">',
  ];
  // Lines separated by <br>; last line in the div ends with a comma (we
  // preserve whatever final punctuation/character was authored — no implicit
  // closing punctuation).
  for (let i = 0; i < latinLines.length; i += 1) {
    const rendered = renderLine(latinLines[i]);
    if (i < latinLines.length - 1) lines.push(`${rendered}<br>`);
    else lines.push(rendered);
  }
  lines.push('</div>', '');

  if (englishSection?.translation) {
    lines.push('## Translation', '', englishSection.translation, '');
  }
  if (latinSection.notes) {
    lines.push('## Notes on the passage', '', latinSection.notes, '');
  }

  return lines.join('\n');
}

function chapterFilename(path) {
  // path "1.01" → "book1-01.md"
  const [book, chapter] = path.split('.');
  return `book${book}-${chapter}.md`;
}

export async function buildManuscriptMd(textSlug, outDir, contentDir = join(REPO_ROOT, 'content', textSlug)) {
  const latinPath = join(contentDir, 'manuscript.latin.json');
  const englishPath = join(contentDir, 'manuscript.english.json');

  const latin = JSON.parse(await readFile(latinPath, 'utf8'));
  const english = JSON.parse(await readFile(englishPath, 'utf8'));

  // Schema validate ahead of emission — fail fast on a malformed manuscript.
  const stripDataMatches = (m) => ({
    ...m,
    lines: m.lines.map((ln) => ({
      ...ln,
      tokens: ln.tokens.map(({ __data_matches, ...rest }) => rest),
    })),
  });
  const lValidation = ManuscriptSchema.safeParse(stripDataMatches(latin));
  if (!lValidation.success) {
    throw new Error(`latin manuscript schema validation failed:\n${
      lValidation.error.issues.slice(0, 5)
        .map((i) => `  ${i.path.join('.')}: ${i.message}`).join('\n')
    }`);
  }
  const eValidation = ManuscriptSchema.safeParse(english);
  if (!eValidation.success) {
    throw new Error(`english manuscript schema validation failed`);
  }

  const englishByPath = new Map(english.sections.map((s) => [s.path, s]));
  // Group latin lines by their section path.
  const linesBySection = new Map();
  for (const line of latin.lines) {
    if (!linesBySection.has(line.section)) linesBySection.set(line.section, []);
    linesBySection.get(line.section).push(line);
  }
  // Stable line order: by `n` ascending within each section.
  for (const arr of linesBySection.values()) arr.sort((a, b) => a.n - b.n);

  await mkdir(outDir, { recursive: true });
  const written = [];
  for (const section of latin.sections) {
    if (section.level !== 'chapter') continue;
    const lines = linesBySection.get(section.path) ?? [];
    if (lines.length === 0) continue;
    const md = emitChapter(section, englishByPath.get(section.path), lines);
    const path = join(outDir, chapterFilename(section.path));
    await writeFile(path, md, 'utf8');
    written.push(path);
  }
  return written;
}

async function main() {
  const { values } = parseArgs({
    options: {
      text: { type: 'string' },
      out: { type: 'string' },
    },
  });
  if (!values.text) {
    console.error('Usage: build-manuscript-md.js --text=<slug> [--out=<dir>]');
    process.exit(2);
  }
  const outDir = values.out ?? join(DEFAULT_OUT_ROOT, values.text);
  const written = await buildManuscriptMd(values.text, outDir);
  console.log(`wrote ${written.length} chapter markdown files to ${outDir}`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((err) => {
    console.error(err.stack ?? err);
    process.exit(2);
  });
}

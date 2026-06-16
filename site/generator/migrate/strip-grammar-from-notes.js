#!/usr/bin/env node
// Phase 5b cleanup: remove H2 sections from a piece's notes.md whose slug
// matches a grammar.json value (those terms now resolve from grammar.json at
// build time, so duplicating them in notes.md is dead weight).
//
// Usage:
//   node migrate/strip-grammar-from-notes.js <notes-md-path> [--dry-run]
//
// Decisions:
//   - Slug matching mirrors the build pipeline: case-fold + strip accents +
//     drop non-alphanumerics. Both value.id and slugified value.label are
//     considered (a heading "Nominative" collides with grammar value id "nom"
//     via slugified label "nominative").
//   - Content above the first H2 (intro paragraph) is preserved verbatim.
//   - Each removed section spans from the H2 line through the line before the
//     next H2 (or EOF).

import { readFile, writeFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, '..', '..', '..');
const GRAMMAR_JSON = join(REPO_ROOT, 'content', '_language', 'latin', 'grammar.json');

function slugify(s) {
  return s.toLowerCase()
    .normalize('NFKD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');
}

async function loadGrammarSlugs() {
  const grammar = JSON.parse(await readFile(GRAMMAR_JSON, 'utf8'));
  const out = new Set();
  for (const cat of grammar.categories) {
    for (const val of cat.values) {
      out.add(val.id);
      out.add(slugify(val.label));
      if (val.noteRef) out.add(val.noteRef);
    }
  }
  return out;
}

function stripSections(text, slugsToRemove) {
  const lines = text.split('\n');
  const kept = [];
  const removed = [];
  let skipping = false;
  for (const line of lines) {
    const m = /^## (.+?)\s*$/.exec(line);
    if (m) {
      const slug = slugify(m[1]);
      if (slugsToRemove.has(slug)) {
        skipping = true;
        removed.push(m[1]);
        continue;
      }
      skipping = false;
    }
    if (!skipping) kept.push(line);
  }
  // Collapse runs of 3+ blank lines (left behind by the removed sections) into
  // a single blank line so the file stays tidy.
  const joined = kept.join('\n').replace(/\n{3,}/g, '\n\n');
  return { text: joined, removedHeadings: removed };
}

async function main() {
  const { values, positionals } = parseArgs({
    options: { 'dry-run': { type: 'boolean' } },
    allowPositionals: true,
  });
  if (positionals.length !== 1) {
    console.error('Usage: strip-grammar-from-notes.js <notes-md-path> [--dry-run]');
    process.exit(2);
  }
  const notesPath = positionals[0];
  const grammarSlugs = await loadGrammarSlugs();
  const text = await readFile(notesPath, 'utf8');
  const { text: newText, removedHeadings } = stripSections(text, grammarSlugs);

  console.log(`${values['dry-run'] ? '[dry-run] would remove' : 'removed'} ${removedHeadings.length} grammar section(s):`);
  for (const h of removedHeadings) console.log(`  - ${h}`);

  if (!values['dry-run']) {
    await writeFile(notesPath, newText, 'utf8');
    console.log(`wrote ${notesPath}`);
  } else {
    console.log(`\nWould write ${newText.length} chars (was ${text.length}).`);
  }
}

main().catch((err) => {
  console.error(err.stack ?? err);
  process.exit(1);
});

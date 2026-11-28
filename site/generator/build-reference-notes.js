// Project the Reference Grammar (reference-grammar.json) into the
// language-level popover artifact, docs/assets/{lang}-reference-notes.json. It
// is shared across every Latin text: the reader's popover stack (cards.js)
// renders these in-flow, so an `ag:N` / `ref:ID` tap opens the section inside
// the popover instead of navigating away.
//
// Same data as the standalone document (build-reference-grammar.js); the only
// difference is link rewriting (tables get the same scroll wrapper) — cross-refs <a data-ref="M"> become in-flow
// controls <a class="ag-link" data-ag="M">. Derived navigation (chapter,
// prev/next) is included so the popover can page through the grammar.
//
// See Plans/latin-text-centered-reader-plan.md (D1, D4).

import { readFile, writeFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { indexReferenceGrammar, sectionShortLabel, wrapTables } from './lib/reference-grammar.js';

// Rewrite a section body into popover (in-flow) HTML.
export function toPopoverHtml(sectionHtml) {
  return wrapTables(String(sectionHtml).replace(/<a data-ref="([^"]+)">/g, '<a class="ag-link" data-ag="$1">'));
}

function tocTree(index) {
  return index.parts.map((p) => ({
    id: p.id,
    label: p.label,
    chapters: p.chapters.map((c) => ({ id: c.id, label: c.label, slug: c.slug, items: c.items })),
  }));
}

/**
 * Build the reference-notes object (pure; no I/O).
 * @param {object} referenceGrammar  parsed reference-grammar.json
 */
export function buildReferenceNotes(referenceGrammar) {
  const index = indexReferenceGrammar(referenceGrammar);
  const notes = {};
  for (const [id, info] of index.sections) {
    notes[id] = {
      id,
      label: sectionShortLabel(info),
      title: info.heading,
      html: toPopoverHtml(info.html),
      refs: info.xrefs,
      chapter: info.chapter.id,
      prev: info.prev,
      next: info.next,
    };
  }
  return {
    language_id: referenceGrammar.language_id,
    title: index.title,
    generated_at: new Date().toISOString(),
    toc: tocTree(index),
    notes,
  };
}

/**
 * Write docs/assets/{languageId}-reference-notes.json.
 * @returns {Promise<{ outPath: string, count: number }>}
 */
export async function emitReferenceNotes({ referenceGrammar, languageId, docsDir }) {
  const doc = buildReferenceNotes(referenceGrammar);
  const outPath = join(docsDir, 'assets', `${languageId}-reference-notes.json`);
  await writeFile(outPath, JSON.stringify(doc) + '\n');
  return { outPath, count: Object.keys(doc.notes).length };
}

// Ad-hoc: node build-reference-notes.js
if (import.meta.url === `file://${process.argv[1]}`) {
  const here = dirname(fileURLToPath(import.meta.url));
  const repo = join(here, '..', '..');
  const ref = JSON.parse(await readFile(join(repo, 'content', '_language', 'latin', 'reference-grammar.json'), 'utf8'));
  const { outPath, count } = await emitReferenceNotes({
    referenceGrammar: ref, languageId: 'latin', docsDir: join(repo, 'docs'),
  });
  console.log(`reference notes: ${count} → ${outPath}`);
}

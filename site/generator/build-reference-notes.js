// Derive the language-level reference-NOTES artifact from reference-grammar.json:
// a popover-sized representation of each A&G section, shared across every Latin
// text (A&G is a property of the language, not of Ovid). The reader's popover
// stack (cards.js) and the iOS note sheet render these in-flow, so an "ag:N"
// tap opens §N inside the popover instead of navigating away.
//
// Differences from the browsable page HTML:
//   - cross-refs <a class="ag-ref" href="#sec-M"> become in-flow controls
//     <a class="ag-link" data-ag="M"> so §→§ drilling stays in the popover;
//   - a trailing "Open full section ↗" control (data-full) is the one explicit
//     navigate-away to the standalone page.
//
// See Plans/latin-grammar-inline-flow-plan.md.

import { readFile, writeFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { planPages } from './build-reference-grammar.js';

// Rewrite a section's page HTML into popover (in-flow) HTML.
function toPopoverHtml(sectionHtml, fullPath) {
  const inflight = String(sectionHtml).replace(
    /<a class="ag-ref" href="#sec-(\d+)">([\s\S]*?)<\/a>/g,
    (_, n, text) => `<a class="ag-link" data-ag="${n}">${text}</a>`
  );
  const fullLink = `<p class="ag-fullpage"><a class="ag-fullpage-link" data-full="${fullPath}">Open full section ↗</a></p>`;
  return inflight + fullLink;
}

/**
 * Build the reference-notes object (pure; no I/O).
 * @param {object} referenceGrammar  parsed reference-grammar.json
 * @returns {{ language_id: string, generated_at: string, notes: Record<string, object> }}
 */
export function buildReferenceNotes(referenceGrammar) {
  const ref = referenceGrammar;
  const { secToPage } = planPages(ref);
  const notes = {};
  for (const [id, sec] of Object.entries(ref.sections)) {
    const slug = secToPage.get(id);
    // docroot-relative; the runtime prepends the consuming page's asset prefix.
    const fullPath = slug ? `_language/latin/reference/${slug}.html#sec-${id}` : null;
    notes[id] = {
      id,
      title: sec.heading || `Section ${id}`,
      html: toPopoverHtml(sec.html, fullPath),
      refs: Array.isArray(sec.xrefs) ? sec.xrefs : [],
      full_path: fullPath,
    };
  }
  return {
    language_id: ref.language_id,
    generated_at: new Date().toISOString(),
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

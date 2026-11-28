// Render the Pronunciation section of the Latin Reader's Guide from
// content/_language/latin/pronunciation.md. The guide page itself is built by
// build-grammar-page.js; the word popovers' "guide" link lands on #pronunciation.
//
// The examples table is computed by the same module the popovers use
// (site/reader/latin-pron.js), so the guide can't drift from what readers see.
// Front matter `examples` lists [headword, lemma?] pairs; the table replaces
// the `<!-- pronunciation-examples -->` marker in the body. The markdown's `##`
// headings become the section's h3 subsections, with `pron-` ids so they can't
// collide with the glossary's value anchors (#pres, #nom, …).

import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import vm from 'node:vm';
import matter from 'gray-matter';

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function slugify(s) {
  return String(s).toLowerCase()
    .normalize('NFKD').replace(/[̀-ͯ]/g, '')
    .replace(/<[^>]+>/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');
}

export async function loadLatinPron(readerDir) {
  const window = {};
  vm.runInNewContext(await readFile(join(readerDir, 'latin-pron.js'), 'utf8'), { window });
  return window.LatinPron;
}

export function renderExamplesTable(examples, LatinPron) {
  const rows = examples.map(([word, lemma]) => {
    const cells = LatinPron.SYSTEMS.map((sys) => {
      const p = LatinPron.pronounce(word, sys, lemma);
      return `<td><span class="pron-respell">${escapeHtml(p.respell)}</span> <span class="pron-ipa">${escapeHtml(p.ipa)}</span></td>`;
    }).join('');
    return `<tr><th scope="row" lang="la">${escapeHtml(word)}</th>${cells}</tr>`;
  }).join('\n');
  return `<table class="pron-examples">
<thead><tr><th scope="col">Word</th><th scope="col">Classical</th><th scope="col">Ecclesiastical</th></tr></thead>
<tbody>
${rows}
</tbody>
</table>`;
}

/**
 * @param {object} params
 * @param {string} params.sourcePath   content/_language/latin/pronunciation.md
 * @param {string} params.readerDir    site/reader (for latin-pron.js)
 * @param {object} params.md           the build's markdown-it instance
 * @param {(html: string, assetPrefix: string) => string} params.resolveAgLinks
 * @param {string} params.assetPrefix  of the page the section lands on
 * @returns {Promise<{html: string, toc: {id: string, label: string}[], noteBody: string}>}
 */
export async function renderPronunciationSection({ sourcePath, readerDir, md, resolveAgLinks, assetPrefix }) {
  const { data, content } = matter(await readFile(sourcePath, 'utf8'));
  const LatinPron = await loadLatinPron(readerDir);

  let body = md.render(content, { filePath: sourcePath, notesDict: {}, referencedNotes: new Set() });
  body = body.replace('<!-- pronunciation-examples -->', renderExamplesTable(data.examples || [], LatinPron));
  const toc = [];
  body = body.replace(/<h2>(.*?)<\/h2>/g, (_, inner) => {
    const id = `pron-${slugify(inner)}`;
    toc.push({ id, label: inner.replace(/<[^>]+>/g, '') });
    return `<h3 id="${id}" class="pron-subhead">${inner}</h3>`;
  });
  // The unresolved body (raw `ag:` links) also becomes the in-text popover
  // entry, whose links are resolved per host page.
  const noteBody = body;
  body = resolveAgLinks(body, assetPrefix);

  const html = `  <section id="pronunciation" class="grammar-category pronunciation-guide">
    <h2>Pronunciation</h2>
${body}
  </section>`;
  return { html, toc, noteBody };
}

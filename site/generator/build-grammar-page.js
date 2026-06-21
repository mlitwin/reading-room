// Build a standalone navigable grammar reference page from grammar.json,
// emitted to docs/_language/{language}/grammar/index.html.
//
// Per the plan: no intermediate markdown file. We render straight from the
// structured grammar source. Each category becomes a section; each value an
// item with its label, abbreviation, and gloss. Internal cross-references
// (<a href="note:X">) are rewritten to in-page anchors so the reader can
// jump between related terms without involving the popover machinery.

import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

// Mirror the slugifier used by extractNotes()/grammarNotesDict() so an "in-page
// id" matches the slug downstream code references.
function slugify(s) {
  return String(s).toLowerCase()
    .normalize('NFKD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// grammar.json glosses use <a href="note:X">…</a> to link sibling values.
// Rewrite to in-page anchors keyed by the same slug. Because we emit ids for
// BOTH the short value id and the slugified label, links that target either
// alias resolve to the same anchor in the page.
function rewriteCrossRefs(html) {
  return String(html).replace(
    /<a\s+href="note:([^"]+)">/g,
    (_, slug) => `<a href="#${slug}">`
  );
}

/**
 * Render the HTML body of the grammar reference. Caller wraps in the page
 * template. Returns the string starting with the <nav class="grammar-toc">
 * and ending with the last category section.
 */
// Render the "→ Allen & Greenough §N" line for a value's agRefs, if any.
// `resolveAgRef(id)` maps a section id to an href (relative to the grammar
// page) or null when no reference grammar is built. The whole feature is a
// no-op when either agRefs or the resolver is absent.
function renderAgRefs(val, resolveAgRef) {
  if (!Array.isArray(val.agRefs) || val.agRefs.length === 0 || !resolveAgRef) return '';
  const links = val.agRefs
    .map((id) => {
      const href = resolveAgRef(id);
      return href ? `<a href="${escapeHtml(href)}">§${escapeHtml(id)}</a>` : null;
    })
    .filter(Boolean);
  if (links.length === 0) return '';
  return `<p class="grammar-agref">Allen &amp; Greenough: ${links.join(', ')}</p>`;
}

export function renderGrammarBody(grammar, resolveAgRef) {
  const tocItems = grammar.categories
    .map((c) => `    <li><a href="#cat-${escapeHtml(c.id)}">${escapeHtml(c.label)}</a></li>`)
    .join('\n');

  const sections = grammar.categories.map((cat) => {
    const items = cat.values.map((val) => {
      const idShort = escapeHtml(val.id);
      const idLong = escapeHtml(slugify(val.label));
      const abbrev = val.abbrev ? ` <span class="grammar-abbrev">${escapeHtml(val.abbrev)}</span>` : '';
      // Anchor under the value id; emit a second hidden anchor for the
      // slugified label so legacy `note:nominative` cross-refs work too.
      const aliasAnchor = idShort !== idLong
        ? `<span id="${idLong}" class="grammar-alias-anchor" hidden></span>`
        : '';
      return `      <div class="grammar-value">
        <h3 id="${idShort}" class="grammar-label">${escapeHtml(val.label)}${abbrev}</h3>
        ${aliasAnchor}
        <div class="grammar-gloss">${rewriteCrossRefs(val.gloss)}</div>
        ${renderAgRefs(val, resolveAgRef)}
      </div>`;
    }).join('\n');
    return `  <section id="cat-${escapeHtml(cat.id)}" class="grammar-category">
    <h2>${escapeHtml(cat.label)}</h2>
${items}
  </section>`;
  }).join('\n');

  return `<nav class="grammar-toc" aria-label="Categories">
  <ul>
${tocItems}
  </ul>
</nav>
${sections}
`;
}

/**
 * Write the grammar reference page using the supplied page template applier.
 * The build pipeline owns templateApply + assetPrefix so this function stays
 * decoupled from build.js internals.
 *
 * @param {object} params
 * @param {object} params.grammar  parsed grammar.json
 * @param {string} params.languageId  e.g. "latin"
 * @param {string} params.languageName  e.g. "Latin"
 * @param {string} params.outDir  absolute docs path (DOCS_DIR)
 * @param {(tpl: string, vars: Record<string,string>) => string} params.applyTemplate
 * @param {string} params.pageTpl  page.html template content
 */
export async function buildGrammarPage({ grammar, languageId, languageName, outDir, applyTemplate, pageTpl, resolveAgRef, hasReference }) {
  const subdir = join('_language', languageId, 'grammar');
  const outPath = join(outDir, subdir, 'index.html');
  await mkdir(join(outDir, subdir), { recursive: true });

  const body = renderGrammarBody(grammar, resolveAgRef);
  const breadcrumb = `<nav class="breadcrumb"><a href="../../../index.html">Library</a> › ${escapeHtml(languageName)} Grammar Reference</nav>`;

  // Link to the full reference grammar when it's built. This page is the short
  // parse-code glossary; the reference grammar (A&G) is the prose companion.
  const refLink = hasReference
    ? `<p class="grammar-lede">A quick glossary of the parse codes used by the reader's word popovers. For the full prose grammar — paradigms, syntax, and worked examples — see the <a href="../reference/index.html">${escapeHtml(languageName)} reference grammar</a>.</p>`
    : '';

  const html = applyTemplate(pageTpl, {
    title: `${languageName} Grammar Reference`,
    assetPrefix: '../../../',
    author: '',
    date: '',
    tags: '',
    breadcrumb,
    body: `<div class="grammar-reference">${refLink}${body}</div>`,
    pagenav: '',
  });

  await writeFile(outPath, html);
  return outPath;
}

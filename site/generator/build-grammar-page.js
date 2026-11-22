// Build the Latin Reader's Guide — the compact reference for the terms the
// reader's word popovers use — emitted to docs/_language/{language}/guide/index.html.
// Two parts: Pronunciation (from pronunciation.md, rendered by
// build-pronunciation-section.js) and the parse-code glossary from grammar.json.
// The page's old home, _language/{language}/grammar/, becomes a redirect stub.
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

export function renderGrammarBody(grammar, resolveAgRef, pronunciation) {
  const terms = Array.isArray(grammar.terms) ? grammar.terms : [];

  const tocLink = (href, label) => `      <li><a href="${href}">${escapeHtml(label)}</a></li>`;
  const grammarToc = grammar.categories
    .map((c) => tocLink(`#cat-${escapeHtml(c.id)}`, c.label))
    .concat(terms.length ? [tocLink('#cat-terms', 'Grammar Terms')] : [])
    .join('\n');
  const tocGroups = [];
  if (pronunciation) {
    tocGroups.push(`    <li><a href="#pronunciation">Pronunciation</a>
      <ul>
${pronunciation.toc.map((t) => tocLink(`#${t.id}`, t.label)).join('\n')}
      </ul>
    </li>`);
  }
  tocGroups.push(`    <li><a href="#grammar">Grammar</a>
      <ul>
${grammarToc}
      </ul>
    </li>`);

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

  // Grammar-terms section — language-general vocabulary linked from the parse-
  // code glosses (note:declension, note:principal-parts, …). Same markup as a
  // category value so anchors and agRefs render identically.
  const termsSection = terms.length ? `  <section id="cat-terms" class="grammar-category">
    <h2>Grammar Terms</h2>
${terms.map((term) => {
    const idShort = escapeHtml(term.id);
    const idLong = escapeHtml(slugify(term.label));
    const aliasAnchor = idShort !== idLong
      ? `<span id="${idLong}" class="grammar-alias-anchor" hidden></span>`
      : '';
    return `      <div class="grammar-value">
        <h3 id="${idShort}" class="grammar-label">${escapeHtml(term.label)}</h3>
        ${aliasAnchor}
        <div class="grammar-gloss">${rewriteCrossRefs(term.gloss)}</div>
        ${renderAgRefs(term, resolveAgRef)}
      </div>`;
  }).join('\n')}
  </section>` : '';

  return `<nav class="grammar-toc" aria-label="Contents">
  <ul>
${tocGroups.join('\n')}
  </ul>
</nav>
${pronunciation ? pronunciation.html : ''}
<div id="grammar">
${sections}
${termsSection}
</div>
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
export const GUIDE_DIR = 'guide';

export async function buildGrammarPage({ grammar, languageId, languageName, outDir, applyTemplate, pageTpl, resolveAgRef, hasReference, pronunciation }) {
  const subdir = join('_language', languageId, GUIDE_DIR);
  const outPath = join(outDir, subdir, 'index.html');
  await mkdir(join(outDir, subdir), { recursive: true });
  const title = `${languageName} Reader's Guide`;

  const body = renderGrammarBody(grammar, resolveAgRef, pronunciation);
  const breadcrumb = `<nav class="breadcrumb"><a href="../../../index.html">Library</a> › ${escapeHtml(title)}</nav>`;

  // This page is the compact companion to the word popovers; the reference
  // grammar (A&G) is the full prose treatment.
  const refLink = hasReference
    ? ` For the full prose grammar — paradigms, syntax, and worked examples — see the <a href="../reference/index.html">${escapeHtml(languageName)} Reference Grammar</a> (Allen &amp; Greenough).`
    : '';
  const lede = `<p class="grammar-lede">A compact reference for reading the ${escapeHtml(languageName)} texts here: how the words are pronounced, and what the grammatical terms in the word popovers mean. Tap a term in any popover to see its entry.${refLink}</p>`;

  const html = applyTemplate(pageTpl, {
    title: escapeHtml(title),
    assetPrefix: '../../../',
    author: '',
    date: '',
    tags: '',
    breadcrumb,
    body: `<div class="grammar-reference">${lede}${body}</div>`,
    pagenav: '',
  });
  await writeFile(outPath, html);

  // The guide's old address (the "Latin Grammar Reference") redirects here,
  // keeping its value anchors (#nom) — published links and bookmarks still land.
  const oldDir = join(outDir, '_language', languageId, 'grammar');
  await mkdir(oldDir, { recursive: true });
  await writeFile(join(oldDir, 'index.html'), `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>${escapeHtml(title)} — Reading Room</title>
<meta http-equiv="refresh" content="0; url=../${GUIDE_DIR}/index.html">
<link rel="canonical" href="../${GUIDE_DIR}/index.html">
<script>location.replace('../${GUIDE_DIR}/index.html' + location.hash);</script>
</head>
<body>
<p>Moved to the <a href="../${GUIDE_DIR}/index.html">${escapeHtml(title)}</a>.</p>
</body>
</html>
`);
  return outPath;
}

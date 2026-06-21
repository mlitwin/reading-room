// Build the browsable Allen & Greenough reference grammar from
// reference-grammar.json, emitted under docs/_language/{language}/reference/.
//
// Granularity: one page per topical section (the second breadcrumb level), ~50
// pages — friendly for deep links (each § gets id="sec-N") and mobile load.
// An index page lists parts → pages with their § ranges and the source
// attribution. Cross-references (<a href="#sec-N">) are rewritten to point at
// the page that actually contains §N (same-page refs stay as bare fragments).

import { mkdir, writeFile, readFile } from 'node:fs/promises';
import { join } from 'node:path';

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
const escapeAttr = escapeHtml;

function slugify(s) {
  return String(s).toLowerCase()
    .normalize('NFKD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim().replace(/\s+/g, '-')
    .replace(/-+/g, '-') || 'section';
}

// Group sections into pages by topical section (path[1]), preserving the
// document order encoded in parts[].sections. Returns { pages, secToPage }.
export function planPages(ref) {
  const pages = [];
  const secToPage = new Map();
  const byKey = new Map();

  for (const part of ref.parts) {
    for (const id of part.sections) {
      const sec = ref.sections[id];
      if (!sec) continue; // a part may reference a missing id; R2 flags it
      const path = sec.path || [];
      const topical = path[1] || path[0] || part.label;
      const key = `${part.id}::${topical}`;
      let page = byKey.get(key);
      if (!page) {
        page = {
          slug: '',
          part: part.label,
          topical,
          sectionIds: [],
        };
        byKey.set(key, page);
        pages.push(page);
      }
      page.sectionIds.push(id);
    }
  }

  // Assign ordinal-prefixed slugs (keeps the directory in reading order and
  // disambiguates topical labels that repeat across parts).
  pages.forEach((page, i) => {
    page.slug = `${String(i + 1).padStart(2, '0')}-${slugify(page.topical)}`;
    for (const id of page.sectionIds) secToPage.set(id, page.slug);
  });

  return { pages, secToPage };
}

// Rewrite in-page anchors to cross-page links when the target lives elsewhere.
function rewriteRefs(html, thisSlug, secToPage) {
  return html.replace(/href="#sec-(\d+)"/g, (whole, n) => {
    const target = secToPage.get(n);
    if (!target || target === thisSlug) return whole; // same page → bare fragment
    return `href="${target}.html#sec-${n}"`;
  });
}

// A&G's paradigm tables are wide (up to ~11 columns). Wrap each in a
// horizontally-scrollable container so they don't overflow narrow viewports.
function wrapTables(html) {
  return html
    .replace(/<table class="ag-table">/g, '<div class="ag-table-wrap"><table class="ag-table">')
    .replace(/<\/table>/g, '</table></div>');
}

// Render one section page's body: subsection headings (path[2..]) emitted when
// they change between consecutive sections, then each §N as an anchored block.
function renderPageBody(page, ref, secToPage) {
  const out = [];
  let lastSub = null;
  for (const id of page.sectionIds) {
    const sec = ref.sections[id];
    const sub = (sec.path || []).slice(2).join(' › ');
    if (sub && sub !== lastSub) {
      out.push(`<h2 class="ag-subhead">${escapeHtml(sub)}</h2>`);
      lastSub = sub;
    }
    const body = wrapTables(rewriteRefs(sec.html, page.slug, secToPage));
    out.push(
      `<section class="ag-section" id="sec-${escapeAttr(id)}">` +
      `<h3 class="ag-secnum"><a href="#sec-${escapeAttr(id)}">§ ${escapeHtml(id)}</a></h3>` +
      `${body}</section>`
    );
  }
  return out.join('\n');
}

function rangeLabel(page) {
  const ids = page.sectionIds;
  const first = ids[0], last = ids[ids.length - 1];
  return first === last ? `§ ${first}` : `§§ ${first}–${last}`;
}

function renderIndexBody(ref, pages, languageName) {
  const src = ref.source;
  const partBlocks = ref.parts.map((part) => {
    const partPages = pages.filter((p) => p.part === part.label);
    const items = partPages.map((p) =>
      `    <li><a href="${escapeAttr(p.slug)}.html">${escapeHtml(p.topical)}</a> ` +
      `<span class="ag-range">${escapeHtml(rangeLabel(p))}</span></li>`
    ).join('\n');
    return `  <section class="ag-part">\n    <h2>${escapeHtml(part.label)}</h2>\n    <ul class="ag-toc">\n${items}\n    </ul>\n  </section>`;
  }).join('\n');

  return `<div class="reference-grammar-index">
  <p class="ag-lede">A complete reference grammar — ${escapeHtml(src.title)}.
  Sections keep their canonical numbering (§), so a citation like “§ 419”
  links straight here. For the short parse-code glossary used by the reader's
  word popovers, see the <a href="../grammar/index.html">${escapeHtml(languageName)} morphology glossary</a>.</p>
${partBlocks}
  <footer class="ag-source">
    <p>${escapeHtml(src.attribution)}</p>
  </footer>
</div>`;
}

/**
 * @param {object} params
 * @param {object} params.referenceGrammar  parsed reference-grammar.json
 * @param {string} params.languageId
 * @param {string} params.languageName
 * @param {string} params.outDir            absolute docs path
 * @param {(tpl: string, vars: Record<string,string>) => string} params.applyTemplate
 * @param {string} params.pageTpl
 * @returns {Promise<{ indexPath: string, pageCount: number }>}
 */
export async function buildReferenceGrammar({ referenceGrammar, languageId, languageName, outDir, applyTemplate, pageTpl }) {
  const ref = referenceGrammar;
  const subdir = join('_language', languageId, 'reference');
  const dir = join(outDir, subdir);
  await mkdir(dir, { recursive: true });

  const { pages, secToPage } = planPages(ref);
  const assetPrefix = '../../../';

  const crumbBase = `<nav class="breadcrumb"><a href="${assetPrefix}index.html">Library</a> › ` +
    `<a href="index.html">${escapeHtml(languageName)} Reference Grammar</a>`;

  // Index page.
  const indexHtml = applyTemplate(pageTpl, {
    title: `${languageName} Reference Grammar`,
    assetPrefix, author: '', date: '', tags: '',
    breadcrumb: `<nav class="breadcrumb"><a href="${assetPrefix}index.html">Library</a> › ${escapeHtml(languageName)} Reference Grammar</nav>`,
    body: renderIndexBody(ref, pages, languageName),
    pagenav: '',
  });
  const indexPath = join(dir, 'index.html');
  await writeFile(indexPath, indexHtml);

  // Section pages with prev/next.
  for (let i = 0; i < pages.length; i++) {
    const page = pages[i];
    const prev = pages[i - 1];
    const next = pages[i + 1];
    const left = prev
      ? `<a class="prev" href="${escapeAttr(prev.slug)}.html"><span class="dir">←</span> <span class="title">${escapeHtml(prev.topical)}</span></a>`
      : '<span class="prev placeholder"></span>';
    const right = next
      ? `<a class="next" href="${escapeAttr(next.slug)}.html"><span class="title">${escapeHtml(next.topical)}</span> <span class="dir">→</span></a>`
      : '<span class="next placeholder"></span>';
    const pagenav = `<nav class="page-nav">${left}${right}</nav>`;

    const html = applyTemplate(pageTpl, {
      title: page.topical,
      assetPrefix, author: '', date: '',
      tags: `<span class="ag-range">${escapeHtml(rangeLabel(page))}</span>`,
      breadcrumb: `${crumbBase} › <span class="here">${escapeHtml(page.part)}: ${escapeHtml(page.topical)}</span></nav>`,
      body: renderPageBody(page, ref, secToPage),
      pagenav,
    });
    await writeFile(join(dir, `${page.slug}.html`), html);
  }

  return { indexPath, pageCount: pages.length };
}

// Convenience for ad-hoc runs: node build-reference-grammar.js
if (import.meta.url === `file://${process.argv[1]}`) {
  const { dirname } = await import('node:path');
  const { fileURLToPath } = await import('node:url');
  const here = dirname(fileURLToPath(import.meta.url));
  const repo = join(here, '..', '..');
  const ref = JSON.parse(await readFile(join(repo, 'content', '_language', 'latin', 'reference-grammar.json'), 'utf8'));
  const pageTpl = await readFile(join(here, 'templates', 'page.html'), 'utf8');
  const applyTemplate = (tpl, vars) => tpl.replace(/\{\{(\w+)\}\}/g, (_, k) => (vars[k] ?? ''));
  const res = await buildReferenceGrammar({
    referenceGrammar: ref, languageId: 'latin', languageName: 'Latin',
    outDir: join(repo, 'docs'), applyTemplate, pageTpl,
  });
  console.log(`reference grammar: ${res.pageCount} pages → ${res.indexPath}`);
}

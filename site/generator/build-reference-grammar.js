// Build the standalone Reference Grammar document from reference-grammar.json,
// emitted under docs/_language/{language}/reference/.
//
// One page per toc chapter (its stored `slug` is the file name, so published
// URLs survive edits to labels and order), plus an index of parts → chapters.
// Each section is an anchored block (id="sec-ID"); group headings come from the
// toc. Cross-refs (<a data-ref="ID">) become same-page fragments or links to
// the page that holds the target. Same data as the in-text popovers
// (build-reference-notes.js). See Plans/latin-text-centered-reader-plan.md (D1).

import { mkdir, writeFile, readFile } from 'node:fs/promises';
import { join } from 'node:path';

import { indexReferenceGrammar, sectionLabel, wrapTables } from './lib/reference-grammar.js';

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
const escapeAttr = escapeHtml;

// Cross-refs → same-page fragment, or a link to the page holding the target.
export function rewriteRefs(html, thisSlug, secToPage) {
  return String(html).replace(/<a data-ref="([^"]+)">/g, (_, id) => {
    const target = secToPage.get(id);
    const href = !target || target === thisSlug ? `#sec-${id}` : `${target}.html#sec-${id}`;
    return `<a class="ag-ref" href="${escapeAttr(href)}">`;
  });
}

// One chapter's body: the group path (toc groups below the chapter) emitted as
// a subhead whenever it changes between consecutive sections, then each
// section as an anchored block.
export function renderChapterBody(chapter, index) {
  const out = [];
  let lastSub = null;
  for (const { id, groups } of chapter.entries) {
    const info = index.sections.get(id);
    if (!info) continue;
    const sub = groups.join(' › ');
    if (sub && sub !== lastSub) {
      out.push(`<h2 class="ag-subhead">${escapeHtml(sub)}</h2>`);
      lastSub = sub;
    }
    const body = wrapTables(rewriteRefs(info.html, chapter.slug, index.secToPage));
    const edited = info.edited ? ' <span class="ag-edited">edited</span>' : '';
    out.push(
      `<section class="ag-section${info.source === 'editorial' ? ' ag-editorial' : ''}" id="sec-${escapeAttr(id)}">` +
      `<h3 class="ag-secnum"><a href="#sec-${escapeAttr(id)}">${escapeHtml(sectionLabel(info))}</a>${edited}</h3>` +
      `${body}</section>`
    );
  }
  return out.join('\n');
}

export function rangeLabel(chapter) {
  const nums = chapter.sectionIds.filter((id) => /^\d+$/.test(id));
  if (!nums.length) return '';
  const first = nums[0], last = nums[nums.length - 1];
  return first === last ? `§ ${first}` : `§§ ${first}–${last}`;
}

// Credit line from sources[], shown on every page (CC BY-SA markup).
export function attributionHtml(ref, index) {
  const lines = (ref.sources || []).map((s) => `<p>${escapeHtml(s.attribution)}</p>`);
  const anyEdited = [...index.sections.values()].some((s) => s.edited || s.source === 'editorial');
  if (anyEdited) lines.push('<p>Sections marked “edited” differ from the source; sections without a § number are this site’s additions.</p>');
  return `<footer class="piece attribution ag-source">${lines.join('')}</footer>`;
}

function renderIndexBody(ref, index, languageName) {
  const src = ref.sources?.[0];
  const partBlocks = index.parts.map((part) => {
    const items = part.chapters.map((c) =>
      `    <li><a href="${escapeAttr(c.slug)}.html">${escapeHtml(c.label)}</a> ` +
      `<span class="ag-range">${escapeHtml(rangeLabel(c))}</span></li>`
    ).join('\n');
    return `  <section class="ag-part">\n    <h2>${escapeHtml(part.label)}</h2>\n    <ul class="ag-toc">\n${items}\n    </ul>\n  </section>`;
  }).join('\n');

  const basis = src ? ` It began as ${escapeHtml(src.title)}, and keeps its section numbering (§), so a citation like “§ 419” links straight here; corrections and additions are this site’s own.` : '';
  return `<div class="reference-grammar-index">
  <p class="ag-lede">A complete reference grammar for the ${escapeHtml(languageName)} texts here.${basis}
  For the compact guide to pronunciation and the terms used by the reader's word popovers, see the <a href="../guide/index.html">${escapeHtml(languageName)} Reader's Guide</a>.</p>
${partBlocks}
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
  const index = indexReferenceGrammar(ref);
  const title = ref.title;
  const dir = join(outDir, '_language', languageId, 'reference');
  await mkdir(dir, { recursive: true });

  const assetPrefix = '../../../';
  const attribution = attributionHtml(ref, index);
  const crumbBase = `<nav class="breadcrumb"><a href="${assetPrefix}index.html">Library</a> › ` +
    `<a href="index.html">${escapeHtml(title)}</a>`;

  // Index page.
  const indexHtml = applyTemplate(pageTpl, {
    title: escapeHtml(title),
    assetPrefix, author: '', date: '', tags: '',
    breadcrumb: `<nav class="breadcrumb"><a href="${assetPrefix}index.html">Library</a> › ${escapeHtml(title)}</nav>`,
    body: renderIndexBody(ref, index, languageName),
    attribution,
    pagenav: '',
  });
  const indexPath = join(dir, 'index.html');
  await writeFile(indexPath, indexHtml);

  // Chapter pages with prev/next.
  const chapters = index.chapters;
  for (let i = 0; i < chapters.length; i++) {
    const ch = chapters[i];
    const prev = chapters[i - 1];
    const next = chapters[i + 1];
    const left = prev
      ? `<a class="prev" href="${escapeAttr(prev.slug)}.html"><span class="dir">←</span> <span class="title">${escapeHtml(prev.label)}</span></a>`
      : '<span class="prev placeholder"></span>';
    const right = next
      ? `<a class="next" href="${escapeAttr(next.slug)}.html"><span class="title">${escapeHtml(next.label)}</span> <span class="dir">→</span></a>`
      : '<span class="next placeholder"></span>';

    const range = rangeLabel(ch);
    const html = applyTemplate(pageTpl, {
      title: escapeHtml(ch.label),
      assetPrefix, author: '', date: '',
      tags: range ? `<span class="ag-range">${escapeHtml(range)}</span>` : '',
      breadcrumb: `${crumbBase} › <span class="here">${escapeHtml(ch.part.label)}: ${escapeHtml(ch.label)}</span></nav>`,
      body: renderChapterBody(ch, index),
      attribution,
      pagenav: `<nav class="page-nav">${left}${right}</nav>`,
    });
    await writeFile(join(dir, `${ch.slug}.html`), html);
  }

  // nav.json — the iOS app opens a library entry ending in /index.html as a
  // book and pages it by nav.json (it hides the in-page breadcrumb and
  // prev/next). Index first, then the chapter pages in reading order.
  const base = `_language/${languageId}/reference/`;
  const library = { title: 'Library', html_path: 'index.html' };
  const navPages = [
    { slug: 'reference', title, html_path: `${base}index.html`, breadcrumbs: [library] },
    ...chapters.map((ch) => ({
      slug: ch.slug,
      title: ch.label,
      html_path: `${base}${ch.slug}.html`,
      breadcrumbs: [library, { title, html_path: `${base}index.html` }],
    })),
  ];
  navPages.forEach((p, i) => {
    const crumb = (q) => (q ? { title: q.title, html_path: q.html_path } : null);
    p.prev = crumb(navPages[i - 1]);
    p.next = crumb(navPages[i + 1]);
  });
  await writeFile(join(dir, 'nav.json'), JSON.stringify({ pages: navPages, uses_latin: false }, null, 2));

  return { indexPath, pageCount: chapters.length };
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

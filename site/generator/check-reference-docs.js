#!/usr/bin/env node
// Check the built Reference Grammar in docs/ (Plans/latin-text-centered-reader-plan.md, A4).
//
// Works on the committed output, so it also runs in CI without a build:
//   - every relative href in the reference pages resolves (file and #anchor);
//   - every href anywhere in docs/ that points into the reference resolves
//     (text pages' ag: fallbacks, the guide's § links);
//   - each section anchor appears on exactly one page;
//   - nav.json lists exactly the pages on disk, in toc order;
//   - the popover asset has the same sections and chapters as the document.
//
//   make reference-check      (or: npm run reference:check)
//
// Exit 1 on any problem.

import { readFile, readdir } from 'node:fs/promises';
import { dirname, join, posix, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const DOCS = join(here, '..', '..', 'docs');
const REF_DIR_REL = '_language/latin/reference';
const REF_DIR = join(DOCS, ...REF_DIR_REL.split('/'));
const NOTES = join(DOCS, 'assets', 'latin-reference-notes.json');

async function walkHtml(dir) {
  const out = [];
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) out.push(...await walkHtml(p));
    else if (e.name.endsWith('.html')) out.push(p);
  }
  return out;
}

const toPosix = (p) => p.split(sep).join('/');
const ids = (html) => new Set([...html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]));
const hrefs = (html) => [...html.matchAll(/\shref="([^"]*)"/g)].map((m) => m[1].replace(/&amp;/g, '&'));

export async function checkReferenceDocs(docsDir = DOCS) {
  const problems = [];
  const files = await walkHtml(docsDir);
  const html = new Map();
  for (const f of files) html.set(toPosix(relative(docsDir, f)), await readFile(f, 'utf8'));
  const anchorsOf = new Map([...html].map(([k, v]) => [k, ids(v)]));

  // 1 + 2. Links: all hrefs inside the reference, plus any href elsewhere that
  // lands in the reference directory.
  for (const [page, src] of html) {
    const inRef = page.startsWith(`${REF_DIR_REL}/`);
    for (const href of hrefs(src)) {
      if (!href || /^[a-z][a-z0-9+.-]*:/i.test(href) || href.startsWith('/')) continue;
      const [pathPart, frag] = href.split('#');
      const target = pathPart ? posix.normalize(posix.join(posix.dirname(page), pathPart)) : page;
      if (!inRef && !target.startsWith(`${REF_DIR_REL}/`)) continue;
      if (!html.has(target)) {
        if (!target.endsWith('.html')) continue;   // non-page assets (css/js) aren't this check's business
        problems.push(`${page}: broken link ${href} (no ${target})`);
      } else if (frag && !anchorsOf.get(target).has(frag)) {
        problems.push(`${page}: broken anchor ${href}`);
      }
    }
  }

  // 3. Each section anchor on exactly one page.
  const secPages = new Map();
  for (const [page, anchors] of anchorsOf) {
    if (!page.startsWith(`${REF_DIR_REL}/`)) continue;
    for (const a of anchors) {
      if (!a.startsWith('sec-')) continue;
      const id = a.slice(4);
      if (secPages.has(id)) problems.push(`section ${id} on both ${secPages.get(id)} and ${page}`);
      else secPages.set(id, page);
    }
  }

  // 4. nav.json ⇄ pages on disk.
  const nav = JSON.parse(await readFile(join(docsDir, ...REF_DIR_REL.split('/'), 'nav.json'), 'utf8'));
  const navPaths = nav.pages.map((p) => p.html_path);
  const disk = [...html.keys()].filter((k) => k.startsWith(`${REF_DIR_REL}/`)).sort();
  if (JSON.stringify([...navPaths].sort()) !== JSON.stringify(disk)) {
    problems.push(`nav.json pages ≠ pages on disk: nav-only [${navPaths.filter((p) => !disk.includes(p))}], disk-only [${disk.filter((p) => !navPaths.includes(p))}]`);
  }

  // 5. Popover asset ⇄ document.
  const doc = JSON.parse(await readFile(join(docsDir, 'assets', 'latin-reference-notes.json'), 'utf8'));
  const noteIds = Object.keys(doc.notes).sort();
  const pageIds = [...secPages.keys()].sort();
  if (JSON.stringify(noteIds) !== JSON.stringify(pageIds)) {
    problems.push(`popover sections ≠ document sections (${noteIds.length} vs ${pageIds.length})`);
  }
  const tocPages = doc.toc.flatMap((p) => p.chapters.map((c) => `${REF_DIR_REL}/${c.slug}.html`));
  if (JSON.stringify(tocPages) !== JSON.stringify(navPaths.slice(1))) {
    problems.push('popover toc chapter order ≠ nav.json page order');
  }
  for (const [id, note] of Object.entries(doc.notes)) {
    const chapter = doc.toc.flatMap((p) => p.chapters).find((c) => c.id === note.chapter);
    if (!chapter || secPages.get(id) !== `${REF_DIR_REL}/${chapter.slug}.html`) {
      problems.push(`section ${id}: popover chapter ${note.chapter} ≠ page ${secPages.get(id)}`);
    }
  }

  return { problems, pages: disk.length, sections: secPages.size };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const { problems, pages, sections } = await checkReferenceDocs();
  if (problems.length) {
    console.error(`[FAIL] reference docs: ${problems.length} problem(s)`);
    for (const p of problems.slice(0, 50)) console.error(`  ✗ ${p}`);
    process.exit(1);
  }
  console.log(`[PASS] reference docs: ${pages} pages, ${sections} sections; links, anchors, nav.json, popover asset consistent`);
}

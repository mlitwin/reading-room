// Rendering tests for the standalone Reference Grammar and its popover
// projection, on a small fixture grammar (Plans/latin-text-centered-reader-plan.md, A3).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, mkdtempSync, readdirSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { buildReferenceGrammar } from '../build-reference-grammar.js';
import { buildReferenceNotes } from '../build-reference-notes.js';
import { indexReferenceGrammar } from '../lib/reference-grammar.js';

const ref = JSON.parse(readFileSync(new URL('./fixtures/reference-grammar.json', import.meta.url), 'utf8'));
const pageTpl = '<title>{{title}}</title>{{breadcrumb}}<main>{{body}}</main>{{attribution}}{{pagenav}}';
const applyTemplate = (tpl, vars) => tpl.replace(/\{\{(\w+)\}\}/g, (_, k) => (vars[k] ?? ''));

async function build() {
  const outDir = mkdtempSync(join(tmpdir(), 'refgram-'));
  await buildReferenceGrammar({ referenceGrammar: ref, languageId: 'latin', languageName: 'Latin', outDir, applyTemplate, pageTpl });
  const dir = join(outDir, '_language', 'latin', 'reference');
  const page = (slug) => readFile(join(dir, `${slug}.html`), 'utf8');
  return { dir, page, nav: JSON.parse(await readFile(join(dir, 'nav.json'), 'utf8')) };
}

test('index derives order, chapters, groups, prev/next, xrefs', () => {
  const ix = indexReferenceGrammar(ref);
  assert.deepEqual(ix.order, ['1', '2', '3', '4', 'rr-ovid-usage', '5']);
  const s3 = ix.sections.get('3');
  assert.equal(s3.chapter.id, 'ch-nouns');
  assert.deepEqual(s3.groups, ['Gender', 'Exceptions']);
  assert.equal(s3.heading, 'Exceptions');
  assert.equal(ix.sections.get('1').heading, 'Nouns');
  assert.equal(ix.sections.get('rr-ovid-usage').heading, 'Verbs in Ovid');
  assert.equal(ix.sections.get('3').next, '4');               // crosses chapters
  assert.equal(ix.sections.get('5').prev, 'rr-ovid-usage');   // crosses parts
  assert.equal(ix.sections.get('1').prev, null);
  assert.deepEqual(ix.sections.get('1').xrefs, ['2', '5']);
});

test('one page per chapter, file named by slug; nav.json follows toc order', async () => {
  const { dir, nav } = await build();
  assert.deepEqual(readdirSync(dir).sort(), ['01-nouns.html', '02-verbs.html', '03-cases.html', 'index.html', 'nav.json']);
  assert.deepEqual(nav.pages.map((p) => p.slug), ['reference', '01-nouns', '02-verbs', '03-cases']);
  assert.equal(nav.pages[2].prev.html_path, '_language/latin/reference/01-nouns.html');
  assert.equal(nav.pages[3].next, null);
  assert.equal(nav.pages[0].title, 'Reference Grammar');
});

test('cross-refs: same-page fragment vs cross-page link', async () => {
  const { page } = await build();
  const nouns = await page('01-nouns');
  assert.match(nouns, /<a class="ag-ref" href="#sec-2">/);
  assert.match(nouns, /<a class="ag-ref" href="03-cases.html#sec-5">/);
  assert.match(await page('03-cases'), /href="02-verbs.html#sec-rr-ovid-usage"/);
  assert.doesNotMatch(nouns, /data-ref=/);
});

test('group subheads, § labels for seeded sections, headings for editorial ones', async () => {
  const { page } = await build();
  const nouns = await page('01-nouns');
  assert.match(nouns, /<h2 class="ag-subhead">Gender<\/h2>/);
  assert.match(nouns, /<h2 class="ag-subhead">Gender › Exceptions<\/h2>/);
  assert.match(nouns, /id="sec-1"><h3 class="ag-secnum"><a href="#sec-1">§ 1<\/a>/);
  assert.match(nouns, /<div class="ag-table-wrap"><table class="ag-table">/);
  const verbs = await page('02-verbs');
  assert.match(verbs, /class="ag-section ag-editorial" id="sec-rr-ovid-usage"><h3 class="ag-secnum"><a href="#sec-rr-ovid-usage">Verbs in Ovid<\/a><\/h3>/);
  assert.match(verbs, /§ 4<\/a> <span class="ag-edited">edited<\/span>/);
});

test('credit footer on every page, from sources[]', async () => {
  const { dir, page } = await build();
  for (const f of readdirSync(dir).filter((f) => f.endsWith('.html'))) {
    const html = await page(f.replace(/\.html$/, ''));
    assert.match(html, /<footer class="piece attribution ag-source"><p>Allen and Greenough \(1903\); Perseus TEI\.<\/p>/, f);
    assert.match(html, /differ from the source/, f);
  }
});

test('parity: popover projection and page body carry the same section content', async () => {
  const { page } = await build();
  const { notes, toc } = buildReferenceNotes(ref);
  // Key order isn't document order (JS lists integer keys first); order lives in toc + prev/next.
  assert.deepEqual(Object.keys(notes).sort(), [...indexReferenceGrammar(ref).order].sort());
  assert.deepEqual(toc.map((p) => p.chapters.map((c) => c.id)), [['ch-nouns', 'ch-verbs'], ['ch-cases']]);
  const strip = (html) => html
    .replace(/<a class="ag-(?:ref|link)" (?:href|data-ag)="[^"]*">/g, '<a>')
    .replace(/<\/?div[^>]*>/g, '');
  for (const [id, note] of Object.entries(notes)) {
    const info = indexReferenceGrammar(ref).sections.get(id);
    const html = await page(info.chapter.slug);
    const m = html.match(new RegExp(`id="sec-${id}"><h3[^>]*>.*?</h3>([\\s\\S]*?)</section>`));
    assert.ok(m, id);
    assert.equal(strip(m[1]), strip(note.html), `§${id}`);
    assert.equal(note.chapter, info.chapter.id);
  }
  assert.equal(notes['rr-ovid-usage'].label, 'Verbs in Ovid');
  assert.equal(notes['3'].label, '§3');
  assert.match(notes['5'].html, /<a class="ag-link" data-ag="rr-ovid-usage">/);
  assert.equal(notes['4'].next, 'rr-ovid-usage');
  assert.doesNotMatch(JSON.stringify(notes), /Open full section/);
});

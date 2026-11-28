import { promises as fs } from 'node:fs';
import fsSync from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import matter from 'gray-matter';
import MarkdownIt from 'markdown-it';
import hljs from 'highlight.js';
import katex from '@vscode/markdown-it-katex';
import { validatePiece, validateNode, validateNotesJson } from './schema.js';
import { buildGlossary } from './build-glossary.js';
import { buildConcordance } from './build-concordance.js';
import { buildGrammarPage } from './build-grammar-page.js';
import { buildReferenceGrammar } from './build-reference-grammar.js';
import { indexReferenceGrammar } from './lib/reference-grammar.js';
import { emitReferenceNotes } from './build-reference-notes.js';
import { renderPronunciationSection } from './build-pronunciation-section.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..', '..');
const CONTENT_DIR = path.join(ROOT, 'content');
const DOCS_DIR = path.join(ROOT, 'docs');
const TEMPLATES_DIR = path.join(__dirname, 'templates');
const READER_DIR = path.resolve(__dirname, '..', 'reader');
const KATEX_DIR = path.join(__dirname, 'node_modules', 'katex', 'dist');
const LANGUAGE_DIR = path.join(CONTENT_DIR, '_language', 'latin');
const CONSOLIDATED_LEXICON = path.join(LANGUAGE_DIR, 'lexicon.json');
const GRAMMAR_JSON = path.join(LANGUAGE_DIR, 'grammar.json');
const REFERENCE_GRAMMAR_JSON = path.join(LANGUAGE_DIR, 'reference-grammar.json');
const PRONUNCIATION_MD = path.join(LANGUAGE_DIR, 'pronunciation.md');
const MACRONS_JSON = path.join(LANGUAGE_DIR, 'macrons.json');

const md = new MarkdownIt({
  // html: true so the Latin-passage book can drop a raw <div class="latin-passage">
  // block straight into its markdown — see renderLatinSpans below. The trust
  // model here is that only the author writes book markdown.
  html: true,
  linkify: true,
  typographer: true,
  highlight: (str, lang) => {
    if (lang && hljs.getLanguage(lang)) {
      try {
        const out = hljs.highlight(str, { language: lang, ignoreIllegals: true }).value;
        return `<pre><code class="hljs language-${escapeAttr(lang)}">${out}</code></pre>`;
      } catch {
        // fall through to plain
      }
    }
    return `<pre><code class="hljs">${md.utils.escapeHtml(str)}</code></pre>`;
  },
});
// Semantic math macros shared by every book. Authoring through these keeps
// typeface conventions (see the tensor book's notation page) in one place.
const KATEX_MACROS = {
  '\\tens': '\\boldsymbol{#1}',          // index-free vector / form / tensor
  '\\Lie': '\\pounds',                   // Lie derivative (MTW)
  '\\Tor': '\\operatorname{Tor}',        // index-free torsion
};
md.use(katex.default ?? katex, { macros: KATEX_MACROS });

// Inter-doc links + `note:` references. Iterates inline tokens and rewrites
// link_open hrefs (and tags note: links via .meta so the renderer rules
// below can emit popover-button HTML instead of <a>). `note:` references
// also accumulate into `state.env.referencedNotes` so the generator knows
// which popover elements to emit on this page.
md.core.ruler.push('rewrite_md_links', state => {
  const env = state.env || {};
  for (const token of state.tokens) {
    if (token.type !== 'inline' || !token.children) continue;
    const children = token.children;
    for (let i = 0; i < children.length; i++) {
      const child = children[i];
      if (child.type !== 'link_open') continue;
      const idx = child.attrIndex('href');
      if (idx < 0) continue;
      const href = child.attrs[idx][1];
      if (!href) continue;

      // note: scheme → mark this link as a note reference. guide:X is the
      // same, keyed guide-X: the Reader's Guide entries (pronunciation, grammar
      // categories) that Latin books carry as in-page notes (guideNotesDict).
      const guideMatch = href.match(/^guide:(.+)$/);
      const noteMatch = guideMatch ? [href, `guide-${guideMatch[1]}`] : href.match(/^note:(.+)$/);
      if (noteMatch) {
        const key = noteMatch[1];
        // During notes-page extraction the dictionary is still being built
        // (we're parsing the very file that defines the notes), so skip the
        // existence check. Body-page renders run with the dict populated and
        // do enforce it. Cross-note references are validated post-extraction.
        if (!env.deferNoteValidation) {
          if (!env.notesDict || !env.notesDict[key]) {
            throw new Error(guideMatch
              ? `${env.filePath ?? '<unknown>'}: undefined guide entry "${guideMatch[1]}" (guide: links work in Latin books; ids: ${GUIDE_IDS_HINT}).`
              : `${env.filePath ?? '<unknown>'}: undefined note "${key}". Add it to the book's notes page.`);
          }
        }
        child.meta = Object.assign({}, child.meta, { noteKey: key });
        // Mark the matching link_close so the renderer emits </button>.
        let depth = 1;
        for (let j = i + 1; j < children.length; j++) {
          if (children[j].type === 'link_open') depth++;
          else if (children[j].type === 'link_close') {
            depth--;
            if (depth === 0) {
              children[j].meta = Object.assign({}, children[j].meta, { noteKey: key });
              break;
            }
          }
        }
        env.referencedNotes ||= new Set();
        env.referencedNotes.add(key);
        continue;
      }

      // Existing inter-doc rewrite: `.md` → `.html`, strip `^\d+-` prefixes.
      if (/^[a-z][a-z0-9+\-.]*:/i.test(href)) continue;
      // A relative link to another source file must resolve: a stale target
      // would otherwise render as a dead link without failing the build.
      const mdTarget = href.match(/^([^?#]+\.md)(?=$|[?#])/);
      if (mdTarget && env.filePath && !mdTarget[1].startsWith('/')) {
        const target = path.resolve(path.dirname(env.filePath), decodeURIComponent(mdTarget[1]));
        if (!fsSync.existsSync(target)) {
          throw new Error(`${env.filePath}: link target "${mdTarget[1]}" does not exist.`);
        }
      }
      const rewritten = href
        .replace(/\.md(?=$|[?#])/, '.html')
        .replace(/(^|\/)\d+-/g, '$1');
      if (rewritten !== href) child.attrs[idx][1] = rewritten;
    }
  }
});

// Override link_open / link_close renderers so note-marked links emit a
// <button popovertarget="note-{key}"> ... </button> instead of <a> ... </a>.
const defaultLinkOpen = md.renderer.rules.link_open
  || ((tokens, idx, options, env, self) => self.renderToken(tokens, idx, options));
const defaultLinkClose = md.renderer.rules.link_close
  || ((tokens, idx, options, env, self) => self.renderToken(tokens, idx, options));

md.renderer.rules.link_open = (tokens, idx, options, env, self) => {
  const t = tokens[idx];
  if (t.meta?.noteKey) {
    return `<button class="note-link" type="button" popovertarget="note-${escapeAttr(t.meta.noteKey)}">`;
  }
  return defaultLinkOpen(tokens, idx, options, env, self);
};
md.renderer.rules.link_close = (tokens, idx, options, env, self) => {
  if (tokens[idx].meta?.noteKey) return '</button>';
  return defaultLinkClose(tokens, idx, options, env, self);
};

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
const escapeAttr = escapeHtml;

// The Reference Grammar's derived index (lib/reference-grammar.js), populated
// in build() when reference-grammar.json is present. Used to resolve `ag:` /
// `ref:` links wherever they appear (piece text, note bodies, guide entries).
let _refIndex = null;

// Rewrite `<a href="ag:N">` / `<a href="ref:ID">` links. `ag:N` cites an A&G
// § number; `ref:ID` is the general form (a § number, an `rr-` section, a
// chapter id `ch-…`, or `contents`). The emitted anchor carries the in-flow
// hook cards.js intercepts — `data-ag` (a section) or `data-ag-toc` (a chapter,
// or "" for the contents) — plus a fallback `href` into the standalone
// Reference Grammar for JS-off. Unknown ids throw, like `note:` refs.
function resolveAgLinks(html, assetPrefix) {
  if (!_refIndex) return html;
  const base = `${assetPrefix}_language/latin/reference/`;
  return html.replace(/href="(ag|ref):([^"]+)"/g, (_, scheme, id) => {
    if (scheme === 'ag' && !/^\d+$/.test(id)) throw new Error(`invalid A&G reference "ag:${id}" (ag: takes a § number; use ref: for other ids)`);
    if (_refIndex.sections.has(id)) {
      return `class="ag-link" data-ag="${escapeAttr(id)}" href="${base}${_refIndex.secToPage.get(id)}.html#sec-${escapeAttr(id)}"`;
    }
    if (scheme === 'ref' && id === 'contents') {
      return `class="ag-link" data-ag-toc="" href="${base}index.html"`;
    }
    const chapter = scheme === 'ref' ? _refIndex.chapterById.get(id) : null;
    if (chapter) return `class="ag-link" data-ag-toc="${escapeAttr(id)}" href="${base}${chapter.slug}.html"`;
    throw new Error(`undefined reference "${scheme}:${id}" (no such section${scheme === 'ref' ? ' or chapter' : ''})`);
  });
}

// Note bodies are rendered once with links relative to the notes page, which
// lives at the book root. When a popover source is injected into a host page
// deeper in the book, those relative hrefs must be shifted up by the host
// page's within-book depth (`prefix` = `../` × depth) so they resolve from the
// host page rather than the notes page. Scheme links (`ag:`, `note:`, `http:`,
// …), in-page anchors, and root-relative hrefs are left untouched — `ag:` links
// are resolved later by resolveAgLinks against the page's assetPrefix, and
// `note:` links have already become popover buttons (no href).
function relocateNoteLinks(htmlStr, prefix) {
  if (!prefix) return htmlStr;
  return htmlStr.replace(/href="([^"]*)"/g, (m, href) => {
    if (!href || /^([a-z][a-z0-9+.\-]*:|#|\/)/i.test(href)) return m;
    return `href="${prefix}${href}"`;
  });
}

function applyTemplate(tpl, vars) {
  return tpl.replace(/\{\{(\w+)\}\}/g, (_, k) => (vars[k] ?? ''));
}

function formatDate(d) {
  if (!d) return '';
  const date = d instanceof Date ? d : new Date(d);
  if (Number.isNaN(date.getTime())) return String(d);
  return date.toISOString().slice(0, 10);
}

async function copyDir(src, dst) {
  await fs.mkdir(dst, { recursive: true });
  for (const entry of await fs.readdir(src, { withFileTypes: true })) {
    const s = path.join(src, entry.name);
    const d = path.join(dst, entry.name);
    if (entry.isDirectory()) await copyDir(s, d);
    else if (entry.isFile()) await fs.copyFile(s, d);
  }
}

const IMAGE_EXT_RE = /\.(svg|png|jpe?g|webp|gif)$/i;

// Walk `content/` and mirror every image file into `docs/`, stripping the
// `^\d+-` ordering prefix from each path segment so URLs match the slugified
// page tree. Markdown files are not handled here.
async function copyContentImages() {
  async function walk(absSrc, dstSegs) {
    for (const entry of await fs.readdir(absSrc, { withFileTypes: true })) {
      if (entry.name.startsWith('_')) continue;
      const absChild = path.join(absSrc, entry.name);
      if (entry.isDirectory()) {
        await walk(absChild, [...dstSegs, deriveSlug(entry.name)]);
      } else if (entry.isFile() && IMAGE_EXT_RE.test(entry.name)) {
        const dstPath = path.join(DOCS_DIR, ...dstSegs, entry.name);
        await fs.mkdir(path.dirname(dstPath), { recursive: true });
        await fs.copyFile(absChild, dstPath);
      }
    }
  }
  await walk(CONTENT_DIR, []);
}

async function readMarkdownFile(filePath) {
  const raw = await fs.readFile(filePath, 'utf8');
  const { data, content } = matter(raw);
  return { data, content };
}

async function fileExists(p) {
  try { await fs.access(p); return true; } catch { return false; }
}

// Strip ^\d+- prefix from a filename or dirname to derive the slug.
function deriveSlug(name) {
  return name.replace(/\.md$/, '').replace(/^\d+-/, '');
}

// Slugify a heading into a stable note key.
function slugifyHeading(s) {
  return s.toLowerCase()
    .normalize('NFKD').replace(/[̀-ͯ]/g, '')   // strip accents
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');
}

// Walk the tokens of the notes page; for each H2, accumulate the tokens that
// follow until the next H2 (or EOF), and render that slice as the note body.
// Returns `{ key → { title, html } }`. Headings collide → build error.
function extractNotes(markdown, absPath, extraKnownSlugs = null) {
  // `deferNoteValidation` tells the link-rewriter to mark note: links but
  // skip the existence check (the dictionary is what we're building). After
  // we have all the headings, we do a single cross-reference validation pass.
  const env = { filePath: absPath, deferNoteValidation: true };
  const tokens = md.parse(markdown, env);
  const notes = {};

  let key = null, title = null, slice = [], sliceRefs = new Set();
  const flush = () => {
    if (!key) return;
    if (notes[key]) {
      throw new Error(`${absPath}: duplicate note key "${key}" (heading "${title}" collides).`);
    }
    notes[key] = {
      title,
      html: md.renderer.render(slice, md.options, env),
      refs: [...sliceRefs],
    };
  };

  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i];
    if (t.type === 'heading_open' && t.tag === 'h2') {
      flush();
      title = tokens[i + 1].content.trim();
      key = slugifyHeading(title);
      slice = [];
      sliceRefs = new Set();
      i += 2;   // skip the inline + heading_close
    } else if (key) {
      slice.push(t);
      // Collect note refs from this token's inline children.
      if (t.type === 'inline' && t.children) {
        for (const c of t.children) {
          if (c.type === 'link_open' && c.meta?.noteKey) {
            sliceRefs.add(c.meta.noteKey);
          }
        }
      }
    }
  }
  flush();

  // Cross-reference validation: every key any note references must exist
  // either in this notes page or in extraKnownSlugs (typically grammar.json).
  for (const [k, n] of Object.entries(notes)) {
    for (const ref of n.refs) {
      if (!notes[ref] && !(extraKnownSlugs && extraKnownSlugs.has(ref))) {
        throw new Error(`${absPath}: note "${k}" references undefined note "${ref}".`);
      }
    }
  }
  return notes;
}

// Convert a grammar.json category value's gloss HTML into a popover-ready
// snippet:  <a href="note:X">…</a>  →  <button popovertarget="note-X">…</button>
// This keeps grammar.json a clean reference document (no UI markup in source)
// while letting the runtime treat the gloss as drop-in note content.
function grammarGlossToHtml(gloss) {
  if (!gloss) return '';
  return gloss.replace(
    /<a\s+href="note:([^"]+)">([\s\S]*?)<\/a>/g,
    (_, slug, label) => `<button class="note-link" type="button" popovertarget="note-${escapeAttr(slug)}">${label}</button>`
  );
}

// Convert grammar.json into notesDict shape:
//   { key → { title, html, refs } }
// keyed by every alias that downstream code might use:
//   - value.id              (e.g. "nom")  — what grammar.json glosses link to
//   - slugify(value.label)  (e.g. "nominative") — what PARSE_TOKEN_MAP + notes.md use
//   - value.noteRef         (optional explicit override)
//
// Aliases all point at the same content. `refs` is derived by scanning the
// gloss for note:X links so transitive-closure picks up grammar↔grammar refs.
// "Allen & Greenough: §N, §M" line for a value/term's agRefs, using the `ag:`
// scheme so resolveAgLinks() can rewrite it per consuming page. Empty when no
// agRefs. Appended to popover note HTML so every grammar popover deep-links to
// the reference grammar.
function agRefsNoteHtml(agRefs) {
  if (!Array.isArray(agRefs) || agRefs.length === 0) return '';
  // Emit the bare `ag:` scheme; resolveAgLinks() adds class + data-ag + href.
  const links = agRefs
    .map((id) => `<a href="ag:${escapeAttr(id)}">§${escapeHtml(id)}</a>`)
    .join(', ');
  return `<p class="grammar-agref">Allen &amp; Greenough: ${links}</p>`;
}

function grammarNotesDict(grammar) {
  if (!grammar || !Array.isArray(grammar.categories)) return {};
  const dict = {};
  const collisions = [];

  function add(key, entry, sourceLabel) {
    if (!key) return;
    if (dict[key] && dict[key]._source !== sourceLabel) {
      collisions.push(`grammar key "${key}" produced by both ${dict[key]._source} and ${sourceLabel}`);
      return;
    }
    if (!dict[key]) dict[key] = entry;
  }

  for (const cat of grammar.categories) {
    for (const val of cat.values) {
      const html = grammarGlossToHtml(val.gloss) + agRefsNoteHtml(val.agRefs);
      const refs = [];
      const linkRe = /<button[^>]+popovertarget="note-([^"]+)"/g;
      let m;
      while ((m = linkRe.exec(html))) refs.push(m[1]);
      const entry = {
        title: val.label,
        html,
        refs,
        _source: `grammar.${cat.id}.${val.id}`,
      };
      add(val.id, entry, entry._source);
      add(slugifyHeading(val.label), entry, entry._source);
      if (val.noteRef) add(val.noteRef, entry, entry._source);
    }
  }

  // Grammar terms (language-general vocabulary, not parse codes) — same dict
  // shape, keyed by term id and label slug.
  for (const term of grammar.terms ?? []) {
    const html = grammarGlossToHtml(term.gloss) + agRefsNoteHtml(term.agRefs);
    const refs = [];
    const linkRe = /<button[^>]+popovertarget="note-([^"]+)"/g;
    let m;
    while ((m = linkRe.exec(html))) refs.push(m[1]);
    const entry = { title: term.label, html, refs, _source: `grammar.term.${term.id}` };
    add(term.id, entry, entry._source);
    add(slugifyHeading(term.label), entry, entry._source);
  }

  if (collisions.length) {
    console.warn(`grammar.json: ${collisions.length} key collision(s):`);
    for (const c of collisions.slice(0, 5)) console.warn(`  ${c}`);
  }
  return dict;
}

// The Reader's Guide as in-page notes for Latin books, so the reader can open
// it from the text without leaving it (Plans/latin-text-centered-reader-plan.md,
// D2/D4). Keys are `guide-<id>`, reached by `guide:<id>` links and from the
// Study hub (`guide-study`):
//   guide-pronunciation   the pronunciation guide
//   guide-grammar         the grammar categories, each → guide-<category id>
//   guide-<category id>   that category's values (→ the grammar-term notes)
//   guide-terms           the general grammar terms
//   guide-notes           this book's editorial notes, as a list
//   guide-study           the hub
const GUIDE_FIXED_IDS = ['study', 'pronunciation', 'grammar', 'terms', 'notes'];
let GUIDE_IDS_HINT = GUIDE_FIXED_IDS.join(', ');

function noteButton(key, label) {
  return `<button class="note-link" type="button" popovertarget="note-${escapeAttr(key)}">${escapeHtml(label)}</button>`;
}

function guideNotesDict({ grammar, pronunciationHtml, editorialNotes, hasReference, referenceTitle }) {
  const dict = {};
  const add = (id, title, html) => {
    const refs = [...html.matchAll(/popovertarget="note-([^"]+)"/g)].map((m) => m[1]);
    dict[`guide-${id}`] = { title, html, refs, _source: `guide.${id}` };
  };
  const categories = grammar?.categories ?? [];
  const terms = grammar?.terms ?? [];
  // The wrapper carries 10-pronunciation.css (table, respelling, IPA fonts).
  if (pronunciationHtml) add('pronunciation', 'Pronunciation', `<div class="pronunciation-guide">${pronunciationHtml}</div>`);
  if (categories.length) {
    const items = categories.map((c) => `<li>${noteButton(`guide-${c.id}`, c.label)}</li>`);
    if (terms.length) items.push(`<li>${noteButton('guide-terms', 'Grammar Terms')}</li>`);
    add('grammar', 'Grammar', `<p>The terms the word popovers use. Tap a category, then a term.</p><ul class="guide-list">${items.join('')}</ul>`);
    for (const c of categories) {
      const vals = c.values.map((v) =>
        `<li>${noteButton(v.id, v.label)}${v.abbrev ? ` <span class="grammar-abbrev">${escapeHtml(v.abbrev)}</span>` : ''}</li>`);
      add(c.id, c.label, `<ul class="guide-list">${vals.join('')}</ul>`);
    }
  }
  if (terms.length) add('terms', 'Grammar Terms', `<ul class="guide-list">${terms.map((t) => `<li>${noteButton(t.id, t.label)}</li>`).join('')}</ul>`);
  const editorial = Object.entries(editorialNotes ?? {});
  if (editorial.length) {
    add('notes', 'Notes', `<ul class="guide-list">${editorial.map(([k, n]) => `<li>${noteButton(k, n.title)}</li>`).join('')}</ul>`);
  }
  const hub = [];
  if (editorial.length) hub.push(`<li>${noteButton('guide-notes', 'Notes')} <span class="study-desc">the commentary on this text</span></li>`);
  if (categories.length) hub.push(`<li>${noteButton('guide-grammar', 'Grammar')} <span class="study-desc">cases, tenses, moods, and other terms</span></li>`);
  if (pronunciationHtml) hub.push(`<li>${noteButton('guide-pronunciation', 'Pronunciation')} <span class="study-desc">Classical and Ecclesiastical</span></li>`);
  if (hasReference) hub.push(`<li><a href="ref:contents">${escapeHtml(referenceTitle)}</a> <span class="study-desc">the full grammar, by section</span></li>`);
  add('study', 'Study', `<ul class="study-list">${hub.join('')}</ul>`);
  GUIDE_IDS_HINT = [...GUIDE_FIXED_IDS, ...categories.map((c) => c.id)].join(', ');
  return dict;
}

// A book may also carry its notes as data: `notes.json` beside its index.md,
// `{ key → { title, html } }` (see NotesJsonSchema). Same notesDict shape as
// extractNotes; `note:` links in the HTML become popover buttons, and every
// such reference must resolve within the file or to extraKnownSlugs.
async function loadJsonNotes(pieceAbsDir, extraKnownSlugs = null) {
  const file = path.join(pieceAbsDir, 'notes.json');
  if (!(await fileExists(file))) return null;
  const data = validateNotesJson(file, JSON.parse(await fs.readFile(file, 'utf8')));
  const notes = {};
  for (const [key, { title, html }] of Object.entries(data)) {
    const refs = [...html.matchAll(/<a\s+href="note:([^"]+)">/g)].map(m => m[1]);
    notes[key] = { title, html: grammarGlossToHtml(html), refs };
  }
  for (const [k, n] of Object.entries(notes)) {
    for (const ref of n.refs) {
      if (!notes[ref] && !(extraKnownSlugs && extraKnownSlugs.has(ref))) {
        throw new Error(`${file}: note "${k}" references undefined note "${ref}".`);
      }
    }
  }
  return notes;
}

// Follow note→note references from a starting set, returning every key
// reachable. Used to decide which popover elements to emit on a page.
function transitiveNoteClosure(directRefs, notesDict) {
  const visited = new Set();
  const queue = [...directRefs];
  while (queue.length > 0) {
    const key = queue.shift();
    if (visited.has(key)) continue;
    visited.add(key);
    const note = notesDict[key];
    if (note?.refs) for (const ref of note.refs) queue.push(ref);
  }
  return visited;
}

// Library-wide Latin lexicon. Lives at `content/_latin-lexicon/<lemma>.json`
// (the leading underscore keeps it out of the book-listing pass). Loaded once
// per build; per-book `vocabulary/` directories overlay on top for the rare
// Ovid-specific gloss-set or similar.
let _sharedLexicon = null;
let _consolidatedLexiconDoc = null;
async function loadSharedLexicon() {
  if (_sharedLexicon !== null) return _sharedLexicon;

  // Prefer the consolidated lexicon (Phase 2 output). Fall back to per-lemma
  // files for backwards compatibility (e.g., partial repo checkouts during
  // editorial work). When the consolidated form is present, it is the source
  // of truth — per-lemma files are no longer read.
  if (await fileExists(CONSOLIDATED_LEXICON)) {
    const raw = await fs.readFile(CONSOLIDATED_LEXICON, 'utf8');
    let doc;
    try {
      doc = JSON.parse(raw);
    } catch (err) {
      throw new Error(`${CONSOLIDATED_LEXICON}: invalid JSON — ${err.message}`);
    }
    const out = {};
    for (const lemma of doc.lemmata) {
      out[lemma.id] = lemma;
    }
    _consolidatedLexiconDoc = doc;
    _sharedLexicon = out;
    return out;
  }

  // Legacy path: read per-lemma files from content/_latin-lexicon/.
  const dir = path.join(CONTENT_DIR, '_latin-lexicon');
  const out = {};
  if (!(await fileExists(dir))) {
    _sharedLexicon = out;
    return out;
  }
  for (const entry of await fs.readdir(dir, { withFileTypes: true })) {
    if (!entry.isFile() || !entry.name.endsWith('.json')) continue;
    const raw = await fs.readFile(path.join(dir, entry.name), 'utf8');
    let card;
    try {
      card = JSON.parse(raw);
    } catch (err) {
      throw new Error(`_latin-lexicon/${entry.name}: invalid JSON — ${err.message}`);
    }
    const key = card.id || entry.name.replace(/\.json$/, '');
    out[key] = card;
  }
  _consolidatedLexiconDoc = { language_id: 'latin', lemmata: Object.values(out) };
  _sharedLexicon = out;
  return out;
}

// Per-piece vocabulary lookup. Returns `{ lemma → cardData }` with the shared
// lexicon as the base and any per-book `vocabulary/*.json` overlaid on top
// (so an Ovid-specific card wins over the shared one). Returns the shared
// lexicon directly when no per-book overrides exist.
async function loadVocabulary(pieceAbsDir) {
  const shared = await loadSharedLexicon();
  const vocabDir = path.join(pieceAbsDir, 'vocabulary');
  if (!(await fileExists(vocabDir))) return shared;
  const out = { ...shared };
  for (const entry of await fs.readdir(vocabDir, { withFileTypes: true })) {
    if (!entry.isFile() || !entry.name.endsWith('.json')) continue;
    const raw = await fs.readFile(path.join(vocabDir, entry.name), 'utf8');
    let card;
    try {
      card = JSON.parse(raw);
    } catch (err) {
      throw new Error(`vocabulary/${entry.name}: invalid JSON — ${err.message}`);
    }
    const key = card.id || entry.name.replace(/\.json$/, '');
    out[key] = card;
  }
  return out;
}

// Card HTML is rendered at runtime by cards.js from assets/lexicon.json.
// All parse-token maps and card-rendering functions live in cards.js.

// Rewrite each `<span data-matches="...">word</span>` inside a
// `.latin-passage` block into a popover-button for the primary lemma.
// `data-matches` syntax is `"lemma1:parse1,parse2;lemma2:parse3"` —
// the primary lemma is the first one listed; remaining lemmas become "also-
// matches" chips inside the popover. The parse list per lemma is every cell
// of that lemma's paradigm the surface form could fill, regardless of which
// reading is "right" in the passage (the card is a study tool, not an
// answer key). All referenced lemmas accumulate into `referenced` so their
// card popovers get emitted on this page.
const LATIN_SPAN_RE = /<span\s+([^>]*?)data-matches="([^"]*)"([^>]*)>([\s\S]*?)<\/span>/g;
function parseMatches(matchesStr) {
  // → [{ lemma, parses: [..] }, ...] in source order
  return matchesStr.split(';').map(chunk => {
    const i = chunk.indexOf(':');
    if (i < 0) return { lemma: chunk.trim(), parses: [] };
    return {
      lemma: chunk.slice(0, i).trim(),
      parses: chunk.slice(i + 1).split(',').map(s => s.trim()).filter(Boolean),
    };
  }).filter(m => m.lemma);
}

// Extract { book, chapter } from a chapter filename ("book1-01.md"). Returns
// null for anything else — body pages without the convention don't get
// data-token-id (the concordance only covers chapter-formatted texts).
const CHAPTER_FILE_RE = /(?:^|\/)book(\d+)-(\w+)\.md$/;
function chapterLocFromPath(filePath) {
  const m = CHAPTER_FILE_RE.exec(filePath || '');
  return m ? { book: m[1], chapter: m[2] } : null;
}

function renderLatinSpans(html, vocabDict, referenced, filePath) {
  if (!vocabDict) return html;
  const loc = chapterLocFromPath(filePath);
  let spanIndex = 0;
  return html.replace(LATIN_SPAN_RE, (full, _pre, matchesStr, _post, inner) => {
    const matches = parseMatches(matchesStr);
    if (matches.length === 0) return full;
    for (const m of matches) {
      if (!vocabDict[m.lemma]) {
        throw new Error(`${filePath}: undefined id "${m.lemma}". Add an entry with id="${m.lemma}" to content/_latin-lexicon/ (shared) or content/<book>/vocabulary/ (override).`);
      }
      referenced.add(m.lemma);
    }
    const primary = matches[0];
    // Carry the default-reading inputs through to the button: Stanza's ✓ and
    // the editorial selection with its provenance (the reader's default-tab
    // precedence is editor > stanza > parser; provenance is never displayed).
    const carry = (name) => {
      const m = (_pre + _post).match(new RegExp(`${name}="([^"]*)"`));
      return m ? ` ${name}="${escapeAttr(m[1])}"` : '';
    };
    const stanzaAttr = carry('data-stanza') + carry('data-selected-lemma') + carry('data-selected-by');
    spanIndex += 1;
    // data-token-id is the concordance handle. Format mirrors build-concordance.js
    // exactly: b{book}-{chapter}-{ordinal:03d}. Only emitted for chapter-formatted
    // files; other pages omit the attribute and lose the concordance feature
    // (currently nothing relies on it at runtime, so absence is harmless).
    const tokenAttr = loc
      ? ` data-token-id="b${loc.book}-${loc.chapter}-${String(spanIndex).padStart(3, '0')}"`
      : '';
    return `<button class="latin-token" type="button" data-lemma="${escapeAttr(primary.lemma)}" data-matches="${escapeAttr(matchesStr)}"${stanzaAttr}${tokenAttr}>${inner}</button>`;
  });
}

// Ordering: numeric-prefix first by number, then non-prefixed by name.
function compareEntries(a, b) {
  const am = a.match(/^(\d+)-/);
  const bm = b.match(/^(\d+)-/);
  if (am && bm) return parseInt(am[1], 10) - parseInt(bm[1], 10);
  if (am && !bm) return -1;
  if (!am && bm) return 1;
  return a.localeCompare(b);
}

// htmlPath rules: kind='leaf' → segs.join('/') + '.html'
//                 kind='node' → segs.join('/') + '/index.html'
function htmlPathFor(node) {
  if (node.kind === 'leaf') return node.pathSegments.join('/') + '.html';
  return node.pathSegments.join('/') + '/index.html';
}

function assetPrefixFor(htmlPath) {
  const slashes = (htmlPath.match(/\//g) || []).length;
  return slashes === 0 ? './' : '../'.repeat(slashes);
}

// Walk content/ and build the in-memory tree. Returns an array of top-level
// pieces (kind='leaf' for single docs, kind='node' for books).
async function loadPieces() {
  const out = [];
  const entries = await fs.readdir(CONTENT_DIR, { withFileTypes: true });
  // `_`-prefixed entries are shared resources (e.g. `_latin-lexicon/`), not books.
  const names = entries.map(e => e.name).filter(n => !n.startsWith('_')).sort(compareEntries);
  for (const name of names) {
    const entry = entries.find(e => e.name === name);
    const abs = path.join(CONTENT_DIR, name);
    if (entry.isFile() && name.endsWith('.md')) {
      const slug = deriveSlug(name);
      const info = await readMarkdownFile(abs);
      validatePiece(abs, info.data);
      out.push({
        kind: 'leaf',
        slug,
        front: info.data,
        content: info.content,
        absPath: abs,
        parent: null,
        children: [],
        pathSegments: [slug],
      });
    } else if (entry.isDirectory()) {
      const idx = path.join(abs, 'index.md');
      if (!(await fileExists(idx))) {
        console.warn(`Skipping ${name}/: no index.md`);
        continue;
      }
      const slug = deriveSlug(name);
      const node = await buildNode(abs, slug, [slug], null, true);
      out.push(node);
    }
  }
  return out;
}

async function buildNode(absDir, slug, pathSegments, parent, isPieceRoot) {
  const idx = path.join(absDir, 'index.md');
  const info = await readMarkdownFile(idx);
  if (isPieceRoot) validatePiece(idx, info.data);
  else validateNode(idx, info.data);

  const node = {
    kind: 'node',
    slug,
    front: info.data,
    content: info.content,
    absPath: idx,
    parent,
    children: [],
    pathSegments,
  };

  const entries = await fs.readdir(absDir, { withFileTypes: true });
  const names = entries
    .map(e => e.name)
    .filter(n => n !== 'index.md')
    .sort(compareEntries);

  for (const name of names) {
    const entry = entries.find(e => e.name === name);
    const childAbs = path.join(absDir, name);
    if (entry.isFile() && name.endsWith('.md')) {
      const cslug = deriveSlug(name);
      const cinfo = await readMarkdownFile(childAbs);
      validateNode(childAbs, cinfo.data);
      node.children.push({
        kind: 'leaf',
        slug: cslug,
        front: cinfo.data,
        content: cinfo.content,
        absPath: childAbs,
        parent: node,
        children: [],
        pathSegments: [...pathSegments, cslug],
      });
    } else if (entry.isDirectory()) {
      const childIdx = path.join(childAbs, 'index.md');
      if (await fileExists(childIdx)) {
        const cslug = deriveSlug(name);
        const child = await buildNode(childAbs, cslug, [...pathSegments, cslug], node, false);
        node.children.push(child);
      }
    }
  }

  // Sibling slug collision check.
  const seen = new Set();
  for (const c of node.children) {
    if (seen.has(c.slug)) {
      throw new Error(`Slug collision in ${absDir}: two children resolve to slug "${c.slug}". Rename one.`);
    }
    seen.add(c.slug);
  }

  return node;
}

function linearize(root) {
  const out = [];
  (function visit(n) { out.push(n); for (const c of n.children) visit(c); })(root);
  return out;
}

function inheritedField(node, field) {
  let cur = node;
  while (cur) {
    if (cur.front[field] != null && cur.front[field] !== '') return cur.front[field];
    cur = cur.parent;
  }
  return null;
}

// Breadcrumbs are docs-root-relative; for HTML rendering we'll convert to
// page-relative. nav.json keeps the docs-root-relative form for iOS.
function breadcrumbsForRootRelative(node) {
  const crumbs = [{ title: 'Library', html_path: 'index.html' }];
  let cur = node.parent;
  const chain = [];
  while (cur) {
    chain.unshift({ title: cur.front.title, html_path: htmlPathFor(cur) });
    cur = cur.parent;
  }
  return crumbs.concat(chain);
}

// Convert a docs-root-relative URL to a path-relative URL from `fromHtmlPath`.
function relativeFrom(fromHtmlPath, toHtmlPath) {
  const fromDir = path.posix.dirname('/' + fromHtmlPath);
  const toAbs = '/' + toHtmlPath;
  const rel = path.posix.relative(fromDir, toAbs);
  return rel || './';
}

function structureFor(node) {
  const base = {
    slug: node.slug,
    title: node.front.title,
    html_path: htmlPathFor(node),
  };
  if (node.children.length > 0) {
    base.items = node.children.map(structureFor);
  }
  return base;
}

function navJsonFor(bookRoot) {
  const lin = linearize(bookRoot);
  return {
    pages: lin.map((n, i) => {
      const prev = lin[i - 1];
      const next = lin[i + 1];
      return {
        slug: n.slug,
        title: n.front.title,
        html_path: htmlPathFor(n),
        breadcrumbs: breadcrumbsForRootRelative(n),
        prev: prev ? { title: prev.front.title, html_path: htmlPathFor(prev) } : null,
        next: next ? { title: next.front.title, html_path: htmlPathFor(next) } : null,
      };
    }),
  };
}

function renderBreadcrumbHtml(node) {
  // Page-relative paths, used in the rendered HTML chrome.
  const here = htmlPathFor(node);
  const crumbs = breadcrumbsForRootRelative(node);
  // The current page is appended as a non-link.
  const parts = crumbs.map(c =>
    `<a href="${escapeAttr(relativeFrom(here, c.html_path))}">${escapeHtml(c.title)}</a>`
  );
  parts.push(`<span class="here">${escapeHtml(node.front.title)}</span>`);
  return parts.join('<span class="sep">›</span>');
}

function renderPrevNextHtml(node, navPages) {
  const entry = navPages.find(p => p.html_path === htmlPathFor(node));
  if (!entry || (!entry.prev && !entry.next)) return '';
  const here = htmlPathFor(node);
  const left = entry.prev
    ? `<a class="prev" href="${escapeAttr(relativeFrom(here, entry.prev.html_path))}"><span class="dir">←</span> <span class="title">${escapeHtml(entry.prev.title)}</span></a>`
    : '<span class="prev placeholder"></span>';
  const right = entry.next
    ? `<a class="next" href="${escapeAttr(relativeFrom(here, entry.next.html_path))}"><span class="title">${escapeHtml(entry.next.title)}</span> <span class="dir">→</span></a>`
    : '<span class="next placeholder"></span>';
  return `<nav class="page-nav">${left}${right}</nav>`;
}

// The single popover host. Persistent chrome — a control row (home, prev/next
// within the current context, close) over a breadcrumb of the steps taken
// (filled by cards.js) — wraps a `.popover-body` whose innerHTML is replaced on
// each navigation. Exported for the guide page, which hosts popovers too.
export function popoverHostHtml() {
  return `<aside id="popover-host" popover>
  <div class="popover-chrome">
    <button class="popover-prev" type="button" disabled aria-label="Previous">‹</button>
    <button class="popover-next" type="button" disabled aria-label="Next">›</button>
    <nav class="popover-crumbs" aria-label="Where you are"></nav>
    <button class="popover-close" type="button" popovertarget="popover-host" popovertargetaction="hide" aria-label="Close">×</button>
  </div>
  <div class="popover-body"></div>
</aside>`;
}

function renderPage(pageTpl, { node, navPages, isStandaloneLeaf, notesDict, isNotesPage, vocabDict, studyPage }) {
  const title = node.front.title;
  const author = inheritedField(node, 'author') ?? '';
  const date = formatDate(inheritedField(node, 'date'));
  const tags = Array.isArray(node.front.tags) ? node.front.tags : [];

  // The render env lets the link-rewriter rule check note keys against the
  // book's dictionary, reject `note:` references on the notes page itself,
  // and accumulate referenced keys for popover emission below.
  const env = {
    filePath: node.absPath,
    notesDict: notesDict || {},
    isNotesPage: !!isNotesPage,
    referencedNotes: new Set(),
  };
  let body = md.render(node.content, env);

  // Latin-passage cards: rewrite `<span data-lemma=...>` to popover buttons,
  // accumulate referenced lemmas, emit one `<aside popover>` per lemma below.
  const referencedLemmas = new Set();
  body = renderLatinSpans(body, vocabDict, referencedLemmas, node.absPath);

  // When the page has Latin spans, cards.js will render card HTML at runtime
  // from assets/lexicon.json. Those cards reference grammar notes via
  // popovertarget="note-{key}" buttons. Pre-include the full notesDict so
  // every grammar term is available in the DOM when a card is rendered.
  // Every page of a Latin book (studyPage) does the same: its Study button
  // opens the hub, from which any guide or grammar note is reachable.
  if ((referencedLemmas.size > 0 || studyPage) && notesDict) {
    for (const key of Object.keys(notesDict)) env.referencedNotes.add(key);
  }

  // Emit hidden note-source asides for all reachable notes (body-text refs
  // plus the grammar notes added above). Note hrefs are authored relative to
  // the notes page (book root); shift them to this host page's depth.
  if (env.referencedNotes.size > 0 && notesDict) {
    const noteHostPath = htmlPathFor(node);
    const notePrefix = '../'.repeat(Math.max(0, (noteHostPath.match(/\//g) || []).length - 1));
    const reachable = transitiveNoteClosure(env.referencedNotes, notesDict);
    const popovers = [...reachable].map(key => {
      const n = notesDict[key];
      if (!n) return '';
      const noteId = `note-${escapeAttr(key)}`;
      return `<aside hidden id="${noteId}" class="note-popover-source" data-label="${escapeAttr(n.title)}">
  <h3 class="note-title">${escapeHtml(n.title)}</h3>
  ${relocateNoteLinks(n.html, notePrefix)}
</aside>`;
    }).filter(Boolean).join('\n');
    if (popovers) body += `\n<div class="note-popovers">\n${popovers}\n</div>`;
  }
  // The single popover host — see popoverHostHtml.
  const havePopovers = referencedLemmas.size > 0 || env.referencedNotes.size > 0;
  if (havePopovers) body += `\n${popoverHostHtml()}`;

  const here = htmlPathFor(node);
  const assetPrefix = assetPrefixFor(here);

  // Resolve `ag:N` deep links (in piece text and emitted note popovers) now
  // that we know this page's assetPrefix.
  body = resolveAgLinks(body, assetPrefix);

  const breadcrumbHtml = `<nav class="breadcrumb">${renderBreadcrumbHtml(node)}</nav>`;
  const studyHtml = studyPage && havePopovers && notesDict?.['guide-study']
    ? '<button class="study-button" type="button" popovertarget="note-guide-study">Study</button>'
    : '';
  const prevNextHtml = isStandaloneLeaf ? '' : renderPrevNextHtml(node, navPages);

  // Attribution footer: the piece's (inherited) credit line plus this page's
  // own source link. Required on every page for CC BY-licensed text.
  const attribution = inheritedField(node, 'attribution');
  const source = node.front.source;
  const attributionParts = [
    attribution ? md.renderInline(attribution, { filePath: node.absPath }) : '',
    source ? `Source: <a href="${escapeAttr(source)}">${escapeHtml(source)}</a>` : '',
  ].filter(Boolean);
  const attributionHtml = attributionParts.length
    ? `<footer class="piece attribution">${attributionParts.map(p => `<p>${p}</p>`).join('')}</footer>`
    : '';

  const tagsHtml = tags.map(t => `<span class="tag">${escapeHtml(t)}</span>`).join('');
  // Pronunciation default for the Latin popovers; the reader's own toggle is
  // remembered per book (scope = the book's slug).
  const latinPronunciation = inheritedField(node, 'latin_pronunciation') ?? 'classical';
  return applyTemplate(pageTpl, {
    latinPronunciation,
    latinPronunciationScope: escapeAttr(node.pathSegments[0]),
    title: escapeHtml(title),
    author: escapeHtml(author),
    date: escapeHtml(date),
    tags: tagsHtml,
    body,
    assetPrefix,
    breadcrumb: breadcrumbHtml,
    study: studyHtml,
    pagenav: prevNextHtml,
    attribution: attributionHtml,
  });
}

function renderLibraryListHtml(entries) {
  return entries.map(e => {
    const tags = e.tags.map(t => `<span class="tag">${escapeHtml(t)}</span>`).join('');
    const meta = [
      e.author ? `<span class="author">${escapeHtml(e.author)}</span>` : '',
      e.date ? `<time>${escapeHtml(e.date)}</time>` : '',
      tags ? `<span class="tags">${tags}</span>` : '',
    ].filter(Boolean).join('');
    return `    <li class="piece">
      <h2><a href="./${escapeAttr(e.html_path)}">${escapeHtml(e.title)}</a></h2>
      <div class="meta">${meta}</div>
      ${e.summary ? `<p class="summary">${escapeHtml(e.summary)}</p>` : ''}
    </li>`;
  }).join('\n');
}

// Collect every per-book vocabulary/ overlay card, keyed by id. These are the
// text-specific lemmas (e.g. Marvell's Hortus vocabulary) that aren't in the
// shared consolidated lexicon; they must reach the runtime lexicon asset so
// their popovers render.
// The runtime lexicon asset (docs/assets/lexicon.json) is a single global
// id→card map — there is no per-book namespace at runtime. Two books that
// define the same id would otherwise collide silently (last-writer-wins,
// filesystem-order-dependent), and a book's card can shadow a shared-lexicon
// card for *every* page. To keep the flat map sound we require overlay ids to
// be globally consistent: an id may be defined by at most one book (unless the
// definitions are byte-identical), and must not shadow a *different* shared
// card. Genuinely shared vocabulary should be promoted into the consolidated
// lexicon rather than duplicated per book.
async function collectVocabularyOverlays(sharedLexicon) {
  const out = {};
  const source = {};   // id → "book/vocabulary/file.json" (for error messages)
  const entries = await fs.readdir(CONTENT_DIR, { withFileTypes: true });
  for (const entry of entries) {
    if (!entry.isDirectory() || entry.name.startsWith('_')) continue;
    const vocabDir = path.join(CONTENT_DIR, entry.name, 'vocabulary');
    if (!(await fileExists(vocabDir))) continue;
    for (const f of await fs.readdir(vocabDir, { withFileTypes: true })) {
      if (!f.isFile() || !f.name.endsWith('.json')) continue;
      const rel = `${entry.name}/vocabulary/${f.name}`;
      const raw = await fs.readFile(path.join(vocabDir, f.name), 'utf8');
      let card;
      try {
        card = JSON.parse(raw);
      } catch (err) {
        throw new Error(`${rel}: invalid JSON — ${err.message}`);
      }
      const id = card.id || f.name.replace(/\.json$/, '');
      if (out[id] && JSON.stringify(out[id]) !== raw && JSON.stringify(out[id]) !== JSON.stringify(card)) {
        throw new Error(`vocabulary id collision: "${id}" is defined differently by ${source[id]} and ${rel}. Overlay ids share one global namespace — rename one or promote the lemma to the shared lexicon.`);
      }
      if (sharedLexicon && sharedLexicon[id] && JSON.stringify(sharedLexicon[id]) !== JSON.stringify(card)) {
        throw new Error(`vocabulary id "${id}" (${rel}) shadows a different shared-lexicon entry. The runtime lexicon is a single flat map, so this override would leak into every book — rename it or edit the shared lexicon instead.`);
      }
      out[id] = card;
      source[id] = rel;
    }
  }
  return out;
}

async function buildLexiconJson() {
  const shared = await loadSharedLexicon();
  const lexicon = { ...shared, ...(await collectVocabularyOverlays(shared)) };
  // The popover pronounces the tapped form, so each runtime card carries the
  // macronized spellings of its attested forms (site/latin/macronize_forms.py).
  // Runtime-only: the returned lexicon stays as authored.
  const macrons = (await fileExists(MACRONS_JSON))
    ? JSON.parse(await fs.readFile(MACRONS_JSON, 'utf8')) : {};
  const runtime = {};
  for (const [id, card] of Object.entries(lexicon)) {
    runtime[id] = macrons[id] ? { ...card, macrons: macrons[id] } : card;
  }
  const json = JSON.stringify(runtime);
  // lexicon.json — consumed by fetch() on the web
  await fs.writeFile(path.join(DOCS_DIR, 'assets', 'lexicon.json'), json + '\n');
  // lexicon.js — consumed by WKWebView via <script src> (fetch blocked on file://)
  await fs.writeFile(
    path.join(DOCS_DIR, 'assets', 'lexicon.js'),
    'window.__readingRoomLexicon=' + json + ';\n'
  );
  return lexicon;
}

// Read grammar.json into a string + parsed form. Optional — sites without
// grammar.json yet (e.g., during incremental migration) skip the grammar emit
// and the data bundle's grammar field becomes null.
async function loadGrammar() {
  if (!(await fileExists(GRAMMAR_JSON))) return null;
  const raw = await fs.readFile(GRAMMAR_JSON, 'utf8');
  return JSON.parse(raw);
}

// Derive and emit the language-scoped glossary (one per language) and all
// per-text concordances. Glossary is built once from the consolidated lexicon
// doc; one concordance is built per piece whose source directory contains
// book{N}-{NN}.md chapter files.
async function buildLanguageArtifacts(pieces, mergedLexiconMap) {
  await loadSharedLexicon(); // populate _consolidatedLexiconDoc
  if (!_consolidatedLexiconDoc) return { glossary: null, concordances: {} };

  // The glossary must cover overlay vocabulary too — marvell tokens resolve
  // against overlay cards at runtime, and the C-invariants cross-check
  // token surfaces against the glossary.
  const glossaryDoc = mergedLexiconMap
    ? { ..._consolidatedLexiconDoc, lemmata: Object.values(mergedLexiconMap) }
    : _consolidatedLexiconDoc;
  const { glossary, stats: glossStats } = buildGlossary(glossaryDoc);

  const concordances = {};
  const concordanceDir = path.join(DOCS_DIR, 'assets', 'concordance');
  await fs.mkdir(concordanceDir, { recursive: true });

  for (const piece of pieces) {
    if (piece.kind !== 'node') continue;
    const sourceDir = path.dirname(piece.absPath);
    // Probe for chapter files matching the convention before invoking the builder.
    const entries = await fs.readdir(sourceDir);
    const hasChapterFiles = entries.some((f) => /^book\d+-\w+\.md$/.test(f));
    if (!hasChapterFiles) continue;

    const { concordance, sourceTokens, stats } = await buildConcordance(piece.slug, sourceDir);
    concordances[piece.slug] = concordance;
    await fs.writeFile(
      path.join(concordanceDir, `${piece.slug}.json`),
      JSON.stringify(concordance) + '\n'
    );
    // Source-tokens manifest for C8/C9 cross-check by validate.js. Not consumed
    // at runtime; lives in the same dir for convenience.
    await fs.writeFile(
      path.join(concordanceDir, `${piece.slug}.source-tokens.json`),
      JSON.stringify(sourceTokens) + '\n'
    );
    console.log(`  concordance/${piece.slug}: ${stats.totalSpans} tokens across ${stats.files} chapters`);
  }

  // Provenance: most glossary surfaces are expanded from paradigm cells and
  // never occur in a text. Mark the ones that do, so consumers can rank real
  // forms above generated ones (and bad generated forms are identifiable as
  // dictionary assertions rather than attestations).
  let attestedCount = 0;
  const attested = new Set();
  for (const concordance of Object.values(concordances)) {
    for (const tok of Object.values(concordance.tokens)) attested.add(tok.surface);
  }
  for (const [word, entry] of Object.entries(glossary.entries)) {
    if (attested.has(word)) {
      entry.attested = true;
      attestedCount += 1;
    }
  }
  await fs.writeFile(
    path.join(DOCS_DIR, 'assets', 'latin-glossary.json'),
    JSON.stringify(glossary) + '\n'
  );
  console.log(`  glossary: ${glossStats.uniqueSurfaceForms} surface forms (${attestedCount} attested in texts), ${glossStats.multiCandidateCount} multi-candidate`);

  return { glossary, concordances };
}

// Combined iOS bundle. WKWebView can't fetch() file:// resources, so the data
// arrives via <script src> setting window.__readingRoomData.
async function emitDataBundle(grammar, glossary, concordances) {
  const bundle = {
    grammar,
    glossary,
    concordances,
  };
  await fs.writeFile(
    path.join(DOCS_DIR, 'assets', 'reading-room-data.js'),
    'window.__readingRoomData=' + JSON.stringify(bundle) + ';\n'
  );
  await fs.writeFile(
    path.join(DOCS_DIR, 'assets', 'reading-room-data.json'),
    JSON.stringify(bundle) + '\n'
  );
}

export async function build() {
  // The lexicon caches are per-build, not per-process: serve.js keeps one
  // process alive across watcher rebuilds, and a stale cached lexicon here
  // silently rebuilds every derived asset (glossary, lexicon.json, data
  // bundle) from pre-edit data.
  _sharedLexicon = null;
  _consolidatedLexiconDoc = null;

  await fs.rm(DOCS_DIR, { recursive: true, force: true });
  await fs.mkdir(path.join(DOCS_DIR, 'assets'), { recursive: true });

  // GitHub Pages runs Jekyll by default, which silently drops files and
  // directories whose names start with "_" — that would 404 the entire
  // `_language/` tree (grammar + reference pages) on the live site. An empty
  // .nojekyll disables Jekyll so every file is served verbatim. The build
  // wipes docs/ each run, so this must be re-emitted here.
  await fs.writeFile(path.join(DOCS_DIR, '.nojekyll'), '');

  for (const entry of await fs.readdir(READER_DIR, { withFileTypes: true })) {
    if (entry.isFile()) {
      await fs.copyFile(path.join(READER_DIR, entry.name), path.join(DOCS_DIR, 'assets', entry.name));
    }
  }
  // reader.css is authored as ordered partials in reader/css/ (numeric prefixes
  // define cascade order) and concatenated into one stylesheet. No bundler — the
  // plain-CSS output works as a single <link> over both http and file:// (the
  // iOS WKWebView), and avoids extra requests.
  const cssDir = path.join(READER_DIR, 'css');
  const cssParts = (await fs.readdir(cssDir)).filter((f) => f.endsWith('.css')).sort();
  const cssOut = (await Promise.all(
    cssParts.map((f) => fs.readFile(path.join(cssDir, f), 'utf8'))
  )).join('');
  await fs.writeFile(path.join(DOCS_DIR, 'assets', 'reader.css'), cssOut);

  const mergedLexiconMap = await buildLexiconJson();

  // grammar.json: emit alongside other web assets so the runtime can fetch().
  // The .js wrapper mirrors lexicon.js — WKWebView blocks fetch() on file://,
  // so a <script src> load with the script setting a window global is the
  // only path that works in the iOS bundle.
  const grammar = await loadGrammar();
  if (grammar) {
    const grammarJson = JSON.stringify(grammar);
    await fs.writeFile(
      path.join(DOCS_DIR, 'assets', 'latin-grammar.json'),
      grammarJson + '\n'
    );
    await fs.writeFile(
      path.join(DOCS_DIR, 'assets', 'latin-grammar.js'),
      'window.__readingRoomGrammar=' + grammarJson + ';\n'
    );
  }

  await fs.copyFile(path.join(KATEX_DIR, 'katex.min.css'), path.join(DOCS_DIR, 'assets', 'katex.min.css'));
  await copyDir(path.join(KATEX_DIR, 'fonts'), path.join(DOCS_DIR, 'assets', 'fonts'));
  // The text face (Charis, SIL) beside KaTeX's: the WOFF2 faces and the OFL
  // licence that must travel with them (see reader/fonts/README.md).
  for (const f of await fs.readdir(path.join(READER_DIR, 'fonts'))) {
    if (f.endsWith('.woff2') || f === 'OFL.txt') {
      await fs.copyFile(path.join(READER_DIR, 'fonts', f), path.join(DOCS_DIR, 'assets', 'fonts', f));
    }
  }

  await copyContentImages();

  const pieces = await loadPieces();

  // Derive the language artifacts (glossary + per-text concordances) after
  // pieces are discovered so we know which texts have chapter-file layouts.
  const { glossary, concordances } = await buildLanguageArtifacts(pieces, mergedLexiconMap);
  await emitDataBundle(grammar, glossary, concordances);

  // Grammar notes — derived from grammar.json once, merged into every piece's
  // notesDict below. Per Decision 4, grammar.json is the source of truth for
  // grammar terms; notes.md remains source of truth for editorial commentary.
  const grammarDict = grammar ? grammarNotesDict(grammar) : {};
  const indexEntries = [];

  const pageTpl = await fs.readFile(path.join(TEMPLATES_DIR, 'page.html'), 'utf8');
  const indexTpl = await fs.readFile(path.join(TEMPLATES_DIR, 'index.html'), 'utf8');

  // Parse the reference grammar first (if present) so `ag:`/`ref:` links —
  // in the guide, piece text, and notes — resolve against it.
  let referenceGrammar = null;
  _refIndex = null;
  if (await fileExists(REFERENCE_GRAMMAR_JSON)) {
    referenceGrammar = JSON.parse(await fs.readFile(REFERENCE_GRAMMAR_JSON, 'utf8'));
    _refIndex = indexReferenceGrammar(referenceGrammar);
  }

  // The Latin Reader's Guide: the parse-code glossary (grammar.json); see
  // build-grammar-page.js. Pronunciation (pronunciation.md) is rendered here for
  // the Latin books' in-page guide entry (guideNotesDict), not for the guide page.
  let pronunciation = null;
  if (grammar) {
    pronunciation = await fileExists(PRONUNCIATION_MD)
      ? await renderPronunciationSection({
        sourcePath: PRONUNCIATION_MD, readerDir: READER_DIR, md, resolveAgLinks, assetPrefix: '../../../',
      })
      : null;
    await buildGrammarPage({
      grammar,
      languageId: 'latin',
      languageName: 'Latin',
      outDir: DOCS_DIR,
      applyTemplate,
      pageTpl,
      resolveAgLinks,
      popoverHost: popoverHostHtml(),
      hasReference: Boolean(referenceGrammar),
    });
    indexEntries.push({
      slug: '_language/latin/guide',
      title: "Latin Reader's Guide",
      author: null,
      date: null,
      tags: ['latin', 'reference'],
      summary: 'A compact reference for the Latin texts here: the cases, tenses, moods, and other terms used by the word popovers.',
      html_path: '_language/latin/guide/index.html',
    });
  }

  // Full reference grammar (Allen & Greenough), rendered into a browsable,
  // deep-linkable multi-page set.
  if (referenceGrammar) {
    const { pageCount } = await buildReferenceGrammar({
      referenceGrammar,
      languageId: 'latin',
      languageName: 'Latin',
      outDir: DOCS_DIR,
      applyTemplate,
      pageTpl,
    });
    console.log(`  reference grammar: ${pageCount} section pages`);

    // Language-level reference-NOTES artifact for the in-flow popover/sheet.
    const { count: refNoteCount } = await emitReferenceNotes({
      referenceGrammar,
      languageId: 'latin',
      docsDir: DOCS_DIR,
    });
    console.log(`  reference notes: ${refNoteCount} popover sections`);
    indexEntries.push({
      slug: '_language/latin/reference',
      title: referenceGrammar.title,
      author: null,
      date: null,
      tags: ['latin', 'reference'],
      summary: 'The full Latin reference grammar — paradigms, syntax, and prosody — after Allen & Greenough’s New Latin Grammar (1903), deep-linkable by § section.',
      html_path: '_language/latin/reference/index.html',
    });
  }

  for (const piece of pieces) {
    const title = piece.front.title;
    const author = piece.front.author ?? '';
    const date = formatDate(piece.front.date);
    const tags = Array.isArray(piece.front.tags) ? piece.front.tags : [];
    const summary = piece.front.summary ?? '';

    if (piece.kind === 'leaf') {
      // Single-doc piece. No nav.json (no internal nav). No notes.
      const html = renderPage(pageTpl, { node: piece, navPages: [], isStandaloneLeaf: true });
      await fs.writeFile(path.join(DOCS_DIR, `${piece.slug}.html`), html);
      indexEntries.push({
        slug: piece.slug, title,
        author: author || null,
        date: date || null,
        tags, summary,
        html_path: `${piece.slug}.html`,
      });
    } else {
      // Folder piece — render every page in the tree, emit nav.json.
      const allPages = linearize(piece);
      const nav = navJsonFor(piece);

      // At most one notes leaf per book.
      const noteLeaves = allPages.filter(n => n.kind === 'leaf' && n.front.notes === true);
      if (noteLeaves.length > 1) {
        throw new Error(`${piece.slug}: multiple leaves marked notes: true (only one notes page per book).`);
      }
      const notesLeaf = noteLeaves[0] || null;
      // Note bodies may also link guide entries (guide:X → guide-X); those exist
      // only in Latin books, which the page render then checks.
      const grammarSlugs = new Set([
        ...Object.keys(grammarDict),
        ...[...GUIDE_FIXED_IDS, ...(grammar?.categories ?? []).map((c) => c.id)].map((id) => `guide-${id}`),
      ]);
      const pageNotes = notesLeaf ? extractNotes(notesLeaf.content, notesLeaf.absPath, grammarSlugs) : null;
      const dataNotes = await loadJsonNotes(path.dirname(piece.absPath), grammarSlugs);
      let editorialNotes = pageNotes || dataNotes;
      if (pageNotes && dataNotes) {
        const dup = Object.keys(dataNotes).filter(k => pageNotes[k]);
        if (dup.length) {
          throw new Error(`${piece.slug}: note key(s) defined in both the notes page and notes.json: ${dup.slice(0, 5).join(', ')}`);
        }
        editorialNotes = { ...pageNotes, ...dataNotes };
      }

      // Merge grammar notes in. Grammar wins on slug collision; warn so the
      // editor can rename the passage note. notesDict ends up non-null whenever
      // grammar.json supplied any entries — even if the piece has no notes.md.
      let notesDict = null;
      if (editorialNotes || Object.keys(grammarDict).length > 0) {
        notesDict = {};
        for (const [k, v] of Object.entries(editorialNotes || {})) notesDict[k] = v;
        const collisions = [];
        for (const [k, v] of Object.entries(grammarDict)) {
          if (notesDict[k] && notesDict[k]._source !== v._source) {
            collisions.push(k);
          }
          notesDict[k] = v;
        }
        if (collisions.length) {
          console.warn(`${piece.slug}: ${collisions.length} note slug(s) overridden by grammar.json: ${collisions.slice(0, 5).join(', ')}${collisions.length > 5 ? '…' : ''}`);
        }
      }

      // Per-piece vocabulary: cards keyed by lemma. Drives the Latin-passage
      // popovers. Optional — books with no vocabulary/ directory get null.
      const vocabDict = await loadVocabulary(path.dirname(piece.absPath));

      // Entry-point audit (Plans/latin-grammar-inline-flow-plan.md, Phase 3):
      // per-text editorial notes that read as language-general grammar
      // definitions (no passage-specific reference — line/section numbers, a
      // date) belong in the shared grammar (grammar.json terms), not in a
      // text's notes.md. Advisory only; scoped to texts that actually use the
      // Latin grammar (i.e., contain Latin-passage spans), since only those are
      // backed by grammar.json. (loadVocabulary returns the shared lexicon for
      // every piece, so it can't be the scoping signal.)
      const usesLatin = piece.front.language === 'latin'
        || allPages.some((n) => /data-matches=|class="latin-passage"/.test(n.content || ''));
      if (editorialNotes && usesLatin) {
        const candidates = [];
        for (const [key, note] of Object.entries(editorialNotes)) {
          const text = String(note.html || '').replace(/<[^>]+>/g, ' ');
          if (!/\d/.test(text)) candidates.push(key); // no line/section ref
        }
        if (candidates.length > 0) {
          console.warn(`${piece.slug}: ${candidates.length} note(s) look language-general (no passage reference) — consider promoting to grammar.json terms: ${candidates.slice(0, 8).join(', ')}${candidates.length > 8 ? '…' : ''}`);
        }
      }

      // Latin books carry the Reader's Guide as in-page notes and get the
      // Study hub on every page.
      if (usesLatin) {
        notesDict = {
          ...(notesDict || {}),
          ...guideNotesDict({
            grammar, pronunciationHtml: pronunciation?.noteBody, editorialNotes,
            hasReference: Boolean(referenceGrammar), referenceTitle: referenceGrammar?.title,
          }),
        };
      }

      for (const node of allPages) {
        const here = htmlPathFor(node);
        const outFile = path.join(DOCS_DIR, ...here.split('/'));
        await fs.mkdir(path.dirname(outFile), { recursive: true });
        const html = renderPage(pageTpl, {
          node,
          navPages: nav.pages,
          isStandaloneLeaf: false,
          notesDict,
          isNotesPage: node === notesLeaf,
          vocabDict,
          studyPage: usesLatin,
        });
        await fs.writeFile(outFile, html);
      }

      // Note content is no longer baked into nav.json: every client (web and
      // iOS) renders notes from the in-page `.note-popover-source` asides via
      // the unified #popover-host. nav.json carries navigation chrome only.

      // Book-level Latin flag — lets iOS gate the 5 MB lexicon injection so it
      // only parses on books that actually have Latin passages (currently Ovid).
      nav.uses_latin = usesLatin;

      // nav.json at docs/<slug>/nav.json
      const navOut = path.join(DOCS_DIR, piece.slug, 'nav.json');
      await fs.writeFile(navOut, JSON.stringify(nav, null, 2));

      indexEntries.push({
        slug: piece.slug, title,
        author: author || null,
        date: date || null,
        tags, summary,
        html_path: htmlPathFor(piece),
        structure: structureFor(piece),
      });
    }
  }

  indexEntries.sort((a, b) => (b.date ?? '').localeCompare(a.date ?? ''));

  await fs.writeFile(
    path.join(DOCS_DIR, 'index.json'),
    JSON.stringify({ generated_at: new Date().toISOString(), pieces: indexEntries }, null, 2)
  );

  const listHtml = renderLibraryListHtml(indexEntries);
  const landingHtml = applyTemplate(indexTpl, { list: listHtml, assetPrefix: './' });
  await fs.writeFile(path.join(DOCS_DIR, 'index.html'), landingHtml);

  // Asset manifest — one entry per file under docs/, with sha256 + size.
  // Consumed by the iOS app's SiteSync to skip unchanged files.
  await emitAssetManifest();

  const pageCount = pieces.reduce((n, p) => n + (p.kind === 'leaf' ? 1 : linearize(p).length), 0);
  console.log(`Built ${pieces.length} piece(s), ${pageCount} page(s) to ${path.relative(ROOT, DOCS_DIR)}`);
}

async function emitAssetManifest() {
  const entries = [];
  async function walk(dir, prefix) {
    for (const e of await fs.readdir(dir, { withFileTypes: true })) {
      const abs = path.join(dir, e.name);
      const rel = prefix ? `${prefix}/${e.name}` : e.name;
      // Don't list the manifest itself — clients hash-check against it.
      if (!prefix && e.name === 'assets.json') continue;
      // Nor dotfiles (.nojekyll): the Pages artifact upload drops hidden
      // files, so they 404 live and a client sync that fetches them fails.
      if (e.name.startsWith('.')) continue;
      if (e.isDirectory()) {
        await walk(abs, rel);
      } else if (e.isFile()) {
        const data = await fs.readFile(abs);
        const sha256 = crypto.createHash('sha256').update(data).digest('hex');
        entries.push({ path: rel, sha256, size: data.length });
      }
    }
  }
  await walk(DOCS_DIR, '');
  entries.sort((a, b) => a.path.localeCompare(b.path));
  await fs.writeFile(
    path.join(DOCS_DIR, 'assets.json'),
    JSON.stringify({ generated_at: new Date().toISOString(), files: entries }, null, 2)
  );
}

if (import.meta.url === `file://${process.argv[1]}`) {
  build().catch(err => {
    console.error(err.message ?? err);
    process.exit(1);
  });
}

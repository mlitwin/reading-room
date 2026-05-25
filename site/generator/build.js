import { promises as fs } from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import matter from 'gray-matter';
import MarkdownIt from 'markdown-it';
import hljs from 'highlight.js';
import katex from '@vscode/markdown-it-katex';
import { validatePiece, validateNode } from './schema.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..', '..');
const CONTENT_DIR = path.join(ROOT, 'content');
const DOCS_DIR = path.join(ROOT, 'docs');
const TEMPLATES_DIR = path.join(__dirname, 'templates');
const READER_DIR = path.resolve(__dirname, '..', 'reader');
const KATEX_DIR = path.join(__dirname, 'node_modules', 'katex', 'dist');

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
md.use(katex.default ?? katex);

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

      // note: scheme → mark this link as a note reference.
      const noteMatch = href.match(/^note:(.+)$/);
      if (noteMatch) {
        const key = noteMatch[1];
        // During notes-page extraction the dictionary is still being built
        // (we're parsing the very file that defines the notes), so skip the
        // existence check. Body-page renders run with the dict populated and
        // do enforce it. Cross-note references are validated post-extraction.
        if (!env.deferNoteValidation) {
          if (!env.notesDict || !env.notesDict[key]) {
            throw new Error(`${env.filePath ?? '<unknown>'}: undefined note "${key}". Add it to the book's notes page.`);
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
function extractNotes(markdown, absPath) {
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

  // Cross-reference validation: every key any note references must exist.
  for (const [k, n] of Object.entries(notes)) {
    for (const ref of n.refs) {
      if (!notes[ref]) {
        throw new Error(`${absPath}: note "${k}" references undefined note "${ref}".`);
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

// Load a piece's vocabulary cards from `<piece-dir>/vocabulary/*.json`.
// Returns `{ lemma → cardData }` or null if the directory does not exist.
// Each card carries `lemma`, `pos`, `head`, `glosses[]`, optional `paradigm`.
async function loadVocabulary(pieceAbsDir) {
  const vocabDir = path.join(pieceAbsDir, 'vocabulary');
  if (!(await fileExists(vocabDir))) return null;
  const out = {};
  for (const entry of await fs.readdir(vocabDir, { withFileTypes: true })) {
    if (!entry.isFile() || !entry.name.endsWith('.json')) continue;
    const lemma = entry.name.replace(/\.json$/, '');
    const raw = await fs.readFile(path.join(vocabDir, entry.name), 'utf8');
    try {
      out[lemma] = JSON.parse(raw);
    } catch (err) {
      throw new Error(`vocabulary/${entry.name}: invalid JSON — ${err.message}`);
    }
  }
  return out;
}

// Compact parse-code primitive → English label + notes-page key. Mirrored in
// site/reader/cards.js — keep them in sync (if they drift, drop the duplicate
// into a shared module). Person+number combos (`1sg`, `2sg`, ...) and
// number+gender combos (`sg.masc`) are handled by tokenToLinks below.
const PARSE_TOKEN_MAP = {
  nom: { label: 'nominative', note: 'nominative' },
  gen: { label: 'genitive', note: 'genitive' },
  dat: { label: 'dative', note: 'dative' },
  acc: { label: 'accusative', note: 'accusative' },
  abl: { label: 'ablative', note: 'ablative' },
  voc: { label: 'vocative', note: 'vocative' },
  sg: { label: 'singular', note: 'singular' },
  pl: { label: 'plural', note: 'plural' },
  masc: { label: 'masculine', note: 'masculine' },
  fem: { label: 'feminine', note: 'feminine' },
  neut: { label: 'neuter', note: 'neuter' },
  pres: { label: 'present', note: 'present' },
  imperf: { label: 'imperfect', note: 'imperfect' },
  perf: { label: 'perfect', note: 'perfect' },
  plup: { label: 'pluperfect', note: 'pluperfect' },
  fut: { label: 'future', note: 'future' },
  ind: { label: 'indicative', note: 'indicative' },
  subj: { label: 'subjunctive', note: 'subjunctive' },
  imp: { label: 'imperative', note: 'imperative' },
  act: { label: 'active', note: 'active' },
  pass: { label: 'passive', note: 'passive' },
  inf: { label: 'infinitive', note: 'infinitive' },
  ppp: { label: 'perfect passive participle', note: 'perfect-passive-participle' },
  sup: { label: 'supine', note: 'supine' },
  prep: { label: 'preposition', note: 'preposition' },
  conj: { label: 'conjunction', note: 'conjunction' },
  enclit: { label: 'enclitic', note: 'enclitic' },
};
const PERSON_MAP = {
  '1': { label: '1st-person', note: '1st-person' },
  '2': { label: '2nd-person', note: '2nd-person' },
  '3': { label: '3rd-person', note: '3rd-person' },
};
const POS_NOTE = {
  noun: 'noun', verb: 'verb', adj: 'adjective', pron: 'pronoun',
  prep: 'preposition', conj: 'conjunction', enclitic: 'enclitic',
};

function tokenToLinks(tok) {
  // Person+number combo (`1sg`, `3pl`, ...) → two links.
  const pn = /^([123])(sg|pl)$/.exec(tok);
  if (pn) {
    return [PERSON_MAP[pn[1]], PARSE_TOKEN_MAP[pn[2]]];
  }
  const m = PARSE_TOKEN_MAP[tok];
  if (m) return [m];
  return [{ label: tok, note: null }];
}

function expandToLinks(code) {
  // Split dotted code → token list → flat list of {label, note}.
  return code.split('.').flatMap(tokenToLinks);
}

function renderLinkedHeader(code) {
  return expandToLinks(code).map(p =>
    p.note
      ? `<button class="note-link" type="button" popovertarget="note-${escapeAttr(p.note)}">${escapeHtml(p.label)}</button>`
      : `<span>${escapeHtml(p.label)}</span>`
  ).join(' ');
}

// Render a vocab card's paradigm into an HTML table. Each cell carries a
// `data-parse` attribute matching the compact code on the calling span so a
// CSS/JS pass can light up the cell when its lemma's popover opens. Row and
// column headers are expanded into linked English so every grammatical term
// is clickable.
function renderParadigm(card) {
  const p = card.paradigm;
  if (!p || !p.rows || !p.cols || !p.cells) return '';
  const header = '<tr><th></th>' + p.cols.map(c => `<th>${renderLinkedHeader(c)}</th>`).join('') + '</tr>';
  const body = p.rows.map(r => {
    const cells = p.cols.map(c => {
      const code = `${r}.${c}`;
      const form = p.cells[code];
      if (form == null) return `<td></td>`;
      return `<td data-parse="${escapeAttr(code)}">${escapeHtml(form)}</td>`;
    }).join('');
    return `<tr><th>${renderLinkedHeader(r)}</th>${cells}</tr>`;
  }).join('');
  const cls = `card-paradigm ${escapeAttr(p.type || card.pos || '')}`.trim();
  return `<table class="${cls}">${header}${body}</table>`;
}

// Render the dictionary headword line. For verbs whose vocab JSON carries
// a `principal_parts` array we replace the static `head` string with linked
// positional slots (first→1sg pres ind act, second→pres act inf, third→1sg
// perf ind act, fourth→supine). For nouns/adjs/etc. we still emit the
// `head` string verbatim — wiring up structured noun/adj heads is later
// work.
const PRINCIPAL_PART_NOTES = [
  'first-principal-part',
  'second-principal-part',
  'third-principal-part',
  'fourth-principal-part',
];
function renderHeadLine(card) {
  if (card.pos === 'verb' && Array.isArray(card.principal_parts) && card.principal_parts.length === 4) {
    const slots = card.principal_parts.map((p, i) =>
      `<button class="note-link" type="button" popovertarget="note-${escapeAttr(PRINCIPAL_PART_NOTES[i])}">${escapeHtml(p)}</button>`
    );
    return `<p class="card-principal">${slots.join(', ')}</p>`;
  }
  return card.head ? `<p class="card-principal">${escapeHtml(card.head)}</p>` : '';
}

function renderPosChip(pos) {
  if (!pos) return '';
  const note = POS_NOTE[pos];
  if (!note) return `<span class="card-pos">${escapeHtml(pos)}</span>`;
  return `<button class="card-pos note-link" type="button" popovertarget="note-${escapeAttr(note)}">${escapeHtml(pos)}</button>`;
}

// Source elements are NOT popovers — they're hidden HTML containers whose
// `innerHTML` is copied into a single page-wide `<aside id="popover-host">`
// (the popover) when a token / chip / note-link is clicked. One DOM node
// hosts every popover; navigating between cards and notes just swaps the
// host's contents, so the popover never shifts position. See cards.js.
function renderCardPopover(lemma, card) {
  const id = `card-${escapeAttr(lemma)}`;
  const head = renderHeadLine(card);
  const pos = renderPosChip(card.pos);
  const paradigm = renderParadigm(card);
  const glosses = Array.isArray(card.glosses) && card.glosses.length
    ? `<ul class="card-glosses">${card.glosses.map(g => `<li>${escapeHtml(g)}</li>`).join('')}</ul>`
    : '';
  const notes = card.notes ? `<p class="card-notes">${escapeHtml(card.notes)}</p>` : '';
  return `<aside hidden id="${id}" class="card-popover-source">
  <header class="card-head">
    <h3 class="card-lemma">${escapeHtml(card.lemma || lemma)} ${pos}</h3>
    ${head}
    <div class="card-other-lemmas" aria-live="polite"></div>
  </header>
  ${paradigm}
  ${glosses}
  ${notes}
  <div class="card-parse" aria-live="polite"></div>
  <button class="card-close" type="button" popovertargetaction="hide" popovertarget="popover-host" aria-label="Close">×</button>
</aside>`;
}

// Rewrite each `<span data-matches="...">word</span>` inside a
// `.latin-passage` block into a popover-button targeting the primary lemma's
// card. `data-matches` syntax is `"lemma1:parse1,parse2;lemma2:parse3"` —
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

function renderLatinSpans(html, vocabDict, referenced, filePath) {
  if (!vocabDict) return html;
  return html.replace(LATIN_SPAN_RE, (full, _pre, matchesStr, _post, inner) => {
    const matches = parseMatches(matchesStr);
    if (matches.length === 0) return full;
    for (const m of matches) {
      if (!vocabDict[m.lemma]) {
        throw new Error(`${filePath}: undefined lemma "${m.lemma}". Add content/<book>/vocabulary/${m.lemma}.json.`);
      }
      referenced.add(m.lemma);
    }
    const primary = matches[0];
    const id = `card-${escapeAttr(primary.lemma)}`;
    return `<button class="latin-token" type="button" popovertarget="${id}" data-matches="${escapeAttr(matchesStr)}">${inner}</button>`;
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
  const names = entries.map(e => e.name).sort(compareEntries);
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

function renderPage(pageTpl, { node, navPages, isStandaloneLeaf, notesDict, isNotesPage, vocabDict }) {
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

  // Emit one <aside popover> per note reachable from this page — transitive
  // closure of direct refs plus any notes those notes link to. Multiple
  // <button> triggers can share a single popover; reachability matters so
  // that popover↔popover navigation has the target popover available.
  if (env.referencedNotes.size > 0 && notesDict) {
    const reachable = transitiveNoteClosure(env.referencedNotes, notesDict);
    const popovers = [...reachable].map(key => {
      const n = notesDict[key];
      if (!n) return '';
      const id = `note-${escapeAttr(key)}`;
      return `<aside id="${id}" popover class="note-popover">
  <h3 class="note-title">${escapeHtml(n.title)}</h3>
  ${n.html}
  <button class="note-close" type="button" popovertarget="${id}" popovertargetaction="hide" aria-label="Close">×</button>
</aside>`;
    }).filter(Boolean).join('\n');
    body += `\n<div class="note-popovers">\n${popovers}\n</div>`;
  }

  // Build card-popover HTML now so we can scan it for note: references and
  // merge them into env.referencedNotes before the note-popover emission
  // step above. Cards link to grammar definitions (cases, persons, supine,
  // principal-part slots, etc.) via popovertarget="note-..." buttons —
  // those references need to round-trip through the same transitive-closure
  // logic that the body-text note: links use.
  let cardsHtml = '';
  if (referencedLemmas.size > 0 && vocabDict) {
    cardsHtml = [...referencedLemmas].sort()
      .map(lemma => renderCardPopover(lemma, vocabDict[lemma]))
      .join('\n');
    for (const match of cardsHtml.matchAll(/popovertarget="note-([^"]+)"/g)) {
      env.referencedNotes.add(match[1]);
    }
  }
  // (Re-run note-popover emission with the augmented referencedNotes set —
  // it was already run above and would have missed card-derived refs.)
  if (env.referencedNotes.size > 0 && notesDict) {
    const reachable = transitiveNoteClosure(env.referencedNotes, notesDict);
    // Replace any earlier note-popovers block; the new closure is a superset.
    body = body.replace(/\n<div class="note-popovers">[\s\S]*?<\/div>\s*$/, '');
    const popovers = [...reachable].map(key => {
      const n = notesDict[key];
      if (!n) {
        throw new Error(`${node.absPath}: undefined note "${key}" referenced from a card popover. Add a ## ${key} section in the notes page.`);
      }
      const noteId = `note-${escapeAttr(key)}`;
      return `<aside hidden id="${noteId}" class="note-popover-source">
  <h3 class="note-title">${escapeHtml(n.title)}</h3>
  ${n.html}
  <button class="note-close" type="button" popovertargetaction="hide" popovertarget="popover-host" aria-label="Close">×</button>
</aside>`;
    }).join('\n');
    body += `\n<div class="note-popovers">\n${popovers}\n</div>`;
  }
  if (cardsHtml) {
    body += `\n<div class="card-popovers">\n${cardsHtml}\n</div>`;
  }
  // The single popover host. JS in cards.js copies source `innerHTML` into
  // here on each click, sets the class to indicate type (.card-popover or
  // .note-popover), and shows the host. Only present when at least one
  // source exists on the page.
  const havePopovers = referencedLemmas.size > 0 || env.referencedNotes.size > 0;
  if (havePopovers) {
    body += `\n<aside id="popover-host" popover class=""></aside>`;
  }

  const here = htmlPathFor(node);
  const assetPrefix = assetPrefixFor(here);

  const breadcrumbHtml = `<nav class="breadcrumb">${renderBreadcrumbHtml(node)}</nav>`;
  const prevNextHtml = isStandaloneLeaf ? '' : renderPrevNextHtml(node, navPages);

  const tagsHtml = tags.map(t => `<span class="tag">${escapeHtml(t)}</span>`).join('');
  return applyTemplate(pageTpl, {
    title: escapeHtml(title),
    author: escapeHtml(author),
    date: escapeHtml(date),
    tags: tagsHtml,
    body,
    assetPrefix,
    breadcrumb: breadcrumbHtml,
    pagenav: prevNextHtml,
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

export async function build() {
  await fs.rm(DOCS_DIR, { recursive: true, force: true });
  await fs.mkdir(path.join(DOCS_DIR, 'assets'), { recursive: true });

  for (const file of await fs.readdir(READER_DIR)) {
    await fs.copyFile(path.join(READER_DIR, file), path.join(DOCS_DIR, 'assets', file));
  }
  await fs.copyFile(path.join(KATEX_DIR, 'katex.min.css'), path.join(DOCS_DIR, 'assets', 'katex.min.css'));
  await copyDir(path.join(KATEX_DIR, 'fonts'), path.join(DOCS_DIR, 'assets', 'fonts'));

  await copyContentImages();

  const pieces = await loadPieces();
  const indexEntries = [];

  const pageTpl = await fs.readFile(path.join(TEMPLATES_DIR, 'page.html'), 'utf8');
  const indexTpl = await fs.readFile(path.join(TEMPLATES_DIR, 'index.html'), 'utf8');

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
      const notesDict = notesLeaf ? extractNotes(notesLeaf.content, notesLeaf.absPath) : null;

      // Per-piece vocabulary: cards keyed by lemma. Drives the Latin-passage
      // popovers. Optional — books with no vocabulary/ directory get null.
      const vocabDict = await loadVocabulary(path.dirname(piece.absPath));

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
        });
        await fs.writeFile(outFile, html);
      }

      // Bake notes into nav.json so iOS (and any other client) gets the
      // dictionary in one fetch alongside the navigation chrome. Strip the
      // internal `refs` field — only used by the generator.
      if (notesDict) {
        nav.notes = {};
        for (const [k, n] of Object.entries(notesDict)) {
          nav.notes[k] = { title: n.title, html: n.html };
        }
        if (notesLeaf) {
          nav.notes_html_path = htmlPathFor(notesLeaf);
        }
      }

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

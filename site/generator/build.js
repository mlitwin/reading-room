import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import matter from 'gray-matter';
import MarkdownIt from 'markdown-it';
import hljs from 'highlight.js';
import katex from '@vscode/markdown-it-katex';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..', '..');
const CONTENT_DIR = path.join(ROOT, 'content');
const DOCS_DIR = path.join(ROOT, 'docs');
const TEMPLATES_DIR = path.join(__dirname, 'templates');
const READER_DIR = path.resolve(__dirname, '..', 'reader');
const KATEX_DIR = path.join(__dirname, 'node_modules', 'katex', 'dist');

const md = new MarkdownIt({
  html: false,
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

async function loadContent() {
  const pieces = [];
  for (const entry of await fs.readdir(CONTENT_DIR, { withFileTypes: true })) {
    if (!entry.isFile() || !entry.name.endsWith('.md')) continue;
    const filePath = path.join(CONTENT_DIR, entry.name);
    const raw = await fs.readFile(filePath, 'utf8');
    const { data, content } = matter(raw);
    pieces.push({
      slug: entry.name.replace(/\.md$/, ''),
      data,
      content,
      rawPath: filePath,
    });
  }
  return pieces;
}

function renderIndexList(entries) {
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

  // copy reader assets
  for (const file of await fs.readdir(READER_DIR)) {
    await fs.copyFile(path.join(READER_DIR, file), path.join(DOCS_DIR, 'assets', file));
  }

  // copy katex css + fonts
  await fs.copyFile(path.join(KATEX_DIR, 'katex.min.css'), path.join(DOCS_DIR, 'assets', 'katex.min.css'));
  await copyDir(path.join(KATEX_DIR, 'fonts'), path.join(DOCS_DIR, 'assets', 'fonts'));

  const pieces = await loadContent();
  const indexEntries = [];

  const pageTpl = await fs.readFile(path.join(TEMPLATES_DIR, 'page.html'), 'utf8');
  const indexTpl = await fs.readFile(path.join(TEMPLATES_DIR, 'index.html'), 'utf8');

  for (const piece of pieces) {
    const body = md.render(piece.content);
    const title = piece.data.title ?? piece.slug;
    const author = piece.data.author ?? '';
    const date = formatDate(piece.data.date);
    const tags = Array.isArray(piece.data.tags) ? piece.data.tags : [];
    const summary = piece.data.summary ?? '';

    const tagsHtml = tags.map(t => `<span class="tag">${escapeHtml(t)}</span>`).join('');
    const rendered = applyTemplate(pageTpl, {
      title: escapeHtml(title),
      author: escapeHtml(author),
      date: escapeHtml(date),
      tags: tagsHtml,
      body,
    });
    await fs.writeFile(path.join(DOCS_DIR, `${piece.slug}.html`), rendered);

    indexEntries.push({
      slug: piece.slug,
      title,
      author: author || null,
      date: date || null,
      tags,
      summary,
      html_path: `${piece.slug}.html`,
    });
  }

  indexEntries.sort((a, b) => (b.date ?? '').localeCompare(a.date ?? ''));

  await fs.writeFile(
    path.join(DOCS_DIR, 'index.json'),
    JSON.stringify({ generated_at: new Date().toISOString(), pieces: indexEntries }, null, 2)
  );

  const listHtml = renderIndexList(indexEntries);
  const indexHtml = applyTemplate(indexTpl, { list: listHtml });
  await fs.writeFile(path.join(DOCS_DIR, 'index.html'), indexHtml);

  console.log(`Built ${indexEntries.length} piece(s) to ${path.relative(ROOT, DOCS_DIR)}`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  build().catch(err => {
    console.error(err);
    process.exit(1);
  });
}

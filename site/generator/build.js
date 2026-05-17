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

// Authors write inter-doc links with .md targets ([Chapter 1](chapter-01.md));
// rewrite to .html at render time. Skip scheme-bearing / absolute URLs.
md.core.ruler.push('rewrite_md_links', state => {
  for (const token of state.tokens) {
    if (token.type !== 'inline' || !token.children) continue;
    for (const child of token.children) {
      if (child.type !== 'link_open') continue;
      const idx = child.attrIndex('href');
      if (idx < 0) continue;
      const href = child.attrs[idx][1];
      if (!href) continue;
      if (/^[a-z][a-z0-9+\-.]*:/i.test(href)) continue;
      const rewritten = href.replace(/\.md(?=$|[?#])/, '.html');
      if (rewritten !== href) child.attrs[idx][1] = rewritten;
    }
  }
});

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

async function readMarkdownFile(filePath) {
  const raw = await fs.readFile(filePath, 'utf8');
  const { data, content } = matter(raw);
  return { data, content, rawPath: filePath };
}

async function loadContent() {
  const pieces = [];
  for (const entry of await fs.readdir(CONTENT_DIR, { withFileTypes: true })) {
    if (entry.isFile() && entry.name.endsWith('.md')) {
      const slug = entry.name.replace(/\.md$/, '');
      const indexInfo = await readMarkdownFile(path.join(CONTENT_DIR, entry.name));
      pieces.push({ slug, kind: 'single', index: indexInfo, chapters: [] });
    } else if (entry.isDirectory()) {
      const dirPath = path.join(CONTENT_DIR, entry.name);
      const dirEntries = await fs.readdir(dirPath, { withFileTypes: true });
      const hasIndex = dirEntries.some(e => e.isFile() && e.name === 'index.md');
      if (!hasIndex) {
        const orphans = dirEntries.filter(e => e.isFile() && e.name.endsWith('.md'));
        if (orphans.length > 0) {
          console.warn(`Skipping ${entry.name}/: no index.md (${orphans.length} stray .md file(s))`);
        }
        continue;
      }
      const indexInfo = await readMarkdownFile(path.join(dirPath, 'index.md'));
      const chapters = [];
      for (const chEntry of dirEntries) {
        if (!chEntry.isFile() || !chEntry.name.endsWith('.md') || chEntry.name === 'index.md') continue;
        const chSlug = chEntry.name.replace(/\.md$/, '');
        const chInfo = await readMarkdownFile(path.join(dirPath, chEntry.name));
        chapters.push({ slug: chSlug, ...chInfo });
      }
      chapters.sort((a, b) => a.slug.localeCompare(b.slug));
      pieces.push({ slug: entry.name, kind: 'folder', index: indexInfo, chapters });
    }
  }
  return pieces;
}

function renderPage(pageTpl, { title, author, date, tags, body, assetPrefix }) {
  const tagsHtml = tags.map(t => `<span class="tag">${escapeHtml(t)}</span>`).join('');
  return applyTemplate(pageTpl, {
    title: escapeHtml(title),
    author: escapeHtml(author),
    date: escapeHtml(date),
    tags: tagsHtml,
    body,
    assetPrefix,
  });
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

  for (const file of await fs.readdir(READER_DIR)) {
    await fs.copyFile(path.join(READER_DIR, file), path.join(DOCS_DIR, 'assets', file));
  }
  await fs.copyFile(path.join(KATEX_DIR, 'katex.min.css'), path.join(DOCS_DIR, 'assets', 'katex.min.css'));
  await copyDir(path.join(KATEX_DIR, 'fonts'), path.join(DOCS_DIR, 'assets', 'fonts'));

  const pieces = await loadContent();
  const indexEntries = [];

  const pageTpl = await fs.readFile(path.join(TEMPLATES_DIR, 'page.html'), 'utf8');
  const indexTpl = await fs.readFile(path.join(TEMPLATES_DIR, 'index.html'), 'utf8');

  for (const piece of pieces) {
    const front = piece.index.data;
    const title = front.title ?? piece.slug;
    const author = front.author ?? '';
    const date = formatDate(front.date);
    const tags = Array.isArray(front.tags) ? front.tags : [];
    const summary = front.summary ?? '';

    if (piece.kind === 'single') {
      const body = md.render(piece.index.content);
      const html = renderPage(pageTpl, { title, author, date, tags, body, assetPrefix: './' });
      await fs.writeFile(path.join(DOCS_DIR, `${piece.slug}.html`), html);
      indexEntries.push({
        slug: piece.slug, title,
        author: author || null,
        date: date || null,
        tags, summary,
        html_path: `${piece.slug}.html`,
      });
    } else {
      const folderDir = path.join(DOCS_DIR, piece.slug);
      await fs.mkdir(folderDir, { recursive: true });

      const indexBody = md.render(piece.index.content);
      const indexHtml = renderPage(pageTpl, {
        title, author, date, tags, body: indexBody, assetPrefix: '../',
      });
      await fs.writeFile(path.join(folderDir, 'index.html'), indexHtml);

      // Chapters inherit author/date from the index when their own front matter
      // doesn't set those — keeps chapters from looking orphaned.
      for (const chapter of piece.chapters) {
        const chTitle = chapter.data.title ?? chapter.slug;
        const chAuthor = chapter.data.author ?? author;
        const chDate = chapter.data.date ? formatDate(chapter.data.date) : date;
        const chTags = Array.isArray(chapter.data.tags) ? chapter.data.tags : [];
        const chBody = md.render(chapter.content);
        const chHtml = renderPage(pageTpl, {
          title: chTitle, author: chAuthor, date: chDate, tags: chTags,
          body: chBody, assetPrefix: '../',
        });
        await fs.writeFile(path.join(folderDir, `${chapter.slug}.html`), chHtml);
      }

      indexEntries.push({
        slug: piece.slug, title,
        author: author || null,
        date: date || null,
        tags, summary,
        html_path: `${piece.slug}/index.html`,
      });
    }
  }

  indexEntries.sort((a, b) => (b.date ?? '').localeCompare(a.date ?? ''));

  await fs.writeFile(
    path.join(DOCS_DIR, 'index.json'),
    JSON.stringify({ generated_at: new Date().toISOString(), pieces: indexEntries }, null, 2)
  );

  const listHtml = renderIndexList(indexEntries);
  const landingHtml = applyTemplate(indexTpl, { list: listHtml, assetPrefix: './' });
  await fs.writeFile(path.join(DOCS_DIR, 'index.html'), landingHtml);

  console.log(`Built ${indexEntries.length} piece(s) to ${path.relative(ROOT, DOCS_DIR)}`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  build().catch(err => {
    console.error(err);
    process.exit(1);
  });
}

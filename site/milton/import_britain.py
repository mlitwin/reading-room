#!/usr/bin/env python3
"""Import Milton's *History of Britain* from the Dartmouth John Milton Reading
Room into content/milton-history-of-britain/.

    python3 site/milton/import_britain.py --fetch      # download, then import
    python3 site/milton/import_britain.py --src DIR    # import a prior download

Source: https://milton.host.dartmouth.edu/reading_room/britain/ (ed. Thomas H.
Luxon, CC BY-ND 3.0 US). The edition follows the 1671 printing. Its markup:

    <span class="mi">            Milton's italics            -> <i>
    <span class="reversem">      roman inside italics        -> <span class="roman">
    <span class="tooltip" title> modernised spelling         -> <span class="inline-gloss" data-gloss>
    <abbr title>                 expanded abbreviation       -> <span class="inline-gloss" data-gloss>
    <a id=K class="annotBtn">    editorial annotation K      -> [phrase](note:K)
    annotation.js                annotList {K: html}         -> notes.json {K: {title, html}}

Licence: CC BY-ND 3.0 US — no adaptations, so the text, glosses and annotations
are reproduced verbatim and only the presentation is converted; every page
carries the required credit (index.md `attribution`, plus a per-page `source`
written here). Output is
deterministic, so re-running over the same download is a no-op. The book's
index.md is hand-written and never touched here.

Page breakdown: the 1671 text has no chapters and very long paragraphs, so
Books I-IV are one page each; Books V-VI are divided in the source by reign
(h3), so each becomes a directory with one page per reign. The manuscript
Digression follows Book III (where Milton's text omits it); L'Estrange's 1681
"Character" closes the book as an appendix.
"""

import argparse
import html
import json
import re
import sys
import urllib.parse
import urllib.request
from html.parser import HTMLParser
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / 'content' / 'milton-history-of-britain'
BASE = 'https://milton.host.dartmouth.edu/reading_room/britain/'

# source file -> (URL relative to BASE, note-key prefix)
SOURCES = {
    'intro': ('intro.shtml', None),
    'text': ('text.shtml', ''),
    'digressionms': ('digressionms/text.shtml', 'dms-'),
    'digressioncharacter': ('digressioncharacter/text.shtml', 'chr-'),
}
NOTE_FILES = {
    'text': 'annotation.js',
    'digressionms': 'digressionms/annotation.js',
    'digressioncharacter': 'digressioncharacter/annotation.js',
}

# Dartmouth pages that exist in this book: absolute URL -> slug (no .md/.html).
LOCAL_PAGES = {
    BASE + 'intro.shtml': 'introduction',
    BASE + 'digressionms/text.shtml': 'digression-ms',
    BASE + 'digressioncharacter/text.shtml': 'character-1681',
}
PAGE_FILES = {   # slug -> file under OUT (markdown links need the real file)
    'introduction': '01-introduction.md',
    'digression-ms': '05-digression-ms.md',
    'character-1681': '09-character-1681.md',
}

TEXT_URL = BASE + 'text.shtml'

ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI']


# ── a minimal DOM ────────────────────────────────────────────────────────────

VOID = {'br', 'img', 'meta', 'link', 'hr', 'input', 'wbr'}
CLOSES_P = {'p', 'div', 'blockquote', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'table'}


class Node:
    def __init__(self, tag, attrs=None, parent=None):
        self.tag, self.attrs, self.parent, self.children = tag, dict(attrs or {}), parent, []

    def classes(self):
        return (self.attrs.get('class') or '').split()

    def find(self, pred):
        if pred(self):
            return self
        for c in self.children:
            if isinstance(c, Node):
                hit = c.find(pred)
                if hit:
                    return hit
        return None

    def text(self):
        return ''.join(c if isinstance(c, str) else c.text() for c in self.children)


class TreeBuilder(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.root = Node('#root')
        self.cur = self.root

    def handle_starttag(self, tag, attrs):
        if tag in CLOSES_P:
            # HTML: a block start implicitly closes an open <p>.
            n = self.cur
            while n is not self.root and n.tag not in ('div', 'td'):
                if n.tag == 'p':
                    self.cur = n.parent
                    break
                n = n.parent
        node = Node(tag, attrs, self.cur)
        self.cur.children.append(node)
        if tag not in VOID:
            self.cur = node

    def handle_startendtag(self, tag, attrs):
        self.cur.children.append(Node(tag, attrs, self.cur))

    def handle_endtag(self, tag):
        n = self.cur
        while n is not self.root and n.tag != tag:
            n = n.parent
        if n is not self.root:   # stray end tags are ignored
            self.cur = n.parent

    def handle_data(self, data):
        self.cur.children.append(data)


def parse_html(s):
    b = TreeBuilder()
    b.feed(s)
    b.close()
    return b.root


# ── inline rendering (HTML node -> markdown with inline HTML) ────────────────

MD_SPECIAL = re.compile(r'([\\`*_\[\]~])')


def esc_text(s):
    s = html.escape(s, quote=False)
    return MD_SPECIAL.sub(r'\\\1', s)


def esc_attr(s):
    return html.escape(s, quote=True)


def squash(s):
    return re.sub(r'\s+', ' ', s)


class Ctx:
    def __init__(self, page_url, note_prefix, notes, warn):
        self.page_url, self.note_prefix, self.notes, self.warn = page_url, note_prefix, notes, warn
        self.in_link = False
        self.refs = set()


def resolve_href(href, page_url):
    """Absolute URL, or a book-local slug for pages imported here."""
    url = urllib.parse.urljoin(page_url, href)
    no_frag = url.split('#')[0]
    if no_frag in LOCAL_PAGES:
        return None, LOCAL_PAGES[no_frag]
    return url, None


def gloss(inner, value):
    if not inner.strip():
        return inner
    return f'<span class="inline-gloss" data-gloss="{esc_attr(squash(value).strip())}">{inner}</span>'


def wrap_link(inner, target):
    """Markdown link, keeping edge whitespace outside the brackets."""
    m = re.match(r'^(\s*)(.*?)(\s*)$', inner, re.S)
    lead, body, trail = m.groups()
    if not body:
        return inner
    return f'{lead}[{body}]({target}){trail}'


def inline(node, ctx):
    if isinstance(node, str):
        return esc_text(squash(node))
    tag, cls = node.tag, node.classes()
    kids = lambda: ''.join(inline(c, ctx) for c in node.children)

    if tag == 'br':
        return '<br>'
    if tag in ('script', 'style', 'img'):
        return ''
    if tag == 'a':
        if 'annotBtn' in cls and node.attrs.get('id'):
            key = ctx.note_prefix + node.attrs['id']
            if ctx.in_link:
                return kids()
            if key not in ctx.notes:
                ctx.warn(f'annotation {key!r} has no note body; left as plain text')
                return kids()
            ctx.in_link = True
            inner = kids()
            ctx.in_link = False
            ctx.refs.add(key)
            return wrap_link(inner, f'note:{key}')
        href = node.attrs.get('href')
        if href and not ctx.in_link:
            url, local = resolve_href(href, ctx.page_url)
            ctx.in_link = True
            inner = kids()
            ctx.in_link = False
            return wrap_link(inner, PAGE_FILES[local] if local else url)
        return kids()
    if tag == 'span':
        if 'mi' in cls:
            return f'<i>{kids()}</i>'
        if 'reversem' in cls:
            return f'<span class="roman">{kids()}</span>'
        if 'booktitle' in cls:
            return f'<cite>{kids()}</cite>'
        title = node.attrs.get('title')
        if title:
            # The source sometimes doubles a tooltip on the same word.
            only = [c for c in node.children if not (isinstance(c, str) and not c.strip())]
            if len(only) == 1 and isinstance(only[0], Node) and only[0].attrs.get('title') == title:
                return inline(only[0], ctx)
            return gloss(kids(), title)
        # A few spans carry an unexplained class and no title (e.g. "furder"
        # as class="further"); the source shows no gloss, so neither do we —
        # the licence (CC BY-ND) rules out supplying our own.
        return kids()
    if tag == 'abbr' and node.attrs.get('title'):
        return gloss(kids(), node.attrs['title'])
    if tag in ('i', 'em'):
        return f'<i>{kids()}</i>'
    if tag in ('b', 'strong'):
        return f'<b>{kids()}</b>'
    if tag in ('p', 'blockquote', 'div', 'h2', 'h3'):
        ctx.warn(f'block <{tag}> inside inline content; flattened: {squash(node.text())[:60]!r}')
    return kids()


def finish_line(s):
    s = squash(s).strip()
    s = re.sub(r'\s*<br>\s*', '<br>', s)
    # A paragraph must not open as a markdown block construct.
    s = re.sub(r'^([#>+=|-])', r'\\\1', s)
    s = re.sub(r'^(\d+)([.)])', r'\1\\\2', s)
    return s


# ── block rendering ─────────────────────────────────────────────────────────

class Blocks:
    """Flatten a content subtree into ('heading', level, md) / ('para', md) /
    ('verse', [lines]) items."""

    def __init__(self, ctx):
        self.ctx, self.items, self.buf = ctx, [], []

    def flush(self):
        line = finish_line(''.join(self.buf))
        self.buf = []
        if line and line != '<br>':
            self.items.append(('para', line))

    def walk(self, node):
        if isinstance(node, str):
            self.buf.append(inline(node, self.ctx))
            return
        tag, cls = node.tag, node.classes()
        if tag in ('script', 'style') or node.attrs.get('id') == 'annotation':
            return
        if tag in ('h2', 'h3'):
            self.flush()
            level = 2 if 'msubhead' in cls else 3
            md = finish_line(''.join(inline(c, self.ctx) for c in node.children))
            md = md.replace('<br>', ' <br> ')
            if md:
                self.items.append(('heading', level, md.strip(), tag))
            return
        if tag == 'p' and 'poemTitle' in cls:
            return   # the page title, supplied by front matter
        if tag == 'blockquote':
            self.flush()
            lines = re.split(r'<br>', squash(''.join(inline(c, self.ctx) for c in node.children)))
            lines = [finish_line(l) for l in lines]
            self.items.append(('verse', [l for l in lines if l]))
            return
        if tag in ('p', 'div'):
            self.flush()
            for c in node.children:
                self.walk(c)
            self.flush()
            return
        self.buf.append(inline(node, self.ctx))


def render_items(items):
    out, i = [], 0
    while i < len(items):
        if items[i][0] == 'heading':
            # A run of headings is a title-page block, kept centred as printed.
            run = []
            while i < len(items) and items[i][0] == 'heading':
                run.append(('#' * items[i][1]) + ' ' + items[i][2])
                i += 1
            out.append('<div class="title-page">\n\n' + '\n\n'.join(run) + '\n\n</div>')
            continue
        kind = items[i][0]
        if kind == 'para':
            out.append(items[i][1])
        elif kind == 'verse':
            out.append('<div class="verse">\n\n' + ' \\\n'.join(items[i][1]) + '\n\n</div>')
        i += 1
    return '\n\n'.join(out) + '\n'


# ── notes ───────────────────────────────────────────────────────────────────

def parse_annotation_js(js):
    """annotation.js is `var annotList = {...};` — a JS object literal that is
    JSON apart from JS-only escapes (\\' etc.) and raw newlines. Parsed as data,
    never executed."""
    body = js[js.index('{'):js.rindex('}') + 1]
    body = re.sub(r'\\([^"\\/bfnrtu])', r'\1', body)
    return json.loads(body, strict=False)


def note_html(node, page_url):
    """Sanitise a note body to a small allowlist (a, i, em, b, cite, br)."""
    if isinstance(node, str):
        return html.escape(squash(node), quote=False)
    tag, cls = node.tag, node.classes()
    kids = ''.join(note_html(c, page_url) for c in node.children)
    if tag in ('i', 'em', 'b', 'strong', 'br'):
        t = {'em': 'i', 'strong': 'b'}.get(tag, tag)
        return '<br>' if t == 'br' else f'<{t}>{kids}</{t}>'
    if tag == 'span' and 'booktitle' in cls:
        return f'<cite>{kids}</cite>'
    if tag == 'span' and 'reversem' in cls:
        return f'<span class="roman">{kids}</span>'
    if tag == 'a' and node.attrs.get('href'):
        url, local = resolve_href(node.attrs['href'], page_url)
        if local:   # relative to the book root; the build relocates per page
            return f'<a href="{local}.html">{kids}</a>'
        if url.startswith(('http://', 'https://')):
            return f'<a href="{esc_attr(url)}" target="_blank" rel="noopener">{kids}</a>'
        return kids
    return kids


def build_note(key, raw, page_url):
    tree = parse_html(raw)
    ann = tree.find(lambda n: n.tag == 'span' and 'annotation' in n.classes()) or tree
    # The annotation opens with the lemma in italics: <i>should allege.</i>
    title, rest = None, list(ann.children)
    while rest and isinstance(rest[0], str) and not rest[0].strip():
        rest.pop(0)
    if rest and isinstance(rest[0], Node) and rest[0].tag in ('i', 'em'):
        title = squash(rest.pop(0).text()).strip().rstrip('.').strip()
    body = ''.join(note_html(c, page_url) for c in rest).strip()
    return {'title': title or key, 'html': f'<p>{body}</p>'}


# ── pages ───────────────────────────────────────────────────────────────────

def content_div(tree):
    return tree.find(lambda n: n.attrs.get('id') == 'content')


def is_book_heading(item):
    return item[0] == 'heading' and re.search(r'\bBOOK\b|\bBook\.', item[2])


def plain(md):
    s = re.sub(r'<[^>]+>', '', md)
    s = re.sub(r'\[([^\]]*)\]\([^)]*\)', r'\1', s)
    s = s.replace('\\', '')
    return html.unescape(squash(s)).strip().rstrip('.').strip()


def slugify(s):
    return re.sub(r'[^a-z0-9]+', '-', s.lower()).strip('-')


def front(title, **extra):
    lines = ['---', f'title: {json.dumps(title, ensure_ascii=False)}']
    for k, v in extra.items():
        lines.append(f'{k}: {json.dumps(v, ensure_ascii=False)}')
    return '\n'.join(lines) + '\n---\n\n'


def split_books(items):
    """Group the main text into books; a book's leading heading run (including
    the general title block before Book I) stays with it."""
    books, pending = [], []
    for it in items:
        if is_book_heading(it):
            books.append(pending + [it])
            pending = []
        elif books:
            books[-1].append(it)
        else:
            pending.append(it)
    return books


def split_reigns(items):
    """Book V/VI: the preamble (book heading + any text) then one section per
    h3 reign heading."""
    pre, reigns = [], []
    for it in items:
        if it[0] == 'heading' and it[3] == 'h3':
            reigns.append([it])
        elif reigns:
            reigns[-1].append(it)
        else:
            pre.append(it)
    return pre, reigns


def write(path, text, written):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(text, encoding='utf-8')
    written.append(path)


def main():
    ap = argparse.ArgumentParser(description=__doc__.split('\n\n')[0])
    ap.add_argument('--src', default=str(ROOT / '.tmp' / 'milton-britain'),
                    help='directory holding the downloaded source (default .tmp/milton-britain)')
    ap.add_argument('--fetch', action='store_true', help='download the source into --src first')
    args = ap.parse_args()
    src = Path(args.src)

    files = {k: v[0] for k, v in SOURCES.items()}
    files.update({f'{k}-notes': v for k, v in NOTE_FILES.items()})
    if args.fetch:
        for rel in files.values():
            dest = src / rel
            dest.parent.mkdir(parents=True, exist_ok=True)
            print(f'fetch {BASE}{rel}', file=sys.stderr)
            with urllib.request.urlopen(BASE + rel) as r:
                dest.write_bytes(r.read())

    warnings = []
    warn = lambda m: warnings.append(m)

    # Notes first: the text renderer checks every annotation reference.
    notes = {}
    for name, rel in NOTE_FILES.items():
        prefix = SOURCES[name][1]
        page_url = BASE + SOURCES[name][0]
        raw = parse_annotation_js((src / rel).read_text(encoding='utf-8'))
        for k, v in raw.items():
            notes[prefix + k] = build_note(prefix + k, v, page_url)

    def blocks(name):
        rel, prefix = SOURCES[name]
        ctx = Ctx(BASE + rel, prefix or '', notes, warn)
        b = Blocks(ctx)
        b.walk(content_div(parse_html((src / rel).read_text(encoding='utf-8'))))
        b.flush()
        return b.items, ctx.refs

    written, refs = [], set()

    items, _ = blocks('intro')
    write(OUT / PAGE_FILES['introduction'],
          front('Introduction', author='Thomas H. Luxon', source=BASE + 'intro.shtml') + render_items(items), written)

    items, r = blocks('text')
    refs |= r
    books = split_books(items)
    assert len(books) == 6, f'expected 6 books, found {len(books)}'
    layout = {0: '02-book-1.md', 1: '03-book-2.md', 2: '04-book-3.md', 3: '06-book-4.md',
              4: '07-book-5', 5: '08-book-6'}
    for i, book in enumerate(books):
        title = f'Book {ROMAN[i]}'
        target = layout[i]
        if target.endswith('.md'):
            write(OUT / target, front(title, source=TEXT_URL) + render_items(book), written)
            continue
        pre, reigns = split_reigns(book)
        seen, toc = {}, []
        for n, reign in enumerate(reigns, 1):
            rtitle = plain(reign[0][2])
            slug = slugify(rtitle)
            assert slug not in seen, f'{title}: duplicate reign slug {slug}'
            seen[slug] = True
            fname = f'{n:02d}-{slug}.md'
            toc.append(f'{n}. [{rtitle}]({fname})')
            write(OUT / target / fname, front(rtitle, source=TEXT_URL) + render_items(reign), written)
        write(OUT / target / 'index.md',
              front(title, source=TEXT_URL) + render_items(pre) + '\n## Reigns\n\n' + '\n'.join(toc) + '\n', written)

    items, r = blocks('digressionms')
    refs |= r
    write(OUT / PAGE_FILES['digression-ms'],
          front('The Digression (Manuscript)', source=BASE + SOURCES['digressionms'][0]) + render_items(items), written)

    items, r = blocks('digressioncharacter')
    refs |= r
    write(OUT / PAGE_FILES['character-1681'],
          front("The Character of the Long Parliament (1681)", source=BASE + SOURCES['digressioncharacter'][0]) + render_items(items), written)

    # Only notes the text actually reaches; a few source entries are orphans.
    used = {k: notes[k] for k in sorted(notes) if k in refs}
    write(OUT / 'notes.json', json.dumps(used, ensure_ascii=False, indent=1) + '\n', written)

    for p in written:
        print(p.relative_to(ROOT))
    print(f'{len(used)} notes ({len(notes) - len(used)} unreferenced dropped)', file=sys.stderr)
    for w in sorted(set(warnings)):
        print(f'warning: {w}', file=sys.stderr)


if __name__ == '__main__':
    main()

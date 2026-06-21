#!/usr/bin/env python3
"""
ingest_ag.py — Allen & Greenough TEI XML → structured reference-grammar.json.

Reads the vendored Perseus TEI edition of Allen and Greenough's New Latin
Grammar (1903) at site/latin/sources/viaf39744457.001.perseus-eng1.xml and
emits content/_language/latin/reference-grammar.json.

A "section" is the canonical A&G numbered section (§ N), marked in the source by
`<milestone unit="smythp" n="N"/>`. Each section's content runs in document
order from its milestone up to the next milestone, regardless of the enclosing
<div> boundaries; the surrounding div <head>s give the breadcrumb path.

Output shape (see Plans/latin-reference-grammar-plan.md):

    {
      "language_id": "latin",
      "source": { title, edition, license, attribution, retrieved_at },
      "parts":   [ { "id": "...", "label": "...", "sections": ["1","2",...] } ],
      "sections": {
        "419": {
          "id": "419",
          "path": ["PART SECOND — SYNTAX", "Cases", "Ablative", "..."],
          "heading": "...",            # innermost path element (or null)
          "html": "<p>...</p>",        # rendered body; <ref> → <a href=#sec-N>
          "xrefs": ["398","420"],      # smythp targets referenced from here
          "source_page": 253           # <pb n=> in effect, for citation
        }, ...
      }
    }

Run once; re-run after re-vendoring the source. Idempotent.
"""
import json
import re
from datetime import date
from pathlib import Path
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parent
SRC = ROOT / 'sources' / 'viaf39744457.001.perseus-eng1.xml'
OUT = ROOT.parent.parent / 'content' / '_language' / 'latin' / 'reference-grammar.json'
NS = {'t': 'http://www.tei-c.org/ns/1.0'}

SOURCE_META = {
    'title': "Allen and Greenough's New Latin Grammar for Schools and Colleges",
    'edition': 'J. B. Greenough et al., Boston: Ginn & Company, 1903',
    'license': 'Public-domain text; Perseus TEI markup CC BY-SA',
    'attribution': (
        'Allen and Greenough, New Latin Grammar (Ginn & Co., 1903). '
        'TEI XML: Perseus Digital Library, Tufts University (CC BY-SA), '
        'with corrections by Dickinson College Commentaries, 2013-2016.'
    ),
    'source_file': SRC.name,
    'retrieved_at': '2026-06-20',
}


def local(tag):
    return tag.split('}', 1)[-1]


def esc(s):
    return (s.replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;'))


def norm_ws(s):
    return re.sub(r'\s+', ' ', s)


class Renderer:
    """Render a TEI element subtree to HTML, collecting <ref> targets."""

    def __init__(self):
        self.xrefs = []

    def inner(self, elem):
        parts = []
        if elem.text:
            parts.append(esc(elem.text))
        for c in elem:
            parts.append(self.render(c))
            if c.tail:
                parts.append(esc(c.tail))
        return ''.join(parts)

    def render(self, elem):
        tag = local(elem.tag)

        if tag in ('pb', 'lb', 'cb', 'milestone', 'head', 'gap'):
            return ''  # structural / handled elsewhere

        if tag == 'p':
            return f'<p>{norm_ws(self.inner(elem)).strip()}</p>'

        if tag == 'emph':
            rend = elem.get('rend') or ''
            cls = ' class="lang-la"' if rend == 'ital' else ''
            # A&G uses <emph> for Latin forms and for emphasis; mark Latin-ish
            return f'<em{cls}>{self.inner(elem)}</em>'

        if tag == 'foreign':
            lang = elem.get('{http://www.w3.org/XML/1998/namespace}lang') or ''
            cls = 'lang-la' if lang == 'la' else 'lang-foreign'
            return f'<span class="{cls}">{self.inner(elem)}</span>'

        if tag == 'gloss':
            return f'<span class="gloss">{self.inner(elem)}</span>'

        if tag in ('quote', 'cit', 'q'):
            return f'<span class="quote">{self.inner(elem)}</span>'

        if tag == 'ref':
            n = (elem.get('n') or '').strip()
            txt = self.inner(elem) or esc(n)
            if n.isdigit():
                self.xrefs.append(n)
                return f'<a class="ag-ref" href="#sec-{n}">{txt}</a>'
            return txt  # non-section ref: keep text, drop link

        if tag == 'note':
            place = elem.get('place') or ''
            cls = 'ag-note ag-note-foot' if place == 'foot' else 'ag-note'
            return f'<span class="{cls}">{norm_ws(self.inner(elem)).strip()}</span>'

        if tag in ('list',):
            items = ''.join(self.render(c) for c in elem if local(c.tag) == 'item')
            return f'<ul class="ag-list">{items}</ul>'
        if tag == 'item':
            return f'<li>{norm_ws(self.inner(elem)).strip()}</li>'

        if tag == 'table':
            return self.render_table(elem)

        if tag in ('hi', 'term', 'bibl', 'author', 'title', 'seg', 'cell', 'row'):
            return self.inner(elem)

        # default: pass through children
        return self.inner(elem)

    def render_table(self, elem):
        rows = []
        for r in elem:
            if local(r.tag) != 'row':
                continue
            header = (r.get('role') == 'label')
            cells = []
            for c in r:
                if local(c.tag) != 'cell':
                    continue
                th = header or (c.get('role') == 'label')
                name = 'th' if th else 'td'
                attrs = ''
                cols = c.get('cols')
                rowspan = c.get('rows')
                if cols and cols != '1':
                    attrs += f' colspan="{esc(cols)}"'
                if rowspan and rowspan != '1':
                    attrs += f' rowspan="{esc(rowspan)}"'
                cells.append(f'<{name}{attrs}>{norm_ws(self.inner(c)).strip()}</{name}>')
            rows.append('<tr>' + ''.join(cells) + '</tr>')
        return '<table class="ag-table">' + ''.join(rows) + '</table>'


# Block-level tags that constitute section body content.
BODY_TAGS = {'p', 'table', 'list', 'note', 'quote', 'cit'}


def head_text(div):
    """First direct <head> child's plain text (markup stripped), or None.

    Breadcrumb paths and page slugs need plain text — e.g. the head
    "First Declension (<emph>ā</emph>-stems)" must reduce to
    "First Declension (ā-stems)", not leaked <em> markup."""
    for c in div:
        if local(c.tag) == 'head':
            return norm_ws(''.join(c.itertext())).strip() or None
    return None


def main():
    tree = ET.parse(SRC)
    body = tree.getroot().find('.//t:body', NS)

    sections = {}          # id -> section dict
    order = []             # section ids in document order
    state = {'current': None, 'page': None}

    def open_section(n):
        sec = {
            'id': n,
            'path': list(path_stack),
            'heading': path_stack[-1] if path_stack else None,
            '_parts': [],
            'xrefs': [],
            'source_page': state['page'],
        }
        sections[n] = sec
        order.append(n)
        state['current'] = sec

    def add_block(html, xrefs):
        cur = state['current']
        if cur is None or not html:
            return
        cur['_parts'].append(html)
        cur['xrefs'].extend(xrefs)

    path_stack = []

    def walk(elem):
        for child in elem:
            tag = local(child.tag)
            if tag == 'div':
                path_stack.append(head_text(child) or '')
                walk(child)
                path_stack.pop()
            elif tag == 'milestone' and child.get('unit') == 'smythp':
                n = (child.get('n') or '').strip()
                if n.isdigit():
                    open_section(n)
            elif tag == 'pb':
                p = (child.get('n') or '').strip()
                state['page'] = int(p) if p.isdigit() else state['page']
            elif tag == 'head':
                continue  # belongs to the div breadcrumb, not body
            elif tag in BODY_TAGS:
                r = Renderer()
                add_block(r.render(child), r.xrefs)

    # normalize empty path entries out of breadcrumbs at emit time
    walk(body)

    # finalize sections: join html, dedupe xrefs, drop empty path entries
    out_sections = {}
    for n in order:
        sec = sections[n]
        path = [p for p in sec['path'] if p]
        out_sections[n] = {
            'id': n,
            'path': path,
            'heading': (path[-1] if path else None),
            'html': ''.join(sec['_parts']),
            'xrefs': sorted(set(sec['xrefs']), key=int),
            'source_page': sec['source_page'],
        }

    # Unlink cross-references whose target is not an A&G section (e.g. §497
    # cites "Goodwin's Greek Grammar, § 1588"): keep the text, drop the anchor.
    valid = set(out_sections)
    for sec in out_sections.values():
        bad = [t for t in sec['xrefs'] if t not in valid]
        if not bad:
            continue
        for t in bad:
            sec['html'] = re.sub(
                rf'<a class="ag-ref" href="#sec-{t}">(.*?)</a>', r'\1', sec['html'])
        sec['xrefs'] = [t for t in sec['xrefs'] if t in valid]

    # parts: group sections by top-of-path in document order
    parts = []
    seen = {}
    for n in order:
        top = out_sections[n]['path'][0] if out_sections[n]['path'] else '(front matter)'
        if top not in seen:
            pid = re.sub(r'[^a-z0-9]+', '-', top.lower()).strip('-') or 'part'
            seen[top] = {'id': pid, 'label': top, 'sections': []}
            parts.append(seen[top])
        seen[top]['sections'].append(n)

    doc = {
        'language_id': 'latin',
        'source': SOURCE_META,
        'parts': parts,
        'sections': out_sections,
    }

    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(doc, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')

    n_tables = sum(s['html'].count('<table') for s in out_sections.values())
    n_xref = sum(len(s['xrefs']) for s in out_sections.values())
    dangling = sorted({t for s in out_sections.values() for t in s['xrefs']
                       if t not in out_sections}, key=int)
    print(f'Wrote {len(out_sections)} sections in {len(parts)} parts to '
          f'{OUT.relative_to(ROOT.parent.parent)}')
    print(f'  tables: {n_tables}  xrefs: {n_xref}  dangling xref targets: {len(dangling)}')
    if dangling:
        print('  dangling sample:', dangling[:15])
    for p in parts:
        print(f'  part "{p["label"]}": {len(p["sections"])} sections')


if __name__ == '__main__':
    main()

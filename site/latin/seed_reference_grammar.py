#!/usr/bin/env python3
"""
seed_reference_grammar.py — one-time reshape of reference-grammar.json from the
ingest_ag.py (page-oriented) shape into the canonical, hand-editable shape.

Allen & Greenough is the *seed* of the Reference Grammar, not an upstream: after
this runs, content/_language/latin/reference-grammar.json is edited directly
(corrections, new sections) and nothing regenerates it. See
Plans/latin-text-centered-reader-plan.md (D1, A1).

Old shape (ingest_ag.py):
    parts[]    { id, label, sections: [ids] }
    sections{} { id, path: [part, chapter, group…], heading, html, xrefs, source_page }
               html cross-refs: <a class="ag-ref" href="#sec-N">

New shape:
    { language_id, title, sources: [ {id: "ag", …} ],
      toc: [ { id, label, chapters: [ { id, slug, label, items: [ "N" | {label, items} ] } ] } ],
      sections: { "N": { source: "ag", source_page, html } } }
               html cross-refs: <a data-ref="N">

Only authored data is stored. Chapter membership, group headings, prev/next,
and xrefs are derived from toc + html at build time (site/generator/lib/
reference-grammar.js). Headings are converted from the TEI's ALL CAPS to title
case; HEADING_EXCEPTIONS overrides the rule where review finds it wrong.

Usage:
    python3 site/latin/seed_reference_grammar.py            # rewrite in place + report
    python3 site/latin/seed_reference_grammar.py --check    # dry run, report only

Run once. Refuses to run on a file that is already in the new shape.
"""
import argparse
import json
import re
import sys
import unicodedata
from datetime import date
from pathlib import Path

ROOT = Path(__file__).resolve().parent
REPO = ROOT.parent.parent
TARGET = REPO / 'content' / '_language' / 'latin' / 'reference-grammar.json'
REPORT = ROOT / 'reference-grammar-seed-report.md'

TITLE = 'Reference Grammar'

# Words kept lowercase in title case unless first or after a colon/dash/paren.
SMALL_WORDS = {'a', 'an', 'and', 'as', 'at', 'by', 'for', 'in', 'of', 'on',
               'or', 'the', 'to', 'with'}

# Review-driven overrides (raw TEI label → display label). Latin words in A&G's
# mixed-case headings are lowercase ("Verbs in -iō"); keep that convention.
HEADING_EXCEPTIONS = {
    'USES OF CUM': 'Uses of cum',
    'CLAUSES WITH QUīN AND QUōMINUS': 'Clauses with quīn and quōminus',
    # The TEI colon is a typesetting artifact of the running head.
    'GLOSSARY: OF TERMS USED IN GRAMMAR, RHETORIC, AND PROSODY':
        'Glossary of Terms Used in Grammar, Rhetoric, and Prosody',
}

# Chapters the old page grouping merged by mistake, keyed by the first section
# of the run that becomes its own chapter → display label. The TEI heads A&G's
# adjectives of the third declension (§114–122) with the same label as the
# nouns' chapter, so planPages put them on the nouns' page, out of order.
SPLIT_CHAPTERS = {
    '114': 'Adjectives of the Third Declension',
}

_LETTER_RUN = re.compile(r'[^\W\d_]+')


def _is_caps_run(run):
    """A letter run set in caps by the TEI: ≥2 uppercase letters, no lowercase
    ASCII. Lowercase macron vowels inside a caps word (QUīN) are TEI artifacts."""
    if re.search(r'[a-z]', run):
        return False
    return sum(1 for ch in run if ch.isupper()) >= 2


def normalize_heading(label):
    """ALL-CAPS TEI heading → title case. Mixed-case labels pass through."""
    if label in HEADING_EXCEPTIONS:
        return HEADING_EXCEPTIONS[label]
    if not any(_is_caps_run(m.group()) for m in _LETTER_RUN.finditer(label)):
        return label
    out = []
    pos = 0
    for m in _LETTER_RUN.finditer(label):
        run = m.group()
        before = label[pos:m.start()]
        out.append(before)
        pos = m.end()
        if not _is_caps_run(run):
            out.append(run)
            continue
        word = run.lower()
        prefix = ''.join(out).rstrip()
        # Start of label, or after a colon / dash / opening paren → capitalise.
        # A hyphen-joined run ("ā-STEMS") is a word continuation → capitalise.
        starts_phrase = (not prefix) or prefix[-1] in ':—(–'
        if word in SMALL_WORDS and not starts_phrase and not before.endswith('-'):
            out.append(word)
        else:
            out.append(word[0].upper() + word[1:])
    out.append(label[pos:])
    return ''.join(out)


def slugify(s):
    """Mirror of build-reference-grammar.js slugify (page file names)."""
    s = unicodedata.normalize('NFKD', str(s).lower())
    s = re.sub(r'[̀-ͯ]', '', s)
    s = re.sub(r'[^a-z0-9\s-]', '', s).strip()
    s = re.sub(r'\s+', '-', s)
    s = re.sub(r'-+', '-', s)
    return s or 'section'


def plan_pages(old):
    """Mirror of build-reference-grammar.js planPages on the old shape: pages
    keyed by (part, path[1]) in document order, slugs NN-slugify(label)."""
    pages, by_key = [], {}
    for part in old['parts']:
        for sid in part['sections']:
            sec = old['sections'][sid]
            path = sec.get('path') or []
            topical = path[1] if len(path) > 1 else (path[0] if path else part['label'])
            key = (part['id'], topical)
            if key not in by_key:
                by_key[key] = {'part': part['id'], 'topical': topical, 'sections': []}
                pages.append(by_key[key])
            by_key[key]['sections'].append(sid)
    for i, p in enumerate(pages):
        p['slug'] = f'{i + 1:02d}-{slugify(p["topical"])}'
    return pages


XREF_OLD = re.compile(r'<a class="ag-ref" href="#sec-(\d+)">')


def convert_html(html):
    return XREF_OLD.sub(r'<a data-ref="\1">', html)


def seed(old):
    """Reshape the ingest_ag document. Returns (new_doc, report) where report
    is {'headings': {tei: seeded}, 'splits': [(first_sid, old_slug, new_slug, label)]}."""
    if 'toc' in old:
        raise ValueError('already in the canonical shape; the seed runs once')

    pages = plan_pages(old)
    slug_for = {}
    for p in pages:
        for sid in p['sections']:
            slug_for[sid] = p['slug']

    changes = {}

    def norm(label):
        new = normalize_heading(label)
        if new != label:
            changes[label] = new
        return new

    toc = []
    chapter_ids = set()
    used_slugs = set()
    splits = []
    sections = {}
    for part in old['parts']:
        part_node = {'id': part['id'], 'label': norm(part['label']), 'chapters': []}
        toc.append(part_node)
        chapter = None
        stack = []   # open group nodes below the chapter: [(raw_label, node)]
        for sid in part['sections']:
            sec = old['sections'][sid]
            path = [p for p in sec['path'] if p]
            slug = slug_for[sid]
            if chapter is None or chapter['page'] != slug:
                raw = path[1] if len(path) > 1 else (path[0] if path else part['label'])
                label = norm(raw)
                page = slug
                if slug in used_slugs:
                    # A page whose sections aren't contiguous: the later run
                    # becomes its own chapter, slotted after the previous one.
                    if sid not in SPLIT_CHAPTERS:
                        raise ValueError(f'page {slug} is split at §{sid}; add it to SPLIT_CHAPTERS')
                    label = SPLIT_CHAPTERS[sid]
                    prev_n = re.match(r'^(\d+)', chapter['slug']).group(1)
                    slug = f'{prev_n}a-{slugify(label)}'
                    splits.append((sid, page, slug, label))
                used_slugs.add(slug)
                cid = 'ch-' + re.sub(r'^\d+a?-', '', slug)
                base, n = cid, 2
                while cid in chapter_ids:
                    cid, n = f'{base}-{n}', n + 1
                chapter_ids.add(cid)
                chapter = {'id': cid, 'slug': slug, 'label': label, 'items': [], 'page': page}
                part_node['chapters'].append(chapter)
                stack = []
            groups = path[2:]
            # Keep the shared prefix of open groups, close the rest, open new.
            k = 0
            while k < len(stack) and k < len(groups) and stack[k][0] == groups[k]:
                k += 1
            stack = stack[:k]
            for g in groups[k:]:
                node = {'label': norm(g), 'items': []}
                (stack[-1][1]['items'] if stack else chapter['items']).append(node)
                stack.append((g, node))
            (stack[-1][1]['items'] if stack else chapter['items']).append(sid)
            entry = {'source': 'ag', 'html': convert_html(sec['html'])}
            if sec.get('source_page') is not None:
                entry['source_page'] = sec['source_page']
            sections[sid] = entry

    for part_node in toc:
        for ch in part_node['chapters']:
            del ch['page']

    src = dict(old['source'])
    new = {
        'language_id': old['language_id'],
        'title': TITLE,
        'sources': [{
            'id': 'ag',
            'title': src['title'],
            'edition': src['edition'],
            'license': src['license'],
            'attribution': src['attribution'],
            'source_file': src['source_file'],
            'retrieved_at': src['retrieved_at'],
            'seeded_at': date.today().isoformat(),
        }],
        'toc': toc,
        'sections': sections,
    }
    return new, {'headings': changes, 'splits': splits}


def write_report(report, path=REPORT):
    changes, splits = report['headings'], report['splits']
    lines = [
        '# Reference Grammar seed: heading changes',
        '',
        'One-time report from `site/latin/seed_reference_grammar.py`: every TEI',
        'heading the seed rewrote from ALL CAPS. Review it; fix a wrong rule',
        'result with `HEADING_EXCEPTIONS` before seeding, or by editing',
        '`reference-grammar.json` directly afterwards.',
        '',
        f'{len(changes)} headings changed.',
        '',
        '## Chapters split from a merged page',
        '',
        'Sections that moved to a new page (their old `#sec-N` URLs on the',
        'merged page no longer resolve):',
        '',
        *[f'- §{sid}…: `{old}.html` → `{new}.html` ({label})' for sid, old, new, label in splits],
        '',
        '## Headings',
        '',
        '| TEI | Seeded |',
        '|-----|--------|',
    ]
    for old, new in changes.items():
        lines.append(f'| {old} | {new} |')
    path.write_text('\n'.join(lines) + '\n', encoding='utf-8')


def main(argv=None):
    ap = argparse.ArgumentParser(description=__doc__.split('\n\n')[0])
    ap.add_argument('--check', action='store_true', help='dry run; write the report only')
    args = ap.parse_args(argv)

    old = json.loads(TARGET.read_text(encoding='utf-8'))
    try:
        new, report = seed(old)
    except ValueError as e:
        print(f'seed_reference_grammar: {e}', file=sys.stderr)
        return 1
    write_report(report)
    n_ch = sum(len(p['chapters']) for p in new['toc'])
    print(f'{len(new["sections"])} sections, {len(new["toc"])} parts, {n_ch} chapters; '
          f'{len(report["headings"])} headings normalised, {len(report["splits"])} chapter split(s) '
          f'→ {REPORT.relative_to(REPO)}')
    if not args.check:
        TARGET.write_text(json.dumps(new, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
        print(f'wrote {TARGET.relative_to(REPO)}')
    return 0


if __name__ == '__main__':
    sys.exit(main())

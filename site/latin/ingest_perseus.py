#!/usr/bin/env python3
"""
ingest_perseus.py — vendor TEI XML → per-card JSON intermediates.

Reads site/latin/sources/phi0959.phi006.perseus-lat2.xml; writes one JSON file
per Perseus "card" into site/latin/sources/cards/book-NN-card-NN.json:

    {"book": 1, "card": 1, "lines": [1, 4],
     "title_latin": "Invocatio.",
     "title_english": "Invocation",
     "text": [
       {"n": 1, "latin": "In nova fert animus mutatas dicere formas"},
       ...
     ]}

Card structure follows Perseus's milestones-as-tales scheme. The intermediate
is the single source of Latin text for the seed.py / scribe.py pipeline.

Edge cases handled:
  * Magnus's apparatus — `<note>` blocks containing `<del>`-wrapped vulgate
    readings — is skipped, not folded into the running text.
  * A handful of card milestones in the source have malformed `n` (e.g.
    `n="65q"` in book 1); we infer the start line from the next `<l n="...">`
    inside the card.
  * `Magnus` and `More` tale milestones can appear after the card opens; we
    take the first of each kind inside a card as that card's title.
"""
import json
import re
from pathlib import Path
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parent
SRC = ROOT / 'sources' / 'phi0959.phi006.perseus-lat2.xml'
OUT_DIR = ROOT / 'sources' / 'cards'
NS = {'tei': 'http://www.tei-c.org/ns/1.0'}


def local(tag):
    return tag.split('}', 1)[-1]


def text_of(elem):
    """Flatten the running text of an <l>, dropping <note> descendants."""
    parts = []
    if elem.text:
        parts.append(elem.text)
    for child in elem:
        if local(child.tag) != 'note':
            parts.append(text_of(child))
        if child.tail:
            parts.append(child.tail)
    return ''.join(parts)


def normalise(s):
    return re.sub(r'\s+', ' ', s).strip()


def line_number(l_elem):
    n = (l_elem.get('n') or '').strip()
    return int(n) if n.isdigit() else None


def parse_book(book_div):
    """Walk a `<div subtype="book">` in document order and split into cards."""
    book_no = int(book_div.get('n', '0'))
    cards = []
    current = None

    def flush():
        if current is not None:
            cards.append(current)

    for child in book_div:
        tag = local(child.tag)
        if tag == 'milestone':
            unit = child.get('unit')
            if unit == 'card':
                flush()
                current = {
                    'book': book_no,
                    'card': len(cards) + 1,
                    'lines': [None, None],
                    'title_latin': None,
                    'title_english': None,
                    'text': [],
                }
            elif unit == 'tale' and current is not None:
                ed = child.get('ed', '')
                title = (child.get('n') or '').strip() or None
                if ed == 'Magnus' and current['title_latin'] is None:
                    current['title_latin'] = title
                elif ed == 'More' and current['title_english'] is None:
                    current['title_english'] = title
        elif tag == 'l':
            if current is None:
                continue
            n = line_number(child)
            if n is None:
                continue
            txt = normalise(text_of(child))
            if current['lines'][0] is None:
                current['lines'][0] = n
            current['lines'][1] = n
            current['text'].append({'n': n, 'latin': txt})
        # <note>, <p>, etc. — skipped at this level.

    flush()
    return cards


def main():
    tree = ET.parse(SRC)
    root = tree.getroot()
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    # Idempotent re-runs: clear any previous output first.
    for f in OUT_DIR.glob('book-*-card-*.json'):
        f.unlink()

    total_cards = 0
    total_lines = 0
    for book in root.iterfind('.//tei:div[@subtype="book"]', NS):
        for c in parse_book(book):
            book_no = c['book']
            card_no = c['card']
            out_path = OUT_DIR / f'book-{book_no:02d}-card-{card_no:02d}.json'
            out_path.write_text(json.dumps(c, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
            total_cards += 1
            total_lines += len(c['text'])

    print(f'Wrote {total_cards} cards spanning {total_lines} lines to {OUT_DIR.relative_to(ROOT.parent.parent)}')


if __name__ == '__main__':
    main()

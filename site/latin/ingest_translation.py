#!/usr/bin/env python3
"""Ingest Perseus eng3 translation XML into per-card JSON intermediates."""
import json
import re
import xml.etree.ElementTree as ET
from pathlib import Path

ROOT = Path(__file__).resolve().parent
SRC = ROOT / 'sources' / 'phi0959.phi006.perseus-eng3.xml'
OUT_DIR = ROOT / 'sources' / 'translations'
NS = {'tei': 'http://www.tei-c.org/ns/1.0'}


def normalise(s):
    return re.sub(r'\s+', ' ', s).strip()


def text_of(elem):
    parts = []
    if elem.text:
        parts.append(elem.text)
    for child in elem:
        parts.append(text_of(child))
        if child.tail:
            parts.append(child.tail)
    return ''.join(parts)


def line_number(elem):
    n = (elem.get('n') or '').strip()
    return int(n) if n.isdigit() else None


def parse_book(book_div):
    book_no = int(book_div.get('n', '0'))
    cards = []
    card_no = 0
    for card_div in book_div.findall('./tei:div[@subtype="card"]', NS):
        card_no += 1
        title_english = None
        m = card_div.find('./tei:milestone[@ed="More"]', NS)
        if m is not None:
            title_english = (m.get('n') or '').strip() or None

        lines = []
        line_nums = []
        for l in card_div.findall('./tei:l', NS):
            txt = normalise(text_of(l))
            if not txt:
                continue
            n = line_number(l)
            line_nums.append(n)
            lines.append({'n': n, 'english': txt})

        card = {
            'book': book_no,
            'card': card_no,
            'title_english': title_english,
            'lines': [
                min([n for n in line_nums if n is not None], default=None),
                max([n for n in line_nums if n is not None], default=None),
            ],
            'text': lines,
        }
        cards.append(card)
    return cards


def main():
    tree = ET.parse(SRC)
    root = tree.getroot()
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    for f in OUT_DIR.glob('book-*-card-*.json'):
        f.unlink()

    total = 0
    for book in root.iterfind('.//tei:div[@subtype="book"]', NS):
        for c in parse_book(book):
            out = OUT_DIR / f'book-{c["book"]:02d}-card-{c["card"]:02d}.json'
            out.write_text(json.dumps(c, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
            total += 1
    print(f'Wrote {total} translation cards to {OUT_DIR.relative_to(ROOT.parent.parent)}')


if __name__ == '__main__':
    main()

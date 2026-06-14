#!/usr/bin/env python3
"""Create first-pass mechanical Book 1 piece files from card + translation data."""
import glob
import json
from pathlib import Path

import apparatus_to_spans
import build_apparatus
import seed
import trim_primary

ROOT = Path(__file__).resolve().parents[2]
LAT_CARDS = ROOT / 'site' / 'latin' / 'sources' / 'cards'
ENG_CARDS = ROOT / 'site' / 'latin' / 'sources' / 'translations'
OUT_DIR = ROOT / 'content' / 'ovid-metamorphoses'


def load_json(path):
    return json.loads(path.read_text(encoding='utf-8'))


def spans_for_card(card_key, latin_lines):
    cache = seed.load_cache()
    build_apparatus.prewarm_cache(latin_lines, cache)
    lines = []
    for idx, line in enumerate(latin_lines, start=1):
        tokens = build_apparatus.build_line_tokens(line, cache)
        lines.append({'line_index': idx, 'text': line, 'tokens': tokens})
    data = {'card': card_key, 'lines': lines}

    lexicon_pos = trim_primary.load_lexicon_pos()
    out_lines = []
    for line in data['lines']:
        parts = []
        for token in line['tokens']:
            chosen = apparatus_to_spans.choose_candidate(token.get('candidates', []), lexicon_pos)
            parts.append(f'<span data-matches="{chosen["matches"]}" data-pos="{chosen["pos"]}">{token["surface"]}</span>{token.get("trail", "")}')
        out_lines.append(' '.join(parts))
    return "<div class=\"latin-passage\">\n" + "<br>\n".join(out_lines) + "\n</div>"


def translation_for_card(card):
    text = ' '.join(line['english'] for line in card.get('text', []) if line.get('english'))
    return text.strip()


def piece_title(lat_card):
    start, end = lat_card['lines']
    english = (lat_card.get('title_english') or '').strip()
    if english:
        t = english[0].upper() + english[1:].lower()
        return f'{t} (Met I.{start}–{end})'
    return f'Book 1 card {lat_card["card"]:02d} (Met I.{start}–{end})'


# Fixed filename map for cards with canonical names; all others get the
# sequential NN-book1-card-NN.md pattern (starting at 03, skipping 01/02).
CARD_FNAME = {
    1: '01-proem.md',
    7: '02-python.md',
}


def main():
    lat_paths = sorted(glob.glob(str(LAT_CARDS / 'book-01-card-*.json')))
    next_num = 3
    created = []

    for lat_path in lat_paths:
        lat_card = load_json(Path(lat_path))
        card_no = lat_card['card']

        card_key = f'01-card-{card_no:02d}'
        eng_path = ENG_CARDS / f'book-01-card-{card_no:02d}.json'
        eng_card = load_json(eng_path) if eng_path.exists() else {'text': []}

        if card_no in CARD_FNAME:
            fname = CARD_FNAME[card_no]
        else:
            fname = f'{next_num:02d}-book1-card-{card_no:02d}.md'
            next_num += 1
        out_path = OUT_DIR / fname

        spans = spans_for_card(card_key, [line['latin'] for line in lat_card['text']])
        trans = translation_for_card(eng_card)
        start, end = lat_card['lines']
        title = piece_title(lat_card)

        md = f"""---
title: {title}
lines: [{start}, {end}]
---

First-pass mechanical chunk for Book 1 card {card_no:02d}, auto-generated from Perseus card boundaries and prepared for build-first QA.

{spans}

## Translation

{trans if trans else "Translation text unavailable for this card in the selected public-domain source."}

## Notes on the passage

First-pass placeholder notes: this page was generated mechanically for coverage and UI review. Replace with passage-specific notes in a later editorial pass.
"""
        out_path.write_text(md, encoding='utf-8')
        created.append(out_path.name)

    print(f'Created {len(created)} piece file(s)')
    for name in created:
        print(name)


if __name__ == '__main__':
    main()

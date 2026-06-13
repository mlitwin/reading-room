#!/usr/bin/env python3
"""Render apparatus JSON into a primary-lemma latin-passage span block."""
import argparse
import json
from pathlib import Path

import seed
import trim_primary


def choose_candidate(candidates, lexicon_pos):
    if not candidates:
        return '?:?'
    if len(candidates) == 1:
        c = candidates[0]
        lemma = seed.LEMMA_ALIAS.get(c['lemma'], c['lemma'])
        return f'{lemma}:{",".join(c["codes"])}'

    best = None
    best_score = None
    for idx, c in enumerate(candidates):
        lemma = seed.LEMMA_ALIAS.get(c['lemma'], c['lemma'])
        score = trim_primary.candidate_score(lemma, c.get('codes', []), lexicon_pos)
        if best_score is None or score > best_score:
            best_score = score
            best = (idx, lemma, c.get('codes', []))
    _, lemma, codes = best
    return f'{lemma}:{",".join(codes)}'


def main():
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument('apparatus_json')
    args = ap.parse_args()

    data = json.loads(Path(args.apparatus_json).read_text(encoding='utf-8'))
    lexicon_pos = trim_primary.load_lexicon_pos()

    out_lines = []
    for line in data.get('lines', []):
        parts = []
        for token in line.get('tokens', []):
            surface = token['surface']
            trail = token.get('trail', '')
            matches = choose_candidate(token.get('candidates', []), lexicon_pos)
            parts.append(f'<span data-matches="{matches}">{surface}</span>{trail}')
        out_lines.append(' '.join(parts))

    print('<div class="latin-passage">')
    print('<br>\n'.join(out_lines))
    print('</div>')


if __name__ == '__main__':
    main()

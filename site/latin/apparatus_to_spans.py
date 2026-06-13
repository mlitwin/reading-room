#!/usr/bin/env python3
"""Render apparatus JSON into a primary-lemma latin-passage span block."""
import argparse
import json
from pathlib import Path

import seed
import trim_primary


def infer_pos_from_codes(codes, lexicon_pos, lemma):
    if any(c == 'prep' for c in codes):
        return 'prep'
    if any(c == 'conj' for c in codes):
        return 'conj'
    if any(c == 'adv' for c in codes):
        return 'adv'
    if any(c == 'interj' for c in codes):
        return 'interj'
    if any(c == 'num' for c in codes):
        return 'num'
    if any(c.startswith(('1sg.', '2sg.', '3sg.', '1pl.', '2pl.', '3pl.', 'inf.')) for c in codes):
        return 'verb'
    if any(c.startswith(('ppp.', 'pap.', 'fap.', 'fpp.')) for c in codes):
        return 'verb'
    if any(c.startswith(('nom.', 'gen.', 'dat.', 'acc.', 'abl.', 'voc.', 'loc.')) for c in codes):
        return lexicon_pos.get(lemma, 'unknown')
    return lexicon_pos.get(lemma, 'unknown')


def choose_candidate(candidates, lexicon_pos):
    if not candidates:
        return {'matches': 'unknown:unk', 'pos': 'unknown'}
    if len(candidates) == 1:
        c = candidates[0]
        lemma = seed.LEMMA_ALIAS.get(c['lemma'], c['lemma'])
        codes = c["codes"]
        return {
            'matches': f'{lemma}:{",".join(codes)}',
            'pos': infer_pos_from_codes(codes, lexicon_pos, lemma),
        }

    best = None
    best_score = None
    for idx, c in enumerate(candidates):
        lemma = seed.LEMMA_ALIAS.get(c['lemma'], c['lemma'])
        score = trim_primary.candidate_score(lemma, c.get('codes', []), lexicon_pos)
        if best_score is None or score > best_score:
            best_score = score
            best = (idx, lemma, c.get('codes', []))
    _, lemma, codes = best
    return {'matches': f'{lemma}:{",".join(codes)}', 'pos': infer_pos_from_codes(codes, lexicon_pos, lemma)}


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
            chosen = choose_candidate(token.get('candidates', []), lexicon_pos)
            parts.append(f'<span data-matches="{chosen["matches"]}" data-pos="{chosen["pos"]}">{surface}</span>{trail}')
        out_lines.append(' '.join(parts))

    print('<div class="latin-passage">')
    print('<br>\n'.join(out_lines))
    print('</div>')


if __name__ == '__main__':
    main()

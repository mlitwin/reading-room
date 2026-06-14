#!/usr/bin/env python3
"""Render apparatus JSON into a primary-lemma latin-passage span block."""
import argparse
import json
from pathlib import Path

import seed
import trim_primary

# When both lemmas appear as candidates for the same surface form, demote the
# left-hand lemma (push it to the end of data-matches) so the right-hand one
# becomes primary. Both are preserved so the reader can browse to either.
LEMMA_PREFER = {
    'edo':     'sum',      # est/erat/erit — copula, not "to eat"
    'caelo':   'caelum',   # sky/heaven, not "to engrave"
    'solo':    'solum',    # ground / "only", not "to soothe"
    'medio':   'medius',   # the middle (adj), not "to halve"
    'formo':   'forma',    # shape (noun), not "to shape"
    'loco':    'locus',    # place (noun), not "to place"
    'novo':    'novus',    # new (adj), not "to renew"
    'diverto': 'diversus', # various/different (adj), not "to divert"
}


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
    """Score and order all candidates; return all (primary first) in data-matches.

    All candidates that have a lexicon card are preserved in the output so the
    reader UI can browse to any of them. LEMMA_PREFER demotes (not removes) the
    lower-confidence reading so the better one becomes primary.
    """
    if not candidates:
        return {'matches': 'unknown:unk', 'pos': 'unknown'}

    # Apply alias; deduplicate after aliasing. If the same lemma appears twice
    # (different parse sets), keep the codes that best match the card's POS.
    by_lemma = {}
    for c in candidates:
        lemma = seed.LEMMA_ALIAS.get(c['lemma'], c['lemma'])
        codes = c.get('codes', [])
        if lemma not in by_lemma:
            by_lemma[lemma] = codes
        else:
            pos = lexicon_pos.get(lemma)
            if pos:
                prev_score = max((trim_primary.code_pos_score(x, pos) for x in by_lemma[lemma]), default=0)
                new_score = max((trim_primary.code_pos_score(x, pos) for x in codes), default=0)
                if new_score > prev_score:
                    by_lemma[lemma] = codes
    resolved = [{'lemma': l, 'codes': c} for l, c in by_lemma.items()]

    # Keep only candidates that have a lexicon card (build.js validates these).
    resolved = [c for c in resolved if lexicon_pos.get(c['lemma'])]
    if not resolved:
        return {'matches': 'unknown:unk', 'pos': 'unknown'}

    # Mark demoted lemmas (LEMMA_PREFER) without removing them.
    lemma_set = {c['lemma'] for c in resolved}
    demoted = set()
    for bad, good in LEMMA_PREFER.items():
        if bad in lemma_set and good in lemma_set:
            demoted.add(bad)

    def score_of(c):
        s = trim_primary.candidate_score(c['lemma'], c['codes'], lexicon_pos)
        if c['lemma'] in demoted:
            s -= 1000  # push to end, still present for browsing
        return s

    resolved.sort(key=score_of, reverse=True)

    # Emit all candidates; primary (index 0) is first in data-matches.
    parts = []
    for c in resolved:
        codes_str = ','.join(c['codes'])
        parts.append(f'{c["lemma"]}:{codes_str}' if codes_str else c['lemma'])

    primary = resolved[0]
    return {
        'matches': ';'.join(parts),
        'pos': infer_pos_from_codes(primary['codes'], lexicon_pos, primary['lemma']),
    }


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

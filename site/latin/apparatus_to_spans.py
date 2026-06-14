#!/usr/bin/env python3
"""Render apparatus JSON into a primary-lemma latin-passage span block."""
import argparse
import json
from pathlib import Path

import seed
import trim_primary

# LEMMA_PREFER is no longer needed: disambiguation is handled by the ID scheme.
# Morpheus candidate lemmas that are surface-form stems get resolved to their
# lexicon IDs by choose_candidate; the parse-code scoring picks the right one.
LEMMA_PREFER = {}  # kept as empty dict so callers don't need to change


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


def choose_candidate(candidates, lexicon_pos, stem_to_ids):
    """Score and order all candidates; return all (primary first) in data-matches.

    Morpheus outputs surface-form lemma strings; `stem_to_ids` maps each stem
    to the one or more lexicon IDs that share it.  When a stem maps to multiple
    IDs (e.g. both a verb and a noun), parse-code scoring selects the best one.
    All candidates with a lexicon entry are preserved so the UI can browse them.
    """
    if not candidates:
        return {'matches': 'unknown:unk', 'pos': 'unknown'}

    # Resolve each Morpheus lemma string to its lexicon ID.
    by_id: dict[str, list[str]] = {}
    for c in candidates:
        surface = seed.LEMMA_ALIAS.get(c['lemma'], c['lemma'])
        codes = c.get('codes', [])
        ids_for_stem = stem_to_ids.get(surface, [])
        if len(ids_for_stem) == 1:
            entry_id = ids_for_stem[0]
        elif len(ids_for_stem) > 1:
            # Pick ID whose POS best matches the parse codes.
            entry_id = max(
                ids_for_stem,
                key=lambda eid: sum(trim_primary.code_pos_score(code, lexicon_pos.get(eid, ''))
                                    for code in codes),
            )
        else:
            continue  # no lexicon entry for this surface lemma

        if entry_id not in by_id:
            by_id[entry_id] = codes
        else:
            pos = lexicon_pos.get(entry_id, '')
            if pos and codes:
                prev = max((trim_primary.code_pos_score(x, pos) for x in by_id[entry_id]), default=0)
                new  = max((trim_primary.code_pos_score(x, pos) for x in codes), default=0)
                if new > prev:
                    by_id[entry_id] = codes

    resolved = [{'lemma': eid, 'codes': c} for eid, c in by_id.items()]
    if not resolved:
        return {'matches': 'unknown:unk', 'pos': 'unknown'}

    resolved.sort(
        key=lambda c: trim_primary.candidate_score(c['lemma'], c['codes'], lexicon_pos),
        reverse=True,
    )

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
    stem_to_ids = trim_primary.load_stem_to_ids()

    out_lines = []
    for line in data.get('lines', []):
        parts = []
        for token in line.get('tokens', []):
            surface = token['surface']
            trail = token.get('trail', '')
            chosen = choose_candidate(token.get('candidates', []), lexicon_pos, stem_to_ids)
            parts.append(f'<span data-matches="{chosen["matches"]}" data-pos="{chosen["pos"]}">{surface}</span>{trail}')
        out_lines.append(' '.join(parts))

    print('<div class="latin-passage">')
    print('<br>\n'.join(out_lines))
    print('</div>')


if __name__ == '__main__':
    main()

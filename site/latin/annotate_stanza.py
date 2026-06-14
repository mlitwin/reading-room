#!/usr/bin/env python3
"""Write data-stanza="lemma" attributes onto spans in a piece markdown file.

For each span, stanza's preferred lemma is written as data-stanza="lemma".
If stanza has no opinion (proper nouns, alignment gap), the attribute is
removed. The attribute is used by the reader UI to show a confidence
indicator: which reading stanza independently confirms.

The script is idempotent — re-running updates existing annotations.

Usage:
    site/latin/.venv/bin/python3 site/latin/annotate_stanza.py --card 2
    site/latin/.venv/bin/python3 site/latin/annotate_stanza.py --card 7
"""
import argparse
import re
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import stanza_editorial
import trim_primary

# Matches the opening tag of a latin-passage span (no closing tag needed).
SPAN_OPEN_RE = re.compile(
    r'<span\b(?=[^>]*\bdata-matches=")[^>]*?>'
)
DATA_STANZA_RE = re.compile(r'\s+data-stanza="[^"]*"')


def build_stanza_map(current_tokens, stanza_words):
    """Return {token_index: stanza_lemma} for all aligned current tokens."""
    pairs = stanza_editorial.align_tokens(current_tokens, stanza_words)
    result = {}
    idx = 0
    for current, stanza_word in pairs:
        if current is not None:
            if stanza_word is not None:
                result[idx] = stanza_word['lemma']
            idx += 1
    return result


def insert_stanza_attr(tag, lemma):
    """Add or replace data-stanza attribute in a span opening tag."""
    tag = DATA_STANZA_RE.sub('', tag)          # remove existing
    return tag[:-1] + f' data-stanza="{lemma}">'  # insert before >


def annotate(piece_path, card_no, nlp):
    text = piece_path.read_text('utf-8')
    current_tokens = stanza_editorial.parse_current_piece(piece_path)
    source_text = stanza_editorial.load_source_text(card_no)
    stanza_words = stanza_editorial.stanza_tokens(nlp, source_text)
    stanza_map = build_stanza_map(current_tokens, stanza_words)

    # Resolve Stanza surface lemmas to lexicon IDs.
    stem_to_ids = trim_primary.load_stem_to_ids()

    def stanza_lemma_to_id(lemma: str) -> str:
        ids = stem_to_ids.get(lemma, [])
        if len(ids) == 1:
            return ids[0]
        if ids:
            # Multiple IDs for this stem — prefer verb (Stanza leans verbal).
            verb = next((i for i in ids if i.endswith('_v')), None)
            return verb or ids[0]
        return lemma  # no lexicon entry; keep raw lemma as fallback

    token_idx = [0]

    def replace(m):
        tag = m.group(0)
        idx = token_idx[0]
        token_idx[0] += 1
        lemma = stanza_map.get(idx)
        if lemma:
            return insert_stanza_attr(tag, stanza_lemma_to_id(lemma))
        return DATA_STANZA_RE.sub('', tag)  # remove stale annotation if any

    new_text = SPAN_OPEN_RE.sub(replace, text)
    piece_path.write_text(new_text, 'utf-8')
    annotated = sum(1 for v in stanza_map.values() if v)
    total = token_idx[0]
    print(f'{piece_path.name}: {annotated}/{total} spans annotated')


def main():
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument('--card', type=int, required=True, help='Book 1 card number')
    ap.add_argument('--piece', help='Optional markdown piece path override')
    args = ap.parse_args()

    piece = stanza_editorial.resolve_piece(args.card, args.piece)
    nlp = stanza_editorial.build_pipeline()
    annotate(piece, args.card, nlp)


if __name__ == '__main__':
    main()

#!/usr/bin/env python3
"""trim_primary.py — choose a primary lemma for each data-matches group.

Reads a `<div class="latin-passage">` block on stdin (seed.py output),
scores each lemma-group candidate in `data-matches="lemma1:...;lemma2:..."`
using existing lexicon POS compatibility, and keeps the best candidate.
If candidates tie, preserves original source order.
"""
import json
import re
import sys
from pathlib import Path

LATIN_SPAN_RE = re.compile(r'data-matches="([^"]+)"')
CASE_PREFIX = ('nom.', 'gen.', 'dat.', 'acc.', 'abl.', 'voc.', 'loc.')
CODE_LITERAL_TO_POS = {
    'prep': {'prep'},
    'conj': {'conj'},
    'adv': {'adv'},
    'interj': {'interj'},
    'num': {'num', 'adj'},
    'enclit': {'conj', 'adv'},
}
REPO_ROOT = Path(__file__).resolve().parents[2]
SHARED_LEXICON = REPO_ROOT / 'content' / '_latin-lexicon'


def load_lexicon_pos():
    out = {}
    if not SHARED_LEXICON.exists():
        return out
    for path in SHARED_LEXICON.glob('*.json'):
        try:
            data = json.loads(path.read_text(encoding='utf-8'))
        except json.JSONDecodeError:
            continue
        lemma = data.get('lemma')
        pos = data.get('pos')
        if lemma and pos:
            out[lemma] = pos
    return out


def parse_groups(matches_str):
    groups = []
    for idx, chunk in enumerate(matches_str.split(';')):
        lemma, _, codes_raw = chunk.partition(':')
        lemma = lemma.strip()
        codes = [c.strip() for c in codes_raw.split(',') if c.strip()]
        groups.append((idx, lemma, codes, chunk))
    return groups


def code_pos_score(code, pos):
    if code in CODE_LITERAL_TO_POS:
        return 8 if pos in CODE_LITERAL_TO_POS[code] else -5
    if code.startswith(('1sg.', '2sg.', '3sg.', '1pl.', '2pl.', '3pl.', 'inf.')):
        return 8 if pos == 'verb' else -4
    if code.startswith(('ppp.', 'pap.', 'fap.', 'fpp.')):
        if pos == 'verb':
            return 8
        if pos == 'adj':
            return 2
        return -3
    if code.startswith(CASE_PREFIX):
        return 6 if pos in {'noun', 'adj', 'pron', 'num'} else -3
    return 0


def candidate_score(lemma, codes, lexicon_pos):
    score = 0
    pos = lexicon_pos.get(lemma)
    if pos:
        score += 20
        if codes:
            score += max(code_pos_score(c, pos) for c in codes)
    # Prefer candidates with concrete parse tags over empty/unknown payloads.
    if codes:
        score += 1
    return score


def trim(matches_str, lexicon_pos):
    groups = parse_groups(matches_str)
    if len(groups) <= 1:
        return matches_str
    best_idx = 0
    best_score = None
    for idx, lemma, codes, chunk in groups:
        score = candidate_score(lemma, codes, lexicon_pos)
        if best_score is None or score > best_score:
            best_idx = idx
            best_score = score
    return groups[best_idx][3]


def main():
    lexicon_pos = load_lexicon_pos()
    text = sys.stdin.read()
    out = LATIN_SPAN_RE.sub(lambda m: f'data-matches="{trim(m.group(1), lexicon_pos)}"', text)
    sys.stdout.write(out)

if __name__ == '__main__':
    main()

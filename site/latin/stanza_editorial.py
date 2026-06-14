#!/usr/bin/env python3
"""Run stanza-la over a card and compare it to the current span annotations."""
import argparse
import json
import re
from pathlib import Path

PIECE_SPAN_RE = re.compile(r'<span\s+data-matches="([^"]+)"(?:\s+data-pos="([^"]+)")?>([^<]+)</span>')
ROOT = Path(__file__).resolve().parents[2]
CARDS = ROOT / 'site' / 'latin' / 'sources' / 'cards'
PIECES = ROOT / 'content' / 'ovid-metamorphoses'

POS_MAP = {
    'NOUN': 'noun',
    'PROPN': 'noun',
    'ADJ': 'adj',
    'VERB': 'verb',
    'AUX': 'verb',
    'ADV': 'adv',
    'PRON': 'pron',
    'DET': 'pron',
    'ADP': 'prep',
    'SCONJ': 'conj',
    'CCONJ': 'conj',
    'NUM': 'num',
    'INTJ': 'interj',
    'PART': 'part',
    'X': 'unknown',
    'PUNCT': 'punct',
}


def load_json(path):
    return json.loads(path.read_text(encoding='utf-8'))


def resolve_piece(card_no, explicit_piece=None):
    if explicit_piece:
        path = Path(explicit_piece)
        if not path.is_absolute():
            path = ROOT / path
        return path
    if card_no == 1:
        return PIECES / '01-proem.md'
    if card_no == 7:
        return PIECES / '02-python.md'
    matches = sorted(PIECES.glob(f'*book1-card-{card_no:02d}.md'))
    if not matches:
        raise FileNotFoundError(f'no piece markdown found for card {card_no:02d}')
    return matches[0]


def parse_primary(matches):
    primary = (matches or '').split(';', 1)[0]
    lemma, _, _ = primary.partition(':')
    return lemma.strip()


def parse_current_piece(path):
    text = path.read_text(encoding='utf-8')
    tokens = []
    for m in PIECE_SPAN_RE.finditer(text):
        matches, pos, surface = m.groups()
        tokens.append({
            'surface': surface,
            'lemma': parse_primary(matches),
            'matches': matches,
            'pos': pos or '',
        })
    return tokens


def normalize_surface(surface):
    return re.sub(r'^[“"\'(]+|[”"\'.,;:!?)]+$', '', surface).lower()


def stanza_pipeline():
    try:
        import stanza
    except ImportError as exc:
        raise SystemExit(
            'stanza is not installed in this Python; point STANZA_PYTHON at the local venv'
        ) from exc
    return stanza


def build_pipeline():
    stanza = stanza_pipeline()
    return stanza.Pipeline('la', processors='tokenize,mwt,pos,lemma', use_gpu=False, verbose=False)


def stanza_tokens(nlp, text):
    doc = nlp(text)
    out = []
    for sent in doc.sentences:
        for word in sent.words:
            if word.upos == 'PUNCT':
                continue
            out.append({
                'surface': word.text,
                'lemma': word.lemma,
                'pos': POS_MAP.get(word.upos, word.upos.lower()),
                'upos': word.upos,
                'feats': word.feats or '',
            })
    return out


def align_tokens(current_tokens, stanza_words):
    """Return full LCS alignment as list of (current|None, stanza|None) pairs."""
    current_surfaces = [normalize_surface(t['surface']) for t in current_tokens]
    stanza_surfaces = [normalize_surface(t['surface']) for t in stanza_words]
    n, m = len(current_surfaces), len(stanza_surfaces)
    dp = [[0] * (m + 1) for _ in range(n + 1)]
    for i in range(n - 1, -1, -1):
        for j in range(m - 1, -1, -1):
            if current_surfaces[i] == stanza_surfaces[j]:
                dp[i][j] = dp[i + 1][j + 1] + 1
            else:
                dp[i][j] = max(dp[i + 1][j], dp[i][j + 1])
    pairs = []
    i = j = 0
    while i < n and j < m:
        if current_surfaces[i] == stanza_surfaces[j]:
            pairs.append((current_tokens[i], stanza_words[j]))
            i += 1; j += 1
        elif dp[i + 1][j] >= dp[i][j + 1]:
            pairs.append((current_tokens[i], None)); i += 1
        else:
            pairs.append((None, stanza_words[j])); j += 1
    while i < n:
        pairs.append((current_tokens[i], None)); i += 1
    while j < m:
        pairs.append((None, stanza_words[j])); j += 1
    return pairs


def compare_tokens(current_tokens, stanza_words):
    current_surfaces = [normalize_surface(t['surface']) for t in current_tokens]
    stanza_surfaces = [normalize_surface(t['surface']) for t in stanza_words]
    n = len(current_surfaces)
    m = len(stanza_surfaces)
    dp = [[0] * (m + 1) for _ in range(n + 1)]
    for i in range(n - 1, -1, -1):
        for j in range(m - 1, -1, -1):
            if current_surfaces[i] == stanza_surfaces[j]:
                dp[i][j] = dp[i + 1][j + 1] + 1
            else:
                dp[i][j] = max(dp[i + 1][j], dp[i][j + 1])

    pairs = []
    i = j = 0
    while i < n and j < m:
        if current_surfaces[i] == stanza_surfaces[j]:
            pairs.append((current_tokens[i], stanza_words[j]))
            i += 1
            j += 1
        elif dp[i + 1][j] >= dp[i][j + 1]:
            pairs.append((current_tokens[i], None))
            i += 1
        else:
            pairs.append((None, stanza_words[j]))
            j += 1
    while i < n:
        pairs.append((current_tokens[i], None))
        i += 1
    while j < m:
        pairs.append((None, stanza_words[j]))
        j += 1

    candidates = []
    summary = {'match': 0, 'lemma_mismatch': 0, 'pos_mismatch': 0, 'alignment_mismatch': 0}
    index = 0
    for current, stanza_word in pairs:
        if current is None:
            summary['alignment_mismatch'] += 1
            continue
        index += 1
        if stanza_word is None:
            summary['alignment_mismatch'] += 1
            candidates.append({
                'index': index,
                'surface': current['surface'],
                'current': current,
                'stanza': None,
                'status': 'alignment_mismatch',
            })
            continue

        lemma_match = current['lemma'] == stanza_word['lemma']
        pos_match = current['pos'] == stanza_word['pos']
        if lemma_match and pos_match:
            summary['match'] += 1
            continue
        if not lemma_match:
            summary['lemma_mismatch'] += 1
        if not pos_match:
            summary['pos_mismatch'] += 1
        status = 'lemma_pos_mismatch' if (not lemma_match and not pos_match) else 'lemma_mismatch' if not lemma_match else 'pos_mismatch'
        candidates.append({
            'index': index,
            'surface': current['surface'],
            'current': current,
            'stanza': stanza_word,
            'status': status,
        })
    return summary, candidates


def load_source_text(card_no):
    path = CARDS / f'book-01-card-{card_no:02d}.json'
    data = load_json(path)
    return '\n'.join(line['latin'] for line in data.get('text', []))


def main():
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument('--card', type=int, required=True, help='Book 1 card number')
    ap.add_argument('--piece', help='Optional markdown piece path')
    ap.add_argument('--json', action='store_true', help='Emit JSON only')
    args = ap.parse_args()

    piece = resolve_piece(args.card, args.piece)
    current_tokens = parse_current_piece(piece)
    nlp = build_pipeline()
    stanza_words = stanza_tokens(nlp, load_source_text(args.card))
    summary, candidates = compare_tokens(current_tokens, stanza_words)

    out = {
        'card': args.card,
        'piece': str(piece.relative_to(ROOT)),
        'summary': summary,
        'candidates': candidates,
    }
    if args.json:
        print(json.dumps(out, ensure_ascii=False, indent=2))
        return

    print(f"card {args.card:02d}: {summary['match']} match, {len(candidates)} candidate(s)")
    for item in candidates:
        current = item['current']
        stanza_word = item['stanza']
        if stanza_word is None:
            stanza_desc = 'stanza=<missing>'
        else:
            stanza_desc = f"stanza={stanza_word['lemma']}[{stanza_word['pos']}]"
        print(
            f"{item['index']:03d} {item['status']}: {item['surface']} | "
            f"current={current['lemma']}[{current['pos']}] -> {stanza_desc}"
        )


if __name__ == '__main__':
    main()

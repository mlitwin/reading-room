#!/usr/bin/env python3
"""Audit Latin spans and lexicon cards for phase-scaling quality gates."""
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
CONTENT = ROOT / 'content'
SHARED_LEXICON = CONTENT / '_latin-lexicon'
LATIN_SPAN_RE = re.compile(r'data-matches="([^"]+)"')

REQUIRED_CARD_FIELDS = ('lemma', 'pos', 'head', 'glosses')
SPARSE_THRESHOLDS = {
    'noun': 8,
    'adj': 12,
    'verb': 10,
}
CODE_LITERAL_TO_POS = {
    'prep': {'prep'},
    'conj': {'conj'},
    'adv': {'adv'},
    'interj': {'interj'},
    'num': {'num', 'adj'},
    'enclit': {'conj', 'adv', 'enclitic'},
}
CASE_PREFIX = ('nom.', 'gen.', 'dat.', 'acc.', 'abl.', 'voc.', 'loc.')


def load_json(path):
    try:
        return json.loads(path.read_text(encoding='utf-8'))
    except json.JSONDecodeError as exc:
        raise ValueError(f'invalid JSON {path}: {exc}') from exc


def lexicon_paths():
    paths = list(SHARED_LEXICON.glob('*.json'))
    for book_dir in CONTENT.iterdir():
        if not book_dir.is_dir() or book_dir.name.startswith('_'):
            continue
        vocab = book_dir / 'vocabulary'
        if vocab.is_dir():
            paths.extend(vocab.glob('*.json'))
    return sorted(paths)


def load_lexicon():
    by_lemma = {}
    errors = []
    for path in lexicon_paths():
        try:
            data = load_json(path)
        except ValueError as exc:
            errors.append(str(exc))
            continue
        lemma = data.get('lemma')
        if not lemma:
            errors.append(f'{path}: missing lemma')
            continue
        by_lemma[lemma] = data
    return by_lemma, errors


def parse_groups(matches):
    out = []
    for chunk in matches.split(';'):
        lemma, _, codes_raw = chunk.partition(':')
        lemma = lemma.strip()
        codes = [c.strip() for c in codes_raw.split(',') if c.strip()]
        out.append((lemma, codes))
    return out


def code_compatible_with_pos(code, pos):
    if not code:
        return True
    if code in CODE_LITERAL_TO_POS:
        allowed = CODE_LITERAL_TO_POS[code]
        return pos in allowed
    if code.startswith(('1sg.', '2sg.', '3sg.', '1pl.', '2pl.', '3pl.', 'inf.')):
        return pos == 'verb'
    if code.startswith(('ppp.', 'pap.', 'fap.', 'fpp.')):
        return pos in {'verb', 'adj'}
    if code.startswith(CASE_PREFIX):
        return pos in {'noun', 'adj', 'pron', 'num'}
    return True


def audit_cards(by_lemma):
    errors = []
    for lemma, card in sorted(by_lemma.items()):
        missing = [k for k in REQUIRED_CARD_FIELDS if k not in card]
        if missing:
            errors.append(f'lexicon/{lemma}: missing required fields: {", ".join(missing)}')
            continue
        if not isinstance(card['glosses'], list) or not card['glosses']:
            errors.append(f'lexicon/{lemma}: glosses must be a non-empty list')
        pos = card.get('pos')
        paradigm = card.get('paradigm')
        if pos in {'noun', 'adj', 'verb', 'pron'} and not paradigm:
            errors.append(f'lexicon/{lemma}: missing paradigm for pos={pos}')
            continue
        if paradigm and isinstance(paradigm, dict):
            ptype = paradigm.get('type')
            cells = paradigm.get('cells', {})
            threshold = SPARSE_THRESHOLDS.get(ptype)
            if threshold is not None and len(cells) < threshold:
                errors.append(
                    f'lexicon/{lemma}: sparse {ptype} paradigm '
                    f'({len(cells)} < {threshold} cells)'
                )
    return errors


def markdown_paths():
    return sorted(CONTENT.glob('**/*.md'))


def audit_spans(by_lemma):
    errors = []
    for md in markdown_paths():
        text = md.read_text(encoding='utf-8')
        for m in LATIN_SPAN_RE.finditer(text):
            raw = m.group(1)
            for lemma, codes in parse_groups(raw):
                if lemma in {'', '?'}:
                    errors.append(f'{md}: unresolved lemma in data-matches="{raw}"')
                    continue
                card = by_lemma.get(lemma)
                if card is None:
                    errors.append(f'{md}: unknown lemma "{lemma}" referenced')
                    continue
                pos = card.get('pos')
                if pos is None:
                    continue
                if codes and not any(code_compatible_with_pos(c, pos) for c in codes):
                    errors.append(
                        f'{md}: parse/pos mismatch lemma="{lemma}" pos="{pos}" codes={codes}'
                    )
    return errors


def main():
    by_lemma, load_errors = load_lexicon()
    errors = []
    errors.extend(load_errors)
    errors.extend(audit_cards(by_lemma))
    errors.extend(audit_spans(by_lemma))

    if errors:
        print('latin-audit: FAIL', file=sys.stderr)
        for e in errors:
            print(f'  - {e}', file=sys.stderr)
        print(f'\n{len(errors)} error(s)', file=sys.stderr)
        raise SystemExit(1)

    print('latin-audit: OK')


if __name__ == '__main__':
    main()

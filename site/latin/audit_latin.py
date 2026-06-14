#!/usr/bin/env python3
"""Audit Latin spans and lexicon cards for phase-scaling quality gates."""
import argparse
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
    # Latin conjunctions and adverbs share a fuzzy boundary; many words
    # (ut, ubi, quam, cum, ...) are classified as both by different analyses.
    # Pronouns (illa, qua, ...) and adjectives (tot, totidem, ...) are also
    # regularly used adverbially in Latin.
    'conj': {'conj', 'adv'},
    'adv':  {'adv', 'conj', 'adj', 'pron'},
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
    """Return {id → card} keyed by the entry's `id` field (stem fallback for
    pre-migration entries), plus any load errors."""
    by_lemma = {}
    errors = []
    for path in lexicon_paths():
        try:
            data = load_json(path)
        except ValueError as exc:
            errors.append(str(exc))
            continue
        key = data.get('id') or data.get('lemma')
        if not key:
            errors.append(f'{path}: missing both id and lemma')
            continue
        by_lemma[key] = data
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
        reviewed = card.get('reviewed', True)
        if pos in {'noun', 'adj', 'verb', 'pron'} and not paradigm:
            if reviewed is not False:
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


# Codes that are POS labels, not paradigm cell keys.
_NON_CELL_CODES = frozenset({
    'adv', 'prep', 'conj', 'enclit', 'unk', 'num',
    'inf', 'interj', 'gerund', 'gerundive', 'supine',
})
# Participial prefixes — forms often absent from the basic paradigm table.
_PARTICIPLE_PREFIX = ('ppp.', 'pap.', 'fap.', 'fpp.')


def _gender_strip(code):
    """Strip a trailing .masc/.fem/.neut gender component, returning the
    stripped code or None if no such suffix exists."""
    stripped = re.sub(r'\.(masc|fem|neut)$', '', code)
    return stripped if stripped != code else None


def audit_cell_matches(by_lemma):
    """Return (genuine_misses, resolved_misses) where each is a sorted list of
    (lemma, code, count) triples.

    genuine_misses: parse codes with no matching cell even after the runtime
        gender-strip fallback — these mean the active-form highlight truly
        cannot fire and likely indicate a sparse/incomplete paradigm.

    resolved_misses: codes that miss the exact cell key but would be handled
        by the runtime gender-strip fallback in cards.js (e.g. nom.sg.fem →
        nom.sg).  Informational only; highlighting works at runtime.

    Pure-POS codes (adv, prep, conj, …) and participial codes are excluded.
    """
    from collections import Counter
    genuine: Counter = Counter()
    resolved: Counter = Counter()

    for md in markdown_paths():
        text = md.read_text(encoding='utf-8')
        for m in LATIN_SPAN_RE.finditer(text):
            for lemma, codes in parse_groups(m.group(1)):
                card = by_lemma.get(lemma)
                if not card:
                    continue
                cells = (card.get('paradigm') or {}).get('cells', {})
                if not cells:
                    continue
                for code in codes:
                    if code in _NON_CELL_CODES:
                        continue
                    if code.startswith(_PARTICIPLE_PREFIX):
                        continue
                    if '.' not in code:
                        continue
                    if code in cells:
                        continue
                    stripped = _gender_strip(code)
                    if stripped and stripped in cells:
                        resolved[(lemma, code)] += 1
                    else:
                        genuine[(lemma, code)] += 1

    def sort_key(t): return (-t[2], t[0], t[1])
    return (
        sorted(((l, c, n) for (l, c), n in genuine.items()), key=sort_key),
        sorted(((l, c, n) for (l, c), n in resolved.items()), key=sort_key),
    )


def main():
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument('--cell-check', action='store_true',
                    help='Also report parse codes with no matching paradigm cell '
                         '(active-form highlight misses)')
    args = ap.parse_args()

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

    if args.cell_check:
        genuine, resolved = audit_cell_matches(by_lemma)
        if genuine:
            print(f'\ncell-check GENUINE misses — highlight cannot fire ({len(genuine)} unique pairs):')
            for lemma, code, n in genuine:
                card = by_lemma[lemma]
                cell_keys = set((card.get('paradigm') or {}).get('cells', {}).keys())
                prefix = code.split('.')[0]
                nearby = sorted(k for k in cell_keys if k.startswith(prefix + '.'))[:3]
                hint = f'nearest: {nearby}' if nearby else '(no cells with this row)'
                print(f'  {lemma}  {code}  ×{n}  {hint}')
        else:
            print('cell-check: OK — all annotated codes resolve to a paradigm cell')
        if resolved:
            print(f'\ncell-check RESOLVED misses — runtime gender-strip handles these ({len(resolved)} unique pairs):')
            for lemma, code, n in resolved[:10]:
                stripped = _gender_strip(code)
                print(f'  {lemma}  {code} → {stripped}  ×{n}')
            if len(resolved) > 10:
                print(f'  … and {len(resolved) - 10} more')

    if errors:
        raise SystemExit(1)

    if not args.cell_check:
        print('latin-audit: OK')


if __name__ == '__main__':
    main()

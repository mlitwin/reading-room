#!/usr/bin/env python3
"""migrate_spans.py — rewrite data-matches and data-stanza to use lexicon IDs.

Replaces surface-lemma keys in span attributes with the stable `id` from the
lexicon entries. Uses parse codes to pick the right ID when a stem has entries
with more than one POS (e.g. both a verb and a noun share the same stem).

Run with --dry-run to preview without writing.
Run with --report to print a full mapping report even in non-dry-run mode.
"""
import argparse
import json
import re
import sys
from collections import defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
SHARED_LEXICON = ROOT / 'content' / '_latin-lexicon'
CONTENT = ROOT / 'content'

SPAN_RE = re.compile(
    r'(<span\b[^>]*?\bdata-matches=")([^"]+)("(?:[^>]*)?>)',
    re.DOTALL,
)
STANZA_ATTR_RE = re.compile(r'(\bdata-stanza=")([^"]+)(")')

CASE_PREFIX = ('nom.', 'gen.', 'dat.', 'acc.', 'abl.', 'voc.', 'loc.')

CODE_TO_POS_SCORE: dict[str, dict[str, int]] = {
    # Scores for how well a parse code matches a given POS.
    # Used to disambiguate when a stem has multiple entries.
}


def code_pos_score(code: str, pos: str) -> int:
    if code in ('prep',):
        return 8 if pos == 'prep' else -4
    if code in ('conj',):
        return 8 if pos == 'conj' else -4
    if code in ('adv',):
        return 8 if pos == 'adv' else -4
    if code in ('enclit',):
        return 8 if pos in ('conj', 'adv', 'enclitic') else -4
    if code in ('num',):
        return 8 if pos in ('num', 'adj') else -4
    if code.startswith(('1sg.', '2sg.', '3sg.', '1pl.', '2pl.', '3pl.', 'inf.')):
        return 8 if pos == 'verb' else -4
    if code.startswith(('ppp.', 'pap.', 'fap.', 'fpp.')):
        if pos == 'verb': return 8
        if pos == 'adj':  return 2
        return -3
    if code.startswith(CASE_PREFIX):
        return 6 if pos in ('noun', 'adj', 'pron', 'num') else -3
    return 0


def load_lexicon() -> dict[str, list[dict]]:
    """Return {stem → [card, ...]} from all shared lexicon files."""
    by_stem: dict[str, list[dict]] = defaultdict(list)
    for path in sorted(SHARED_LEXICON.glob('*.json')):
        try:
            data = json.loads(path.read_text(encoding='utf-8'))
        except json.JSONDecodeError:
            continue
        if data.get('id'):
            by_stem[path.stem].append(data)
    return by_stem


def pick_id(stem: str, codes: list[str], by_stem: dict[str, list[dict]]) -> str | None:
    candidates = by_stem.get(stem)
    if not candidates:
        return None
    if len(candidates) == 1:
        return candidates[0]['id']
    # Multiple entries for this stem — score by parse compatibility.
    best_id = None
    best_score = None
    for card in candidates:
        pos = card.get('pos', '')
        score = sum(code_pos_score(c, pos) for c in codes) if codes else 0
        if best_score is None or score > best_score:
            best_score = score
            best_id = card['id']
    return best_id


def rewrite_matches(raw: str, by_stem: dict, unmapped: list) -> str:
    """Rewrite 'lemma1:codes;lemma2:codes' replacing lemma keys with IDs."""
    parts = []
    for chunk in raw.split(';'):
        i = chunk.find(':')
        if i < 0:
            stem = chunk.strip()
            codes: list[str] = []
        else:
            stem = chunk[:i].strip()
            codes = [c.strip() for c in chunk[i+1:].split(',') if c.strip()]

        new_id = pick_id(stem, codes, by_stem)
        if new_id is None:
            unmapped.append(f'stem={stem!r} codes={codes}')
            parts.append(chunk)  # leave unchanged
        else:
            codes_str = ','.join(codes)
            parts.append(f'{new_id}:{codes_str}' if codes_str else new_id)
    return ';'.join(parts)


def rewrite_stanza(value: str, by_stem: dict) -> str:
    """Map a single stanza lemma to its ID (best-effort, no codes available)."""
    candidates = by_stem.get(value)
    if not candidates:
        return value  # leave unchanged if no entry found
    # No codes available for stanza — just pick the single entry,
    # or the verb entry if there's ambiguity (stanza tends to output verb lemmas).
    if len(candidates) == 1:
        return candidates[0]['id']
    verb = next((c for c in candidates if c.get('pos') == 'verb'), None)
    return (verb or candidates[0])['id']


def process_file(path: Path, by_stem: dict, dry_run: bool, report: bool) -> int:
    text = path.read_text(encoding='utf-8')
    unmapped: list[str] = []
    changes = 0

    def replace_span(m: re.Match) -> str:
        nonlocal changes
        prefix, raw, suffix = m.group(1), m.group(2), m.group(3)
        new_raw = rewrite_matches(raw, by_stem, unmapped)
        # Also rewrite data-stanza inside the same tag (suffix contains it).
        def rewrite_stanza_attr(sm: re.Match) -> str:
            new_val = rewrite_stanza(sm.group(2), by_stem)
            return sm.group(1) + new_val + sm.group(3)
        new_suffix = STANZA_ATTR_RE.sub(rewrite_stanza_attr, suffix)
        if new_raw != raw or new_suffix != suffix:
            changes += 1
        return prefix + new_raw + new_suffix

    new_text = SPAN_RE.sub(replace_span, text)

    if report and unmapped:
        for msg in unmapped:
            print(f'  UNMAPPED  {path.name}: {msg}')

    if new_text != text:
        if not dry_run:
            path.write_text(new_text, encoding='utf-8')
    return changes


def main():
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument('--dry-run', action='store_true')
    ap.add_argument('--report', action='store_true',
                    help='Print unmapped stems even without --dry-run')
    args = ap.parse_args()

    by_stem = load_lexicon()
    print(f'Loaded {sum(len(v) for v in by_stem.values())} entries '
          f'({len(by_stem)} unique stems)', file=sys.stderr)

    md_files = sorted(CONTENT.glob('**/*.md'))
    total_changes = 0
    for path in md_files:
        n = process_file(path, by_stem, args.dry_run, args.dry_run or args.report)
        if n:
            verb = 'would change' if args.dry_run else 'changed'
            print(f'  {verb} {n} spans in {path.relative_to(ROOT)}')
            total_changes += n

    action = 'Would update' if args.dry_run else 'Updated'
    print(f'{action} {total_changes} spans across {len(md_files)} files.')


if __name__ == '__main__':
    main()

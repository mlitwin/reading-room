#!/usr/bin/env python3
"""assign_ids.py — add a stable `id` field to every lexicon entry.

ID format: {stem}_{pos_abbrev}
  verb → _v, noun → _n, adj → _adj, adv → _adv, pron → _pron,
  conj → _conj, prep → _prep, num → _num, enclitic → _enclit,
  interj → _interj

Entries that already have an `id` field are skipped (idempotent).
Run with --dry-run to preview without writing.
"""
import argparse
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
SHARED_LEXICON = ROOT / 'content' / '_latin-lexicon'

POS_ABBREV = {
    'verb':     'v',
    'noun':     'n',
    'adj':      'adj',
    'adv':      'adv',
    'pron':     'pron',
    'conj':     'conj',
    'prep':     'prep',
    'num':      'num',
    'enclitic': 'enclit',
    'interj':   'interj',
}


def assign_id(stem: str, pos: str) -> str:
    abbrev = POS_ABBREV.get(pos, pos)
    return f'{stem}_{abbrev}'


def main():
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument('--dry-run', action='store_true',
                    help='Print what would be written without writing')
    args = ap.parse_args()

    paths = sorted(SHARED_LEXICON.glob('*.json'))
    skipped = assigned = collision = 0
    seen_ids: dict[str, str] = {}

    for path in paths:
        try:
            data = json.loads(path.read_text(encoding='utf-8'))
        except json.JSONDecodeError as exc:
            print(f'ERROR: invalid JSON {path.name}: {exc}', file=sys.stderr)
            continue

        if data.get('id'):
            skipped += 1
            seen_ids[data['id']] = path.stem
            continue

        pos = data.get('pos', '')
        stem = path.stem
        new_id = assign_id(stem, pos)

        if new_id in seen_ids:
            print(
                f'COLLISION: {path.name} would get id={new_id!r} '
                f'already used by {seen_ids[new_id]!r}',
                file=sys.stderr,
            )
            collision += 1
            continue

        seen_ids[new_id] = stem
        data['id'] = new_id
        # Insert id as first key for readability
        data = {'id': new_id, **{k: v for k, v in data.items() if k != 'id'}}

        if args.dry_run:
            print(f'  {path.name}  →  id={new_id!r}')
        else:
            path.write_text(
                json.dumps(data, indent=2, ensure_ascii=False) + '\n',
                encoding='utf-8',
            )
        assigned += 1

    print(
        f'assign_ids: {assigned} assigned, {skipped} already had id, '
        f'{collision} collision(s)',
        file=sys.stderr if collision else sys.stdout,
    )
    if collision:
        sys.exit(1)


if __name__ == '__main__':
    main()

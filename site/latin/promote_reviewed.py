#!/usr/bin/env python3
"""Promote reviewed staging lexicon cards into content/_latin-lexicon/."""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
STAGING = ROOT / 'site' / 'latin' / 'staging' / 'lexicon'
LEXICON = ROOT / 'content' / '_latin-lexicon'


def is_reviewed(path):
    try:
        data = json.loads(path.read_text(encoding='utf-8'))
    except json.JSONDecodeError as exc:
        raise SystemExit(f'promote_reviewed.py: invalid json in {path}: {exc}') from exc
    return bool(data.get('reviewed', False))


def main():
    LEXICON.mkdir(parents=True, exist_ok=True)
    promoted = 0
    skipped_unreviewed = 0
    skipped_existing = 0

    for src in sorted(STAGING.glob('*.json')):
        dst = LEXICON / src.name
        if dst.exists():
            skipped_existing += 1
            continue
        if not is_reviewed(src):
            skipped_unreviewed += 1
            continue
        src.rename(dst)
        promoted += 1

    total = len(list(LEXICON.glob('*.json')))
    print(
        f'promoted {promoted} reviewed card(s); '
        f'{skipped_unreviewed} unreviewed kept in staging; '
        f'{skipped_existing} already existed; '
        f'{total} total in shared lexicon'
    )


if __name__ == '__main__':
    main()

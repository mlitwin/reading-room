#!/usr/bin/env python3
"""Promote staged lexicon cards into content/_latin-lexicon/."""
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
STAGING = ROOT / 'site' / 'latin' / 'staging' / 'lexicon'
LEXICON = ROOT / 'content' / '_latin-lexicon'


def main():
    LEXICON.mkdir(parents=True, exist_ok=True)
    promoted = 0
    skipped_existing = 0

    for src in sorted(STAGING.glob('*.json')):
        dst = LEXICON / src.name
        if dst.exists():
            skipped_existing += 1
            continue
        src.rename(dst)
        promoted += 1

    total = len(list(LEXICON.glob('*.json')))
    print(
        f'promoted {promoted} card(s); '
        f'{skipped_existing} already existed; '
        f'{total} total in shared lexicon'
    )


if __name__ == '__main__':
    main()

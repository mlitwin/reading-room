#!/usr/bin/env python3
"""add_ppp_paradigms.py — add ppp_paradigm to existing verb lexicon entries.

Scans content/_latin-lexicon/ for verb entries that have principal_parts but
no ppp_paradigm yet, generates the standard 1st/2nd-decl PPP paradigm from
the 4th principal part, and writes it back in-place.

Usage:
    python3 add_ppp_paradigms.py [--dry-run]
"""
import argparse
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from seed_vocab import generate_ppp_paradigm

ROOT = Path(__file__).resolve().parents[2]
LEXICON_DIR = ROOT / 'content' / '_latin-lexicon'


def main():
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    ap.add_argument('--dry-run', action='store_true')
    args = ap.parse_args()

    added = skipped_has = skipped_no_pp = skipped_no_stem = errors = 0

    for path in sorted(LEXICON_DIR.glob('*.json')):
        try:
            data = json.loads(path.read_text(encoding='utf-8'))
        except json.JSONDecodeError as exc:
            print(f'ERROR {path.name}: {exc}', file=sys.stderr)
            errors += 1
            continue

        if data.get('pos') != 'verb':
            continue
        if data.get('ppp_paradigm'):
            # Already has PPP — check if vocative rows are present; if not,
            # regenerate to pick up the updated endings table.
            existing_rows = data['ppp_paradigm'].get('rows', [])
            if 'voc' in existing_rows:
                skipped_has += 1
                continue
            # Regenerate to add vocative.

        pp = data.get('principal_parts')
        if not pp:
            skipped_no_pp += 1
            continue

        ppp = generate_ppp_paradigm(pp)
        if not ppp:
            skipped_no_stem += 1
            continue

        data['ppp_paradigm'] = ppp

        if args.dry_run:
            print(f'  would add PPP to {path.name}  label={ppp["label"]!r}')
        else:
            path.write_text(
                json.dumps(data, indent=2, ensure_ascii=False) + '\n',
                encoding='utf-8',
            )
        added += 1

    action = 'Would add' if args.dry_run else 'Added'
    print(f'{action} PPP paradigm to {added} entries.')
    print(f'Skipped: {skipped_has} already had PPP, '
          f'{skipped_no_pp} no principal_parts, '
          f'{skipped_no_stem} no usable 4th part.',
          file=sys.stderr)
    if errors:
        print(f'{errors} JSON errors.', file=sys.stderr)


if __name__ == '__main__':
    main()

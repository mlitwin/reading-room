#!/usr/bin/env python3
"""expand_verb_paradigms.py — expand verb paradigms to include imperfect,
future, subjunctive, and passive indicative columns.

Only updates entries whose paradigm was auto-generated with the original
3-column set (pres.ind.act / perf.ind.act / pres.imp.act).  Entries with
manually curated or already-expanded paradigms are left untouched.

Requires Whitaker's Words data at:
    ~/Dev/github.com/mlitwin/whitakers_words/whitakers_words/data/

Usage:
    python3 expand_verb_paradigms.py [--dry-run]
"""
import argparse
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from seed_vocab import (
    LEXICON_DIR, VERB_ORIGINAL_COLS, VERB_COLS,
    load_dictline, load_inflects,
    lookup_entry, generate_verb_paradigm,
    DICTLINE_PATH, INFLECTS_PATH,
)

_VERB_COLS_SET = set(VERB_COLS)


def main():
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    ap.add_argument('--dry-run', action='store_true')
    args = ap.parse_args()

    if not DICTLINE_PATH.exists() or not INFLECTS_PATH.exists():
        sys.exit(f'Whitaker data not found at {DICTLINE_PATH.parent}')

    print('Loading DICTLINE.GEN …', file=sys.stderr)
    entries, by_stem = load_dictline()
    print('Loading INFLECTS.LAT …', file=sys.stderr)
    rules = load_inflects()

    expanded = skipped_manual = skipped_no_paradigm = skipped_no_match = 0

    for path in sorted(LEXICON_DIR.glob('*.json')):
        try:
            data = json.loads(path.read_text(encoding='utf-8'))
        except json.JSONDecodeError:
            continue

        if data.get('pos') != 'verb':
            continue

        paradigm = data.get('paradigm')
        if not paradigm:
            skipped_no_paradigm += 1
            continue

        current_cols = set(paradigm.get('cols', []))
        # Protect manually curated paradigms: if any column is outside
        # the known auto-generated set, don't touch it.
        if not current_cols.issubset(_VERB_COLS_SET):
            skipped_manual += 1
            continue
        # Skip if already fully expanded (has passive and perf cols).
        if ('pres.ind.pass' in current_cols and 'perf.ind.act' in current_cols):
            skipped_manual += 1
            continue

        lemma = (data.get('lemma') or path.stem).lower()
        entry = lookup_entry(lemma, morpheus_pos='verb', infl_class='',
                             by_stem=by_stem, entries=entries)
        if not entry:
            skipped_no_match += 1
            continue

        new_paradigm = generate_verb_paradigm(entry, lemma, rules)
        if not new_paradigm or set(new_paradigm.get('cols', [])) == VERB_ORIGINAL_COLS:
            # No improvement — INFLECTS didn't return more forms.
            skipped_no_match += 1
            continue

        data['paradigm'] = new_paradigm

        if args.dry_run:
            new_cols = set(new_paradigm['cols']) - VERB_ORIGINAL_COLS
            print(f'  {path.name}: +{sorted(new_cols)}')
        else:
            path.write_text(
                json.dumps(data, indent=2, ensure_ascii=False) + '\n',
                encoding='utf-8',
            )
        expanded += 1

    action = 'Would expand' if args.dry_run else 'Expanded'
    print(f'{action} {expanded} verb paradigms.')
    print(f'Skipped: {skipped_manual} already expanded/manual, '
          f'{skipped_no_paradigm} no paradigm, '
          f'{skipped_no_match} no DICTLINE match.',
          file=sys.stderr)


if __name__ == '__main__':
    main()

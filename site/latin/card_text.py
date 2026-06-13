#!/usr/bin/env python3
"""Emit newline-joined Latin text for a seeded Perseus card."""
import argparse
import json
from pathlib import Path


def main():
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument('--card', required=True, help='Card id as NN-card-NN (e.g. 01-card-07)')
    args = ap.parse_args()

    root = Path(__file__).resolve().parent
    card_path = root / 'sources' / 'cards' / f'book-{args.card}.json'
    if not card_path.exists():
        raise SystemExit(f'card_text.py: missing card file {card_path}')

    data = json.loads(card_path.read_text(encoding='utf-8'))
    print('\n'.join(line['latin'] for line in data.get('text', [])))


if __name__ == '__main__':
    main()

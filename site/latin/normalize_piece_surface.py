#!/usr/bin/env python3
"""Add uniform span metadata to legacy Ovid piece markdown files."""
import argparse
import re
from pathlib import Path

import apparatus_to_spans
import trim_primary

SPAN_RE = re.compile(r'<span\s+data-matches="([^"]+)"(?![^>]*\bdata-pos=)([^>]*)>(.*?)</span>', re.DOTALL)
ROOT = Path(__file__).resolve().parents[2]
DEFAULT_ROOT = ROOT / 'content' / 'ovid-metamorphoses'


def infer_pos(matches, lexicon_pos):
    primary = matches.split(';', 1)[0]
    lemma, _, codes_raw = primary.partition(':')
    codes = [c.strip() for c in codes_raw.split(',') if c.strip()]
    return apparatus_to_spans.infer_pos_from_codes(codes, lexicon_pos, lemma.strip())


def normalize_file(path, lexicon_pos):
    text = path.read_text(encoding='utf-8')

    def repl(m):
        matches = m.group(1)
        attrs = m.group(2)
        inner = m.group(3)
        pos = infer_pos(matches, lexicon_pos)
        return f'<span data-matches="{matches}" data-pos="{pos}"{attrs}>{inner}</span>'

    new_text = SPAN_RE.sub(repl, text)
    if new_text != text:
        path.write_text(new_text, encoding='utf-8')
        return True
    return False


def main():
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument('paths', nargs='*', help='Markdown files to normalize')
    args = ap.parse_args()

    paths = [Path(p) for p in args.paths] if args.paths else sorted(DEFAULT_ROOT.glob('*.md'))
    lexicon_pos = trim_primary.load_lexicon_pos()

    changed = []
    for path in paths:
        if normalize_file(path, lexicon_pos):
            changed.append(path)

    print(f'normalized {len(changed)} file(s)')
    for path in changed:
        print(path.relative_to(ROOT))


if __name__ == '__main__':
    main()

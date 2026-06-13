#!/usr/bin/env python3
"""Extract sorted unique lemmas from a spans file."""
import argparse
import re
from pathlib import Path

LATIN_SPAN_RE = re.compile(r'data-matches="([^"]+)"(?:\s+data-pos="([^"]+)")?')


def iter_lemmas(text):
    seen = set()
    for m in LATIN_SPAN_RE.finditer(text):
        pos = m.group(2) or ''
        for chunk in m.group(1).split(';'):
            lemma = chunk.split(':', 1)[0].strip()
            if not lemma or lemma == '?':
                continue
            key = (lemma, pos)
            if key not in seen:
                seen.add(key)
                yield lemma, pos


def main():
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument('spans_file')
    args = ap.parse_args()

    text = Path(args.spans_file).read_text(encoding='utf-8')
    for lemma, pos in sorted(iter_lemmas(text)):
        if pos:
            print(f'{lemma}\t{pos}')
        else:
            print(lemma)


if __name__ == '__main__':
    main()

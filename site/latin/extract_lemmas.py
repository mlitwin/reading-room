#!/usr/bin/env python3
"""Extract sorted unique lemmas from a spans file."""
import argparse
import re
from pathlib import Path

LATIN_SPAN_RE = re.compile(r'data-matches="([^"]+)"')


def iter_lemmas(text):
    seen = set()
    for m in LATIN_SPAN_RE.finditer(text):
        for chunk in m.group(1).split(';'):
            lemma = chunk.split(':', 1)[0].strip()
            if not lemma or lemma == '?':
                continue
            if lemma not in seen:
                seen.add(lemma)
                yield lemma


def main():
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument('spans_file')
    args = ap.parse_args()

    text = Path(args.spans_file).read_text(encoding='utf-8')
    for lemma in sorted(iter_lemmas(text)):
        print(lemma)


if __name__ == '__main__':
    main()

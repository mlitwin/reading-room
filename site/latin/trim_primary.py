#!/usr/bin/env python3
"""trim_primary.py — keep only the first lemma in each data-matches attr.

Reads a `<div class="latin-passage">` block on stdin (the seed.py output),
rewrites each `data-matches="lemma1:parses;lemma2:parses;..."` to drop
everything after the first `;` group. Useful as a first pass before
hand-curation to cut the v1 vocab-card volume down to one card per word.
"""
import re
import sys

LATIN_SPAN_RE = re.compile(r'data-matches="([^"]+)"')

def trim(matches_str):
    # Keep just the first `;`-separated lemma group.
    return matches_str.split(';', 1)[0]

def main():
    text = sys.stdin.read()
    out = LATIN_SPAN_RE.sub(lambda m: f'data-matches="{trim(m.group(1))}"', text)
    sys.stdout.write(out)

if __name__ == '__main__':
    main()

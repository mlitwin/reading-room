#!/usr/bin/env python3
"""Wiktionary lookup over the committed cache (site/latin/sources/wiktionary-cache.json).

The cache is built by wiktionary_extract.py from the kaikki.org wiktextract dump
and already speaks this repo's vocabulary. Shape:

  entries:  norm(headword) -> [entry, …]      one per Wiktionary POS/etymology
    entry = {word (macronized), pos, etym?, proper?, gender?, plural_only?,
             deponent?, class?, head, principal_parts?, comparative?,
             superlative?, glosses?, form_of?: [{lemma, codes}], alt_of?,
             cells?: {parse_code: [form, …]}}
  surfaces: norm(attested surface) -> [[key, entry index, [codes]], …]

Only card headwords and attested surfaces are cached. For any other word, the
full preprocessed file downloads/wiktionary/latin-compact.jsonl.gz (from
`wiktionary_extract.py build`) is scanned when present.

Usage:
    from wiktionary_lookup import lookup, analyses, norm
    lookup("populus")            -> [entry (populus, people), entry (pōpulus, poplar)]
    lookup("populus", pos="noun")
    analyses("Veneris")          -> [{word, pos, etym, codes, via}, …]
"""
import gzip
import json
import sys
from functools import lru_cache
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from wiktionary_extract import CACHE, LATIN_COMPACT, norm  # noqa: E402,F401


@lru_cache(maxsize=1)
def _cache():
    return json.loads(CACHE.read_text()) if CACHE.exists() else {"entries": {}, "surfaces": {}}


@lru_cache(maxsize=1)
def _full():
    """norm -> [entry] over every Latin entry (slow first call; optional)."""
    out = {}
    if LATIN_COMPACT.exists():
        with gzip.open(LATIN_COMPACT, "rt", encoding="utf-8") as f:
            for line in f:
                e = json.loads(line)
                out.setdefault(norm(e["word"]), []).append(e)
    return out


def lookup(word, pos=None, full=False):
    """Entries whose headword normalizes to `word` (optionally filtered by pos)."""
    k = norm(word)
    hits = _cache()["entries"].get(k)
    if hits is None and full:
        hits = _full().get(k)
    hits = hits or []
    return [e for e in hits if pos is None or e["pos"] == pos]


def analyses(surface):
    """Every reading Wiktionary gives an attested surface: paradigm cells of
    cached lemmas ("cell") and explicit form-of senses ("form_of")."""
    k = norm(surface)
    out = []
    entries = _cache()["entries"]
    for key, i, codes in _cache()["surfaces"].get(k, []):
        e = entries[key][i]
        if codes:
            out.append({"word": e["word"], "pos": e["pos"], "etym": e.get("etym"),
                        "codes": codes, "via": "cell"})
        elif key == k and e.get("glosses") and not e.get("cells"):
            # Invariable headword (adverb, preposition, …): the surface is the lemma.
            out.append({"word": e["word"], "pos": e["pos"], "etym": e.get("etym"),
                        "codes": ["inv"], "via": "headword"})
        for fo in e.get("form_of", []):
            out.append({"word": fo["lemma"], "pos": e["pos"], "etym": None,
                        "codes": fo["codes"], "via": "form_of"})
    return out


if __name__ == "__main__":
    for w in sys.argv[1:]:
        print(f"### {w}")
        for e in lookup(w, full=True):
            print(f"  {e['word']} [{e['pos']}{' etym ' + e['etym'] if e.get('etym') else ''}] {e.get('head', '')}")
            for g in e.get("glosses", [])[:3]:
                print(f"    - {g}")
        for a in analyses(w):
            print(f"  as form: {a['word']} {a['pos']} {','.join(a['codes'])} ({a['via']})")

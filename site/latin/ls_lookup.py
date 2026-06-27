#!/usr/bin/env python3
"""Lewis & Short 1879 lookup over the vendored IohannesArnold/lewis-short-json.

Headwords live in the `key` field (e.g. "limosus"); the macron orthography and
the definition prose are in `main_notes`; `part_of_speech` is usually present.

Usage:
    from ls_lookup import lookup
    lookup("limosus")  -> list of {key, orthography, pos, notes}
"""
import json
import re
import unicodedata
from functools import lru_cache
from pathlib import Path

LS = Path(__file__).resolve().parent / "sources" / "lewis-short-json"


def norm(s):
    s = unicodedata.normalize("NFD", s or "")
    s = "".join(c for c in s if unicodedata.category(c) != "Mn")
    return re.sub(r"[^a-z]", "", s.lower().replace("j", "i").replace("v", "u"))


@lru_cache(maxsize=32)
def _letter(L):
    f = LS / f"ls_{L.upper()}.json"
    return json.loads(f.read_text()) if f.exists() else []


def lookup(word):
    nw = norm(word)
    if not nw:
        return []
    out = []
    for e in _letter(word[0]):
        key = e.get("key", "") or ""
        # `key` carries a trailing disambiguation digit on homographs (limus1).
        if norm(key).rstrip("0123456789") == nw or norm(key) == nw:
            mn = (e.get("main_notes", "") or "").strip()
            orth = mn.split(",")[0][:40] if mn else ""
            out.append({
                "key": key,
                "orthography": orth,
                "pos": e.get("part_of_speech") or "",
                "notes": mn[:500],
            })
    return out


if __name__ == "__main__":
    import sys
    for w in sys.argv[1:]:
        print(f"### {w}")
        for r in lookup(w):
            print(f"  [{r['key']}] {r['orthography']} | {r['pos']}")
            print(f"    {r['notes'][:300]}")

#!/usr/bin/env python3
"""Add every reading the lexicon yields to each token (the fixer for C13).

Soft disambiguation: a token's data-matches lists every lemma its surface can
be a form of; the editorial choice only decides which tab is in front. When a
card is added or regenerated, existing tokens can become forms of it — the
C13 validation warning. This adds those readings as back tabs, leaving the
current first tab alone.

    python3 site/latin/sync_readings.py [--dry-run]
    python3 site/latin/sync_readings.py --first SURFACE:OLD:NEW [...]

  --first   also switch the first tab from OLD to NEW on tokens with that
            surface (normalized: lowercase, j->i, v->u), e.g. alta:alo_v:altus_adj
  --drop    SURFACE:LEMMA removes a reading that is not possible for the token

Rewrites each content/<book>/manuscript.latin.json; follow with `make build`.
"""
import collections
import json
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
from retarget_lemma import CONTENT, load_cards, readings, surface_codes, write_readings  # noqa: E402
from wiktionary_extract import norm  # noqa: E402


def surface_index(cards):
    idx = collections.defaultdict(dict)
    for cid, (card, _) in cards.items():
        for s, codes in surface_codes(card).items():
            idx[s][cid] = codes
    return idx


def sync_token(t, idx, cards, first=None, drop=frozenset()):
    """Return the number of readings added (0 and unchanged if nothing to do)."""
    s = norm(t["surface"])
    old = readings(t)
    parts = [p for p in old if (s, p[0]) not in drop]
    have = {i for i, _ in parts}
    new = [[cid, codes] for cid, codes in sorted(idx.get(s, {}).items())
           if cid not in have and (s, cid) not in drop]
    primary = t.get("selected_lemma_id") or t["lemma_id"]
    selected_by = None
    if first and (s, primary) in first:
        primary = first[(s, primary)]
        selected_by = "editor"   # --first is an editorial decision
    if primary not in have | {c for c, _ in new}:
        primary = (parts or new)[0][0]
    if not new and parts == old and primary == (t.get("selected_lemma_id") or t["lemma_id"]):
        return 0
    allp = sorted(parts + new, key=lambda p: p[0] != primary)
    pos = cards[primary][0]["pos"] if primary in cards else None
    write_readings(t, allp, primary, (primary, pos) if pos else None, selected_by)
    return len(new)


def main():
    argv = sys.argv[1:]
    first, drop = {}, set()
    for flag, store in (("--first", first), ("--drop", drop)):
        while flag in argv:
            i = argv.index(flag)
            spec = argv[i + 1].split(":")
            del argv[i:i + 2]
            if flag == "--first":
                store[(norm(spec[0]), spec[1])] = spec[2]
            else:
                store.add((norm(spec[0]), spec[1]))
    dry = "--dry-run" in argv
    cards = load_cards()
    idx = surface_index(cards)
    total = 0
    for ms in sorted(CONTENT.glob("*/manuscript.latin.json")):
        raw = ms.read_text()
        doc = json.loads(raw)
        added = 0
        for line in doc["lines"]:
            for t in line["tokens"]:
                if t.get("kind") == "word" and t.get("pos_hint") != "enclitic":
                    added += sync_token(t, idx, cards, first, drop)
        total += added
        print(f"{ms.parent.name}: {added} readings added")
        if not dry:
            ms.write_text(json.dumps(doc, indent=2, ensure_ascii=False) + ("\n" if raw.endswith("\n") else ""))
    return total


if __name__ == "__main__":
    main()

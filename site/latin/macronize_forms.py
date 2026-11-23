#!/usr/bin/env python3
"""Macronize every attested Latin form, per reading, for the popover's
pronunciation line.

The texts are unmarked (mortale), but pronunciation needs vowel length
(mortāle: mor-TAH-leh, not MOR-ta-leh). For each word token in each
manuscript.latin.json and each reading it offers (lemma id + parse codes, the
popover's tabs), look the form up in the Wiktionary entry the audit matches
that card to (audit_wiktionary.audit_cards) and keep the macronized spelling.

Writes content/_language/latin/macrons.json:

    { card_id: { unmarked_surface: "mortāle"                      # every parse agrees
                                  | {"nom.sg": "rosa", "abl.sg": "rosā"} } }

build.js attaches each card's map to the runtime lexicon as `macrons`;
site/reader/cards.js pronounces the tapped form from it (falling back to the
headword). Re-run after changing tokens or cards:

    python3 site/latin/macronize_forms.py
"""
import json
import sys
from collections import defaultdict
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
import audit_wiktionary as audit  # noqa: E402
from wiktionary_lookup import lookup, norm  # noqa: E402

ROOT = HERE.parents[1]
OUT = ROOT / "content" / "_language" / "latin" / "macrons.json"


def readings(t):
    """[(card id, [parse codes])] — the token's tabs."""
    dm = t.get("__data_matches")
    if dm:
        out = []
        for chunk in dm.split(";"):
            if not chunk:
                continue
            cid, _, parses = chunk.partition(":")
            out.append((cid, [p for p in parses.split(",") if p]))
        return out
    return [(t["lemma_id"], t.get("parses", []))] if t.get("lemma_id") else []


def entry_cells(entry):
    """Wiktionary cells keyed by gender-free code, each a list of forms."""
    cells = defaultdict(list)
    for code, forms in (entry.get("cells") or {}).items():
        for f in forms:
            if f not in cells[audit.strip_gender(code)]:
                cells[audit.strip_gender(code)].append(f)
    return cells


def macronize(surface, parse, entry):
    """The macronized spelling of `surface` as `parse` of `entry`, or None."""
    key = norm(surface)
    cells = entry_cells(entry)

    def pick(forms):
        hits = [f for f in forms if norm(f) == key]
        return hits[0] if hits else None

    code = audit.strip_gender(parse)
    found = pick(cells.get(code, []))
    if not found and code.startswith("voc."):
        found = pick(cells.get("nom." + code[4:], []))
    if not found and "." in code and code.split(".")[0] in audit.PARTICIPLE_PREFIX:
        found = pick(cells.get(code.split(".", 1)[1], []))
    if found:
        return found
    # The parse names no cell (participles, odd codes): any cell spelled the
    # same, provided they all agree on length.
    anywhere = {f for forms in cells.values() for f in forms if norm(f) == key}
    if len(anywhere) == 1:
        return anywhere.pop()
    if norm(entry["word"]) == key:
        return entry["word"]  # invariant words, and the headword form itself
    return None


def by_surface(surface, parse):
    """Fallback when the card's entry doesn't give the form (vōs under tu,
    nec under neque, cards Wiktionary lacks): the form's own Wiktionary
    entries — the cell for this parse if they agree on one, else any spelling,
    only if every one agrees on its vowel lengths."""
    key = norm(surface)
    entries = list(lookup(surface))
    # Form-of entries (vestra → vester) point at the lemma whose table has it.
    for target in {fo["lemma"] for e in entries for fo in e.get("form_of", [])}:
        entries += [e for e in lookup(target) if e not in entries]
    for_parse = {f for f in (macronize(surface, parse, e) for e in entries if e.get("cells")) if f}
    if len(for_parse) == 1:
        return for_parse.pop()
    found = set()
    for e in entries:
        if norm(e["word"]) == key:
            found.add(e["word"])
        for forms in (e.get("cells") or {}).values():
            found |= {f for f in forms if norm(f) == key}
    found = {f.lower() for f in found} if len({f.lower() for f in found}) == 1 else found
    return found.pop() if len(found) == 1 else None


def main():
    cards = audit.load_cards()
    _, matched = audit.audit_cards(cards)
    out = defaultdict(dict)        # card id -> unmarked surface -> {parse: form}
    seen = missing = 0
    for ms in sorted((ROOT / "content").glob("*/manuscript.latin.json")):
        for line in json.loads(ms.read_text())["lines"]:
            for t in line["tokens"]:
                if t.get("kind") != "word" or t.get("pos_hint") == "enclitic":
                    continue
                surface = t["surface"]
                for cid, parses in readings(t):
                    entry = matched.get(cid)
                    for parse in parses or [""]:
                        seen += 1
                        form = (macronize(surface, parse, entry) if entry else None) or by_surface(surface, parse)
                        if not form:
                            missing += 1
                            continue
                        out[cid].setdefault(norm(surface), {})[parse] = form

    doc = {}
    for cid in sorted(out):
        doc[cid] = {}
        for surf, by_parse in sorted(out[cid].items()):
            forms = set(by_parse.values())
            doc[cid][surf] = forms.pop() if len(forms) == 1 else dict(sorted(by_parse.items()))

    with OUT.open("w", encoding="utf-8") as f:
        f.write("{\n")
        items = list(doc.items())
        for i, (cid, v) in enumerate(items):
            sep = "," if i < len(items) - 1 else ""
            f.write(f"{json.dumps(cid)}: {json.dumps(v, ensure_ascii=False, separators=(',', ':'))}{sep}\n")
        f.write("}\n")
    print(f"{seen - missing}/{seen} token readings macronized; {len(doc)} cards -> {OUT.relative_to(ROOT)}")


if __name__ == "__main__":
    main()

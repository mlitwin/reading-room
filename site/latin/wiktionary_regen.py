#!/usr/bin/env python3
"""Regenerate a card's paradigm (and head / principal parts) from Wiktionary.

For cards whose generated paradigm is wrong (wrong conjugation or declension
class, conflated homographs — see wiktionary-audit.md W6), rebuild the inflection
from the Wiktionary entry the audit matches the card to. Kept: id, lemma,
glosses, notes, gender. Replaced: paradigm, ppp_paradigm, head, principal_parts.
alt_forms keeps only forms Wiktionary gives this lemma (generation contaminated
some with a homograph's forms) and that the new cells don't already hold.

Card orthography: macrons are stripped (cards are unmarked); Wiktionary's i/v
spelling is kept. Cells use only parse atoms grammar.json defines (no supine).

Usage:
    python3 site/latin/wiktionary_regen.py ID [ID …] [--glosses] [--dry-run]
    python3 site/latin/wiktionary_regen.py --new ID [ID …]   # create shared cards

  --glosses   also replace the card's glosses with Wiktionary's (for cards whose
              glosses belong to a different word, e.g. adsum_v carrying assumo's)
  --new       create the cards in lexicon.json from Wiktionary (implies --glosses)
"""
import json
import re
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
import audit_wiktionary as audit  # noqa: E402
from wiktionary_extract import strip_marks  # noqa: E402

ROOT = HERE.parents[1]
GRAMMAR = ROOT / "content" / "_language" / "latin" / "grammar.json"

MAX_GLOSSES = 5
INVARIANT_POS = {"adv", "conj", "prep", "interj"}
PERSONS = ["1sg", "2sg", "3sg", "1pl", "2pl", "3pl"]
CASE_ROWS = ["nom", "gen", "dat", "acc", "abl", "voc"]
ADJ_COLS = ["sg.masc", "sg.fem", "sg.neut", "pl.masc", "pl.fem", "pl.neut"]
# Column order of the existing verb cards (amo_v), finite tense.mood.voice.
VERB_COLS = ["pres.ind.act", "imperf.ind.act", "fut.ind.act", "perf.ind.act", "pres.subj.act",
             "imperf.subj.act", "pres.imp.act", "pres.ind.pass", "imperf.ind.pass", "fut.ind.pass",
             "plup.ind.act", "futperf.ind.act", "perf.subj.act", "plup.subj.act", "pres.subj.pass",
             "imperf.subj.pass", "pres.imp.pass", "fut.imp.act", "fut.imp.pass"]


def atoms():
    g = json.loads(GRAMMAR.read_text())
    cats = {c["id"]: [v["id"] for v in c["values"]] for c in g["categories"]}
    out = {v for vs in cats.values() for v in vs}
    out |= {p + n for p in cats["person"] for n in cats["number"]}
    return out


def plain(forms):
    out = []
    for f in forms:
        p = strip_marks(f)
        if p not in out:
            out.append(p)
    return out


def cell_value(forms):
    return forms[0] if len(forms) == 1 else forms


def build_cells(entry, ok_atoms):
    cells = {}
    for code, forms in (entry.get("cells") or {}).items():
        if all(a in ok_atoms for a in code.split(".")):
            cells[code] = plain(forms)
    return cells


def decline_us(nom):
    """Regular 1st/2nd-declension adjective cells from a nom.sg.masc in -us."""
    stem = nom[:-2]
    endings = {"masc": ["us", "i", "o", "um", "o", "e", "i", "orum", "is", "os", "is", "i"],
               "fem": ["a", "ae", "ae", "am", "a", "a", "ae", "arum", "is", "as", "is", "ae"],
               "neut": ["um", "i", "o", "um", "o", "um", "a", "orum", "is", "a", "is", "a"]}
    keys = [f"{c}.{n}" for n in ("sg", "pl") for c in CASE_ROWS]
    return {f"{k}.{g}": stem + e for g, ends in endings.items() for k, e in zip(keys, ends)}


def first(cells, *codes):
    for c in codes:
        if cells.get(c):
            return cells[c][0]
    return None


def verb_card(card, entry, cells):
    deponent = bool(entry.get("deponent"))
    v = "pass" if deponent else "act"
    finite = {k: x for k, x in cells.items() if k[0].isdigit()}
    ppp = {k: x for k, x in cells.items() if k.startswith("ppp.")}
    other = {k: x for k, x in cells.items() if not k[0].isdigit() and not k.startswith("ppp.")}
    cols = [c for c in VERB_COLS if any(f"{p}.{c}" in finite for p in PERSONS)]
    cols += sorted({k.split(".", 1)[1] for k in finite} - set(cols))
    card["paradigm"] = {"type": "verb", "rows": PERSONS, "cols": cols,
                        "cells": {k: cell_value(x) for k, x in {**finite, **other}.items()}}
    if len(ppp) == 1 and strip_marks(next(iter(ppp.values()))[0]).endswith("us"):
        # Only the nominative came through (no participle entry to fold in);
        # -us participles decline regularly (1st/2nd declension).
        ppp = {f"ppp.{k}": [v] for k, v in decline_us(next(iter(ppp.values()))[0]).items()}
    if ppp:
        card["ppp_paradigm"] = {"type": "ppp", "rows": CASE_ROWS, "cols": ADJ_COLS,
                                "cells": {k: cell_value(x) for k, x in ppp.items()}}
    else:
        card.pop("ppp_paradigm", None)
    # Principal parts: 1sg present, present infinitive, perfect, supine
    # (deponents: perfect participle + sum, no supine slot).
    pp = [first(cells, f"1sg.pres.ind.{v}") or strip_marks(entry["word"]),
          first(cells, f"inf.pres.{v}")]
    if deponent:
        part = first(cells, "ppp.nom.sg.masc")
        pp.append(f"{part} sum" if part else None)
    else:
        pp.append(first(cells, "1sg.perf.ind.act"))
        # The 4th head form is a supine only when the head line says so
        # (adsum's is a future participle).
        sup = [strip_marks(f) for f in (entry.get("principal_parts") or [])[3:4]]
        has_sup = re.search(r"\bsupine \w", entry.get("head", "").split(";")[0])
        pp.append(sup[0] if sup and has_sup and " " not in sup[0] else None)
    pp = [p for p in pp if p]
    card["principal_parts"] = pp
    card["head"] = ", ".join(pp)


def nominal_card(card, entry, cells):
    p = card.get("paradigm") or {}
    if card["pos"] == "noun":
        cols = ["pl"] if entry.get("plural_only") else ["sg", "pl"]
        if entry.get("plural_only"):
            card["defective"] = True  # plurale tantum: no singular cells
        cells = {k: x for k, x in cells.items() if k.split(".")[1] in cols}
    else:
        cols = p.get("cols") or ADJ_COLS
        cells = {k: x for k, x in cells.items() if not k.startswith(("comp.", "superl."))}
        # Keep existing degree cells (Wiktionary keeps them on separate entries).
        cells.update({k: v if isinstance(v, list) else [v] for k, v in (p.get("cells") or {}).items()
                      if k.startswith(("comp.", "superl."))})
    card["paradigm"] = {"type": p.get("type") or ("noun" if card["pos"] == "noun" else "adj"),
                        "rows": p.get("rows") or CASE_ROWS[:5], "cols": cols,
                        "cells": {k: cell_value(x) for k, x in cells.items()}}
    if entry.get("head"):
        card["head"] = head_line(card, entry)


def head_line(card, entry):
    """Dictionary line in the cards' style: 'lacus, -us, m.' / 'asper, -era, -erum'."""
    if card["pos"] != "noun":
        return strip_marks(entry["head"].split(";")[0].split(" (")[0]) + (
            ", " + ", ".join(strip_marks(x) for x in _adj_endings(entry)) if _adj_endings(entry) else "")
    gen = (entry.get("cells") or {}).get("gen.pl" if entry.get("plural_only") else "gen.sg", [""])[0]
    g = {"masc": "m.", "fem": "f.", "neut": "n."}
    gs = " or ".join(g[x] for x in entry.get("gender", []) if x in g)
    pl = " pl." if entry.get("plural_only") else ""
    return f"{strip_marks(entry['word'])}, {strip_marks(gen)}, {gs}{pl}".rstrip(", ")


def _adj_endings(entry):
    c = entry.get("cells") or {}
    fem, neut = c.get("nom.sg.fem", [None])[0], c.get("nom.sg.neut", [None])[0]
    masc = c.get("nom.sg.masc", [None])[0]
    if fem and neut and fem != masc:
        return [fem, neut]
    if neut and neut != masc:
        return [neut]
    gen = c.get("gen.sg.masc", [None])[0]
    return [f"gen. {gen}"] if gen else []


def regen(card, glosses=False):
    entries = [e for e in audit.lookup(card["lemma"]) if e.get("cells") or e.get("glosses")]
    same = [e for e in entries if e["pos"] in audit.POS_COMPAT.get(card["pos"], {card["pos"]})]
    if not same:
        raise SystemExit(f"{card['id']}: no Wiktionary entry with pos {card['pos']}")
    entry = audit.best_entry(card, same)
    cells = build_cells(entry, atoms())
    if card["pos"] == "noun" and not card.get("gender") and entry.get("gender"):
        g = entry["gender"]
        card["gender"] = g[0] if len(g) == 1 else g
    if card["pos"] in INVARIANT_POS:
        card["head"] = strip_marks(entry["word"])
    elif card["pos"] == "verb":
        verb_card(card, entry, cells)
    else:
        nominal_card(card, entry, cells)
    if glosses and entry.get("glosses"):
        card["glosses"] = entry["glosses"][:MAX_GLOSSES]
    if card.get("alt_forms"):
        have = {audit.norm(x) for v in audit.card_cells(card).values() for x in v}
        wikt = {audit.norm(f) for fs in (entry.get("cells") or {}).values() for f in fs}
        keep = [a for a in card["alt_forms"] if audit.norm(a) in wikt and audit.norm(a) not in have]
        if keep:
            card["alt_forms"] = keep
        else:
            card.pop("alt_forms")
    return entry


def main():
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    glosses, dry = "--glosses" in sys.argv, "--dry-run" in sys.argv
    if not args:
        sys.exit(__doc__)
    lex = json.loads(audit.LEXICON.read_text())
    by_id = {e["id"]: e for e in lex["lemmata"]}
    if "--new" in sys.argv:
        # ID form for new shared cards: lemma_posabbrev (gender from Wiktionary).
        for cid in args:
            if cid in by_id:
                raise SystemExit(f"{cid}: already exists")
            lemma, abbrev = cid.rsplit("_", 1)
            pos = {v: k for k, v in audit.POS_SUFFIX.items()}[abbrev]
            stub = {"id": cid, "lemma": lemma, "pos": pos, "glosses": []}
            lex["lemmata"].append(stub)
            by_id[cid] = stub
        glosses = True
    lex_dirty = False
    for cid in args:
        if cid in by_id:
            card, path = by_id[cid], None
        else:
            hits = list((ROOT / "content").glob(f"*/vocabulary/{cid}.json"))
            if not hits:
                raise SystemExit(f"{cid}: no such card")
            path = hits[0]
            card = json.loads(path.read_text())
        before = len(audit.card_cells(card))
        entry = regen(card, glosses)
        n, wrong = audit.compare_cells(card, entry)
        print(f"{cid}: {before} -> {len(audit.card_cells(card))} cells; head '{card['head']}'; "
              f"vs Wiktionary {n - len(wrong)}/{n}")
        if dry:
            continue
        if path:
            path.write_text(json.dumps(card, indent=2, ensure_ascii=False) + "\n")
        else:
            lex_dirty = True
    if lex_dirty:
        audit.LEXICON.write_text(json.dumps(lex, indent=2, ensure_ascii=False) + "\n")


if __name__ == "__main__":
    main()

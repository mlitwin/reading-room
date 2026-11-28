#!/usr/bin/env python3
"""Add the syncopated (contracted) perfect-system forms to verb cards.

A&G §181: in tenses formed on the perfect stem, v between two vowels is often
lost and the vowels contract —

    -āvi-/-ēvi-/-ōvi- + s   amāvisse → amāsse, flēvistis → flēstis, nōvisse → nōsse
    -āve-/-ēve-/-ōve- + r   amāverat → amārat, nōverat → nōrat, amāverim → amārim
    -īvi-                   audīvit → audiit, audīvisse → audiisse → audīsse
    -īve-                   audīverat → audierat, petīvēre → petiēre

The texts use these freely (Ovid: animasse, mutastis, ararat, finierat, nosse),
and a token only highlights its paradigm cell when its spelling is in it. The
contractions are added to each perfect-system cell as variants after the full
form, so the grid still leads with the full form. A contraction that is already
another form of the same verb (amāris is the present passive, amāre the
infinitive) is not added, nor one that is a form of another word (pāverat →
parat is parō's; ignōverat → ignōrat is ignōrō's).

Applied to every card by `make latin-syncope`; wiktionary_regen.py applies it
to each card it rebuilds.

Usage:
    python3 site/latin/syncope.py [--dry-run]
"""
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
LEXICON = ROOT / "content" / "_language" / "latin" / "lexicon.json"

# Cells built on the perfect stem (active; the passive is periphrastic).
PERFECT_SYSTEM = re.compile(r"^(?:[123](?:sg|pl)\.(?:perf|plup|futperf)\.(?:ind|subj)|inf\.perf)\.act$")
# A perfect in -āvī/-ēvī/-ōvī/-īvī (v or consonantal u): the stem up to the v.
VI_PERFECT = re.compile(r"^(.*[aeoi])([vu])i$", re.IGNORECASE)


def _forms(v):
    return [] if v is None else (list(v) if isinstance(v, list) else [v])


def _norm(s):
    return s.lower().replace("j", "i").replace("v", "u")


def contractions(form, stem):
    """The §181 contractions of `form`, a form built on perfect stem `stem`
    (`stem` ends in the v: "amav", "audiv", "uiolau")."""
    if not form.lower().startswith(stem.lower()) or len(stem) < 2:
        return []
    base, vowel, ending = form[:len(stem) - 1], stem[-2].lower(), form[len(stem):]
    out = []
    if vowel in "aeo":
        if ending.startswith("is"):                 # amāvisse → amāsse, amāvistī → amāstī
            out.append(base + ending[1:])
        elif ending.startswith("er") and ending not in ("ero", "ere"):
            out.append(base + ending[1:])           # amāverat → amārat, amāvērunt → amārunt
    elif vowel == "i":
        if ending.startswith(("i", "e")):           # audīvit → audiit, audīverat → audierat
            out.append(base + ending)
        if ending.startswith("is"):                 # audīvisse → audīsse
            out.append(base + ending[1:])
    return out


def perfect_stems(cells):
    stems = []
    for f in _forms(cells.get("1sg.perf.ind.act")):
        m = VI_PERFECT.match(f)
        if m:
            stems.append(m.group(1) + m.group(2))
    return stems


def card_forms(card):
    return {_norm(f) for p in ("paradigm", "ppp_paradigm")
            for v in ((card.get(p) or {}).get("cells") or {}).values() for f in _forms(v)}


def syncopate_card(card, others=frozenset()):
    """Add contractions to the card's perfect-system cells in place, skipping
    any in `others` (other cards' forms, normalized). Returns the number of
    forms added."""
    if card.get("pos") != "verb":
        return 0
    cells = (card.get("paradigm") or {}).get("cells") or {}
    stems = perfect_stems(cells)
    if not stems:
        return 0
    # Forms the verb already has elsewhere (before any are added): a
    # contraction may repeat across cells (amārit: perf. subj. and fut. perf.).
    own = card_forms(card)
    added = 0
    for code in [c for c in cells if PERFECT_SYSTEM.match(c)]:
        cur = _forms(cells[code])
        have = {_norm(f) for f in cur}
        new = []
        for f in cur:
            for stem in stems:
                for c in contractions(f, stem):
                    if _norm(c) not in have and _norm(c) not in own and _norm(c) not in others:
                        have.add(_norm(c))
                        new.append(c)
        if new:
            cells[code] = cur + new
            added += len(new)
    return added


def main():
    dry = "--dry-run" in sys.argv[1:]
    lexicon = json.loads(LEXICON.read_text())
    overlays = {f: json.loads(f.read_text()) for f in sorted((ROOT / "content").glob("*/vocabulary/*.json"))}
    all_cards = lexicon["lemmata"] + list(overlays.values())
    owners = {}
    for card in all_cards:
        for f in card_forms(card):
            owners.setdefault(f, set()).add(card["id"])

    class others:  # noqa: N801 — `form in others(card)`: a form of another card
        def __init__(self, card):
            self.id = card["id"]

        def __contains__(self, form):
            return bool(owners.get(form, set()) - {self.id})

    total = cards = 0
    for card in lexicon["lemmata"]:
        n = syncopate_card(card, others(card)) if card.get("pos") == "verb" else 0
        total += n
        cards += bool(n)
    if not dry and total:
        LEXICON.write_text(json.dumps(lexicon, indent=2, ensure_ascii=False) + "\n")
    for f, card in overlays.items():
        n = syncopate_card(card, others(card)) if card.get("pos") == "verb" else 0
        if n:
            total += n
            cards += 1
            if not dry:
                f.write_text(json.dumps(card, indent=2, ensure_ascii=False) + "\n")
    print(f"{'would add' if dry else 'added'} {total} contracted forms to {cards} verb cards")


if __name__ == "__main__":
    main()

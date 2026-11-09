#!/usr/bin/env python3
"""Fill the display/ordering fields on every card: headword, homograph, freq.

  headword   macronized headword from the Wiktionary entry the audit matches the
             card to (only when it is the same word: unmarked forms agree)
  homograph  for cards sharing an unmarked lemma + pos: 1 for the base id,
             N for an id `{lemma}{N}_{pos}` (populus_n / populus2_n)
  freq       Whitaker DICTLINE frequency letter (A very frequent … F rare)

Idempotent; re-run after adding cards. Writes the shared lexicon and every
book overlay in place.

    python3 site/latin/annotate_cards.py [--dry-run]
"""
import json
import re
import sys
from collections import defaultdict
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
import audit_wiktionary as audit  # noqa: E402
from wiktionary_extract import norm  # noqa: E402

ROOT = HERE.parents[1]
DICTLINE_POS = {"noun": "N", "verb": "V", "adj": "ADJ", "adv": "ADV", "pron": "PRON",
                "prep": "PREP", "conj": "CONJ", "interj": "INTERJ", "num": "NUM"}
HOMOGRAPH_ID = re.compile(r"^(.*?)(\d+)_([a-z]+)$")


def dictline_freq():
    """(unmarked first stem, DICTLINE pos) -> most frequent letter seen."""
    try:
        import seed_vocab as sv
        entries, _ = sv.load_dictline()
    except Exception as err:  # Whitaker clone absent: freq stays unset
        print(f"freq: DICTLINE unavailable ({err})", file=sys.stderr)
        return {}
    out = {}
    for e in entries:
        props = e.get("properties") or []
        if len(props) < 4 or not e.get("stems"):
            continue
        key = (norm(e["stems"][0]), e["pos"])
        letter = props[3]
        if letter in "ABCDEF" and (key not in out or letter < out[key]):
            out[key] = letter
    return out


def card_freq(card, table):
    """Look the card up by its first principal part / lemma stem."""
    pos = DICTLINE_POS.get(card["pos"])
    if not pos or not table:
        return None
    lemma = norm(card["lemma"])
    # DICTLINE's first stem is the lemma minus its ending; try progressively
    # shorter prefixes so amo -> am, populus -> popul, mare -> mar.
    for cut in range(0, min(4, len(lemma) - 1)):
        stem = lemma[: len(lemma) - cut] if cut else lemma
        if (stem, pos) in table:
            return table[(stem, pos)]
    return None


def annotate(cards, matched, table):
    changed = 0
    groups = defaultdict(list)
    for cid, (card, _) in cards.items():
        groups[(norm(card["lemma"]), card["pos"])].append(cid)
    for cid, (card, _) in cards.items():
        before = (card.get("headword"), card.get("homograph"), card.get("freq"))
        e = matched.get(cid)
        if e and norm(e["word"]) == norm(card["lemma"]) and e["word"] != card["lemma"]:
            card["headword"] = e["word"]
        group = groups[(norm(card["lemma"]), card["pos"])]
        if len(group) > 1:
            m = HOMOGRAPH_ID.match(cid)
            card["homograph"] = int(m.group(2)) if m else 1
        else:
            card.pop("homograph", None)
        f = card_freq(card, table)
        if f:
            card["freq"] = f
        if before != (card.get("headword"), card.get("homograph"), card.get("freq")):
            changed += 1
    return changed


def main():
    dry = "--dry-run" in sys.argv
    cards = audit.load_cards()
    _, matched = audit.audit_cards(cards)
    changed = annotate(cards, matched, dictline_freq())
    n = len(cards)
    have = lambda k: sum(1 for c, _ in cards.values() if c.get(k))  # noqa: E731
    print(f"{changed}/{n} cards changed; headword {have('headword')}, "
          f"homograph {have('homograph')}, freq {have('freq')}")
    if dry:
        return
    lex = json.loads(audit.LEXICON.read_text())
    by_id = {cid: c for cid, (c, src) in cards.items() if src == "lexicon.json"}
    lex["lemmata"] = [by_id.get(e["id"], e) for e in lex["lemmata"]]
    audit.LEXICON.write_text(json.dumps(lex, indent=2, ensure_ascii=False) + "\n")
    for f in (ROOT / "content").glob("*/vocabulary/*.json"):
        cid = f.stem
        if cid in cards and cards[cid][1] != "lexicon.json":
            f.write_text(json.dumps(cards[cid][0], indent=2, ensure_ascii=False) + "\n")


if __name__ == "__main__":
    main()

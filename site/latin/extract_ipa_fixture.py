#!/usr/bin/env python3
"""Extract Wiktionary's Latin IPA for every card into a test fixture.

Wiktionary transcribes each Latin lemma twice — Classical and "modern
Italianate Ecclesiastical" — via its la-IPA module. site/reader/latin-pron.js
computes both from the card's macronized headword; this fixture is the answer
key its tests score against (site/generator/__tests__/latin-pron.test.js).

Reads the raw kaikki dump (downloads/wiktionary/latin-raw.jsonl.gz, fetched by
wiktionary_extract.py fetch) and writes

    site/generator/__tests__/fixtures/latin-ipa.json
      { card_id: { "word": "caelum", "classical": [...], "eccl": [...] } }

Only cards whose Wiktionary word is the same word (unmarked forms agree, and
the macronized form matches the card's headword when it has one) are kept.

    python3 site/latin/extract_ipa_fixture.py
"""
import gzip
import json
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
import audit_wiktionary as audit  # noqa: E402
from wiktionary_extract import LATIN_RAW, norm  # noqa: E402

ROOT = HERE.parents[1]
OUT = ROOT / "site" / "generator" / "__tests__" / "fixtures" / "latin-ipa.json"


def spelling(s):
    """Wiktionary spells consonantal i as i; cards spell it j."""
    return s.replace("j", "i").replace("J", "I")


def main():
    if not LATIN_RAW.exists():
        sys.exit(f"missing {LATIN_RAW}; run: python3 site/latin/wiktionary_extract.py fetch")
    cards = audit.load_cards()
    want = {}
    for cid, (card, _) in cards.items():
        want.setdefault(norm(card["lemma"]), []).append(cid)

    sounds = {}  # card id -> {word, classical, eccl}
    with gzip.open(LATIN_RAW, "rt", encoding="utf-8") as f:
        for line in f:
            e = json.loads(line)
            ids = want.get(norm(e.get("word", "")))
            if not ids:
                continue
            classical, eccl = [], []
            for s in e.get("sounds", []):
                ipa = s.get("ipa")
                if not ipa:
                    continue
                if "Classical-Latin" in s.get("tags", []):
                    classical.append(ipa)
                elif "Ecclesiastical" in s.get("note", "") or "Ecclesiastical-Latin" in s.get("tags", []):
                    eccl.append(ipa)
            if not classical:
                continue
            # Page titles are unmarked (abeo); the macronized form is the
            # canonical form (abeō). It picks out the right homograph.
            word = next((x["form"] for x in e.get("forms", []) if "canonical" in x.get("tags", [])), e["word"])
            for cid in ids:
                card = cards[cid][0]
                target = spelling(card.get("headword") or card["lemma"]).lower()
                if spelling(word).lower() != target:
                    continue
                got = sounds.setdefault(cid, {"word": word, "classical": [], "eccl": []})
                got["classical"] += [x for x in classical if x not in got["classical"]]
                got["eccl"] += [x for x in eccl if x not in got["eccl"]]

    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(dict(sorted(sounds.items())), ensure_ascii=False, indent=0) + "\n")
    print(f"{len(sounds)}/{len(cards)} cards have Wiktionary IPA -> {OUT.relative_to(ROOT)}")


if __name__ == "__main__":
    main()

#!/usr/bin/env python3
"""Move every token reading from one lemma card to another, then retire the old card.

For cards the Wiktionary audit flags as headed by an inflected form (omne_pron →
omnis_adj, sua_pron → suus_pron) or filed under the wrong part of speech
(error_v → error_n). Each token reading on JUNK is replaced by a reading on
TARGET whose parses are recomputed from TARGET's paradigm for that surface; a
token whose surface TARGET's paradigm can't yield is left alone and reported.
When nothing references JUNK any more, its card is deleted (shared lexicon or
book overlay). Both manuscripts' JSON are rewritten in place; run
`make manuscript-md` and the build afterwards.

Usage:
    python3 site/latin/retarget_lemma.py JUNK:TARGET [JUNK:TARGET …] [--dry-run] [--keep]

  --keep   don't delete JUNK even when it ends up unreferenced
"""
import json
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
from wiktionary_extract import norm  # noqa: E402

ROOT = HERE.parents[1]
CONTENT = ROOT / "content"
LEXICON = CONTENT / "_language" / "latin" / "lexicon.json"
ID_SUFFIX_POS = {"n": "noun", "v": "verb", "adj": "adj", "adv": "adv", "pron": "pron",
                 "conj": "conj", "prep": "prep", "interj": "interj", "num": "num"}


def load_cards():
    """id -> (card, path or None for the shared lexicon)."""
    cards = {e["id"]: (e, None) for e in json.loads(LEXICON.read_text())["lemmata"]}
    for f in CONTENT.glob("*/vocabulary/*.json"):
        e = json.loads(f.read_text())
        cards.setdefault(e["id"], (e, f))
    return cards


def surface_codes(card):
    """norm(form) -> sorted parse codes, as build-glossary expands a card
    (noun cells get the lemma's gender appended)."""
    out = {}
    genders = card.get("gender") or []
    genders = genders if isinstance(genders, list) else [genders]
    for pk in ("paradigm", "ppp_paradigm"):
        for code, v in ((card.get(pk) or {}).get("cells") or {}).items():
            codes = [code]
            if card["pos"] == "noun" and genders and not any(g in code.split(".") for g in ("masc", "fem", "neut")):
                codes = [f"{code}.{g}" for g in genders]
            for form in (v if isinstance(v, list) else [v]):
                out.setdefault(norm(form), set()).update(codes)
    if not card.get("paradigm") and not card.get("ppp_paradigm"):
        suffix = card["id"].rsplit("_", 1)[-1]
        for form in [card["lemma"], *(card.get("alt_forms") or [])]:
            out.setdefault(norm(form), set()).add(suffix)
    return {k: sorted(v) for k, v in out.items()}


def readings(t):
    dm = t.get("__data_matches")
    if dm:
        out = []
        for p in dm.split(";"):
            lid, _, ps = p.partition(":")
            out.append([lid, ps.split(",") if ps else []])
        return out
    return [[t["lemma_id"], list(t.get("parses") or [])]]


def write_readings(t, parts, primary, target_pos):
    t["__data_matches"] = ";".join(f"{i}:{','.join(p)}" if p else i for i, p in parts)
    ids = [i for i, _ in parts]
    primary = primary if primary in ids else ids[0]
    t["lemma_id"] = primary
    t["parses"] = next(p for i, p in parts if i == primary)
    if target_pos and primary == target_pos[0]:
        t["pos_hint"] = target_pos[1]
    if len(parts) > 1:
        t["selected_lemma_id"] = primary
    else:
        t.pop("selected_lemma_id", None)


def retarget(pairs, dry=False, keep=False):
    cards = load_cards()
    for junk, target in pairs:
        for cid in (junk, target):
            if cid not in cards:
                raise SystemExit(f"no card {cid}")
    moved, unresolved = {j: 0 for j, _ in pairs}, []
    manuscripts = sorted(CONTENT.glob("*/manuscript.latin.json"))
    docs = {}
    for ms in manuscripts:
        raw = ms.read_text()
        doc = json.loads(raw)
        docs[ms] = (doc, raw)
        for line in doc["lines"]:
            for t in line["tokens"]:
                if t.get("kind") != "word":
                    continue
                for junk, target in pairs:
                    parts = readings(t)
                    if junk not in [i for i, _ in parts]:
                        continue
                    codes = surface_codes(cards[target][0]).get(norm(t["surface"]))
                    if not codes:
                        unresolved.append(f"{ms.parent.name} {line['n']} {t['surface']}: {junk} -> {target}")
                        continue
                    primary = t.get("selected_lemma_id") or t["lemma_id"]
                    new = []
                    for i, p in parts:
                        i, p = (target, codes) if i == junk else (i, p)
                        hit = next((x for x in new if x[0] == i), None)
                        if hit:
                            hit[1] = sorted(set(hit[1]) | set(p))
                        else:
                            new.append([i, p])
                    write_readings(t, new, target if primary == junk else primary,
                                   (target, cards[target][0]["pos"]))
                    moved[junk] += 1

    # Which junk cards are still referenced?
    still = set()
    for doc, _ in docs.values():
        for line in doc["lines"]:
            for t in line["tokens"]:
                if t.get("kind") == "word":
                    still |= {i for i, _ in readings(t)} | {t.get("selected_lemma_id")}
    for junk, target in pairs:
        state = "kept (still referenced)" if junk in still else "kept (--keep)" if keep else "deleted"
        print(f"{junk} -> {target}: {moved[junk]} readings moved; {junk} {state}")
    for u in unresolved:
        print(f"  unresolved: {u}")
    if dry:
        return
    for ms, (doc, raw) in docs.items():
        ms.write_text(json.dumps(doc, indent=2, ensure_ascii=False) + ("\n" if raw.endswith("\n") else ""))
    if keep:
        return
    dead = {j for j, _ in pairs if j not in still}
    lex = json.loads(LEXICON.read_text())
    before = len(lex["lemmata"])
    lex["lemmata"] = [e for e in lex["lemmata"] if e["id"] not in dead]
    if len(lex["lemmata"]) != before:
        LEXICON.write_text(json.dumps(lex, indent=2, ensure_ascii=False) + "\n")
    for j in dead:
        if cards[j][1] is not None:
            cards[j][1].unlink()


def main():
    pairs = [a.split(":", 1) for a in sys.argv[1:] if not a.startswith("--")]
    if not pairs or any(len(p) != 2 for p in pairs):
        sys.exit(__doc__)
    retarget(pairs, dry="--dry-run" in sys.argv, keep="--keep" in sys.argv)


if __name__ == "__main__":
    main()

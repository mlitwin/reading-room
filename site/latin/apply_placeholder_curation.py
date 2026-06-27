#!/usr/bin/env python3
"""Apply placeholder-corrections.json to the canonical lexicon + manuscript.

  1. Replace each curated placeholder entry in lexicon.json.
  2. Delete orphan entries flagged action=delete (molleo_adv).
  3. Add new lemmata required by token re-points (ultra_adv, decens_adj).
  4. Re-point manuscript tokens whose placeholder conflated two lemmata
     (ultra → ultra_adv; decens → decens_adj).
  5. Reconcile every token's candidate `parses` (and __data_matches / pos_hint)
     against the corrected paradigms — the placeholder paradigms were wrong, so
     the stored parses were stale and would fail concordance invariant C3.

Idempotent. Use --dry-run to preview.
"""
import argparse
import json
import re
import unicodedata
from pathlib import Path

REPO = Path(__file__).resolve().parents[2]
LEXICON = REPO / "content" / "_language" / "latin" / "lexicon.json"
MANUSCRIPT = REPO / "content" / "ovid-metamorphoses" / "manuscript.latin.json"
CORRECTIONS = REPO / "site" / "latin" / "staging" / "placeholder-corrections.json"

INVARIANT_POS = {"adv", "prep", "conj", "interj", "enclitic"}

# 3rd-decl one-termination adjective (decens, decentis) helper.
def _adj3_one(nom, stem):
    g = ["masc", "fem", "neut"]
    cells = {}
    for gg in g:
        cells[f"nom.sg.{gg}"] = nom
    for gg in g:
        cells[f"gen.sg.{gg}"] = stem + "is"
        cells[f"dat.sg.{gg}"] = stem + "i"
        cells[f"abl.sg.{gg}"] = stem + "i"
    cells["acc.sg.masc"] = stem + "em"; cells["acc.sg.fem"] = stem + "em"; cells["acc.sg.neut"] = nom
    cells["nom.pl.masc"] = stem + "es"; cells["nom.pl.fem"] = stem + "es"; cells["nom.pl.neut"] = stem + "ia"
    for gg in g:
        cells[f"gen.pl.{gg}"] = stem + "ium"
        cells[f"dat.pl.{gg}"] = stem + "ibus"
        cells[f"abl.pl.{gg}"] = stem + "ibus"
    cells["acc.pl.masc"] = stem + "es"; cells["acc.pl.fem"] = stem + "es"; cells["acc.pl.neut"] = stem + "ia"
    return {"type": "adj", "rows": ["nom", "gen", "dat", "acc", "abl"],
            "cols": ["sg.masc", "sg.fem", "sg.neut", "pl.masc", "pl.fem", "pl.neut"], "cells": cells}


NEW_LEMMATA = [
    {"id": "ultra_adv", "lemma": "ultra", "pos": "adv",
     "glosses": ["beyond, farther", "besides, more", "(prep. + acc.) beyond, past"],
     "head": "ultra (adv. & prep. + acc.)"},
    {"id": "decens_adj", "lemma": "decens", "pos": "adj",
     "glosses": ["becoming, seemly, graceful", "fitting, proper"],
     "head": "decens, decentis", "paradigm": _adj3_one("decens", "decent")},
]

# (line, surface, old_lemma_id) -> new token fields.
TOKEN_REPOINTS = [
    {"line": 530, "surface": "ultra", "old": "ulter_pron",
     "set": {"lemma_id": "ultra_adv", "stanza": "ultra_adv", "pos_hint": "adv"}},
    {"line": 668, "surface": "ultra", "old": "ulter_pron",
     "set": {"lemma_id": "ultra_adv", "stanza": "ultra_adv", "pos_hint": "adv"}},
    {"line": 527, "surface": "decens", "old": "decet_adv",
     "set": {"lemma_id": "decens_adj", "stanza": "decens_adj", "pos_hint": "adj"}},
]


def norm(w):
    w = unicodedata.normalize("NFD", w or "")
    w = "".join(c for c in w if unicodedata.category(c) != "Mn")
    w = w.lower().replace("j", "i").replace("v", "u")
    w = re.sub(r"^in([bmp])", r"im\1", w)
    w = re.sub(r"^in([lr])", r"i\1\1", w)
    w = re.sub(r"^ad([cfglnprst])", r"a\1\1", w)
    w = re.sub(r"^exf", "eff", w)
    w = re.sub(r"^ob([cfgp])", r"o\1\1", w)
    w = re.sub(r"^sub([cfgmp])", r"su\1\1", w)
    w = re.sub(r"^con([lr])", r"co\1\1", w)
    w = re.sub(r"^con([bmp])", r"com\1", w)
    return w


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--dry-run", action="store_true")
    args = ap.parse_args()

    corr = json.loads(CORRECTIONS.read_text())
    lex = json.loads(LEXICON.read_text())

    # 1-3. lexicon edits
    new_lemmata, replaced, deleted = [], 0, 0
    for l in lex["lemmata"]:
        c = corr.get(l["id"])
        if c is None:
            new_lemmata.append(l)
        elif c.get("action") == "delete":
            deleted += 1
        else:
            new_lemmata.append(c)
            replaced += 1
    existing = {l["id"] for l in new_lemmata}
    added = 0
    for nl in NEW_LEMMATA:
        if nl["id"] not in existing:
            new_lemmata.append(nl)
            added += 1
        else:
            for i, l in enumerate(new_lemmata):
                if l["id"] == nl["id"]:
                    new_lemmata[i] = nl
    lex["lemmata"] = new_lemmata

    by_id = {l["id"]: l for l in new_lemmata}
    affected = {cid for cid, c in corr.items() if c.get("action") != "delete"}
    affected |= {nl["id"] for nl in NEW_LEMMATA}

    def parses_for(lemma_id, surface):
        e = by_id.get(lemma_id)
        if not e:
            return None
        para = e.get("paradigm")
        if not para:
            return [e["pos"]] if e["pos"] in INVARIANT_POS else []
        ns = norm(surface)
        keys = []
        for k, v in para["cells"].items():
            for f in (v if isinstance(v, list) else [v]):
                if norm(f) == ns:
                    keys.append(k)
                    break
        # mirror build-glossary's genderStampParses: noun parses carry gender.
        if e["pos"] == "noun" and e.get("gender"):
            genders = e["gender"] if isinstance(e["gender"], list) else [e["gender"]]
            stamped = []
            for k in keys:
                if re.search(r"\.(masc|fem|neut)(\.|$)", k):
                    stamped.append(k)
                else:
                    stamped.extend(f"{k}.{g}" for g in genders)
            keys = stamped
        return sorted(set(keys))

    # 4. re-point tokens
    ms = json.loads(MANUSCRIPT.read_text())
    repointed = 0
    for line in ms["lines"]:
        for rp in TOKEN_REPOINTS:
            if line["n"] != rp["line"]:
                continue
            for tok in line["tokens"]:
                if (tok.get("kind") == "word" and tok.get("surface") == rp["surface"]
                        and tok.get("lemma_id") in (rp["old"], rp["set"]["lemma_id"])):
                    if tok.get("lemma_id") != rp["set"]["lemma_id"]:
                        tok.update(rp["set"])
                        tok.pop("__data_matches", None)
                        repointed += 1

    # 5. reconcile parses for every token touching an affected lemma
    reconciled, warnings = 0, []
    for line in ms["lines"]:
        for tok in line["tokens"]:
            if tok.get("kind") != "word":
                continue
            surface = tok["surface"]
            # candidate set: from __data_matches if present, else the bare lemma_id
            dm = tok.get("__data_matches")
            if dm:
                cands = []
                for grp in dm.split(";"):
                    if ":" not in grp:
                        continue
                    lid, ps = grp.split(":", 1)
                    cands.append([lid.strip(), [p for p in ps.split(",") if p]])
            else:
                cands = [[tok["lemma_id"], list(tok.get("parses", []))]]
            if not any(lid in affected for lid, _ in cands):
                continue
            changed = False
            for cand in cands:
                lid = cand[0]
                if lid not in affected:
                    continue
                new_ps = parses_for(lid, surface)
                if new_ps is None:
                    continue
                if not new_ps:
                    warnings.append(f"L{line['n']} {surface!r} × {lid}: no matching cell")
                    continue
                if cand[1] != new_ps:
                    cand[1] = new_ps
                    changed = True
            if changed:
                reconciled += 1
            # write back
            if dm:
                tok["__data_matches"] = ";".join(f"{lid}:{','.join(ps)}" for lid, ps in cands)
            # primary parses + pos_hint follow the token's lemma_id
            prim = next((ps for lid, ps in cands if lid == tok["lemma_id"]), None)
            if prim is not None:
                tok["parses"] = prim
            if tok["lemma_id"] in affected:
                tok["pos_hint"] = by_id[tok["lemma_id"]]["pos"]

    print(f"lexicon: {replaced} replaced, {deleted} deleted, {added} added (total {len(new_lemmata)})")
    print(f"manuscript: {repointed} re-pointed, {reconciled} tokens reconciled")
    if warnings:
        print("WARNINGS:")
        for w in warnings:
            print("  " + w)
    if args.dry_run:
        print("(dry-run; no files written)")
        return
    LEXICON.write_text(json.dumps(lex, indent=2, ensure_ascii=False) + "\n")
    MANUSCRIPT.write_text(json.dumps(ms, indent=2, ensure_ascii=False) + "\n")
    print("wrote lexicon.json and manuscript.latin.json")


if __name__ == "__main__":
    main()

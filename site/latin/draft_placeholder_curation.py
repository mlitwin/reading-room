#!/usr/bin/env python3
"""Phase 0-1 of placeholder lexicon curation.

Walks lexicon.json for lemmata whose only gloss is the placeholder
"placeholder pending lexicon curation", gathers their manuscript usage, and
drafts a corrected entry using Whitaker's WORDS (local, sibling repo).

Output: site/latin/staging/placeholder-worklist.json — a reviewable artifact.
This script is READ-ONLY w.r.t. lexicon.json / manuscript.latin.json; it only
writes the worklist. Curation/migration is a later phase.

Usage:
    python3 site/latin/draft_placeholder_curation.py
"""
import json
import sys
from collections import defaultdict
from pathlib import Path

PLACEHOLDER = "placeholder pending lexicon curation"
REPO = Path(__file__).resolve().parents[2]
LEXICON = REPO / "content" / "_language" / "latin" / "lexicon.json"
MANUSCRIPT = REPO / "content" / "ovid-metamorphoses" / "manuscript.latin.json"
WORDS_REPO = Path.home() / "Dev" / "github.com" / "mlitwin" / "whitakers_words"
OUT = REPO / "site" / "latin" / "staging" / "placeholder-worklist.json"

sys.path.insert(0, str(WORDS_REPO))


def words_draft(parser, forms):
    """Return list of {form, root, pos, gloss} candidates from WORDS."""
    out = []
    seen = set()
    for w in forms:
        try:
            res = parser.parse(w)
        except Exception:
            continue
        for f in res.forms:
            for a in f.analyses.values():
                lx = a.lexeme
                senses = getattr(lx, "senses", None)
                if not senses:
                    continue
                root = lx.roots[0] if getattr(lx, "roots", None) else "?"
                key = (root, type(lx).__name__)
                if key in seen:
                    continue
                seen.add(key)
                out.append({
                    "queried": w,
                    "root": root,
                    "pos": type(lx).__name__,
                    "gloss": "; ".join(senses)[:120],
                })
    return out


def main():
    lex = json.loads(LEXICON.read_text())
    placeholders = [l for l in lex["lemmata"] if PLACEHOLDER in l.get("glosses", [])]

    # Manuscript usage: which lines reference each lemma id, and the surfaces.
    ms = json.loads(MANUSCRIPT.read_text())
    refs = defaultdict(list)  # id -> [(line_n, surface)]
    for line in ms["lines"]:
        for tok in line["tokens"]:
            if tok.get("kind") != "word":
                continue
            lid = tok.get("lemma_id")
            if lid:
                refs[lid].append((line["n"], tok.get("surface", "")))

    from whitakers_words.parser import Parser
    parser = Parser()

    work = []
    for l in placeholders:
        forms = [l["lemma"]] + l.get("alt_forms", [])
        usage = refs.get(l["id"], [])
        surfaces = sorted({s for _, s in usage})
        sample_lines = sorted({n for n, _ in usage})[:6]
        draft = words_draft(parser, forms)
        work.append({
            "id": l["id"],
            "current": {
                "lemma": l["lemma"],
                "pos": l["pos"],
                "head": l.get("head"),
                "gender": l.get("gender"),
                "has_paradigm": bool(l.get("paradigm")),
                "alt_forms": l.get("alt_forms", []),
            },
            "manuscript": {
                "ref_count": len(usage),
                "surfaces": surfaces,
                "sample_lines": sample_lines,
            },
            "words_draft": draft,
            "needs_manual": len(draft) == 0,
            # to be filled by a human / L&S pass:
            "curated": None,
        })

    work.sort(key=lambda w: (-w["manuscript"]["ref_count"], w["id"]))
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps({"lemmata": work}, indent=2, ensure_ascii=False) + "\n")

    total = len(work)
    auto = sum(1 for w in work if not w["needs_manual"])
    orphan = [w["id"] for w in work if w["manuscript"]["ref_count"] == 0]
    print(f"wrote {OUT.relative_to(REPO)}")
    print(f"  {total} placeholders | {auto} WORDS-drafted | {total - auto} need manual/L&S")
    print(f"  orphans (0 refs): {orphan}")


if __name__ == "__main__":
    main()

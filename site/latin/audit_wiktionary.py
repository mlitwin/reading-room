#!/usr/bin/env python3
"""Audit the Latin lexicon and text annotations against Wiktionary.

Read-only: compares every card (shared lexicon + book vocabulary overlays) and
every word token in each manuscript.latin.json with the preprocessed Wiktionary
cache (wiktionary_lookup.py), and writes a report. Nothing is changed.

Card checks
  W1  headword not found in Wiktionary (often proper names / Neo-Latin)
  W2  headword is itself an inflected form or variant of another lemma
  W3  no Wiktionary entry with the card's part of speech
  W4  noun gender disagrees
  W5  Wiktionary says plurale tantum, card has singular cells
  W6  paradigm cells whose forms Wiktionary doesn't give for that cell
  W7  id suffix doesn't match pos, or id stem doesn't match the headword

Token checks
  T1  selected reading's lemma isn't among Wiktionary's analyses of the surface
  T2  selected lemma matches but none of the token's parses do
  T3  Wiktionary reading (content word) absent from the token's candidates

Usage:
    python3 site/latin/audit_wiktionary.py      # writes the report below
"""
import json
import sys
from collections import Counter, defaultdict
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
from wiktionary_lookup import analyses, lookup, norm, _cache  # noqa: E402

ROOT = HERE.parents[1]
LEXICON = ROOT / "content" / "_language" / "latin" / "lexicon.json"
REPORT = HERE / "wiktionary-audit.md"
DETAIL = ROOT / ".tmp" / "wiktionary-audit.json"

POS_SUFFIX = {"noun": "n", "verb": "v", "adj": "adj", "adv": "adv", "pron": "pron",
              "conj": "conj", "prep": "prep", "interj": "interj", "num": "num", "enclitic": "enclit"}
# Card pos -> Wiktionary pos values that count as the same part of speech.
POS_COMPAT = {"noun": {"noun"}, "verb": {"verb"}, "adj": {"adj", "num"}, "adv": {"adv", "particle"},
              "pron": {"pron", "adj"}, "conj": {"conj", "adv", "particle"}, "prep": {"prep", "adv"},
              "interj": {"interj"}, "num": {"num", "adj"}, "enclitic": {"particle", "conj"}}
CONTENT_POS = {"noun", "verb", "adj"}


def load_cards():
    cards = {}
    for e in json.loads(LEXICON.read_text())["lemmata"]:
        cards[e["id"]] = (e, "lexicon.json")
    for f in sorted((ROOT / "content").glob("*/vocabulary/*.json")):
        e = json.loads(f.read_text())
        cards[e["id"]] = (e, f"{f.parent.parent.name}/vocabulary")
    return cards


def card_cells(card):
    out = {}
    for pk in ("paradigm", "ppp_paradigm"):
        for code, v in ((card.get(pk) or {}).get("cells") or {}).items():
            forms = v if isinstance(v, list) else [v]
            out[code] = {norm(x) for x in forms if x and x != "-"}
    return out


def comparable(code):
    """Every cell compares: participle grids are folded into verbs at build."""
    return True


def compare_cells(card, entry):
    cc, wc = card_cells(card), {k: {norm(x) for x in v} for k, v in (entry.get("cells") or {}).items()}
    shared = [k for k in cc if k in wc and comparable(k) and cc[k]]
    wrong = [(k, sorted(cc[k]), sorted(wc[k])) for k in shared if not cc[k] & wc[k]]
    return len(shared), wrong


def best_entry(card, entries):
    """Pick the Wiktionary entry (homographs!) that best fits the card."""
    def score(e):
        n, wrong = compare_cells(card, e)
        g = card.get("gender")
        g = set(g if isinstance(g, list) else [g]) if g else set()
        gender_ok = 1 if (not g or not e.get("gender") or g & set(e["gender"])) else 0
        return (gender_ok, (n - len(wrong)) / n if n else 0, bool(e.get("cells")), bool(e.get("glosses")))
    return max(entries, key=score)


def audit_cards(cards):
    find = defaultdict(list)
    matched = {}        # card id -> wiktionary entry
    for cid, (card, src) in sorted(cards.items()):
        lemma, pos = card.get("lemma") or "", card["pos"]
        suffix = cid.rsplit("_", 1)[-1]
        stem = cid.rsplit("_", 1)[0]
        if POS_SUFFIX.get(pos) != suffix:
            find["W7"].append({"id": cid, "src": src, "detail": f"pos {pos}, id suffix _{suffix}"})
        elif norm(stem.replace("-", "")) != norm(lemma) and not stem[-1:].isdigit():
            find["W7"].append({"id": cid, "src": src, "detail": f"id stem '{stem}' vs headword '{lemma}'"})

        entries = lookup(lemma)
        lemma_entries = [e for e in entries if e.get("cells") or e.get("glosses")]
        if not entries:
            find["W1"].append({"id": cid, "src": src, "detail": lemma})
            continue
        if not lemma_entries:
            targets = sorted({fo["lemma"] for e in entries for fo in e.get("form_of", [])} |
                             {a for e in entries for a in e.get("alt_of", [])})
            find["W2"].append({"id": cid, "src": src, "detail": f"{lemma} → {', '.join(targets)}"})
            continue
        same_pos = [e for e in lemma_entries if e["pos"] in POS_COMPAT.get(pos, {pos})]
        if not same_pos:
            find["W3"].append({"id": cid, "src": src,
                               "detail": f"card {pos}; Wiktionary {', '.join(sorted({e['pos'] for e in lemma_entries}))}"})
            continue
        e = best_entry(card, same_pos)
        matched[cid] = e
        if pos == "noun" and card.get("gender") and e.get("gender"):
            g = card["gender"] if isinstance(card["gender"], list) else [card["gender"]]
            g = {x for c in g for x in (("masc", "fem") if c == "c" else (c,))}
            if not g & set(e["gender"]):
                also = sorted({fo["lemma"] for x in entries for fo in x.get("form_of", [])})
                hint = f"; also a form of {', '.join(also)}" if also else ""
                find["W4"].append({"id": cid, "src": src,
                                   "detail": f"card {'/'.join(sorted(g))}, Wiktionary {'/'.join(e['gender'])} — {e['head']}{hint}"})
        if e.get("plural_only"):
            sg = [k for k, v in card_cells(card).items() if ".sg" in k and v]
            if sg:
                find["W5"].append({"id": cid, "src": src, "detail": f"{len(sg)} singular cells — {e['head']}"})
        n, wrong = compare_cells(card, e)
        if wrong:
            find["W6"].append({"id": cid, "src": src, "shared": n, "wrong": len(wrong),
                               "detail": "; ".join(f"{k}: {'/'.join(c)} ≠ {'/'.join(w)}" for k, c, w in wrong[:4]),
                               "head": e.get("head", "")})
    return find, matched


def token_candidates(t):
    dm = t.get("__data_matches")
    if dm:
        return [p.split(":")[0] for p in dm.split(";") if p]
    return [t["lemma_id"]] if t.get("lemma_id") else []


INVARIANT_CODES = {"inv", "indecl", "adv", "conj", "prep", "interj", "enclit", "num"}


def strip_gender(code):
    """Comparable form of a parse code: no gender, gerund prefix optional."""
    parts = [p for p in code.split(".") if p not in ("masc", "fem", "neut", "c")]
    if parts and parts[0] == "ger":
        parts = parts[1:]
    return ".".join(parts)


def related(word, depth=2):
    """norm(word) plus the lemmas it is a spelling variant or participle of."""
    out, frontier = {norm(word)}, [word]
    for _ in range(depth):
        nxt = []
        for w in frontier:
            for e in lookup(w):
                for t in e.get("alt_of", []) + e.get("participle_of", []):
                    if norm(t) not in out:
                        out.add(norm(t))
                        nxt.append(t)
        frontier = nxt
    return out


def card_forms(card):
    """Forms a card names explicitly (headword, alt_forms). Paradigm cells are
    deliberately excluded: generated grids over-produce (venio's ppp grid
    would vouch for "ventos")."""
    return {norm(card.get("lemma", ""))} | {norm(x) for x in card.get("alt_forms") or []}


def audit_tokens(cards, matched):
    find = defaultdict(list)
    known = {norm(c.get("lemma", "")) for c, _ in cards.values()} | {norm(e["word"]) for e in matched.values()}
    for ms in sorted((ROOT / "content").glob("*/manuscript.latin.json")):
        text = ms.parent.name
        for line in json.loads(ms.read_text())["lines"]:
            for t in line["tokens"]:
                if t.get("kind") != "word" or t.get("pos_hint") == "enclitic":
                    continue
                surface = t["surface"]
                an = analyses(surface)
                if not an:
                    continue
                sel = t.get("selected_lemma_id") or t.get("lemma_id")
                where = f"{text} {line['n']}"
                # One reading per (lemma, pos); cell and form-of codes merge.
                wl = {}
                for a in an:
                    key = (norm(a["word"]), a["pos"])
                    if key in wl:
                        wl[key] = {**wl[key], "codes": sorted(set(wl[key]["codes"]) | set(a["codes"]))}
                    else:
                        wl[key] = a
                card = cards.get(sel, ({}, ""))[0]
                # Only cards matched to a Wiktionary lemma (W1-W3 cover the rest).
                if sel in matched:
                    pos_ok = POS_COMPAT.get(card["pos"], {card["pos"]})
                    wk = norm(matched[sel]["word"])
                    hits = [a for (k, p), a in wl.items() if p in pos_ok and wk in related(a["word"])]
                    if not hits and norm(surface) in card_forms(card):
                        pass  # the card names this form itself (nec under neque)
                    elif not hits:
                        offered = sorted({f"{a['word']} ({a['pos']})" for a in an})
                        find["T1"].append({"where": where, "surface": surface, "selected": sel,
                                           "detail": "Wiktionary: " + ", ".join(offered)})
                    else:
                        wcodes = {strip_gender(c) for a in hits for c in a["codes"]}
                        tcodes = {strip_gender(c) for c in t.get("parses", [])}
                        invariant = "inv" in wcodes and tcodes & INVARIANT_CODES
                        # A bare headword match (no Wiktionary table, e.g. Nereus) or an
                        # indeclinable-tagged numeral says nothing about the parse.
                        uninformative = wcodes <= {"inv"} or tcodes <= {"num"}
                        if wcodes and tcodes and not wcodes & tcodes and not invariant and not uninformative:
                            find["T2"].append({"where": where, "surface": surface, "selected": sel,
                                               "detail": f"token {','.join(sorted(tcodes))}; Wiktionary {','.join(sorted(wcodes))}"})
                cand_lemmas = set()
                for c in token_candidates(t):
                    if c in cards:
                        cand_lemmas.add(norm(cards[c][0].get("lemma", "")))
                    if c in matched:
                        cand_lemmas.add(norm(matched[c]["word"]))
                for (k, p), a in wl.items():
                    # Only readings whose lemma we already have a card for: a known
                    # word the token doesn't offer (rare homographs like edō are noise).
                    if p in CONTENT_POS and a["codes"] and k in known \
                            and not related(a["word"]) & cand_lemmas:
                        find["T3"].append({"where": where, "surface": surface,
                                           "detail": f"{a['word']} ({p}) {','.join(a['codes'][:3])}"})
    return find


TITLES = {
    "W1": "Card headword not in Wiktionary",
    "W2": "Card headword is an inflected form / variant of another lemma",
    "W3": "No Wiktionary entry with the card's part of speech",
    "W4": "Noun gender disagrees",
    "W5": "Plurale tantum in Wiktionary, card has singular cells",
    "W6": "Paradigm cells Wiktionary doesn't give",
    "W7": "Card id doesn't match its pos / headword",
    "T1": "Selected reading not among Wiktionary's analyses of the surface",
    "T2": "Selected lemma matches, but no parse does",
    "T3": "Known lemma's reading missing from the token's candidates",
}
LIMIT = {"W6": 120, "T3": 0}


def write_report(cfind, tfind, cards, matched):
    meta = _cache()["meta"]
    allf = {**cfind, **tfind}
    lines = [
        "# Wiktionary audit",
        "",
        "Generated by `site/latin/audit_wiktionary.py` (`make latin-wiktionary-audit`); do not hand-edit.",
        f"Source: {meta['source']}, dump {meta['dump']} (built {meta['built']}). {meta['license']}.",
        "",
        "Read-only comparison of the lexicon cards and text annotations with Wiktionary. A finding is",
        "a disagreement to look at, not an automatic error: Wiktionary covers Neo-Latin and proper names",
        "unevenly, and its paradigms list classical forms only. Full detail: `.tmp/wiktionary-audit.json`.",
        "",
        f"Cards checked: {len(cards)} ({len(matched)} matched to a Wiktionary entry).",
        "",
        "| check | finding | count |",
        "|---|---|---|",
    ]
    for k in TITLES:
        lines.append(f"| {k} | {TITLES[k]} | {len(allf.get(k, []))} |")
    for k in TITLES:
        items = allf.get(k, [])
        if not items:
            continue
        lines += ["", f"## {k} — {TITLES[k]} ({len(items)})", ""]
        if k == "T3":
            by = Counter(i["detail"].split(" (")[0] for i in items)
            lines.append("Grouped by the missing lemma (occurrences). Limited to lemmata that already have")
            lines.append("a card, i.e. a known word the token's candidate tabs don't offer.")
            lines.append("")
            lines += [f"- {w} ×{n}" for w, n in by.most_common(150)]
            continue
        if k == "W6":
            items = sorted(items, key=lambda i: (-i["wrong"] / max(i["shared"], 1), i["id"]))
            lines.append("Sorted by the share of compared cells that disagree.")
            lines.append("")
        lim = LIMIT.get(k)
        for i in items[: lim or None]:
            if "where" in i:
                lines.append(f"- {i['where']} **{i['surface']}** → `{i['selected']}` — {i['detail']}")
            elif k == "W6":
                lines.append(f"- `{i['id']}` ({i['src']}) {i['wrong']}/{i['shared']} cells — {i['detail']}")
            else:
                lines.append(f"- `{i['id']}` ({i['src']}) — {i['detail']}")
        if lim and len(items) > lim:
            lines.append(f"- … {len(items) - lim} more in the JSON detail")
    REPORT.write_text("\n".join(lines) + "\n")
    DETAIL.parent.mkdir(exist_ok=True)
    DETAIL.write_text(json.dumps(allf, ensure_ascii=False, indent=1) + "\n")


def main():
    cards = load_cards()
    cfind, matched = audit_cards(cards)
    tfind = audit_tokens(cards, matched)
    write_report(cfind, tfind, cards, matched)
    for k in TITLES:
        print(f"{k} {len({**cfind, **tfind}.get(k, [])):5}  {TITLES[k]}")
    print(f"report: {REPORT.relative_to(ROOT)}; detail: {DETAIL.relative_to(ROOT)}")


if __name__ == "__main__":
    main()

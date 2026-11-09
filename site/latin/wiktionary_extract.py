#!/usr/bin/env python3
"""Wiktionary (via kaikki.org / wiktextract) as a Latin lexical source.

Two stages:

  fetch   Stream the all-languages raw wiktextract dump from kaikki.org and keep
          only Latin entries (lang_code "la"), gzipped, under the gitignored
          downloads/wiktionary/. The 3 GB dump is never written to disk.

  build   Preprocess the Latin entries into this repo's vocabulary:
            downloads/wiktionary/latin-compact.jsonl.gz   every Latin entry,
                preprocessed (gitignored; the full lookup for new words)
            site/latin/sources/wiktionary-cache.json      committed subset —
                the entries our lexicon cards and attested text surfaces reach,
                plus a surface→analysis index for every attested surface

Preprocessing (what makes the data usable here):
  * Inflection-table tags become our dotted parse codes (`nom.sg`,
    `3sg.perf.subj.act`, `pap.nom.sg.masc`, `comp.` …), restricted to atoms
    grammar.json defines. Sigmatic/aorist/potential forms, periphrastic
    "X + sum" descriptions and "-" placeholders are dropped.
  * Deponent verbs: Wiktionary tags their forms "active"; this repo's
    convention is `pass` (laetor 3pl.pres.ind.pass), so voice is flipped.
  * Head lines become fields: canonical (macronized) headword, gender,
    plurale tantum, declension/conjugation class, principal parts, comparative.
  * Glosses: one string per non-form-of sense (the most specific gloss).
  * form-of / alternative-of senses are kept as pointers with parse codes, so
    "veneris" → venus gen.sg and "sylva" → silva are queryable.
  * Keys use the same normalization as ls_lookup.norm: strip macrons,
    lowercase, j→i, v→u, letters only.

Usage:
    python3 site/latin/wiktionary_extract.py fetch
    python3 site/latin/wiktionary_extract.py build

Source: English Wiktionary, CC BY-SA 4.0; extracted by wiktextract
(Ylonen, LREC 2022) and published at https://kaikki.org/.
"""
import gzip
import json
import re
import sys
import time
import unicodedata
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
RAW_URL = "https://kaikki.org/dictionary/raw-wiktextract-data.jsonl.gz"
DL_DIR = ROOT / "downloads" / "wiktionary"
LATIN_RAW = DL_DIR / "latin-raw.jsonl.gz"
LATIN_META = DL_DIR / "latin-raw.meta.json"
LATIN_COMPACT = DL_DIR / "latin-compact.jsonl.gz"
CACHE = ROOT / "site" / "latin" / "sources" / "wiktionary-cache.json"
LEXICON = ROOT / "content" / "_language" / "latin" / "lexicon.json"
CONTENT = ROOT / "content"


def fetch():
    DL_DIR.mkdir(parents=True, exist_ok=True)
    tmp = LATIN_RAW.with_suffix(".partial")
    req = urllib.request.Request(RAW_URL, headers={"User-Agent": "reading-room latin pipeline"})
    kept = seen = 0
    t0 = time.time()
    with urllib.request.urlopen(req) as resp:
        last_modified = resp.headers.get("Last-Modified")
        with gzip.GzipFile(fileobj=resp) as src, gzip.open(tmp, "wt", encoding="utf-8") as out:
            for raw in src:
                seen += 1
                # Cheap prefilter before parsing: every Latin entry carries this.
                if b'"lang_code": "la"' not in raw:
                    continue
                if json.loads(raw).get("lang_code") != "la":
                    continue
                out.write(raw.decode("utf-8"))
                kept += 1
                if kept % 50000 == 0:
                    print(f"  {kept:,} Latin / {seen:,} lines  ({time.time() - t0:.0f}s)", file=sys.stderr)
    tmp.replace(LATIN_RAW)
    LATIN_META.write_text(json.dumps({
        "source": RAW_URL, "last_modified": last_modified,
        "fetched": time.strftime("%Y-%m-%d"), "lines_seen": seen, "latin_entries": kept,
    }, indent=2) + "\n")
    print(f"fetch: {kept:,} Latin entries of {seen:,} -> {LATIN_RAW}")


# ---- normalization ---------------------------------------------------------

def strip_marks(s):
    s = unicodedata.normalize("NFD", s or "")
    return unicodedata.normalize("NFC", "".join(c for c in s if unicodedata.category(c) != "Mn"))


def norm(s):
    """Lookup key; identical to ls_lookup.norm."""
    return re.sub(r"[^a-z]", "", strip_marks(s).lower().replace("j", "i").replace("v", "u"))


# ---- tag → parse code ------------------------------------------------------

POS_MAP = {"noun": "noun", "name": "noun", "verb": "verb", "adj": "adj", "adv": "adv",
           "pron": "pron", "det": "pron", "num": "num", "prep": "prep", "postp": "prep",
           "conj": "conj", "intj": "interj", "particle": "particle"}
CASES = {"nominative": "nom", "genitive": "gen", "dative": "dat", "accusative": "acc",
         "ablative": "abl", "vocative": "voc", "locative": "loc"}
NUMBERS = {"singular": "sg", "plural": "pl"}
GENDERS = {"masculine": "masc", "feminine": "fem", "neuter": "neut"}
PERSONS = {"first-person": "1", "second-person": "2", "third-person": "3"}
MOODS = {"indicative": "ind", "subjunctive": "subj", "imperative": "imp"}
# Forms with these tags have no parse code here (or aren't single forms).
DROP_TAGS = {"sigmatic", "aorist", "potential", "table-tags", "inflection-template"}
HEAD_GENDER = {"m": ["masc"], "f": ["fem"], "n": ["neut"], "c": ["masc", "fem"]}


def _one(tags, table):
    hits = [table[t] for t in tags if t in table]
    return hits[0] if len(hits) == 1 else None


def _tense(t):
    if "future" in t and "perfect" in t:
        return "futperf"
    for k, v in (("pluperfect", "plup"), ("imperfect", "imperf"), ("perfect", "perf"),
                 ("future", "fut"), ("present", "pres")):
        if k in t:
            return v
    return None


def parse_codes(tags, pos, deponent=False, genders=None):
    """Map one form's tag list to a list of parse codes (empty = unmappable)."""
    t = set(tags)
    if t & DROP_TAGS:
        return []
    prefix = "comp." if "comparative" in t else "superl." if "superlative" in t else ""
    case, num = _one(t, CASES), _one(t, NUMBERS)
    if pos == "verb":
        voice = "pass" if "passive" in t else "act" if "active" in t else None
        if deponent and voice == "act":
            voice = "pass"
        tense = _tense(t)
        if "gerund" in t:
            return [f"ger.{case}.sg"] if case else []
        if "supine" in t:
            return [f"sup.{case}"] if case else []
        if "participle" in t:
            if tense == "perf":
                return ["ppp.nom.sg.masc"]
            if tense == "pres":
                return ["pap.nom.sg.masc"]
            if tense == "fut":
                return ["gerundive.nom.sg.masc" if "passive" in t and not deponent else "fap.nom.sg.masc"]
            return []
        if "infinitive" in t:
            if not tense or tense == "futperf":
                return []
            return [f"inf.{tense}.{voice or 'act'}"]
        person, mood = _one(t, PERSONS), _one(t, MOODS)
        if person and num and mood and tense and voice:
            return [f"{person}{num}.{tense}.{mood}.{voice}"]
        return []
    # A cell or form-of sense may name several cases/numbers at once
    # ("nominative/accusative/vocative plural"): emit every combination.
    cases = [CASES[x] for x in tags if x in CASES]
    nums = [NUMBERS[x] for x in tags if x in NUMBERS]
    if not (cases and nums):
        return []
    if pos == "noun":
        return [f"{c}.{n}" for c in cases for n in nums]
    gs = [GENDERS[g] for g in tags if g in GENDERS] or genders or ["masc", "fem", "neut"]
    return [f"{prefix}{c}.{n}.{g}" for c in cases for n in nums for g in gs]


# ---- entry preprocessing ---------------------------------------------------

def head_expansion(e):
    hts = e.get("head_templates") or []
    return hts[0].get("expansion", "") if hts else ""


def head_gender(expansion, canonical):
    """Gender letters and plurale-tantum flag from 'praecordia n pl (genitive …)'."""
    before = expansion.split("(")[0]
    rest = before[len(canonical):] if before.startswith(canonical) else before
    toks = rest.replace(",", " ").split()
    genders, plural_only = [], False
    for tok in toks:
        if tok in HEAD_GENDER:
            genders += [g for g in HEAD_GENDER[tok] if g not in genders]
        elif tok == "pl":
            plural_only = True
    return genders, plural_only


def head_class(expansion):
    m = re.search(r"\);\s*(.+)$", expansion) or re.search(r";\s*(.+)$", expansion)
    return m.group(1).strip() if m else None


LATIN_WORD = re.compile(r"^[A-Za-z][A-Za-z ']*$")
PARTICIPLE_TYPE = (("perf", "ppp"), ("pres", "pap"))


def participle_type(tags):
    """ppp / pap / fap / gerundive from a participle sense's tags."""
    t = set(tags)
    tense = _tense(t)
    if tense == "fut":
        return "gerundive" if "passive" in t else "fap"
    return dict(PARTICIPLE_TYPE).get(tense)


def compact_entry(e):
    pos = POS_MAP.get(e.get("pos"))
    if not pos:
        return None
    # Affixes ("-dō"), numerals, symbols: not words a text can contain.
    if not LATIN_WORD.match(strip_marks(e.get("word", ""))):
        return None
    is_participle = any(h.get("name") == "la-part" for h in e.get("head_templates") or [])
    forms = e.get("forms") or []
    # Head forms precede the first table marker; table forms follow it.
    split = next((i for i, f in enumerate(forms)
                  if {"table-tags", "inflection-template"} & set(f.get("tags", []))), len(forms))
    head_forms, table_forms = forms[:split], forms[split:]
    canonical = next((f["form"] for f in head_forms if "canonical" in f.get("tags", [])), e["word"])
    expansion = head_expansion(e)
    # Semi-deponents (placeō, fīō, diffīdō) are active in the present system.
    full_dep = re.compile(r"(?<!semi-)(?<!semi)deponent")
    # The head line wins: soleō's table tag reads "deponent future" though the
    # head says "optionally semi-deponent".
    deponent = bool(full_dep.search(expansion)) or ("semi" not in expansion and any(
        full_dep.search(f.get("form", "")) for f in forms if "table-tags" in f.get("tags", [])))
    genders, plural_only = head_gender(expansion, canonical) if pos == "noun" else ([], False)

    # Participles decline like adjectives; their codes carry the participle
    # prefix (ppp.acc.sg.fem) and name the parent verb.
    ptype, parents = None, []
    if is_participle:
        for s in e.get("senses") or []:
            if "participle" in s.get("tags", []):
                ptype = ptype or participle_type(s.get("tags", []))
                parents += [f["word"] for f in s.get("form_of") or [] if f["word"] not in parents]
        if not ptype:
            # Many entries tag senses just "participle"; the ending decides.
            bare = strip_marks(canonical)
            ptype = ("pap" if bare.endswith("ns") else "fap" if bare.endswith("urus")
                     else "gerundive" if bare.endswith("ndus") else "ppp")

    cells = {}
    for f in table_forms:
        form = f.get("form", "").strip()
        if not form or form == "-" or "+" in form:
            continue
        codes = parse_codes(f.get("tags", []), "adj" if is_participle else pos, deponent)
        if is_participle:
            codes = [f"{ptype}.{c}" for c in codes if not c.startswith(("comp.", "superl."))] if ptype else []
        for code in codes:
            lst = cells.setdefault(code, [])
            if form not in lst:
                lst.append(form)

    glosses, form_of, alt_of = [], [], []
    for s in e.get("senses") or []:
        if s.get("form_of") and is_participle and s.get("glosses"):
            # A participle sense is both a pointer and a real meaning.
            if s["glosses"][-1] not in glosses:
                glosses.append(s["glosses"][-1])
        elif s.get("form_of"):
            codes = parse_codes([t for t in s.get("tags", []) if t != "form-of"], pos, deponent)
            for target in s["form_of"]:
                form_of.append({"lemma": target["word"], "codes": codes})
        elif s.get("alt_of"):
            alt_of += [a["word"] for a in s["alt_of"] if a["word"] not in alt_of]
        elif s.get("glosses"):
            g = s["glosses"][-1]
            if g not in glosses:
                glosses.append(g)

    out = {"word": canonical, "pos": pos}
    if e.get("pos") == "name":
        out["proper"] = True
    if is_participle:
        out["participle"] = ptype
        if parents:
            out["participle_of"] = parents
    if e.get("etymology_number"):
        out["etym"] = e["etymology_number"]
    if genders:
        out["gender"] = genders
    if plural_only:
        out["plural_only"] = True
    if deponent:
        out["deponent"] = True
    cls = head_class(expansion)
    if cls:
        out["class"] = cls
    if expansion:
        out["head"] = expansion
    if pos == "verb" and cells:
        pp =[canonical] + [f["form"] for f in head_forms
                            if f.get("form") != canonical and not {"canonical", "alternative"} & set(f.get("tags", []))]
        out["principal_parts"] = pp
    if pos == "adj":
        comp = [f["form"] for f in head_forms if "comparative" in f.get("tags", [])]
        sup = [f["form"] for f in head_forms if "superlative" in f.get("tags", [])]
        if comp:
            out["comparative"] = comp
        if sup:
            out["superlative"] = sup
    if glosses:
        out["glosses"] = glosses
    if form_of:
        out["form_of"] = form_of
    if alt_of:
        out["alt_of"] = alt_of
    if cells:
        out["cells"] = cells
    return out


# ---- build -----------------------------------------------------------------

def card_lemmas():
    """Normalized headwords of every shared-lexicon and overlay card."""
    lem = [e["lemma"] for e in json.loads(LEXICON.read_text())["lemmata"]]
    for f in CONTENT.glob("*/vocabulary/*.json"):
        lem.append(json.loads(f.read_text())["lemma"])
    return {norm(x) for x in lem if x}


def attested_surfaces():
    out = set()
    for ms in CONTENT.glob("*/manuscript.latin.json"):
        for line in json.loads(ms.read_text())["lines"]:
            for t in line["tokens"]:
                if t.get("kind") == "word":
                    out.add(norm(t["surface"]))
    return out


def build():
    if not LATIN_RAW.exists():
        sys.exit(f"build: {LATIN_RAW} missing — run `fetch` first")
    meta = json.loads(LATIN_META.read_text()) if LATIN_META.exists() else {}
    entries = {}          # norm(word) -> [compact entry, …]
    n_in = 0
    with gzip.open(LATIN_RAW, "rt", encoding="utf-8") as src:
        for line in src:
            n_in += 1
            c = compact_entry(json.loads(line))
            if c is not None:
                entries.setdefault(norm(c["word"]), []).append(c)

    # Participles without a parent pointer: every verb's own table names its
    # participles (ppp.nom.sg.masc …), so link through that.
    by_participle = {}
    for lst in entries.values():
        for v in lst:
            if v["pos"] == "verb" and not v.get("participle"):
                for pt in ("ppp", "pap", "fap", "gerundive"):
                    for f in (v.get("cells") or {}).get(f"{pt}.nom.sg.masc", []):
                        by_participle.setdefault((pt, norm(f)), []).append(v["word"])
    for lst in entries.values():
        for c in lst:
            if c.get("participle") and not c.get("participle_of"):
                parents = sorted(set(by_participle.get((c["participle"], norm(c["word"])), [])))
                if parents:
                    c["participle_of"] = parents

    # Deponents: form-of senses say "active" too; apply our `pass` convention.
    deponents = {norm(v["word"]) for lst in entries.values() for v in lst if v.get("deponent")}
    for lst in entries.values():
        for c in lst:
            for fo in c.get("form_of", []):
                if c["pos"] == "verb" and norm(fo["lemma"]) in deponents:
                    fo["codes"] = [re.sub(r"\.act$", ".pass", x) if re.match(r"^(\d|inf\.(pres|perf))", x) else x
                                   for x in fo["codes"]]

    # Fold each participle's full declension into its parent verb's cells, so a
    # verb entry carries complete ppp/pap/fap/gerundive grids like our cards.
    for lst in list(entries.values()):
        for c in lst:
            for parent in c.get("participle_of", []):
                verbs = [v for v in entries.get(norm(parent), [])
                         if v["pos"] == "verb" and v.get("cells") and not v.get("participle")]
                nom = {norm(x) for x in (c.get("cells") or {}).get(f"{c['participle']}.nom.sg.masc", [])}
                fit = [v for v in verbs if nom & {norm(x) for x in
                       v["cells"].get(f"{c['participle']}.nom.sg.masc", [])}] or verbs[:1]
                for v in fit:
                    for code, forms in (c.get("cells") or {}).items():
                        lst2 = v["cells"].setdefault(code, [])
                        lst2 += [f for f in forms if f not in lst2]

    with gzip.open(LATIN_COMPACT, "wt", encoding="utf-8") as full:
        for lst in entries.values():
            for c in lst:
                full.write(json.dumps(c, ensure_ascii=False) + "\n")

    # Surface index over every entry: paradigm cells + form-of pointers + the
    # headword itself. Values: (key, entry index, codes).
    surfaces = attested_surfaces()
    analyses = {}
    for key, lst in entries.items():
        for i, c in enumerate(lst):
            hits = {}
            if key in surfaces:
                hits.setdefault(key, set())
            for code, forms in (c.get("cells") or {}).items():
                for f in forms:
                    nf = norm(f)
                    if nf in surfaces:
                        hits.setdefault(nf, set()).add(code)
            for nf, codes in hits.items():
                analyses.setdefault(nf, []).append([key, i, sorted(codes)])

    # Committed subset: card headwords + everything attested surfaces reach
    # (including the lemma a form-of / alt-of pointer names).
    keep = card_lemmas() | set(analyses)
    for nf in list(analyses):
        for key, i, _ in analyses[nf]:
            keep.add(key)
            c = entries[key][i]
            for fo in c.get("form_of", []):
                keep.add(norm(fo["lemma"]))
            for a in c.get("alt_of", []):
                keep.add(norm(a))
    subset = {k: entries[k] for k in sorted(keep) if k in entries}
    missing_cards = sorted(k for k in card_lemmas() if k not in entries)

    doc = {
        "meta": {
            "source": "English Wiktionary via kaikki.org (wiktextract)",
            "license": "CC BY-SA 4.0 (Wiktionary content); cite Ylonen, LREC 2022 for wiktextract",
            "dump": meta.get("last_modified"),
            "fetched": meta.get("fetched"),
            "built": time.strftime("%Y-%m-%d"),
            "latin_entries_total": n_in,
            "keys_cached": len(subset),
            "attested_surfaces_indexed": len(analyses),
            "card_lemmas_absent": missing_cards,
            "key_normalization": "strip macrons, lowercase, j->i, v->u, letters only (ls_lookup.norm)",
        },
        "entries": subset,
        "surfaces": {k: analyses[k] for k in sorted(analyses)},
    }
    write_cache(doc)
    print(f"build: {n_in:,} Latin entries -> {LATIN_COMPACT.name}; "
          f"cached {len(subset):,} keys, {len(analyses):,} attested surfaces -> {CACHE}")


def write_cache(doc):
    """One key per line so diffs on re-extraction stay readable."""
    CACHE.parent.mkdir(parents=True, exist_ok=True)
    with CACHE.open("w", encoding="utf-8") as f:
        f.write('{\n"meta": ' + json.dumps(doc["meta"], ensure_ascii=False, indent=2) + ',\n')
        for section in ("entries", "surfaces"):
            items = list(doc[section].items())
            f.write(f'"{section}": {{\n')
            for i, (k, v) in enumerate(items):
                sep = "," if i < len(items) - 1 else ""
                f.write(f"{json.dumps(k)}: {json.dumps(v, ensure_ascii=False, separators=(',', ':'))}{sep}\n")
            f.write("}" + ("," if section == "entries" else "") + "\n")
        f.write("}\n")


def main():
    cmd = sys.argv[1] if len(sys.argv) > 1 else ""
    if cmd == "fetch":
        fetch()
    elif cmd == "build":
        build()
    else:
        sys.exit(__doc__)


if __name__ == "__main__":
    main()

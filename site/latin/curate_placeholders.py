#!/usr/bin/env python3
"""Phase 3: build corrected lexicon entries for the 64 placeholder lemmata.

Reads the worklist (site/latin/staging/placeholder-worklist.json) for the
manuscript surfaces each id must cover, applies the editorial decisions in
CURATION below, generates paradigms (auto via seed_vocab for regular
noun/adj/verb; hand-built for pronouns / Greek nouns / defectives), and writes:

  site/latin/staging/placeholder-corrections.json   — id -> corrected entry
  + a coverage report to stdout (every manuscript surface must land in a
    paradigm cell or alt_forms; misses are flagged).

READ-ONLY w.r.t. lexicon.json / manuscript.latin.json. Applying is a separate
step (apply_placeholder_curation.py).

Glosses are concise, lemma-general (per the project's word-only card scope),
cross-checked against Whitaker's WORDS and Lewis & Short 1879.
"""
import json
import re
import unicodedata
from pathlib import Path

import seed_vocab as sv

REPO = Path(__file__).resolve().parents[2]
LEXICON = REPO / "content" / "_language" / "latin" / "lexicon.json"
WORKLIST = REPO / "site" / "latin" / "staging" / "placeholder-worklist.json"
OUT = REPO / "site" / "latin" / "staging" / "placeholder-corrections.json"

PRON_ROWS = ["nom", "voc", "gen", "dat", "acc", "abl"]
PRON_GCOLS = ["sg.masc", "sg.fem", "sg.neut", "pl.masc", "pl.fem", "pl.neut"]


def norm(s):
    s = unicodedata.normalize("NFD", s or "")
    s = "".join(c for c in s if unicodedata.category(c) != "Mn")
    return re.sub(r"[^a-z]", "", s.lower().replace("j", "i").replace("v", "u"))


# ── manual paradigm builders ────────────────────────────────────────────────

def gender3(rows, cells_by_gender):
    """cells_by_gender: {'masc':{'nom.sg':..,'gen.sg':..,...}, 'fem':..., 'neut':...}
    Each gender dict keyed by 'case.num'. Returns a 3-gender pron/adj paradigm."""
    cells = {}
    for g, d in cells_by_gender.items():
        for cn, form in d.items():
            cells[f"{cn}.{g}"] = form
    return {"type": "pron", "rows": PRON_ROWS, "cols": PRON_GCOLS, "cells": cells}


def personal(cells):
    """Personal/reflexive pronoun: cols sg/pl, no gender. cells keyed 'case.num'."""
    return {"type": "pron", "rows": PRON_ROWS, "cols": ["sg", "pl"], "cells": dict(cells)}


# Pronominal declension (unus/ullus type): gen -ius, dat -i, else 1st/2nd.
def pronominal(stem):
    s = stem
    g = {
        "masc": {"nom.sg": s+"us", "gen.sg": s+"ius", "dat.sg": s+"i", "acc.sg": s+"um", "abl.sg": s+"o",
                 "nom.pl": s+"i", "gen.pl": s+"orum", "dat.pl": s+"is", "acc.pl": s+"os", "abl.pl": s+"is"},
        "fem":  {"nom.sg": s+"a", "gen.sg": s+"ius", "dat.sg": s+"i", "acc.sg": s+"am", "abl.sg": s+"a",
                 "nom.pl": s+"ae", "gen.pl": s+"arum", "dat.pl": s+"is", "acc.pl": s+"as", "abl.pl": s+"is"},
        "neut": {"nom.sg": s+"um", "gen.sg": s+"ius", "dat.sg": s+"i", "acc.sg": s+"um", "abl.sg": s+"o",
                 "nom.pl": s+"a", "gen.pl": s+"orum", "dat.pl": s+"is", "acc.pl": s+"a", "abl.pl": s+"is"},
    }
    return gender3(PRON_ROWS, g)


# First-declension proper/Greek noun (Ortygia type, all genders -a/-ae).
def noun1(stem, gender="fem"):
    cells = {"nom.sg": stem+"a", "gen.sg": stem+"ae", "dat.sg": stem+"ae",
             "acc.sg": stem+"am", "abl.sg": stem+"a", "voc.sg": stem+"a",
             "nom.pl": stem+"ae", "gen.pl": stem+"arum", "dat.pl": stem+"is",
             "acc.pl": stem+"as", "abl.pl": stem+"is", "voc.pl": stem+"ae"}
    return {"type": "noun", "rows": ["nom", "voc", "gen", "dat", "acc", "abl"],
            "cols": ["sg", "pl"], "cells": cells}


# ── editorial decisions ─────────────────────────────────────────────────────
# Each value: dict with at least {lemma, pos, glosses}. Optional:
#   gender, principal_parts, head, paradigm ('auto'|dict), morpheus_pos (lookup
#   hint, default from pos), defective, alt_forms (extra surfaces to cover),
#   action ('delete'), needs_token_fix (note for manuscript reconciliation).

CURATION = {
    # ── pronouns (hand-built; high frequency) ──────────────────────────────
    "sui_pron": {"lemma": "sui", "pos": "pron",
                 "glosses": ["himself, herself, itself, themselves (reflexive)", "him, her, it, them"],
                 "head": "suī (reflexive)", "defective": True,
                 "alt_forms": ["secum", "sese"],
                 "paradigm": personal({"gen.sg": "sui", "dat.sg": "sibi", "acc.sg": ["se", "sese"], "abl.sg": ["se", "sese", "secum"],
                                       "gen.pl": "sui", "dat.pl": "sibi", "acc.pl": ["se", "sese"], "abl.pl": ["se", "sese", "secum"]})},
    "nos_pron": {"lemma": "nos", "pos": "pron",
                 "glosses": ["we, us (1st person plural)"],
                 "head": "nōs, nostrum/nostrī", "defective": True,
                 "paradigm": personal({"nom.pl": "nos", "voc.pl": "nos", "gen.pl": "nostri",
                                       "dat.pl": "nobis", "acc.pl": "nos", "abl.pl": "nobis"}),
                 "alt_forms": ["nostrum"]},
    "unus_pron": {"lemma": "unus", "pos": "pron",
                  "glosses": ["one", "a single, only", "alone"],
                  "head": "ūnus, -a, -um", "paradigm": pronominal("un")},
    "ullus_pron": {"lemma": "ullus", "pos": "pron",
                   "glosses": ["any", "anyone, anything"],
                   "head": "ūllus, -a, -um", "paradigm": pronominal("ull")},
    "idem_pron": {"lemma": "idem", "pos": "pron",
                  "glosses": ["the same", "likewise, too"],
                  "head": "īdem, eadem, idem",
                  "paradigm": gender3(PRON_ROWS, {
                      "masc": {"nom.sg": "idem", "gen.sg": "eiusdem", "dat.sg": "eidem", "acc.sg": "eundem", "abl.sg": "eodem",
                               "nom.pl": "eidem", "gen.pl": "eorundem", "dat.pl": "isdem", "acc.pl": "eosdem", "abl.pl": "isdem"},
                      "fem":  {"nom.sg": "eadem", "gen.sg": "eiusdem", "dat.sg": "eidem", "acc.sg": "eandem", "abl.sg": "eadem",
                               "nom.pl": "eaedem", "gen.pl": "earundem", "dat.pl": "isdem", "acc.pl": "easdem", "abl.pl": "isdem"},
                      "neut": {"nom.sg": "idem", "gen.sg": "eiusdem", "dat.sg": "eidem", "acc.sg": "idem", "abl.sg": "eodem",
                               "nom.pl": "eadem", "gen.pl": "eorundem", "dat.pl": "isdem", "acc.pl": "eadem", "abl.pl": "isdem"}}),
                  "alt_forms": ["eidem", "eisdem"]},
    "is_adv": {"lemma": "is", "pos": "pron",
               "glosses": ["he, she, it", "this, that", "such"],
               "head": "is, ea, id",
               "paradigm": gender3(PRON_ROWS, {
                   "masc": {"nom.sg": "is", "gen.sg": "eius", "dat.sg": "ei", "acc.sg": "eum", "abl.sg": "eo",
                            "nom.pl": "ei", "gen.pl": "eorum", "dat.pl": "eis", "acc.pl": "eos", "abl.pl": "eis"},
                   "fem":  {"nom.sg": "ea", "gen.sg": "eius", "dat.sg": "ei", "acc.sg": "eam", "abl.sg": "ea",
                            "nom.pl": "eae", "gen.pl": "earum", "dat.pl": "eis", "acc.pl": "eas", "abl.pl": "eis"},
                   "neut": {"nom.sg": "id", "gen.sg": "eius", "dat.sg": "ei", "acc.sg": "id", "abl.sg": "eo",
                            "nom.pl": "ea", "gen.pl": "eorum", "dat.pl": "eis", "acc.pl": "ea", "abl.pl": "eis"}}),
               "alt_forms": ["ii", "iis"]},
    "quisque_pron": {"lemma": "quisque", "pos": "pron",
                     "glosses": ["each, each one", "every", "everyone, everything"],
                     "head": "quisque, quaeque, quodque",
                     "paradigm": gender3(PRON_ROWS, {
                         "masc": {"nom.sg": "quisque", "gen.sg": "cuiusque", "dat.sg": "cuique", "acc.sg": "quemque", "abl.sg": "quoque",
                                  "nom.pl": "quique", "gen.pl": "quorumque", "dat.pl": "quibusque", "acc.pl": "quosque", "abl.pl": "quibusque"},
                         "fem":  {"nom.sg": "quaeque", "gen.sg": "cuiusque", "dat.sg": "cuique", "acc.sg": "quamque", "abl.sg": "quaque",
                                  "nom.pl": "quaeque", "gen.pl": "quarumque", "dat.pl": "quibusque", "acc.pl": "quasque", "abl.pl": "quibusque"},
                         "neut": {"nom.sg": "quodque", "gen.sg": "cuiusque", "dat.sg": "cuique", "acc.sg": "quodque", "abl.sg": "quoque",
                                  "nom.pl": "quaeque", "gen.pl": "quorumque", "dat.pl": "quibusque", "acc.pl": "quaeque", "abl.pl": "quibusque"}}),
                     "alt_forms": ["quidque", "quicque"]},
    "quisquam_pron": {"lemma": "quisquam", "pos": "pron", "defective": True,
                      "glosses": ["anyone, anything (at all)", "any (substantive)"],
                      "head": "quisquam, quicquam (no pl.)",
                      "paradigm": gender3(PRON_ROWS, {
                          "masc": {"nom.sg": "quisquam", "gen.sg": "cuiusquam", "dat.sg": "cuiquam", "acc.sg": "quemquam", "abl.sg": "quoquam"},
                          "fem":  {"nom.sg": "quisquam", "gen.sg": "cuiusquam", "dat.sg": "cuiquam", "acc.sg": "quamquam", "abl.sg": "quaquam"},
                          "neut": {"nom.sg": "quicquam", "gen.sg": "cuiusquam", "dat.sg": "cuiquam", "acc.sg": "quicquam", "abl.sg": "quoquam"}}),
                      "alt_forms": ["quidquam"]},
    # ── ultimus (split from ulter_pron; the 'ultra' surfaces re-point) ──────
    "ulter_pron": {"lemma": "ultimus", "pos": "adj", "morpheus_pos": "ADJ",
                   "glosses": ["farthest, most distant", "last, final", "utmost, extreme"],
                   "head": "ultimus, -a, -um", "paradigm": "auto",
                   "needs_token_fix": "L530/L668 surface 'ultra' is the adverb/prep, not ultimus; "
                                      "re-point those two tokens to ultra_adv."},

    # ── verbs (auto paradigm via DICTLINE) ─────────────────────────────────
    "in-pleo_adv": {"lemma": "impleo", "pos": "verb", "morpheus_pos": "V", "conj": 2,
                    "glosses": ["fill, fill up", "satisfy, fulfil", "complete, finish"],
                    "principal_parts": ["impleo", "implere", "implevi", "impletum"],
                    "paradigm": "auto", "alt_forms": ["inplet", "inplent"]},
    "resupino_adv": {"lemma": "resupino", "pos": "verb", "morpheus_pos": "V", "conj": 1,
                     "glosses": ["bend back, throw on its back", "lay back, turn up"],
                     "principal_parts": ["resupino", "resupinare", "resupinavi", "resupinatum"],
                     "paradigm": "auto"},
    "pertimeo_adv": {"lemma": "pertimesco", "pos": "verb", "morpheus_pos": "V", "conj": 3,
                     "glosses": ["become greatly afraid", "fear greatly, dread"],
                     "principal_parts": ["pertimesco", "pertimescere", "pertimui", ""],
                     "paradigm": "auto"},
    "occaedes_adv": {"lemma": "occido", "pos": "verb", "morpheus_pos": "V", "conj": 3,
                     "glosses": ["fall, fall down", "perish, die, be slain", "(of the sun) set"],
                     "principal_parts": ["occido", "occidere", "occidi", "occasum"],
                     "paradigm": "auto",
                     "needs_token_fix": "occĭdo (fall/die), not occīdo (kill); confirm reading at L240."},
    "decet_adv": {"lemma": "decet", "pos": "verb", "morpheus_pos": "V", "conj": 2, "verb_present": "deceo",
                  "glosses": ["it is fitting, becoming, proper", "suits, beseems, adorns"],
                  "head": "decet, decēre, decuit (chiefly 3rd pers.)",
                  "principal_parts": ["deceo", "decere", "decui", ""], "paradigm": "auto",
                  "note": "L527 'decens' re-pointed to decens_adj (participial adjective)."},

    # ── adjectives (auto) ──────────────────────────────────────────────────
    "frigida_adv":   {"lemma": "frigidus", "pos": "adj", "glosses": ["cold, cool, chilly", "lifeless, dull"], "paradigm": "auto"},
    "limosa_adv":    {"lemma": "limosus", "pos": "adj", "glosses": ["muddy, miry, slimy"], "paradigm": "auto"},
    "manifesta_adv": {"lemma": "manifestus", "pos": "adj", "glosses": ["clear, evident, plain", "caught in the act"], "paradigm": "auto"},
    "umbrosa_adv":   {"lemma": "umbrosus", "pos": "adj", "glosses": ["shady, shadowy"], "paradigm": "auto"},
    "inhospita_adv": {"lemma": "inhospitus", "pos": "adj", "glosses": ["inhospitable"], "paradigm": "auto"},
    "tenebrosum_adv":{"lemma": "tenebrosus", "pos": "adj", "glosses": ["dark, gloomy, murky"], "paradigm": "auto"},
    "sincero_adv":   {"lemma": "sincerus", "pos": "adj", "glosses": ["clean, pure, sound, whole", "genuine"], "paradigm": "auto"},
    "matutinum_adv": {"lemma": "matutinus", "pos": "adj", "glosses": ["of the morning, early"], "paradigm": "auto"},
    "popularia_adv": {"lemma": "popularis", "pos": "adj", "glosses": ["of the people, popular", "native, fellow-"], "paradigm": "auto"},
    "regales_adv":   {"lemma": "regalis", "pos": "adj", "glosses": ["royal, regal, kingly"], "paradigm": "auto"},
    "dubitabilis_adv":{"lemma": "dubitabilis", "pos": "adj", "glosses": ["doubtful, uncertain"], "paradigm": "auto"},
    "instabilio_adv":{"lemma": "instabilis", "pos": "adj", "glosses": ["unstable, unsteady", "not firm"], "paradigm": "auto"},
    "zephyrius_adv": {"lemma": "Zephyrus", "pos": "noun", "gender": "masc",
                      "glosses": ["the west wind, Zephyr", "(pl.) the west winds"], "paradigm": "auto",
                      "note": "L108 'zephyri ... flores' is nom.pl subject = Zephyrus (noun), not an adjective."},
    "proprio_adv":   {"lemma": "proprius", "pos": "adj", "glosses": ["one's own, special, particular", "characteristic, lasting"], "paradigm": "auto"},
    "profuga_adv":   {"lemma": "profugus", "pos": "adj", "glosses": ["fleeing, fugitive", "exiled, banished"], "paradigm": "auto"},
    "praecinctus_adv":{"lemma": "praecinctus", "pos": "adj", "glosses": ["girded, girt, wrapped"], "paradigm": "auto",
                       "note": "PPP of praecingo used adjectivally."},
    "intermissus_adv":{"lemma": "intermissus", "pos": "adj", "glosses": ["interrupted, left off, suspended"], "paradigm": "auto",
                       "note": "PPP of intermitto used adjectivally."},
    "intondeo_adv":  {"lemma": "intonsus", "pos": "adj", "glosses": ["unshorn, with long/uncut hair", "unshaven; unpruned"], "paradigm": "auto",
                      "note": "L563 intonsis = intonsus (adj), not the verb intondeo."},
    "auxiliares_adv":{"lemma": "auxiliaris", "pos": "adj", "glosses": ["auxiliary, helping", "(pl. as noun) auxiliary troops"], "paradigm": "auto"},

    # ── nouns (auto) ───────────────────────────────────────────────────────
    "auxilia_adv":   {"lemma": "auxilium", "pos": "noun", "gender": "neut", "glosses": ["help, aid, assistance", "(pl.) auxiliary troops, reinforcements"], "paradigm": "auto"},
    "filius_adv":    {"lemma": "filius", "pos": "noun", "gender": "masc", "glosses": ["son"], "paradigm": "auto"},
    "congeries_adv": {"lemma": "congeries", "pos": "noun", "gender": "fem", "glosses": ["heap, pile, mass", "accumulation"], "paradigm": "auto"},
    "caelicola_adv": {"lemma": "caelicola", "pos": "noun", "gender": "c", "glosses": ["heaven-dweller, deity, god"], "paradigm": "auto"},
    "incola_adv":    {"lemma": "incola", "pos": "noun", "gender": "c", "glosses": ["inhabitant, resident, dweller"], "paradigm": "auto"},
    "mariti_adv":    {"lemma": "maritus", "pos": "noun", "gender": "masc", "glosses": ["husband", "mate"], "paradigm": "auto"},
    "modium_adv":    {"lemma": "modus", "pos": "noun", "gender": "masc", "glosses": ["measure, limit, bound", "manner, way, method", "rhythm, meter"], "paradigm": "auto"},
    "nauta_adv":     {"lemma": "nauta", "pos": "noun", "gender": "masc", "glosses": ["sailor, seaman, mariner"], "paradigm": "auto",
                      "cell_extra": {"nom.sg": ["navita"]}, "alt_forms": ["navita"]},
    "vulgus_adv":    {"lemma": "vulgus", "pos": "noun", "gender": "neut", "glosses": ["the common people, crowd, multitude", "the public; the rabble"], "paradigm": "auto"},
    "otia_adv":      {"lemma": "otium", "pos": "noun", "gender": "neut", "glosses": ["leisure, free time", "peace, ease, idleness"], "paradigm": "auto"},
    "suco_adv":      {"lemma": "sucus", "pos": "noun", "gender": "masc", "glosses": ["juice, sap, moisture", "fluid, draught"], "paradigm": "auto"},
    "exitio_adv":    {"lemma": "exitium", "pos": "noun", "gender": "neut", "glosses": ["destruction, ruin", "death"], "paradigm": "auto"},
    "vinculo_adv":   {"lemma": "vinculum", "pos": "noun", "gender": "neut", "glosses": ["chain, bond, fetter", "(pl.) imprisonment"], "paradigm": "auto"},
    "pelagium_adv":  {"lemma": "pelagus", "pos": "noun", "gender": "neut", "glosses": ["the sea, the open sea, the main"], "paradigm": "auto"},
    "viscera_adv":   {"lemma": "viscus", "pos": "noun", "gender": "neut", "defective": True,
                      "glosses": ["(usu. pl.) entrails, innards, flesh", "the vitals; one's own offspring"],
                      "head": "viscus, visceris, n. (usu. pl. viscera)",
                      "paradigm": {"type": "noun", "rows": ["nom", "gen", "dat", "acc", "abl"], "cols": ["sg", "pl"],
                                   "cells": {"nom.sg": "viscus", "gen.sg": "visceris", "dat.sg": "visceri",
                                             "acc.sg": "viscus", "abl.sg": "viscere",
                                             "nom.pl": "viscera", "gen.pl": "viscerum", "dat.pl": "visceribus",
                                             "acc.pl": "viscera", "abl.pl": "visceribus"}}},

    # ── pluralia tantum (auto; sg cells legitimately absent) ───────────────
    "insidiae_adv":  {"lemma": "insidiae", "pos": "noun", "gender": "fem", "defective": True,
                      "glosses": ["ambush", "plot, treachery, snare"], "paradigm": "auto"},
    "exuviae_adv":   {"lemma": "exuviae", "pos": "noun", "gender": "fem", "defective": True,
                      "glosses": ["what is stripped off: spoils, arms", "hide, skin, slough", "garments"], "paradigm": "auto"},

    # ── Greek / proper nouns (hand-built) ──────────────────────────────────
    "clymenos_adv": {"lemma": "Clymene", "pos": "noun", "gender": "fem", "defective": True,
                     "glosses": ["Clymene (mother of Phaethon)"],
                     "head": "Clymenē, -ēs, f. (Greek 1st-decl)",
                     "paradigm": {"type": "noun", "rows": ["nom", "voc", "gen", "dat", "acc", "abl"], "cols": ["sg"],
                                  "cells": {"nom.sg": "Clymene", "voc.sg": "Clymene", "gen.sg": "Clymenes",
                                            "dat.sg": "Clymenae", "acc.sg": "Clymenen", "abl.sg": "Clymene"}}},
    "lycaon_adv":   {"lemma": "Lycaon", "pos": "noun", "gender": "masc", "defective": True,
                     "glosses": ["Lycaon (king of Arcadia, changed into a wolf)"],
                     "head": "Lycāōn, -onis, m. (Greek 3rd-decl)",
                     "paradigm": {"type": "noun", "rows": ["nom", "voc", "gen", "dat", "acc", "abl"], "cols": ["sg"],
                                  "cells": {"nom.sg": "Lycaon", "voc.sg": "Lycaon", "gen.sg": "Lycaonis",
                                            "dat.sg": "Lycaoni", "acc.sg": "Lycaona", "abl.sg": "Lycaone"}},
                     "alt_forms": ["Lycaonem"]},
    "ortygia_adv":  {"lemma": "Ortygia", "pos": "noun", "gender": "fem", "defective": True,
                     "glosses": ["Ortygia (old name of Delos)"],
                     "head": "Ortygia, -ae, f.", "paradigm": noun1("Ortygi")},
    "boreas_adv":   {"lemma": "Boreas", "pos": "noun", "gender": "masc", "defective": True,
                     "glosses": ["the north wind", "Boreas (god of the north wind)"],
                     "head": "Boreās, -ae, m. (Greek 1st-decl)",
                     "paradigm": {"type": "noun", "rows": ["nom", "voc", "gen", "dat", "acc", "abl"], "cols": ["sg"],
                                  "cells": {"nom.sg": "Boreas", "voc.sg": "Borea", "gen.sg": "Boreae",
                                            "dat.sg": "Boreae", "acc.sg": "Borean", "abl.sg": "Borea"}},
                     "alt_forms": ["Boream"]},
    "chaos_adv":    {"lemma": "chaos", "pos": "noun", "gender": "neut", "defective": True,
                     "glosses": ["Chaos, the formless primordial mass", "the shapeless void; the abyss"],
                     "head": "chaos, n. (Greek; chiefly nom./acc./abl. sg.)",
                     "paradigm": {"type": "noun", "rows": ["nom", "voc", "gen", "dat", "acc", "abl"], "cols": ["sg"],
                                  "cells": {"nom.sg": "chaos", "voc.sg": "chaos", "gen.sg": "chaos",
                                            "acc.sg": "chaos", "abl.sg": "chao"}}},

    # ── numerals (distributive; plural adj paradigm) ───────────────────────
    "bini_adv": {"lemma": "bini", "pos": "num", "defective": True,
                 "glosses": ["two each, two by two", "a pair of"],
                 "head": "bīnī, -ae, -a (distributive)",
                 "paradigm": {"type": "adj", "rows": ["nom", "gen", "dat", "acc", "abl"],
                              "cols": ["pl.masc", "pl.fem", "pl.neut"],
                              "cells": {"nom.pl.masc": "bini", "nom.pl.fem": "binae", "nom.pl.neut": "bina",
                                        "gen.pl.masc": "binorum", "gen.pl.fem": "binarum", "gen.pl.neut": "binorum",
                                        "dat.pl.masc": "binis", "dat.pl.fem": "binis", "dat.pl.neut": "binis",
                                        "acc.pl.masc": "binos", "acc.pl.fem": "binas", "acc.pl.neut": "bina",
                                        "abl.pl.masc": "binis", "abl.pl.fem": "binis", "abl.pl.neut": "binis"}}},
    "quini_adv": {"lemma": "quini", "pos": "num", "defective": True,
                  "glosses": ["five each, five by five", "a set of five"],
                  "head": "quīnī, -ae, -a (distributive)",
                  "paradigm": {"type": "adj", "rows": ["nom", "gen", "dat", "acc", "abl"],
                               "cols": ["pl.masc", "pl.fem", "pl.neut"],
                               "cells": {"nom.pl.masc": "quini", "nom.pl.fem": "quinae", "nom.pl.neut": "quina",
                                         "gen.pl.masc": "quinorum", "gen.pl.fem": "quinarum", "gen.pl.neut": "quinorum",
                                         "dat.pl.masc": "quinis", "dat.pl.fem": "quinis", "dat.pl.neut": "quinis",
                                         "acc.pl.masc": "quinos", "acc.pl.fem": "quinas", "acc.pl.neut": "quina",
                                         "abl.pl.masc": "quinis", "abl.pl.fem": "quinis", "abl.pl.neut": "quinis"}}},

    # ── comparative-only adj/adv (defective) ───────────────────────────────
    "ocior_adv": {"lemma": "ocior", "pos": "adj", "defective": True,
                  "glosses": ["swifter, more rapid", "(neut./adv. ocius) more swiftly, sooner"],
                  "head": "ōcior, ōcius (comparative; no positive)",
                  "paradigm": {"type": "adj", "rows": ["nom", "gen", "dat", "acc", "abl"],
                               "cols": ["sg.masc", "sg.fem", "sg.neut"],
                               "cells": {"nom.sg.masc": "ocior", "nom.sg.fem": "ocior", "nom.sg.neut": "ocius",
                                         "gen.sg.masc": "ocioris", "gen.sg.fem": "ocioris", "gen.sg.neut": "ocioris",
                                         "dat.sg.masc": "ociori", "dat.sg.fem": "ociori", "dat.sg.neut": "ociori",
                                         "acc.sg.masc": "ociorem", "acc.sg.fem": "ociorem", "acc.sg.neut": "ocius",
                                         "abl.sg.masc": "ociore", "abl.sg.fem": "ociore", "abl.sg.neut": "ociore"}}},

    # ── tonitrus (4th-decl m., poetic neut. pl. tonitrua) ──────────────────
    "tonitruo_adv": {"lemma": "tonitrus", "pos": "noun", "gender": "masc", "defective": True,
                     "glosses": ["thunder, thunderclap"],
                     "head": "tonitrus, -ūs, m. (also tonitru, n.)",
                     "paradigm": {"type": "noun", "rows": ["nom", "voc", "gen", "dat", "acc", "abl"], "cols": ["sg", "pl"],
                                  "cells": {"nom.sg": "tonitrus", "gen.sg": "tonitrus", "dat.sg": "tonitru",
                                            "acc.sg": "tonitrum", "abl.sg": "tonitru",
                                            "nom.pl": ["tonitrus", "tonitrua"], "gen.pl": "tonituum", "dat.pl": "tonitribus",
                                            "acc.pl": ["tonitrus", "tonitrua"], "abl.pl": "tonitribus"}},
                     "alt_forms": ["tonitruum", "tonitru"]},

    # ── genuine adverb (invariant; drop paradigm) ──────────────────────────
    "totiens_adv": {"lemma": "totiens", "pos": "adv", "glosses": ["so often, so many times"], "paradigm": None},

    # ── merged-token indefinite (sī + quis) ────────────────────────────────
    "siquis_adv": {"lemma": "siquis", "pos": "pron", "defective": True,
                   "glosses": ["if any, if anyone, if anything (sī + indefinite quis)"],
                   "head": "sīquis, sīqua, sīquid",
                   "paradigm": gender3(PRON_ROWS, {
                       "masc": {"nom.sg": "siquis", "acc.sg": "siquem", "abl.sg": "siquo"},
                       "fem":  {"nom.sg": "siqua", "acc.sg": "siquam", "abl.sg": "siqua"},
                       "neut": {"nom.sg": "siquid", "acc.sg": "siquid", "abl.sg": "siquo"}}),
                   "note": "Edition tokenizes 'Siqua' as one word; kept as a merged indefinite lemma."},

    # ── ulmus (elm) ────────────────────────────────────────────────────────
    "ulmus_adv": {"lemma": "ulmus", "pos": "noun", "gender": "fem", "glosses": ["elm, elm tree"], "paradigm": "auto"},
    "monticola_adv": {"lemma": "monticola", "pos": "noun", "gender": "c", "glosses": ["mountain-dweller, highlander"], "paradigm": "auto"},

    # ── orphan: delete ─────────────────────────────────────────────────────
    "molleo_adv": {"action": "delete", "note": "0 manuscript refs; token superseded by fill-lexicon-gaps.js."},
}


# ── deterministic regular generators (fallback when DICTLINE lookup misses) ──
NOUN_ROWS_A = ["nom", "gen", "dat", "acc", "abl"]
ADJ_GCOLS = ["sg.masc", "sg.fem", "sg.neut", "pl.masc", "pl.fem", "pl.neut"]
VERB_ROWS = ["1sg", "2sg", "3sg", "1pl", "2pl", "3pl"]


def _noun(cells, cols=("sg", "pl")):
    return {"type": "noun", "rows": NOUN_ROWS_A, "cols": list(cols), "cells": cells}


def regular_noun(lemma, gender, plural_only=False):
    """Decline a regular 1st/2nd-declension noun from its citation form."""
    g = gender
    sg, pl = {}, {}
    if lemma.endswith("ae"):  # 1st-decl plurale tantum
        st = lemma[:-2]
        pl = {"nom.pl": st+"ae", "gen.pl": st+"arum", "dat.pl": st+"is", "acc.pl": st+"as", "abl.pl": st+"is"}
        return _noun(pl, cols=("pl",))
    if lemma.endswith("a"):  # 1st-decl
        st = lemma[:-1]
        sg = {"nom.sg": st+"a", "gen.sg": st+"ae", "dat.sg": st+"ae", "acc.sg": st+"am", "abl.sg": st+"a"}
        pl = {"nom.pl": st+"ae", "gen.pl": st+"arum", "dat.pl": st+"is", "acc.pl": st+"as", "abl.pl": st+"is"}
    elif lemma.endswith("ius"):  # filius type (gen -ii)
        st = lemma[:-2]
        sg = {"nom.sg": lemma, "gen.sg": st+"i", "dat.sg": st+"o", "acc.sg": st+"um", "abl.sg": st+"o"}
        pl = {"nom.pl": st+"i", "gen.pl": st+"orum", "dat.pl": st+"is", "acc.pl": st+"os", "abl.pl": st+"is"}
    elif lemma.endswith("um"):  # 2nd-decl neuter
        st = lemma[:-2]
        sg = {"nom.sg": lemma, "gen.sg": st+"i", "dat.sg": st+"o", "acc.sg": lemma, "abl.sg": st+"o"}
        pl = {"nom.pl": st+"a", "gen.pl": st+"orum", "dat.pl": st+"is", "acc.pl": st+"a", "abl.pl": st+"is"}
    elif lemma.endswith("us") and g == "neut":  # vulgus/pelagus: 2nd-decl neuter in -us
        st = lemma[:-2]
        sg = {"nom.sg": lemma, "gen.sg": st+"i", "dat.sg": st+"o", "acc.sg": lemma, "abl.sg": st+"o"}
        pl = {"nom.pl": st+"a", "gen.pl": st+"orum", "dat.pl": st+"is", "acc.pl": st+"a", "abl.pl": st+"is"}
    elif lemma.endswith("us"):  # 2nd-decl masc/fem
        st = lemma[:-2]
        sg = {"nom.sg": lemma, "gen.sg": st+"i", "dat.sg": st+"o", "acc.sg": st+"um", "abl.sg": st+"o"}
        pl = {"nom.pl": st+"i", "gen.pl": st+"orum", "dat.pl": st+"is", "acc.pl": st+"os", "abl.pl": st+"is"}
    else:
        return None
    cells = dict(sg)
    cells.update(pl)
    return _noun(cells)


def regular_adj(lemma):
    """Decline a regular adjective: us/-a/-um or 3rd-decl two-termination -is/-e."""
    if lemma.endswith("us"):
        st = lemma[:-2]
        end = {  # case.num.gender -> ending
            ("nom", "sg", "masc"): "us", ("nom", "sg", "fem"): "a",   ("nom", "sg", "neut"): "um",
            ("gen", "sg", "masc"): "i",  ("gen", "sg", "fem"): "ae",  ("gen", "sg", "neut"): "i",
            ("dat", "sg", "masc"): "o",  ("dat", "sg", "fem"): "ae",  ("dat", "sg", "neut"): "o",
            ("acc", "sg", "masc"): "um", ("acc", "sg", "fem"): "am",  ("acc", "sg", "neut"): "um",
            ("abl", "sg", "masc"): "o",  ("abl", "sg", "fem"): "a",   ("abl", "sg", "neut"): "o",
            ("nom", "pl", "masc"): "i",  ("nom", "pl", "fem"): "ae",  ("nom", "pl", "neut"): "a",
            ("gen", "pl", "masc"): "orum", ("gen", "pl", "fem"): "arum", ("gen", "pl", "neut"): "orum",
            ("dat", "pl", "masc"): "is", ("dat", "pl", "fem"): "is",  ("dat", "pl", "neut"): "is",
            ("acc", "pl", "masc"): "os", ("acc", "pl", "fem"): "as",  ("acc", "pl", "neut"): "a",
            ("abl", "pl", "masc"): "is", ("abl", "pl", "fem"): "is",  ("abl", "pl", "neut"): "is",
        }
    elif lemma.endswith("is"):  # 3rd-decl two-termination
        st = lemma[:-2]
        end = {
            ("nom", "sg", "masc"): "is", ("nom", "sg", "fem"): "is", ("nom", "sg", "neut"): "e",
            ("gen", "sg", "masc"): "is", ("gen", "sg", "fem"): "is", ("gen", "sg", "neut"): "is",
            ("dat", "sg", "masc"): "i",  ("dat", "sg", "fem"): "i",  ("dat", "sg", "neut"): "i",
            ("acc", "sg", "masc"): "em", ("acc", "sg", "fem"): "em", ("acc", "sg", "neut"): "e",
            ("abl", "sg", "masc"): "i",  ("abl", "sg", "fem"): "i",  ("abl", "sg", "neut"): "i",
            ("nom", "pl", "masc"): "es", ("nom", "pl", "fem"): "es", ("nom", "pl", "neut"): "ia",
            ("gen", "pl", "masc"): "ium", ("gen", "pl", "fem"): "ium", ("gen", "pl", "neut"): "ium",
            ("dat", "pl", "masc"): "ibus", ("dat", "pl", "fem"): "ibus", ("dat", "pl", "neut"): "ibus",
            ("acc", "pl", "masc"): "es", ("acc", "pl", "fem"): "es", ("acc", "pl", "neut"): "ia",
            ("abl", "pl", "masc"): "ibus", ("abl", "pl", "fem"): "ibus", ("abl", "pl", "neut"): "ibus",
        }
    else:
        return None
    cells = {f"{c}.{n}.{g}": st + e for (c, n, g), e in end.items()}
    return {"type": "adj", "rows": NOUN_ROWS_A, "cols": ADJ_GCOLS, "cells": cells}


# Full ending tables (already including thematic vowel), 1st & 2nd conjugation.
# Lists are ordered 1sg,2sg,3sg,1pl,2pl,3pl.
_VERB_ENDINGS = {
    1: {
        "pres.ind.act": ["o", "as", "at", "amus", "atis", "ant"],
        "imperf.ind.act": ["abam", "abas", "abat", "abamus", "abatis", "abant"],
        "fut.ind.act": ["abo", "abis", "abit", "abimus", "abitis", "abunt"],
        "pres.subj.act": ["em", "es", "et", "emus", "etis", "ent"],
        "imperf.subj.act": ["arem", "ares", "aret", "aremus", "aretis", "arent"],
        "pres.imp.act": [None, "a", None, None, "ate", None],
        "pres.ind.pass": ["or", "aris", "atur", "amur", "amini", "antur"],
        "imperf.ind.pass": ["abar", "abaris", "abatur", "abamur", "abamini", "abantur"],
        "fut.ind.pass": ["abor", "aberis", "abitur", "abimur", "abimini", "abuntur"],
    },
    2: {
        "pres.ind.act": ["eo", "es", "et", "emus", "etis", "ent"],
        "imperf.ind.act": ["ebam", "ebas", "ebat", "ebamus", "ebatis", "ebant"],
        "fut.ind.act": ["ebo", "ebis", "ebit", "ebimus", "ebitis", "ebunt"],
        "pres.subj.act": ["eam", "eas", "eat", "eamus", "eatis", "eant"],
        "imperf.subj.act": ["erem", "eres", "eret", "eremus", "eretis", "erent"],
        "pres.imp.act": [None, "e", None, None, "ete", None],
        "pres.ind.pass": ["eor", "eris", "etur", "emur", "emini", "entur"],
        "imperf.ind.pass": ["ebar", "ebaris", "ebatur", "ebamur", "ebamini", "ebantur"],
        "fut.ind.pass": ["ebor", "eberis", "ebitur", "ebimur", "ebimini", "ebuntur"],
    },
    3: {
        "pres.ind.act": ["o", "is", "it", "imus", "itis", "unt"],
        "imperf.ind.act": ["ebam", "ebas", "ebat", "ebamus", "ebatis", "ebant"],
        "fut.ind.act": ["am", "es", "et", "emus", "etis", "ent"],
        "pres.subj.act": ["am", "as", "at", "amus", "atis", "ant"],
        "imperf.subj.act": ["erem", "eres", "eret", "eremus", "eretis", "erent"],
        "pres.imp.act": [None, "e", None, None, "ite", None],
        "pres.ind.pass": ["or", "eris", "itur", "imur", "imini", "untur"],
        "imperf.ind.pass": ["ebar", "ebaris", "ebatur", "ebamur", "ebamini", "ebantur"],
        "fut.ind.pass": ["ar", "eris", "etur", "emur", "emini", "entur"],
    },
}
_PERF = ["i", "isti", "it", "imus", "istis", "erunt"]


def regular_verb(present, perf_stem, conj):
    """Regular 1st/2nd-conjugation verb. `present` is the 1sg (e.g. resupino);
    stem = present minus trailing 'o' (1st) or 'eo' (2nd)."""
    stem = present[:-2] if conj == 2 else present[:-1]
    cells = {}
    cols = []
    table = dict(_VERB_ENDINGS[conj])
    if perf_stem:
        table["perf.ind.act"] = [perf_stem + e for e in _PERF]
    col_order = ["pres.ind.act", "imperf.ind.act", "fut.ind.act", "perf.ind.act",
                 "pres.subj.act", "imperf.subj.act", "pres.imp.act",
                 "pres.ind.pass", "imperf.ind.pass", "fut.ind.pass"]
    for col in col_order:
        endings = table.get(col)
        if not endings:
            continue
        present_any = False
        for row, e in zip(VERB_ROWS, endings):
            if e is None:
                continue
            form = e if col == "perf.ind.act" else stem + e
            cells[f"{row}.{col}"] = form
            present_any = True
        if present_any:
            cols.append(col)
    return {"type": "verb", "rows": VERB_ROWS, "cols": cols, "cells": cells}


def auto_paradigm(lemma, pos, entries, by_stem, rules, dec):
    """Prefer the deterministic regular generators (complete paradigms);
    fall back to seed_vocab/DICTLINE for declensions they don't cover
    (3rd/4th/5th nouns, 3rd/4th-conj verbs)."""
    para, gender, entry = None, None, None
    if pos == "noun":
        para = regular_noun(lemma, dec.get("gender"))
    elif pos == "adj":
        para = regular_adj(lemma)
    elif pos == "verb" and dec.get("conj"):
        pp = dec.get("principal_parts", [])
        perf_stem = pp[2][:-1] if len(pp) > 2 and pp[2] else ""
        para = regular_verb(dec.get("verb_present", lemma), perf_stem, dec["conj"])
    if para is None:
        mp = {"noun": "N", "adj": "ADJ", "verb": "V"}.get(pos)
        entry = sv.lookup_entry(lemma, morpheus_pos=mp, infl_class="", by_stem=by_stem, entries=entries)
        if entry:
            if entry["pos"] == "N":
                para = sv.generate_noun_paradigm(entry, lemma, rules)
            elif entry["pos"] == "ADJ":
                para = sv.generate_adj_paradigm(entry, lemma, rules)
            elif entry["pos"] == "V":
                para = sv.generate_verb_paradigm(entry, lemma, rules)
            gender = sv.gender_from_form(entry)
    # merge any variant cell-forms (poetic/contracted) so the manuscript
    # surface lands on a real parse key (e.g. navita as a nom.sg of nauta).
    extra = dec.get("cell_extra")
    if para and extra:
        for k, forms in extra.items():
            cur = para["cells"].get(k)
            existing = cur if isinstance(cur, list) else ([cur] if cur else [])
            para["cells"][k] = existing + [f for f in forms if f not in existing]
    return para, gender, entry


def cell_forms(para):
    out = set()
    if not para:
        return out
    for v in para["cells"].values():
        for f in (v if isinstance(v, list) else [v]):
            out.add(norm(f))
    return out


def main():
    lex = json.loads(LEXICON.read_text())
    by_id = {l["id"]: l for l in lex["lemmata"]}
    work = {w["id"]: w for w in json.loads(WORKLIST.read_text())["lemmata"]}

    entries, by_stem = sv.load_dictline()
    rules = sv.load_inflects()

    corrections = {}
    report = []
    missing_ids = [i for i in CURATION if i not in by_id]
    if missing_ids:
        report.append(f"!! curation ids not in lexicon: {missing_ids}")
    uncurated = [l["id"] for l in lex["lemmata"]
                 if "placeholder pending lexicon curation" in l.get("glosses", []) and l["id"] not in CURATION]
    if uncurated:
        report.append(f"!! placeholders with no curation entry: {uncurated}")

    for cid, dec in CURATION.items():
        old = by_id.get(cid, {})
        if dec.get("action") == "delete":
            corrections[cid] = {"action": "delete", "note": dec.get("note", "")}
            report.append(f"DEL  {cid}")
            continue

        entry = {
            "id": cid,
            "lemma": dec["lemma"],
            "pos": dec["pos"],
            "glosses": dec["glosses"],
        }
        # head / gender / principal parts
        gender = dec.get("gender")
        para = dec.get("paradigm", "auto")
        auto_entry = None
        if para == "auto":
            gen_para, gen_gender, auto_entry = auto_paradigm(dec["lemma"], dec["pos"], entries, by_stem, rules, dec)
            para = gen_para
            if not gender:
                gender = {"m": "masc", "f": "fem", "n": "neut", "c": "c"}.get(gen_gender, gen_gender)
        if para:
            entry["paradigm"] = para
        if dec["pos"] == "noun" and gender:
            entry["gender"] = gender
        if "head" in dec:
            entry["head"] = dec["head"]
        elif auto_entry is not None:
            head, principal = sv.head_line(dec["lemma"], auto_entry)
            entry["head"] = head
            if principal and "principal_parts" not in dec:
                entry["principal_parts"] = principal
        if "principal_parts" in dec:
            entry["principal_parts"] = dec["principal_parts"]
        if dec.get("defective"):
            entry["defective"] = True
        alt = list(dict.fromkeys((old.get("alt_forms", []) or []) + dec.get("alt_forms", [])))
        if alt:
            entry["alt_forms"] = alt
        if "note" in dec:
            entry["notes"] = dec["note"]
        corrections[cid] = entry

        # coverage check
        surfaces = work.get(cid, {}).get("manuscript", {}).get("surfaces", [])
        covered = cell_forms(para) | {norm(a) for a in alt} | {norm(dec["lemma"])}
        misses = [s for s in surfaces if norm(s) not in covered]
        flag = ""
        if para is None and dec["pos"] in ("noun", "verb", "adj", "pron"):
            flag = "  [NO PARADIGM]"
        if misses:
            flag += f"  MISS surfaces: {misses}"
        if dec.get("needs_token_fix"):
            flag += f"  [token-fix: {dec['needs_token_fix']}]"
        report.append(f"OK   {cid:16} -> {dec['lemma']:13} {dec['pos']:5} cells={len(para['cells']) if para else 0:2}{flag}")

    OUT.write_text(json.dumps(corrections, indent=2, ensure_ascii=False) + "\n")
    print("\n".join(report))
    print(f"\nwrote {OUT.relative_to(REPO)} ({len(corrections)} entries)")
    nmiss = sum(1 for r in report if "MISS surfaces" in r)
    print(f"coverage misses: {nmiss}")


if __name__ == "__main__":
    main()

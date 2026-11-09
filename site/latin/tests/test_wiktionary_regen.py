"""Tests for wiktionary_regen.py card rebuilding (no cache or network needed).

Entries are hand-built in the shape wiktionary_extract.compact_entry emits.
"""
import copy
import sys
import unittest
from pathlib import Path

THIS_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(THIS_DIR.parent))

import wiktionary_regen as r  # noqa: E402

OK = r.atoms()


def verb(word, cells, **kw):
    return {"word": word, "pos": "verb", "cells": cells, **kw}


class TestVerbCard(unittest.TestCase):
    def test_principal_parts_and_supine_from_cell(self):
        # sonō lists two perfects in its head; the supine comes from its cell.
        e = verb("sonō", {"1sg.pres.ind.act": ["sonō"], "inf.pres.act": ["sonāre"],
                          "1sg.perf.ind.act": ["sonuī", "sonāvī"], "sup.acc": ["sonitum"]},
                 principal_parts=["sonō", "sonāre", "sonuī", "sonāvī", "sonitum"])
        card = {"id": "sono_v", "lemma": "sono", "pos": "verb", "glosses": ["sound"]}
        r.verb_card(card, e, r.build_cells(e, OK))
        self.assertEqual(card["principal_parts"], ["sono", "sonare", "sonui", "sonitum"])
        self.assertEqual(card["head"], "sono, sonare, sonui, sonitum")
        self.assertNotIn("sup.acc", card["paradigm"]["cells"])  # not a parse atom

    def test_deponent_head(self):
        e = verb("lābor", {"1sg.pres.ind.pass": ["lābor"], "inf.pres.pass": ["lābī"],
                           "ppp.nom.sg.masc": ["lāpsus"]}, deponent=True)
        card = {"id": "labor_v", "lemma": "labor", "pos": "verb", "glosses": []}
        r.verb_card(card, e, r.build_cells(e, OK))
        self.assertEqual(card["head"], "labor, labi, lapsus sum")
        # A lone -us participle is declined regularly into a full grid.
        ppp = card["ppp_paradigm"]["cells"]
        self.assertEqual(ppp["ppp.acc.pl.fem"], "lapsas")
        self.assertEqual(len(ppp), 36)

    def test_intransitive_gets_no_participle_grid(self):
        e = verb("saeviō", {"1sg.pres.ind.act": ["saeviō"], "ppp.nom.sg.masc": ["saevītum"]})
        card = {"id": "saevio_v", "lemma": "saevio", "pos": "verb", "glosses": [],
                "ppp_paradigm": {"cells": {"ppp.nom.sg.masc": "saevitus"}}}
        r.verb_card(card, e, r.build_cells(e, OK))
        self.assertNotIn("ppp_paradigm", card)


class TestNominalCard(unittest.TestCase):
    def test_plurale_tantum(self):
        e = {"word": "arma", "pos": "noun", "gender": ["neut"], "plural_only": True,
             "head": "arma n pl (genitive armōrum)",
             "cells": {"nom.pl": ["arma"], "gen.pl": ["armōrum"], "nom.sg": ["armum"]}}
        card = {"id": "arma_n", "lemma": "arma", "pos": "noun", "glosses": [],
                "paradigm": {"type": "noun", "rows": ["nom", "gen"], "cols": ["sg", "pl"],
                             "cells": {"nom.sg": "armum"}}}
        r.nominal_card(card, e, r.build_cells(e, OK))
        self.assertTrue(card["defective"])
        self.assertEqual(card["paradigm"]["cols"], ["pl"])
        self.assertEqual(card["paradigm"]["cells"], {"nom.pl": "arma", "gen.pl": "armorum"})
        self.assertEqual(card["head"], "arma, armorum, n. pl.")

    def test_decline_us(self):
        cells = r.decline_us("iūnctus")
        self.assertEqual(cells["gen.pl.fem"], "iūnctarum")
        self.assertEqual(cells["voc.sg.masc"], "iūncte")


class TestTouchCells(unittest.TestCase):
    ENTRY = {"word": "extendō", "pos": "verb",
             "cells": {"3sg.pres.ind.act": ["extendit"], "inf.pres.act": ["extendere"],
                       "ppp.nom.sg.masc": ["extentus"]}}

    def card(self):
        return {"id": "extendo_v", "lemma": "extendo", "pos": "verb",
                "paradigm": {"cells": {"3sg.pres.ind.act": "extendat", "inf.pres.act": "extendere"}},
                "ppp_paradigm": {"cells": {"ppp.nom.sg.masc": "extensus"}}}

    def test_patch_replaces_only_contradicted_cells(self):
        c = self.card()
        self.assertEqual(r.touch_cells(c, self.ENTRY, "patch"), 1)
        self.assertEqual(c["paradigm"]["cells"]["3sg.pres.ind.act"], "extendit")
        # Participles are left alone by --patch (impersonal-neuter caveat).
        self.assertEqual(c["ppp_paradigm"]["cells"]["ppp.nom.sg.masc"], "extensus")

    def test_merge_adds_variants_card_first(self):
        c = self.card()
        r.touch_cells(c, self.ENTRY, "merge")
        self.assertEqual(c["ppp_paradigm"]["cells"]["ppp.nom.sg.masc"], ["extensus", "extentus"])
        self.assertEqual(c["paradigm"]["cells"]["inf.pres.act"], "extendere")  # unchanged

    def test_merge_is_idempotent(self):
        c = self.card()
        r.touch_cells(c, self.ENTRY, "merge")
        before = copy.deepcopy(c)
        self.assertEqual(r.touch_cells(c, self.ENTRY, "merge"), 0)
        self.assertEqual(c, before)


class TestRegen(unittest.TestCase):
    def test_gender_corrected_and_adj_alt_forms_kept(self):
        murmur = {"word": "murmur", "pos": "noun", "gender": ["neut"], "head": "murmur n",
                  "cells": {"nom.sg": ["murmur"], "gen.sg": ["murmuris"], "nom.pl": ["murmura"]}}
        celeber = {"word": "celeber", "pos": "adj", "head": "celeber (feminine celebris)",
                   "cells": {"nom.sg.masc": ["celeber"], "nom.sg.fem": ["celebris"], "nom.sg.neut": ["celebre"]}}
        saved = r.match_entry
        try:
            r.match_entry = lambda card, etym=None: murmur if card["pos"] == "noun" else celeber
            n = {"id": "murmur_n", "lemma": "murmur", "pos": "noun", "gender": "masc", "glosses": [],
                 "alt_forms": ["murmures"]}
            r.regen(n)
            self.assertEqual(n["gender"], "neut")
            self.assertNotIn("alt_forms", n)  # not a form Wiktionary gives murmur
            a = {"id": "celeber_adj", "lemma": "celeber", "pos": "adj", "glosses": [],
                 "alt_forms": ["celeberrima"]}
            r.regen(a)
            self.assertEqual(a["alt_forms"], ["celeberrima"])  # degree forms survive
        finally:
            r.match_entry = saved


if __name__ == "__main__":
    unittest.main()

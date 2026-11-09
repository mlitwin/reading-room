"""Tests for retarget_lemma.py's pure helpers (no files touched)."""
import sys
import unittest
from pathlib import Path

THIS_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(THIS_DIR.parent))

import retarget_lemma as rt  # noqa: E402


class TestSurfaceCodes(unittest.TestCase):
    def test_noun_cells_get_gender(self):
        card = {"id": "error_n", "lemma": "error", "pos": "noun", "gender": "masc",
                "paradigm": {"cells": {"nom.sg": "error", "abl.sg": "errore", "voc.sg": "error"}}}
        codes = rt.surface_codes(card)
        self.assertEqual(codes["error"], ["nom.sg.masc", "voc.sg.masc"])
        self.assertEqual(codes["errore"], ["abl.sg.masc"])

    def test_variant_spellings_and_paradigmless(self):
        adj = {"id": "assiduus_adj", "lemma": "assiduus", "pos": "adj",
               "paradigm": {"cells": {"dat.pl.fem": ["assiduis", "adsiduis"]}}}
        self.assertEqual(rt.surface_codes(adj)["adsiduis"], ["dat.pl.fem"])
        adv = {"id": "partim_adv", "lemma": "partim", "pos": "adv"}
        self.assertEqual(rt.surface_codes(adv), {"partim": ["adv"]})


class TestReadings(unittest.TestCase):
    def test_readings_from_data_matches_or_primary(self):
        t = {"lemma_id": "a_n", "parses": ["nom.sg"], "__data_matches": "a_n:nom.sg;b_v:2sg.pres.imp.act"}
        self.assertEqual(rt.readings(t), [["a_n", ["nom.sg"]], ["b_v", ["2sg.pres.imp.act"]]])
        self.assertEqual(rt.readings({"lemma_id": "c_adv", "parses": ["adv"]}), [["c_adv", ["adv"]]])

    def test_write_keeps_selection_and_sets_pos(self):
        t = {"lemma_id": "junk_n", "parses": ["x"], "pos_hint": "noun", "selected_lemma_id": "junk_n"}
        rt.write_readings(t, [["omnis_adj", ["nom.sg.neut"]], ["other_v", ["inf.pres.act"]]],
                          "omnis_adj", ("omnis_adj", "adj"))
        self.assertEqual(t["lemma_id"], "omnis_adj")
        self.assertEqual(t["selected_lemma_id"], "omnis_adj")
        self.assertEqual(t["pos_hint"], "adj")
        self.assertEqual(t["__data_matches"], "omnis_adj:nom.sg.neut;other_v:inf.pres.act")

    def test_single_reading_drops_selection(self):
        t = {"lemma_id": "junk_n", "parses": [], "selected_lemma_id": "junk_n"}
        rt.write_readings(t, [["suus_pron", ["acc.sg.masc"]]], "suus_pron", ("suus_pron", "pron"))
        self.assertNotIn("selected_lemma_id", t)
        self.assertEqual(t["parses"], ["acc.sg.masc"])


if __name__ == "__main__":
    unittest.main()

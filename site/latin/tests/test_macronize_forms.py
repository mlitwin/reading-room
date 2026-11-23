"""Tests for macronize_forms.macronize (no cache or network needed).

Entries are hand-built in the shape wiktionary_extract.compact_entry emits.
"""
import sys
import unittest
from pathlib import Path

THIS_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(THIS_DIR.parent))

import macronize_forms as m  # noqa: E402

VESTER = {"word": "vester", "pos": "adj", "cells": {
    "nom.sg.fem": ["vestra"], "abl.sg.fem": ["vestrā"], "nom.pl.neut": ["vestra"],
    "acc.pl.masc": ["vestrōs"]}}
ROSA = {"word": "rosa", "pos": "noun", "cells": {"nom.sg": ["rosa"], "abl.sg": ["rosā"]}}


class TestMacronize(unittest.TestCase):
    def test_parse_picks_the_cell(self):
        self.assertEqual(m.macronize("Vestra", "nom.sg.fem", VESTER), "vestra")
        self.assertEqual(m.macronize("Vestra", "abl.sg.fem", VESTER), "vestrā")

    def test_token_gender_is_ignored_for_nouns(self):
        # Morpheus tags noun parses with gender; Wiktionary noun cells have none.
        self.assertEqual(m.macronize("rosa", "abl.sg.fem", ROSA), "rosā")

    def test_vocative_falls_back_to_nominative(self):
        self.assertEqual(m.macronize("rosa", "voc.sg", ROSA), "rosa")

    def test_unknown_parse_uses_a_spelling_all_cells_agree_on(self):
        self.assertEqual(m.macronize("vestros", "xyz", VESTER), "vestrōs")
        # vestra / vestrā disagree: no guess.
        self.assertIsNone(m.macronize("vestra", "xyz", VESTER))

    def test_invariant_word_is_the_headword(self):
        self.assertEqual(m.macronize("adeo", "adv", {"word": "adeō", "pos": "adv"}), "adeō")

    def test_j_and_v_spellings_match(self):
        self.assertEqual(m.macronize("juvant", "3pl.pres.ind.act",
                                     {"word": "iuvō", "cells": {"3pl.pres.ind.act": ["iuvant"]}}), "iuvant")

    def test_readings_split_data_matches(self):
        t = {"__data_matches": "adeo_adv:adv;adeo_v:1sg.pres.ind.act"}
        self.assertEqual(m.readings(t), [("adeo_adv", ["adv"]), ("adeo_v", ["1sg.pres.ind.act"])])


if __name__ == "__main__":
    unittest.main()

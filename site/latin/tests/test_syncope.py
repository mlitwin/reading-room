"""Tests for syncope.py — the A&G §181 contracted perfects."""
import sys
import unittest
from pathlib import Path

THIS_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(THIS_DIR.parent))

import syncope as s  # noqa: E402


def verb(cells):
    return {"id": "x_v", "pos": "verb", "paradigm": {"type": "verb", "cells": cells}}


class TestContractions(unittest.TestCase):
    def test_avi_before_s_and_r(self):
        self.assertEqual(s.contractions("amavisse", "amav"), ["amasse"])
        self.assertEqual(s.contractions("amavistis", "amav"), ["amastis"])
        self.assertEqual(s.contractions("amaverat", "amav"), ["amarat"])
        self.assertEqual(s.contractions("amaverunt", "amav"), ["amarunt"])

    def test_avi_keeps_forms_without_contraction(self):
        self.assertEqual(s.contractions("amavit", "amav"), [])
        self.assertEqual(s.contractions("amavi", "amav"), [])
        self.assertEqual(s.contractions("amavere", "amav"), [])   # would be the infinitive
        self.assertEqual(s.contractions("amavero", "amav"), [])

    def test_ovi(self):
        self.assertEqual(s.contractions("novisse", "nov"), ["nosse"])
        self.assertEqual(s.contractions("noverat", "nov"), ["norat"])

    def test_ivi(self):
        self.assertEqual(s.contractions("audivit", "audiv"), ["audiit"])
        self.assertEqual(s.contractions("audiverat", "audiv"), ["audierat"])
        self.assertEqual(s.contractions("petivere", "petiv"), ["petiere"])
        self.assertEqual(s.contractions("audivisse", "audiv"), ["audiisse", "audisse"])

    def test_consonantal_u_spelling(self):
        self.assertEqual(s.contractions("uiolauisse", "uiolau"), ["uiolasse"])

    def test_other_stems_untouched(self):
        self.assertEqual(s.contractions("monuisse", "amav"), [])


class TestSyncopateCard(unittest.TestCase):
    def test_adds_after_the_full_form(self):
        card = verb({"1sg.perf.ind.act": "violavi", "inf.perf.act": "violavisse",
                     "3sg.plup.ind.act": "violaverat"})
        self.assertEqual(s.syncopate_card(card), 2)
        cells = card["paradigm"]["cells"]
        self.assertEqual(cells["inf.perf.act"], ["violavisse", "violasse"])
        self.assertEqual(cells["3sg.plup.ind.act"], ["violaverat", "violarat"])
        self.assertEqual(cells["1sg.perf.ind.act"], "violavi")

    def test_idempotent_and_keeps_existing_variants(self):
        card = verb({"1sg.perf.ind.act": "violavi", "inf.perf.act": ["violavisse", "violasse"]})
        self.assertEqual(s.syncopate_card(card), 0)
        self.assertEqual(card["paradigm"]["cells"]["inf.perf.act"], ["violavisse", "violasse"])

    def test_skips_a_contraction_that_is_another_form(self):
        # amāris (2sg perf. subj.) is the present passive.
        card = verb({"1sg.perf.ind.act": "amavi", "2sg.perf.subj.act": "amaveris",
                     "2sg.pres.ind.pass": "amaris"})
        s.syncopate_card(card)
        self.assertEqual(card["paradigm"]["cells"]["2sg.perf.subj.act"], "amaveris")

    def test_same_contraction_in_two_cells(self):
        card = verb({"1sg.perf.ind.act": "amavi", "3sg.perf.subj.act": "amaverit",
                     "3sg.futperf.ind.act": "amaverit"})
        s.syncopate_card(card)
        cells = card["paradigm"]["cells"]
        self.assertEqual(cells["3sg.perf.subj.act"], ["amaverit", "amarit"])
        self.assertEqual(cells["3sg.futperf.ind.act"], ["amaverit", "amarit"])

    def test_skips_a_contraction_that_is_another_words_form(self):
        # pāverat → parat is parō's.
        card = verb({"1sg.perf.ind.act": "pavi", "3sg.plup.ind.act": "paverat"})
        self.assertEqual(s.syncopate_card(card, others={"parat"}), 0)

    def test_passive_and_non_vi_perfects_untouched(self):
        card = verb({"1sg.perf.ind.act": "monui", "inf.perf.act": "monuisse"})
        self.assertEqual(s.syncopate_card(card), 0)
        self.assertEqual(s.syncopate_card({"pos": "noun"}), 0)


if __name__ == "__main__":
    unittest.main()

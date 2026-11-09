"""Tests for sync_readings.sync_token (C13 fixer)."""
import sys
import unittest
from pathlib import Path

THIS_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(THIS_DIR.parent))

import sync_readings as sr  # noqa: E402

CARDS = {
    "alo_v": ({"id": "alo_v", "lemma": "alo", "pos": "verb",
               "ppp_paradigm": {"cells": {"ppp.nom.pl.neut": "alta"}}}, None),
    "altus_adj": ({"id": "altus_adj", "lemma": "altus", "pos": "adj",
                   "paradigm": {"cells": {"nom.pl.neut": "alta", "nom.sg.fem": "alta"}}}, None),
}
IDX = sr.surface_index(CARDS)


def tok():
    return {"kind": "word", "surface": "alta", "lemma_id": "alo_v", "parses": ["ppp.nom.pl.neut"], "pos_hint": "verb"}


class TestSyncToken(unittest.TestCase):
    def test_adds_missing_reading_as_back_tab(self):
        t = tok()
        self.assertEqual(sr.sync_token(t, IDX, CARDS), 1)
        self.assertEqual(t["lemma_id"], "alo_v")  # first tab unchanged
        self.assertEqual(t["__data_matches"], "alo_v:ppp.nom.pl.neut;altus_adj:nom.pl.neut,nom.sg.fem")
        self.assertEqual(t["selected_lemma_id"], "alo_v")

    def test_idempotent(self):
        t = tok()
        sr.sync_token(t, IDX, CARDS)
        before = dict(t)
        self.assertEqual(sr.sync_token(t, IDX, CARDS), 0)
        self.assertEqual(t, before)

    def test_first_switches_front_tab(self):
        t = tok()
        sr.sync_token(t, IDX, CARDS, first={("alta", "alo_v"): "altus_adj"})
        self.assertEqual(t["selected_lemma_id"], "altus_adj")
        self.assertTrue(t["__data_matches"].startswith("altus_adj:"))
        self.assertEqual(t["pos_hint"], "adj")

    def test_drop_impossible_reading(self):
        t = tok()
        sr.sync_token(t, IDX, CARDS, drop={("alta", "alo_v")})
        # Dropped and not re-added from the index, though alo_v yields "alta".
        self.assertEqual(t["__data_matches"], "altus_adj:nom.pl.neut,nom.sg.fem")
        self.assertEqual(t["lemma_id"], "altus_adj")
        self.assertNotIn("selected_lemma_id", t)


if __name__ == "__main__":
    unittest.main()

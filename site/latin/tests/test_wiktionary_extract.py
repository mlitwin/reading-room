"""Tests for the Wiktionary preprocessing (tag → parse code, entry compaction).

Fixtures are trimmed wiktextract entries; no download or cache needed.
"""
import sys
import unittest
from pathlib import Path

THIS_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(THIS_DIR.parent))

import wiktionary_extract as w  # noqa: E402


def form(f, *tags):
    return {"form": f, "tags": list(tags)}


TABLE = form("la-conj", "inflection-template")


class TestParseCodes(unittest.TestCase):
    def test_finite_verb(self):
        self.assertEqual(w.parse_codes(["active", "first-person", "indicative", "present", "singular"], "verb"),
                         ["1sg.pres.ind.act"])

    def test_future_perfect(self):
        self.assertEqual(w.parse_codes(["active", "future", "indicative", "perfect", "plural", "third-person"], "verb"),
                         ["3pl.futperf.ind.act"])

    def test_deponent_flips_to_pass(self):
        self.assertEqual(w.parse_codes(["active", "indicative", "plural", "present", "third-person"], "verb", deponent=True),
                         ["3pl.pres.ind.pass"])

    def test_nonfinite(self):
        self.assertEqual(w.parse_codes(["infinitive", "passive", "present"], "verb"), ["inf.pres.pass"])
        self.assertEqual(w.parse_codes(["dative", "gerund", "noun-from-verb"], "verb"), ["ger.dat.sg"])
        self.assertEqual(w.parse_codes(["future", "participle", "passive"], "verb"), ["gerundive.nom.sg.masc"])
        self.assertEqual(w.parse_codes(["active", "future", "participle"], "verb"), ["fap.nom.sg.masc"])

    def test_dropped(self):
        self.assertEqual(w.parse_codes(["active", "future", "second-person", "sigmatic", "singular"], "verb"), [])

    def test_noun_multi_case(self):
        self.assertEqual(w.parse_codes(["accusative", "nominative", "plural", "vocative"], "noun"),
                         ["acc.pl", "nom.pl", "voc.pl"])

    def test_adj_genders(self):
        self.assertEqual(w.parse_codes(["feminine", "masculine", "nominative", "singular"], "adj"),
                         ["nom.sg.fem", "nom.sg.masc"])
        self.assertEqual(len(w.parse_codes(["dative", "plural"], "adj")), 3)


class TestCompactEntry(unittest.TestCase):
    def test_plurale_tantum_noun(self):
        e = {"word": "praecordia", "pos": "noun",
             "head_templates": [{"name": "la-noun", "expansion": "praecordia n pl (genitive praecordiōrum); second declension"}],
             "forms": [form("praecordiōrum", "genitive"), form("x", "table-tags"),
                       form("praecordia", "nominative", "plural"), form("praecordiīs", "dative", "plural")],
             "senses": [{"glosses": ["diaphragm; midriff"]}]}
        c = w.compact_entry(e)
        self.assertEqual(c["gender"], ["neut"])
        self.assertTrue(c["plural_only"])
        self.assertEqual(c["class"], "second declension")
        self.assertEqual(c["cells"], {"nom.pl": ["praecordia"], "dat.pl": ["praecordiīs"]})

    def test_semi_deponent_stays_active(self):
        e = {"word": "placeo", "pos": "verb",
             "head_templates": [{"name": "la-verb", "expansion": "placeō (…); second conjugation, semi-deponent"}],
             "forms": [form("placeō", "canonical"), TABLE,
                       form("placet", "active", "indicative", "present", "singular", "third-person")],
             "senses": [{"glosses": ["to please"]}]}
        self.assertIn("3sg.pres.ind.act", w.compact_entry(e)["cells"])

    def test_participle(self):
        e = {"word": "iunctus", "pos": "verb",
             "head_templates": [{"name": "la-part", "expansion": "iūnctus (feminine iūncta, neuter iūnctum); participle"}],
             "forms": [form("x", "table-tags"), form("iūnctus", "masculine", "nominative", "singular"),
                       form("iūnctīs", "dative", "plural")],
             "senses": [{"glosses": ["joined"], "tags": ["participle"]}]}
        c = w.compact_entry(e)
        self.assertEqual(c["participle"], "ppp")
        self.assertEqual(c["cells"]["ppp.nom.sg.masc"], ["iūnctus"])
        self.assertIn("ppp.dat.pl.neut", c["cells"])

    def test_form_of_and_junk(self):
        e = {"word": "veneris", "pos": "noun", "head_templates": [{"expansion": "veneris"}],
             "senses": [{"form_of": [{"word": "venus"}], "tags": ["form-of", "genitive", "singular"]}]}
        self.assertEqual(w.compact_entry(e)["form_of"], [{"lemma": "venus", "codes": ["gen.sg"]}])
        self.assertIsNone(w.compact_entry({"word": "-dō", "pos": "verb"}))
        self.assertIsNone(w.compact_entry({"word": "8vus", "pos": "adj"}))

    def test_norm_matches_ls_lookup(self):
        self.assertEqual(w.norm("Iūppiter"), w.norm("Juppiter"))
        self.assertEqual(w.norm("vēnerīs"), "ueneris")


if __name__ == "__main__":
    unittest.main()

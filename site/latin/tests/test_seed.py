"""Tests for the Morpheus-backed seed.py pipeline.

These tests exercise the pure-Python functions (parsing Morpheus output,
mapping morphology vectors to parse codes, lemma normalisation, enclitic
detection). End-to-end tests that call out to the morpheus.sh wrapper are
gated on the binary being present.
"""
import os
import sys
import unittest
from pathlib import Path

THIS_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(THIS_DIR.parent))

import seed  # noqa: E402


class TestParseNLBlock(unittest.TestCase):
    def test_verb(self):
        block = 'V mu_tastis,muto#1  perf ind act 2nd pl\t\tcontr\tavperf,are_vb'
        a = seed.parse_nl_block(block)
        self.assertEqual(a['pos_raw'], 'V')
        self.assertEqual(a['surface'], 'mutastis')
        self.assertEqual(a['lemma'], 'muto')
        self.assertEqual(a['morph'], ['perf', 'ind', 'act', '2nd', 'pl'])
        self.assertEqual(a['tags'], 'contr')
        self.assertEqual(a['infl_class'], 'are_vb')

    def test_noun_no_comma(self):
        block = 'N animus  masc nom sg\t\t\tus_i'
        a = seed.parse_nl_block(block)
        self.assertEqual(a['pos_raw'], 'N')
        self.assertEqual(a['surface'], 'animus')
        self.assertEqual(a['lemma'], 'animus')
        self.assertEqual(a['infl_class'], 'us_i')

    def test_participle(self):
        block = 'P coepti_s,coepio  perf part pass fem abl pl\t\t\tpp4'
        a = seed.parse_nl_block(block)
        self.assertEqual(a['pos_raw'], 'P')
        self.assertEqual(a['surface'], 'coeptis')
        # LEMMA_ALIAS rewrites coepio → coeptum so the proem's existing card
        # stays in use.
        self.assertEqual(a['lemma'], 'coeptum')

    def test_macron_stripped(self):
        block = 'N vo_s,tu  masc/fem nom/voc pl\t\tindeclform\tpron2'
        a = seed.parse_nl_block(block)
        self.assertEqual(a['surface'], 'vos')
        # Morpheus uses `tu` as the headword for all 2nd-person forms.
        self.assertEqual(a['lemma'], 'tu')

    def test_homograph_suffix_stripped(self):
        block = 'V di_xe_re,dico#2  perf ind act 3rd pl\t\tpoetic\tperfstem'
        a = seed.parse_nl_block(block)
        self.assertEqual(a['lemma'], 'dico')

    def test_hyphenated_lemma_aliased(self):
        block = 'V ad-spi_ra_te,ad-spiro  pres imp act 2nd pl\t\t\tare_vb'
        a = seed.parse_nl_block(block)
        self.assertEqual(a['lemma'], 'aspiro')

    def test_parse_without_alias(self):
        block = 'V ad-spi_ra_te,ad-spiro  pres imp act 2nd pl\t\t\tare_vb'
        a = seed.parse_nl_block(block, apply_alias=False)
        self.assertEqual(a['lemma'], 'ad-spiro')


class TestMorphToParseCodes(unittest.TestCase):
    def _block(self, raw):
        return seed.parse_nl_block(raw)

    def test_finite_verb(self):
        a = self._block('V mu_tastis,muto#1  perf ind act 2nd pl\t\tcontr\tavperf,are_vb')
        codes = seed.morph_to_parse_codes(a)
        self.assertEqual(codes, ['2pl.perf.ind.act'])

    def test_infinitive(self):
        a = self._block('V di_cere,dico#2  pres act inf\t\t\tere_vb')
        codes = seed.morph_to_parse_codes(a)
        # Order of features is normalised; only the inf marker matters.
        self.assertIn('inf.pres.act', codes)

    def test_perfect_passive_participle(self):
        a = self._block('P mu_ta_ta_s,muto#1  perf part pass fem acc pl\t\t\tpp4')
        codes = seed.morph_to_parse_codes(a)
        self.assertIn('ppp.acc.pl.fem', codes)

    def test_noun_simple(self):
        a = self._block('N animus  masc nom sg\t\t\tus_i')
        codes = seed.morph_to_parse_codes(a)
        self.assertEqual(codes, ['nom.sg.masc'])

    def test_noun_slash_alternates(self):
        a = self._block('N corpora  neut nom/voc/acc pl\t\t\tus_oris')
        codes = seed.morph_to_parse_codes(a)
        # Slash-separated alternatives fan out.
        self.assertIn('nom.pl.neut', codes)
        self.assertIn('acc.pl.neut', codes)
        self.assertIn('voc.pl.neut', codes)

    def test_preposition(self):
        a = self._block('N in \t\tindeclform\tprep')
        codes = seed.morph_to_parse_codes(a)
        self.assertEqual(codes, ['prep'])

    def test_conjunction(self):
        a = self._block('N et \t\tindeclform\tconj')
        codes = seed.morph_to_parse_codes(a)
        self.assertEqual(codes, ['conj'])


class TestEncliticDetection(unittest.TestCase):
    def _block(self, raw):
        return seed.parse_nl_block(raw)

    def test_que_split(self):
        # Morpheus auto-strips -que and analyses the prefix; surface should
        # equal `prima`, not `primaque`.
        analyses = [self._block('N pri_ma,prima  neut nom/voc/acc pl\t\t\tus_i')]
        prefix, enc = seed.detect_enclitic('primaque', analyses)
        self.assertEqual(prefix, 'prima')
        self.assertEqual(enc, 'que')

    def test_no_split_when_surface_matches(self):
        # When surface == input there's no enclitic to peel off.
        analyses = [self._block('N animus  masc nom sg\t\t\tus_i')]
        prefix, enc = seed.detect_enclitic('animus', analyses)
        self.assertIsNone(prefix)

    def test_no_split_when_analyses_empty(self):
        prefix, enc = seed.detect_enclitic('primaque', [])
        self.assertIsNone(prefix)


class TestRenderHelpers(unittest.TestCase):
    def test_matches_attr_empty(self):
        self.assertEqual(seed.matches_attr([]), 'data-matches="?:?"')

    def test_matches_attr_groups(self):
        out = seed.matches_attr([('muto', ['2pl.perf.ind.act'])])
        self.assertEqual(out, 'data-matches="muto:2pl.perf.ind.act"')

    def test_matches_attr_multi_lemma(self):
        out = seed.matches_attr([
            ('deus', ['nom.pl.masc', 'voc.pl.masc']),
            ('dius', ['gen.sg.masc']),
        ])
        self.assertEqual(
            out,
            'data-matches="deus:nom.pl.masc,voc.pl.masc;dius:gen.sg.masc"',
        )


@unittest.skipUnless((Path(__file__).resolve().parents[1] / 'morpheus.sh').exists()
                     and (Path.home() / 'Dev/github.com/mlitwin/morpheus/bin/cruncher').exists(),
                     'morpheus.sh / cruncher not installed locally')
class TestMorpheusIntegration(unittest.TestCase):
    """End-to-end smoke tests against the local Morpheus install."""

    def test_proem_known_tokens(self):
        results = seed.query_morpheus(['mutastis', 'di', 'vos', 'primaque'])
        self.assertTrue(any('muto' in nl for nl in results['mutastis']))
        self.assertTrue(any('deus' in nl for nl in results['di']))
        self.assertTrue(any('tu' in nl for nl in results['vos']))
        # primaque is recognised; analyses report `prima` in the surface column.
        self.assertTrue(any('pri_ma' in nl for nl in results['primaque']))

    def test_unrecognised_returns_empty_list(self):
        results = seed.query_morpheus(['xyzzy'])
        self.assertEqual(results['xyzzy'], [])


if __name__ == '__main__':
    unittest.main()

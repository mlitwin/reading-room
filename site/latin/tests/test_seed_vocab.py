"""Tests for the vocabulary-card seeder.

DICTLINE.GEN and INFLECTS.LAT are loaded once for the whole module; each
test exercises one piece of behaviour against the real data files in the
sibling whitakers_words clone.
"""
import sys
import unittest
from pathlib import Path

THIS_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(THIS_DIR.parent))

import seed_vocab  # noqa: E402

WHITAKERS_PRESENT = (
    seed_vocab.DICTLINE_PATH.exists() and seed_vocab.INFLECTS_PATH.exists()
)


@unittest.skipUnless(WHITAKERS_PRESENT, 'Whitaker data files not found')
class TestDictlineParser(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.entries, cls.by_stem = seed_vocab.load_dictline()

    def test_load_yields_reasonable_count(self):
        # 38k+ entries is the historical count for this data file.
        self.assertGreater(len(self.entries), 35000)
        self.assertGreater(len(self.by_stem), 40000)

    def test_anim_stem_has_both_anima_and_animus(self):
        # `anim` is the stem shared by `anima, -ae, f.` (1st-decl) AND
        # `animus, -i, m.` (2nd-decl). Both must be present in the index
        # so lookup_entry can disambiguate by lemma ending.
        entry_idxs = self.by_stem.get('anim', [])
        nouns = [self.entries[i] for i in entry_idxs if self.entries[i]['pos'] == 'N']
        forms = {tuple(e['form'][:3]) for e in nouns}
        self.assertIn(('1', '1', 'F'), forms)
        self.assertIn(('2', '1', 'M'), forms)
        animus_entry = next(e for e in nouns if tuple(e['form'][:3]) == ('2', '1', 'M'))
        self.assertIn('mind', animus_entry['senses'][0])

    def test_muto_verb_stems(self):
        idxs = self.by_stem.get('mut', [])
        verbs = [self.entries[i] for i in idxs if self.entries[i]['pos'] == 'V']
        self.assertTrue(verbs, 'expected at least one V entry for stem mut')
        # 4 stems: pres, pres, perf, supine.
        self.assertEqual(len(verbs[0]['stems']), 4)
        self.assertEqual(verbs[0]['stems'][:4], ['mut', 'mut', 'mutav', 'mutat'])


@unittest.skipUnless(WHITAKERS_PRESENT, 'Whitaker data files not found')
class TestInflectsParser(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.rules = seed_vocab.load_inflects()

    def test_load_yields_reasonable_count(self):
        total = sum(len(v) for v in self.rules.values())
        self.assertGreater(total, 1500)

    def test_noun_2_1_has_nom_sg(self):
        rules = self.rules.get(('N', 2, 1), [])
        # Should at least carry the canonical -us nominative.
        self.assertTrue(any(r['form'][:2] == ('NOM', 'S') and r['ending'] == 'us'
                            for r in rules))

    def test_noun_2_0_fallback_has_dat_abl(self):
        # The declension-wide (n2=0) rules carry generic dat/abl/gen.pl/etc.
        # that the variant-specific (n2=1) tables don't repeat.
        rules = self.rules.get(('N', 2, 0), [])
        forms = {r['form'][:2] for r in rules}
        self.assertIn(('DAT', 'S'), forms)
        self.assertIn(('ABL', 'S'), forms)
        self.assertIn(('GEN', 'P'), forms)
        self.assertIn(('DAT', 'P'), forms)
        self.assertIn(('ABL', 'P'), forms)


@unittest.skipUnless(WHITAKERS_PRESENT, 'Whitaker data files not found')
class TestLemmaLookup(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.entries, cls.by_stem = seed_vocab.load_dictline()

    def _lookup(self, lemma):
        return seed_vocab.lookup_entry(lemma, morpheus_pos='N', infl_class='',
                                       by_stem=self.by_stem, entries=self.entries)

    def test_animus(self):
        entry = self._lookup('animus')
        self.assertIsNotNone(entry)
        self.assertEqual(entry['pos'], 'N')
        self.assertEqual(entry['stems'][0], 'anim')

    def test_novus(self):
        entry = self._lookup('novus')
        self.assertIsNotNone(entry)
        self.assertEqual(entry['pos'], 'ADJ')
        self.assertEqual(entry['stems'][0], 'nov')

    def test_muto_verb(self):
        entry = self._lookup('muto')
        self.assertIsNotNone(entry)
        self.assertEqual(entry['pos'], 'V')

    def test_creo_verb_1st_conj(self):
        entry = self._lookup('creo')
        self.assertIsNotNone(entry)
        self.assertEqual(entry['pos'], 'V')
        self.assertEqual(entry['stems'][:4], ['cre', 'cre', 'creav', 'creat'])

    def test_teneo_verb_2nd_conj(self):
        # Whitaker strips the `e` of the present stem for 2nd-conj verbs.
        entry = self._lookup('teneo')
        self.assertIsNotNone(entry)
        self.assertEqual(entry['pos'], 'V')
        self.assertEqual(entry['stems'][0], 'ten')

    def test_video_verb_2nd_conj(self):
        entry = self._lookup('video')
        self.assertIsNotNone(entry)
        self.assertEqual(entry['pos'], 'V')
        self.assertEqual(entry['stems'][0], 'vid')

    def test_cerno_verb_3rd_conj(self):
        entry = self._lookup('cerno')
        self.assertIsNotNone(entry)
        self.assertEqual(entry['pos'], 'V')
        self.assertEqual(entry['stems'][0], 'cern')

    def test_arbor_3rd_decl(self):
        entry = self._lookup('arbor')
        self.assertIsNotNone(entry)
        self.assertEqual(entry['pos'], 'N')

    def test_unknown_lemma_returns_none(self):
        self.assertIsNone(self._lookup('zzznotalemma'))


@unittest.skipUnless(WHITAKERS_PRESENT, 'Whitaker data files not found')
class TestNounParadigm(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.entries, cls.by_stem = seed_vocab.load_dictline()
        cls.rules = seed_vocab.load_inflects()

    def _generate(self, lemma):
        entry = seed_vocab.lookup_entry(lemma, 'N', '', self.by_stem, self.entries)
        self.assertIsNotNone(entry, f'no DICTLINE entry for {lemma}')
        return seed_vocab.generate_noun_paradigm(entry, lemma, self.rules)

    def test_animus_full_paradigm(self):
        p = self._generate('animus')
        self.assertIsNotNone(p)
        cells = p['cells']
        # 2nd-decl masc: all 10 cells should be populated (5 cases × 2 nums).
        self.assertEqual(cells['nom.sg'], 'animus')
        self.assertEqual(cells['gen.sg'], 'animi')
        self.assertEqual(cells['dat.sg'], 'animo')
        self.assertEqual(cells['acc.sg'], 'animum')
        self.assertEqual(cells['abl.sg'], 'animo')
        self.assertEqual(cells['nom.pl'], 'animi')
        self.assertEqual(cells['gen.pl'], 'animorum')
        self.assertEqual(cells['dat.pl'], 'animis')
        self.assertEqual(cells['abl.pl'], 'animis')
        self.assertEqual(cells['acc.pl'], 'animos')

    def test_neuter_has_neuter_specific_forms(self):
        # `caelum` (2nd-decl neuter) should give -um/-um/-a/-a, not -us/-os.
        entry = seed_vocab.lookup_entry('caelum', 'N', '', self.by_stem, self.entries)
        p = seed_vocab.generate_noun_paradigm(entry, 'caelum', self.rules)
        cells = p['cells']
        self.assertEqual(cells['nom.sg'], 'caelum')
        self.assertEqual(cells['acc.sg'], 'caelum')
        self.assertEqual(cells['nom.pl'], 'caela')
        self.assertEqual(cells['acc.pl'], 'caela')


@unittest.skipUnless(WHITAKERS_PRESENT, 'Whitaker data files not found')
class TestVerbParadigm(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.entries, cls.by_stem = seed_vocab.load_dictline()
        cls.rules = seed_vocab.load_inflects()

    def test_creo_present_indicative_active(self):
        entry = seed_vocab.lookup_entry('creo', 'V', '', self.by_stem, self.entries)
        p = seed_vocab.generate_verb_paradigm(entry, 'creo', self.rules)
        cells = p['cells']
        self.assertEqual(cells['1sg.pres.ind.act'], 'creo')
        self.assertEqual(cells['2sg.pres.ind.act'], 'creas')
        self.assertEqual(cells['3sg.pres.ind.act'], 'creat')
        self.assertEqual(cells['1pl.pres.ind.act'], 'creamus')
        self.assertEqual(cells['2pl.pres.ind.act'], 'creatis')
        self.assertEqual(cells['3pl.pres.ind.act'], 'creant')

    def test_creo_imperatives(self):
        entry = seed_vocab.lookup_entry('creo', 'V', '', self.by_stem, self.entries)
        p = seed_vocab.generate_verb_paradigm(entry, 'creo', self.rules)
        self.assertEqual(p['cells']['2sg.pres.imp.act'], 'crea')
        self.assertEqual(p['cells']['2pl.pres.imp.act'], 'create')


@unittest.skipUnless(WHITAKERS_PRESENT, 'Whitaker data files not found')
class TestAdjectiveParadigm(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.entries, cls.by_stem = seed_vocab.load_dictline()
        cls.rules = seed_vocab.load_inflects()

    def test_novus_three_genders(self):
        entry = seed_vocab.lookup_entry('novus', 'A', '', self.by_stem, self.entries)
        p = seed_vocab.generate_adj_paradigm(entry, 'novus', self.rules)
        cells = p['cells']
        self.assertEqual(cells['nom.sg.masc'], 'novus')
        self.assertEqual(cells['nom.sg.fem'], 'nova')
        self.assertEqual(cells['nom.sg.neut'], 'novum')
        self.assertEqual(cells['gen.sg.masc'], 'novi')
        self.assertEqual(cells['gen.sg.fem'], 'novae')


@unittest.skipUnless(WHITAKERS_PRESENT, 'Whitaker data files not found')
class TestHeadLine(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.entries, cls.by_stem = seed_vocab.load_dictline()

    def test_verb_principal_parts(self):
        entry = seed_vocab.lookup_entry('muto', 'V', '', self.by_stem, self.entries)
        head, parts = seed_vocab.head_line('muto', entry)
        self.assertEqual(parts, ['muto', 'mutare', 'mutavi', 'mutatum'])
        self.assertEqual(head, 'muto, mutare, mutavi, mutatum')

    def test_noun_2nd_decl_head(self):
        entry = seed_vocab.lookup_entry('animus', 'N', '', self.by_stem, self.entries)
        head, parts = seed_vocab.head_line('animus', entry)
        self.assertIsNone(parts)
        self.assertEqual(head, 'animus, -i, m.')

    def test_adjective_head(self):
        entry = seed_vocab.lookup_entry('novus', 'A', '', self.by_stem, self.entries)
        head, parts = seed_vocab.head_line('novus', entry)
        self.assertEqual(head, 'novus, -a, -um')


if __name__ == '__main__':
    unittest.main()

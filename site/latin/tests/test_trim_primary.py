"""Tests for trim_primary lemma-selection heuristics."""
import sys
import unittest
from pathlib import Path

THIS_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(THIS_DIR.parent))

import trim_primary  # noqa: E402


class TestTrimPrimary(unittest.TestCase):
    def test_prefers_pos_compatible_candidate(self):
        matches = 'ante:prep;ante:2sg.pres.ind.act'
        lexicon_pos = {'ante': 'prep'}
        self.assertEqual(trim_primary.trim(matches, lexicon_pos), 'ante:prep')

    def test_prefers_known_lemma_over_unknown(self):
        matches = 'foo:nom.sg;animus:nom.sg.masc'
        lexicon_pos = {'animus': 'noun'}
        self.assertEqual(trim_primary.trim(matches, lexicon_pos), 'animus:nom.sg.masc')

    def test_tie_falls_back_to_source_order(self):
        matches = 'x:nom.sg;y:nom.sg'
        self.assertEqual(trim_primary.trim(matches, {}), 'x:nom.sg')


if __name__ == '__main__':
    unittest.main()

"""Tests for apparatus_to_spans candidate selection."""
import sys
import unittest
from pathlib import Path

THIS_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(THIS_DIR.parent))

import apparatus_to_spans  # noqa: E402


class TestChooseCandidate(unittest.TestCase):
    def test_unresolved_fallback(self):
        self.assertEqual(
            apparatus_to_spans.choose_candidate([], {}),
            {'matches': 'unknown:unk', 'pos': 'unknown'},
        )

    def test_single_candidate_kept(self):
        cands = [{'lemma': 'deus', 'codes': ['nom.pl.masc']}]
        self.assertEqual(
            apparatus_to_spans.choose_candidate(cands, {'deus': 'noun'}),
            {'matches': 'deus:nom.pl.masc', 'pos': 'noun'},
        )

    def test_prefers_pos_compatible(self):
        cands = [
            {'lemma': 'ante', 'codes': ['2sg.pres.ind.act']},
            {'lemma': 'ante', 'codes': ['prep']},
        ]
        out = apparatus_to_spans.choose_candidate(cands, {'ante': 'prep'})
        self.assertEqual(out, {'matches': 'ante:prep', 'pos': 'prep'})


if __name__ == '__main__':
    unittest.main()

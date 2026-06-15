"""Tests for apparatus_to_spans candidate selection."""
import sys
import unittest
from pathlib import Path

THIS_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(THIS_DIR.parent))

import apparatus_to_spans  # noqa: E402


class TestChooseCandidate(unittest.TestCase):
    def test_unresolved_fallback(self):
        # No candidates → unknown fallback regardless of lookup tables.
        self.assertEqual(
            apparatus_to_spans.choose_candidate([], {}, {}),
            {'matches': 'unknown:unk', 'pos': 'unknown'},
        )

    def test_single_candidate_kept(self):
        # Morpheus surface lemma 'deus' resolves to ID 'deus_n' via stem_to_ids.
        cands = [{'lemma': 'deus', 'codes': ['nom.pl.masc']}]
        self.assertEqual(
            apparatus_to_spans.choose_candidate(
                cands,
                lexicon_pos={'deus_n': 'noun'},
                stem_to_ids={'deus': ['deus_n']},
            ),
            {'matches': 'deus_n:nom.pl.masc', 'pos': 'noun'},
        )

    def test_prefers_pos_compatible(self):
        # Two analyses for 'ante'; only the prep-compatible codes survive.
        cands = [
            {'lemma': 'ante', 'codes': ['2sg.pres.ind.act']},
            {'lemma': 'ante', 'codes': ['prep']},
        ]
        out = apparatus_to_spans.choose_candidate(
            cands,
            lexicon_pos={'ante_prep': 'prep'},
            stem_to_ids={'ante': ['ante_prep']},
        )
        self.assertEqual(out, {'matches': 'ante_prep:prep', 'pos': 'prep'})


if __name__ == '__main__':
    unittest.main()

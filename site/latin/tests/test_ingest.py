"""Tests for the Perseus TEI → per-card JSON ingest pass."""
import sys
import unittest
from pathlib import Path

THIS_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(THIS_DIR.parent))

import ingest_perseus  # noqa: E402

TEI_PRESENT = ingest_perseus.SRC.exists()
CARDS_DIR = ingest_perseus.OUT_DIR


@unittest.skipUnless(TEI_PRESENT, 'TEI source not vendored')
class TestIngestRoundTrip(unittest.TestCase):
    """Sanity-check the proem and a known mid-book card by parsing the TEI
    directly (no dependence on pre-written card files)."""

    @classmethod
    def setUpClass(cls):
        import xml.etree.ElementTree as ET
        tree = ET.parse(ingest_perseus.SRC)
        root = tree.getroot()
        cls.cards_by_book = {}
        for book in root.iterfind('.//tei:div[@subtype="book"]', ingest_perseus.NS):
            cards = ingest_perseus.parse_book(book)
            cls.cards_by_book[int(book.get('n'))] = cards

    def test_book_1_card_1_is_proem(self):
        card = self.cards_by_book[1][0]
        self.assertEqual(card['card'], 1)
        self.assertEqual(card['lines'], [1, 4])
        self.assertEqual(card['title_latin'], 'Invocatio.')
        self.assertEqual(card['title_english'], 'Invocation')
        self.assertEqual(len(card['text']), 4)
        self.assertTrue(card['text'][0]['latin'].startswith('In nova fert animus'))
        self.assertIn('corpora;', card['text'][1]['latin'])

    def test_book_1_has_13_cards(self):
        # Magnus's edition splits Phaethon prelude into book 1 (lines 747-779),
        # giving 13 cards rather than 12.
        self.assertEqual(len(self.cards_by_book[1]), 13)

    def test_apparatus_skipped(self):
        # Magnus's note apparatus contains <del>-wrapped vulgate readings
        # as <l> elements; those must not leak into the running text. In
        # book 1 card 9 (lines 525-567), Magnus deletes the spurious line
        # 546, so 545 is followed directly by 547. The line preserves
        # Magnus's reading ("Qua nimium placui …"), not the vulgate's.
        card = next(c for c in self.cards_by_book[1] if c['lines'][0] == 525)
        by_num = {t['n']: t['latin'] for t in card['text']}
        # Line numbers strictly increasing, no duplicates.
        nums = [t['n'] for t in card['text']]
        self.assertEqual(nums, sorted(set(nums)))
        # Magnus's reading, not the apparatus's deleted vulgate variant.
        self.assertIn('Qua nimium placui', by_num[547])
        self.assertNotIn('aut hisce vel istam', by_num[547])
        self.assertNotIn(546, by_num)

    def test_all_books_present(self):
        self.assertEqual(sorted(self.cards_by_book.keys()), list(range(1, 16)))

    def test_total_lines(self):
        total = sum(len(c['text']) for cards in self.cards_by_book.values() for c in cards)
        # ~11,927 lines historically.
        self.assertGreater(total, 11800)
        self.assertLess(total, 12100)


@unittest.skipUnless(CARDS_DIR.exists() and any(CARDS_DIR.iterdir()),
                     'cards/ output not generated')
class TestIngestArtefacts(unittest.TestCase):
    """If the ingest output is present on disk (the developer ran it), the
    files should match the expected shape."""

    def test_book_1_card_1_file(self):
        import json
        path = CARDS_DIR / 'book-01-card-01.json'
        self.assertTrue(path.exists())
        d = json.loads(path.read_text(encoding='utf-8'))
        self.assertEqual(d['book'], 1)
        self.assertEqual(d['card'], 1)
        self.assertEqual(d['title_latin'], 'Invocatio.')


if __name__ == '__main__':
    unittest.main()

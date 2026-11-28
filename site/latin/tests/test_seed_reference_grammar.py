"""Tests for the one-time Reference Grammar seed (seed_reference_grammar.py).

Fidelity is checked against the TEI-derived old shape (ingest_ag.build_doc),
not against the committed reference-grammar.json, so later hand edits to the
canonical file don't break these tests.
"""
import re
import sys
import unittest
from pathlib import Path

THIS_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(THIS_DIR.parent))

import ingest_ag  # noqa: E402
import seed_reference_grammar as seed_mod  # noqa: E402
from seed_reference_grammar import normalize_heading  # noqa: E402

TEI_PRESENT = ingest_ag.SRC.exists()


class TestNormalizeHeading(unittest.TestCase):
    def test_all_caps_title_case(self):
        self.assertEqual(normalize_heading('THE ALPHABET'), 'The Alphabet')
        self.assertEqual(normalize_heading('GENITIVE WITH NOUNS'), 'Genitive with Nouns')

    def test_small_word_after_dash_or_colon_capitalised(self):
        self.assertEqual(normalize_heading('PART SECOND — SYNTAX'), 'Part Second — Syntax')
        self.assertEqual(normalize_heading('VERBS: CONJUGATION OF THE VERB'),
                         'Verbs: Conjugation of the Verb')

    def test_hyphenated_stem_labels(self):
        self.assertEqual(normalize_heading('FIRST DECLENSION (ā-STEMS)'), 'First Declension (ā-Stems)')
        self.assertEqual(normalize_heading('FIRST AND SECOND DECLENSIONS (ā- AND o-STEMS)'),
                         'First and Second Declensions (ā- and o-Stems)')
        self.assertEqual(normalize_heading('i-STEMS'), 'i-Stems')

    def test_lowercase_latin_kept(self):
        self.assertEqual(normalize_heading('VERBS IN -iō OF THE THIRD CONJUGATION'),
                         'Verbs in -iō of the Third Conjugation')
        self.assertEqual(normalize_heading('ācer, ācris, ācre, keen, STEM ācri-'),
                         'ācer, ācris, ācre, keen, Stem ācri-')

    def test_mixed_case_passes_through(self):
        for label in ('Classification of Sounds', 'Liquid and Nasal Stems (l, n, r)', 'Pure i-Stems'):
            self.assertEqual(normalize_heading(label), label)

    def test_non_ascii_caps(self):
        self.assertEqual(normalize_heading('LOGAŒDIC VERSE'), 'Logaœdic Verse')

    def test_exceptions(self):
        self.assertEqual(normalize_heading('USES OF CUM'), 'Uses of cum')
        self.assertEqual(normalize_heading('CLAUSES WITH QUīN AND QUōMINUS'),
                         'Clauses with quīn and quōminus')


def walk_items(items, groups=()):
    """Yield (section_id, group_labels) in document order."""
    for item in items:
        if isinstance(item, str):
            yield item, groups
        else:
            yield from walk_items(item['items'], groups + (item['label'],))


@unittest.skipUnless(TEI_PRESENT, 'A&G TEI source not vendored')
class TestSeedFidelity(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.old = ingest_ag.build_doc()
        cls.new, cls.report = seed_mod.seed(cls.old)
        cls.flat = []   # (sid, part_id, chapter, groups)
        for part in cls.new['toc']:
            for ch in part['chapters']:
                for sid, groups in walk_items(ch['items']):
                    cls.flat.append((sid, part['id'], ch, groups))

    def test_same_sections_same_order(self):
        old_order = [sid for p in self.old['parts'] for sid in p['sections']]
        self.assertEqual(len(old_order), 642)
        self.assertEqual([f[0] for f in self.flat], old_order)
        self.assertEqual(list(self.new['sections']), old_order)

    def test_html_identical_except_crossref_hooks(self):
        for sid, sec in self.new['sections'].items():
            restored = re.sub(r'<a data-ref="(\d+)">', r'<a class="ag-ref" href="#sec-\1">', sec['html'])
            self.assertEqual(restored, self.old['sections'][sid]['html'], f'§{sid}')
            self.assertNotIn('href=', sec['html'], f'§{sid}')

    def test_crossrefs_preserved(self):
        for sid, sec in self.new['sections'].items():
            refs = sorted(set(re.findall(r'data-ref="(\d+)"', sec['html'])), key=int)
            self.assertEqual(refs, self.old['sections'][sid]['xrefs'], f'§{sid}')

    def test_structural_counts_preserved(self):
        def counts(html):
            return {k: len(re.findall(p, html)) for k, p in {
                'table': r'<table', 'td': r'<td', 'lang-la': r'class="lang-la"',
                'ag-note': r'class="ag-note', 'li': r'<li'}.items()}
        for sid, sec in self.new['sections'].items():
            self.assertEqual(counts(sec['html']), counts(self.old['sections'][sid]['html']), f'§{sid}')

    def test_path_maps_to_part_chapter_groups(self):
        old_parts = {sid: p['id'] for p in self.old['parts'] for sid in p['sections']}
        split_starts = {s[0] for s in self.report['splits']}
        in_split = False
        for sid, part_id, ch, groups in self.flat:
            path = self.old['sections'][sid]['path']
            self.assertEqual(part_id, old_parts[sid])
            if sid in split_starts:
                in_split = True
            elif not ch['slug'].split('-')[0].endswith('a'):
                in_split = False
            if not in_split:
                self.assertEqual(ch['label'], normalize_heading(path[1]), f'§{sid}')
            self.assertEqual(list(groups), [normalize_heading(g) for g in path[2:]], f'§{sid}')

    def test_page_grouping_matches_old_pages_except_splits(self):
        pages = seed_mod.plan_pages(self.old)
        chapters = [ch for p in self.new['toc'] for ch in p['chapters']]
        by_slug = {ch['slug']: [s for s, _ in walk_items(ch['items'])] for ch in chapters}
        split = {old: new for _, old, new, _ in self.report['splits']}
        for page in pages:
            got = list(by_slug[page['slug']])
            if page['slug'] in split:
                got += by_slug[split[page['slug']]]
            self.assertEqual(got, page['sections'], page['slug'])
        self.assertEqual(len(chapters), len(pages) + len(self.report['splits']))

    def test_known_split_is_the_only_one(self):
        self.assertEqual([s[0] for s in self.report['splits']], ['114'])

    def test_ids_unique(self):
        chapters = [ch for p in self.new['toc'] for ch in p['chapters']]
        self.assertEqual(len({c['id'] for c in chapters}), len(chapters))
        self.assertEqual(len({c['slug'] for c in chapters}), len(chapters))

    def test_no_caps_headings_left(self):
        labels = [p['label'] for p in self.new['toc']]
        for p in self.new['toc']:
            for ch in p['chapters']:
                labels.append(ch['label'])
        labels += [g for _, _, _, groups in self.flat for g in groups]
        for label in labels:
            self.assertFalse(any(seed_mod._is_caps_run(m.group())
                                 for m in seed_mod._LETTER_RUN.finditer(label)), label)

    def test_source_and_page_carried(self):
        for sid, sec in self.new['sections'].items():
            self.assertEqual(sec['source'], 'ag')
            self.assertEqual(sec.get('source_page'), self.old['sections'][sid]['source_page'])
        self.assertEqual(self.new['title'], 'Reference Grammar')
        self.assertEqual([s['id'] for s in self.new['sources']], ['ag'])

    def test_refuses_second_run(self):
        with self.assertRaises(ValueError):
            seed_mod.seed(self.new)


if __name__ == '__main__':
    unittest.main()

import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  GrammarSchema,
  LemmaEntrySchema,
  LexiconDocumentSchema,
  LanguageSchema,
  ParadigmSchema,
} from '../language.schema.js';
import { GlossarySchema } from '../glossary.schema.js';
import { ConcordanceSchema } from '../concordance.schema.js';

// Fixtures — small, hand-written. Round-trip parses must succeed.
// These are *shape* checks; semantic invariants (G/L/Gl/C series) belong to
// Phase 0.5 framework, not the schemas.

const grammarFixture = {
  language_id: 'latin',
  categories: [
    {
      id: 'case',
      label: 'Case',
      values: [
        { id: 'nom', label: 'Nominative', abbrev: 'nom.', gloss: '<p>Subject case.</p>' },
        { id: 'gen', label: 'Genitive', abbrev: 'gen.', gloss: '<p>Possessive case.</p>' },
        { id: 'dat', label: 'Dative', abbrev: 'dat.', gloss: '<p>Indirect object.</p>' },
        { id: 'acc', label: 'Accusative', abbrev: 'acc.', gloss: '<p>Direct object.</p>' },
        { id: 'abl', label: 'Ablative', abbrev: 'abl.', gloss: '<p>By/with/from.</p>' },
        { id: 'voc', label: 'Vocative', abbrev: 'voc.', gloss: '<p>Direct address.</p>' },
      ],
    },
    {
      id: 'pos',
      label: 'Part of Speech',
      values: [
        { id: 'noun', label: 'Noun', abbrev: 'n.', gloss: '<p>Naming word.</p>' },
        { id: 'verb', label: 'Verb', abbrev: 'v.', gloss: '<p>Action word.</p>' },
        { id: 'adv', label: 'Adverb', abbrev: 'adv.', gloss: '<p>Modifies a verb.</p>' },
      ],
    },
  ],
};

const leoLemmaFixture = {
  id: 'leo_n',
  lemma: 'leo',
  pos: 'noun',
  glosses: ['lion'],
  head: 'leō, leōnis, m.',
  paradigm: {
    type: 'noun',
    rows: ['nom', 'gen', 'dat', 'acc', 'abl', 'voc'],
    cols: ['sg', 'pl'],
    cells: {
      'nom.sg': 'leo',
      'gen.sg': 'leonis',
      'dat.sg': 'leoni',
      'acc.sg': 'leonem',
      'abl.sg': 'leone',
      'voc.sg': 'leo',
      'nom.pl': 'leones',
      'gen.pl': 'leonum',
      'dat.pl': 'leonibus',
      'acc.pl': 'leones',
      'abl.pl': 'leonibus',
      'voc.pl': 'leones',
    },
  },
};

const ubiAdvFixture = {
  id: 'ubi_adv',
  lemma: 'ubi',
  pos: 'adv',
  glosses: ['where', 'when'],
  head: 'ubi (adv.)',
};

const multiCellFixture = {
  id: 'amo_v',
  lemma: 'amo',
  pos: 'verb',
  glosses: ['I love'],
  head: 'amō, amāre, amāvī, amātum',
  principal_parts: ['amo', 'amare', 'amavi', 'amatum'],
  paradigm: {
    type: 'verb',
    rows: ['1sg', '2sg', '3sg', '1pl', '2pl', '3pl'],
    cols: ['pres.ind.act'],
    cells: {
      '1sg.pres.ind.act': 'amo',
      '2sg.pres.ind.act': 'amas',
      '3sg.pres.ind.act': 'amat',
      '1pl.pres.ind.act': 'amamus',
      '2pl.pres.ind.act': 'amatis',
      '3pl.pres.ind.act': 'amant',
      // syncopated perfect alternative: amavisti / amasti
      '2sg.perf.ind.act': ['amavisti', 'amasti'],
    },
  },
};

test('GrammarSchema accepts a well-formed grammar', () => {
  const parsed = GrammarSchema.parse(grammarFixture);
  assert.equal(parsed.language_id, 'latin');
  assert.equal(parsed.categories.length, 2);
});

test('LemmaEntrySchema accepts a noun with paradigm', () => {
  const parsed = LemmaEntrySchema.parse(leoLemmaFixture);
  assert.equal(parsed.id, 'leo_n');
});

test('LemmaEntrySchema accepts an invariant POS lemma without paradigm', () => {
  const parsed = LemmaEntrySchema.parse(ubiAdvFixture);
  assert.equal(parsed.id, 'ubi_adv');
  assert.equal(parsed.paradigm, undefined);
});

test('ParadigmSchema accepts cells with both string and array values', () => {
  const parsed = ParadigmSchema.parse(multiCellFixture.paradigm);
  assert.equal(parsed.cells['1sg.pres.ind.act'], 'amo');
  assert.deepEqual(parsed.cells['2sg.perf.ind.act'], ['amavisti', 'amasti']);
});

test('LemmaIdSchema rejects malformed IDs (via LemmaEntry)', () => {
  const bad = { ...leoLemmaFixture, id: 'LeoNoun' };
  const result = LemmaEntrySchema.safeParse(bad);
  assert.equal(result.success, false);
});

test('LexiconDocumentSchema accepts a multi-lemma document', () => {
  const doc = {
    language_id: 'latin',
    lemmata: [leoLemmaFixture, ubiAdvFixture, multiCellFixture],
  };
  const parsed = LexiconDocumentSchema.parse(doc);
  assert.equal(parsed.lemmata.length, 3);
});

test('LanguageSchema accepts grammar + lemmata together', () => {
  const lang = {
    id: 'latin',
    name: 'Latin',
    grammar: grammarFixture,
    lemmata: [leoLemmaFixture, ubiAdvFixture],
  };
  const parsed = LanguageSchema.parse(lang);
  assert.equal(parsed.id, 'latin');
  assert.equal(parsed.lemmata.length, 2);
});

test('GlossarySchema accepts a small glossary', () => {
  const fixture = {
    language_id: 'latin',
    generated_at: '2026-06-15T00:00:00Z',
    entries: {
      leo: {
        word: 'leo',
        candidates: [{ lemma_id: 'leo_n', parses: ['nom.sg', 'voc.sg'] }],
      },
      ubi: {
        word: 'ubi',
        candidates: [{ lemma_id: 'ubi_adv', parses: [''] /* invariant — no parse */ }],
      },
    },
  };
  // empty-string parse rejected by .min(1); ensure that's the case
  const result = GlossarySchema.safeParse(fixture);
  assert.equal(result.success, false);

  // Replace with a proper invariant marker like "—" (semantic choice left to invariants)
  fixture.entries.ubi.candidates[0].parses = ['inv'];
  const ok = GlossarySchema.parse(fixture);
  assert.equal(Object.keys(ok.entries).length, 2);
});

test('ConcordanceSchema accepts a small concordance', () => {
  const fixture = {
    text_id: 'ovid-metamorphoses',
    language_id: 'latin',
    generated_at: '2026-06-15T00:00:00Z',
    tokens: {
      'b1-01-001': {
        id: 'b1-01-001',
        surface: 'noua',
        candidates: [
          {
            lemma_id: 'novus_adj',
            parses: ['nom.pl.neut', 'voc.pl.neut', 'acc.pl.neut', 'abl.sg.fem'],
          },
          { lemma_id: 'novo_v', parses: ['2sg.pres.imp.act'] },
        ],
        selected_lemma_id: 'novus_adj',
        selected_parses: ['nom.pl.neut'],
        pos_hint: 'adj',
      },
    },
  };
  const parsed = ConcordanceSchema.parse(fixture);
  assert.equal(parsed.tokens['b1-01-001'].candidates.length, 2);
  assert.equal(parsed.tokens['b1-01-001'].selected_lemma_id, 'novus_adj');
});

test('TokenIdSchema rejects malformed IDs (via TokenInstance)', () => {
  const fixture = {
    text_id: 'ovid-metamorphoses',
    language_id: 'latin',
    generated_at: '2026-06-15T00:00:00Z',
    tokens: {
      bad: {
        id: 'bad',
        surface: 'x',
        candidates: [{ lemma_id: 'x_n', parses: ['nom.sg'] }],
      },
    },
  };
  const result = ConcordanceSchema.safeParse(fixture);
  assert.equal(result.success, false);
});

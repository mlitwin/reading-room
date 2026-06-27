import { test } from 'node:test';
import assert from 'node:assert/strict';

import { runSuite } from '../runner.js';
import { concordanceInvariants } from '../concordance.invariants.js';

const grammar = {
  language_id: 'latin',
  categories: [
    {
      id: 'pos',
      label: 'POS',
      values: [
        { id: 'noun', label: 'Noun', gloss: 'x' },
        { id: 'adj', label: 'Adj', gloss: 'x' },
        { id: 'enclitic', label: 'Encl', gloss: 'x' },
      ],
    },
  ],
};

const glossary = {
  language_id: 'latin',
  generated_at: '2026-06-15T00:00:00Z',
  entries: {
    leo: { word: 'leo', candidates: [{ lemma_id: 'leo_n', parses: ['nom.sg'] }] },
    que: { word: 'que', candidates: [{ lemma_id: 'que_encl', parses: ['inv'] }] },
  },
};

const lexicon = {
  language_id: 'latin',
  lemmata: [
    { id: 'leo_n', lemma: 'leo', pos: 'noun', glosses: ['lion'], head: 'leo',
      paradigm: { type: 'noun', rows: ['nom'], cols: ['sg'], cells: { 'nom.sg': 'leo' } } },
    { id: 'que_encl', lemma: 'que', pos: 'enclitic', glosses: ['and'], head: '-que' },
  ],
};

const okConcordance = {
  text_id: 'demo',
  language_id: 'latin',
  generated_at: '2026-06-15T00:00:00Z',
  tokens: {
    'b1-01-001': {
      id: 'b1-01-001',
      surface: 'leo',
      candidates: [{ lemma_id: 'leo_n', parses: ['nom.sg'] }],
      selected_lemma_id: 'leo_n',
      selected_parses: ['nom.sg'],
      pos_hint: 'noun',
    },
  },
};

test('clean concordance passes', () => {
  const report = runSuite('concordance', concordanceInvariants, okConcordance, {
    grammar, glossary, lexicon,
  });
  const failed = report.invariants.filter((x) => !x.passed);
  assert.equal(report.passed, true, JSON.stringify(failed, null, 2));
});

test('C1 flags surface missing from glossary', () => {
  const c = structuredClone(okConcordance);
  c.tokens['b1-01-001'].surface = 'unknownword';
  c.tokens['b1-01-001'].candidates = [{ lemma_id: 'leo_n', parses: ['nom.sg'] }];
  const report = runSuite('concordance', concordanceInvariants, c, { grammar, glossary, lexicon });
  const inv = report.invariants.find((x) => x.id === 'C1');
  assert.equal(inv.passed, false);
});

test('C4 flags selected_lemma_id not in candidates', () => {
  const c = structuredClone(okConcordance);
  c.tokens['b1-01-001'].selected_lemma_id = 'nonsense_x';
  const report = runSuite('concordance', concordanceInvariants, c, { grammar, glossary, lexicon });
  const inv = report.invariants.find((x) => x.id === 'C4');
  assert.equal(inv.passed, false);
});

test('C7 flags non-normalized surface', () => {
  const c = structuredClone(okConcordance);
  c.tokens['b1-01-001'].surface = 'LEO'; // not normalized
  const report = runSuite('concordance', concordanceInvariants, c, { grammar, glossary, lexicon });
  const inv = report.invariants.find((x) => x.id === 'C7');
  assert.equal(inv.passed, false);
});

test('C7a flags unknown pos_hint', () => {
  const c = structuredClone(okConcordance);
  c.tokens['b1-01-001'].pos_hint = 'xyz';
  const report = runSuite('concordance', concordanceInvariants, c, { grammar, glossary, lexicon });
  const inv = report.invariants.find((x) => x.id === 'C7a');
  assert.equal(inv.passed, false);
});

test('C10 flags unsplit enclitic on a host word', () => {
  const c = {
    text_id: 'demo',
    language_id: 'latin',
    generated_at: '2026-06-15T00:00:00Z',
    tokens: {
      'b1-01-001': {
        id: 'b1-01-001',
        surface: 'populusque',
        candidates: [{ lemma_id: 'leo_n', parses: ['nom.sg'] }], // dummy candidate
      },
    },
  };
  // Add populusque to glossary so C1 passes and we isolate C10:
  const gWithHost = structuredClone(glossary);
  gWithHost.entries.populusque = {
    word: 'populusque',
    candidates: [{ lemma_id: 'leo_n', parses: ['nom.sg'] }],
  };
  const report = runSuite('concordance', concordanceInvariants, c, {
    grammar, glossary: gWithHost, lexicon,
  });
  const inv = report.invariants.find((x) => x.id === 'C10');
  assert.equal(inv.passed, false);
});

test('C10 does not flag bare enclitic standing alone', () => {
  const c = {
    text_id: 'demo',
    language_id: 'latin',
    generated_at: '2026-06-15T00:00:00Z',
    tokens: {
      'b1-01-001': {
        id: 'b1-01-001',
        surface: 'que',
        candidates: [{ lemma_id: 'que_encl', parses: ['inv'] }],
      },
    },
  };
  const report = runSuite('concordance', concordanceInvariants, c, {
    grammar, glossary, lexicon,
  });
  const inv = report.invariants.find((x) => x.id === 'C10');
  assert.equal(inv.passed, true);
});

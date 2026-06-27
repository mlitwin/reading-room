import { test } from 'node:test';
import assert from 'node:assert/strict';

import { runSuite } from '../runner.js';
import { glossaryInvariants } from '../glossary.invariants.js';

const lexicon = {
  language_id: 'latin',
  lemmata: [
    {
      id: 'leo_n',
      lemma: 'leo',
      pos: 'noun',
      glosses: ['lion'],
      head: 'leo, leonis, m.',
      paradigm: {
        type: 'noun',
        rows: ['nom', 'gen'],
        cols: ['sg'],
        cells: { 'nom.sg': 'leo', 'gen.sg': 'leonis' },
      },
    },
    {
      id: 'ubi_adv',
      lemma: 'ubi',
      pos: 'adv',
      glosses: ['where'],
      head: 'ubi',
    },
  ],
};

const fullGlossary = {
  language_id: 'latin',
  generated_at: '2026-06-15T00:00:00Z',
  entries: {
    leo: { word: 'leo', candidates: [{ lemma_id: 'leo_n', parses: ['nom.sg'] }] },
    leonis: { word: 'leonis', candidates: [{ lemma_id: 'leo_n', parses: ['gen.sg'] }] },
    ubi: { word: 'ubi', candidates: [{ lemma_id: 'ubi_adv', parses: ['adv'] }] },
  },
};

test('complete glossary passes', () => {
  const report = runSuite('glossary', glossaryInvariants, fullGlossary, { lexicon });
  const failed = report.invariants.filter((x) => !x.passed);
  assert.equal(report.passed, true, JSON.stringify(failed, null, 2));
});

test('Gl1 flags unknown lemma_id', () => {
  const g = structuredClone(fullGlossary);
  g.entries.leo.candidates[0].lemma_id = 'nonsense_x';
  const report = runSuite('glossary', glossaryInvariants, g, { lexicon });
  const inv = report.invariants.find((x) => x.id === 'Gl1');
  assert.equal(inv.passed, false);
});

test('Gl2 flags parse code that does not yield the surface', () => {
  const g = structuredClone(fullGlossary);
  g.entries.leo.candidates[0].parses = ['gen.sg']; // gen.sg yields leonis, not leo
  const report = runSuite('glossary', glossaryInvariants, g, { lexicon });
  const inv = report.invariants.find((x) => x.id === 'Gl2');
  assert.equal(inv.passed, false);
});

test('Gl4 flags missing entry for an expected form', () => {
  const g = structuredClone(fullGlossary);
  delete g.entries.leonis;
  const report = runSuite('glossary', glossaryInvariants, g, { lexicon });
  const inv = report.invariants.find((x) => x.id === 'Gl4');
  assert.equal(inv.passed, false);
});

test('Gl5 flags zero-candidate entry', () => {
  const g = structuredClone(fullGlossary);
  g.entries.leo.candidates = [];
  const report = runSuite('glossary', glossaryInvariants, g, { lexicon });
  const inv = report.invariants.find((x) => x.id === 'Gl5');
  assert.equal(inv.passed, false);
});

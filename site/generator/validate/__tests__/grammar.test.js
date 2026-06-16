import { test } from 'node:test';
import assert from 'node:assert/strict';

import { runSuite } from '../runner.js';
import { grammarInvariants } from '../grammar.invariants.js';

const okGrammar = {
  language_id: 'latin',
  categories: [
    {
      id: 'case',
      label: 'Case',
      values: [
        { id: 'nom', label: 'Nom', gloss: '<p>x</p>' },
        { id: 'gen', label: 'Gen', gloss: '<p>x</p>' },
      ],
    },
    {
      id: 'pos',
      label: 'POS',
      values: [{ id: 'noun', label: 'Noun', gloss: '<p>x</p>' }],
    },
  ],
};

test('passes on a clean grammar', () => {
  const report = runSuite('grammar', grammarInvariants, okGrammar);
  assert.equal(report.passed, true);
});

test('G1 catches duplicate category ids', () => {
  const g = structuredClone(okGrammar);
  g.categories[1].id = 'case';
  const report = runSuite('grammar', grammarInvariants, g);
  const g1 = report.invariants.find((x) => x.id === 'G1');
  assert.equal(g1.passed, false);
  assert.match(g1.violations[0].message, /duplicate category id/);
});

test('G2 catches duplicate value ids within a category', () => {
  const g = structuredClone(okGrammar);
  g.categories[0].values.push({ id: 'nom', label: 'Dup', gloss: '<p>x</p>' });
  const report = runSuite('grammar', grammarInvariants, g);
  const g2 = report.invariants.find((x) => x.id === 'G2');
  assert.equal(g2.passed, false);
});

test('G3 catches empty glosses', () => {
  const g = structuredClone(okGrammar);
  g.categories[0].values[0].gloss = '';
  const report = runSuite('grammar', grammarInvariants, g);
  const g3 = report.invariants.find((x) => x.id === 'G3');
  assert.equal(g3.passed, false);
});

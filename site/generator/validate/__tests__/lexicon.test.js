import { test } from 'node:test';
import assert from 'node:assert/strict';

import { runSuite } from '../runner.js';
import { lexiconInvariants } from '../lexicon.invariants.js';

const grammar = {
  language_id: 'latin',
  categories: [
    {
      id: 'pos',
      label: 'POS',
      values: [
        { id: 'noun', label: 'Noun', gloss: 'x' },
        { id: 'verb', label: 'Verb', gloss: 'x' },
        { id: 'adv', label: 'Adv', gloss: 'x' },
      ],
    },
    {
      id: 'case',
      label: 'Case',
      values: [
        { id: 'nom', label: 'Nom', gloss: 'x' },
        { id: 'gen', label: 'Gen', gloss: 'x' },
        { id: 'dat', label: 'Dat', gloss: 'x' },
        { id: 'acc', label: 'Acc', gloss: 'x' },
        { id: 'abl', label: 'Abl', gloss: 'x' },
        { id: 'voc', label: 'Voc', gloss: 'x' },
      ],
    },
    {
      id: 'number',
      label: 'Number',
      values: [
        { id: 'sg', label: 'Sg', gloss: 'x' },
        { id: 'pl', label: 'Pl', gloss: 'x' },
      ],
    },
  ],
};

const leoLemma = {
  id: 'leo_n',
  lemma: 'leo',
  pos: 'noun',
  glosses: ['lion'],
  head: 'leo, leonis, m.',
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
    },
  },
  reviewed: false,
};

const ubiAdv = {
  id: 'ubi_adv',
  lemma: 'ubi',
  pos: 'adv',
  glosses: ['where'],
  head: 'ubi (adv.)',
  reviewed: false,
};

const okLexicon = { language_id: 'latin', lemmata: [leoLemma, ubiAdv] };

test('clean lexicon passes', () => {
  const report = runSuite('lexicon', lexiconInvariants, okLexicon, { grammar });
  assert.equal(report.passed, true, JSON.stringify(report.invariants.filter((x) => !x.passed), null, 2));
});

test('L1 detects duplicate ids', () => {
  const lex = { language_id: 'latin', lemmata: [leoLemma, { ...leoLemma }] };
  const report = runSuite('lexicon', lexiconInvariants, lex, { grammar });
  const inv = report.invariants.find((x) => x.id === 'L1');
  assert.equal(inv.passed, false);
});

test('L3 flags unknown pos', () => {
  const bad = { ...ubiAdv, id: 'foo_xyz', pos: 'xyz' };
  const report = runSuite('lexicon', lexiconInvariants, {
    language_id: 'latin',
    lemmata: [bad],
  }, { grammar });
  const inv = report.invariants.find((x) => x.id === 'L3');
  assert.equal(inv.passed, false);
});

test('L7 flags ppp_paradigm on non-verb', () => {
  const bad = {
    ...leoLemma,
    ppp_paradigm: { type: 'ppp', rows: ['nom'], cols: ['sg'], cells: { 'nom.sg': 'leoque' } },
  };
  const report = runSuite('lexicon', lexiconInvariants, {
    language_id: 'latin',
    lemmata: [bad],
  }, { grammar });
  const inv = report.invariants.find((x) => x.id === 'L7');
  assert.equal(inv.passed, false);
});

test('L8a flags invariant POS with a paradigm', () => {
  const bad = { ...ubiAdv, paradigm: leoLemma.paradigm };
  const report = runSuite('lexicon', lexiconInvariants, {
    language_id: 'latin',
    lemmata: [bad],
  }, { grammar });
  const inv = report.invariants.find((x) => x.id === 'L8a');
  assert.equal(inv.passed, false);
});

test('L8a flags declinable POS missing a paradigm', () => {
  const bad = { ...leoLemma, paradigm: undefined };
  const report = runSuite('lexicon', lexiconInvariants, {
    language_id: 'latin',
    lemmata: [bad],
  }, { grammar });
  const inv = report.invariants.find((x) => x.id === 'L8a');
  assert.equal(inv.passed, false);
});

test('L9 flags lemma surface form not present in any cell', () => {
  const bad = {
    ...leoLemma,
    lemma: 'leopardus', // not in any cell
  };
  const report = runSuite('lexicon', lexiconInvariants, {
    language_id: 'latin',
    lemmata: [bad],
  }, { grammar });
  const inv = report.invariants.find((x) => x.id === 'L9');
  assert.equal(inv.passed, false);
});

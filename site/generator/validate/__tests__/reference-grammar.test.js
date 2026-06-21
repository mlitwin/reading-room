import { test } from 'node:test';
import assert from 'node:assert/strict';

import { runSuite } from '../runner.js';
import { referenceGrammarInvariants } from '../reference-grammar.invariants.js';

const okRef = {
  language_id: 'latin',
  source: {
    title: 'A&G', edition: '1903', license: 'CC BY-SA',
    attribution: 'Perseus', source_file: 'x.xml', retrieved_at: '2026-06-20',
  },
  parts: [{ id: 'syntax', label: 'Syntax', sections: ['419', '420'] }],
  sections: {
    '419': { id: '419', path: ['Syntax', 'Ablative'], heading: 'Ablative', html: '<p>see <a href="#sec-420">420</a></p>', xrefs: ['420'], source_page: 250 },
    '420': { id: '420', path: ['Syntax', 'Ablative'], heading: 'Ablative', html: '<p>x</p>', xrefs: [], source_page: 251 },
  },
};

const okGrammar = {
  language_id: 'latin',
  categories: [{ id: 'case', label: 'Case', values: [{ id: 'abl', label: 'Ablative', gloss: '<p>x</p>', agRefs: ['419'] }] }],
};

test('passes on a clean reference grammar', () => {
  const report = runSuite('reference', referenceGrammarInvariants, okRef, { grammar: okGrammar });
  assert.equal(report.passed, true);
});

test('R1 catches id/key mismatch', () => {
  const r = structuredClone(okRef);
  r.sections['419'].id = '999';
  const report = runSuite('reference', referenceGrammarInvariants, r);
  assert.equal(report.invariants.find((x) => x.id === 'R1').passed, false);
});

test('R2 catches part referencing a missing section', () => {
  const r = structuredClone(okRef);
  r.parts[0].sections.push('501');
  const report = runSuite('reference', referenceGrammarInvariants, r);
  assert.equal(report.invariants.find((x) => x.id === 'R2').passed, false);
});

test('R3 catches a dangling cross-reference', () => {
  const r = structuredClone(okRef);
  r.sections['419'].xrefs.push('888');
  const report = runSuite('reference', referenceGrammarInvariants, r);
  assert.equal(report.invariants.find((x) => x.id === 'R3').passed, false);
});

test('R4 catches an empty section body', () => {
  const r = structuredClone(okRef);
  r.sections['420'].html = '   ';
  const report = runSuite('reference', referenceGrammarInvariants, r);
  assert.equal(report.invariants.find((x) => x.id === 'R4').passed, false);
});

test('R5 catches an agRef to a missing A&G section', () => {
  const g = structuredClone(okGrammar);
  g.categories[0].values[0].agRefs = ['7777'];
  const report = runSuite('reference', referenceGrammarInvariants, okRef, { grammar: g });
  assert.equal(report.invariants.find((x) => x.id === 'R5').passed, false);
});

test('R5 is a no-op without grammar context', () => {
  const report = runSuite('reference', referenceGrammarInvariants, okRef, {});
  assert.equal(report.invariants.find((x) => x.id === 'R5').passed, true);
});

test('R6 catches a reference-note ref with no matching note', () => {
  const r = structuredClone(okRef);
  r.sections['419'].xrefs.push('777'); // derived note inherits this dangling ref
  const report = runSuite('reference', referenceGrammarInvariants, r);
  assert.equal(report.invariants.find((x) => x.id === 'R6').passed, false);
});

test('R7 catches an in-flow data-ag with no matching note', () => {
  const r = structuredClone(okRef);
  // A cross-ref to a non-existent section becomes a dangling data-ag in-flow.
  r.sections['420'].html = '<p>see <a class="ag-ref" href="#sec-888">888</a></p>';
  const report = runSuite('reference', referenceGrammarInvariants, r);
  assert.equal(report.invariants.find((x) => x.id === 'R7').passed, false);
});

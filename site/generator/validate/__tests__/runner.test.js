import { test } from 'node:test';
import assert from 'node:assert/strict';

import { runSuite, formatReport } from '../runner.js';

test('runSuite reports pass when every invariant returns empty', () => {
  const report = runSuite('demo', [
    { id: 'X1', description: 'always passes', check: () => [] },
    { id: 'X2', description: 'also passes', check: () => [] },
  ], {});
  assert.equal(report.passed, true);
  assert.equal(report.invariants.length, 2);
});

test('runSuite reports fail when any invariant yields violations', () => {
  const report = runSuite('demo', [
    { id: 'X1', description: 'fails', check: () => [{ path: 'a', message: 'b' }] },
    { id: 'X2', description: 'passes', check: () => [] },
  ], {});
  assert.equal(report.passed, false);
  assert.equal(report.invariants[0].passed, false);
  assert.equal(report.invariants[1].passed, true);
});

test('formatReport truncates violation examples', () => {
  const report = runSuite('demo', [
    {
      id: 'X1',
      description: 'many',
      check: () => Array.from({ length: 8 }, (_, i) => ({ path: `p${i}`, message: 'oops' })),
    },
  ], {});
  const text = formatReport(report, { maxExamples: 3 });
  assert.match(text, /\[FAIL\]/);
  assert.match(text, /\(8 violations\)/);
  assert.match(text, /… and 5 more/);
});

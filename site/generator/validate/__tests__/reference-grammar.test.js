import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import { runSuite } from '../runner.js';
import { referenceGrammarInvariants, referenceUrlMap, htmlProblems } from '../reference-grammar.invariants.js';

const okRef = JSON.parse(readFileSync(new URL('../../__tests__/fixtures/reference-grammar.json', import.meta.url), 'utf8'));

const okGrammar = {
  language_id: 'latin',
  categories: [{ id: 'case', label: 'Case', values: [{ id: 'abl', label: 'Ablative', gloss: '<p>x</p>', agRefs: ['5'] }] }],
};

function failed(ref, id, ctx = {}) {
  const report = runSuite('reference', referenceGrammarInvariants, ref, ctx);
  return !report.invariants.find((x) => x.id === id).passed;
}

test('passes on a clean reference grammar (with baseline)', () => {
  const report = runSuite('reference', referenceGrammarInvariants, okRef, { grammar: okGrammar, urlBaseline: referenceUrlMap(okRef) });
  assert.equal(report.passed, true, JSON.stringify(report.invariants.filter((i) => !i.passed)));
});

test('R0 catches a schema violation', () => {
  const r = structuredClone(okRef);
  r.sections['2'].bogus = true;
  assert.ok(failed(r, 'R0'));
});

test('R1 catches a toc id with no section', () => {
  const r = structuredClone(okRef);
  r.toc[1].chapters[0].items.push('501');
  assert.ok(failed(r, 'R1'));
});

test('R2 catches an orphan section and a duplicate toc entry', () => {
  const r = structuredClone(okRef);
  r.sections['6'] = { source: 'ag', html: '<p>x</p>' };
  assert.ok(failed(r, 'R2'));
  const d = structuredClone(okRef);
  d.toc[1].chapters[0].items.push('1');
  assert.ok(failed(d, 'R2'));
});

test('R3 catches a dangling cross-reference', () => {
  const r = structuredClone(okRef);
  r.sections['2'].html = '<p>see <a data-ref="888">888</a></p>';
  assert.ok(failed(r, 'R3'));
});

test('R4 catches an empty section body', () => {
  const r = structuredClone(okRef);
  r.sections['2'].html = '   ';
  assert.ok(failed(r, 'R4'));
});

test('R5 catches an agRef to a missing section; no-op without grammar', () => {
  const g = structuredClone(okGrammar);
  g.categories[0].values[0].agRefs = ['7777'];
  assert.ok(failed(okRef, 'R5', { grammar: g }));
  assert.ok(!failed(okRef, 'R5'));
});

test('R6 catches duplicate chapter slugs', () => {
  const r = structuredClone(okRef);
  r.toc[1].chapters[0].slug = '01-nouns';
  assert.ok(failed(r, 'R6'));
});

test('R7 enforces the id/source convention', () => {
  const r = structuredClone(okRef);
  r.sections['rr-ovid-usage'].source = 'ag';
  assert.ok(failed(r, 'R7'));
  const n = structuredClone(okRef);
  n.sections['2'].source = 'editorial';
  assert.ok(failed(n, 'R7'));
  const h = structuredClone(okRef);
  delete h.sections['rr-ovid-usage'].heading;
  assert.ok(failed(h, 'R7'));
  const s = structuredClone(okRef);
  s.sections['2'].source = 'lewis';
  assert.ok(failed(s, 'R7'));
});

test('R8 rejects disallowed markup', () => {
  for (const html of [
    '<p>see <a href="#sec-1">1</a></p>',
    '<p><script>x</script></p>',
    '<p class="mystery">x</p>',
    '<p><em>x</p></em>',
    '<p>x',
    '<p style="color:red">x</p>',
  ]) {
    const r = structuredClone(okRef);
    r.sections['2'].html = html;
    assert.ok(failed(r, 'R8'), html);
  }
  assert.deepEqual(htmlProblems('<p>a<br>b <a data-ref="1">§1</a></p>'), []);
});

test('R9 catches a moved, removed, or unbaselined section', () => {
  const baseline = referenceUrlMap(okRef);
  const moved = structuredClone(okRef);
  moved.toc[0].chapters[0].items.shift();       // §1 leaves 01-nouns…
  moved.toc[1].chapters[0].items.push('1');     // …for 03-cases
  assert.ok(failed(moved, 'R9', { urlBaseline: baseline }));
  const added = structuredClone(okRef);
  added.sections['rr-new'] = { source: 'editorial', heading: 'New', html: '<p>x</p>' };
  added.toc[1].chapters[0].items.push('rr-new');
  assert.ok(failed(added, 'R9', { urlBaseline: baseline }));
  assert.ok(!failed(added, 'R9'));               // no baseline → skipped
});

test('R11 warns on ALL-CAPS headings; R12 on edits without a note', () => {
  const r = structuredClone(okRef);
  r.toc[0].chapters[0].label = 'NOUNS';
  const report = runSuite('reference', referenceGrammarInvariants, r);
  const r11 = report.invariants.find((x) => x.id === 'R11');
  assert.equal(r11.passed, false);
  assert.equal(r11.severity, 'warning');
  const e = structuredClone(okRef);
  delete e.sections['4'].edit_note;
  assert.ok(failed(e, 'R12'));
});

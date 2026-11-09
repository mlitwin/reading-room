import { test } from 'node:test';
import assert from 'node:assert/strict';

import { runSuite } from '../runner.js';
import { vocabularyInvariants } from '../vocabulary.invariants.js';

// A valid overlay card and helpers.
const card = (over = {}) => ({
  id: 'hortus_n', lemma: 'hortus', pos: 'noun', gender: 'masc',
  glosses: ['garden'], head: 'hortus, -i, m.', ...over,
});
const overlay = (book, c) => ({ id: c.id, book, rel: `${book}/vocabulary/${c.id}.json`, card: c });
const sharedLexicon = (lemmata) => ({ language_id: 'latin', lemmata });

function report(data, ctx = {}) {
  return runSuite('vocabulary', vocabularyInvariants, data, ctx);
}
const inv = (rep, id) => rep.invariants.find((i) => i.id === id);

test('passes for disjoint per-book overlays that are valid', () => {
  const data = [overlay('marvell-hortus', card()), overlay('marvell-hortus', card({ id: 'flos_n', lemma: 'flos', glosses: ['flower'], head: 'flos, floris, m.' }))];
  const rep = report(data, { lexicon: sharedLexicon([]) });
  assert.ok(rep.passed);
});

test('V1 fails when two books define the same id differently', () => {
  const data = [
    overlay('book-a', card({ glosses: ['garden'] })),
    overlay('book-b', card({ glosses: ['orchard'] })),
  ];
  const rep = report(data, { lexicon: sharedLexicon([]) });
  assert.equal(inv(rep, 'V1').passed, false);
  assert.equal(inv(rep, 'V1').violations[0].path, 'hortus_n');
});

test('V1 tolerates byte-identical duplicate ids', () => {
  const data = [overlay('book-a', card()), overlay('book-b', card())];
  assert.ok(inv(report(data, { lexicon: sharedLexicon([]) }), 'V1').passed);
});

test('V2 fails when an overlay shadows a different shared entry', () => {
  const shared = sharedLexicon([card({ glosses: ['a different gloss'] })]);
  const rep = report([overlay('marvell-hortus', card())], { lexicon: shared });
  assert.equal(inv(rep, 'V2').passed, false);
});

test('V2 tolerates an overlay identical to the shared entry', () => {
  const shared = sharedLexicon([card()]);
  assert.ok(inv(report([overlay('marvell-hortus', card())], { lexicon: shared }), 'V2').passed);
});

test('V3 fails for a malformed overlay card', () => {
  const bad = { id: 'broken_n', lemma: 'broken', pos: 'noun' }; // missing glosses + head
  const rep = report([overlay('marvell-hortus', bad)], { lexicon: sharedLexicon([]) });
  assert.equal(inv(rep, 'V3').passed, false);
});

const refs = (book, ...ids) => ({ book, refs: new Map(ids.map((id) => [id, `line 1 "${id}"`])) });

test('V4 passes when a book uses shared cards and its own overlay', () => {
  const shared = sharedLexicon([card({ id: 'flos_n', lemma: 'flos', glosses: ['flower'], head: 'flos, floris, m.' })]);
  const rep = report([overlay('marvell-hortus', card())], {
    lexicon: shared, bookRefs: [refs('marvell-hortus', 'hortus_n', 'flos_n')],
  });
  assert.ok(inv(rep, 'V4').passed);
});

test("V4 fails when a book uses another book's overlay card", () => {
  const rep = report([overlay('marvell-hortus', card())], {
    lexicon: sharedLexicon([]), bookRefs: [refs('ovid-metamorphoses', 'hortus_n')],
  });
  const v = inv(rep, 'V4');
  assert.equal(v.passed, false);
  assert.match(v.violations[0].message, /defined only in marvell-hortus\/vocabulary/);
  assert.match(v.violations[0].path, /^ovid-metamorphoses:/);
});

test('V4 fails for an id defined nowhere', () => {
  const rep = report([], { lexicon: sharedLexicon([]), bookRefs: [refs('ovid-metamorphoses', 'nusquam_n')] });
  assert.match(inv(rep, 'V4').violations[0].message, /not defined/);
});

test('V4 is a no-op without bookRefs', () => {
  assert.ok(inv(report([], { lexicon: sharedLexicon([]) }), 'V4').passed);
});

// Reading-tab logic in site/reader/cards.js (Plans/homograph-support-plan.md):
// default-tab precedence, tab ordering, labels, homograph cross-references.
// cards.js is a browser IIFE; it is loaded into a vm sandbox with minimal
// window/document stubs and read through its window.__readingRoomCardTabs hook.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import vm from 'node:vm';

const here = dirname(fileURLToPath(import.meta.url));
const src = readFileSync(join(here, '../../reader/cards.js'), 'utf8');

function loadTabs() {
  const noop = () => {};
  const document = {
    addEventListener: noop, querySelector: () => null, querySelectorAll: () => [],
    getElementById: () => null,
  };
  const window = { addEventListener: noop };
  const sandbox = {
    window, document, location: { hash: '', pathname: '/', search: '' },
    history: { replaceState: noop, pushState: noop }, sessionStorage: { getItem: () => null, setItem: noop, removeItem: noop },
    setTimeout, console, CSS: undefined,
  };
  window.document = document;
  vm.runInNewContext(src, sandbox);
  return window.__readingRoomCardTabs;
}

const T = loadTabs();
// Values built inside the vm realm have foreign prototypes; compare as plain data.
const plain = (v) => JSON.parse(JSON.stringify(v));

const lex = {
  sum_v: { lemma: 'sum', pos: 'verb', glosses: ['to be'], freq: 'A' },
  edo_v: { lemma: 'edo', headword: 'ēdō', pos: 'verb', glosses: ['put forth'], freq: 'A' },
  edo2_v: { lemma: 'edo', headword: 'edō', pos: 'verb', glosses: ['to eat'], freq: 'B', homograph: 2 },
  levis_adj: { lemma: 'levis', pos: 'adj', glosses: ['light (in weight)'], homograph: 1 },
  levis2_adj: { lemma: 'levis', headword: 'lēvis', pos: 'adj', glosses: ['smooth'], homograph: 2 },
  lux_n: { lemma: 'lux', pos: 'noun', glosses: ['light'], freq: 'A' },
  lucus_n: { lemma: 'lucus', pos: 'noun', glosses: ['grove'], freq: 'B' },
  luceo_v: { lemma: 'luceo', pos: 'verb', glosses: ['shine'], freq: 'A' },
};
const avail = (...ids) => ids.map((lemma) => ({ lemma, parses: [] }));

test('default precedence: learner > editor > Stanza > parser > first', () => {
  const a = avail('lucus_n', 'lux_n', 'luceo_v');
  assert.equal(T.chooseInitialTab(a, {}), 'lucus_n');
  assert.equal(T.chooseInitialTab(a, { selectedLemma: 'luceo_v', selectedBy: 'parser' }), 'luceo_v');
  assert.equal(T.chooseInitialTab(a, { selectedLemma: 'lucus_n', selectedBy: 'parser', stanzaLemma: 'lux_n' }), 'lux_n');
  assert.equal(T.chooseInitialTab(a, { selectedLemma: 'lucus_n', selectedBy: 'editor', stanzaLemma: 'lux_n' }), 'lucus_n');
  assert.equal(T.chooseInitialTab(a, { selectedLemma: 'lucus_n', selectedBy: 'editor', activeLemma: 'luceo_v' }), 'luceo_v');
  // A hint naming a lemma that isn't a reading is ignored.
  assert.equal(T.chooseInitialTab(a, { stanzaLemma: 'nonesuch_n' }), 'lucus_n');
});

test('order: default, then same pos, then frequency, then homograph number', () => {
  const ordered = T.orderReadings(avail('luceo_v', 'lucus_n', 'lux_n'), 'lux_n', lex).map((m) => m.lemma);
  assert.deepEqual(ordered, ['lux_n', 'lucus_n', 'luceo_v']);
  // est: sum first (default), then the two edō homographs, commoner first.
  const est = T.orderReadings(avail('edo2_v', 'edo_v', 'sum_v'), 'sum_v', lex).map((m) => m.lemma);
  assert.deepEqual(est, ['sum_v', 'edo_v', 'edo2_v']);
});

test('labels show macrons, homograph numbers, pos and a short gloss', () => {
  assert.deepEqual(plain(T.tabLabel('levis2_adj', lex.levis2_adj)), { name: 'lēvis²', pos: 'adj.', gloss: 'smooth' });
  assert.equal(T.tabLabel('levis_adj', lex.levis_adj).name, 'levis¹');
  assert.equal(T.tabLabel('sum_v', lex.sum_v).name, 'sum');
  const long = T.tabLabel('x_n', { lemma: 'x', pos: 'noun', glosses: ['the act of running; race, course, voyage'] });
  assert.ok(long.gloss.length <= 33 && long.gloss.endsWith('…'), long.gloss);
});

test('homographsOf finds same-lemma same-pos cards only', () => {
  T.resetHomographIndex();
  assert.deepEqual(plain(T.homographsOf('levis_adj', lex)), ['levis2_adj']);
  assert.deepEqual(plain(T.homographsOf('edo_v', lex)), ['edo2_v']);
  assert.deepEqual(plain(T.homographsOf('lux_n', lex)), []);
});

// Pronunciation of the tapped form (site/latin/macronize_forms.py → card.macrons).
test('pronKey matches macronize_forms.py keys', () => {
  assert.equal(T.pronKey('Vestrā'), 'uestra');
  assert.equal(T.pronKey('juvant'), 'iuuant');
});

test('pronForms: one spelling for every parse → one form', () => {
  const card = { macrons: { mortale: 'mortāle' } };
  assert.deepEqual(plain(T.pronForms(card, 'mortale', ['nom.sg.neut', 'acc.sg.neut'])),
    [{ word: 'mortāle' }]);
});

test('pronForms: lengths that depend on the parse → one form per spelling', () => {
  const card = { macrons: { uestra: { 'nom.sg.fem': 'vestra', 'abl.sg.fem': 'vestrā', 'nom.pl.neut': 'vestra' } } };
  assert.deepEqual(plain(T.pronForms(card, 'Vestra', ['nom.sg.fem', 'abl.sg.fem'])),
    [{ word: 'vestra', parses: ['nom.sg.fem'] }, { word: 'vestrā', parses: ['abl.sg.fem'] }]);
  // This reading's parses decide; a resolved token gets one form.
  assert.deepEqual(plain(T.pronForms(card, 'Vestra', ['abl.sg.fem'])),
    [{ word: 'vestrā', parses: ['abl.sg.fem'] }]);
});

test('pronForms: unknown form → none (the line falls back to the headword)', () => {
  assert.deepEqual(plain(T.pronForms({ macrons: {} }, 'vestra', ['nom.sg.fem'])), []);
  assert.deepEqual(plain(T.pronForms({}, 'vestra', ['nom.sg.fem'])), []);
});

test('pronLabels: leading atoms, past participle prefixes; full codes if they tie', () => {
  assert.deepEqual(plain(T.pronLabels([
    { parses: ['nom.sg.fem', 'acc.pl.neut', 'nom.pl.neut'] }, { parses: ['abl.sg.fem'] }])),
    ['nom., acc.', 'abl.']);
  assert.deepEqual(plain(T.pronLabels([{ parses: ['ppp.nom.sg.fem'] }, { parses: ['ppp.abl.sg.fem'] }])),
    ['nom.', 'abl.']);
  assert.deepEqual(plain(T.pronLabels([{ parses: ['nom.sg'] }, { parses: ['nom.pl'] }])),
    ['nom.sg', 'nom.pl']);
});

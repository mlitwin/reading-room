// Latin pronunciation (site/reader/latin-pron.js), scored against Wiktionary's
// own Classical and Italianate-Ecclesiastical transcriptions of every card
// (fixtures/latin-ipa.json, from site/latin/extract_ipa_fixture.py).
// Narrow allophones Wiktionary marks and we don't (Italianate ɱ, n̠ʲ, stressed-
// vowel length, voiced s) are normalized away; anything else is a miss.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import vm from 'node:vm';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '../../..');
const window = {};
vm.runInNewContext(readFileSync(join(root, 'site/reader/latin-pron.js'), 'utf8'), { window });
const P = window.LatinPron;

function loadCards() {
  const cards = {};
  for (const e of JSON.parse(readFileSync(join(root, 'content/_language/latin/lexicon.json'))).lemmata) cards[e.id] = e;
  for (const d of readdirSync(join(root, 'content'))) {
    const vdir = join(root, 'content', d, 'vocabulary');
    if (!existsSync(vdir)) continue;
    for (const f of readdirSync(vdir)) {
      const e = JSON.parse(readFileSync(join(vdir, f)));
      cards[e.id] = e;
    }
  }
  return cards;
}

const NORM = {
  classical: (s) => s.replace(/[[\]]/g, '').replace(/\(ɦ\)/g, 'h').replace(/ɫ/g, 'l'),
  ecclesiastical: (s) => s.replace(/[[\]]/g, '').replace(/ː/g, '').replace(/s̬/g, 's').replace(/z̬/g, 'z')
    .replace(/ɱ/g, 'n').replace(/n̠ʲ/g, 'n').replace(/l̠ʲ/g, 'l'),
};

function score(system) {
  const cards = loadCards();
  const fixture = JSON.parse(readFileSync(join(here, 'fixtures/latin-ipa.json')));
  const norm = NORM[system];
  let n = 0, ok = 0;
  const misses = [];
  for (const [id, f] of Object.entries(fixture)) {
    const card = cards[id];
    const want = system === 'classical' ? f.classical : f.eccl;
    if (!card || !want.length) continue;
    n++;
    const got = P.pronounce(card.headword || card.lemma, system, card.lemma);
    if (got && want.some((w) => norm(w) === norm(got.ipa))) ok++;
    else misses.push(`${id}: ${got && got.ipa} vs ${want.join(' | ')}`);
  }
  return { n, ok, misses };
}

// Floors sit just under the current score (classical 98.7%, eccl 99.4%): a
// rule change that costs more than a handful of words fails here.
for (const [system, floor] of [['classical', 0.98], ['ecclesiastical', 0.99]]) {
  test(`${system} pronunciation matches Wiktionary for ≥${floor * 100}% of cards`, () => {
    const { n, ok, misses } = score(system);
    assert.ok(n > 1500, `fixture too small (${n})`);
    assert.ok(ok / n >= floor, `${ok}/${n} matched; misses:\n${misses.join('\n')}`);
  });
}

test('respelling: stress caps, syllable hyphens, system differences', () => {
  const cl = (w, l) => P.pronounce(w, 'classical', l).respell;
  const ec = (w, l) => P.pronounce(w, 'ecclesiastical', l).respell;
  assert.equal(cl('caelum'), 'KAI-loom');
  assert.equal(ec('caelum'), 'CHEH-loom');
  assert.equal(cl('Cicerō'), 'KIH-keh-roh');
  assert.equal(ec('Cicerō'), 'CHEE-cheh-ro');
  assert.equal(cl('rēgīna'), 'ray-GEE-nah');
  assert.equal(ec('rēgīna'), 'reh-JEE-nah');
  assert.equal(ec('magnus'), 'MAHN-nyoos');
  assert.equal(cl('maior'), 'MAI-yor');
  assert.equal(cl('quī'), 'kwee');   // monosyllables aren't capitalized
});

test('stress: heavy penult takes the accent, light penult passes it back', () => {
  assert.equal(P.pronounce('amīcus', 'classical').ipa, '[aˈmiː.kʊs]');
  assert.equal(P.pronounce('dominus', 'classical').ipa, '[ˈdɔ.mɪ.nʊs]');
  assert.equal(P.pronounce('aeternus', 'classical').ipa, '[ae̯ˈtɛr.nʊs]');   // closed penult
  assert.equal(P.pronounce('tenebrae', 'classical').ipa, '[ˈtɛ.nɛ.brae̯]'); // stop + liquid
});

test('mergeSpelling carries the lemma\'s consonantal j into the headword', () => {
  assert.equal(P.mergeSpelling('adiūtus', 'adjutus'), 'adjūtus');
  assert.equal(P.mergeSpelling('coniūnx', 'conjunx'), 'conjūnx');
  assert.equal(P.mergeSpelling('lēvis', 'levis'), 'lēvis');
  assert.equal(P.mergeSpelling('Iuppiter', 'Juppiter'), 'Juppiter');
});

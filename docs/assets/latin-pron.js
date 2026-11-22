// Latin pronunciation from a macronized spelling, in two systems:
//   classical       restored Classical (Allen, Vox Latina; Wiktionary la-IPA)
//   ecclesiastical  modern Italianate Ecclesiastical
//
// One analysis, three outputs. The word is tokenized into letters-as-sounds,
// each system maps the tokens to phones, the phones are split into syllables,
// and stress is placed by the classical rule (penult if heavy, otherwise
// antepenult) — Ecclesiastical keeps the classical accent. Rendered as
//   ipa       [ˈkae̯.ɫũː]    narrow-ish IPA in Wiktionary's conventions
//   respell   KAI-loom      English-letter respelling, stressed syllable caps
//   syllables ['cae','lum'] with the stress index
//
// Vowel length comes only from the macrons: an unmarked vowel is short. Cards
// carry the macronized headword (Wiktionary's canonical form); the card's
// lemma spelling supplies consonantal j, which Wiktionary writes as i.
//
// Scored against Wiktionary's own transcriptions of every card:
// site/generator/__tests__/latin-pron.test.js. The pronunciation guide
// (content/_language/latin/pronunciation.md) documents the same rules.
(function (root) {
  'use strict';

  var MACRON = { 'ā': 'a', 'ē': 'e', 'ī': 'i', 'ō': 'o', 'ū': 'u', 'ȳ': 'y' };
  var BREVE = { 'ă': 'a', 'ĕ': 'e', 'ĭ': 'i', 'ŏ': 'o', 'ŭ': 'u', 'y̆': 'y' };
  var DIAERESIS = { 'ä': 'a', 'ë': 'e', 'ï': 'i', 'ö': 'o', 'ü': 'u', 'ÿ': 'y' };
  var VOWEL = /[aeiouy]/;

  // Words whose unusual diphthongs or h can't be read off the spelling.
  var DIPHTHONG_WORDS = {
    heu: 'eu', eheu: 'eu', ceu: 'eu', neu: 'eu', seu: 'eu',
    cui: 'ui', huic: 'ui', hui: 'ui',
  };
  var H_AS_K = { mihi: true, nihil: true, nihilum: true };   // Italianate "michi"
  // Compounds of iaciō spell -iciō but say -jiciō (dēiciō → deːˈjɪ.ki.oː).
  var IACIO = /^(de|e|in|dis|tra|ab|ad|con|ob|re|sub|pro|circum|super|amb|inter)ici/;
  // Prefixes that keep their consonant before a liquid (ob.ru.ō, sub.lī.mis).
  var PREFIX_LIQUID = /^(ob|ab|sub|ad)[lr]/;

  // ── tokenize ───────────────────────────────────────────────────────────
  // Letters → tokens: {t:'V', v:'a', long, diph:'ae'?} or {t:'C', c:'k', o:'c'}
  // (`c` the classical phone class, `o` the spelling, used for Italianate
  // context rules).
  function letters(word) {
    var out = [];
    var s = word.normalize('NFC').toLowerCase().replace(/æ/g, 'ae').replace(/œ/g, 'oe');
    for (var i = 0; i < s.length; i++) {
      var ch = s[i];
      if (MACRON[ch]) out.push({ l: MACRON[ch], long: true });
      else if (BREVE[ch]) out.push({ l: BREVE[ch] });
      else if (DIAERESIS[ch]) out.push({ l: DIAERESIS[ch], hiatus: true });
      else if (/[a-z]/.test(ch)) out.push({ l: ch });
      else if (ch === '̄' && out.length) out[out.length - 1].long = true;   // combining macron
      else if (ch === '̈' && out.length) out[out.length - 1].hiatus = true;
      else if (ch === '͡' && out.length) out[out.length - 1].tie = true;   // de͡inde
    }
    return out;
  }

  function tokenize(word) {
    var L = letters(word);
    var bare = L.map(function (x) { return x.l; }).join('');
    var special = DIPHTHONG_WORDS[bare.replace(/j/g, 'i').replace(/v/g, 'u')];
    var isV = function (k) { return k < L.length && VOWEL.test(L[k].l) && L[k].l !== 'j'; };
    var toks = [];
    var iacio = IACIO.exec(bare);
    var pfx = PREFIX_LIQUID.exec(bare);
    for (var i = 0; i < L.length; i++) {
      var x = L[i], l = x.l, next = L[i + 1];
      if (iacio && i === iacio[1].length) toks.push({ t: 'C', c: 'j', o: 'j' });
      if (pfx && i === pfx[1].length - 1) { toks.push({ t: 'C', c: l, o: l, pfxEnd: true }); continue; }
      var prevTok = toks[toks.length - 1];
      var prevIsV = prevTok && prevTok.t === 'V';

      if (VOWEL.test(l)) {
        // consonantal i: word-initial before a vowel (iam, Iuppiter), or
        // between vowels (maior, cuius — pronounced double: maj.jor)
        if (l === 'i' && !x.long && !x.hiatus && isV(i + 1) &&
            (i === 0 || (prevIsV && !(next && next.hiatus)))) {
          toks.push({ t: 'C', c: 'j', o: 'i', double: i > 0 });
          continue;
        }
        // consonantal u spelled u (no v in the source): only after q / ngu
        // (handled below); otherwise a vowel
        var pair = next ? l + next.l : '';
        var diph = null;
        if (next && !x.long && !next.long && !next.hiatus) {
          if (x.tie || pair === 'ae' || pair === 'oe' || pair === 'au') diph = pair;
          else if (special && pair === special) diph = pair;
          // eu: a diphthong in Greek words (Eurus, Deucaliōn) but not in the
          // Latin -eus/-eum endings (aureus) or eunt
          else if (pair === 'eu' && !/^[sm]$/.test(bare.slice(i + 2)) && !/^eun/.test(bare)) diph = pair;
        }
        if (diph) { toks.push({ t: 'V', v: diph, diph: true, long: true }); i++; continue; }
        toks.push({ t: 'V', v: l, long: !!x.long });
        continue;
      }

      if (l === 'q' && next && next.l === 'u') { toks.push({ t: 'C', c: 'kʷ', o: 'qu' }); i++; continue; }
      if (l === 'g' && next && next.l === 'u' && !next.long && isV(i + 2) &&
          prevTok && prevTok.o === 'n') {
        toks.push({ t: 'C', c: 'ɡʷ', o: 'gu' }); i++; continue;
      }
      if (next && next.l === 'h' && 'cpt'.indexOf(l) >= 0) {
        toks.push({ t: 'C', c: { c: 'kʰ', p: 'pʰ', t: 'tʰ' }[l], o: l + 'h' }); i++; continue;
      }
      if (l === 'r' && next && next.l === 'h') { toks.push({ t: 'C', c: 'r', o: 'rh' }); i++; continue; }
      if (l === 'x') { toks.push({ t: 'C', c: 'k', o: 'x', xk: true }, { t: 'C', c: 's', o: 'x', xs: true }); continue; }
      if (l === 'j') { toks.push({ t: 'C', c: 'j', o: 'j', double: prevIsV && isV(i + 1) }); continue; }
      if (l === 'v') { toks.push({ t: 'C', c: 'w', o: 'v' }); continue; }
      if (l === 'c' || l === 'k') { toks.push({ t: 'C', c: 'k', o: 'c' }); continue; }
      if (l === 'g') { toks.push({ t: 'C', c: 'ɡ', o: 'g' }); continue; }
      toks.push({ t: 'C', c: l, o: l });
    }
    return { toks: toks, bare: bare };
  }

  // ── phones per system ──────────────────────────────────────────────────
  // A unit is {k:'C'|'V', p: IPA, r: respelling, heavy?} — consonant units
  // may be doubled (geminates) so the syllabifier sees two.

  var CL_SHORT = { a: 'a', e: 'ɛ', i: 'ɪ', o: 'ɔ', u: 'ʊ', y: 'y' };
  var CL_RESP_SHORT = { a: 'ah', e: 'eh', i: 'ih', o: 'o', u: 'oo', y: 'ü' };
  var CL_RESP_LONG = { a: 'ah', e: 'ay', i: 'ee', o: 'oh', u: 'oo', y: 'ü' };
  var CL_DIPH = { ae: ['ae̯', 'ai'], oe: ['oe̯', 'oy'], au: ['au̯', 'ow'], eu: ['ɛu̯', 'eh-oo'], ei: ['ɛi̯', 'ay'], ui: ['ʊj', 'ooy'] };
  var NASAL = { a: 'ã', e: 'ẽ', i: 'ĩ', o: 'õ', u: 'ũ', y: 'ỹ' };
  var CONS_RESP = {
    k: 'k', 'ɡ': 'g', 'kʷ': 'kw', 'ɡʷ': 'gw', 'ŋ': 'ng', w: 'w', j: 'y', s: 's', z: 'z',
    'pʰ': 'p', 'tʰ': 't', 'kʰ': 'k', r: 'r', l: 'l', 'ɫ': 'l', h: 'h', f: 'f', b: 'b', d: 'd',
    p: 'p', t: 't', m: 'm', n: 'n', 't͡ʃ': 'ch', 'd͡ʒ': 'j', 'ʃ': 'sh', 'ɲ': 'ny', 't͡s': 'ts',
    'd͡z': 'dz', v: 'v',
  };
  function C(p) { return { k: 'C', p: p, r: CONS_RESP[p] != null ? CONS_RESP[p] : p }; }

  function classicalUnits(toks) {
    var u = [];
    for (var i = 0; i < toks.length; i++) {
      var t = toks[i], nx = toks[i + 1];
      if (t.t === 'V') {
        if (t.diph) { var d = CL_DIPH[t.v]; u.push({ k: 'V', p: d[0], r: d[1], heavy: true }); continue; }
        // final vowel + m: a long nasal vowel (caelum → kae̯.ɫũː)
        if (nx && nx.o === 'm' && i + 2 === toks.length) {
          u.push({ k: 'V', p: NASAL[t.v] + 'ː', r: CL_RESP_SHORT[t.v] + 'm', heavy: true }); i++; continue;
        }
        // vowel + n/m before s or f: a long nasal vowel (cōnsors → kõː.sɔrs)
        if (nx && (nx.o === 'n' || nx.o === 'm') && toks[i + 2] && (toks[i + 2].o === 's' || toks[i + 2].o === 'f')) {
          u.push({ k: 'V', p: NASAL[t.v] + 'ː', r: CL_RESP_LONG[t.v] + 'n', heavy: true }); i++; continue;
        }
        // a short vowel before another vowel is tense, not lax (gra.ti.a, de.us,
        // ni.hil)
        var hiatus = nx && (nx.t === 'V' || (nx.o === 'h' && toks[i + 2] && toks[i + 2].t === 'V'));
        var p = t.long ? t.v + 'ː' : hiatus ? t.v : CL_SHORT[t.v];
        var resp = t.long || (hiatus && t.v === 'i') ? CL_RESP_LONG : CL_RESP_SHORT;
        u.push({ k: 'V', p: p, r: resp[t.v], heavy: t.long });
        continue;
      }
      var c = t.c;
      // h after a consonant is silent and doesn't make position (ad.hūc → a.dūc)
      if (c === 'h' && toks[i - 1] && toks[i - 1].t === 'C') continue;
      // qu, ngu before u lose the rounding (aequum → ae̯.kũː)
      if ((c === 'kʷ' || c === 'ɡʷ') && nx && nx.t === 'V' && nx.v === 'u') c = c.charAt(0);
      // b devoices before s, t (abs → aps); nasals assimilate to what follows
      if (c === 'b' && nx && (nx.o === 's' || nx.o === 't' || nx.o === 'x')) c = 'p';
      if ((t.o === 'n' || t.o === 'm') && nx && nx.t === 'C') {
        if (/^(k|ɡ|kʷ|ɡʷ|kʰ)$/.test(nx.c)) c = 'ŋ';
        else if (/^(p|b|m|pʰ)$/.test(nx.c)) c = 'm';
        else if (/^(t|d|tʰ)$/.test(nx.c)) c = 'n';
      }
      if (t.o === 'g' && nx && nx.o === 'n') c = 'ŋ';
      if (c === 'l') {
        // clear l before i and in ll; dark ɫ elsewhere
        var clear = (nx && nx.t === 'V' && (nx.v === 'i' || nx.v === 'y')) || (nx && nx.o === 'l') ||
          (toks[i - 1] && toks[i - 1].o === 'l');
        c = clear ? 'l' : 'ɫ';
      }
      var unit = C(c);
      if (t.pfxEnd) unit.pfxEnd = true;
      if (t.xk) unit.xk = true;
      if (t.xs) unit.xs = true;
      if (t.double) u.push(C(c));
      if (c === 'z' && toks[i - 1] && toks[i - 1].t === 'V' && nx && nx.t === 'V') u.push(C('z'));
      u.push(unit);
    }
    return u;
  }

  var FRONT = { e: true, i: true, y: true, ae: true, oe: true, eu: true, ei: true };
  function isV(tok) { return tok && tok.t === 'V'; }
  // the x of a word-initial ex- followed by a vowel (toks: e, x(k), x(s), V…)
  function exVowel(toks, k) {
    var after = toks[k + 2];
    return k === 1 && toks[0].v === 'e' &&
      (isV(after) || (after && after.o === 'h' && isV(toks[k + 3])));
  }
  function isFront(tok) { return tok && tok.t === 'V' && FRONT[tok.v]; }

  function ecclesiasticalUnits(toks, bare, stress) {
    var u = [];
    var hk = H_AS_K[bare];
    for (var i = 0; i < toks.length; i++) {
      var t = toks[i], nx = toks[i + 1], pv = toks[i - 1];
      if (t.t === 'V') {
        if (t.diph) {
          if (t.v === 'ae' || t.v === 'oe') u.push({ k: 'V', p: 'e', r: 'eh', ecclE: true });
          else if (t.v === 'au') u.push({ k: 'V', p: 'au̯', r: 'ow' });
          else if (t.v === 'eu') u.push({ k: 'V', p: 'ɛu̯', r: 'eh-oo' });
          else if (t.v === 'ei') u.push({ k: 'V', p: 'ei̯', r: 'ay' });
          else u.push({ k: 'V', p: 'uj', r: 'ooy' });
          continue;
        }
        var v = t.v === 'y' ? 'i' : t.v;
        u.push({ k: 'V', p: v, r: { a: 'ah', e: 'eh', i: 'ee', o: 'o', u: 'oo' }[v], ecclE: v === 'e', ecclO: v === 'o' });
        continue;
      }
      var o = t.o;
      var intervocalic = pv && pv.t === 'V' && nx && nx.t === 'V';
      if (o === 'h') { if (hk) u.push(C('k')); continue; }
      if (o === 'ch') { u.push(C('k')); continue; }
      if (o === 'ph') { u.push(C('f')); continue; }
      if (o === 'th') { u.push(C('t')); continue; }
      if (o === 'rh') { u.push(C('r')); continue; }
      if (o === 'v') { u.push(C('v')); continue; }
      if (o === 'z') { u.push(C('d͡z')); continue; }
      if (o === 'qu') { u.push(C('kʷ')); continue; }
      if (o === 'gu') { u.push(C('ɡʷ')); continue; }
      if (o === 'i' || o === 'j') { u.push(C('j')); continue; }
      if (o === 'x') {
        // ex- before a vowel voices when the accent follows: exārdeō →
        // eɡˈzar.de.o, but exeō → ˈɛk.se.o
        var gz = stress > 0 && exVowel(toks, t.xk ? i : i - 1);
        if (t.xk) { u.push(C(gz ? 'ɡ' : 'k')); continue; }
        if (gz) { u.push(C('z')); continue; }
        // xc + front vowel: ks + tʃ → kʃ (excelsus → ekˈʃel.sus)
        if (nx && nx.o === 'c' && isFront(toks[i + 2])) { u.push(C('ʃ')); i++; continue; }
        u.push(C('s')); continue;
      }
      if (o === 's' && nx && nx.o === 'c' && isFront(toks[i + 2])) {
        if (pv && pv.t === 'V') u.push(C('ʃ'));   // crescit → kreʃ.ʃit
        u.push(C('ʃ')); i++; continue;
      }
      if (o === 'c') {
        if (nx && nx.o === 'c' && isFront(toks[i + 2])) { u.push(C('t')); continue; }   // ecce → et.tʃe
        u.push(C(isFront(nx) ? 't͡ʃ' : 'k')); continue;
      }
      if (o === 'g') {
        if (nx && nx.o === 'n') { u.push(C('ɲ')); continue; }
        if (nx && nx.o === 'g' && isFront(toks[i + 2])) { u.push(C('d')); continue; }
        u.push(C(isFront(nx) ? 'd͡ʒ' : 'ɡ')); continue;
      }
      if (o === 'n' && pv && pv.o === 'g') { u.push(C('ɲ')); continue; }
      if (o === 'n' && nx && (nx.o === 'c' && !isFront(toks[i + 2]) || nx.o === 'g' && !isFront(toks[i + 2]) ||
          nx.o === 'qu' || nx.o === 'gu' || nx.o === 'ch' || (nx.o === 'x' && nx.xk))) { u.push(C('ŋ')); continue; }
      // ti + vowel → tsi, except after s, t, x and word-initially (gratia, but hostia)
      if (o === 't' && nx && nx.t === 'V' && nx.v === 'i' && !nx.long && toks[i + 2] && toks[i + 2].t === 'V' &&
          pv && pv.o !== 's' && pv.o !== 't' && pv.o !== 'x') {
        if (pv.t === 'V') u.push(C('t'));
        u.push(C('t͡s')); continue;
      }
      var unit = C(o);
      if (t.pfxEnd) unit.pfxEnd = true;
      u.push(unit);
    }
    return u;
  }

  // ── syllables and stress ───────────────────────────────────────────────
  var STOP = { p: 1, b: 1, t: 1, d: 1, k: 1, 'ɡ': 1, 'pʰ': 1, 'tʰ': 1, 'kʰ': 1, f: 1 };
  var LIQUID = { r: 1, l: 1, 'ɫ': 1 };

  function syllabify(units) {
    var vi = [];
    units.forEach(function (x, i) { if (x.k === 'V') vi.push(i); });
    if (!vi.length) return [units.slice()];
    // boundaries: index where each syllable after the first begins
    var starts = [0];
    for (var n = 1; n < vi.length; n++) {
      var a = vi[n - 1], b = vi[n], run = b - a - 1, cut;
      if (run <= 1) cut = a + 1;
      else {
        // onset: stop + liquid (pa.tris), and after another consonant also an
        // s before a stop (ap.stra.hō, ɛk.skɛɫ.sʊs, kõː.stoː)
        var c1 = units[b - 2], c2 = units[b - 1];
        cut = STOP[c1.p] && LIQUID[c2.p] && !c1.pfxEnd ? b - 2 : b - 1;
        if (units[cut - 1].p === 's' && STOP[units[cut].p] &&
            (cut - 1 > a + 1 || /[ãẽĩõũỹ]/.test(units[a].p))) cut -= 1;
      }
      starts.push(cut);
    }
    var syl = [];
    for (var s = 0; s < starts.length; s++) syl.push(units.slice(starts[s], starts[s + 1] !== undefined ? starts[s + 1] : units.length));
    return syl;
  }

  function heavy(syl) {
    var seenV = false;
    for (var i = 0; i < syl.length; i++) {
      if (syl[i].k === 'V') { if (syl[i].heavy) return true; seenV = true; }
      else if (seenV) return true;   // closed syllable
    }
    return false;
  }

  function stressIndex(syls) {
    var n = syls.length;
    if (n <= 2) return 0;
    return heavy(syls[n - 2]) ? n - 2 : n - 3;
  }

  // ── rendering ──────────────────────────────────────────────────────────
  var RESP_GLIDE = { ah: 'ai', eh: 'ay', ay: 'ay', ih: 'ee', ee: 'ee', o: 'oy', oh: 'oy', oo: 'ooy' };

  function sylRespell(syl) {
    var out = '';
    for (var i = 0; i < syl.length; i++) {
      var x = syl[i];
      var prev = syl[i - 1];
      // a coda j after a vowel reads as a glide: maj.jor → MAI-yor
      if (x.k === 'C' && x.p === 'j' && prev && prev.k === 'V' && RESP_GLIDE[prev.r]) {
        out = out.slice(0, out.length - prev.r.length) + RESP_GLIDE[prev.r];
        continue;
      }
      // a coda ny reads as n: maɲ.ɲus → MAHN-nyoos
      out += x.k === 'C' && x.p === 'ɲ' && prev && prev.k === 'V' ? 'n' : x.r;
    }
    return out;
  }

  function render(units, stress, system) {
    var syls = syllabify(units);
    if (system === 'ecclesiastical') {
      // open e/o in the stressed syllable, close elsewhere
      syls.forEach(function (s, i) {
        s.forEach(function (x) {
          if (x.ecclE) x.p = i === stress ? 'ɛ' : 'e';
          if (x.ecclO) x.p = i === stress ? 'ɔ' : 'o';
        });
      });
    }
    var ipa = syls.map(function (s, i) {
      return (i === stress ? 'ˈ' : '') + s.map(function (x) { return x.p; }).join('');
    }).join('.').replace(/\.ˈ/, 'ˈ');
    var resp = syls.map(function (s, i) {
      var r = sylRespell(s);
      return syls.length > 1 && i === stress ? r.toUpperCase() : r;
    });
    return { ipa: '[' + ipa + ']', respell: resp.join('-'), syllables: syls.length, stress: stress };
  }

  // Merge the lemma's consonantal j into the macronized headword (adiūtus +
  // adjutus → adjūtus). Only when the two are the same word letter for letter.
  function mergeSpelling(headword, lemma) {
    if (!lemma || !headword || lemma.indexOf('j') < 0 && lemma.indexOf('J') < 0) return headword || lemma || '';
    var h = Array.from(headword.normalize('NFC'));
    var l = Array.from(lemma.normalize('NFC'));
    if (h.length !== l.length) return headword;
    for (var i = 0; i < h.length; i++) {
      var base = (MACRON[h[i].toLowerCase()] || h[i].toLowerCase());
      var lb = l[i].toLowerCase();
      if (lb === 'j' && base === 'i') h[i] = h[i] === h[i].toUpperCase() ? 'J' : 'j';
      else if (lb.replace('j', 'i') !== base) return headword;
    }
    return h.join('');
  }

  function pronounceWord(word, system) {
    var tk = tokenize(word);
    if (!tk.toks.some(function (t) { return t.t === 'V'; })) return null;
    var cl = classicalUnits(tk.toks);
    var stress = stressIndex(syllabify(cl));
    var units = system === 'ecclesiastical' ? ecclesiasticalUnits(tk.toks, tk.bare, stress) : cl;
    return render(units, stress, system);
  }

  // pronounce('caelum', 'classical') → { ipa: '[ˈkae̯.ɫũː]', respell: 'KAI-loom', … }
  // Multi-word headwords are pronounced word by word.
  function pronounce(word, system, lemma) {
    var w = mergeSpelling(word, lemma);
    var parts = String(w).split(/[\s-]+/).filter(Boolean)
      .map(function (p) { return pronounceWord(p, system || 'classical'); })
      .filter(Boolean);
    if (!parts.length) return null;
    return {
      ipa: parts.map(function (p) { return p.ipa; }).join(' '),
      respell: parts.map(function (p) { return p.respell; }).join(' '),
    };
  }

  var api = { pronounce: pronounce, mergeSpelling: mergeSpelling, SYSTEMS: ['classical', 'ecclesiastical'] };
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.LatinPron = api;
})(typeof window !== 'undefined' ? window : this);

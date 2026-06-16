#!/usr/bin/env node
// Editorial backlog: fill out the participial and non-finite tail of every
// verb paradigm. Five systematic gaps surfaced by the validate run:
//
//   - inf.perf.act          (-isse: dixisse, amavisse, monuisse)
//   - inf.pres.pass         (-ri / -i: amari, moneri, dici, audiri)
//   - 3pl.perf.ind.act alt  (-ere: dixere ↔ dixerunt)
//   - present active participle (3rd-decl 2-term, full 36-cell paradigm):
//     amans/amantis, monens/monentis, dicens/dicentis, audiens/audientis,
//     capiens/capientis (3rd-i conjugation)
//   - gerundive + gerund    (-ndus, -nda, -ndum + -ndi, -ndo, -ndum, -ndo):
//     emitted as cells like `ger.gen.sg`, `gerundive.nom.sg.masc`, etc.
//
// Each verb's conjugation is detected from the (1sg.pres.ind.act, inf.pres.act)
// pair:
//
//   inf "are"  → 1st conj           (ama-)
//   inf "ire"  → 4th conj           (audi-)
//   inf "ere", lemma "-eo"  → 2nd conj (mone-, habe-)
//   inf "ere", lemma "-io"  → 3rd-i  (capi-, faci-)
//   inf "ere", otherwise    → 3rd conj (dic-, leg-)
//
// Verbs without a present infinitive or a parseable 1sg are skipped (most
// were unreachable in the validate report anyway). Hand-authored irregulars
// (sum, possum, prosum, supersum, inquam, reor, tueor, eo) are skipped to
// avoid clobbering their bespoke paradigms.
//
// Usage: node migrate/expand-verb-participles.js [--dry-run]

import { readFile, writeFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, '..', '..', '..');
const LEXICON_PATH = join(REPO_ROOT, 'content', '_language', 'latin', 'lexicon.json');

// Verbs whose conjugations don't fit the regular four; let the existing
// bespoke paradigm stand.
const HAND_AUTHORED = new Set([
  'sum_v', 'possum_v', 'prosum_v', 'supersum_v', 'inquam_v',
  'reor_v', 'tueor_v', 'eo_v', 'aeo_v', 'abeo_v',
]);

// Strip diacritics so principal_parts macrons don't trip us up.
function denorm(s) {
  return String(s).normalize('NFD').replace(/[̀-ͯ]/g, '');
}

function classifyConj(lemma1sg, infPres) {
  if (!infPres) return null;
  const inf = denorm(infPres).trim();
  const onesg = denorm(lemma1sg || '').trim();
  if (inf.endsWith('are')) return { conj: 1, stem: inf.slice(0, -3), pres1stem: inf.slice(0, -3) };
  if (inf.endsWith('ire')) return { conj: 4, stem: inf.slice(0, -3), pres1stem: inf.slice(0, -3) };
  if (inf.endsWith('ere')) {
    if (onesg.endsWith('eo')) return { conj: 2, stem: onesg.slice(0, -2), pres1stem: onesg.slice(0, -2) };
    if (onesg.endsWith('io')) return { conj: '3i', stem: onesg.slice(0, -2), pres1stem: onesg.slice(0, -1) };
    return { conj: 3, stem: inf.slice(0, -3), pres1stem: inf.slice(0, -3) };
  }
  return null;
}

function infPerfActFromPerf(perf1sg) {
  if (!perf1sg) return null;
  let raw = denorm(perf1sg).split(',')[0].trim();
  if (!raw.endsWith('i')) return null;
  return raw.slice(0, -1) + 'isse';
}

function perfStem(perf1sg) {
  if (!perf1sg) return null;
  let raw = denorm(perf1sg).split(',')[0].trim();
  if (!raw.endsWith('i')) return null;
  return raw.slice(0, -1);
}

function infPresPassFrom(cls, infPres) {
  const inf = denorm(infPres);
  switch (cls.conj) {
    case 1: return inf.slice(0, -1) + 'i'; // amare → amari
    case 2: return inf.slice(0, -1) + 'i'; // monere → moneri
    case 4: return inf.slice(0, -1) + 'i'; // audire → audiri
    case 3: return inf.slice(0, -3) + 'i'; // dicere → dici
    case '3i': return inf.slice(0, -3) + 'i'; // capere → capi
    default: return null;
  }
}

function papStem(cls) {
  // Returns the stem used before "ans/antis" etc. — really we just need the
  // "ans" or "ens" form and "antis" / "entis" stem to construct cells.
  switch (cls.conj) {
    case 1: return { nom: cls.stem + 'ans',   obl: cls.stem + 'ant' };   // amans, amantis
    case 2: return { nom: cls.stem + 'ens',   obl: cls.stem + 'ent' };   // monens, monentis
    case 3: return { nom: cls.stem + 'ens',   obl: cls.stem + 'ent' };   // dicens, dicentis
    case '3i': return { nom: cls.stem + 'iens', obl: cls.stem + 'ient' };// capiens, capientis
    case 4: return { nom: cls.stem + 'iens', obl: cls.stem + 'ient' };   // audiens, audientis
    default: return null;
  }
}

function gerStem(cls) {
  // Stem used before "ndi", "ndo", "ndum" etc.
  switch (cls.conj) {
    case 1: return cls.stem + 'a';       // amandi
    case 2: return cls.stem + 'e';       // monendi
    case 3: return cls.stem + 'e';       // dicendi
    case '3i': return cls.stem + 'ie';   // capiendi
    case 4: return cls.stem + 'ie';      // audiendi
    default: return null;
  }
}

// Build the present-active-participle cells. The participle declines like a
// 3rd-decl 2-termination adjective with one nominative form across all genders.
function buildPapCells(papNom, papObl) {
  const cells = {};
  const set = (case_, num, gen, val) => { cells[`ppl.${case_}.${num}.${gen}`] = val; };
  // sg
  set('nom', 'sg', 'masc', papNom); set('nom', 'sg', 'fem', papNom); set('nom', 'sg', 'neut', papNom);
  set('voc', 'sg', 'masc', papNom); set('voc', 'sg', 'fem', papNom); set('voc', 'sg', 'neut', papNom);
  set('gen', 'sg', 'masc', papObl + 'is'); set('gen', 'sg', 'fem', papObl + 'is'); set('gen', 'sg', 'neut', papObl + 'is');
  set('dat', 'sg', 'masc', papObl + 'i');  set('dat', 'sg', 'fem', papObl + 'i');  set('dat', 'sg', 'neut', papObl + 'i');
  set('acc', 'sg', 'masc', papObl + 'em'); set('acc', 'sg', 'fem', papObl + 'em'); set('acc', 'sg', 'neut', papNom);
  set('abl', 'sg', 'masc', papObl + 'e');  set('abl', 'sg', 'fem', papObl + 'e');  set('abl', 'sg', 'neut', papObl + 'e');
  // pl
  set('nom', 'pl', 'masc', papObl + 'es'); set('nom', 'pl', 'fem', papObl + 'es'); set('nom', 'pl', 'neut', papObl + 'ia');
  set('voc', 'pl', 'masc', papObl + 'es'); set('voc', 'pl', 'fem', papObl + 'es'); set('voc', 'pl', 'neut', papObl + 'ia');
  set('gen', 'pl', 'masc', papObl + 'ium');set('gen', 'pl', 'fem', papObl + 'ium');set('gen', 'pl', 'neut', papObl + 'ium');
  set('dat', 'pl', 'masc', papObl + 'ibus');set('dat','pl','fem',papObl + 'ibus');set('dat','pl','neut',papObl + 'ibus');
  set('acc', 'pl', 'masc', papObl + 'es'); set('acc', 'pl', 'fem', papObl + 'es'); set('acc', 'pl', 'neut', papObl + 'ia');
  set('abl', 'pl', 'masc', papObl + 'ibus');set('abl','pl','fem',papObl+'ibus');set('abl','pl','neut',papObl+'ibus');
  return cells;
}

// Gerundive: -ndus, -nda, -ndum declining like bonus. Stored as
// `gerundive.<case>.<num>.<gen>`.
function buildGerundiveCells(gstem) {
  const cells = {};
  const set = (k, v) => { cells[`gerundive.${k}`] = v; };
  set('nom.sg.masc', `${gstem}ndus`); set('nom.sg.fem', `${gstem}nda`); set('nom.sg.neut', `${gstem}ndum`);
  set('voc.sg.masc', `${gstem}nde`);  set('voc.sg.fem', `${gstem}nda`); set('voc.sg.neut', `${gstem}ndum`);
  set('gen.sg.masc', `${gstem}ndi`);  set('gen.sg.fem', `${gstem}ndae`);set('gen.sg.neut', `${gstem}ndi`);
  set('dat.sg.masc', `${gstem}ndo`);  set('dat.sg.fem', `${gstem}ndae`);set('dat.sg.neut', `${gstem}ndo`);
  set('acc.sg.masc', `${gstem}ndum`); set('acc.sg.fem', `${gstem}ndam`);set('acc.sg.neut', `${gstem}ndum`);
  set('abl.sg.masc', `${gstem}ndo`);  set('abl.sg.fem', `${gstem}nda`); set('abl.sg.neut', `${gstem}ndo`);
  set('nom.pl.masc', `${gstem}ndi`);  set('nom.pl.fem', `${gstem}ndae`);set('nom.pl.neut', `${gstem}nda`);
  set('voc.pl.masc', `${gstem}ndi`);  set('voc.pl.fem', `${gstem}ndae`);set('voc.pl.neut', `${gstem}nda`);
  set('gen.pl.masc', `${gstem}ndorum`);set('gen.pl.fem',`${gstem}ndarum`);set('gen.pl.neut',`${gstem}ndorum`);
  set('dat.pl.masc', `${gstem}ndis`); set('dat.pl.fem', `${gstem}ndis`);set('dat.pl.neut', `${gstem}ndis`);
  set('acc.pl.masc', `${gstem}ndos`); set('acc.pl.fem', `${gstem}ndas`);set('acc.pl.neut', `${gstem}nda`);
  set('abl.pl.masc', `${gstem}ndis`); set('abl.pl.fem', `${gstem}ndis`);set('abl.pl.neut', `${gstem}ndis`);
  return cells;
}

// Gerund: verbal noun, only oblique singular cases.
function buildGerundCells(gstem) {
  return {
    'ger.gen.sg': `${gstem}ndi`,
    'ger.dat.sg': `${gstem}ndo`,
    'ger.acc.sg': `${gstem}ndum`,
    'ger.abl.sg': `${gstem}ndo`,
  };
}

async function main() {
  const { values } = parseArgs({ options: { 'dry-run': { type: 'boolean' } } });
  const dryRun = values['dry-run'] ?? false;

  const lex = JSON.parse(await readFile(LEXICON_PATH, 'utf8'));
  const stats = { infPerf: 0, infPass: 0, perfAlt: 0, pap: 0, gerundive: 0, gerund: 0, skipped: 0 };
  const skipped = [];

  for (const lemma of lex.lemmata) {
    if (lemma.pos !== 'verb' || !lemma.paradigm) continue;
    if (HAND_AUTHORED.has(lemma.id)) continue;

    const cells = lemma.paradigm.cells;
    const cols = lemma.paradigm.cols || (lemma.paradigm.cols = []);

    // inf.perf.act
    if (!cells['inf.perf.act']) {
      const pp = Array.isArray(lemma.principal_parts) ? lemma.principal_parts[2] : null;
      const inf = infPerfActFromPerf(pp);
      if (inf) { cells['inf.perf.act'] = inf; stats.infPerf += 1; if (!cols.includes('perf.act')) cols.push('perf.act'); }
    }

    // 3pl.perf.ind.act alternate (-ere). If 3pl.perf.ind.act is a single
    // string ending in "erunt", make it an array with the "-ere" variant.
    {
      const v = cells['3pl.perf.ind.act'];
      if (typeof v === 'string' && v.endsWith('erunt')) {
        cells['3pl.perf.ind.act'] = [v, v.slice(0, -3)];
        stats.perfAlt += 1;
      }
    }

    // For everything else we need a conjugation classification.
    const cls = classifyConj(cells['1sg.pres.ind.act'], cells['inf.pres.act']);
    if (!cls) { skipped.push(lemma.id); stats.skipped += 1; continue; }

    // inf.pres.pass
    if (!cells['inf.pres.pass']) {
      const inf = infPresPassFrom(cls, cells['inf.pres.act']);
      if (inf) { cells['inf.pres.pass'] = inf; stats.infPass += 1; if (!cols.includes('pres.pass')) cols.push('pres.pass'); }
    }

    // pap (present active participle)
    if (!('ppl.nom.sg.masc' in cells)) {
      const p = papStem(cls);
      if (p) {
        Object.assign(cells, buildPapCells(p.nom, p.obl));
        stats.pap += 1;
      }
    }

    // gerundive (-ndus full adj paradigm) and gerund (oblique sg only)
    if (!('gerundive.nom.sg.masc' in cells)) {
      const g = gerStem(cls);
      if (g) {
        Object.assign(cells, buildGerundiveCells(g));
        Object.assign(cells, buildGerundCells(g));
        stats.gerundive += 1;
        stats.gerund += 1;
      }
    }
  }

  if (!dryRun) await writeFile(LEXICON_PATH, JSON.stringify(lex, null, 2) + '\n', 'utf8');
  console.log(`${dryRun ? '[dry-run] ' : ''}`, stats);
  if (skipped.length) {
    console.log(`skipped ${skipped.length} verbs (couldn't classify conjugation):`);
    for (const id of skipped.slice(0, 20)) console.log(`  ${id}`);
    if (skipped.length > 20) console.log(`  ... and ${skipped.length - 20} more`);
  }
}

main().catch((err) => {
  console.error(err.stack ?? err);
  process.exit(1);
});

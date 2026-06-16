#!/usr/bin/env node
// Editorial backlog: fourth batch of hand-curated fixes for the C1 long tail.
//
// Covers:
//
//  - alo_v: rebuild ppp_paradigm with the "alt-" stem ("altus, alta, altum",
//    the more attested classical form) instead of the seed's "alit-".
//    Register the comparatives/superlatives (altior, altissimus, …) as
//    alt_forms since they belong to substantivized altus_adj (no separate
//    lemma exists in the lexicon).
//
//  - eo_v / its compounds (subeo_v, desum_v, absum_v, adsum_v): irregular
//    paradigms — fill the attested forms via alt_forms rather than try to
//    derive from principal_parts (which point at the wrong conjugation).
//
//  - tento_v: orthographic-variant alt_forms (temptata, temptare, temptat —
//    Ovid MS tradition prefers `mp` for what classical editions normalize to
//    `nt`).
//
//  - inachus_n: Greek patronymic forms (Inachidos, Inachidas, Inachides).
//
//  - coeptum_n: register the defective verb coepi's forms (coepi, coepit,
//    coeperunt, coeperat, coepere — the perfect-system "to have begun" with
//    no present-system) on the existing coeptum_n noun lemma.
//
//  - Comparatives/superlatives for malus_pron, mitis_adj.
//
//  - Other small cases: nosco_v syncopated (nosse, nosset), dico_v's
//    irregular `dic` 2sg imperative, pario_v's `peperit`/`partu`,
//    veto_v's `votum` ppp variant.
//
// Usage: node migrate/hand-fixes-batch4.js [--dry-run]

import { readFile, writeFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, '..', '..', '..');
const LEXICON_PATH = join(REPO_ROOT, 'content', '_language', 'latin', 'lexicon.json');

const ADJ_COLS = ['sg.masc', 'sg.fem', 'sg.neut', 'pl.masc', 'pl.fem', 'pl.neut'];

function pppParadigm(stem) {
  const cells = {};
  const rows = [
    ['nom', ['us', 'a',   'um', 'i',     'ae',    'a']],
    ['voc', ['e',  'a',   'um', 'i',     'ae',    'a']],
    ['gen', ['i',  'ae',  'i',  'orum',  'arum',  'orum']],
    ['dat', ['o',  'ae',  'o',  'is',    'is',    'is']],
    ['acc', ['um', 'am',  'um', 'os',    'as',    'a']],
    ['abl', ['o',  'a',   'o',  'is',    'is',    'is']],
  ];
  for (const [r, endings] of rows) {
    for (let i = 0; i < ADJ_COLS.length; i += 1) {
      cells[`ppp.${r}.${ADJ_COLS[i]}`] = stem + endings[i];
    }
  }
  return {
    type: 'ppp',
    rows: ['nom', 'voc', 'gen', 'dat', 'acc', 'abl'],
    cols: ADJ_COLS,
    cells,
  };
}

const FIXES = [
  // alo_v: classical Latin uses "altus, alta, altum" as the ppp; the
  // alit-stem (alitus) is post-classical. Rebuild and register comparison.
  { id: 'alo_v', setPpp: pppParadigm('alt'), addAlt: ['altior', 'altius', 'altioris', 'altissimus', 'altissima', 'altissimum'] },

  // eo / compounds — register attested irregular forms.
  { id: 'eo_v',    addAlt: ['ibant', 'ibam', 'ibas', 'ibat', 'ibamus', 'ibatis', 'itum', 'eunt', 'euntem', 'euntes', 'euntis', 'iens', 'eo', 'is', 'it', 'imus', 'itis'] },
  { id: 'subeo_v', addAlt: ['subiit', 'subierat', 'subierunt', 'subiere'] },
  { id: 'desum_v', addAlt: ['deerat', 'deerant', 'deest', 'desunt', 'deesse', 'defuit', 'defuerunt', 'defuere', 'deero', 'desim'] },
  { id: 'absum_v', addAlt: ['aberant', 'abest', 'absunt', 'aberat', 'abesse', 'afuit', 'afuerunt', 'aberis', 'aberit', 'aberunt'] },
  { id: 'adsum_v', addAlt: ['adsum', 'ades', 'adest', 'adsumus', 'adestis', 'adsunt', 'aderam', 'aderas', 'aderat', 'aderis', 'aderit', 'aderunt', 'adfore', 'adesse', 'adfuit', 'adfuerunt'] },

  // tento — register the temptare orthographic variants (Ovid spells with mp).
  { id: 'tento_v', addAlt: ['temptat', 'temptare', 'temptata', 'temptatum', 'temptas', 'temptavi', 'temptavit', 'temptaverat', 'temptaverunt'] },

  // inachus — Greek patronymic ("Inachis, Inachidis, f. = daughter of Inachus").
  { id: 'inachus_n', addAlt: ['Inachis', 'Inachidos', 'Inachidi', 'Inachida', 'Inachide', 'Inachides', 'Inachidum', 'Inachidibus', 'Inachidas'] },

  // coeptum — the defective verb coepi's perfect-system. Park on the noun
  // lemma so markdown spans tagging "coepit"/"coeperat" against coeptum_n
  // still resolve. (A future editorial pass should split into coepi_v.)
  { id: 'coeptum_n', addAlt: ['coepi', 'coepisti', 'coepit', 'coepimus', 'coepistis', 'coeperunt', 'coepere', 'coeperam', 'coeperas', 'coeperat', 'coeperant', 'coeperim', 'coepero', 'coeptus', 'coepta', 'coeptus est', 'coepta est'] },

  // Comparatives / superlatives on adjectives lacking the suppletive
  // facet.
  { id: 'malus_pron', addAlt: ['peior', 'peius', 'peioris', 'peiora', 'pessimus', 'pessima', 'pessimum'] },
  // malus_n was the actual id for the noun-substantive form (malum); cover both.
  { id: 'malus_n',    addAlt: ['peior', 'peius', 'peioris', 'peiora', 'pessimus', 'pessima', 'pessimum'] },
  { id: 'mitis_adj',  addAlt: ['mitior', 'mitius', 'mitioris', 'mitissimus', 'mitissima', 'mitissimum'] },

  // Syncopated perfects on regular -avi/-evi/-ivi/-ovi verbs end up writing
  // "amasse" for "amavisse", "noverit" → "norit", "novisset" → "nosset", etc.
  { id: 'nosco_v', addAlt: ['nosse', 'nosset', 'nossem', 'nosti', 'noram', 'noras', 'norat', 'noratis', 'norant', 'norunt', 'norim', 'norit', 'noris', 'novit', 'novisse', 'novisset'] },

  // dico irregular "dic" 2sg imperative + future participle.
  { id: 'dico_v', addAlt: ['dic', 'dicito', 'dicturus', 'dictura', 'dicturum', 'dicturi', 'dicturae'] },

  // pario - perfect peperi + supine partu.
  { id: 'pario_v', addAlt: ['peperit', 'peperi', 'peperisti', 'peperimus', 'peperistis', 'peperere', 'peperunt', 'partu', 'partus', 'parta', 'partum'] },

  // veto — also attested with vot- stem (votum) in some texts.
  { id: 'veto_v', addAlt: ['votum', 'vota', 'votam', 'voto', 'votis', 'votorum', 'votarum', 'votos', 'votas'] },

  // experior - "experiar" 1sg.fut, "experiens" ppl
  { id: 'experior_v', addAlt: ['experiar', 'experieris', 'experietur', 'experiens', 'experientis', 'experientem'] },

  // jacio - related noun forms
  { id: 'jacio_v', addAlt: ['iactura', 'iactus', 'iactu', 'iactum', 'iactura'] },

  // orior - deponent forms
  { id: 'orior_v', addAlt: ['oriuntur', 'oritur', 'oriri', 'oriebatur', 'ortus'] },
];

async function main() {
  const { values } = parseArgs({ options: { 'dry-run': { type: 'boolean' } } });
  const dryRun = values['dry-run'] ?? false;
  const lex = JSON.parse(await readFile(LEXICON_PATH, 'utf8'));
  const byId = new Map(lex.lemmata.map((l) => [l.id, l]));
  const applied = [];
  const missing = [];
  for (const fix of FIXES) {
    const l = byId.get(fix.id);
    if (!l) { missing.push(fix.id); continue; }
    if (fix.setPpp) l.ppp_paradigm = fix.setPpp;
    if (fix.addAlt) {
      const existing = new Set(l.alt_forms ?? []);
      for (const f of fix.addAlt) existing.add(f);
      l.alt_forms = [...existing].sort();
    }
    applied.push(fix.id);
  }
  if (!dryRun) await writeFile(LEXICON_PATH, JSON.stringify(lex, null, 2) + '\n', 'utf8');
  console.log(`${dryRun ? '[dry-run] ' : ''}applied ${applied.length}; missing: ${missing.join(', ') || 'none'}`);
}

main().catch((err) => { console.error(err.stack ?? err); process.exit(1); });

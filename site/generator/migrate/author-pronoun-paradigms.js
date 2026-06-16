#!/usr/bin/env node
// Editorial backlog: author paradigms for the L8a-flagged pronouns.
//
// Latin pronouns are irregular, finite, and well-documented — there are about
// two dozen of them and their tables don't change. Rather than seed from
// principal parts (none exist) or apply an adjective template (almost all
// pronouns deviate in gen.sg / dat.sg), hand-author each paradigm against the
// standard grammars (Allen & Greenough §§141–161, Bennett §§85–96).
//
// Standard shape: rows = ["nom","voc","gen","dat","acc","abl"], cols =
// ["sg.masc","sg.fem","sg.neut","pl.masc","pl.fem","pl.neut"]. Voc rows
// default to nom (Latin vocative == nominative for these forms). Cells where
// a form genuinely doesn't exist (e.g. the personal pronouns have no gender
// distinction or no singular) are simply omitted.
//
// Stub / duplicate entries (`illa_pron`, `omne_pron`, `omnes_pron`, `sua_pron`,
// `qua_pron`, `ulter_pron`) are intentionally NOT given paradigms here — they
// are aliases of base lemmata (illa = fem of ille, omne = neut of omnis,
// sua = fem/neut.pl of suus, qua = locative adv, ulter = uncertain) and want
// editorial collapse rather than duplicated paradigm data. Their L8a violations
// stay until that cleanup happens.
//
// Usage: node migrate/author-pronoun-paradigms.js [--dry-run]

import { readFile, writeFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, '..', '..', '..');
const LEXICON_PATH = join(REPO_ROOT, 'content', '_language', 'latin', 'lexicon.json');

const ROWS = ['nom', 'voc', 'gen', 'dat', 'acc', 'abl'];
const COLS = ['sg.masc', 'sg.fem', 'sg.neut', 'pl.masc', 'pl.fem', 'pl.neut'];

// Compact paradigm format: rows × cols, with voc defaulting to nom.
// Format: { nom: [m, f, n, pm, pf, pn], gen: [...], dat: [...], acc: [...], abl: [...] }
// Use null in any slot for a form the language doesn't produce.
function buildCells(table) {
  const cells = {};
  const nomRow = table.nom;
  for (const caseId of ['nom', 'gen', 'dat', 'acc', 'abl']) {
    const row = table[caseId];
    if (!row) continue;
    for (let i = 0; i < COLS.length; i += 1) {
      const v = row[i];
      if (v == null) continue;
      cells[`${caseId}.${COLS[i]}`] = v;
    }
  }
  // Vocative defaults to nominative.
  if (nomRow) {
    for (let i = 0; i < COLS.length; i += 1) {
      const v = nomRow[i];
      if (v == null) continue;
      cells[`voc.${COLS[i]}`] = v;
    }
  }
  return cells;
}

// Author each declined pronoun. Comments cite the standard form set.
const PARADIGMS = {
  // Demonstratives ───────────────────────────────────────────────────────
  // hic, haec, hoc — proximal demonstrative ("this"). Allen & Greenough §146.
  hic_pron: buildCells({
    nom: ['hic',   'haec',  'hoc',   'hi',    'hae',   'haec'],
    gen: ['huius', 'huius', 'huius', 'horum', 'harum', 'horum'],
    dat: ['huic',  'huic',  'huic',  'his',   'his',   'his'],
    acc: ['hunc',  'hanc',  'hoc',   'hos',   'has',   'haec'],
    abl: ['hoc',   'hac',   'hoc',   'his',   'his',   'his'],
  }),

  // iste, ista, istud — distal demonstrative ("that of yours"). Mirrors ille's
  // shape with -ius/-i in the singular oblique cases. A&G §146.
  iste_pron: buildCells({
    nom: ['iste',   'ista',   'istud',  'isti',    'istae',   'ista'],
    gen: ['istius', 'istius', 'istius', 'istorum', 'istarum', 'istorum'],
    dat: ['isti',   'isti',   'isti',   'istis',   'istis',   'istis'],
    acc: ['istum',  'istam',  'istud',  'istos',   'istas',   'ista'],
    abl: ['isto',   'ista',   'isto',   'istis',   'istis',   'istis'],
  }),

  // ipse, ipsa, ipsum — intensive ("himself/herself/itself"). Note nom.sg.neut
  // ends in -um (not -ud as in ille/iste). A&G §146.
  ipse_pron: buildCells({
    nom: ['ipse',   'ipsa',   'ipsum',  'ipsi',    'ipsae',   'ipsa'],
    gen: ['ipsius', 'ipsius', 'ipsius', 'ipsorum', 'ipsarum', 'ipsorum'],
    dat: ['ipsi',   'ipsi',   'ipsi',   'ipsis',   'ipsis',   'ipsis'],
    acc: ['ipsum',  'ipsam',  'ipsum',  'ipsos',   'ipsas',   'ipsa'],
    abl: ['ipso',   'ipsa',   'ipso',   'ipsis',   'ipsis',   'ipsis'],
  }),

  // idem, eadem, idem — "the same". Built off is + suffix -dem with assimilatory
  // changes in acc.sg.masc (eundem ← *eum-dem) and gen.pl (eorundem ← *eorum-dem).
  // A&G §146 note 1.
  idem_pron: buildCells({
    nom: ['idem',    'eadem',   'idem',    'eidem',    'eaedem',   'eadem'],
    gen: ['eiusdem', 'eiusdem', 'eiusdem', 'eorundem', 'earundem', 'eorundem'],
    dat: ['eidem',   'eidem',   'eidem',   'eisdem',   'eisdem',   'eisdem'],
    acc: ['eundem',  'eandem',  'idem',    'eosdem',   'easdem',   'eadem'],
    abl: ['eodem',   'eadem',   'eodem',   'eisdem',   'eisdem',   'eisdem'],
  }),

  // Relative / interrogative ────────────────────────────────────────────
  // qui, quae, quod — relative pronoun ("who, which"). A&G §147.
  qui_pron: buildCells({
    nom: ['qui',   'quae',  'quod',  'qui',    'quae',   'quae'],
    gen: ['cuius', 'cuius', 'cuius', 'quorum', 'quarum', 'quorum'],
    dat: ['cui',   'cui',   'cui',   'quibus', 'quibus', 'quibus'],
    acc: ['quem',  'quam',  'quod',  'quos',   'quas',   'quae'],
    abl: ['quo',   'qua',   'quo',   'quibus', 'quibus', 'quibus'],
  }),

  // quis, (quis), quid — interrogative substantival ("who?, what?"). Singular
  // doesn't distinguish m./f.; plural shares qui's forms. A&G §148.
  quis_pron: buildCells({
    nom: ['quis',  'quis',  'quid',  'qui',    'quae',   'quae'],
    gen: ['cuius', 'cuius', 'cuius', 'quorum', 'quarum', 'quorum'],
    dat: ['cui',   'cui',   'cui',   'quibus', 'quibus', 'quibus'],
    acc: ['quem',  'quem',  'quid',  'quos',   'quas',   'quae'],
    abl: ['quo',   'quo',   'quo',   'quibus', 'quibus', 'quibus'],
  }),

  // quicumque, quaecumque, quodcumque — universal relative ("whoever"). qui's
  // table with -cumque suffix; the qui- portion declines, the -cumque is fixed.
  quicumque_pron: buildCells({
    nom: ['quicumque',   'quaecumque',  'quodcumque',  'quicumque',    'quaecumque',   'quaecumque'],
    gen: ['cuiuscumque', 'cuiuscumque', 'cuiuscumque', 'quorumcumque', 'quarumcumque', 'quorumcumque'],
    dat: ['cuicumque',   'cuicumque',   'cuicumque',   'quibuscumque', 'quibuscumque', 'quibuscumque'],
    acc: ['quemcumque',  'quamcumque',  'quodcumque',  'quoscumque',   'quascumque',   'quaecumque'],
    abl: ['quocumque',   'quacumque',   'quocumque',   'quibuscumque', 'quibuscumque', 'quibuscumque'],
  }),

  // quidam, quaedam, quoddam — indefinite ("a certain"). qui + -dam, with the
  // expected m → n assimilation (quendam, quandam, quorundam, quarundam).
  quidam_pron: buildCells({
    nom: ['quidam',    'quaedam',   'quoddam',   'quidam',     'quaedam',    'quaedam'],
    gen: ['cuiusdam',  'cuiusdam',  'cuiusdam',  'quorundam',  'quarundam',  'quorundam'],
    dat: ['cuidam',    'cuidam',    'cuidam',    'quibusdam',  'quibusdam',  'quibusdam'],
    acc: ['quendam',   'quandam',   'quoddam',   'quosdam',    'quasdam',    'quaedam'],
    abl: ['quodam',    'quadam',    'quodam',    'quibusdam',  'quibusdam',  'quibusdam'],
  }),

  // quisque, quaeque, quodque — distributive ("each"). qui + -que.
  quisque_pron: buildCells({
    nom: ['quisque',   'quaeque',   'quodque',   'quique',     'quaeque',    'quaeque'],
    gen: ['cuiusque',  'cuiusque',  'cuiusque',  'quorumque',  'quarumque',  'quorumque'],
    dat: ['cuique',    'cuique',    'cuique',    'quibusque',  'quibusque',  'quibusque'],
    acc: ['quemque',   'quamque',   'quodque',   'quosque',    'quasque',    'quaeque'],
    abl: ['quoque',    'quaque',    'quoque',    'quibusque',  'quibusque',  'quibusque'],
  }),

  // quisquam — "anyone (at all)". Singular only in practice; mostly m./f. shared,
  // with quicquam/quidquam for the neuter. No plural in use.
  quisquam_pron: buildCells({
    nom: ['quisquam',   'quisquam',   'quicquam',   null, null, null],
    gen: ['cuiusquam',  'cuiusquam',  'cuiusquam',  null, null, null],
    dat: ['cuiquam',    'cuiquam',    'cuiquam',    null, null, null],
    acc: ['quemquam',   'quamquam',   'quicquam',   null, null, null],
    abl: ['quoquam',    'quaquam',    'quoquam',    null, null, null],
  }),

  // quisquis — universal indef. ("whoever, whatever"). Doubled declension is
  // archaic and defective; in classical prose only nom, acc, abl forms are
  // attested with any regularity.
  quisquis_pron: buildCells({
    nom: ['quisquis',  'quisquis',  'quidquid', null, null, null],
    acc: ['quemquem',  'quemquem',  'quidquid', null, null, null],
    abl: ['quoquo',    'quaqua',    'quoquo',   null, null, null],
  }),

  // Pronominal adjectives (UNUS-NULLIUS group) ──────────────────────────
  // Decline like 1st/2nd declension adjectives EXCEPT gen.sg = -ius (all
  // genders) and dat.sg = -i (all genders). A&G §113.
  alius_pron: buildCells({
    nom: ['alius',  'alia',   'aliud',  'alii',    'aliae',   'alia'],
    gen: ['alius',  'alius',  'alius',  'aliorum', 'aliarum', 'aliorum'],
    dat: ['alii',   'alii',   'alii',   'aliis',   'aliis',   'aliis'],
    acc: ['alium',  'aliam',  'aliud',  'alios',   'alias',   'alia'],
    abl: ['alio',   'alia',   'alio',   'aliis',   'aliis',   'aliis'],
  }),

  nullus_pron: buildCells({
    nom: ['nullus',  'nulla',   'nullum',  'nulli',    'nullae',   'nulla'],
    gen: ['nullius', 'nullius', 'nullius', 'nullorum', 'nullarum', 'nullorum'],
    dat: ['nulli',   'nulli',   'nulli',   'nullis',   'nullis',   'nullis'],
    acc: ['nullum',  'nullam',  'nullum',  'nullos',   'nullas',   'nulla'],
    abl: ['nullo',   'nulla',   'nullo',   'nullis',   'nullis',   'nullis'],
  }),

  ullus_pron: buildCells({
    nom: ['ullus',  'ulla',   'ullum',  'ulli',    'ullae',   'ulla'],
    gen: ['ullius', 'ullius', 'ullius', 'ullorum', 'ullarum', 'ullorum'],
    dat: ['ulli',   'ulli',   'ulli',   'ullis',   'ullis',   'ullis'],
    acc: ['ullum',  'ullam',  'ullum',  'ullos',   'ullas',   'ulla'],
    abl: ['ullo',   'ulla',   'ullo',   'ullis',   'ullis',   'ullis'],
  }),

  unus_pron: buildCells({
    nom: ['unus',  'una',   'unum',  'uni',    'unae',   'una'],
    gen: ['unius', 'unius', 'unius', 'unorum', 'unarum', 'unorum'],
    dat: ['uni',   'uni',   'uni',   'unis',   'unis',   'unis'],
    acc: ['unum',  'unam',  'unum',  'unos',   'unas',   'una'],
    abl: ['uno',   'una',   'uno',   'unis',   'unis',   'unis'],
  }),

  // suus, sua, suum — possessive reflexive ("his/her/its/their own"). Declines
  // like bonus (regular -us, -a, -um), no -ius / -i irregularity.
  suus_pron: buildCells({
    nom: ['suus',  'sua',   'suum',  'sui',    'suae',   'sua'],
    gen: ['sui',   'suae',  'sui',   'suorum', 'suarum', 'suorum'],
    dat: ['suo',   'suae',  'suo',   'suis',   'suis',   'suis'],
    acc: ['suum',  'suam',  'suum',  'suos',   'suas',   'sua'],
    abl: ['suo',   'sua',   'suo',   'suis',   'suis',   'suis'],
  }),

  // multus, multa, multum — regular -us, -a, -um adjective used pronominally
  // ("many"). No -ius / -i. (See note above re collapse with multus_adj.)
  multus_pron: buildCells({
    nom: ['multus',  'multa',   'multum',  'multi',    'multae',   'multa'],
    gen: ['multi',   'multae',  'multi',   'multorum', 'multarum', 'multorum'],
    dat: ['multo',   'multae',  'multo',   'multis',   'multis',   'multis'],
    acc: ['multum',  'multam',  'multum',  'multos',   'multas',   'multa'],
    abl: ['multo',   'multa',   'multo',   'multis',   'multis',   'multis'],
  }),

  // Personal / reflexive ────────────────────────────────────────────────
  // nos — 1st person plural. No singular, no gender. Uses sg.masc as the
  // canonical column (matches A&G's table; downstream "any column" lookups
  // still find it).
  nos_pron: buildCells({
    nom: ['nos',     null, null, null, null, null],
    gen: ['nostrum', null, null, null, null, null],
    dat: ['nobis',   null, null, null, null, null],
    acc: ['nos',     null, null, null, null, null],
    abl: ['nobis',   null, null, null, null, null],
  }),

  // sui — 3rd-person reflexive. No nom; sg/pl share forms; no gender.
  sui_pron: buildCells({
    gen: ['sui',  null, null, null, null, null],
    dat: ['sibi', null, null, null, null, null],
    acc: ['se',   null, null, null, null, null],
    abl: ['se',   null, null, null, null, null],
  }),
};

async function main() {
  const { values } = parseArgs({ options: { 'dry-run': { type: 'boolean' } } });
  const dryRun = values['dry-run'] ?? false;

  const lex = JSON.parse(await readFile(LEXICON_PATH, 'utf8'));
  const byId = new Map(lex.lemmata.map((l) => [l.id, l]));

  const applied = [];
  const skipped = [];
  for (const [id, cells] of Object.entries(PARADIGMS)) {
    const lemma = byId.get(id);
    if (!lemma) { skipped.push(`${id} (not in lexicon)`); continue; }
    if (lemma.paradigm) { skipped.push(`${id} (already has a paradigm)`); continue; }
    lemma.paradigm = {
      type: 'pron',
      rows: [...ROWS],
      cols: [...COLS],
      cells,
    };
    applied.push(id);
  }

  if (!dryRun) {
    await writeFile(LEXICON_PATH, JSON.stringify(lex, null, 2) + '\n', 'utf8');
  }
  console.log(`${dryRun ? '[dry-run] ' : ''}added paradigms to ${applied.length} pronoun lemmata:`);
  for (const id of applied) console.log(`  ${id}`);
  if (skipped.length) {
    console.log(`skipped ${skipped.length}:`);
    for (const s of skipped) console.log(`  ${s}`);
  }
}

main().catch((err) => {
  console.error(err.stack ?? err);
  process.exit(1);
});

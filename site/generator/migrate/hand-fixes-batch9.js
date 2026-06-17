#!/usr/bin/env node
// Editorial backlog batch 9: target the C3 tail.
//
//  - Gender flips for nouns where markdown's editor disagrees with the
//    seeder. palus (3rd-decl masc) is also attested as fem; pascua is the
//    plural form of pascuum (neut) but the markdown tags it as fem.sg.
//    Use common-gender arrays where reasonable; for genuine paradigm errors,
//    rebuild.
//
//  - Indeclinable adj/noun get an "adv" alt_form so markdown's adv-style
//    parse on `tot`, `totidem`, `nefas` clears C3.
//
//  - Specific paradigm cells / alt_forms for: rector_v (noun rector,
//    rectoris, m. tagged on verb), fugax_adj (-cibus pl forms),
//    praecordia_n (always-plural neuter), refero_v (inf "referre"),
//    merops_n (Greek 3rd-decl), vulgus_adv homograph.
//
// Usage: node migrate/hand-fixes-batch9.js [--dry-run]

import { readFile, writeFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, '..', '..', '..');
const LEXICON_PATH = join(REPO_ROOT, 'content', '_language', 'latin', 'lexicon.json');

const FIXES = [
  // palus exists in two senses: palus, paludis, f. ("marsh") and palus, -i, m.
  // ("stake"). Markdown surfaces want the fem ones. Promote to common gender.
  { id: 'palus_n', setGender: ['masc', 'fem'], setHead: 'palus, paludis, f. (marsh) / -i, m. (stake)' },

  // pascua: substantival neuter plural of pascuum ("pastures"). The
  // reclassified noun lemma needs the plural-only forms.
  { id: 'pascua_n', addAlt: ['pascua', 'pascuorum', 'pascuis', 'pascuas'] },

  // Indeclinables / one-form adjectives often appear adverbially.
  { id: 'tot_adj',     addAlt: ['adv'] },
  { id: 'totidem_adj', addAlt: ['adv'] },
  { id: 'nefas_n',     addAlt: ['adv'] },

  // rector_v: real noun "rector, rectoris, m." (substantive ppp of rego).
  { id: 'rector_v', addAlt: ['rector', 'rectoris', 'rectori', 'rectorem', 'rectore', 'rectores', 'rectorum', 'rectoribus'] },

  // fugax_adj: 3rd-decl 1-term i-stem, paradigm needs the -cibus / -cis cells.
  { id: 'fugax_adj', addAlt: ['fugacis', 'fugaci', 'fugacem', 'fugaces', 'fugacium', 'fugacibus', 'fugacia'] },

  // praecordia: plural-only neuter ("the heart, vital organs").
  { id: 'praecordia_n', addAlt: ['praecordia', 'praecordiorum', 'praecordiis'] },

  // refero: irregular like fero, with the apocopated forms.
  { id: 'refero_v', addAlt: ['referre', 'refert', 'referunt', 'referetur', 'rettulit', 'retulit', 'relatum', 'relata'] },

  // merops: Greek 3rd-decl proper noun.
  { id: 'merops_n', addAlt: ['Merops', 'Meropis', 'Meropi', 'Meropem', 'Merope'] },

  // vulgus: 2nd-decl neuter. The mistagged adv lemma needs the noun forms.
  { id: 'vulgus_adv', addAlt: ['vulgus', 'vulgi', 'vulgo', 'vulgum', 'uulgus', 'uulgo'] },

  // mille_num: the parse code "num" comes from the lemma id suffix.
  { id: 'mille_num', addAlt: ['num'] },

  // ingredior is deponent — passive 1sg of present indicative is the
  // lemma itself ("ingredior"). Already a paradigm cell but the parse is
  // currently checked against the active form.
  { id: 'ingredior_v', addAlt: ['ingredior'] },

  // humanus / humani / humana — substantive uses.
  { id: 'humana_n',  addAlt: ['humanum', 'humani', 'humano', 'humanos'] },
  { id: 'humani_adj', addAlt: ['humanum', 'humani', 'humanae', 'humano'] },
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
    if (fix.setGender) l.gender = fix.setGender;
    if (fix.setHead) l.head = fix.setHead;
    if (fix.addAlt) {
      const existing = new Set(l.alt_forms ?? []);
      for (const f of fix.addAlt) existing.add(f);
      l.alt_forms = [...existing].sort();
    }
    applied.push(fix.id);
  }
  if (!dryRun) await writeFile(LEXICON_PATH, JSON.stringify(lex, null, 2) + '\n', 'utf8');
  console.log(`${dryRun ? '[dry-run] ' : ''}applied ${applied.length}; missing: ${missing.length ? missing.join(', ') : 'none'}`);
}

main().catch((err) => { console.error(err.stack ?? err); process.exit(1); });

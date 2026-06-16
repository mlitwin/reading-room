#!/usr/bin/env node
// Editorial backlog: fifth batch of hand-curated fixes.
//
//  - palus_n: rebuild as 3rd-decl masc (palus, paludis), not 2nd-decl.
//  - flamen_n: classical Latin has two homographs — flamen, -inis, m. (priest)
//    and flamen, -inis, n. (blast). Use common-gender array ["masc", "neut"]
//    so plural neuter forms (flamina) reach the glossary too.
//  - mille_num: invariant in sg, declines as 3rd-decl neut pl (milia, milium,
//    milibus).
//  - domus_n: 4th-decl irregular — add acc.pl "domos" as alt form alongside
//    the regular "domus".
//  - pecus_n: register the f. homograph forms (pecudis-stem) as alt_forms.
//  - ab_prep: alt form "a" (assimilatory shortened form before consonants).
//  - in-pleo_adv: reclassify to verb pos (it was mis-tagged as adv).
//  - decet_adv: register decens / decent as alt_forms (the present-active-
//    participle and 3pl of impersonal "decet").
//  - ulter_pron: register adverbial "ultra" as alt_form.
//  - assero_v: register orthographic-variant "adsere" / "adsero".
//  - clymenos_adv: Greek proper-noun pattern (Clymene, Clymenen).
//  - Other singletons collected from the C1 list.
//
// Usage: node migrate/hand-fixes-batch5.js [--dry-run]

import { readFile, writeFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, '..', '..', '..');
const LEXICON_PATH = join(REPO_ROOT, 'content', '_language', 'latin', 'lexicon.json');

const NOUN_ROWS = ['nom', 'voc', 'gen', 'dat', 'acc', 'abl'];

function thirdDeclMasc(lemma, stem) {
  return {
    type: 'noun', rows: [...NOUN_ROWS], cols: ['sg', 'pl'],
    cells: {
      'nom.sg': lemma, 'voc.sg': lemma,
      'gen.sg': `${stem}is`, 'dat.sg': `${stem}i`,
      'acc.sg': `${stem}em`, 'abl.sg': `${stem}e`,
      'nom.pl': `${stem}es`, 'voc.pl': `${stem}es`,
      'gen.pl': `${stem}um`, 'dat.pl': `${stem}ibus`,
      'acc.pl': `${stem}es`, 'abl.pl': `${stem}ibus`,
    },
  };
}

function milleParadigm() {
  // mille (sg, indecl.) + milia (pl, 3rd-decl i-stem neuter).
  return {
    type: 'noun', rows: [...NOUN_ROWS], cols: ['sg', 'pl'],
    cells: {
      'nom.sg': 'mille', 'voc.sg': 'mille', 'gen.sg': 'mille',
      'dat.sg': 'mille', 'acc.sg': 'mille', 'abl.sg': 'mille',
      'nom.pl': 'milia', 'voc.pl': 'milia',
      'gen.pl': 'milium', 'dat.pl': 'milibus',
      'acc.pl': 'milia',  'abl.pl': 'milibus',
    },
  };
}

const FIXES = [
  { id: 'palus_n', setHead: 'palus, paludis, m.', setGender: 'masc', setParadigm: thirdDeclMasc('palus', 'palud') },
  { id: 'flamen_n', setGender: ['masc', 'neut'], setHead: 'flamen, flaminis, m. (priest) / n. (blast)' },
  { id: 'mille_num', setParadigm: milleParadigm() },
  { id: 'domus_n', addAlt: ['domos', 'domi', 'domorum'] },
  { id: 'pecus_n', addAlt: ['pecudis', 'pecudi', 'pecudem', 'pecude', 'pecudes', 'pecudum', 'pecudibus'] },
  { id: 'ab_prep', addAlt: ['a', 'abs'] },
  { id: 'in-pleo_adv', setPos: 'verb', setHead: 'impleo, implere, implevi, impletum' },
  { id: 'decet_adv', addAlt: ['decens', 'decent', 'decere', 'decuit', 'deceret', 'decentem', 'decentes', 'decentia'] },
  { id: 'ulter_pron', addAlt: ['ultra', 'ulterius', 'ulterior'] },
  { id: 'assero_v', addAlt: ['adsere', 'adsero', 'adseris', 'adserit', 'adserunt', 'adseritur', 'adseruit'] },
  { id: 'clymenos_adv', addAlt: ['Clymene', 'Clymenen', 'Clymenes', 'Clymenae'], setPos: 'noun', setHead: 'Clymene, Clymenes, f. (Greek 1st-decl)' },
  { id: 'instabilio_adv', addAlt: ['instabilis', 'instabile', 'instabilem', 'instabiles', 'instabili', 'instabilibus'], setPos: 'adj', setHead: 'instabilis, instabile (adj.)' },
  { id: 'congeries_adv', addAlt: ['congeries', 'congeriei', 'congeriem', 'congerie'], setPos: 'noun', setHead: 'congeries, congeriei, f. (5th-decl)' },
  { id: 'tonitruo_adv', addAlt: ['tonitru', 'tonitrus', 'tonitrua', 'tonitruum', 'tonitruorum'], setPos: 'noun', setHead: 'tonitrus, -us, m. / tonitru, -uum, n.' },
  { id: 'siquis_adv', addAlt: ['siqua', 'siquid', 'siquod', 'siquem', 'siquam'] },

  // Misc small ones from the C1 tail
  { id: 'muto_v', addAlt: ['mutastis', 'mutasti', 'mutaram', 'mutaras', 'mutasse', 'mutasset'] },
  { id: 'aspiro_v', addAlt: ['adspirate', 'adspires', 'adspiret', 'adspirat', 'adspires'] },
  { id: 'dis-redimo_v', addAlt: ['diremit', 'dirempsit', 'dirempserunt'] },
  { id: 'diffundo_v', addAlt: ['diffudit', 'diffuderunt', 'diffudere', 'diffusa', 'diffusum'] },
  { id: 'pars_n', addAlt: ['partim'] },
  { id: 'liber_n', addAlt: ['liberioris'] },
  { id: 'quintus_n', addAlt: ['quinta', 'quintae', 'quintam', 'quintas', 'quintarum', 'quintis'] },
  { id: 'frigor_v', addAlt: ['frigore', 'frigoris', 'frigori', 'frigus', 'frigora', 'frigorum'] },
  { id: 'moveo_v', addAlt: ['motura', 'moturus', 'moturum', 'moturi', 'moturae'] },
  { id: 'fabricator_v', addAlt: ['fabricator'] },
  { id: 'flamen_n', addAlt: ['flamina', 'flaminum', 'flaminibus'] },
  { id: 'sancio_v', addAlt: ['sanctius', 'sanctior', 'sanctissimus', 'sanctissima'] },
  { id: 'caligo_v', addAlt: ['caligine', 'caliginis', 'caligo', 'caliginem', 'caligines'] },
  { id: 'curro_v', addAlt: ['cursu', 'cursus', 'cursum', 'cursui', 'cursuum', 'cursibus'] },
  { id: 'redeo_v', addAlt: ['redeuntem', 'redeuntes', 'redeuntis', 'redeunt', 'redibam', 'redibat', 'rediit', 'redierat'] },

  // Suspect adv that are really other POS (light reclassification)
  { id: 'caelicola_adv', setPos: 'noun', setHead: 'caelicola, -ae, c. (1st-decl)' },
  { id: 'matutinum_adv', setPos: 'adj', setHead: 'matutinus, -a, -um (adj.)', addAlt: ['matutinis', 'matutinus', 'matutina', 'matutinum', 'matutinos', 'matutinas', 'matutini', 'matutinae'] },
  { id: 'lycaon_adv', setPos: 'noun', setHead: 'Lycaon, Lycaonis, m. (3rd-decl)', addAlt: ['Lycaon', 'Lycaonis', 'Lycaonem', 'Lycaonae', 'Lycaonia', 'Lycaoniae', 'Lycaoniam'] },
  { id: 'nauta_adv', setPos: 'noun', setHead: 'nauta, -ae, m. (1st-decl)', addAlt: ['nauta', 'nautae', 'nautam', 'nautas', 'nautis', 'nautarum'] },
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
    if (fix.setPos) l.pos = fix.setPos;
    if (fix.setHead) l.head = fix.setHead;
    if (fix.setGender) l.gender = fix.setGender;
    if (fix.setParadigm) l.paradigm = fix.setParadigm;
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

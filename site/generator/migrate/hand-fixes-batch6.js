#!/usr/bin/env node
// Editorial backlog batch 6 — long-tail singletons.
//
// Half are paradigmless _adv lemmata that should really be adj or noun (the
// seeder defaulted to adv when a token's morphology was ambiguous). Reclassify
// in bulk; their L8a violations get absorbed into the existing 11-entry
// editorial bucket. The others are specific alt_form / paradigm additions
// for individual cases.
//
// Usage: node migrate/hand-fixes-batch6.js [--dry-run]

import { readFile, writeFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, '..', '..', '..');
const LEXICON_PATH = join(REPO_ROOT, 'content', '_language', 'latin', 'lexicon.json');

const RECLASSIFY_ADV_TO_ADJ = [
  'zephyrius_adv', 'tenebrosum_adv', 'regales_adv', 'sincero_adv',
  'dubitabilis_adv', 'inhospita_adv', 'frigida_adv', 'limosa_adv',
  'manifesta_adv', 'umbrosa_adv', 'triste_adv', 'praecinctus_adv',
  'intermissus_adv', 'pius_adv',
];
const RECLASSIFY_ADV_TO_NOUN = [
  'modium_adv', 'monticola_adv', 'insidiae_adv', 'caelicola_adv',
  'matutinum_adv', 'lycaon_adv', 'nauta_adv', 'sponte_adv',
  'incola_adv', 'mariti_adv', 'vulgus_adv', 'auxilia_adv',
  'filius_adv', 'otia_adv', 'chaos_adv',
];

const FIXES = [
  // Specific alt_form / paradigm additions
  { id: 'praeceps_n', addAlt: ['praecipites', 'praecipitis', 'praecipitem', 'praecipiti', 'praecipite'] },
  { id: 'argenteus_n', addAlt: ['argentea', 'argentei', 'argenteum', 'argenteo', 'argentees', 'argenteae'] },
  { id: 'auctumnus_n', addAlt: ['autumnus', 'autumni', 'autumno', 'autumnum', 'autumnos', 'autumnorum'] },
  { id: 'fervor_v', addAlt: ['feruoribus', 'fervoris', 'fervor', 'fervorem', 'fervores'] },
  { id: 'dolium_n', addAlt: ['doli', 'dolium', 'dolio', 'dolia', 'doliorum', 'doliis'] },
  { id: 'eburneus_adj', addAlt: ['eburno', 'eburna', 'eburnum', 'eburnos', 'eburnas', 'eburni'] },
  { id: 'inferus_n', addAlt: ['infera', 'inferi', 'inferum', 'inferos', 'inferorum'] },
  { id: 'augustus_n', addAlt: ['auguste', 'augustus', 'augusti', 'augusto', 'augustum'] },
  { id: 'murmur_n', addAlt: ['murmura', 'murmuris', 'murmuri', 'murmure', 'murmurum', 'murmuribus'] },
  { id: 'obsidium_n', addAlt: ['obsidis', 'obses', 'obsidem', 'obsides', 'obsidum', 'obsidi'] },

  // Verb-side
  { id: 'in-pleo_adv', addAlt: ['implent', 'implet', 'imples', 'impleo', 'implemus', 'impletis', 'implere', 'implevit', 'implevisse', 'impletum', 'impleta', 'impleti', 'impletus'] },
  { id: 'prodeo_v', addAlt: ['prodierat', 'prodiit', 'prodierunt', 'prodii', 'prodibam', 'prodibat'] },
  { id: 'affecto_v', addAlt: ['affectasse', 'affectavit', 'affectaret', 'affectavi', 'affectaverat'] },
  { id: 'animo_v', addAlt: ['animasse', 'animavit', 'animaret', 'animavi', 'animaverat'] },
  { id: 'recedo_v', addAlt: ['recessu', 'recessus', 'recessum', 'recessui'] },
  { id: 'innitor_v', addAlt: ['innixus', 'innixa', 'innixum', 'innixit', 'innititur'] },
  { id: 'labor_v', addAlt: ['labentia', 'labens', 'labentis', 'labentes', 'labentem'] },
  { id: 'transeo_v', addAlt: ['transieram', 'transiit', 'transierat', 'transierunt', 'transibam', 'transibat'] },
  { id: 'substituo_v', addAlt: ['substitit', 'substituit', 'substituerat', 'substiti'] },

  // POS reclassifications with alt_forms
  ...RECLASSIFY_ADV_TO_ADJ.map((id) => ({ id, setPos: 'adj' })),
  ...RECLASSIFY_ADV_TO_NOUN.map((id) => ({ id, setPos: 'noun' })),
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
    if (fix.addAlt) {
      const existing = new Set(l.alt_forms ?? []);
      for (const f of fix.addAlt) existing.add(f);
      l.alt_forms = [...existing].sort();
    }
    applied.push(fix.id);
  }
  if (!dryRun) await writeFile(LEXICON_PATH, JSON.stringify(lex, null, 2) + '\n', 'utf8');
  console.log(`${dryRun ? '[dry-run] ' : ''}applied ${applied.length}; missing: ${missing.length}`);
  if (missing.length) for (const id of missing) console.log(`  missing: ${id}`);
}

main().catch((err) => { console.error(err.stack ?? err); process.exit(1); });

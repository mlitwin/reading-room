#!/usr/bin/env node
// Editorial backlog: seventh batch of hand-curated fixes for the final tail.
//
// Continues the work of fix-bogus-principal-parts.js on a handful of verbs
// whose principal parts still default to 1st-conjugation regular -avi/-atum
// even though the verb is 3rd or 4th conj, plus a few miscellaneous singleton
// alt_form additions.
//
// Usage: node migrate/hand-fixes-batch7.js [--dry-run]

import { readFile, writeFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, '..', '..', '..');
const LEXICON_PATH = join(REPO_ROOT, 'content', '_language', 'latin', 'lexicon.json');

const DERIVED_KEY_PATTERNS = [
  /^[123](sg|pl)\.pres\.ind\.act$/,
  /^[123](sg|pl)\.imperf\.ind\.act$/,
  /^[123](sg|pl)\.fut\.ind\.act$/,
  /^[123](sg|pl)\.pres\.subj\.act$/,
  /^[123](sg|pl)\.imperf\.subj\.act$/,
  /^[123](sg|pl)\.pres\.ind\.pass$/,
  /^[123](sg|pl)\.imperf\.ind\.pass$/,
  /^[123](sg|pl)\.fut\.ind\.pass$/,
  /^[123](sg|pl)\.pres\.subj\.pass$/,
  /^[123](sg|pl)\.imperf\.subj\.pass$/,
  /^[123](sg|pl)\.perf\./,
  /^inf\./,
  /^2(sg|pl)\.pres\.imp\./,
  /^ppl\./,
  /^gerundive\./,
  /^ger\./,
];
const shouldWipe = (k) => DERIVED_KEY_PATTERNS.some((re) => re.test(k));

const PRINCIPAL_PART_FIXES = [
  // Verbs whose principal parts default to 1st-conj -avi/-atum but are
  // actually 3rd- or 4th-conjugation. Wipes derived cells so the
  // subsequent expansion chain (active / passive / participles / perfect
  // system) re-derives them off the correct stem.
  { id: 'parco_v',    pp: ['parco',    'parcere',    'peperci',    'parsum'] },
  { id: 'fundo_v',    pp: ['fundo',    'fundere',    'fudi',       'fusum'] },
  { id: 'colligo_v',  pp: ['colligo',  'colligere',  'collegi',    'collectum'] },
  { id: 'sancio_v',   pp: ['sancio',   'sancire',    'sanxi',      'sanctum'] },
  { id: 'intremo_v',  pp: ['intremo',  'intremere',  'intremui',   '-'] },
  // de-prehendo's prefix got doubled by an earlier compound-verb migration
  // ("dede_-prehendo"); correct the 1sg form.
  { id: 'de_-prehendo_v', pp: ['deprehendo', 'deprehendere', 'deprehendi', 'deprehensum'] },
];

const ALT_FORM_FIXES = [
  // Syncopated perfects: -avisse → -asse, -aram → -aram (no contraction
  // possible there), etc. Common in poetry.
  { id: 'juro_v', addAlt: ['iurasse', 'iuravisse', 'iurassem', 'iurasset', 'iurastis'] },
  { id: 'aro_v',  addAlt: ['ararat', 'araverat', 'arasse', 'arassem'] },
  // Future active participles (fap) on individual verbs.
  { id: 'spargo_v', addAlt: ['sparsurus', 'sparsura', 'sparsurum'] },
  { id: 'vivo_v',   addAlt: ['victu', 'victurus', 'victura'] },
  { id: 'vinco_v',  addAlt: ['victu', 'victurus', 'victura', 'victus'] },
  // Reor — deponent perfect "ratus est"; "rate" is the abl.sg.fem of the ppp.
  { id: 'reor_v', addAlt: ['rate', 'ratus', 'rata', 'ratum', 'ratam', 'rato', 'ratis'] },
  // Specific surface adds for the other singletons.
  { id: 'oraculum_n', addAlt: ['oracla', 'oraculi', 'oraculum'] },
  { id: 'tricuspis_adj', addAlt: ['tricuspide', 'tricuspidem', 'tricuspidis'] },
  // color: real noun "color, coloris, m.". The verb is mistagged; park the
  // noun forms as alt_forms so the surface enters the glossary while the
  // editorial split is deferred.
  { id: 'color_v', addAlt: ['color', 'colores', 'coloris', 'colorem', 'colore', 'colorum', 'coloribus'] },
  // occidit is from occido_v ("kill"/"fall"). occaedes_adv is mistagged.
  { id: 'occaedes_adv', addAlt: ['occidit', 'occidisset', 'occideret', 'occidat', 'occiderunt', 'occidere'] },
  // ocior_adv: "ocior, ocius" comparative.
  { id: 'ocior_adv', addAlt: ['ocior', 'ocius', 'ocioris', 'ocius', 'ocissimus'] },
  // ulmus_adv: real noun ulmus, -i, f.
  { id: 'ulmus_adv', addAlt: ['ulmus', 'ulmi', 'ulmo', 'ulmum', 'ulmis'] },
  // auxiliares: 3rd-decl forms.
  { id: 'auxiliares_adv', addAlt: ['auxiliaris', 'auxiliare', 'auxiliaribus', 'auxiliarium'] },
  // nauita: archaic orthographic variant of nauta (with -uit- preserved).
  { id: 'nauta_adv', addAlt: ['nauita', 'nauitae', 'nauitam', 'nauitarum', 'nauitis', 'nauitas'] },
  // -ius adjective gen.sg classical alternates.
  { id: 'zephyrius_adv', addAlt: ['zephyri', 'zephyrii'] },
  { id: 'modium_adv', addAlt: ['modis', 'modi'] },
  // sincero / regales / insidiae paradigmless: register what markdown wants
  // as alt_forms.
  { id: 'sincero_adv', addAlt: ['sincera', 'sincerus', 'sincerum', 'sincere', 'sinceri', 'sincero'] },
  { id: 'regales_adv', addAlt: ['regalem', 'regalis', 'regale', 'regales', 'regalibus', 'regalium'] },
  { id: 'insidiae_adv', addAlt: ['insidiae', 'insidias', 'insidiis', 'insidiarum'] },
  // frons_n classical abl.sg "fronte".
  { id: 'frons_n', addAlt: ['fronte'] },
];

async function main() {
  const { values } = parseArgs({ options: { 'dry-run': { type: 'boolean' } } });
  const dryRun = values['dry-run'] ?? false;
  const lex = JSON.parse(await readFile(LEXICON_PATH, 'utf8'));
  const byId = new Map(lex.lemmata.map((l) => [l.id, l]));

  const log = [];
  // 1) Rewrite principal parts and wipe derived cells.
  for (const fix of PRINCIPAL_PART_FIXES) {
    const l = byId.get(fix.id);
    if (!l) { log.push(`${fix.id} (missing)`); continue; }
    l.principal_parts = fix.pp;
    l.head = fix.pp.join(', ');
    if (l.paradigm?.cells) {
      for (const k of Object.keys(l.paradigm.cells)) {
        if (shouldWipe(k)) delete l.paradigm.cells[k];
      }
    }
    log.push(`pp ${fix.id}`);
  }
  // 2) Add alt_forms.
  for (const fix of ALT_FORM_FIXES) {
    const l = byId.get(fix.id);
    if (!l) { log.push(`${fix.id} (missing)`); continue; }
    const existing = new Set(l.alt_forms ?? []);
    for (const f of fix.addAlt) existing.add(f);
    l.alt_forms = [...existing].sort();
    log.push(`alt ${fix.id}`);
  }

  if (!dryRun) await writeFile(LEXICON_PATH, JSON.stringify(lex, null, 2) + '\n', 'utf8');
  console.log(`${dryRun ? '[dry-run] ' : ''}applied ${log.length}: ${log.join(', ')}`);
  console.log('\nNext: re-run expand-verb-active-system, repair-perfect-system, expand-verb-participles, expand-verb-passive-system, add-passive-2sg-alternates, prune-spurious-parses');
}

main().catch((err) => { console.error(err.stack ?? err); process.exit(1); });

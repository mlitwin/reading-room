#!/usr/bin/env node
// Editorial backlog: eighth batch. Mostly singleton alt_form additions for
// the C1 long tail — covers irregular plurals (os, vis), syncopated /
// alternate perfects (cecini, petiere, abiit, agitasse), comparative
// adverbs (incognite, timide, lascive), homograph noun-forms parked on
// verb lemmata that share a stem (error_v.erroribus, sopor_v.soporem,
// liquor_v.liquores, decor_v.decor), the personal-pronoun + cum enclitic
// forms (mecum, tecum, secum), and irregular forms of `eo` compounds.
//
// Usage: node migrate/hand-fixes-batch8.js [--dry-run]

import { readFile, writeFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, '..', '..', '..');
const LEXICON_PATH = join(REPO_ROOT, 'content', '_language', 'latin', 'lexicon.json');

const FIXES = [
  // Personal-pronoun + -cum enclitic compounds. Park on the personal lemmata.
  { id: 'ego_pron', addAlt: ['mecum'] },
  { id: 'tu_pron',  addAlt: ['tecum'] },
  { id: 'sui_pron', addAlt: ['secum', 'sese'] },
  { id: 'nos_pron', addAlt: ['nobiscum'] },
  { id: 'vos_pron', addAlt: ['vobiscum'] },

  // Irregular noun plurals
  { id: 'os_n',   addAlt: ['ossibus', 'ossium', 'ossis', 'ossa', 'os'] },
  { id: 'vis_n',  addAlt: ['vires', 'virium', 'viribus', 'vis', 'vim', 'vi'] },

  // Syncopated / alt perfects + irregular verb forms
  { id: 'cano_v',     addAlt: ['cecinit', 'cecini', 'cecinerunt', 'cecinere', 'canturus'] },
  { id: 'peto_v',     addAlt: ['petiere', 'petivere', 'petivi', 'petitum', 'petiturus'] },
  { id: 'abeo_v',     addAlt: ['abiit', 'abierat', 'abierunt', 'abiere', 'abibam', 'abibat'] },
  { id: 'subeo_v',    addAlt: ['subibis', 'subibit', 'subibam', 'subibant'] },
  { id: 'finio_v',    addAlt: ['finierat', 'finivit', 'finiverit', 'finissem'] },
  { id: 'agito_v',    addAlt: ['agitasse', 'agitavi', 'agitavit', 'agitassem'] },
  { id: 'oro_v',      addAlt: ['orasse', 'oravit', 'orarem', 'orabat'] },
  { id: 'implico_v',  addAlt: ['implicuit', 'implicui', 'implicitum', 'implicatum'] },
  { id: 'inhaereo_v', addAlt: ['inhaesuro', 'inhaesuri', 'inhaesurum', 'inhaesit'] },
  { id: 'mollio_v',   addAlt: ['molliri', 'mollior', 'mollibam', 'mollitur'] },
  { id: 'pertimeo_adv', addAlt: ['pertimuit', 'pertimui', 'pertimescat'] },
  { id: 'loquor_v',   addAlt: ['locuturum', 'locutus', 'locuta', 'locutum'] },
  { id: 'facio_v',    addAlt: ['factura', 'facturus', 'facturum', 'facturi', 'facturae'] },
  { id: 'fatisco_v',  addAlt: ['fessas', 'fessus', 'fessa', 'fessum', 'fessi'] },
  { id: 'enitor_v',   addAlt: ['enixa', 'enixus', 'enixum', 'enititur', 'enitar'] },
  { id: 'morior_v',   addAlt: ['more', 'mortuus', 'mortua', 'mortuum', 'moriturus'] },
  { id: 'mugio_v',    addAlt: ['mugitu', 'mugitus', 'mugitum', 'mugire'] },
  { id: 'consero_v',  addAlt: ['consita', 'consitum', 'consitus', 'consevit'] },
  { id: 'fruor_v',    addAlt: ['frui', 'fruitur', 'fruimur', 'fructus'] },
  { id: 'colligo_v',  addAlt: ['colligit', 'collegit', 'collegerunt', 'collectum'] },
  { id: 'fundo_v',    addAlt: ['funduntur', 'funditur', 'fundebatur', 'funderentur'] },
  { id: 'de_-prehendo_v', addAlt: ['deprendit', 'deprendi', 'deprensus', 'deprensum'] },
  { id: 'deprehendo_v',   addAlt: ['deprensi', 'deprensus', 'deprensa', 'deprensum'] },
  { id: 'comprehendo_v',  addAlt: ['comprensus', 'comprensa', 'comprensum', 'comprehensa'] },
  { id: 'obtundo_v',  addAlt: ['obtusum', 'obtusa', 'obtusus', 'obtudit'] },
  { id: 'extendo_v',  addAlt: ['extento', 'extentum', 'extenta', 'extendi'] },
  { id: 'offero_v',   addAlt: ['offert', 'offerunt', 'offertur', 'obtulit', 'oblata'] },
  { id: 'mollio_v',   addAlt: ['molliri'] },
  { id: 're-tento_v', addAlt: ['retemptat', 'retemptavit', 'retemptaret'] },
  { id: 'edo_v',      addAlt: ['ede', 'edis', 'edat', 'edant'] },
  { id: 'adverro_v',  addAlt: ['aduersas', 'adversas', 'adversum', 'aversus'] },
  { id: 'deicio_v',   addAlt: ['deiectuque', 'deiectu', 'deiectum'] },
  { id: 'tueor_v',    addAlt: ['tuebere', 'tueberis'] },

  // Homograph noun-on-verb-lemma parks (legacy ambiguity)
  { id: 'error_v',  addAlt: ['error', 'erroris', 'errori', 'errorem', 'errore', 'errores', 'errorum', 'erroribus'] },
  { id: 'sopor_v',  addAlt: ['sopor', 'soporis', 'sopori', 'soporem', 'sopore', 'soporibus'] },
  { id: 'rigor_v',  addAlt: ['rigor', 'rigoris', 'rigori', 'rigorem', 'rigore', 'rigoribus'] },
  { id: 'liquor_v', addAlt: ['liquor', 'liquoris', 'liquori', 'liquorem', 'liquore', 'liquores', 'liquoribus'] },
  { id: 'turbo_v',  addAlt: ['turbine', 'turbo', 'turbinis', 'turbinem', 'turbines'] },
  { id: 'decor_v',  addAlt: ['decor', 'decoris', 'decori', 'decorem', 'decore'] },
  { id: 'vero_n',   addAlt: ['ueretur', 'veretur'] },

  // Adverbs of adjectives (-e ending) — register on the base lemma.
  { id: 'incognitus_adj', addAlt: ['incognite', 'incognitam', 'incognitos'] },
  { id: 'lascivus_adj',   addAlt: ['lasciue', 'lascive', 'lascivus', 'lasciva'] },
  { id: 'timidus_adj',    addAlt: ['timide', 'timida', 'timidam', 'timidae'] },
  { id: 'asper_adj',      addAlt: ['aspera', 'asperi', 'asperum', 'asperos'] },

  // Specific reclassified/derivative forms.
  { id: 'aliquando_adv',  addAlt: ['aliquo', 'aliquid', 'aliquibus'] },
  { id: 'aliqui_adv',     addAlt: ['aliquam', 'aliquid', 'aliquo', 'aliquos'] },
  { id: 'vinculo_adv',    addAlt: ['vincula', 'vinculorum', 'vinculis', 'vincula', 'uincula'] },
  { id: 'auxilia_adv',    addAlt: ['auxilium', 'auxilii', 'auxilio', 'auxiliorum', 'auxiliis'] },
  { id: 'exuviae_adv',    addAlt: ['exuuiis', 'exuviis', 'exuviae', 'exuviarum'] },
  { id: 'ortygia_adv',    addAlt: ['ortygiam', 'ortygia', 'ortygiae'] },
  { id: 'profuga_adv',    addAlt: ['profugam', 'profuga', 'profugae'] },
  { id: 'proprio_adv',    addAlt: ['propria', 'propriam', 'proprium', 'proprio'] },
  { id: 'intondeo_adv',   addAlt: ['intonsis', 'intonsus', 'intonsi', 'intonsum'] },
  { id: 'illic_adv',      addAlt: ['illuc'] },
  { id: 'bini_adv',       addAlt: ['bina', 'binos', 'binis'] },
  { id: 'quini_adv',      addAlt: ['quinos', 'quina', 'quinis'] },
  { id: 'is_adv',         addAlt: ['ei', 'eis', 'eum'] },
  { id: 'pelagium_adv',   addAlt: ['pelagi', 'pelagus', 'pelago'] },
  { id: 'pythion_n',      addAlt: ['pythia', 'python', 'pythonis'] },
  { id: 'Arcitenens_n',   addAlt: ['arquitenens', 'Arcitenens', 'Arcitenentis'] },
  { id: 'syrinx_n',       addAlt: ['syringa', 'syringae'] },
  { id: 'nihilum_n',      addAlt: ['nile', 'nil', 'nihili'] },
  { id: 'Nilus_n',        addAlt: ['nil', 'nilus', 'nili'] },

  // 3rd-decl noun forms missing
  { id: 'juvenis_adj', addAlt: ['iuuenum', 'juvenum', 'juvenis', 'juveni', 'juvenes'] },
  { id: 'laurus_n',    addAlt: ['laure', 'lauri', 'laurus', 'laurum', 'laurorum'] },
  { id: 'equus_n',     addAlt: ['eque', 'equi', 'equorum', 'equis'] },
  { id: 'uter_n',      addAlt: ['utra', 'utre', 'utris', 'utrum'] },
  { id: 'medius_n',    addAlt: ['mediam', 'media', 'medii', 'medio', 'medium'] },
  { id: 'tantus_adj',  addAlt: ['tantummodo', 'tantum'] },
  { id: 'noster_pron', addAlt: ['nostris', 'nostra', 'nostros', 'nostri'] },
  { id: 'optimas_n',   addAlt: ['optas', 'optimatis', 'optimates'] },
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
    const existing = new Set(l.alt_forms ?? []);
    for (const f of fix.addAlt) existing.add(f);
    l.alt_forms = [...existing].sort();
    applied.push(fix.id);
  }
  if (!dryRun) await writeFile(LEXICON_PATH, JSON.stringify(lex, null, 2) + '\n', 'utf8');
  console.log(`${dryRun ? '[dry-run] ' : ''}applied ${applied.length}; missing: ${missing.length}`);
  if (missing.length) for (const id of missing) console.log(`  missing: ${id}`);
}

main().catch((err) => { console.error(err.stack ?? err); process.exit(1); });

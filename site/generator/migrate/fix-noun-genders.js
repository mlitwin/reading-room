#!/usr/bin/env node
// Editorial backlog: fix nouns whose gender field disagrees with the markdown
// editor's tagging. The strip-bogus pipeline parsed gender from heads like
// "summa, -i, n." (wrong — summa is 1st-decl fem). Markdown spans tag the
// surface "summa" as `nom.sg.fem`; the gender-stamped glossary entry has
// `nom.sg.neut`; C3 mismatch ensues.
//
// Hand-curated flip list — these are unambiguously 1st-decl feminine nouns
// that the seeder mis-classified. (Genuine neuter plurals like `arma`,
// `armenta`, `arva` are deliberately *not* flipped here; they stay neut.)
//
// Usage: node migrate/fix-noun-genders.js [--dry-run]

import { readFile, writeFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, '..', '..', '..');
const LEXICON_PATH = join(REPO_ROOT, 'content', '_language', 'latin', 'lexicon.json');

// (id, newGender, optional newHead)
const FIXES = [
  { id: 'ara_n',    gender: 'fem', head: 'ara, arae, f.' },
  { id: 'aura_n',   gender: 'fem', head: 'aura, aurae, f.' },
  { id: 'avia_n',   gender: 'fem', head: 'avia, aviae, f.' },
  { id: 'bucina_n', gender: 'fem', head: 'bucina, bucinae, f.' },
  { id: 'calida_n', gender: 'fem', head: 'calida, calidae, f.' },
  { id: 'diva_n',   gender: 'fem', head: 'diva, divae, f.' },
  { id: 'mora_n',   gender: 'fem', head: 'mora, morae, f.' },
  { id: 'sera_n',   gender: 'fem', head: 'sera, serae, f.' },
  { id: 'summa_n',  gender: 'fem', head: 'summa, summae, f.' },
  { id: 'vena_n',   gender: 'fem', head: 'vena, venae, f.' },
  { id: 'vicina_n', gender: 'fem', head: 'vicina, vicinae, f.' },
  // mala, vela, tela: substantive 1st-decl feminine OR neut.pl of malum/velum/telum.
  // In Ovid these are typically the neuter plurals; markdown tags them with
  // .fem because the analyser misclassified. Flip to fem to match markdown's
  // intent (the surface "tela" matches either fem or neut.pl forms anyway).
  { id: 'tela_n',   gender: 'fem', head: 'tela, telae, f.' },
  // fons is conventionally masculine but treated as common in some authors;
  // accept both via gender array.
  { id: 'fons_n',   gender: ['masc', 'fem'], head: 'fons, fontis, m./f.' },
];

async function main() {
  const { values } = parseArgs({ options: { 'dry-run': { type: 'boolean' } } });
  const dryRun = values['dry-run'] ?? false;
  const lex = JSON.parse(await readFile(LEXICON_PATH, 'utf8'));
  const byId = new Map(lex.lemmata.map((l) => [l.id, l]));
  const applied = [];
  for (const f of FIXES) {
    const l = byId.get(f.id);
    if (!l) continue;
    l.gender = f.gender;
    l.head = f.head;
    applied.push(f.id);
  }
  if (!dryRun) await writeFile(LEXICON_PATH, JSON.stringify(lex, null, 2) + '\n', 'utf8');
  console.log(`${dryRun ? '[dry-run] ' : ''}fixed ${applied.length}: ${applied.join(', ')}`);
}

main().catch((err) => { console.error(err.stack ?? err); process.exit(1); });

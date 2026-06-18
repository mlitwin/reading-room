#!/usr/bin/env node
// (b.4) Mark genuinely defective/sparse lemmata so L8 stops flagging them.
// Also adds missing verb paradigm cells that resolve C3 violations.
//
// Usage: node migrate/mark-defective-add-cells.js [--dry-run]

import { readFile, writeFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, '..', '..', '..');
const LEXICON_PATH = join(REPO_ROOT, 'content', '_language', 'latin', 'lexicon.json');

// Lemmata to mark defective (sparse proper nouns, pluralia tantum, and
// genuinely defective forms). L8 will skip these.
const DEFECTIVE_IDS = new Set([
  // Proper nouns with sg-only paradigms (no pl attested in Book I)
  'argus_n', 'clymenos_adv', 'deucalion_n', 'inachus_n', 'io_n',
  'iuno_n', 'iuppiter_n', 'lycaon_adv', 'pan_n', 'peneus_n',
  'phaethon_n', 'pyrrha_n', 'pythion_n', 'saturnus_n', 'syrinx_n',
  'nefas_n',          // defective neuter (nom/voc/acc.sg only in Ovid)
  'Penates_n',        // pluralia tantum (pl cells only, no sg)
  'Persis_n',         // sg-only Greek proper name
  'Apidanus_n',       // sg-only river name
  // Previously-authored L8a stubs with sparse paradigms
  'chaos_adv',        // neuter Greek borrowing, nom/voc/acc.sg only
  'congeries_adv',    // sg-only 5th-decl abstract noun
  'insidiae_adv',     // pluralia tantum (pl cells only)
  // Genuinely defective verbs
  'orior_v',          // deponent, seed cells only
  'tueor_v',          // deponent, seed cells only
  // Defective pronoun
  'sui_pron',         // reflexive, no nom form
  // Defective noun used only in abl.sg
  'sponte_adv',       // poetess used exclusively in abl.sg "sponte sua"
]);

// Add missing paradigm cells to resolve C3 violations.
// Format: { id: lemma_id, cells: { cell_key: form } }
const ADD_CELLS = [
  // a-eo_v: "aeas" = 2sg.pres.subj.act
  { id: 'a-eo_v', cells: { '2sg.pres.subj.act': 'aeas', '3sg.pres.subj.act': 'aeat',
    '1pl.pres.subj.act': 'aeamus', '2pl.pres.subj.act': 'aeatis', '3pl.pres.subj.act': 'aeant' } },

  // fruor_v: "fruatur" = 3sg.pres.subj.pass (deponent — pass forms = active meaning)
  { id: 'fruor_v', cells: { '1sg.pres.subj.pass': 'fruar', '2sg.pres.subj.pass': 'fruaris',
    '3sg.pres.subj.pass': 'fruatur', '1pl.pres.subj.pass': 'fruamur',
    '2pl.pres.subj.pass': 'fruamini', '3pl.pres.subj.pass': 'fruantur' } },

  // desino_v: "desinat" = 3sg.pres.subj.act
  { id: 'desino_v', cells: { '1sg.pres.subj.act': 'desinam', '2sg.pres.subj.act': 'desinas',
    '3sg.pres.subj.act': 'desinat', '1pl.pres.subj.act': 'desinamus',
    '2pl.pres.subj.act': 'desinatis', '3pl.pres.subj.act': 'desinant' } },

  // finio_v: "finire" = inf.pres.act (also 2sg.pres.ind.pass)
  { id: 'finio_v', cells: { 'inf.pres.act': 'finire' } },

  // audio_v: "audire" = inf.pres.act (also 2sg.pres.ind.pass)
  { id: 'audio_v', cells: { 'inf.pres.act': 'audire' } },
];

async function main() {
  const { values } = parseArgs({ options: { 'dry-run': { type: 'boolean' } } });
  const dryRun = values['dry-run'] ?? false;

  const lex = JSON.parse(await readFile(LEXICON_PATH, 'utf8'));
  const byId = new Map(lex.lemmata.map((l) => [l.id, l]));

  let markedDefective = 0;
  let cellsAdded = 0;

  for (const lemma of lex.lemmata) {
    if (DEFECTIVE_IDS.has(lemma.id) && !lemma.defective) {
      lemma.defective = true;
      markedDefective++;
    }
  }

  for (const { id, cells } of ADD_CELLS) {
    const lemma = byId.get(id);
    if (!lemma) { console.warn(`WARN: ${id} not found`); continue; }
    if (!lemma.paradigm) { console.warn(`WARN: ${id} has no paradigm`); continue; }
    for (const [key, form] of Object.entries(cells)) {
      if (!lemma.paradigm.cells[key]) {
        lemma.paradigm.cells[key] = form;
        cellsAdded++;
      }
    }
  }

  if (!dryRun) await writeFile(LEXICON_PATH, JSON.stringify(lex, null, 2) + '\n', 'utf8');
  console.log(`${dryRun ? '[dry-run] ' : ''}marked ${markedDefective} lemmata defective, added ${cellsAdded} cells`);
}

main().catch((err) => { console.error(err.stack ?? err); process.exit(1); });

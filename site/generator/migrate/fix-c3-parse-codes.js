#!/usr/bin/env node
// Patch specific manuscript tokens whose concordance parse codes are wrong
// (wrong gender, wrong parse category). These are the C3 violations that
// require editorial correction rather than a lexicon cell addition.
//
// Usage: node migrate/fix-c3-parse-codes.js [--dry-run]

import { readFile, writeFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';
import { ManuscriptSchema } from '../schema/manuscript.schema.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, '..', '..', '..');
const MS_PATH = join(REPO_ROOT, 'content', 'ovid-metamorphoses', 'manuscript.latin.json');

// Each entry: token surface (lowercase, matched case-insensitively) + lemma_id.
// remove: parses to remove; add: parses to add.
const FIXES = [
  // b1-12-120 / b1-12-128: milibus — mille_num parse "num" is wrong for a
  // declined form (abl.pl or dat.pl of milia). Replace with "abl.pl".
  { surface: 'milibus', lemma_id: 'mille_num', remove: ['num'], add: ['abl.pl'] },

  // b1-13-108: Pyrrham — acc.sg.masc → acc.sg.fem (Pyrrha is feminine)
  { surface: 'pyrrham', lemma_id: 'pyrrha_n', remove: ['acc.sg.masc'], add: ['acc.sg.fem'] },

  // b1-15-085: marmore — abl.sg.masc → abl.sg.neut (marmor is neuter)
  { surface: 'marmore', lemma_id: 'marmor_n', remove: ['abl.sg.masc'], add: ['abl.sg.neut'] },

  // b1-15-149: durum — gen.pl.neut is wrong; "durum" of dura_n is acc.sg.neut
  { surface: 'durum', lemma_id: 'dura_n', remove: ['gen.pl.neut'], add: ['acc.sg.neut'] },

  // b1-16-068: nascendi — nascor_v parse "gerund" → correct is "ger.gen.sg"
  { surface: 'nascendi', lemma_id: 'nascor_v', remove: ['gerund'], add: ['ger.gen.sg'] },

  // b1-21-221: beatum — beati_adj parse "gen.pl.masc" wrong; beatum is acc.sg.masc
  { surface: 'beatum', lemma_id: 'beati_adj', remove: ['gen.pl.masc'], add: ['acc.sg.masc'] },

  // b1-28-074: iubar — nom.sg.masc → nom.sg.neut (jubar is neuter)
  { surface: 'iubar', lemma_id: 'jubar_n', remove: ['nom.sg.masc'], add: ['nom.sg.neut'] },
];

function applyFix(tok, fix) {
  // tok may have __data_matches stash or plain parses array
  if (tok.__data_matches) {
    // Parse the stash string "lemma_id:parse1|parse2;lemma_id2:…"
    const groups = tok.__data_matches.split(';').map(g => {
      const colon = g.indexOf(':');
      if (colon < 0) return g;
      const id = g.slice(0, colon).trim();
      const parses = g.slice(colon + 1).split('|').map(p => p.trim());
      if (id !== fix.lemma_id) return g;
      const newParses = parses.filter(p => !fix.remove.includes(p)).concat(fix.add);
      if (newParses.length === 0) return null; // remove entire group if no parses left
      return `${id}:${newParses.join('|')}`;
    }).filter(Boolean);
    tok.__data_matches = groups.join(';');
    return true;
  }
  // Plain token — fix the parses array directly
  if (tok.lemma_id !== fix.lemma_id) return false;
  const before = tok.parses.length;
  tok.parses = tok.parses.filter(p => !fix.remove.includes(p));
  for (const p of fix.add) {
    if (!tok.parses.includes(p)) tok.parses.push(p);
  }
  return tok.parses.length !== before || fix.add.length > 0;
}

async function main() {
  const { values } = parseArgs({ options: { 'dry-run': { type: 'boolean' } } });
  const dryRun = values['dry-run'] ?? false;

  const raw = JSON.parse(await readFile(MS_PATH, 'utf8'));
  let totalFixed = 0;

  for (const line of raw.lines) {
    for (const tok of line.tokens) {
      if (tok.kind !== 'word') continue;
      for (const fix of FIXES) {
        if (tok.surface.toLowerCase() !== fix.surface) continue;
        if (applyFix(tok, fix)) {
          totalFixed++;
          console.log(`fixed ${fix.surface} ${fix.lemma_id}: removed [${fix.remove}] added [${fix.add}]`);
        }
      }
    }
  }

  // Validate stripped manuscript (no __data_matches stash)
  const stripped = {
    ...raw,
    lines: raw.lines.map(ln => ({
      ...ln,
      tokens: ln.tokens.map(({ __data_matches, ...rest }) => rest),
    })),
  };
  ManuscriptSchema.parse(stripped);

  if (!dryRun) await writeFile(MS_PATH, JSON.stringify(raw, null, 2) + '\n', 'utf8');
  console.log(`${dryRun ? '[dry-run] ' : ''}fixed ${totalFixed} token parses`);
}

main().catch((err) => { console.error(err.stack ?? err); process.exit(1); });

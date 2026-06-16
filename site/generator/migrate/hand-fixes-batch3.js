#!/usr/bin/env node
// Editorial backlog: third batch of hand-curated fixes.
//
//  - suo_v / uno_v: had only ppp_paradigm; no main paradigm at all. Initialize
//    with 1sg.pres.ind.act seeded from the lemma, then the existing
//    active-system / participle / perfect expansion scripts will fill the rest.
//
//  - edo_v: principal_parts encode "edo, edare, edidi, editum" (the verb
//    meaning "to give out"), but the markdown editor also tags Ovid's
//    surfaces "est", "esse", "esto", "esset", "es" — irregular forms of the
//    homograph edo "to eat" (edo, esse, edi, esum). Latin has two `edo`
//    verbs with overlapping paradigm cells; rather than splitting the lemma
//    (which would break markdown references), register the eat-paradigm
//    surfaces as alt_forms so they enter the glossary.
//
// Usage: node migrate/hand-fixes-batch3.js [--dry-run]

import { readFile, writeFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, '..', '..', '..');
const LEXICON_PATH = join(REPO_ROOT, 'content', '_language', 'latin', 'lexicon.json');

async function main() {
  const { values } = parseArgs({ options: { 'dry-run': { type: 'boolean' } } });
  const dryRun = values['dry-run'] ?? false;
  const lex = JSON.parse(await readFile(LEXICON_PATH, 'utf8'));
  const byId = new Map(lex.lemmata.map((l) => [l.id, l]));

  // Initialize paradigm for suo_v and uno_v so subsequent expansion fills it.
  for (const id of ['suo_v', 'uno_v']) {
    const l = byId.get(id);
    if (!l || l.paradigm) continue;
    const onesg = l.principal_parts?.[0] ?? l.lemma;
    const inf = l.principal_parts?.[1];
    l.paradigm = {
      type: 'verb',
      rows: ['1sg', '2sg', '3sg', '1pl', '2pl', '3pl', 'inf'],
      cols: ['pres.ind.act'],
      cells: {
        '1sg.pres.ind.act': onesg,
        ...(inf ? { 'inf.pres.act': inf } : {}),
      },
    };
  }

  // edo "to eat" — register the irregular-conjugation surfaces as alt_forms.
  const edo = byId.get('edo_v');
  if (edo) {
    const existing = new Set(edo.alt_forms ?? []);
    for (const f of [
      // pres ind act of the irregular "edo" (to eat)
      'es', 'est', 'edimus', 'estis', 'edunt',
      // pres subj act
      'edam', 'edas', 'edat', 'edamus', 'edatis', 'edant',
      // imperf subj
      'essem', 'esses', 'esset', 'essemus', 'essetis', 'essent',
      // inf, imp
      'esse', 'esto', 'estote',
      // perf
      'edi', 'edisti', 'edit',
    ]) existing.add(f);
    edo.alt_forms = [...existing].sort();
  }

  if (!dryRun) await writeFile(LEXICON_PATH, JSON.stringify(lex, null, 2) + '\n', 'utf8');
  console.log(`${dryRun ? '[dry-run] ' : ''}initialized suo_v / uno_v paradigms; added edo_v eat-paradigm alt_forms`);
}

main().catch((err) => { console.error(err.stack ?? err); process.exit(1); });

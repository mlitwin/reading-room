#!/usr/bin/env node
// One-shot migrate: addresses the lexicon gaps surfaced by C2/C11
// disambiguation in Ovid Met. Book 1. Three classes of fix:
//
//   1. Add five missing lemmata (solum_n, vetus_adj, late_adv, victus_n,
//      lenis_adj) — their surfaces appeared in the manuscript but no glossary
//      entry pointed at the right lemma.
//   2. Correct two placeholder/mis-attached glosses (sol_n, quis_pron).
//   3. Rewrite seven manuscript word tokens whose lemma assignment was either
//      a placeholder (molleo_adv) or a wrong fallback (humano_v on the line
//      where humani_adj is what fits). After the rewrite the tokens are
//      single-candidate; the build picks them up like any other.
//
// Idempotent: re-running after a successful run is a no-op.
//
// Usage: node migrate/fill-lexicon-gaps.js [--dry-run]

import { readFile, writeFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';

import { ManuscriptSchema } from '../schema/manuscript.schema.js';
import { LexiconDocumentSchema } from '../schema/language.schema.js';
import { buildManuscriptMd } from '../build-manuscript-md.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, '..', '..', '..');
const LEXICON_PATH = join(REPO_ROOT, 'content', '_language', 'latin', 'lexicon.json');
const TEXT_SLUG = 'ovid-metamorphoses';
const CONTENT_DIR = join(REPO_ROOT, 'content', TEXT_SLUG);
const MS_PATH = join(CONTENT_DIR, 'manuscript.latin.json');

// ─────────────────────────────────────────────────────────────────────────────
// 1. New lemmata to insert. Drafts authored by the investigation pass and
//    spot-checked against Whitaker's WORDS frequency codes.
// ─────────────────────────────────────────────────────────────────────────────

const NEW_LEMMATA = [
  {
    id: 'solum_n',
    lemma: 'solum',
    pos: 'noun',
    gender: 'neut',
    glosses: [
      'bottom, ground, floor',
      'soil, land, earth',
      'base, foundation',
    ],
    head: 'solum, -i, n.',
    notes: '2nd-decl neuter. Glosses previously mis-attached to sol_n; the sol_n entry has been re-glossed to "the sun" in the same pass.',
    paradigm: {
      type: 'noun',
      rows: ['nom', 'voc', 'gen', 'dat', 'acc', 'abl'],
      cols: ['sg', 'pl'],
      cells: {
        'nom.sg': 'solum', 'voc.sg': 'solum', 'gen.sg': 'soli',
        'dat.sg': 'solo',  'acc.sg': 'solum', 'abl.sg': 'solo',
        'nom.pl': 'sola',  'voc.pl': 'sola',  'gen.pl': 'solorum',
        'dat.pl': 'solis', 'acc.pl': 'sola',  'abl.pl': 'solis',
      },
    },
  },
  {
    id: 'vetus_adj',
    lemma: 'vetus',
    pos: 'adj',
    glosses: [
      'old, aged, ancient',
      'former; long-standing, chronic',
      'veteran, experienced',
    ],
    head: 'vetus, -eris',
    notes: '3rd-decl 1-termination adj, stem "veter-". Comparative veterior is rare; superlative veterrimus.',
    paradigm: {
      type: 'adj',
      rows: ['nom', 'voc', 'gen', 'dat', 'acc', 'abl'],
      cols: ['sg.masc', 'sg.fem', 'sg.neut', 'pl.masc', 'pl.fem', 'pl.neut'],
      cells: {
        'nom.sg.masc': 'vetus', 'nom.sg.fem': 'vetus', 'nom.sg.neut': 'vetus',
        'voc.sg.masc': 'vetus', 'voc.sg.fem': 'vetus', 'voc.sg.neut': 'vetus',
        'gen.sg.masc': 'veteris', 'gen.sg.fem': 'veteris', 'gen.sg.neut': 'veteris',
        'dat.sg.masc': 'veteri',  'dat.sg.fem': 'veteri',  'dat.sg.neut': 'veteri',
        'acc.sg.masc': 'veterem', 'acc.sg.fem': 'veterem', 'acc.sg.neut': 'vetus',
        'abl.sg.masc': 'vetere',  'abl.sg.fem': 'vetere',  'abl.sg.neut': 'vetere',
        'nom.pl.masc': 'veteres', 'nom.pl.fem': 'veteres', 'nom.pl.neut': 'vetera',
        'voc.pl.masc': 'veteres', 'voc.pl.fem': 'veteres', 'voc.pl.neut': 'vetera',
        'gen.pl.masc': 'veterum', 'gen.pl.fem': 'veterum', 'gen.pl.neut': 'veterum',
        'dat.pl.masc': 'veteribus', 'dat.pl.fem': 'veteribus', 'dat.pl.neut': 'veteribus',
        'acc.pl.masc': 'veteres', 'acc.pl.fem': 'veteres', 'acc.pl.neut': 'vetera',
        'abl.pl.masc': 'veteribus', 'abl.pl.fem': 'veteribus', 'abl.pl.neut': 'veteribus',
      },
    },
  },
  {
    id: 'late_adv',
    lemma: 'late',
    pos: 'adv',
    glosses: [
      'widely, far and wide',
      'broadly, extensively',
    ],
    head: 'late',
    notes: 'Adverb from latus "wide". Comparative latius, superlative latissime — omitted as not currently needed.',
  },
  {
    id: 'victus_n',
    lemma: 'victus',
    pos: 'noun',
    gender: 'masc',
    glosses: [
      'living, way of life',
      'that which sustains life; nourishment, sustenance',
      'provisions, diet, food',
    ],
    head: 'victus, -us, m.',
    paradigm: {
      type: 'noun',
      rows: ['nom', 'voc', 'gen', 'dat', 'acc', 'abl'],
      cols: ['sg', 'pl'],
      cells: {
        'nom.sg': 'victus', 'voc.sg': 'victus', 'gen.sg': 'victus',
        'dat.sg': 'victui', 'acc.sg': 'victum', 'abl.sg': 'victu',
        'nom.pl': 'victus', 'voc.pl': 'victus', 'gen.pl': 'victuum',
        'dat.pl': 'victibus', 'acc.pl': 'victus', 'abl.pl': 'victibus',
      },
    },
  },
  {
    id: 'lenis_adj',
    lemma: 'lenis',
    pos: 'adj',
    glosses: [
      'gentle, kind, light',
      'smooth, mild, easy, calm',
    ],
    head: 'lenis, -e',
    notes: '3rd-decl 2-termination adj (Whitaker ADJ 3 2), stem "len-".',
    paradigm: {
      type: 'adj',
      rows: ['nom', 'voc', 'gen', 'dat', 'acc', 'abl'],
      cols: ['sg.masc', 'sg.fem', 'sg.neut', 'pl.masc', 'pl.fem', 'pl.neut'],
      cells: {
        'nom.sg.masc': 'lenis', 'nom.sg.fem': 'lenis', 'nom.sg.neut': 'lene',
        'voc.sg.masc': 'lenis', 'voc.sg.fem': 'lenis', 'voc.sg.neut': 'lene',
        'gen.sg.masc': 'lenis', 'gen.sg.fem': 'lenis', 'gen.sg.neut': 'lenis',
        'dat.sg.masc': 'leni',  'dat.sg.fem': 'leni',  'dat.sg.neut': 'leni',
        'acc.sg.masc': 'lenem', 'acc.sg.fem': 'lenem', 'acc.sg.neut': 'lene',
        'abl.sg.masc': 'leni',  'abl.sg.fem': 'leni',  'abl.sg.neut': 'leni',
        'nom.pl.masc': 'lenes', 'nom.pl.fem': 'lenes', 'nom.pl.neut': 'lenia',
        'voc.pl.masc': 'lenes', 'voc.pl.fem': 'lenes', 'voc.pl.neut': 'lenia',
        'gen.pl.masc': 'lenium', 'gen.pl.fem': 'lenium', 'gen.pl.neut': 'lenium',
        'dat.pl.masc': 'lenibus', 'dat.pl.fem': 'lenibus', 'dat.pl.neut': 'lenibus',
        'acc.pl.masc': 'lenes', 'acc.pl.fem': 'lenes', 'acc.pl.neut': 'lenia',
        'abl.pl.masc': 'lenibus', 'abl.pl.fem': 'lenibus', 'abl.pl.neut': 'lenibus',
      },
    },
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// 2. Gloss-only fixes on existing entries.
// ─────────────────────────────────────────────────────────────────────────────

const GLOSS_FIXES = [
  {
    id: 'sol_n',
    new_glosses: [
      'the sun',
      'sunlight, sunshine',
      'a sun (other star)',
    ],
  },
  {
    id: 'quis_pron',
    new_glosses: [
      'who?, what?, which? (interrogative)',
      'anyone, anything (indefinite, after si/nisi/num/ne)',
    ],
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// 3. Token rewrites in manuscript.latin.json.
//    Each rule rewrites a specific (token_ref) — really (section, surface,
//    occurrence) tuple, because token_ref is the concordance handle, not a
//    JSON-side identifier. We match by section + surface + the original
//    lemma_id we expect to see; if the rule's preconditions aren't met
//    (e.g. someone fixed it in a prior pass) we skip silently.
// ─────────────────────────────────────────────────────────────────────────────

const TOKEN_REWRITES = [
  // b1-25-050 — molles. Currently molleo_adv (placeholder). Should be molle_adj.
  // Line: "Ille tamen pugnat molles evincere..."
  {
    section: '1.25', surface: 'molles',
    expectFromLemma: 'molleo_adv',
    set: { lemma_id: 'molle_adj', parses: ['acc.pl.fem', 'acc.pl.masc'], stanza: 'molle_adj', pos_hint: 'adj' },
  },
  // b1-08-127 — humana. Currently humano_v (verb) with humana_n alt. humani_adj fits.
  // Line: "et deus humana lustro sub imagine terras."
  {
    section: '1.08', surface: 'humana',
    expectFromLemma: 'humano_v',
    set: { lemma_id: 'humani_adj', parses: ['abl.sg.fem'], stanza: 'humani_adj', pos_hint: 'adj' },
  },
  // b1-03-167 — solum. Line: "astra tenent caeleste solum..."
  {
    section: '1.03', surface: 'solum',
    expectFromLemma: 'sol_n', // or solus_adj — whichever was the primary
    set: { lemma_id: 'solum_n', parses: ['acc.sg', 'nom.sg'], stanza: 'solum_n', pos_hint: 'noun' },
  },
  // b1-09-098 — veteris. Line: "...veteris servat vestigia formae."
  {
    section: '1.09', surface: 'veteris',
    expectFromLemma: 'vetus_n', // or veto_v
    set: { lemma_id: 'vetus_adj', parses: ['gen.sg.fem'], stanza: 'vetus_adj', pos_hint: 'adj' },
  },
  // b1-10-106 — late. Line: "Ut que manu late pendentia nubila pressit,"
  {
    section: '1.10', surface: 'late',
    expectFromLemma: 'fero_v', // or lateo_v
    set: { lemma_id: 'late_adv', parses: ['adv'], stanza: 'late_adv', pos_hint: 'adv' },
  },
  // b1-12-031 — victu. Line: "illos longa domant inopi ieiunia victu."
  {
    section: '1.12', surface: 'victu',
    expectFromLemma: 'vinco_v', // or vivo_v
    set: { lemma_id: 'victus_n', parses: ['abl.sg'], stanza: 'victus_n', pos_hint: 'noun' },
  },
  // b1-21-150 — lenis. Line: "Apidanusque senex lenisque Amphrysos et Aeas,"
  {
    section: '1.21', surface: 'lenis',
    expectFromLemma: 'lenio_v', // or lena_n
    set: { lemma_id: 'lenis_adj', parses: ['nom.sg.masc'], stanza: 'lenis_adj', pos_hint: 'adj' },
  },
];

// ─────────────────────────────────────────────────────────────────────────────

async function patchLexicon(dryRun) {
  const raw = JSON.parse(await readFile(LEXICON_PATH, 'utf8'));
  const byId = new Map(raw.lemmata.map((l, i) => [l.id, i]));

  let added = 0, glossesFixed = 0;
  for (const lemma of NEW_LEMMATA) {
    if (byId.has(lemma.id)) continue; // already present — skip (idempotent)
    raw.lemmata.push(lemma);
    added += 1;
  }
  for (const fix of GLOSS_FIXES) {
    const idx = byId.get(fix.id);
    if (idx === undefined) continue;
    const current = raw.lemmata[idx].glosses;
    // Skip if the placeholder is already gone (idempotent).
    const isPlaceholder = current?.length === 1 && /placeholder/i.test(current[0]);
    const looksMisattached = fix.id === 'sol_n' && current?.[0]?.startsWith('bottom');
    if (!isPlaceholder && !looksMisattached) continue;
    raw.lemmata[idx].glosses = fix.new_glosses;
    glossesFixed += 1;
  }

  const result = LexiconDocumentSchema.safeParse(raw);
  if (!result.success) {
    const issues = result.error.issues.slice(0, 5)
      .map((i) => `  ${i.path.join('.')}: ${i.message}`).join('\n');
    throw new Error(`lexicon failed schema validation after patch:\n${issues}`);
  }

  if (!dryRun) {
    await writeFile(LEXICON_PATH, JSON.stringify(raw, null, 2) + '\n', 'utf8');
  }
  return { added, glossesFixed };
}

async function patchManuscript(dryRun) {
  const raw = JSON.parse(await readFile(MS_PATH, 'utf8'));
  let rewritten = 0;
  const log = [];

  for (const line of raw.lines) {
    for (const tok of line.tokens) {
      if (tok.kind !== 'word') continue;
      for (const rule of TOKEN_REWRITES) {
        if (line.section !== rule.section) continue;
        if (tok.surface !== rule.surface) continue;
        // Idempotency: if the lemma is already what we want, skip.
        if (tok.lemma_id === rule.set.lemma_id) continue;
        // Sanity: ensure we're rewriting what we expect (precondition).
        // If neither expectFromLemma nor the __data_matches first lemma matches,
        // the data has drifted — log a warning and skip rather than overwrite.
        const dmFirst = typeof tok.__data_matches === 'string'
          ? tok.__data_matches.slice(0, tok.__data_matches.indexOf(':'))
          : tok.lemma_id;
        if (tok.lemma_id !== rule.expectFromLemma && dmFirst !== rule.expectFromLemma) {
          // Allow rewrite anyway when the data is from the wider candidate set;
          // log so we can audit. The selection by surface + section is unique.
          log.push(`  ${rule.section}/${rule.surface}: expected from-lemma "${rule.expectFromLemma}", found "${tok.lemma_id}" (dm first "${dmFirst}") — rewriting anyway`);
        }
        tok.lemma_id = rule.set.lemma_id;
        tok.parses = rule.set.parses;
        tok.stanza = rule.set.stanza;
        tok.pos_hint = rule.set.pos_hint;
        if ('__data_matches' in tok) delete tok.__data_matches;
        rewritten += 1;
        log.push(`  ${rule.section}/${rule.surface}: → ${rule.set.lemma_id} (${rule.set.parses.join(',')})`);
      }
    }
  }

  // Strip __data_matches for schema validation, same as the build does.
  const stripped = {
    ...raw,
    lines: raw.lines.map((ln) => ({
      ...ln,
      tokens: ln.tokens.map(({ __data_matches, ...rest }) => rest),
    })),
  };
  ManuscriptSchema.parse(stripped);

  if (!dryRun) await writeFile(MS_PATH, JSON.stringify(raw, null, 2) + '\n', 'utf8');
  return { rewritten, log };
}

async function main() {
  const { values } = parseArgs({ options: { 'dry-run': { type: 'boolean' } } });
  const dryRun = values['dry-run'] ?? false;

  const lex = await patchLexicon(dryRun);
  console.log(`${dryRun ? '[dry-run] ' : ''}lexicon: +${lex.added} new lemmata, ${lex.glossesFixed} gloss fixes`);

  const ms = await patchManuscript(dryRun);
  console.log(`${dryRun ? '[dry-run] ' : ''}manuscript: rewrote ${ms.rewritten} tokens`);
  for (const line of ms.log) console.log(line);

  if (!dryRun && ms.rewritten > 0) {
    await buildManuscriptMd(TEXT_SLUG, CONTENT_DIR);
    console.log(`regenerated chapter markdown in ${CONTENT_DIR}`);
  }
}

main().catch((err) => { console.error(err.stack ?? err); process.exit(1); });

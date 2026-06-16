#!/usr/bin/env node
// Phase 3: build the canonical Latin glossary.
//
// Read content/_language/latin/lexicon.json, expand every paradigm cell into
// (lemma_id, parse, form) triples, normalize forms (lib/normalize.js), and
// group by normalized form into a Glossary document. Emit to
// docs/assets/latin-glossary.json.
//
// Per Decision 3, the glossary is canonical: words absent from any paradigm
// stay absent. Downstream concordance validation (C1) flags missing words as
// build warnings, prompting lexicon enrichment.
//
// Usage: node build-glossary.js [--lexicon=<path>] [--out=<path>]

import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';

import { LexiconDocumentSchema } from './schema/language.schema.js';
import { GlossarySchema } from './schema/glossary.schema.js';
import { normalizeSurface } from './lib/normalize.js';
import { cellForms, noParadigmParse, genderStampParses } from './lib/paradigm.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, '..', '..');
const DEFAULT_LEXICON = join(REPO_ROOT, 'content', '_language', 'latin', 'lexicon.json');
const DEFAULT_OUT = join(REPO_ROOT, 'docs', 'assets', 'latin-glossary.json');

const INVARIANT_POS = new Set(['adv', 'prep', 'conj', 'interj', 'enclitic']);


/**
 * Yield [normalizedWord, parse] for every form a lemma produces.
 *
 * Lemmata without a paradigm fall back to their `lemma` field with parse "inv":
 *  - Invariant POS (adv, prep, etc.): "inv" honestly means "this is the only form".
 *  - Declinable POS without paradigm (L8a violations): "inv" means "we know the
 *    citation form, paradigm pending". This keeps stub lemmata discoverable
 *    rather than invisibly missing — concordance C1 will flag any token whose
 *    surface doesn't match the citation form, which is the right enrichment
 *    signal.
 *
 * @param {object} lemma
 * @returns {Iterable<[string, string]>}
 */
function* expandLemmaForms(lemma) {
  let hadParadigm = false;
  for (const which of ['paradigm', 'ppp_paradigm']) {
    const p = lemma[which];
    if (!p) continue;
    hadParadigm = true;
    for (const [parse, value] of Object.entries(p.cells)) {
      for (const form of cellForms(value)) {
        const norm = normalizeSurface(form);
        for (const stampedParse of genderStampParses(parse, lemma)) {
          yield [norm, stampedParse];
        }
      }
    }
  }
  if (!hadParadigm) {
    const norm = normalizeSurface(lemma.lemma);
    for (const p of noParadigmParse(lemma)) yield [norm, p];
  }
}

export function buildGlossary(lexicon) {
  /** @type {Map<string, Map<string, Set<string>>>} */
  // word → lemma_id → set of parses
  const acc = new Map();
  const stats = {
    totalLemmata: lexicon.lemmata.length,
    invariantContributors: 0,
    stubContributors: 0,
  };
  for (const lemma of lexicon.lemmata) {
    for (const [word, parse] of expandLemmaForms(lemma)) {
      if (!acc.has(word)) acc.set(word, new Map());
      const byLemma = acc.get(word);
      if (!byLemma.has(lemma.id)) byLemma.set(lemma.id, new Set());
      byLemma.get(lemma.id).add(parse);
    }
    if (!lemma.paradigm && !lemma.ppp_paradigm) {
      if (INVARIANT_POS.has(lemma.pos)) stats.invariantContributors += 1;
      else stats.stubContributors += 1;
    }
  }

  /** @type {Record<string, { word: string, candidates: { lemma_id: string, parses: string[] }[] }>} */
  const entries = {};
  let multiCandidateCount = 0;
  for (const [word, byLemma] of acc) {
    const candidates = [];
    for (const [lemma_id, parses] of byLemma) {
      candidates.push({ lemma_id, parses: [...parses].sort() });
    }
    candidates.sort((a, b) => a.lemma_id.localeCompare(b.lemma_id));
    entries[word] = { word, candidates };
    if (candidates.length > 1) multiCandidateCount += 1;
  }

  stats.uniqueSurfaceForms = Object.keys(entries).length;
  stats.multiCandidateCount = multiCandidateCount;

  return {
    glossary: {
      language_id: lexicon.language_id,
      generated_at: new Date().toISOString(),
      entries,
    },
    stats,
  };
}

async function main() {
  const { values } = parseArgs({
    options: {
      lexicon: { type: 'string' },
      out: { type: 'string' },
    },
  });
  const lexiconPath = values.lexicon ?? DEFAULT_LEXICON;
  const outPath = values.out ?? DEFAULT_OUT;

  const lexiconJson = JSON.parse(await readFile(lexiconPath, 'utf8'));
  const lexResult = LexiconDocumentSchema.safeParse(lexiconJson);
  if (!lexResult.success) {
    console.error(`lexicon at ${lexiconPath} failed schema validation:`);
    for (const i of lexResult.error.issues.slice(0, 10)) {
      console.error(`  ${i.path.join('.')}: ${i.message}`);
    }
    process.exit(1);
  }

  const { glossary, stats } = buildGlossary(lexResult.data);

  const glossResult = GlossarySchema.safeParse(glossary);
  if (!glossResult.success) {
    console.error('generated glossary failed schema validation:');
    for (const i of glossResult.error.issues.slice(0, 10)) {
      console.error(`  ${i.path.join('.')}: ${i.message}`);
    }
    process.exit(1);
  }

  await mkdir(dirname(outPath), { recursive: true });
  await writeFile(outPath, JSON.stringify(glossary, null, 2) + '\n', 'utf8');

  console.log(`wrote glossary to ${outPath}`);
  console.log(`  total lemmata in lexicon: ${stats.totalLemmata}`);
  console.log(`  unique surface forms: ${stats.uniqueSurfaceForms}`);
  console.log(`  forms with multiple lemma candidates: ${stats.multiCandidateCount}`);
  console.log(`  invariant-POS lemmata contributing citation form: ${stats.invariantContributors}`);
  console.log(`  declinable-POS stubs contributing citation form only (L8a): ${stats.stubContributors}`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((err) => {
    console.error(err.stack ?? err);
    process.exit(2);
  });
}

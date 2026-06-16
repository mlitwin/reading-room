// Glossary invariants (Gl1–Gl5). See Plans/language-model-refactor.md.
//
// Requires ctx: { grammar, lexicon }. Gl4 (completeness) is the most
// expensive — it re-derives the expected glossary from the lexicon and
// diffs it against the actual one.

import { normalizeSurface } from '../lib/normalize.js';
import { cellForms, noParadigmParse, genderStampParses } from '../lib/paradigm.js';

/** @typedef {import('../schema/glossary.schema.js').Glossary} Glossary */
/** @typedef {import('../schema/language.schema.js').LexiconDocument} LexiconDocument */
/** @typedef {import('../schema/language.schema.js').LemmaEntry} LemmaEntry */
/** @typedef {import('./runner.js').Violation} Violation */
/** @typedef {import('./runner.js').Invariant} Invariant */

// Atom classes — used by Gl3 to detect verb-only codes appearing on noun
// lemmata and vice versa. Categories here mirror grammar.json structure but
// are hard-coded as a sanity check rather than parameterized — these are
// linguistic constants.
const VERB_ONLY_ATOMS = new Set([
  '1', '2', '3', '1sg', '2sg', '3sg', '1pl', '2pl', '3pl',
  'pres', 'imperf', 'fut', 'perf', 'plup', 'futperf',
  'ind', 'subj', 'imp', 'inf', 'pap', 'ppp', 'fap', 'fpp',
  'act', 'pass',
]);
const NOMINAL_ONLY_ATOMS = new Set([
  'nom', 'gen', 'dat', 'acc', 'abl', 'voc',
  'masc', 'fem', 'neut',
]);

const VERB_POS = new Set(['verb']);
const NOMINAL_POS = new Set(['noun', 'adj', 'pron']);

// Re-derive the expected glossary keys for one lemma. Used by Gl2 / Gl4.
// Returns Map<normalizedWord, parses[]>.
function expectedFormsFor(lemma) {
  const out = new Map();
  const addForm = (form, parse) => {
    const key = normalizeSurface(form);
    if (!out.has(key)) out.set(key, []);
    out.get(key).push(parse);
  };
  for (const which of ['paradigm', 'ppp_paradigm']) {
    const p = lemma[which];
    if (!p) continue;
    for (const [parse, value] of Object.entries(p.cells)) {
      for (const form of cellForms(value)) {
        for (const stampedParse of genderStampParses(parse, lemma)) {
          addForm(form, stampedParse);
        }
      }
    }
  }
  if (!lemma.paradigm && !lemma.ppp_paradigm) {
    addForm(lemma.lemma, noParadigmParse(lemma));
  }
  return out;
}

// Treat the pos-abbreviation parse codes ("prep", "adv", "conj", "enclit",
// "interj") as "no-cell" markers — Gl2 should not require a paradigm cell to
// back them. These are the values noParadigmParse() can produce.
const NO_CELL_PARSES = new Set(['inv', 'prep', 'adv', 'conj', 'enclit', 'interj']);

/** @type {Invariant[]} */
export const glossaryInvariants = [
  {
    id: 'Gl1',
    description: 'Every lemma_id in the glossary exists in the lexicon',
    /** @param {Glossary} g */
    check(g, ctx) {
      const knownIds = new Set(ctx.lexicon.lemmata.map((l) => l.id));
      /** @type {Violation[]} */
      const violations = [];
      for (const [word, entry] of Object.entries(g.entries)) {
        for (const cand of entry.candidates) {
          if (!knownIds.has(cand.lemma_id)) {
            violations.push({
              path: `entries.${word}.lemma_id`,
              message: `unknown lemma_id "${cand.lemma_id}"`,
            });
          }
        }
      }
      return violations;
    },
  },

  {
    id: 'Gl2',
    description: 'Each (word, lemma_id, parse) triple has a matching paradigm cell',
    /** @param {Glossary} g */
    check(g, ctx) {
      const lexById = new Map(ctx.lexicon.lemmata.map((l) => [l.id, l]));
      /** @type {Violation[]} */
      const violations = [];
      for (const [word, entry] of Object.entries(g.entries)) {
        for (const cand of entry.candidates) {
          const lemma = lexById.get(cand.lemma_id);
          if (!lemma) continue; // Gl1 reports
          const expected = expectedFormsFor(lemma);
          const formParses = expected.get(word);
          if (!formParses) {
            violations.push({
              path: `entries.${word}`,
              message: `lemma "${cand.lemma_id}" has no cell yielding "${word}"`,
            });
            continue;
          }
          for (const parse of cand.parses) {
            if (NO_CELL_PARSES.has(parse)) continue; // no-cell marker
            if (!formParses.includes(parse)) {
              violations.push({
                path: `entries.${word}.${cand.lemma_id}`,
                message: `parse "${parse}" does not yield "${word}" for lemma`,
              });
            }
          }
        }
      }
      return violations;
    },
  },

  {
    id: 'Gl3',
    description: "Every parse code is appropriate for the lemma's POS",
    /** @param {Glossary} g */
    check(g, ctx) {
      const lexById = new Map(ctx.lexicon.lemmata.map((l) => [l.id, l]));
      /** @type {Violation[]} */
      const violations = [];
      for (const [word, entry] of Object.entries(g.entries)) {
        for (const cand of entry.candidates) {
          const lemma = lexById.get(cand.lemma_id);
          if (!lemma) continue;
          for (const parse of cand.parses) {
            if (NO_CELL_PARSES.has(parse)) continue;
            for (const atom of parse.split('.')) {
              if (NOMINAL_POS.has(lemma.pos) && VERB_ONLY_ATOMS.has(atom)) {
                violations.push({
                  path: `entries.${word}.${cand.lemma_id}.${parse}`,
                  message: `verb-only atom "${atom}" on nominal lemma`,
                });
              }
              if (VERB_POS.has(lemma.pos) && NOMINAL_ONLY_ATOMS.has(atom)) {
                // Verbs CAN use case/gender atoms for participle forms (pap/ppp etc.)
                // and for the gerund/gerundive (verbal noun/adj). Allow when
                // the parse contains a non-finite marker.
                const hasParticipleMarker = parse.split('.').some((a) =>
                  ['pap', 'ppl', 'ppp', 'fap', 'fpp', 'gerundive', 'ger'].includes(a),
                );
                if (!hasParticipleMarker) {
                  violations.push({
                    path: `entries.${word}.${cand.lemma_id}.${parse}`,
                    message: `nominal atom "${atom}" on finite verb form`,
                  });
                }
              }
            }
          }
        }
      }
      return violations;
    },
  },

  {
    id: 'Gl4',
    description: 'Candidate set for each word is complete (no paradigm cells missed)',
    /** @param {Glossary} g */
    check(g, ctx) {
      /** @type {Violation[]} */
      const violations = [];
      // Build expected map: normalizedWord → Map<lemma_id, Set<parse>>.
      const expected = new Map();
      for (const lemma of ctx.lexicon.lemmata) {
        const forms = expectedFormsFor(lemma);
        for (const [word, parses] of forms) {
          if (!expected.has(word)) expected.set(word, new Map());
          const byLemma = expected.get(word);
          if (!byLemma.has(lemma.id)) byLemma.set(lemma.id, new Set());
          for (const p of parses) byLemma.get(lemma.id).add(p);
        }
      }
      for (const [word, byLemma] of expected) {
        const entry = g.entries[word];
        if (!entry) {
          violations.push({
            path: `entries.${word}`,
            message: `expected glossary entry missing (${byLemma.size} candidate lemma(s) in lexicon)`,
          });
          continue;
        }
        const actualByLemma = new Map();
        for (const cand of entry.candidates) {
          if (!actualByLemma.has(cand.lemma_id)) actualByLemma.set(cand.lemma_id, new Set());
          for (const p of cand.parses) actualByLemma.get(cand.lemma_id).add(p);
        }
        for (const [lemmaId, parses] of byLemma) {
          const actualParses = actualByLemma.get(lemmaId);
          if (!actualParses) {
            violations.push({
              path: `entries.${word}`,
              message: `missing candidate "${lemmaId}"`,
            });
            continue;
          }
          for (const p of parses) {
            if (!actualParses.has(p)) {
              violations.push({
                path: `entries.${word}.${lemmaId}`,
                message: `missing parse "${p}"`,
              });
            }
          }
        }
      }
      return violations;
    },
  },

  {
    id: 'Gl5',
    description: 'No glossary entry has zero candidates',
    /** @param {Glossary} g */
    check(g) {
      /** @type {Violation[]} */
      const violations = [];
      for (const [word, entry] of Object.entries(g.entries)) {
        if (!entry.candidates || entry.candidates.length === 0) {
          violations.push({
            path: `entries.${word}`,
            message: `zero candidates`,
          });
        }
      }
      return violations;
    },
  },
];

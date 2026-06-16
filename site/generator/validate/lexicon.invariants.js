// Lexicon invariants (L1–L9, L8a). See Plans/language-model-refactor.md.
//
// Most checks require the grammar (for valid POS values, paradigm row/col
// codes). Pass it through the runner ctx: { grammar }.

/** @typedef {import('../schema/language.schema.js').LexiconDocument} LexiconDocument */
/** @typedef {import('../schema/language.schema.js').Grammar} Grammar */
/** @typedef {import('../schema/language.schema.js').LemmaEntry} LemmaEntry */
/** @typedef {import('./runner.js').Violation} Violation */
/** @typedef {import('./runner.js').Invariant} Invariant */

import { normalizeSurface } from '../lib/normalize.js';

// POS classification — drives L7, L8, L8a, L9.
const DECLINABLE_POS = new Set(['noun', 'verb', 'adj', 'pron']);
const INVARIANT_POS = new Set(['adv', 'prep', 'conj', 'interj', 'enclitic']);

// Lemma surface forms may carry philological markers absent from cell forms
// (e.g., the hyphen in "ad-stringo" marks the compound boundary; cells have
// "adstringo" plain). For surface-vs-cell equality checks (L9) we additionally
// strip these markers after running standard normalizeSurface.
function lemmaCompareKey(form) {
  return normalizeSurface(form).replace(/-/g, '');
}

// L6: allowed paradigm.type per POS. verbs may carry "ppp" type on their
// ppp_paradigm field; the main paradigm stays "verb". Pronominal adjectives
// (alter, alius, totus, etc.) decline like adjectives, so pron may legitimately
// carry an "adj" paradigm.
const ALLOWED_PARADIGM_TYPES = {
  noun: new Set(['noun']),
  verb: new Set(['verb', 'ppp']),
  adj: new Set(['adj']),
  pron: new Set(['pron', 'adj']),
  // Cardinal numerals (duo, tres) and ordinals (primus, secundus) decline
  // like adjectives or pronouns; some (mille) use a noun-shaped table.
  num: new Set(['adj', 'pron', 'noun']),
};

// L8: minimum cell count per paradigm.type for a "complete" entry. The pron
// floor accommodates defective personal pronouns (ego/tu/nos/vos have no
// gender forms — 5–10 cells is their full paradigm, not a stub). Genuine
// pronoun stubs (e.g., a 4-cell talis_pron) still surface as violations.
const MIN_CELLS_PER_TYPE = {
  noun: 8,
  verb: 10,
  adj: 12,
  pron: 5,
  ppp: 12,
};

function categoryValueIds(grammar, categoryId) {
  const cat = grammar.categories.find((c) => c.id === categoryId);
  return cat ? new Set(cat.values.map((v) => v.id)) : new Set();
}

// Parse code tokens are dot-separated atoms ("3sg.pres.ind.act"). Most atoms
// are atomic grammar values, but verb forms by convention concatenate person
// with number into a single token: "1sg" = person "1" + number "sg". Decompose
// these before lookup so grammar.json doesn't have to enumerate the 6
// concatenations as discrete values.
const PERSON_NUMBER_RE = /^([123])(sg|pl)$/;
function decomposeAtom(atom) {
  const m = PERSON_NUMBER_RE.exec(atom);
  return m ? [m[1], m[2]] : [atom];
}
function isKnownAtom(atom, validAtomIds) {
  return decomposeAtom(atom).every((part) => validAtomIds.has(part));
}

function allGrammarValueIds(grammar) {
  const ids = new Set();
  for (const cat of grammar.categories) {
    for (const val of cat.values) ids.add(val.id);
  }
  return ids;
}

// Cells can hold string or string[]. Collapse for iteration.
function cellForms(value) {
  return Array.isArray(value) ? value : [value];
}

/** @type {Invariant[]} */
export const lexiconInvariants = [
  {
    id: 'L1',
    description: 'All lemma IDs are unique',
    /** @param {LexiconDocument} lex */
    check(lex) {
      const seen = new Map();
      /** @type {Violation[]} */
      const violations = [];
      for (let i = 0; i < lex.lemmata.length; i++) {
        const lemma = lex.lemmata[i];
        if (seen.has(lemma.id)) {
          violations.push({
            path: `lemmata[${i}]`,
            message: `duplicate lemma id "${lemma.id}" (first at index ${seen.get(lemma.id)})`,
          });
        } else {
          seen.set(lemma.id, i);
        }
      }
      return violations;
    },
  },

  {
    id: 'L2',
    description: 'Lemma IDs match {lemma_form}_{pos_abbrev} pattern',
    /** @param {LexiconDocument} lex */
    check(lex) {
      // Mirrors LemmaIdSchema in schema/language.schema.js.
      const pattern = /^[A-Za-z][A-Za-z0-9_-]*_[a-z]+$/;
      /** @type {Violation[]} */
      const violations = [];
      for (const lemma of lex.lemmata) {
        if (!pattern.test(lemma.id)) {
          violations.push({
            path: lemma.id || '<missing>',
            message: `id does not match ${pattern.source}`,
          });
        }
      }
      return violations;
    },
  },

  {
    id: 'L3',
    description: "Each lemma's pos is a valid value ID in the pos grammar category",
    /** @param {LexiconDocument} lex */
    check(lex, ctx) {
      const validPos = categoryValueIds(ctx.grammar, 'pos');
      /** @type {Violation[]} */
      const violations = [];
      for (const lemma of lex.lemmata) {
        if (!validPos.has(lemma.pos)) {
          violations.push({
            path: `${lemma.id}.pos`,
            message: `unknown pos "${lemma.pos}"`,
          });
        }
      }
      return violations;
    },
  },

  {
    id: 'L4',
    description: 'Paradigm row codes are valid grammar value IDs',
    /** @param {LexiconDocument} lex */
    check(lex, ctx) {
      const validIds = allGrammarValueIds(ctx.grammar);
      /** @type {Violation[]} */
      const violations = [];
      for (const lemma of lex.lemmata) {
        for (const which of ['paradigm', 'ppp_paradigm']) {
          const p = lemma[which];
          if (!p) continue;
          for (const row of p.rows) {
            for (const atom of row.split('.')) {
              if (!isKnownAtom(atom, validIds)) {
                violations.push({
                  path: `${lemma.id}.${which}.rows`,
                  message: `unknown atom "${atom}" in row "${row}"`,
                });
              }
            }
          }
        }
      }
      return violations;
    },
  },

  {
    id: 'L5',
    description: 'Paradigm col codes are valid grammar value ID combinations',
    /** @param {LexiconDocument} lex */
    check(lex, ctx) {
      const validIds = allGrammarValueIds(ctx.grammar);
      /** @type {Violation[]} */
      const violations = [];
      for (const lemma of lex.lemmata) {
        for (const which of ['paradigm', 'ppp_paradigm']) {
          const p = lemma[which];
          if (!p) continue;
          for (const col of p.cols) {
            for (const atom of col.split('.')) {
              if (!isKnownAtom(atom, validIds)) {
                violations.push({
                  path: `${lemma.id}.${which}.cols`,
                  message: `unknown atom "${atom}" in col "${col}"`,
                });
              }
            }
          }
        }
      }
      return violations;
    },
  },

  {
    id: 'L6',
    description: 'paradigm.type is consistent with pos',
    /** @param {LexiconDocument} lex */
    check(lex) {
      /** @type {Violation[]} */
      const violations = [];
      for (const lemma of lex.lemmata) {
        if (lemma.paradigm) {
          const allowed = ALLOWED_PARADIGM_TYPES[lemma.pos];
          if (!allowed || !allowed.has(lemma.paradigm.type)) {
            violations.push({
              path: `${lemma.id}.paradigm.type`,
              message: `type "${lemma.paradigm.type}" not allowed for pos "${lemma.pos}"`,
            });
          }
        }
      }
      return violations;
    },
  },

  {
    id: 'L7',
    description: 'ppp_paradigm only present when pos: "verb"',
    /** @param {LexiconDocument} lex */
    check(lex) {
      /** @type {Violation[]} */
      const violations = [];
      for (const lemma of lex.lemmata) {
        if (lemma.ppp_paradigm && lemma.pos !== 'verb') {
          violations.push({
            path: `${lemma.id}.ppp_paradigm`,
            message: `ppp_paradigm is only valid on verbs (pos="${lemma.pos}")`,
          });
        }
      }
      return violations;
    },
  },

  {
    id: 'L8',
    description: 'Paradigm has minimum cell count for its type',
    severity: 'warning', // incomplete paradigm = editorial backlog, not data corruption
    /** @param {LexiconDocument} lex */
    check(lex) {
      /** @type {Violation[]} */
      const violations = [];
      for (const lemma of lex.lemmata) {
        for (const which of ['paradigm', 'ppp_paradigm']) {
          const p = lemma[which];
          if (!p) continue;
          const min = MIN_CELLS_PER_TYPE[p.type];
          if (min == null) continue;
          const count = Object.keys(p.cells).length;
          if (count < min) {
            violations.push({
              path: `${lemma.id}.${which}.cells`,
              message: `${count} cells for type "${p.type}", expected ≥${min}`,
            });
          }
        }
      }
      return violations;
    },
  },

  {
    id: 'L8a',
    description: 'Paradigm presence matches POS class (declinable include, invariant omit)',
    severity: 'warning', // declinable-POS stubs still ship the citation form in the glossary
    /** @param {LexiconDocument} lex */
    check(lex) {
      /** @type {Violation[]} */
      const violations = [];
      for (const lemma of lex.lemmata) {
        if (DECLINABLE_POS.has(lemma.pos) && !lemma.paradigm) {
          violations.push({
            path: `${lemma.id}.paradigm`,
            message: `declinable POS "${lemma.pos}" requires a paradigm`,
          });
        }
        if (INVARIANT_POS.has(lemma.pos) && (lemma.paradigm || lemma.ppp_paradigm)) {
          violations.push({
            path: `${lemma.id}.paradigm`,
            message: `invariant POS "${lemma.pos}" must not have a paradigm`,
          });
        }
      }
      return violations;
    },
  },

  {
    id: 'L9',
    description: "Each lemma's surface form appears in at least one paradigm cell (or is invariant)",
    severity: 'warning', // missing 1sg cells / wrong-template paradigms = editorial backlog
    /** @param {LexiconDocument} lex */
    check(lex) {
      /** @type {Violation[]} */
      const violations = [];
      for (const lemma of lex.lemmata) {
        if (INVARIANT_POS.has(lemma.pos)) continue;
        if (!lemma.paradigm) continue; // L8a will flag this separately
        const allKeys = new Set();
        for (const v of Object.values(lemma.paradigm.cells)) {
          for (const f of cellForms(v)) allKeys.add(lemmaCompareKey(f));
        }
        if (!allKeys.has(lemmaCompareKey(lemma.lemma))) {
          violations.push({
            path: `${lemma.id}.lemma`,
            message: `surface form "${lemma.lemma}" not present in any paradigm cell`,
          });
        }
      }
      return violations;
    },
  },
];

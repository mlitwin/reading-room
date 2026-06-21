// Reference-grammar invariants (R1–R5). See Plans/latin-reference-grammar-plan.md.
//
// Validates content/_language/latin/reference-grammar.json (Allen & Greenough,
// extracted by site/latin/ingest_ag.py) and the agRefs bridge from grammar.json.

/** @typedef {import('../schema/reference-grammar.schema.js').ReferenceGrammar} ReferenceGrammar */
/** @typedef {import('./runner.js').Violation} Violation */
/** @typedef {import('./runner.js').Invariant} Invariant */

/** @type {Invariant[]} */
export const referenceGrammarInvariants = [
  {
    id: 'R1',
    description: 'Section ids are unique and match their map key',
    /** @param {ReferenceGrammar} ref */
    check(ref) {
      /** @type {Violation[]} */
      const violations = [];
      for (const [key, sec] of Object.entries(ref.sections)) {
        if (sec.id !== key) {
          violations.push({
            path: `sections["${key}"].id`,
            message: `id "${sec.id}" does not match map key "${key}"`,
          });
        }
      }
      return violations;
    },
  },

  {
    id: 'R2',
    description: 'Every part section reference exists in sections',
    /** @param {ReferenceGrammar} ref */
    check(ref) {
      /** @type {Violation[]} */
      const violations = [];
      for (const part of ref.parts) {
        for (const id of part.sections) {
          if (!ref.sections[id]) {
            violations.push({
              path: `parts["${part.id}"].sections`,
              message: `references missing section "${id}"`,
            });
          }
        }
      }
      return violations;
    },
  },

  {
    id: 'R3',
    description: 'Every cross-reference target resolves to a section',
    /** @param {ReferenceGrammar} ref */
    check(ref) {
      /** @type {Violation[]} */
      const violations = [];
      for (const sec of Object.values(ref.sections)) {
        for (const t of sec.xrefs) {
          if (!ref.sections[t]) {
            violations.push({
              path: `sections["${sec.id}"].xrefs`,
              message: `dangling cross-reference to "${t}"`,
            });
          }
        }
      }
      return violations;
    },
  },

  {
    id: 'R4',
    description: 'Every section has non-empty html',
    /** @param {ReferenceGrammar} ref */
    check(ref) {
      /** @type {Violation[]} */
      const violations = [];
      for (const sec of Object.values(ref.sections)) {
        if (!sec.html || sec.html.trim().length === 0) {
          violations.push({
            path: `sections["${sec.id}"].html`,
            message: 'empty section body',
          });
        }
      }
      return violations;
    },
  },

  {
    id: 'R5',
    description: 'grammar.json agRefs resolve to reference sections',
    /**
     * @param {ReferenceGrammar} ref
     * @param {{ grammar?: { categories: Array<{ id: string, values: Array<{ id: string, agRefs?: string[] }> }>, terms?: Array<{ id: string, agRefs?: string[] }> } }} ctx
     */
    check(ref, ctx) {
      /** @type {Violation[]} */
      const violations = [];
      const grammar = ctx?.grammar;
      if (!grammar) return violations;
      const checkRefs = (agRefs, path) => {
        if (!Array.isArray(agRefs)) return;
        for (const t of agRefs) {
          if (!ref.sections[t]) {
            violations.push({ path, message: `references missing A&G section "${t}"` });
          }
        }
      };
      for (const cat of grammar.categories) {
        for (const val of cat.values) {
          checkRefs(val.agRefs, `grammar.${cat.id}.${val.id}.agRefs`);
        }
      }
      for (const term of grammar.terms ?? []) {
        checkRefs(term.agRefs, `grammar.term.${term.id}.agRefs`);
      }
      return violations;
    },
  },
];

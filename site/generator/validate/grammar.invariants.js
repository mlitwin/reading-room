// Grammar invariants (G1–G3). See Plans/language-model-refactor.md.

/** @typedef {import('../schema/language.schema.js').Grammar} Grammar */
/** @typedef {import('./runner.js').Violation} Violation */
/** @typedef {import('./runner.js').Invariant} Invariant */

/** @type {Invariant[]} */
export const grammarInvariants = [
  {
    id: 'G1',
    description: 'All category IDs are unique within the grammar',
    /** @param {Grammar} g */
    check(g) {
      const seen = new Map();
      /** @type {Violation[]} */
      const violations = [];
      for (let i = 0; i < g.categories.length; i++) {
        const cat = g.categories[i];
        if (seen.has(cat.id)) {
          violations.push({
            path: `categories[${i}].id`,
            message: `duplicate category id "${cat.id}" (first at index ${seen.get(cat.id)})`,
          });
        } else {
          seen.set(cat.id, i);
        }
      }
      return violations;
    },
  },

  {
    id: 'G2',
    description: 'All value IDs are unique within each category',
    /** @param {Grammar} g */
    check(g) {
      /** @type {Violation[]} */
      const violations = [];
      for (const cat of g.categories) {
        const seen = new Map();
        for (let i = 0; i < cat.values.length; i++) {
          const val = cat.values[i];
          if (seen.has(val.id)) {
            violations.push({
              path: `${cat.id}.values[${i}].id`,
              message: `duplicate value id "${val.id}" in category "${cat.id}"`,
            });
          } else {
            seen.set(val.id, i);
          }
        }
      }
      return violations;
    },
  },

  {
    id: 'G3',
    description: 'Every value has a non-empty gloss',
    /** @param {Grammar} g */
    check(g) {
      /** @type {Violation[]} */
      const violations = [];
      for (const cat of g.categories) {
        for (const val of cat.values) {
          if (!val.gloss || val.gloss.trim().length === 0) {
            violations.push({
              path: `${cat.id}.${val.id}.gloss`,
              message: `missing or empty gloss`,
            });
          }
        }
      }
      return violations;
    },
  },
];

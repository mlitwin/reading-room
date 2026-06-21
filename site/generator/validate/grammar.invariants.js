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

  {
    id: 'G4',
    description: 'Grammar terms are unique, glossed, and do not collide with value note-keys',
    /** @param {Grammar} g */
    check(g) {
      /** @type {Violation[]} */
      const violations = [];
      const terms = Array.isArray(g.terms) ? g.terms : [];
      if (terms.length === 0) return violations;

      // Slug helper mirrors grammarNotesDict()'s key generation.
      const slug = (s) => String(s).toLowerCase()
        .normalize('NFKD').replace(/[̀-ͯ]/g, '')
        .replace(/[^a-z0-9\s-]/g, '').trim().replace(/\s+/g, '-');

      // Every note-key the value layer already owns (id + label slug + noteRef).
      const valueKeys = new Set();
      for (const cat of g.categories) {
        for (const val of cat.values) {
          valueKeys.add(val.id);
          valueKeys.add(slug(val.label));
          if (val.noteRef) valueKeys.add(val.noteRef);
        }
      }

      const seen = new Set();
      for (let i = 0; i < terms.length; i++) {
        const t = terms[i];
        if (seen.has(t.id)) {
          violations.push({ path: `terms[${i}].id`, message: `duplicate term id "${t.id}"` });
        }
        seen.add(t.id);
        if (!t.gloss || t.gloss.trim().length === 0) {
          violations.push({ path: `terms[${i}].gloss`, message: `term "${t.id}" missing gloss` });
        }
        for (const key of [t.id, slug(t.label)]) {
          if (valueKeys.has(key)) {
            violations.push({
              path: `terms[${i}]`,
              message: `term note-key "${key}" collides with a category value`,
            });
          }
        }
      }
      return violations;
    },
  },
];

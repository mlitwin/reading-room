// Vocabulary-overlay invariants (V1–V3).
//
// Per-book vocabulary/ cards (content/<book>/vocabulary/*.json) are merged into
// a single flat runtime lexicon asset (docs/assets/lexicon.json), keyed by id
// with no per-book namespace. These invariants keep that flat map sound —
// mirroring the build-time guard in build.js's collectVocabularyOverlays — so
// `make validate` catches inconsistency without a full build.
//
// `data` is the collected overlays: Array<{ id, book, rel, card, raw }>.
// ctx.lexicon is the shared consolidated LexiconDocument ({ lemmata: [...] }).

import { LemmaEntrySchema } from '../schema/language.schema.js';

/** @typedef {import('./runner.js').Violation} Violation */
/** @typedef {import('./runner.js').Invariant} Invariant */

function canonical(card) {
  return JSON.stringify(card);
}

/** @type {Invariant[]} */
export const vocabularyInvariants = [
  {
    id: 'V1',
    description: 'Overlay ids are globally unique across books (or byte-identical)',
    check(data) {
      /** @type {Violation[]} */
      const violations = [];
      const byId = new Map(); // id → { rel, card }
      for (const o of data) {
        const prev = byId.get(o.id);
        if (prev && canonical(prev.card) !== canonical(o.card)) {
          violations.push({
            path: o.id,
            message: `defined differently by ${prev.rel} and ${o.rel}; overlay ids share one global namespace — rename one or promote to the shared lexicon`,
          });
        } else if (!prev) {
          byId.set(o.id, o);
        }
      }
      return violations;
    },
  },
  {
    id: 'V2',
    description: 'Overlay ids do not shadow a different shared-lexicon entry',
    check(data, ctx) {
      /** @type {Violation[]} */
      const violations = [];
      const shared = new Map((ctx.lexicon?.lemmata ?? []).map((e) => [e.id, e]));
      for (const o of data) {
        const s = shared.get(o.id);
        if (s && canonical(s) !== canonical(o.card)) {
          violations.push({
            path: o.id,
            message: `${o.rel} shadows a different shared-lexicon entry; the runtime lexicon is one flat map, so this would leak into every book — rename it or edit the shared lexicon instead`,
          });
        }
      }
      return violations;
    },
  },
  {
    id: 'V3',
    description: 'Each overlay card is a valid lexicon entry',
    check(data) {
      /** @type {Violation[]} */
      const violations = [];
      for (const o of data) {
        const res = LemmaEntrySchema.safeParse(o.card);
        if (!res.success) {
          const first = res.error.issues[0];
          violations.push({
            path: o.rel,
            message: `invalid lexicon card: ${first.path.join('.')} — ${first.message}`,
          });
        }
      }
      return violations;
    },
  },
];

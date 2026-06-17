// Concordance invariants (C1–C10). See Plans/language-model-refactor.md.
//
// Requires ctx: { grammar, glossary, sourceTokens? }.
// sourceTokens is optional — it carries the extracted span data from the
// markdown source for C8/C9 editorial coverage checks. When absent, those
// invariants are skipped (the concordance can still be validated in isolation
// against grammar + glossary alone).

import { normalizeSurface, findUnsplitEnclitic } from '../lib/normalize.js';

/** @typedef {import('../schema/concordance.schema.js').Concordance} Concordance */
/** @typedef {import('../schema/glossary.schema.js').Glossary} Glossary */
/** @typedef {import('../schema/language.schema.js').Grammar} Grammar */
/** @typedef {import('./runner.js').Violation} Violation */
/** @typedef {import('./runner.js').Invariant} Invariant */

function categoryValueIds(grammar, categoryId) {
  const cat = grammar.categories.find((c) => c.id === categoryId);
  return cat ? new Set(cat.values.map((v) => v.id)) : new Set();
}

/** @type {Invariant[]} */
export const concordanceInvariants = [
  {
    id: 'C1',
    description: 'Every token surface has a glossary entry',
    severity: 'warning', // missing surface = lexicon enrichment task per Decision 3
    /** @param {Concordance} c */
    check(c, ctx) {
      /** @type {Violation[]} */
      const violations = [];
      for (const [id, tok] of Object.entries(c.tokens)) {
        if (!ctx.glossary.entries[tok.surface]) {
          // Skip tokens explicitly marked as unresolved by the first-pass
          // annotator (data-matches="unknown_adv:unk"). These are an editorial
          // backlog of proper nouns / hapax to lemmatize, not glossary build
          // gaps — surfacing them as C1 violations would drown out genuine
          // lexicon-enrichment signal.
          if (tok.candidates.length === 1 && tok.candidates[0].lemma_id === 'unknown_adv') continue;
          violations.push({
            path: `tokens.${id}`,
            message: `surface "${tok.surface}" not in glossary`,
          });
        }
      }
      return violations;
    },
  },

  {
    id: 'C2',
    description: 'Every concordance candidate lemma_id appears in the glossary for that surface',
    severity: 'warning', // paradigm-strip fallout: stub lemmata lost their inflected forms
    /** @param {Concordance} c */
    check(c, ctx) {
      /** @type {Violation[]} */
      const violations = [];
      for (const [id, tok] of Object.entries(c.tokens)) {
        const entry = ctx.glossary.entries[tok.surface];
        if (!entry) continue;
        const knownLemmaIds = new Set(entry.candidates.map((x) => x.lemma_id));
        for (const cand of tok.candidates) {
          if (!knownLemmaIds.has(cand.lemma_id)) {
            violations.push({
              path: `tokens.${id}.candidates`,
              message: `lemma "${cand.lemma_id}" not in glossary entry for "${tok.surface}"`,
            });
          }
        }
      }
      return violations;
    },
  },

  {
    id: 'C3',
    description: 'Concordance parses are a subset of glossary parses for each lemma',
    severity: 'warning', // adjective paradigms missing voc cells — paradigm-expansion backlog
    /** @param {Concordance} c */
    check(c, ctx) {
      const INVARIANT_POS_PARSES = new Set(['adv', 'prep', 'conj', 'interj', 'enclit']);
      const lexById = ctx.lexicon
        ? new Map(ctx.lexicon.lemmata.map((l) => [l.id, l]))
        : null;
      /** @type {Violation[]} */
      const violations = [];
      for (const [id, tok] of Object.entries(c.tokens)) {
        const entry = ctx.glossary.entries[tok.surface];
        if (!entry) continue;
        const glossaryParses = new Map(entry.candidates.map((x) => [x.lemma_id, new Set(x.parses)]));
        for (const cand of tok.candidates) {
          const allowed = glossaryParses.get(cand.lemma_id);
          if (!allowed) continue;
          const lemma = lexById?.get(cand.lemma_id);
          const lemmaIsInvariant = lemma && INVARIANT_POS_PARSES.has(lemma.pos === 'enclitic' ? 'enclit' : lemma.pos);
          for (const p of cand.parses) {
            if (allowed.has(p)) continue;
            // Invariant POS lemmata (prep / adv / conj / interj / enclit) often
            // do double-duty in classical Latin — "ante" can be either adv or
            // prep depending on syntactic context. The markdown editor signals
            // this by listing both parses; the glossary only carries the
            // canonical one. Accept any other invariant-POS parse on an
            // invariant-POS lemma so this routine cross-tagging doesn't drown
            // out genuine paradigm gaps.
            if (lemmaIsInvariant && INVARIANT_POS_PARSES.has(p)) continue;
            // Gender-agnostic comparison: for personal/reflexive pronouns
            // (ego, tu, nos, vos, sui) and any other lemma whose paradigm
            // stores cells without a gender suffix, accept a markdown parse
            // that includes a gender if the gender-stripped form is in the
            // paradigm. E.g., glossary has `dat.sg` for ego_pron; markdown
            // tags "mihi" as `dat.sg.masc,dat.sg.fem`; both should match.
            const stripped = p.replace(/\.(masc|fem|neut)(?=\.|$)/, '');
            if (stripped !== p && allowed.has(stripped)) continue;
            // Suppletive / alternate-form surfaces — magis/maior/maximus on
            // magnus_adj, Phoebe on Phoebus_n, etc. — enter the glossary
            // tagged with an "alt" marker. Accept any markdown parse on those
            // surfaces; their grammatical analysis lives in a related lemma
            // pending an editorial split.
            if (allowed.has('alt')) continue;
            // Indeclinable adj / one-form noun used adverbially or with the
            // lemma's id-suffix parse: tot_adj's `adv` use, mille_num's `num`
            // use, nefas_n's `adv` use. Accept when the markdown parse equals
            // either the lemma's pos or the lemma's id-suffix (the
            // noParadigmParse marker), and the token surface is the lemma's
            // citation form.
            if (lemma) {
              const tokSurface = tok.surface;
              const lemmaForm = lemma.lemma.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/j/g, 'i').replace(/v/g, 'u');
              if (tokSurface === lemmaForm) {
                const ix = lemma.id.lastIndexOf('_');
                const idSuffix = ix >= 0 ? lemma.id.slice(ix + 1) : null;
                if (p === lemma.pos || (idSuffix && p === idSuffix)) continue;
                // Indeclinables (tot, totidem, nefas, mille, sponte, …) can
                // double as adverbs / prepositions / conjunctions in classical
                // usage; accept any invariant-POS parse on the lemma's own
                // citation form.
                if (INVARIANT_POS_PARSES.has(p)) continue;
              }
            }
            // Non-finite verb forms: markdown tags participle / gerundive /
            // gerund / future-participle surfaces with a bare case-style
            // parse ("gen.pl.neut" for habendum, "nom.sg.fem" for amans) when
            // the cell keys carry a marker prefix (ppl., ppp., gerundive.,
            // ger., fap., fpp.). Accept the markdown parse if any of those
            // prefixed cells matches.
            if (lemma && lemma.pos === 'verb' && /^[a-z]+\.(sg|pl)(\.(?:masc|fem|neut))?$/.test(p)) {
              const prefixed = ['ppl.', 'ppp.', 'gerundive.', 'ger.', 'fap.', 'fpp.']
                .some((pre) => allowed.has(pre + p));
              if (prefixed) continue;
            }
            // Paradigmless lemmata (manifesta_adv, sponte_adv, mariti_adv —
            // entries mistakenly classified as adv when they're substantivized
            // adj / noun surfaces) can't disprove any parse: they offer the
            // single bare-POS code from noParadigmParse and nothing else.
            // L8a already flags these as editorial backlog (declinable POS
            // without paradigm); rather than double-counting the same problem
            // here, accept the markdown parse. The fix lives in the lexicon,
            // not the validator.
            if (lemma && !lemma.paradigm && !lemma.ppp_paradigm) continue;
            violations.push({
              path: `tokens.${id}.candidates.${cand.lemma_id}`,
              message: `parse "${p}" not in glossary for this lemma`,
            });
          }
        }
      }
      return violations;
    },
  },

  {
    id: 'C4',
    description: 'If selected_lemma_id is set, it appears in the candidate list',
    /** @param {Concordance} c */
    check(c) {
      /** @type {Violation[]} */
      const violations = [];
      for (const [id, tok] of Object.entries(c.tokens)) {
        if (!tok.selected_lemma_id) continue;
        const ids = tok.candidates.map((x) => x.lemma_id);
        if (!ids.includes(tok.selected_lemma_id)) {
          violations.push({
            path: `tokens.${id}.selected_lemma_id`,
            message: `"${tok.selected_lemma_id}" not in candidates`,
          });
        }
      }
      return violations;
    },
  },

  {
    id: 'C5',
    description: "If selected_parses is set, each entry is in the selected lemma's parses",
    /** @param {Concordance} c */
    check(c) {
      /** @type {Violation[]} */
      const violations = [];
      for (const [id, tok] of Object.entries(c.tokens)) {
        if (!tok.selected_parses) continue;
        if (!tok.selected_lemma_id) {
          violations.push({
            path: `tokens.${id}`,
            message: `selected_parses set without selected_lemma_id`,
          });
          continue;
        }
        const cand = tok.candidates.find((x) => x.lemma_id === tok.selected_lemma_id);
        if (!cand) continue; // C4 reports
        const allowed = new Set(cand.parses);
        for (const p of tok.selected_parses) {
          if (!allowed.has(p)) {
            violations.push({
              path: `tokens.${id}.selected_parses`,
              message: `parse "${p}" not in selected lemma's parse list`,
            });
          }
        }
      }
      return violations;
    },
  },

  {
    id: 'C6',
    description: 'Token IDs are unique within the concordance',
    /** @param {Concordance} c */
    check(c) {
      /** @type {Violation[]} */
      const violations = [];
      // The schema keys by id, so duplicate keys would already collapse during
      // load. This invariant catches the case where the inner id field
      // disagrees with its containing key.
      for (const [key, tok] of Object.entries(c.tokens)) {
        if (tok.id !== key) {
          violations.push({
            path: `tokens.${key}.id`,
            message: `inner id "${tok.id}" does not match key`,
          });
        }
      }
      return violations;
    },
  },

  {
    id: 'C7',
    description: 'Token surfaces are normalized (idempotent under normalizeSurface)',
    /** @param {Concordance} c */
    check(c) {
      /** @type {Violation[]} */
      const violations = [];
      for (const [id, tok] of Object.entries(c.tokens)) {
        const renormalized = normalizeSurface(tok.surface);
        if (renormalized !== tok.surface) {
          violations.push({
            path: `tokens.${id}.surface`,
            message: `surface "${tok.surface}" not in normal form (would normalize to "${renormalized}")`,
          });
        }
      }
      return violations;
    },
  },

  {
    id: 'C7a',
    description: 'pos_hint is a valid pos value and consistent with at least one candidate lemma',
    severity: 'warning', // data-pos hint inconsistencies — audit aid, not load-bearing
    /** @param {Concordance} c */
    check(c, ctx) {
      const validPos = categoryValueIds(ctx.grammar, 'pos');
      const lexById = ctx.lexicon
        ? new Map(ctx.lexicon.lemmata.map((l) => [l.id, l]))
        : null;
      /** @type {Violation[]} */
      const violations = [];
      for (const [id, tok] of Object.entries(c.tokens)) {
        if (!tok.pos_hint) continue;
        if (!validPos.has(tok.pos_hint)) {
          violations.push({
            path: `tokens.${id}.pos_hint`,
            message: `unknown pos value "${tok.pos_hint}"`,
          });
          continue;
        }
        if (lexById) {
          const candPos = tok.candidates.map((c) => lexById.get(c.lemma_id)?.pos).filter(Boolean);
          if (candPos.length > 0 && !candPos.includes(tok.pos_hint)) {
            violations.push({
              path: `tokens.${id}.pos_hint`,
              message: `hint "${tok.pos_hint}" not matched by any candidate (candidates: ${candPos.join(', ')})`,
            });
          }
        }
      }
      return violations;
    },
  },

  {
    id: 'C8',
    description: 'Every markdown span has a corresponding concordance token',
    /** @param {Concordance} c */
    check(c, ctx) {
      if (!ctx.sourceTokens) return [];
      /** @type {Violation[]} */
      const violations = [];
      for (const src of ctx.sourceTokens) {
        if (!c.tokens[src.id]) {
          violations.push({
            path: `sourceTokens.${src.id}`,
            message: `markdown span at ${src.location ?? src.id} has no concordance entry`,
          });
        }
      }
      return violations;
    },
  },

  {
    id: 'C9',
    description: 'Every concordance token has a corresponding markdown span',
    /** @param {Concordance} c */
    check(c, ctx) {
      if (!ctx.sourceTokens) return [];
      const sourceIds = new Set(ctx.sourceTokens.map((s) => s.id));
      /** @type {Violation[]} */
      const violations = [];
      for (const id of Object.keys(c.tokens)) {
        if (!sourceIds.has(id)) {
          violations.push({
            path: `tokens.${id}`,
            message: `phantom token (no markdown span source)`,
          });
        }
      }
      return violations;
    },
  },

  {
    id: 'C11',
    description: 'Multi-candidate tokens have selected_lemma_id (editorial disambiguation)',
    severity: 'warning', // worklist signal, not a build gate (per plan open-question #1)
    /** @param {Concordance} c */
    check(c) {
      /** @type {Violation[]} */
      const violations = [];
      for (const [id, tok] of Object.entries(c.tokens)) {
        if (tok.candidates.length > 1 && !tok.selected_lemma_id) {
          violations.push({
            path: `tokens.${id}`,
            message: `${tok.candidates.length} candidates for "${tok.surface}"; no editorial selection`,
          });
        }
      }
      return violations;
    },
  },

  // C12 — orphan data-stanza detection — requires the build-concordance step
  // to surface dropped stanza pointers as a separate field on each token.
  // Deferred until build-concordance.js is extended; for now build_concordance
  // silently drops stanza hints that don't match a candidate.

  {
    id: 'C10',
    description: 'No token surface contains an unsplit enclitic suffix',
    severity: 'warning', // editorial split work; doesn't break rendering
    /** @param {Concordance} c */
    check(c, ctx) {
      const encliticLemmaIds = new Set();
      const lexById = new Map();
      if (ctx.lexicon) {
        for (const l of ctx.lexicon.lemmata) {
          lexById.set(l.id, l);
          if (l.pos === 'enclitic') encliticLemmaIds.add(l.id);
        }
      }
      /** @type {Violation[]} */
      const violations = [];
      for (const [id, tok] of Object.entries(c.tokens)) {
        // Skip standalone enclitic tokens (they ARE the enclitic, not a host
        // with the enclitic still attached).
        const isStandaloneEnclitic = tok.candidates.some((cand) =>
          encliticLemmaIds.has(cand.lemma_id),
        );
        if (isStandaloneEnclitic) continue;

        // Skip tokens whose surface IS the citation form of one of their
        // candidate lemmata. This catches Latin words that legitimately end in
        // -que / -ve as part of their dictionary form (quoque, quisque, ubique,
        // utroque, neve, sive, …) without false-flagging them as unsplit.
        const isOwnCitationForm = tok.candidates.some((cand) => {
          const lemma = lexById.get(cand.lemma_id);
          if (!lemma) return false;
          return normalizeSurface(lemma.lemma) === tok.surface;
        });
        if (isOwnCitationForm) continue;

        // Skip tokens whose surface is a paradigm cell of one of their
        // candidate lemmata (e.g. "quaeque" is a quisque_pron form). The
        // editor has already chosen to treat the -que as part of the inflected
        // pronoun, not as an enclitic to split.
        const isParadigmForm = tok.candidates.some((cand) => {
          const lemma = lexById.get(cand.lemma_id);
          if (!lemma) return false;
          for (const which of ['paradigm', 'ppp_paradigm']) {
            const p = lemma[which];
            if (!p?.cells) continue;
            for (const value of Object.values(p.cells)) {
              const forms = Array.isArray(value) ? value : [value];
              for (const f of forms) {
                if (normalizeSurface(f) === tok.surface) return true;
              }
            }
          }
          return false;
        });
        if (isParadigmForm) continue;

        const suf = findUnsplitEnclitic(tok.surface);
        if (suf) {
          violations.push({
            path: `tokens.${id}.surface`,
            message: `surface "${tok.surface}" ends in enclitic "-${suf}" — split into adjacent tokens`,
          });
        }
      }
      return violations;
    },
  },
];

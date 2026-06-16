import { z } from 'zod';
import { LemmaIdSchema } from './language.schema.js';

// Concordance — text-specific token index.
// Build artifact, derived from inline markdown spans (editorial source of truth).
// One concordance per text; emitted to docs/assets/concordance/{text_slug}.json.

export const ConcordanceCandidateSchema = z.object({
  lemma_id: LemmaIdSchema,
  parses: z.array(z.string().min(1)).min(1),
});

// Token id: b{book}-{chapter}-{span_index:03d}, where span_index is the 1-based
// ordinal position of the <span data-matches> within the chapter file.
// Uniqueness within a concordance is sufficient (no stability guarantee).
export const TokenIdSchema = z
  .string()
  .regex(/^b[0-9]+-[A-Za-z0-9]+-[0-9]{3,}$/, "token id must match b{book}-{chapter}-{span_index}");

export const TokenInstanceSchema = z.object({
  id: TokenIdSchema,
  surface: z.string().min(1),                             // normalized — see C7
  candidates: z.array(ConcordanceCandidateSchema).min(1),
  selected_lemma_id: LemmaIdSchema.optional(),            // stanza-model or editorial choice
  selected_parses: z.array(z.string().min(1)).optional(), // narrowed parses on selected lemma
  pos_hint: z.string().optional(),                        // data-pos audit aid
});

export const ConcordanceSchema = z.object({
  text_id: z.string().min(1),                             // "ovid-metamorphoses"
  language_id: z.string().min(1),                         // "latin"
  generated_at: z.string().min(1),                        // ISO-8601 timestamp
  tokens: z.record(z.string(), TokenInstanceSchema),      // keyed by token id
});

/**
 * @typedef {z.infer<typeof ConcordanceCandidateSchema>} ConcordanceCandidate
 * @typedef {z.infer<typeof TokenInstanceSchema>} TokenInstance
 * @typedef {z.infer<typeof ConcordanceSchema>} Concordance
 */

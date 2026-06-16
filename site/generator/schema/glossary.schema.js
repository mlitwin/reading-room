import { z } from 'zod';
import { LemmaIdSchema } from './language.schema.js';

// Glossary — derived word-form → candidate lemmata index.
// Build artifact, not editorially authored. One per language.
// See plan: invariants Gl1–Gl5 enforced by the validation framework, not here.

export const GlossaryCandidateSchema = z.object({
  lemma_id: LemmaIdSchema,
  parses: z.array(z.string().min(1)).min(1),
});

export const GlossaryEntrySchema = z.object({
  word: z.string().min(1),                                // normalized surface form (see C7)
  candidates: z.array(GlossaryCandidateSchema).min(1),
});

export const GlossarySchema = z.object({
  language_id: z.string().min(1),
  generated_at: z.string().min(1),                        // ISO-8601 timestamp
  entries: z.record(z.string(), GlossaryEntrySchema),     // keyed by normalized word
});

/**
 * @typedef {z.infer<typeof GlossaryCandidateSchema>} GlossaryCandidate
 * @typedef {z.infer<typeof GlossaryEntrySchema>} GlossaryEntry
 * @typedef {z.infer<typeof GlossarySchema>} Glossary
 */

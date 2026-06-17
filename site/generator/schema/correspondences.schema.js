import { z } from 'zod';
import { LineRangeSchema } from './manuscript.schema.js';

// Correspondences — cross-language line-range alignment for a single text.
// Lives at content/{text_slug}/correspondences.json.

export const MappingSchema = z.object({
  source: LineRangeSchema,                 // inclusive line range in source manuscript
  target: LineRangeSchema,                 // inclusive line range in target manuscript
  note: z.string().optional(),             // optional editorial annotation
});

export const LanguagePairSchema = z.object({
  source: z.string().min(1),               // language_id, e.g. "latin"
  target: z.string().min(1),               // language_id, e.g. "english"
  mappings: z.array(MappingSchema),        // chapter-level today, line-level eventually
});

export const CorrespondencesSchema = z.object({
  text_id: z.string().min(1),
  pairs: z.array(LanguagePairSchema).min(1),
});

/**
 * @typedef {z.infer<typeof MappingSchema>} Mapping
 * @typedef {z.infer<typeof LanguagePairSchema>} LanguagePair
 * @typedef {z.infer<typeof CorrespondencesSchema>} Correspondences
 */

import { z } from 'zod';
import { LineRangeSchema } from './manuscript.schema.js';

// Correspondences — cross-language line-range alignment for a single text.
// Lives at content/{text_slug}/correspondences.json.

// A mapping aligns a source line-range with a target line-range. For texts
// that translate line-for-line (Ovid) both sides are always present. For
// parallel-but-independent texts (Marvell's Hortus vs. The Garden) a side may
// be `null`, meaning "these lines correspond to nothing in the other text":
//   - source null            → target-only (English stanza with no Latin)
//   - target null            → source-only (Latin lines with no English)
// `kind` lets the reader style the gap; `lacuna` marks an editorial gap in
// the text itself (e.g. Hortus's printed "Desunt multa"), and requires a note.
export const MappingKindSchema = z.enum([
  'parallel',
  'source-only',
  'target-only',
  'lacuna',
]);

export const MappingSchema = z
  .object({
    source: LineRangeSchema.nullable().optional(),  // null / omitted = no source counterpart
    target: LineRangeSchema.nullable().optional(),  // null / omitted = no target counterpart
    kind: MappingKindSchema.optional(),
    note: z.string().optional(),             // optional editorial annotation
  })
  .refine((m) => m.source != null || m.target != null, {
    message: 'mapping must have a source or a target range (or both)',
  })
  .refine((m) => m.kind !== 'lacuna' || (m.note && m.note.length > 0), {
    message: 'a "lacuna" mapping must carry a note',
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
 * @typedef {z.infer<typeof MappingKindSchema>} MappingKind
 * @typedef {z.infer<typeof MappingSchema>} Mapping
 * @typedef {z.infer<typeof LanguagePairSchema>} LanguagePair
 * @typedef {z.infer<typeof CorrespondencesSchema>} Correspondences
 */

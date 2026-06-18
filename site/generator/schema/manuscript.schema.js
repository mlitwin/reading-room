import { z } from 'zod';
import { LemmaIdSchema } from './language.schema.js';

// Manuscript — per-language structured text. One file per (text, language):
//   content/{text_slug}/manuscript.{language_id}.json
// See Plans/manuscript-format-plan.md.
//
// The manuscript is the source of truth for tokenized text. Per-chapter
// markdown files (today's editorial form) are derived from it at build time.

// Hierarchy level — one entry per nesting level in the TOC, top-down.
// For Ovid: [{id:"book"}, {id:"chapter"}]. For a single-volume work,
// a single entry suffices.
export const HierarchyLevelSchema = z.object({
  id: z.string().min(1),                  // "book", "chapter", "story", …
  label: z.string().min(1),               // "Book", "Chapter", …
});

// Section path: dot-separated tuple, one component per hierarchy level
// the section occupies. A book is "1"; a chapter within book 1 is "1.01".
// Components are alphanumeric (allows zero-padded chapter ids like "01"
// without losing alphabetic chapter labels like "Prologue").
export const SectionPathSchema = z
  .string()
  .regex(/^[A-Za-z0-9]+(\.[A-Za-z0-9]+)*$/, "section path must be dot-separated alphanumeric components");

// Inclusive line range, [start, end], both 1-based. Used both on leaf
// sections (which lines belong to this section) and in correspondences.
export const LineRangeSchema = z
  .tuple([z.number().int().positive(), z.number().int().positive()])
  .refine(([a, b]) => a <= b, { message: "line range must be non-decreasing" });

export const SectionSchema = z.object({
  path: SectionPathSchema,
  level: z.string().min(1),                        // hierarchy id at deepest level here
  label: z.string().min(1),                        // short heading ("Chapter 01")
  title: z.string().optional(),                    // longer title ("Proem; The Chaos …")
  line_range: LineRangeSchema.optional(),          // present on leaf sections
  notes: z.string().optional(),                    // markdown commentary, not tokenized
  // English manuscript only: chapter-level prose translation before per-line
  // tokenization is done. Mutually exclusive with populating that section's
  // lines, but the schema doesn't enforce that — a per-text invariant check
  // can.
  translation: z.string().optional(),
});

// Token — one element of a line's content stream.
//
//   kind:"word"   — an inflected word carrying lemma + parse data.
//                    surface is the displayed form; lemma_id + parses
//                    drive glossary linkage. stanza / pos_hint mirror
//                    today's data-stanza / data-pos editorial fields.
//
//   kind:"punct"  — punctuation / parens / a comma-with-trailing-space.
//                    Per Decision 4, comma + space is a single punct
//                    token like ", ".
//
//   kind:"ws"     — explicit whitespace between word tokens. Omit
//                    `text` for a single space. Most adjacent
//                    word-pairs are separated by one space, which the
//                    markdown emitter inserts implicitly; this token
//                    is only needed where editorial intent calls for
//                    something other than that default (e.g. zero
//                    space across an enclitic split).
export const WordTokenSchema = z.object({
  kind: z.literal('word'),
  surface: z.string().min(1),
  lemma_id: LemmaIdSchema,
  parses: z.array(z.string().min(1)).min(1),
  stanza: z.string().optional(),
  pos_hint: z.string().optional(),
  selected_lemma_id: LemmaIdSchema.optional(),
});

export const PunctTokenSchema = z.object({
  kind: z.literal('punct'),
  text: z.string().min(1),
});

export const WsTokenSchema = z.object({
  kind: z.literal('ws'),
  text: z.string().optional(),                     // omitted = single space
});

export const TokenSchema = z.discriminatedUnion('kind', [
  WordTokenSchema,
  PunctTokenSchema,
  WsTokenSchema,
]);

export const LineSchema = z.object({
  n: z.number().int().positive(),                  // 1-based, monotonic within its top-level section
  section: SectionPathSchema,                      // path of deepest containing section
  tokens: z.array(TokenSchema),                    // may be empty (blank line)
});

export const ManuscriptSchema = z.object({
  text_id: z.string().min(1),                      // "ovid-metamorphoses"
  language_id: z.string().min(1),                  // "latin" or "english"
  title: z.string().min(1),                        // "Metamorphoses"
  author: z.string().optional(),
  generated_at: z.string().optional(),             // ISO timestamp on derived copies
  hierarchy: z.array(HierarchyLevelSchema).min(1),
  sections: z.array(SectionSchema).min(1),
  lines: z.array(LineSchema),                      // may be empty (chapter-level translation only)
});

/**
 * @typedef {z.infer<typeof HierarchyLevelSchema>} HierarchyLevel
 * @typedef {z.infer<typeof SectionSchema>} Section
 * @typedef {z.infer<typeof WordTokenSchema>} WordToken
 * @typedef {z.infer<typeof PunctTokenSchema>} PunctToken
 * @typedef {z.infer<typeof WsTokenSchema>} WsToken
 * @typedef {z.infer<typeof TokenSchema>} Token
 * @typedef {z.infer<typeof LineSchema>} Line
 * @typedef {z.infer<typeof ManuscriptSchema>} Manuscript
 */

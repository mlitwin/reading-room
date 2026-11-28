import { z } from 'zod';

// Reference Grammar — the site's own reference grammar, seeded once from Allen &
// Greenough's New Latin Grammar (site/latin/seed_reference_grammar.py) and
// edited directly since. Source of truth: content/_language/{lang}/reference-grammar.json.
//
// Only authored data is stored: the toc tree and each section's body. Chapter
// membership, group headings, prev/next, and cross-refs are derived by
// lib/reference-grammar.js. The data drives both the standalone document
// (_language/{lang}/reference/) and the in-text popovers.
// See Plans/latin-text-centered-reader-plan.md (D1).

// A&G-derived sections keep their § number as id; our own sections use `rr-`.
export const SECTION_ID = /^(\d+|rr-[a-z0-9]+(?:-[a-z0-9]+)*)$/;

export const ReferenceSourceSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  edition: z.string().min(1).optional(),
  license: z.string().min(1),
  attribution: z.string().min(1),
  source_file: z.string().min(1).optional(),
  retrieved_at: z.string().min(1).optional(),
  seeded_at: z.string().min(1).optional(),
});

/** @type {z.ZodType<any>} */
export const TocItemSchema = z.lazy(() => z.union([
  z.string().regex(SECTION_ID, 'section id is a § number or rr-slug'),
  z.object({
    label: z.string().min(1),
    items: z.array(TocItemSchema).min(1),
  }).strict(),
]));

export const ReferenceChapterSchema = z.object({
  id: z.string().regex(/^ch-[a-z0-9-]+$/),
  slug: z.string().regex(/^\d+[a-z]?-[a-z0-9-]+$/, 'slug is the page file name, e.g. 09-second-declension'),
  label: z.string().min(1),
  items: z.array(TocItemSchema).min(1),
}).strict();

export const ReferencePartSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  chapters: z.array(ReferenceChapterSchema).min(1),
}).strict();

export const ReferenceSectionSchema = z.object({
  source: z.string().min(1),               // a sources[].id, or "editorial"
  heading: z.string().min(1).optional(),   // own heading; default: innermost toc group
  html: z.string(),                        // body; cross-refs are <a data-ref="ID">
  source_page: z.number().int().optional(), // printed page in the source, for citation
  edited: z.boolean().optional(),          // true once changed from the seeded text
  edit_note: z.string().min(1).optional(), // what changed, for the review report
}).strict();

export const ReferenceGrammarSchema = z.object({
  language_id: z.string().min(1),
  title: z.string().min(1),
  sources: z.array(ReferenceSourceSchema).min(1),
  toc: z.array(ReferencePartSchema).min(1),
  sections: z.record(z.string().regex(SECTION_ID), ReferenceSectionSchema),
}).strict();

/** @typedef {z.infer<typeof ReferenceGrammarSchema>} ReferenceGrammar */
/** @typedef {z.infer<typeof ReferenceSectionSchema>} ReferenceSection */

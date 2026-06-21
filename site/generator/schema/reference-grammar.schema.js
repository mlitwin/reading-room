import { z } from 'zod';

// Reference Grammar — Allen & Greenough's New Latin Grammar, extracted to
// structured sections. Source of truth: content/_language/{lang}/reference-grammar.json,
// produced by site/latin/ingest_ag.py from the vendored Perseus TEI XML.
//
// A "section" is a canonical A&G numbered section (§ N), keyed by its smythp id.
// This artifact is text-independent (a property of the language, like grammar.json
// and lexicon.json) and feeds the browsable reference pages plus the `ag:` deep
// links from the Ovid apparatus. See Plans/latin-reference-grammar-plan.md.

export const ReferenceSourceSchema = z.object({
  title: z.string().min(1),
  edition: z.string().min(1),
  license: z.string().min(1),
  attribution: z.string().min(1),
  source_file: z.string().min(1),
  retrieved_at: z.string().min(1),
});

export const ReferenceSectionSchema = z.object({
  id: z.string().regex(/^\d+$/, 'section id is the smythp number'),
  path: z.array(z.string().min(1)),       // breadcrumb: part → section → subsection
  heading: z.string().nullable(),         // innermost path element, or null
  html: z.string(),                       // rendered body; <ref> → <a href="#sec-N">
  xrefs: z.array(z.string().regex(/^\d+$/)), // smythp targets referenced here
  source_page: z.number().int().nullable(),  // <pb n=> in effect, for citation
});

export const ReferencePartSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  sections: z.array(z.string().regex(/^\d+$/)).min(1),
});

export const ReferenceGrammarSchema = z.object({
  language_id: z.string().min(1),
  source: ReferenceSourceSchema,
  parts: z.array(ReferencePartSchema).min(1),
  sections: z.record(z.string(), ReferenceSectionSchema),
});

/** @typedef {z.infer<typeof ReferenceGrammarSchema>} ReferenceGrammar */
/** @typedef {z.infer<typeof ReferenceSectionSchema>} ReferenceSection */

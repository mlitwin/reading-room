import { z } from 'zod';

// gray-matter parses YAML dates as JS Date objects; allow either form.
const dateLike = z.union([z.string(), z.date()]).optional();

// Default system for the Latin word popovers' pronunciation line; inherited by
// sub-pages. The reader can toggle it per book (see site/reader/latin-pron.js).
const latinPronunciation = z.enum(['classical', 'ecclesiastical']).optional();

// Piece: top-level library entry. Either a loose .md at content/ root, or a
// folder's index.md. Surfaces in the library list.
export const PieceSchema = z.object({
  title: z.string().min(1, "title is required"),
  author: z.string().optional(),
  date: dateLike,
  tags: z.array(z.string()).optional(),
  summary: z.string().optional(),
  // Credit line (markdown, inline) shown at the foot of every page of the
  // piece; inherited by sub-pages. For licensed third-party text — e.g. a
  // CC BY licence's required attribution.
  attribution: z.string().optional(),
  source: z.string().url().optional(),
  latin_pronunciation: latinPronunciation,
  // The language the book is read in. `latin` gives every page the study
  // surface (Study button, guide entries, reference grammar in the popover).
  // Optional: a book with Latin-passage spans is detected as Latin anyway.
  language: z.enum(['latin']).optional(),
}).passthrough();

// Node: anything inside a Book — section index.md or a leaf chapter .md.
// No `tags` (tags live on the Book, not its sub-pages).
// `notes: true` marks a leaf as the book's glossary / footnote source.
export const NodeSchema = z.object({
  title: z.string().min(1, "title is required"),
  author: z.string().optional(),
  date: dateLike,
  summary: z.string().optional(),
  notes: z.boolean().optional(),
  attribution: z.string().optional(),
  // URL of the page's own source document, appended to the attribution footer.
  source: z.string().url().optional(),
  latin_pronunciation: latinPronunciation,
}).passthrough();

function formatIssues(issues) {
  return issues
    .map(i => `  ${i.path.length ? i.path.join('.') : '<root>'}: ${i.message}`)
    .join('\n');
}

export function validatePiece(filePath, data) {
  const result = PieceSchema.safeParse(data ?? {});
  if (!result.success) {
    throw new Error(`${filePath}: front matter validation failed:\n${formatIssues(result.error.issues)}`);
  }
  return result.data;
}

export function validateNode(filePath, data) {
  const result = NodeSchema.safeParse(data ?? {});
  if (!result.success) {
    throw new Error(`${filePath}: front matter validation failed:\n${formatIssues(result.error.issues)}`);
  }
  return result.data;
}

// A book's notes.json: editorial notes keyed by note slug, for books whose
// notes are imported as data rather than written as a notes page (e.g. Milton's
// History of Britain, ~1,700 annotations). `html` is the note body; `note:`
// links inside it become popover buttons like those in a notes page.
export const NotesJsonSchema = z.record(
  z.string().regex(/^[A-Za-z0-9][A-Za-z0-9_-]*$/, 'note keys must be id-safe'),
  z.object({
    title: z.string().min(1),
    html: z.string(),
  }).strict(),
);

export function validateNotesJson(filePath, data) {
  const result = NotesJsonSchema.safeParse(data);
  if (!result.success) {
    throw new Error(`${filePath}: notes.json validation failed:\n${formatIssues(result.error.issues)}`);
  }
  return result.data;
}

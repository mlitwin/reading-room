import { z } from 'zod';

// gray-matter parses YAML dates as JS Date objects; allow either form.
const dateLike = z.union([z.string(), z.date()]).optional();

// Piece: top-level library entry. Either a loose .md at content/ root, or a
// folder's index.md. Surfaces in the library list.
export const PieceSchema = z.object({
  title: z.string().min(1, "title is required"),
  author: z.string().optional(),
  date: dateLike,
  tags: z.array(z.string()).optional(),
  summary: z.string().optional(),
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

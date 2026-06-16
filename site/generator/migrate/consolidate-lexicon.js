#!/usr/bin/env node
// Phase 2 migration: read per-lemma JSONs from content/_latin-lexicon/, validate
// each against LemmaEntrySchema, sort by id, and emit a single consolidated
// lexicon.json under content/_language/latin/.
//
// Original per-lemma files are NOT deleted — moving them to an archive is left
// to a human commit so it can be reviewed separately. This script only writes
// the new file.
//
// Usage: node migrate/consolidate-lexicon.js [--out=path] [--strict]
//   --strict  fail on any schema validation error (default: warn and skip)

import { readFile, readdir, mkdir, writeFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';

import { LemmaEntrySchema, LexiconDocumentSchema } from '../schema/language.schema.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, '..', '..', '..');
const SOURCE_DIR = join(REPO_ROOT, 'content', '_latin-lexicon');
const DEFAULT_OUT = join(REPO_ROOT, 'content', '_language', 'latin', 'lexicon.json');

function summarizeIssues(issues, max = 5) {
  return issues
    .slice(0, max)
    .map((i) => `${i.path.length ? i.path.join('.') : '<root>'}: ${i.message}`)
    .join('; ');
}

async function main() {
  const { values } = parseArgs({
    options: {
      out: { type: 'string' },
      strict: { type: 'boolean', default: false },
    },
  });
  const outPath = values.out ?? DEFAULT_OUT;

  const files = (await readdir(SOURCE_DIR)).filter((f) => f.endsWith('.json'));
  files.sort();
  console.log(`reading ${files.length} files from ${SOURCE_DIR}`);

  const lemmata = [];
  const warnings = [];
  for (const file of files) {
    const path = join(SOURCE_DIR, file);
    const raw = await readFile(path, 'utf8');
    let data;
    try {
      data = JSON.parse(raw);
    } catch (e) {
      warnings.push(`${file}: invalid JSON: ${e.message}`);
      continue;
    }
    const result = LemmaEntrySchema.safeParse(data);
    if (!result.success) {
      const msg = `${file}: schema mismatch — ${summarizeIssues(result.error.issues)}`;
      if (values.strict) {
        console.error(msg);
        process.exit(1);
      }
      warnings.push(msg);
      continue;
    }
    lemmata.push(result.data);
  }

  lemmata.sort((a, b) => a.id.localeCompare(b.id));

  // Detect duplicates while we're here — final L1 validation will surface them too.
  const ids = new Set();
  const dupes = [];
  for (const l of lemmata) {
    if (ids.has(l.id)) dupes.push(l.id);
    ids.add(l.id);
  }
  if (dupes.length) {
    warnings.push(`duplicate IDs: ${dupes.slice(0, 5).join(', ')}${dupes.length > 5 ? '…' : ''}`);
  }

  const doc = { language_id: 'latin', lemmata };
  // Final whole-document validation.
  const docResult = LexiconDocumentSchema.safeParse(doc);
  if (!docResult.success) {
    console.error('document validation failed:', summarizeIssues(docResult.error.issues, 10));
    process.exit(1);
  }

  await mkdir(dirname(outPath), { recursive: true });
  await writeFile(outPath, JSON.stringify(doc, null, 2) + '\n', 'utf8');

  console.log(`wrote ${lemmata.length} lemmata to ${outPath}`);
  if (warnings.length) {
    console.warn(`\n${warnings.length} warning(s):`);
    for (const w of warnings.slice(0, 20)) console.warn(`  ${w}`);
    if (warnings.length > 20) console.warn(`  … and ${warnings.length - 20} more`);
  }
}

main().catch((err) => {
  console.error(err.stack ?? err);
  process.exit(2);
});

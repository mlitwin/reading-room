#!/usr/bin/env node
// Write the Reference Grammar URL baseline (section id → chapter page slug),
// validate/reference-urls.baseline.json. Invariant R9 fails the build when a
// section moves page or disappears, so published `…/reference/<slug>.html#sec-N`
// links can't break silently. Rerun this — and commit the result with the
// edit — only when a move is intended.
//
//   npm run reference:baseline

import { readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { referenceUrlMap } from './validate/reference-grammar.invariants.js';

const here = dirname(fileURLToPath(import.meta.url));
const REF = join(here, '..', '..', 'content', '_language', 'latin', 'reference-grammar.json');
export const BASELINE = join(here, 'validate', 'reference-urls.baseline.json');

if (import.meta.url === `file://${process.argv[1]}`) {
  const map = referenceUrlMap(JSON.parse(await readFile(REF, 'utf8')));
  await writeFile(BASELINE, JSON.stringify(map, null, 1) + '\n');
  console.log(`reference URL baseline: ${Object.keys(map).length} sections → ${BASELINE}`);
}

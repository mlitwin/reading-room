import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile, mkdtemp, rm, readdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import { buildManuscriptMd } from '../build-manuscript-md.js';
import { ManuscriptSchema } from '../schema/manuscript.schema.js';
import { CorrespondencesSchema } from '../schema/correspondences.schema.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, '..', '..', '..');
const TEXT_SLUG = 'ovid-metamorphoses';
const SOURCE_DIR = join(REPO_ROOT, 'content', TEXT_SLUG);

// The committed manuscript JSON sources must validate against the schemas
// — the build pipeline assumes valid input.
test('committed manuscript JSON validates against the schemas', async () => {
  const latin = JSON.parse(
    await readFile(join(SOURCE_DIR, 'manuscript.latin.json'), 'utf8'),
  );
  const english = JSON.parse(
    await readFile(join(SOURCE_DIR, 'manuscript.english.json'), 'utf8'),
  );
  const corr = JSON.parse(
    await readFile(join(SOURCE_DIR, 'correspondences.json'), 'utf8'),
  );

  // The latin manuscript carries a round-trip `__data_matches` stash on
  // multi-candidate tokens (parser/emitter coupling). Strip before
  // validation; the schema is the truthful shape.
  const stripped = {
    ...latin,
    lines: latin.lines.map((ln) => ({
      ...ln,
      tokens: ln.tokens.map(({ __data_matches, ...rest }) => rest),
    })),
  };

  const l = ManuscriptSchema.safeParse(stripped);
  if (!l.success) console.error(l.error.issues.slice(0, 5));
  assert.ok(l.success, 'latin manuscript');

  const e = ManuscriptSchema.safeParse(english);
  if (!e.success) console.error(e.error.issues.slice(0, 5));
  assert.ok(e.success, 'english manuscript');

  const c = CorrespondencesSchema.safeParse(corr);
  if (!c.success) console.error(c.error.issues.slice(0, 5));
  assert.ok(c.success, 'correspondences');
});

// Build determinism: emitting twice from the same JSON produces identical
// output. Catches accidental non-determinism in the emitter (timestamp
// leakage, map iteration order, etc.).
test('build-manuscript-md is deterministic across runs', async () => {
  let outA, outB;
  try {
    outA = await mkdtemp(join(tmpdir(), 'manuscript-md-a-'));
    outB = await mkdtemp(join(tmpdir(), 'manuscript-md-b-'));
    await buildManuscriptMd(TEXT_SLUG, outA, SOURCE_DIR);
    await buildManuscriptMd(TEXT_SLUG, outB, SOURCE_DIR);

    const filesA = (await readdir(outA)).sort();
    const filesB = (await readdir(outB)).sort();
    assert.deepEqual(filesA, filesB);

    for (const f of filesA) {
      const a = await readFile(join(outA, f), 'utf8');
      const b = await readFile(join(outB, f), 'utf8');
      assert.equal(a, b, `${f} differs between runs`);
    }
    assert.ok(filesA.length > 0, 'should emit at least one file');
  } finally {
    if (outA) await rm(outA, { recursive: true, force: true });
    if (outB) await rm(outB, { recursive: true, force: true });
  }
});

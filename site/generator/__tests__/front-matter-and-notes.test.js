import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { NotesJsonSchema, PieceSchema, NodeSchema } from '../schema.js';

const here = path.dirname(fileURLToPath(import.meta.url));

test('NotesJsonSchema accepts { key: { title, html } }', () => {
  const ok = NotesJsonSchema.safeParse({
    druids: { title: 'Druids', html: '<p>Ancient sources…</p>' },
    '942': { title: '18 years', html: '<p>See <a href="note:druids">x</a>.</p>' },
  });
  assert.equal(ok.success, true);
});

test('NotesJsonSchema rejects non-id-safe keys, missing titles, extra fields', () => {
  assert.equal(NotesJsonSchema.safeParse({ 'a b': { title: 't', html: '' } }).success, false);
  assert.equal(NotesJsonSchema.safeParse({ k: { html: '' } }).success, false);
  assert.equal(NotesJsonSchema.safeParse({ k: { title: 't', html: '', refs: [] } }).success, false);
});

test('attribution / source front matter: string + URL', () => {
  assert.equal(PieceSchema.safeParse({ title: 't', attribution: 'From *X*', source: 'https://e.org/a' }).success, true);
  assert.equal(NodeSchema.safeParse({ title: 't', source: 'not a url' }).success, false);
});

test('Milton notes.json validates', () => {
  const file = path.join(here, '../../../content/milton-history-of-britain/notes.json');
  const res = NotesJsonSchema.safeParse(JSON.parse(fs.readFileSync(file, 'utf8')));
  assert.equal(res.success, true, res.success ? '' : JSON.stringify(res.error.issues.slice(0, 3)));
});

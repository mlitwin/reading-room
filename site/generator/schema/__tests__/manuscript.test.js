import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  HierarchyLevelSchema,
  SectionPathSchema,
  LineRangeSchema,
  SectionSchema,
  WordTokenSchema,
  PunctTokenSchema,
  WsTokenSchema,
  TokenSchema,
  LineSchema,
  ManuscriptSchema,
} from '../manuscript.schema.js';
import { CorrespondencesSchema } from '../correspondences.schema.js';

// Small fixtures modelled on Ovid book 1 chapter 1's opening line.
const wordToken = {
  kind: 'word',
  surface: 'In',
  lemma_id: 'in_prep',
  parses: ['prep'],
  stanza: 'in_prep',
  pos_hint: 'prep',
};
const punctToken = { kind: 'punct', text: ', ' };
const wsToken = { kind: 'ws' };

const line = {
  n: 1,
  section: '1.01',
  tokens: [wordToken, punctToken, { ...wordToken, surface: 'nova', lemma_id: 'novus_adj', parses: ['nom.sg.fem'] }],
};

const section = {
  path: '1.01',
  level: 'chapter',
  label: 'Chapter 01',
  title: 'Proem; The Chaos Before Creation',
  line_range: [1, 22],
  notes: 'Editorial commentary in markdown.',
};

const manuscript = {
  text_id: 'ovid-metamorphoses',
  language_id: 'latin',
  title: 'Metamorphoses',
  author: 'Ovid',
  hierarchy: [
    { id: 'book', label: 'Book' },
    { id: 'chapter', label: 'Chapter' },
  ],
  sections: [
    { path: '1', level: 'book', label: 'Book I' },
    section,
  ],
  lines: [line],
};

const correspondences = {
  text_id: 'ovid-metamorphoses',
  pairs: [
    {
      source: 'latin',
      target: 'english',
      mappings: [
        { source: [1, 22], target: [1, 8] },
      ],
    },
  ],
};

// HierarchyLevel
test('HierarchyLevelSchema accepts {id, label}', () => {
  assert.ok(HierarchyLevelSchema.safeParse({ id: 'book', label: 'Book' }).success);
});
test('HierarchyLevelSchema rejects empty id', () => {
  assert.ok(!HierarchyLevelSchema.safeParse({ id: '', label: 'Book' }).success);
});

// SectionPath
test('SectionPathSchema accepts dot-separated alphanumerics', () => {
  for (const p of ['1', '1.01', 'A.B', 'cycle.story.episode', '12.34.56']) {
    assert.ok(SectionPathSchema.safeParse(p).success, `should accept ${p}`);
  }
});
test('SectionPathSchema rejects malformed paths', () => {
  for (const p of ['', '.', '1.', '.1', '1..2', '1.0_1', '1-01']) {
    assert.ok(!SectionPathSchema.safeParse(p).success, `should reject ${p}`);
  }
});

// LineRange
test('LineRangeSchema accepts non-decreasing positive tuples', () => {
  assert.ok(LineRangeSchema.safeParse([1, 1]).success);
  assert.ok(LineRangeSchema.safeParse([1, 22]).success);
});
test('LineRangeSchema rejects reversed, zero, or non-int ranges', () => {
  assert.ok(!LineRangeSchema.safeParse([22, 1]).success);
  assert.ok(!LineRangeSchema.safeParse([0, 5]).success);
  assert.ok(!LineRangeSchema.safeParse([1.5, 2]).success);
});

// Section
test('SectionSchema accepts a complete leaf section', () => {
  assert.ok(SectionSchema.safeParse(section).success);
});
test('SectionSchema accepts a non-leaf section without line_range', () => {
  assert.ok(SectionSchema.safeParse({ path: '1', level: 'book', label: 'Book I' }).success);
});
test('SectionSchema accepts a section with chapter-level translation', () => {
  assert.ok(SectionSchema.safeParse({ ...section, translation: 'My mind is bent…' }).success);
});

// Token kinds
test('WordTokenSchema requires the full word shape', () => {
  assert.ok(WordTokenSchema.safeParse(wordToken).success);
  assert.ok(!WordTokenSchema.safeParse({ ...wordToken, lemma_id: '' }).success);
  assert.ok(!WordTokenSchema.safeParse({ ...wordToken, parses: [] }).success);
});
test('PunctTokenSchema requires non-empty text', () => {
  assert.ok(PunctTokenSchema.safeParse({ kind: 'punct', text: ';' }).success);
  assert.ok(!PunctTokenSchema.safeParse({ kind: 'punct', text: '' }).success);
});
test('WsTokenSchema accepts bare {kind} or {kind, text}', () => {
  assert.ok(WsTokenSchema.safeParse({ kind: 'ws' }).success);
  assert.ok(WsTokenSchema.safeParse({ kind: 'ws', text: '\t' }).success);
});
test('TokenSchema discriminates on kind', () => {
  assert.ok(TokenSchema.safeParse(wordToken).success);
  assert.ok(TokenSchema.safeParse(punctToken).success);
  assert.ok(TokenSchema.safeParse(wsToken).success);
  assert.ok(!TokenSchema.safeParse({ kind: 'banana' }).success);
});

// Line
test('LineSchema accepts a line of mixed tokens', () => {
  assert.ok(LineSchema.safeParse(line).success);
});
test('LineSchema accepts an empty token array', () => {
  assert.ok(LineSchema.safeParse({ ...line, tokens: [] }).success);
});
test('LineSchema rejects non-positive line numbers', () => {
  assert.ok(!LineSchema.safeParse({ ...line, n: 0 }).success);
});

// Manuscript
test('ManuscriptSchema accepts the Ovid fixture', () => {
  const result = ManuscriptSchema.safeParse(manuscript);
  if (!result.success) console.error(result.error.issues);
  assert.ok(result.success);
});
test('ManuscriptSchema requires at least one section + one hierarchy level', () => {
  assert.ok(!ManuscriptSchema.safeParse({ ...manuscript, sections: [] }).success);
  assert.ok(!ManuscriptSchema.safeParse({ ...manuscript, hierarchy: [] }).success);
});
test('ManuscriptSchema accepts an English manuscript with empty lines + chapter translation', () => {
  const en = {
    ...manuscript,
    language_id: 'english',
    sections: [
      { path: '1', level: 'book', label: 'Book I' },
      { ...section, notes: undefined, translation: 'My mind is bent…' },
    ],
    lines: [],
  };
  assert.ok(ManuscriptSchema.safeParse(en).success);
});

// Correspondences
test('CorrespondencesSchema accepts a single-pair fixture', () => {
  assert.ok(CorrespondencesSchema.safeParse(correspondences).success);
});
test('CorrespondencesSchema requires at least one pair', () => {
  assert.ok(!CorrespondencesSchema.safeParse({ ...correspondences, pairs: [] }).success);
});
test('CorrespondencesSchema accepts a pair with zero mappings (not yet aligned)', () => {
  assert.ok(CorrespondencesSchema.safeParse({
    ...correspondences,
    pairs: [{ source: 'latin', target: 'english', mappings: [] }],
  }).success);
});
test('CorrespondencesSchema rejects malformed mapping ranges', () => {
  assert.ok(!CorrespondencesSchema.safeParse({
    ...correspondences,
    pairs: [{ source: 'latin', target: 'english', mappings: [{ source: [5, 1], target: [1, 1] }] }],
  }).success);
});

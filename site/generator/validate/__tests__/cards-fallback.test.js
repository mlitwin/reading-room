// Cold-path drift guard: site/reader/cards.js carries hardcoded fallback
// copies of the grammar-derived parse-token / person / pos maps, used before
// grammar.json loads (first paint, file://, fetch failure). This test keeps
// them covering every grammar.json value so a new grammar atom can't render
// as a dead unlabelled chip on the cold path.
//
// (The long-term fix is generating the fallbacks at build time — see
// development/latin-support-analysis.md Phase 3 item 10; until then this
// test is the tripwire.)

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const cardsSrc = readFileSync(join(here, '../../../reader/cards.js'), 'utf8');
const grammar = JSON.parse(readFileSync(
  join(here, '../../../../content/_language/latin/grammar.json'), 'utf8'));

function mapKeys(varName) {
  const start = cardsSrc.indexOf(`var ${varName} = {`);
  assert.notEqual(start, -1, `${varName} not found in cards.js`);
  const end = cardsSrc.indexOf('};', start);
  const block = cardsSrc.slice(start, end);
  const keys = new Set();
  for (const m of block.matchAll(/(?:^|[{,])\s*'?([A-Za-z0-9_]+)'?\s*:/gm)) keys.add(m[1]);
  return keys;
}

const parseKeys = mapKeys('FALLBACK_PARSE_TOKEN_MAP');
const personKeys = mapKeys('FALLBACK_PERSON_MAP');
const posKeys = mapKeys('FALLBACK_POS_NOTE');

test('every grammar.json value id is covered by the cards.js fallback maps', () => {
  const missing = [];
  for (const cat of grammar.categories) {
    for (const v of cat.values) {
      if (cat.id === 'person') {
        if (!personKeys.has(v.id)) missing.push(`person:${v.id}`);
      } else if (cat.id === 'pos') {
        // pos ids appear in POS_NOTE; the enclitic pos also has the span-side
        // 'enclit' spelling in the parse map.
        if (!posKeys.has(v.id)) missing.push(`pos:${v.id}`);
      } else {
        if (!parseKeys.has(v.id)) missing.push(`${cat.id}:${v.id}`);
      }
    }
  }
  assert.deepEqual(missing, [], `grammar values missing from fallbacks: ${missing.join(', ')}`);
});

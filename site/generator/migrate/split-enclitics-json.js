#!/usr/bin/env node
// JSON-native replacement for split-enclitics.js.
//
// Walks manuscript.latin.json word tokens whose surface ends in an enclitic
// suffix (-que / -ve). When the host (surface minus suffix) is a known glossary
// form, the token is split into two adjacent tokens: the host token (surface
// trimmed) followed by an enclitic token. Handles the __data_matches stash so
// edits survive the next make manuscript-md.
//
// Skips tokens where the full surface is a paradigm form of one of its
// candidates (false positives like "quaeque" for quisque_pron).
//
// Usage: node migrate/split-enclitics-json.js [--dry-run]

import { readFile, writeFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';

import { normalizeSurface } from '../lib/normalize.js';
import { ManuscriptSchema } from '../schema/manuscript.schema.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, '..', '..', '..');
const LEXICON_PATH = join(REPO_ROOT, 'content', '_language', 'latin', 'lexicon.json');
const MS_PATH = join(REPO_ROOT, 'content', 'ovid-metamorphoses', 'manuscript.latin.json');

const ENCLITICS = [
  { suffix: 'que', lemma_id: 'que_enclit' },
  { suffix: 've', lemma_id: 've_enclit' },
];

function collectKnownForms(lexicon) {
  const known = new Set();
  for (const lemma of lexicon.lemmata) {
    known.add(normalizeSurface(lemma.lemma));
    for (const which of ['paradigm', 'ppp_paradigm']) {
      const p = lemma[which];
      if (!p?.cells) continue;
      for (const value of Object.values(p.cells)) {
        const forms = Array.isArray(value) ? value : [value];
        for (const f of forms) known.add(normalizeSurface(f));
      }
    }
    for (const f of (lemma.alt_forms ?? [])) known.add(normalizeSurface(f));
  }
  return known;
}

function detectEnclitic(surface) {
  for (const e of ENCLITICS) {
    if (surface.length > e.suffix.length && surface.endsWith(e.suffix)) {
      return { ...e, host: surface.slice(0, -e.suffix.length) };
    }
  }
  return null;
}

function getLemmaIds(tok) {
  if (tok.__data_matches) {
    return tok.__data_matches.split(';').map((g) => {
      const ix = g.indexOf(':');
      return ix >= 0 ? g.slice(0, ix).trim() : null;
    }).filter(Boolean);
  }
  return [tok.lemma_id];
}

async function main() {
  const { values } = parseArgs({ options: { 'dry-run': { type: 'boolean' } } });
  const dryRun = values['dry-run'] ?? false;

  const lex = JSON.parse(await readFile(LEXICON_PATH, 'utf8'));
  const known = collectKnownForms(lex);

  const raw = JSON.parse(await readFile(MS_PATH, 'utf8'));
  let totalSplits = 0;
  let totalSkipped = 0;
  const splitsBySurface = {};
  const skippedSurfaces = {};

  for (const line of raw.lines) {
    const newTokens = [];
    for (const tok of line.tokens) {
      if (tok.kind !== 'word') { newTokens.push(tok); continue; }

      const surface = normalizeSurface(tok.surface);
      const enc = detectEnclitic(surface);
      if (!enc) { newTokens.push(tok); continue; }

      // Skip if the surface itself is a known paradigm form.
      if (known.has(surface)) { newTokens.push(tok); continue; }

      if (!known.has(enc.host)) {
        skippedSurfaces[tok.surface] = (skippedSurfaces[tok.surface] || 0) + 1;
        totalSkipped++;
        newTokens.push(tok);
        continue;
      }

      // Split: trim enclitic from the surface (preserving case).
      const hostSurface = tok.surface.slice(0, tok.surface.length - enc.suffix.length);
      const encSurface = tok.surface.slice(tok.surface.length - enc.suffix.length);

      // Build the host token: keep all fields, update surface only.
      const hostTok = { ...tok, surface: hostSurface };

      // Build the enclitic token.
      const encTok = {
        kind: 'word',
        surface: encSurface,
        lemma_id: enc.lemma_id,
        parses: ['enclit'],
        stanza: enc.lemma_id,
        pos_hint: 'enclitic',
      };

      splitsBySurface[tok.surface] = (splitsBySurface[tok.surface] || 0) + 1;
      totalSplits++;
      newTokens.push(hostTok, encTok);
    }
    line.tokens = newTokens;
  }

  const stripped = {
    ...raw,
    lines: raw.lines.map((ln) => ({
      ...ln,
      tokens: ln.tokens.map(({ __data_matches, ...rest }) => rest),
    })),
  };
  ManuscriptSchema.parse(stripped);

  if (!dryRun) await writeFile(MS_PATH, JSON.stringify(raw, null, 2) + '\n', 'utf8');
  console.log(`${dryRun ? '[dry-run] ' : ''}split ${totalSplits} tokens`);
  for (const [s, n] of Object.entries(splitsBySurface).sort((a, b) => b[1] - a[1])) console.log(`  ${s}: ${n}`);
  if (totalSkipped) {
    console.log(`${totalSkipped} tokens skipped (host not a known glossary form):`);
    for (const [s, n] of Object.entries(skippedSurfaces).sort((a, b) => b[1] - a[1])) console.log(`  ${s}: ${n}`);
  }
}

main().catch((err) => { console.error(err.stack ?? err); process.exit(1); });

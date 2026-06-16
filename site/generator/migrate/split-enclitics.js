#!/usr/bin/env node
// Editorial backlog step C10. Walk content/ovid-metamorphoses/*.md and split
// host+que / host+ve spans into adjacent spans when the host (without the
// enclitic) is a known glossary surface.
//
// Per-span transformation:
//   <span data-matches="flumen_n:nom.pl.neut,...">fluminaque</span>
//   →
//   <span data-matches="flumen_n:nom.pl.neut,...">flumina</span><span data-matches="que_enclit:enclit">que</span>
//
// The host's data-matches and other attributes are preserved verbatim; the
// surface text shrinks. A new span for the enclitic gets the standard
// que_enclit / ve_enclit tagging.
//
// Skips spans where:
//   - host is not a known glossary surface (likely false positive),
//   - the surface itself is a paradigm cell of a candidate lemma (e.g.
//     "quaeque" tagged as quisque_pron).
//
// Usage: node migrate/split-enclitics.js [--dry-run]
//
// Re-run build-concordance afterwards (or just `make build`).

import { readFile, readdir, writeFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';

import { normalizeSurface } from '../lib/normalize.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, '..', '..', '..');
const LEXICON_PATH = join(REPO_ROOT, 'content', '_language', 'latin', 'lexicon.json');
const OVID_DIR = join(REPO_ROOT, 'content', 'ovid-metamorphoses');

const ENCLITICS = [
  { suffix: 'que', lemma_id: 'que_enclit' },
  { suffix: 've', lemma_id: 've_enclit' },
];

// Same pattern as build-concordance.js so we walk the same spans.
const SPAN_RE = /<span\b([^>]*?)>([^<]*)<\/span>/g;
const ATTR_RE = /([a-zA-Z][\w-]*)\s*=\s*"([^"]*)"/g;

function parseAttributes(attrBlock) {
  const out = {};
  ATTR_RE.lastIndex = 0;
  let m;
  while ((m = ATTR_RE.exec(attrBlock))) out[m[1]] = m[2];
  return out;
}

function collectKnownForms(lexicon) {
  // normalized form → Set<lemma_id> for surfaces that appear as either the
  // citation form or a paradigm cell of any lemma.
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

async function main() {
  const { values } = parseArgs({ options: { 'dry-run': { type: 'boolean' } } });
  const dryRun = values['dry-run'] ?? false;

  const lex = JSON.parse(await readFile(LEXICON_PATH, 'utf8'));
  const known = collectKnownForms(lex);

  const files = (await readdir(OVID_DIR)).filter((f) => f.endsWith('.md'));
  let totalSplits = 0;
  let totalSkipped = 0;
  const splitsBySurface = {};
  const skippedSurfaces = {};

  for (const file of files) {
    const path = join(OVID_DIR, file);
    const orig = await readFile(path, 'utf8');
    let changed = false;
    const next = orig.replace(SPAN_RE, (match, attrBlock, inner) => {
      const surface = normalizeSurface(inner);
      const enc = detectEnclitic(surface);
      if (!enc) return match;
      // Skip if the surface itself is a known paradigm form (false positives
      // like "quaeque" = quisque_pron form).
      if (known.has(surface)) return match;
      if (!known.has(enc.host)) {
        skippedSurfaces[inner] = (skippedSurfaces[inner] || 0) + 1;
        totalSkipped += 1;
        return match;
      }
      // Strip the enclitic letters from the original (preserves case).
      const hostInner = inner.slice(0, inner.length - enc.suffix.length);
      const encInner = inner.slice(inner.length - enc.suffix.length);
      changed = true;
      splitsBySurface[inner] = (splitsBySurface[inner] || 0) + 1;
      totalSplits += 1;
      return `<span${attrBlock}>${hostInner}</span><span data-matches="${enc.lemma_id}:enclit" data-pos="enclitic" data-stanza="${enc.lemma_id}">${encInner}</span>`;
    });
    if (changed && !dryRun) {
      await writeFile(path, next, 'utf8');
    }
  }

  console.log(`${dryRun ? '[dry-run] ' : ''}split ${totalSplits} spans across files`);
  const splitList = Object.entries(splitsBySurface).sort((a, b) => b[1] - a[1]);
  for (const [s, n] of splitList) console.log(`  ${s}: ${n}`);
  if (totalSkipped) {
    console.log(`${totalSkipped} spans skipped (host not a known glossary form):`);
    for (const [s, n] of Object.entries(skippedSurfaces).sort((a, b) => b[1] - a[1])) {
      console.log(`  ${s}: ${n}`);
    }
  }
}

main().catch((err) => {
  console.error(err.stack ?? err);
  process.exit(1);
});

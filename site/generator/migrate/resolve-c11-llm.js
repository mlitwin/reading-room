#!/usr/bin/env node
// Stage 2 of the C11 (homograph disambiguation) pipeline. Reads the JSONL
// worklist produced by extract-c11-worklist.js, asks Claude (sonnet 4.6 by
// default) to pick the right lemma_id for each multi-candidate token given
// line context + candidate glosses, and writes a JSONL of resolutions
// consumed by apply-c11-resolutions-json.js (Stage 3).
//
// Why this is well-suited to an LLM: each request is pick-from-list. The
// model is constrained to return a structured object whose selected_lemma_id
// must be one of the candidate IDs supplied in the user message; the script
// validates this on receive and drops anything off-list.
//
// Cost discipline:
//   - Sequential calls with prompt caching on the system prompt so the
//     per-call cost is dominated by the small per-token user message.
//   - low-confidence picks are dropped unless --include-low is passed.
//   - Off-list picks are always dropped (would fail C4 invariant).
//
// Auth: ANTHROPIC_API_KEY env var (or apple.env-style `op://` ref resolved
// by your shell — this script just reads the env).
//
// Usage:
//   node migrate/resolve-c11-llm.js
//   node migrate/resolve-c11-llm.js --in=<worklist> --out=<resolutions>
//                                   --model=claude-sonnet-4-6
//                                   --max-tokens=4 --include-low

import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';

import Anthropic from '@anthropic-ai/sdk';

const __dirname = dirname(fileURLToPath(import.meta.url));
const GENERATOR_ROOT = join(__dirname, '..');

const DEFAULT_IN  = join(GENERATOR_ROOT, '.build', 'c11-worklist.jsonl');
const DEFAULT_OUT = join(GENERATOR_ROOT, '.build', 'c11-resolutions.jsonl');
const DEFAULT_MODEL = 'claude-sonnet-4-6';

// System prompt is stable across all calls — eligible for the prompt cache.
// Keep it short enough to be useful but long enough to anchor the model on
// the task. The model gets the surrounding line(s) and a candidate list with
// glosses, and must pick the lemma_id whose meaning best fits the context.
const SYSTEM_PROMPT = `You are a Latin philologist disambiguating Ovid's Metamorphoses, Book 1.

For each token, you receive:
- The target Latin surface form (wrapped in [[double brackets]] in the line text).
- The line it appears in, plus the previous and next lines for context.
- A list of candidate lemmata, each with its citation form, part of speech, possible parse codes, and English glosses.

Your job: pick the candidate whose meaning + grammar best fits the line in context. Return ONLY the JSON object described in the output schema — no prose, no preamble.

Rules:
- selected_lemma_id MUST exactly match one of the candidate lemma_id strings supplied in the user message.
- Set selected_lemma_id to null and confidence to "low" if the context is genuinely insufficient to choose (e.g. the line is too fragmentary, or both senses are equally plausible).
- confidence: "high" when the context decisively rules out alternatives; "medium" when one reading is clearly preferred but the other is not impossible; "low" when you are guessing.
- rationale: one short sentence (≤25 words) naming the contextual cue that drove the choice (collocation, syntactic role, agreement, etc.).

You are not translating. You are not commenting on the poem. Pick the lemma. Return JSON.`;

// JSON Schema for the structured response. Keys mirror the apply step's
// expectations. additionalProperties:false is required by output_config.
const RESPONSE_SCHEMA = {
  type: 'object',
  properties: {
    token_ref: { type: 'string' },
    selected_lemma_id: { type: ['string', 'null'] },
    confidence: { type: 'string', enum: ['high', 'medium', 'low'] },
    rationale: { type: 'string' },
  },
  required: ['token_ref', 'selected_lemma_id', 'confidence', 'rationale'],
  additionalProperties: false,
};

function loadJsonl(text) {
  return text
    .split('\n')
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s) => JSON.parse(s));
}

function renderUserMessage(record) {
  const candidateLines = record.candidates.map((c, i) => {
    const glosses = c.glosses.length ? c.glosses.join('; ') : '(no gloss available)';
    return `  ${i + 1}. lemma_id="${c.lemma_id}" — ${c.lemma} (${c.pos}), parses: ${c.parses.join(', ')}\n     glosses: ${glosses}`;
  }).join('\n');

  const prev = record.prev_line ? `Previous line: ${record.prev_line}\n` : '';
  const next = record.next_line ? `Next line: ${record.next_line}\n` : '';

  return `token_ref: ${record.token_ref}
surface: ${record.surface}

${prev}Target line: ${record.line_text}
${next}
Candidates:
${candidateLines}

Pick the candidate lemma_id that best fits the context. Return JSON only.`;
}

async function resolveOne(client, model, record) {
  const candidateIds = new Set(record.candidates.map((c) => c.lemma_id));

  const response = await client.messages.create({
    model,
    max_tokens: 512,
    system: [
      {
        type: 'text',
        text: SYSTEM_PROMPT,
        cache_control: { type: 'ephemeral' },
      },
    ],
    messages: [{ role: 'user', content: renderUserMessage(record) }],
    output_config: {
      format: { type: 'json_schema', schema: RESPONSE_SCHEMA },
    },
  });

  const textBlock = response.content.find((b) => b.type === 'text');
  if (!textBlock) throw new Error('no text block in response');

  let parsed;
  try { parsed = JSON.parse(textBlock.text); }
  catch (e) { throw new Error(`malformed JSON in response: ${e.message}\n${textBlock.text}`); }

  // Server-side validation of the model's pick:
  // 1. token_ref must echo what we sent — guards against schema drift.
  // 2. selected_lemma_id (if non-null) must be in the candidate list. The
  //    apply step would silently drop off-list picks, but flagging them
  //    here makes the cost visible.
  if (parsed.token_ref !== record.token_ref) {
    parsed.token_ref = record.token_ref; // correct & continue
  }
  if (parsed.selected_lemma_id !== null
      && !candidateIds.has(parsed.selected_lemma_id)) {
    parsed.selected_lemma_id = null;
    parsed.confidence = 'low';
    parsed.rationale = `[off-list pick dropped] ${parsed.rationale}`;
  }

  return { parsed, usage: response.usage };
}

async function main() {
  const { values } = parseArgs({
    options: {
      in:  { type: 'string' },
      out: { type: 'string' },
      model: { type: 'string' },
      'max-tokens': { type: 'string' }, // cap total tokens processed (debug)
      'include-low': { type: 'boolean' },
      'dry-run': { type: 'boolean' },
    },
  });

  if (!process.env.ANTHROPIC_API_KEY && !values['dry-run']) {
    console.error('ANTHROPIC_API_KEY not set. Use --dry-run to test the worklist load path without calling the API.');
    process.exit(2);
  }

  const inPath  = values.in  ?? DEFAULT_IN;
  const outPath = values.out ?? DEFAULT_OUT;
  const model   = values.model ?? DEFAULT_MODEL;
  const maxTokensCap = values['max-tokens'] ? Number(values['max-tokens']) : Infinity;
  const includeLow = values['include-low'] ?? false;
  const dryRun = values['dry-run'] ?? false;

  const records = loadJsonl(await readFile(inPath, 'utf8'));
  console.log(`loaded ${records.length} worklist records from ${inPath}`);
  if (records.length > maxTokensCap) {
    console.log(`capping at ${maxTokensCap} for this run`);
  }

  if (dryRun) {
    console.log('[dry-run] not calling the API. Sample user message:');
    console.log('---');
    console.log(renderUserMessage(records[0]));
    console.log('---');
    return;
  }

  const client = new Anthropic();
  await mkdir(dirname(outPath), { recursive: true });

  let written = 0;
  let droppedLow = 0;
  let droppedAbstain = 0;
  let totalInputTokens = 0;
  let totalOutputTokens = 0;
  let totalCacheReadTokens = 0;
  let totalCacheCreationTokens = 0;
  // Open output file in append mode so re-runs accumulate; apply step
  // dedupes by token_ref keeping the latest.
  const outChunks = [];

  const N = Math.min(records.length, maxTokensCap);
  for (let i = 0; i < N; i += 1) {
    const rec = records[i];
    try {
      const { parsed, usage } = await resolveOne(client, model, rec);
      totalInputTokens += usage.input_tokens ?? 0;
      totalOutputTokens += usage.output_tokens ?? 0;
      totalCacheReadTokens += usage.cache_read_input_tokens ?? 0;
      totalCacheCreationTokens += usage.cache_creation_input_tokens ?? 0;

      if (parsed.selected_lemma_id === null) {
        droppedAbstain += 1;
      } else if (parsed.confidence === 'low' && !includeLow) {
        droppedLow += 1;
      } else {
        outChunks.push(JSON.stringify(parsed));
        written += 1;
      }
      const tag = parsed.selected_lemma_id ?? '(abstain)';
      console.log(`[${i + 1}/${N}] ${rec.token_ref} "${rec.surface}" → ${tag} (${parsed.confidence})`);
    } catch (err) {
      console.warn(`[${i + 1}/${N}] ${rec.token_ref} ERROR: ${err.message}`);
    }
  }

  await writeFile(outPath, outChunks.join('\n') + (outChunks.length ? '\n' : ''), 'utf8');

  console.log('---');
  console.log(`wrote ${written} resolutions → ${outPath}`);
  console.log(`  abstained (LLM null): ${droppedAbstain}`);
  console.log(`  dropped (low confidence, no --include-low): ${droppedLow}`);
  console.log(`  cache: read=${totalCacheReadTokens} created=${totalCacheCreationTokens}`);
  console.log(`  tokens: input=${totalInputTokens} output=${totalOutputTokens}`);
}

main().catch((err) => { console.error(err.stack ?? err); process.exit(1); });

# Validation Backlog

`make validate` as of 2026-06-26: **0 errors, 0 warnings** — all invariants PASS.

```
✓ grammar (G1–G3)
✓ lexicon (L1–L9, L8a)
✓ glossary (Gl1–Gl5)
✓ concordance (C1–C11)
```

---

## Placeholder lexicon curation (2026-06-26)

Closed the 64 `"placeholder pending lexicon curation"` stubs in
`content/_language/latin/lexicon.json`. Most were mis-lemmatized (lemma stored
as an inflected form, paradigm auto-generated against the wrong declension/POS),
not merely missing glosses. Three-step tooling under `site/latin/`:

1. `draft_placeholder_curation.py` → `staging/placeholder-worklist.json`:
   gathers each stub's manuscript usage (surfaces + line refs) and a Whitaker's
   WORDS draft. 41/64 drafted by WORDS; 23 needed Lewis & Short.
2. `curate_placeholders.py` (+ `ls_lookup.py` over the vendored
   `sources/lewis-short-json/`, gitignored): authored editorial decisions
   (citation form, POS, gender/principal parts, concise glosses), generated
   complete paradigms (deterministic regular decliners/conjugators with a
   seed_vocab/DICTLINE fallback; hand-built pronouns/Greek nouns/defectives),
   and surface-coverage-checked every manuscript token against the new cells.
   → `staging/placeholder-corrections.json`.
3. `apply_placeholder_curation.py`: writes the corrections into `lexicon.json`,
   deletes the orphan `molleo_adv`, adds `ultra_adv` + `decens_adj`, re-points
   the 3 conflated manuscript tokens (2× `ultra`, 1× `decens`), and reconciles
   every affected token's candidate `parses`/`pos_hint` against the corrected
   paradigms (gender-stamped to match `build-glossary`'s `genderStampParses`).

Rebuild after applying: `make manuscript-md && (cd site/generator && node build.js)`
regenerates the gitignored book `.md`, then the glossary/concordance/docs assets.

The glosses are drafted/mechanical (cross-checked against WORDS + L&S) and still
want a human editorial read. Notable judgement calls flagged in the entries'
`notes`: `occido` (fall/die, not occīdo kill); `decet` verb vs the split-off
`decens_adj`; `Zephyrus` noun (L108 nom.pl subject, not the adjective); `siquis`
kept as a merged-token indefinite.

The `reviewed` lemma field was removed entirely on 2026-06-26 (schema, data, and
tooling) — the project isn't doing per-lemma editorial sign-off yet.

---

## What changed (2026-06-17 → 2026-06-18)

Starting point: 100 warnings (C2: 6, C11: 94). Three migrate scripts and one
LLM disambiguation pass closed everything.

### `migrate/dismiss-defective-candidates-json.js` — C2 6 → 1

Token-level rewrites for cases where the morphological analyzer offered a
spurious defective-verb candidate. Rules:

- surface `"in"` × `inquam_v` → `in_prep` (4 tokens). The editorial reading
  "inque" = imperative of inquam is wrong; inquam is defective and has no
  imperative cell. The surface is just `in` + the enclitic `-que`.
- surface `"aderis"` × `ador_v` → drop the candidate (1 token). `adoro`'s
  2sg.pres.subj.pass is `adoreris`, not `aderis`; the real lemma is `adsum_v`
  2sg.fut.ind.act.

### C11 pipeline — 94 → 0

Three stages chained as `npm run c11`:

1. `migrate/extract-c11-worklist.js` walks `manuscript.latin.json`, computes
   the per-section span index that matches the concordance's `b{book}-{chapter}-{NNN}`
   token-ref format, and emits a JSONL worklist of every multi-candidate token
   with no `selected_lemma_id`. Each record carries the target line text with
   the surface wrapped in `[[…]]`, the previous and next lines, and each
   candidate's lemma / pos / parses / glosses from `lexicon.json`.
2. `migrate/resolve-c11-llm.js` calls the Anthropic SDK
   (`claude-sonnet-4-6` with prompt caching on the system prompt and
   structured-JSON output) for each record. The 2026-06-18 run used a local
   subagent instead — same result, no API cost — so the SDK script is the
   long-term path but doesn't need to be invoked for this corpus.
3. `migrate/apply-c11-resolutions-json.js` reads the resolutions JSONL and
   writes `selected_lemma_id` back to the appropriate word tokens in
   `manuscript.latin.json`. It refuses to overwrite a prior editorial decision
   and silently drops resolutions whose proposed lemma is off the candidate
   list (C4 would flag the inconsistency otherwise). After applying, it
   regenerates the gitignored chapter markdown so `build.js` picks the
   changes up.

### `migrate/fill-lexicon-gaps.js` — C2 1 → 0, plus collateral cleanups

The disambiguation pass surfaced a handful of cases where the analyzer's
candidate list was insufficient because the right lemma was missing from
`lexicon.json`. This script:

- Adds five new lemmata: `solum_n` (2nd-decl neut, "ground/soil"), `vetus_adj`
  (3rd-decl 1-termination, "old"), `late_adv` (invariant, "broadly"),
  `victus_n` (4th-decl masc, "sustenance"), `lenis_adj` (3rd-decl 2-termination,
  "gentle"). Each carries a full paradigm modelled on an existing same-shape
  entry.
- Corrects two existing entries: `sol_n` glosses were mis-attached (described
  *solum*, "ground") and got rewritten to "the sun"; `quis_pron`'s placeholder
  gloss got replaced with the real interrogative/indefinite glosses.
- Rewrites seven manuscript word tokens (`molles` → `molle_adj`, `humana` →
  `humani_adj`, `solum` → `solum_n`, `veteris` → `vetus_adj`, `late` →
  `late_adv`, `victu` → `victus_n`, `lenis` → `lenis_adj`) so each becomes
  single-candidate with the correct lemma. The two `quo` tokens flagged in the
  same investigation didn't need rewriting once `quis_pron` got a real gloss.
- Regenerates the chapter markdown.

The script is idempotent: re-running after a successful run is a no-op
(presence of each new lemma id and each rewrite's target are both checked).

---

## Reusable migrate scripts

The scripts in `site/generator/migrate/` cover the four classes of repair
this corpus has needed so far. Re-run as the lexicon or manuscript evolves.

### `prune-spurious-parses-json.js`
Removes parse codes from manuscript tokens when the candidate lemma's paradigm
doesn't actually yield that surface.

```
node site/generator/migrate/prune-spurious-parses-json.js [--dry-run]
```

### `split-enclitics-json.js`
Splits word tokens whose surface ends in `-que` or `-ve` into a host token +
an enclitic token. Only splits when the host form is already a known glossary
entry.

```
node site/generator/migrate/split-enclitics-json.js [--dry-run]
```

### `clean-pos-hints-json.js`
Aligns each token's `pos_hint` field with the actual POS of its first
candidate lemma.

```
node site/generator/migrate/clean-pos-hints-json.js [--dry-run]
```

### `dismiss-defective-candidates-json.js`
Corrects tokens whose lemma assignment is a morphologically spurious
defective-verb candidate. Rule table at the top of the script — append to it
when a new defective-cell collision shows up.

```
node site/generator/migrate/dismiss-defective-candidates-json.js [--dry-run]
```

### `fill-lexicon-gaps.js`
One-shot lexicon-gap repair: new lemmata + gloss fixes + token rewrites. The
arrays at the top of the file are the canonical record of what got added and
why; future similar gaps should extend the same script.

```
node site/generator/migrate/fill-lexicon-gaps.js [--dry-run]
```

---

## C11 pipeline scripts

### `extract-c11-worklist.js`
Walks the manuscript, emits multi-candidate tokens with full line context for
disambiguation.

```
node site/generator/migrate/extract-c11-worklist.js
```

### `resolve-c11-llm.js`
Calls the Anthropic SDK to resolve each worklist record. Sonnet 4.6, prompt
caching, structured JSON output, off-list/low-confidence drops. Requires
`ANTHROPIC_API_KEY`. For one-shot corpus runs, delegating to a local
subagent via the Agent tool produces equivalent quality at no API cost.

```
node site/generator/migrate/resolve-c11-llm.js [--max-tokens=N] [--include-low]
```

### `apply-c11-resolutions-json.js`
Reads the resolutions JSONL, writes `selected_lemma_id` back to the
manuscript, refuses to overwrite prior editorial decisions, regenerates the
chapter markdown.

```
node site/generator/migrate/apply-c11-resolutions-json.js [--dry-run]
```

### Full chain

```
npm --prefix site/generator run c11
```

Runs `c11:extract` → `c11:resolve` → `c11:apply` → `build` → `validate`.

---

## Adding new lexicon entries

1. Edit `content/_language/latin/lexicon.json` directly, or extend
   `fill-lexicon-gaps.js` with the new entries.
2. If the new lemma's surface appears in the text with an enclitic, re-run
   `split-enclitics-json.js`.
3. If existing manuscript tokens now have stale parse codes, re-run
   `prune-spurious-parses-json.js`.
4. Run `node site/generator/build.js` to rebuild all stored assets.
5. Run `node site/generator/validate.js` to check invariants.
6. If new multi-candidate tokens surface, run `npm run c11` to disambiguate
   them.

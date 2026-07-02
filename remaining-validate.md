# Validation Backlog

`make validate` as of 2026-07-02: **0 errors, 0 warnings** — all invariants
PASS, now across **both** texts (the concordance suite iterates every text
with a `manuscript.latin.json`; it previously validated only Ovid).

```
✓ grammar (G1–G4)
✓ lexicon (L1–L11, L8a)   — over the merged shared+overlay lexicon
✓ glossary (Gl1–Gl6)      — glossary now includes overlay vocabulary
✓ concordance/marvell-hortus (C1–C12)
✓ concordance/ovid-metamorphoses (C1–C12)
✓ vocabulary (V1–V3)      — against the shared-only lexicon (V2 shadowing)
```

---

## Marvell apparatus hardening + shared-grid repairs (2026-07-02)

The marvell concordance had been outside the validation fence (validate
defaulted to Ovid) and the overlay vocabulary outside the glossary — a reader
tapping *praecingat* got a card with no present subjunctive at all. Closing
the fence exposed ~248 warnings; `site/latin/expand_overlay_grids.py`
(idempotent) closed them:

- **24 overlay verbs regenerated** as full grids by three-stem transform from
  the shared 173-cell templates (fabrico/rego/audio/conor/sequor); potior_v
  built from audio's passive morphology; memini_v got its perfect-system
  defective grid; potis/quisnam/concolor/cancer/civis hand grids
  (cancer had been declined 3rd-declension against its own head).
- **Shared-lexicon systematic repairs** the fence-closing surfaced:
  - `eo_v` was a fabricated first-conjugation card ("eas, eabat, eare")
    hidden behind 17 alt_forms — rebuilt from redeo_v; abeo/coeo/depereo
    regenerated as prefix+eo.
  - **50 `-io` verbs** (audio, venio, sentio, patior…) had generator-mangled
    imperfects ("audbat"), futures ("audibit"), 4th-conj infinitive cells
    ("reperere"), passive imperfect subjunctives ("auderer") — all
    regenerated from the i-stem.
  - **11 ire-compounds** had participle obliques and gerunds on the wrong
    stem (redientem, rediendi → redeuntem, redeundi).
  - **91 third-declension nouns** offered only the i-stem -is accusative
    plural; the -es form is now primary (the -is variant is kept — Ovid's
    tokens attest it for genuine i-stems).
  - **186 noun/adj grids** filled in missing vocatives (voc.pl = nom.pl;
    voc.sg per A&G §49.c; Greek nominatives left to the renderer's voc→nom
    fallback).
- **Marvell manuscript reconciled**: 85 pos_hints fixed, 20 multi-candidate
  tokens got editorial selected_lemma_id, 5 tokens re-pointed (lapsus →
  new `lapsus_n` 4th-decl noun, comparatives *potiori*/*candidior* onto new
  `comp.` grids, conscie/cancri junk parses), Neo-Latin orthography and
  syncopated perfects (sylua, quoties, unquam, celarant, notasti…) added as
  variant forms on exactly the attested cells, and every candidate's parses
  recomputed to match its cells (164 tokens canonicalized).
- **serve.js stale-cache bug fixed**: `build()` now resets the module-level
  lexicon caches, so watcher rebuilds in a long-running `make serve` no
  longer regenerate every derived asset from pre-edit data (this was
  intermittently clobbering fresh builds during the session; the running
  server was restarted with the fix).
- **Dictionary-orthography cleanup**: the variant-cell repair initially
  stored token surfaces verbatim, leaking Marvell's typographic capitals
  ("Sylva", "Arbos") onto common-noun cards as if they were proper names —
  16 variants lowercased, and the rule is now part of the script (proper-noun
  lemmata keep their capitals; patronymic alt_forms like Inachides untouched).
  The audit also caught "Consortia" (line 19) riding a fake variant on
  consors_n — it is consortium, -ii n., now a proper shared card with the
  token re-pointed. Principle documented in latin-support.md ("UI/UX
  principles: the card is a dictionary, the tabs are the apparatus").

Still open (pre-existing, shared lexicon): deponent grids carry fabricated
active-voice finite cells (conor shows "cono/conas"; nascor/sequor/moderor/
conplector inherit the convention); `labor_v` conflates labō "totter" with
lābor "glide"; deponent principal-parts display ("nascor, nascere").

---

## Latin-support Phase 3: display hardening (2026-07-01)

- **Marker grids render.** `cards.js` now renders paradigm cells stored under
  non-finite / degree marker prefixes (`pap.`, `fap.`, `gerundive.`, `ger.`,
  `comp.`, `superl.`) as their own labelled sections (reusing the ppp-grid
  styling); previously ~76 cells per verb existed only for form-matching.
  Verified in-browser: *moderantum* shows participle/gerundive/gerund
  sections with `pap.gen.pl` highlighted; *carissime* shows comparative +
  superlative grids with `superl.voc.sg.masc` highlighted.
- **Cold-path drift guard.** `validate/__tests__/cards-fallback.test.js`
  asserts every grammar.json value id is covered by the hardcoded cards.js
  fallback maps (`comp`/`superl`/`loc` added). Build-time generation of the
  fallbacks remains open backlog.
- **Glossary provenance.** Each glossary entry attested in a text carries
  `attested: true` (2,953 of 83,337 surfaces); the rest are
  paradigm-generated dictionary forms. Schema documents the field.
- **L11 vocative invariant** (warning): 2nd-declension voc. sg. must follow
  A&G §49.c (-e; -ius names/filius/genius -i; -ius common -ie; Greek -eus
  keeps -eu; deus/meus exempt) — guards the Phase 1 fix against regeneration.
  It immediately caught six pre-existing unreferenced capitalized duplicate
  cards (Stygius_adj vs stygius_adj etc.), now deleted.

---

## Latin-support Phase 2: onomasticon + degree (2026-07-01)

Executed Phase 2 of `development/latin-support-analysis.md` via
`site/latin/phase2_onomasticon.py` (idempotent). The `unknown_adv` sentinel is
**retired**: all 111 unresolved Ovid tokens are lemmatized, the lemma is
deleted, the `unk` marker atom is out of the closure allowlist, and the
C1/C2 unknown_adv skip clauses are gone.

- **89 new lexicon cards**: the Peneus river catalogue (Apidanus, Amphrysos,
  Sperchios, Enipeus, Ladon), mountains/places (Olympus, Pelion, Ossa,
  Parnasus, Pindus, Lycaeus, Maenala, Cyllene, Tempe, Tartara, Capitolium…),
  theonyms (Amphitrite, Astraea, Nereus, Erinys, Themis, Triton, Diana,
  Hymen…), patronymics (Promethides, Epimethis, Atlantiades, Arestorides),
  collectives (fauns, silvans, Giants, Cyclopes, Nereids, naiads,
  hamadryads), 25 ethnic/divine adjectives (Stygius, Delius, Latonius,
  Corycis…), ordinary words (vomer, faex, cumba, gestamen, adspergo,
  conpago, monimentum, trio, delphin, concors, anguipes, liniger), and four
  verbs (ardesco, prendo, and the deponents moderor / conplector,
  stem-transformed from the conor_v / sequor_v grids). Glosses cross-checked
  against the vendored Lewis & Short.
- **Token parses computed mechanically** from matching cells (gender-stamped
  like build-glossary), so Gl2/Gl4/C3 verify every new paradigm. Syncopated /
  contracted forms added as list-cells: nosco `norant`, caelestis
  `caelestum`, moderor `moderantum`. The four stray `que` tokens were
  quote-interrupted enclitics → `que_enclit`.
- **Degree modeled**: grammar.json gains a `degree` category (`comp`,
  `superl`; A&G §§123–124) and case `loc` (§427). `carus_n` (the Phase 1
  regloss) is now `carus_adj` with full comparative + superlative grids;
  Met 1.486 *carissime* parses as `superl.voc.sg.masc` instead of riding an
  `alt` marker.

Remaining from the analysis doc: Phase 3 (display hardening) plus two
follow-ups noted during Phase 2: `zephyrius_adv` still has a misleading id
(pos noun, cells Zephyrus), and comp./superl./gerund cells exist in cells but
are not yet rendered as paradigm sections.

---

## Latin-support Phase 1 corrections (2026-07-01)

Executed Phase 1 of `development/latin-support-analysis.md` via
`site/latin/phase1_corrections.py` (idempotent; report printed on run):

- **197 second-declension vocatives** fixed across nouns/adjectives whose
  `voc.sg` had been auto-filled as a copy of `nom.sg` (animus → *anime*;
  -ius regularly → -ie; *meus* → *mi*; *deus* kept per A&G §49.c). 20 stale
  voc parses dropped from manuscript tokens whose surface no longer matches.
- **`a-eo_v` deleted** (fabricated "aeo, aeare" with eo/ire glosses) —
  replaced by `aeas_n`, the river Aeas of Met 1.580; token `b1-21-154`
  re-pointed.
- **`fabricator_v` → `fabricator_n`** (the Met 1.57 token is the agent noun);
  **`uno_v`** rebuilt as regular 1st-conj *uno, unare* (was a unire-paradigm
  hybrid); **`ador_v`/`genitor_v`/`pastor_v`/`aequor_v`** deleted (passive
  surface-form headwords duplicating adoro/gigno-era entries; token-unreferenced,
  9 `stanza` slugs re-pointed). `carus_n` re-glossed (was DICTLINE's Emperor
  Carus; Met 1.486 *carissime* is "dearest").
- **Parse-atom `ppl` → `pap`** everywhere (21,960 lexicon cells + manuscript
  parses); grammar.json's `fpp` renamed `gerundive`, new `ger` (gerund) and
  gender `c` (common) values, agRefs added for person 1/2/3 and enclitic;
  `seed.py` participle tagging updated to match.
- **New closure invariants L10 / Gl6 / C12** (shared helper
  `site/generator/validate/parse-atoms.js`): every parse atom in lexicon cell
  keys, glossary parses, and concordance parses must be defined in
  grammar.json (markers `inv`/`enclit`/`alt`/`unk`/id-suffix `n`,`v`
  allowlisted; `unk` retires with Phase 2's unknown_adv curation).
- cards.js cold-path fallback maps extended (futperf, pap, fap, gerundive,
  ger, c; adv/interj/num pos notes).

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

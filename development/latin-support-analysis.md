# Latin support — correctness & coverage analysis

> **Status 2026-07-01:** Phases 1 and 2 are done — see
> `site/latin/phase1_corrections.py`, `site/latin/phase2_onomasticon.py`, the
> L10/Gl6/C12 closure invariants, and the two Latin-support entries in
> `remaining-validate.md`. The `unknown_adv` sentinel is retired (89 new
> cards, all 111 tokens lemmatized), degree (`comp`/`superl`) and locative
> are modeled, and *carissime* parses as a real superlative. Item 10's
> fallback-map staleness was patched by hand (build-time generation remains
> open). Phase 3 (display hardening: render comp/superl/gerund cell
> sections, glossary provenance flag, generated fallback maps) remains.

Review of [latin-support.md](latin-support.md) against the shipped data and
runtime, 2026-07-01. Method: every factual claim in the doc was checked against
the repo; then the three layers were audited for linguistic correctness and
coverage — the **language model** (`grammar.json` parse-code vocabulary), the
**instance data** (`lexicon.json` paradigms, concordance/glossary annotations),
and the **display layer** (`site/reader/cards.js`).

Baseline: `make validate` passes — 0 errors, 0 warnings across all six suites.
Everything below is invisible to the current validators, which check structural
invariants, not linguistic truth or cross-layer vocabulary agreement.

## 1. Verification of the doc itself

The doc is accurate. Spot-checked claims, all confirmed:

| claim | verified |
|-------|----------|
| three sources under `content/_language/latin/` | ✓ grammar.json (21 KB), lexicon.json (7.75 MB, **1,677 lemmata**), reference-grammar.json |
| reference grammar "642 canonical §-sections" | ✓ exactly 642 |
| morpheus cache "~3,400 surface forms" | ✓ 3,391 |
| grammar bundle load order, `applyGrammar()` fallback overlay | ✓ `cards.js:82–114` |
| paradigm two-layer render, voc→nom highlight fallback | ✓ `cards.js:211–330, 584–586` |
| validation suites grammar/lexicon/glossary/concordance/reference/vocabulary | ✓ all present and green |

One wording nit: the doc says grammar terms come "each with a gloss and
Allen & Greenough (`agRefs`) cross-references" — glosses are complete (G3
enforces this), but the **person values (`1`,`2`,`3`) and `enclitic` have no
`agRefs`**, so their popovers have no "Allen & Greenough: §N" line.

## 2. Model-level findings (grammar.json)

The grammar vocabulary is: pos (10), case (6), number (2), gender (3),
person (3), tense (6), mood (8: `ind subj imp inf pap ppp fap fpp`),
voice (2), plus 8 general terms. Problems:

### 2.1 Parse atoms used in shipped data but undefined in the model

Collected from every paradigm cell key in `lexicon.json` and every
`parses[]` entry in the concordances:

| atom | meaning | where it appears | modeled? |
|------|---------|------------------|----------|
| `ger` | gerund | lexicon cells; **user-visible**: *nascendi* → `ger.gen.sg` | ✗ nowhere |
| `gerundive` | gerundive | lexicon cells only | ✗ nowhere |
| `ppl` | present participle (duplicate of `pap`) | lexicon cells; **user-visible**: *egens* → `ppl.nom.sg.masc` | ✗ nowhere |
| `c` | common gender | **user-visible**: *caelicolae* → `gen.sg.c` | ✗ nowhere |
| `unk` | unresolved analysis | 111 Ovid tokens (see §3.4) | ✗ nowhere |
| `sup` | supine | cards.js fallback map only; zero lexicon cells | fallback only |
| `fpp` | future passive participle | defined in grammar, **never used** — data uses `gerundive` | orphan |

The `pap`/`ppl` split is the worst kind of drift: two codes for the same
grammatical object (*redeuntem* is annotated `pap.acc.sg.masc`, *egens* is
`ppl.nom.sg.masc`), and only one of them resolves to a gloss.

### 2.2 Missing grammatical categories (coverage)

- **Degree** — no comparative/superlative category at all. No `comp`/`superl`
  atoms occur anywhere in the data either, meaning comparative and superlative
  forms in the texts are currently absorbed as separate lemmata or prose notes
  (`ocior_adv`, `late_adv`, `vetus_adj` mention degree only in gloss text).
  Any adjective/adverb paradigm is positive-degree only.
- **Locative case** — not modeled (`nom gen dat acc abl voc` only). Morpheus
  and Whitaker both emit locatives; when one appears in a future text there is
  no slot for it.
- **Proper nouns** — no pos value for names, and no onomasticon. This is the
  single biggest coverage hole in practice: see §3.4.
- **Category modeling smell** — participles (`pap ppp fap fpp`) live inside
  the *mood* category. It works because parse codes are flat dotted atoms, but
  gerund/gerundive/supine were left out precisely because they don't fit
  "mood" either. A `verbal-noun/participle` category (or a frank `nonfinite`
  category: `inf pap ppp fap gerundive ger sup`) would give every nonfinite
  atom a home.
- **agRefs gaps** — person `1/2/3` and `enclitic` lack `agRefs` (A&G has
  natural targets: persons §163a, enclitics §57 & i.a.).

## 3. Instance-data findings (lexicon.json, concordance, glossary)

### 3.1 Systematic second-declension vocative error — 69 nouns, user-visible

Every noun paradigm renders a `voc` row (`rows: [nom, voc, gen, dat, acc,
abl]`). **69 second-declension `-us` nouns carry `voc.sg` identical to
`nom.sg`** where Latin requires `-e`: `animus→animus` (should be *anime*),
`dominus`, `annus`, `campus`, `equus`, … The generator that filled these grids
never special-cased the 2nd-declension vocative. Inconsistently, `radius_n`
*does* have a distinct vocative (`radie` — the regular formation; per A&G
§49.c only proper names in `-ius` plus *fīlius*/*genius* take `-ī`), while
`lucius_n` and `medius_n` fall back to nominative. (`deus_n` voc = *deus*
happens to be correct — by accident, not design.) Note `cards.js:584` already falls back voc→nom **when the voc cell is
absent**, so one clean fix is to regenerate correct `-e`/`-ī` vocatives and
simply omit the cell for true voc=nom paradigms.

### 3.2 Fabricated lemma `a-eo_v` ("aeo, aeare, aevi, aetum")

Met 1.580 "…lenisque Amphrysos, et **Aeas**" — the river Aeas (Aoös) — is
annotated (token `b1-21-154`, surface *aeas*) as `2sg.pres.subj.act` of a verb
"aeo" that does not exist. The entry carries the glosses of *eo, īre* ("go,
walk, march…") but a **regular first-conjugation paradigm generated from the
stem "ae-"** (aeō, aeās, aeābam…), and all 100+ invented forms were dutifully
indexed into the glossary. It should be a proper-noun entry *Aeas* alongside
its neighbors in the river catalogue (which are themselves on the unknown
sentinel — §3.4).

### 3.3 Passive-form headwords: six spurious/garbled verb entries

Six verb entries have a passive surface form in the lemma/first-principal-part
slot instead of the dictionary form:

| id | shipped pp[0] | rest of pp | problem |
|----|--------------|------------|---------|
| `genitor_v` | genitor | gignere, genui, genitum | headword should be **gigno**; card header shows "genitor" as a verb lemma |
| `pastor_v` | pastor | pascere, pavi, pastum | should be **pasco** |
| `aequor_v` | aequor | aequare, aequavi, aequatum | should be **aequo** |
| `ador_v` | ador | adorare, adoravi, adoratum | should be **adoro** — and it *displays* lemma "adoro", duplicating `adoro_v` |
| `fabricator_v` | fabricator | fabricare, … | should be **fabrico** — duplicates `fabrico_v` |
| `uno_v` | uno | unire, univi, unitum | conflates **unio, unire** with a lemma "uno" |

These exist to offer the "1sg present passive" reading of noun homographs
(*genitor* "I am begotten") — legitimate as candidates, but the cards
themselves are wrong, and `ador_v`/`fabricator_v` shadow their properly-formed
twins (`adoro`, `fabrico` each appear under two ids).

### 3.4 The `unknown_adv` sentinel — 111 unresolved tokens shown to readers

111 of 5,349 Ovid tokens resolve to `unknown_adv` (pos `adv`, gloss "analysis
unresolved in first-pass pipeline", parse `unk`). Tapping any of them shows
that card. The census splits into:

- **~90 proper nouns/adjectives**: Olympus, Diana, Styx (×3 forms), Pan,
  Parnassus, Amphitrite, Nereus, Themis, Epaphus, Erinys, Tartara, Tempe,
  Enipeus, Apidanus, Amphrysos, Sperchios (the same river catalogue as §3.2),
  Arcadia, Haemonia, Scythia, plus derived adjectives (Delius, Cyllenius,
  Iunonius, Latonia, Titania, Stygius, Romanus, Gallicus…).
- **~20 genuine common words** that deserve real cards: *norant* (syncopated
  nōverant ← nosco), *vomeribus* (vomer), *prensam* (pren(d)o), *complexus*,
  *compagine* (compages), *cumba*, *monimenta*, *faecis* (faex), *gestamina*,
  *moderantum*, *discors*, *concordi* (concors), *ardesceret* (ardesco),
  *aspergine* (aspergo), *hymen*, *naides/naias*, *delphines*, *cyclopum*,
  *caelestum*, *triones*, *pleias* — and, startlingly, one **-que** token.

### 3.5 Smaller data issues

- `caelicola_adv` / `monticola_adv`: pos is correctly `noun` but the id
  suffix says `_adv` — cosmetic, but ids are supposed to be stable and typed.
- Their parses use gender `c` (common), which no layer can label (§2.1).
- The **glossary indexes every generated paradigm cell** — 82,339 surfaces —
  not just attested forms. Correct paradigms make this a feature (form
  lookup); incorrect ones (aeās, aeābam, radie, 69 false vocatives) become
  false dictionary assertions. There is no attested/generated flag.
- Nine headwords have multiple entries; besides the §3.3 duplicates, the rest
  (labor n/v, aequor n/v, vetus n/adj…) are legitimate homographs.

## 4. Display-layer findings (cards.js)

- **Unmapped chips render as dead raw codes.** `tokenToLinks()` falls through
  to `{label: tok, note: null}` for unknown atoms, so a reader tapping *egens*
  sees a literal "ppl" chip, *nascendi* a literal "ger" chip, *caelicolae* a
  literal "c" — no label, no grammar link. This is the §2.1 model gap made
  visible.
- **Cold-path fallback map is stale.** `FALLBACK_PARSE_TOKEN_MAP` lacks
  `futperf`, `pap`, `fap`, `fpp`, and the pos atoms `adv`/`interj`/`num`
  (`FALLBACK_POS_NOTE` likewise). After `grammar.json` loads these are
  overlaid, but on the cold path (first paint, `file://`, fetch failure) a
  future-perfect verb renders a raw "futperf" chip. The fallback also maps
  `enclit` while grammar defines `enclitic` — both spellings occur in span
  data, so keep both, but that duality should be deliberate, not accidental.
- **Gerund/gerundive/present-participle cells never display.** Verbs carry
  full `ger.*`/`gerundive.*`/`ppl.*` grids in `cells`, but no `rows`/`cols`
  header references those atoms, so `renderSection()` never shows them; they
  serve only form-matching/highlight. Either render them (a "Verbal nouns"
  section) or stop generating ~76 invisible cells per verb.
- **The 69 wrong vocatives are on screen** in every affected noun card (§3.1).

## 5. Validation gap

All of the above coexists with a green `make validate` because the suites
check structure (id uniqueness, referential integrity, span↔token parity),
not vocabulary agreement or linguistic content. Two cheap, high-leverage
invariants would have caught most of §2–3:

1. **Parse-atom closure** — every atom in every lexicon cell key, glossary
   parse, and concordance parse must be defined in `grammar.json` (with an
   explicit allowlist for sentinels like `unk` if kept). Catches `ppl`, `ger`,
   `gerundive`, `c`, and any future drift.
2. **Morphology cross-check** — regenerate each regular paradigm with the
   deterministic decliner/conjugator (`site/generator/lib/paradigm.js` /
   `seed_vocab.py`) and diff against shipped cells; warn on mismatch. Catches
   the vocative bug and `a-eo_v`-style garbage wholesale.

## 6. Recommendations & plan

### Phase 1 — correctness of what readers see today (error-severity)

1. **Fix the vocatives.** Script: for every 2nd-decl noun, regenerate
   `voc.sg` (`-us→-e`, `-ius→-ī`, special-case `deus`); where voc=nom is
   genuinely correct, prefer *removing* the cell and letting the existing
   `cards.js` voc→nom fallback handle display. Touches ~70 entries.
2. **Replace `a-eo_v`** with a proper-noun card *Aeas* (river, Met 1.580);
   re-point token `b1-21-154`; purge the ~100 fabricated glossary surfaces
   (they fall out on rebuild).
3. **Repair the six passive-headword verbs** (§3.3): correct principal parts,
   merge `ador_v→adoro_v` and `fabricator_v→fabrico_v`, split `uno_v` into
   *unio*; keep the passive readings as parses on the right lemma.
4. **Unify `ppl`→`pap`** across lexicon cells and concordance parses (one
   migrate script), and add `ger`, `gerundive`, `sup`, and gender `c` to
   `grammar.json` with glosses + agRefs (gerund §501–507, gerundive §158d,
   supine §159b/509–510, common gender §34); retire or repurpose the unused
   `fpp` in favor of `gerundive`.
5. **Add the parse-atom closure invariant** (new G5 / L10 / C12) so the
   vocabulary can't drift again. Add agRefs for person values and `enclitic`
   while in the file.

### Phase 2 — coverage (the editorial backlog successor)

6. **Onomasticon pass**: add a `name` pos value (or `proper: true` flag) and
   author cards for the ~90 proper nouns behind `unknown_adv` — mostly
   indeclinable-or-Greek-declension headwords with one-line identifications;
   the river catalogue and theonyms are the bulk. Whitaker's has many;
   Lewis & Short covers the rest.
7. **Curate the ~20 real words** on `unknown_adv` (*norant, vomer, compages,
   prendo, concors, ardesco, faex…*) with the existing 3-step placeholder
   tooling — this is exactly the workflow that closed the 64 stubs in June.
   Investigate the stray `que` token separately (likely a tokenizer artifact).
8. **Model degree**: add a `degree` category (`pos`? no — `positive`,
   `comp`, `superl`), extend adjective/adverb paradigm generation, and
   annotate comparatives/superlatives in the texts as they're encountered.
9. **Add `loc`** to the case category (gloss + A&G §427) so locatives have a
   slot when they appear; render only when a paradigm carries one.

### Phase 3 — display & pipeline hardening

10. **Regenerate `FALLBACK_PARSE_TOKEN_MAP`/`FALLBACK_POS_NOTE` from
    grammar.json at build time** (emit into cards.js or a tiny inlined JSON)
    instead of hand-maintaining; the cold path then can't drift from the model.
11. **Decide the fate of invisible cells**: either add a "Verbal nouns"
    paradigm section (gerund/gerundive/supine rows) or stop generating the
    unrendered grids; today they're dead weight that can still leak wrong
    forms into the glossary.
12. **Flag glossary provenance**: mark each surface attested-in-text vs
    generated-from-paradigm, so downstream consumers (and the multi-candidate
    UI) can rank real forms first.
13. **Morphology regeneration cross-check** as a warning-severity suite
    (§5.2) — the long-term guard for paradigm-cell correctness.

Sequencing note: items 1–5 are small, independent scripts plus one
`grammar.json` edit, each ending in `make manuscript-md && (cd site/generator
&& node build.js) && make validate`. Item 6 is the only large editorial
effort; it can proceed incrementally per chapter since `unknown_adv` remains a
functioning (if apologetic) fallback.

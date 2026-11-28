# Latin language and grammar support

The Latin apparatus is what makes Reading Room more than a markdown renderer.
Every Latin word in a study text is a tap-target; the popover gives its lemma,
principal parts or declension, a full inflection paradigm with the in-context
form highlighted, glosses, and deep links into the Reference Grammar (seeded
from Allen & Greenough), all inside the text's own popover. This doc covers the *data model and runtime*. For how the raw
text becomes annotated spans, see [../site/latin/README.md](../site/latin/README.md).

## The three language sources

All under `content/_language/latin/` (the `_` keeps them out of the book pass):

| file | role |
|------|------|
| `grammar.json` | the **parse-code vocabulary** — cases, numbers, genders, tenses, moods, voices, persons, parts of speech, and general grammar terms, each with a gloss and Allen & Greenough (`agRefs`) cross-references |
| `lexicon.json` | the **dictionary** — one card per lemma (headword, pos, principal parts / paradigm, glosses, notes). `lemmata[]`, keyed by stable id like `fero_v`, `animus_n` |
| `reference-grammar.json` | the **Reference Grammar** — a toc tree plus 642 §-sections (paradigm tables, cross-refs), seeded once from vendored Allen & Greenough TEI and edited by hand since |

`content/_latin-lexicon/<lemma>.json` holds the older per-lemma card files.
`lexicon.json` is now the source of truth; the per-lemma files are a legacy
fallback the build reads only when the consolidated file is absent.

## Source material — where the data comes from

None of the three language sources are hand-authored from scratch. They are
distilled from a stack of vendored corpora and sibling analysis tools, mostly
under `site/latin/sources/` plus two sibling clones alongside this repo. The
authoring pipeline (`site/latin/*.py`) reads these; the shipped JSON is the
distilled residue. Understanding the provenance matters because the same surface
form is cross-checked against **three independent morphological analyzers** —
rule-based (Morpheus, Whitaker's) and neural (Stanza) — and disagreements are
exactly the editorial backlog.

### Morpheus (rule-based parser, primary evidence)

The mechanical parsing stage shells out to a local C build of the
[perseids-tools/morpheus](https://github.com/perseids-tools/morpheus) fork —
Gregory Crane's classic Greek/Latin morphological analyzer. It lives **outside**
this repo as a sibling clone (`~/Dev/github.com/mlitwin/morpheus`), built once
per machine; see [../site/latin/INSTALL.md](../site/latin/INSTALL.md) for the
`flex` + clang build. All calls funnel through `site/latin/morpheus.sh`, which
validates the build, sets `MORPHLIB`, and execs `cruncher -S -L`. Raw `<NL>`
analyses are cached in `site/latin/sources/morpheus-cache.json` (~3,400 surface
forms, committed) so re-runs are zero-cost and the build is reproducible without
the binary present. `build_apparatus.py` gathers *every* Morpheus candidate per
token; `apparatus_to_spans.py` then picks one primary. Morpheus is the source of
the `#N` homograph discriminators (`dico#1` vs `dico#2`) and syncope tags
(`contr`) that the other tools miss.

### Whitaker's WORDS (rule-based dictionary + inflection tables)

A second sibling clone, `~/Dev/github.com/mlitwin/whitakers_words` — the Python 3
reimplementation of William Whitaker's WORDS — supplies the **dictionary and
paradigm skeletons**. Two of its plain-text data files are read directly (using
the same fixed-width slice offsets as `whitakers_words/datagenerator.py`):

- `whitakers_words/data/DICTLINE.GEN` — **39,338** dictionary entries (stems +
  glosses + POS + frequency/age metadata).
- `whitakers_words/data/INFLECTS.LAT` — **3,207** inflection ending rules.

`seed_vocab.py` looks a lemma up in DICTLINE by stem and generates a full
paradigm from INFLECTS, emitting skeleton cards to `staging/`.
`expand_verb_paradigms.py` fills sparse verb grids the same way. The repo's
importable `whitakers_words.parser.Parser` API is used by
`draft_placeholder_curation.py` to draft corrected entries for placeholder
lemmata (`sys.path` is pointed at the sibling clone; no pip install needed).

### Stanza neural pipeline (`.venv`, editorial cross-check)

`site/latin/.venv` (gitignored, ~644 MB) is a committed-by-convention Python
3.14 virtualenv holding the **neural** analyzer: `stanza` 1.12.2 on `torch`
2.12 + `numpy` 2.4, plus the downloaded Latin model (`stanza.download('la')`).
This is the "vector embedding" layer — Stanza's tokenize/POS/lemma processors
are neural networks over character and word **embeddings**, giving a data-driven
second opinion that is independent of the rule-based Morpheus/Whitaker stems.

`stanza_editorial.py` runs `Pipeline('la', processors='tokenize,mwt,pos,lemma')`
over a card, LCS-aligns its tokens against the current span annotations, and
lists the disagreements as correction candidates (`make latin-stanza-editorial
CARD=… STANZA_PYTHON=site/latin/.venv/bin/python3`). `annotate_stanza.py`,
`fix_pos_mismatches.py`, and `apply_placeholder_curation.py` consume the same
Stanza-preferred reading — it is what lands in a span's `data-stanza` attribute
(the ✓ default tab). Because the venv is huge and platform-specific it is
rebuilt per machine, not cloned; scripts that import stanza skip gracefully when
it is absent.

### Lewis & Short (vendored dictionary prose)

`site/latin/sources/lewis-short-json/` is a git-vendored copy of
[IohannesArnold/lewis-short-json](https://github.com/IohannesArnold/lewis-short-json)
— the Perseus Lewis & Short (1879) *A Latin Dictionary* converted from TEI XML
to per-initial JSON (`ls_A.json` … `ls_Z.json`, ~45 MB). `ls_lookup.py` is the
accessor: it normalizes orthography (strips macrons, `j→i`, `v→u`, trailing
homograph digits) and returns `{key, orthography, pos, notes}` for a headword.
This is the source of authoritative gloss/definition prose during placeholder
curation, where DICTLINE's terse glosses are too thin.

### Wiktionary (structured lexicon, cross-check)

English Wiktionary's Latin entries, as extracted by
[wiktextract](https://github.com/tatuylonen/wiktextract) and published at
[kaikki.org](https://kaikki.org/), supply what DICTLINE and Whitaker's generator
are weakest at: macronized headwords, gender and declension/conjugation class,
plurale tantum, principal parts, concise modern glosses, complete inflection
tables, homographs split by etymology (*populus* "people" vs *pōpulus*
"poplar"), and form-of / alternative-of pointers (*veneris* → *Venus* gen.sg,
*sylva* → *silva*).

`wiktionary_extract.py fetch` streams the all-languages raw dump (~3 GB) and
keeps the Latin entries (~890k) under gitignored `downloads/wiktionary/`;
`build` preprocesses them into this repo's parse-code vocabulary and writes the
committed subset `site/latin/sources/wiktionary-cache.json` (card headwords plus
every attested surface, ~6 MB) — pinned to a dated dump so builds are
reproducible, like `morpheus-cache.json`. `wiktionary_lookup.py` is the
accessor. Preprocessing details that matter: deponent forms are flipped to this
repo's `pass` convention (semi-deponents are not); participle entries are
declined under `ppp.`/`pap.`/`fap.`/`gerundive.` and folded into their parent
verb's cells; sigmatic/aorist/potential forms and periphrastic "X + sum"
descriptions are dropped.

`audit_wiktionary.py` (`make latin-wiktionary-audit`) compares cards and token
annotations with it and writes `site/latin/wiktionary-audit.md`;
`wiktionary_regen.py` rebuilds a card's paradigm/head from Wiktionary (or creates
a new shared card with `--new`). Cards regenerated or created that way are
Wiktionary-derived data. Wiktionary content is CC BY-SA 4.0 — using it to generate cards
requires attribution (alongside the A&G credit) and share-alike terms for the
derived lexicon data.

### Perseus TEI corpora (canonical text, translation, grammar)

The primary texts and the reference grammar are vendored TEI XML under
`site/latin/sources/`:

- `phi0959.phi006.perseus-lat2.xml` — canonical Ovid *Metamorphoses* Latin
  (Perseus), ingested by `ingest_perseus.py` into per-"card" JSON under
  `sources/cards/` (~156 cards).
- `phi0959.phi006.perseus-eng3.xml` — public-domain English translation,
  ingested by `ingest_translation.py` into `sources/translations/` (~146 files);
  `scribe_book1_mechanical.py` weaves it into first-pass page markdown.
- `viaf39744457.001.perseus-eng1.xml` — Allen & Greenough, *New Latin Grammar*
  (Ginn & Co., 1903) TEI, the one-time seed of `reference-grammar.json`
  (642 §-sections; `ingest_ag.py` → `seed_reference_grammar.py`, both retired
  after use). PD underlying text; Perseus TEI
  markup CC BY-SA with Dickinson College Commentaries corrections.

### Provenance at a glance

| source | location | kind | feeds | accessor |
|--------|----------|------|-------|----------|
| Morpheus | sibling `morpheus/` clone (+ cached JSON) | rule-based parser | apparatus / spans | `morpheus.sh`, `seed.py` |
| Whitaker's WORDS | sibling `whitakers_words/` clone | dictionary + inflection tables | `lexicon.json` cards, paradigms | `seed_vocab.py`, `draft_placeholder_curation.py` |
| Stanza `la` model | `site/latin/.venv/` (gitignored) | neural (embeddings) | `data-stanza` reading, editorial QA | `stanza_editorial.py` |
| Lewis & Short | `sources/lewis-short-json/` (vendored git) | dictionary prose | gloss curation | `ls_lookup.py` |
| Wiktionary (wiktextract) | `sources/wiktionary-cache.json` (+ gitignored full extract) | structured lexicon | audit (`wiktionary-audit.md`) | `wiktionary_lookup.py` |
| Ovid Latin TEI | `sources/…perseus-lat2.xml` | canonical text | `sources/cards/` | `ingest_perseus.py` |
| Ovid translation TEI | `sources/…perseus-eng3.xml` | translation | page scribing | `ingest_translation.py` |
| A&G grammar TEI | `sources/…perseus-eng1.xml` | reference grammar (seed) | `reference-grammar.json` | `ingest_ag.py` → `seed_reference_grammar.py` (both one-time) |

## How a word becomes a card

1. A chapter's markdown carries a `.latin-passage` block of
   `<span data-matches="lemma:parse,parse;lemma2:parse" data-stanza="preferred_lemma">word</span>`
   tokens. `data-matches` lists **every** paradigm cell the surface form could
   fill for each candidate lemma — the card is a study tool, not an answer key.
   `data-stanza` records the reading the Stanza parser preferred (marked with a ✓
   and used as the default tab).
2. `build.js`'s `renderLatinSpans()` rewrites each span to a
   `<button class="latin-token" data-lemma=…>`, verifies every lemma exists in
   the lexicon (build error otherwise), and accumulates the referenced lemmas so
   the page pulls in what it needs.
3. At runtime `cards.js` lazy-loads `lexicon.json`, and on tap renders the card
   into `#popover-host`: header (lemma + pos chip + the tapped surface form in
   the parse slot), gloss list, and the paradigm.

### Card contents (`lexicon.json` lemma)

- `id`, `lemma` (display headword), `pos` (`noun`/`verb`/`adj`/`pron`/…).
- `principal_parts` (verbs, 4 slots → each a note-linked chip) or `head` (the
  dictionary-entry line for other parts of speech).
- `glosses[]`, `notes`.
- `paradigm` — `{ rows, cols, cells }`, where cell keys are dotted parse codes
  (`nom.sg`, `3sg.pres.ind.act`). `ppp_paradigm` adds a participle grid.
  A cell holds one form or a list of variants, the regular form first; verb
  cards carry the A&G §181 contracted perfects (*amāsse*, *audiit*, *nōrat*)
  as variants, added by `site/latin/syncope.py` (`make latin-syncope`, also run
  by `wiktionary_regen.py`). A text token highlights its cell only when its
  spelling is one of the cell's forms.
- The card is **word-general**: passage-specific commentary belongs in the
  page's Notes section, not the card.
- Display/ordering fields, filled by `site/latin/annotate_cards.py`:
  `headword` (macronized: *lēvis*, *pōpulus*), `homograph` (Lewis & Short
  number when another card shares the unmarked lemma and pos; invariant L12),
  `freq` (Whitaker DICTLINE letter, A common … F rare).

### UI/UX principles: the card is a dictionary, the tabs are the apparatus

Two principles govern what a card asserts and how disambiguation reaches the
reader:

1. **Dictionary orthography.** The card is a dictionary artifact: headword,
   paradigm forms, and glosses appear in normalized dictionary form —
   lowercase for common words, classical spelling first. The *text's*
   typography stays in the text: Marvell capitalizes common nouns ("Sylva",
   "Arbos") and spells in Neo-Latin; those attested variants are recorded as
   secondary cell forms, but lowercased (`silva, sylva`), because a
   capitalized form on a common-noun card silently asserts a proper name.
   The tapped surface form shown in the card header keeps the text's exact
   typography — that slot *is* the quotation.

2. **Soft disambiguation.** Every morphologically possible reading stays
   available to the reader: `data-matches` lists every candidate lemma
   (rendered as card tabs) and every paradigm cell the surface could fill
   (rendered as parse chips) — the card is a study tool, not an answer key.
   Editorial judgment (`selected_lemma_id`, the Stanza ✓) only chooses which
   tab is *in front*; it never deletes a reading. Candidates are removed from
   the data only when they are morphologically false (a form the lemma cannot
   yield), never merely contextually disfavored.

### Readings, defaults, and homographs

A token whose surface can be several words shows each as a tab
(`cards.js`, "reading tabs"). One opens by default, in this precedence: the
learner's own last choice for that popover entry → an editor's selection →
Stanza's ✓ → the parser's selection → the first candidate. A token's
`selected_by` (`editor` | `stanza` | `parser`, beside `selected_lemma_id`)
records who chose; it is internal — it orders, it is never displayed. The
remaining tabs follow the default: same part of speech first, then commoner
words (`freq`), then homograph number. Tabs are labelled with the macronized
headword, homograph superscript, POS and a short gloss (*lēvis² adj.* —
smooth); three or more readings add a `‹ n / N ›` stepper, and on phones only
the active tab shows beside it. Arrow keys move between tabs. A card whose
word has homographs that are *not* readings of the tapped form adds a quiet
"Not to be confused with: …" link (*ōs¹* mouth ↔ *os²* bone).

C14 (warning) lists parser-chosen defaults that Stanza disagrees with — the
editorial queue; confirming one writes `selected_by: "editor"`. The plan is
`Plans/homograph-support-plan.md`.

### Paradigm rendering

`renderParadigm()` / `renderSection()` in `cards.js` emit the paradigm as a
two-layer structure: a visually-hidden semantic `<table>` for accessibility, and
an aria-hidden CSS-subgrid visual grid with a shared row-label gutter. The
in-context form(s) get an `active-form` highlight, with fallbacks for
Morpheus/paradigm code mismatches (noun gender suffixes, vocative→nominative).
Cells stored under a non-finite / degree marker prefix (`pap.`, `fap.`,
`gerundive.`, `ger.`, `comp.`, `superl.`) render as their own labelled
sections via `renderMarkerGrids()`.

Verb cards group the forms into tabs under the definition, in A&G's fixed
order, always labelled with the grammars' abbreviations so the row fits a
phone: Ind · Subj · Imp (finite moods, active and passive side by side) · Inf
(tense × voice) · Part (present and future active, perfect passive) · Ger ·
Gdv. The full name is the tab's tooltip and accessible name, and heads its
panel, linked to the grammar note. Only groups the card has forms for get a
tab. The open tab is underlined; every tab whose panel holds the tapped form
also wears the form highlight, so a form in two groups (*amāre*: infinitive
and passive imperative) is marked in both. The card opens on the first such
tab; the reader's choice is kept on the stack entry (`formTab`, in `#g=`).
The full layout rationale is in
[paradigm-grid-pattern.md](paradigm-grid-pattern.md).

## Parse codes and grammar links

`grammar.json` drives the parse chips. At runtime `applyGrammar()` builds
`PARSE_TOKEN_MAP` / `PERSON_MAP` / `POS_NOTE` from it; a hardcoded fallback in
`cards.js` covers the cold path before the grammar bundle loads. Each parse atom
(`nom`, `pres`, `ppp`, …) renders as a `note-link` button that opens its grammar
gloss, and every gloss carries an "Allen & Greenough: §N" line generated from the
term's `agRefs` — so the reader can go word → parse code → grammar term → A&G
section without leaving the popover.

Grammar bundle load order (`cards.js`): `window.__readingRoomData.grammar` (iOS
bundle) → `window.__readingRoomGrammar` (`file://` script tag) → `fetch()` on the
web.

## Reference grammar

`content/_language/latin/reference-grammar.json` is the site's own **Reference
Grammar**. Allen & Greenough was its seed, not an upstream: `ingest_ag.py`
extracted the TEI once, `seed_reference_grammar.py` reshaped it once (toc tree,
display-case headings, `data-ref` cross-refs, the §114–122 chapter split), and
since then the file is edited by hand — corrections to A&G text (`edited: true`
+ `edit_note`) and additions (`rr-…` ids, `source: "editorial"`). Shape:

- `toc` — parts → chapters (`id`, `slug` = page file name, `label`, `items`) →
  nested groups (`label`, `items`) → section ids. The toc *is* the document
  order.
- `sections` — `{ source, html, heading?, source_page?, edited?, edit_note? }`.
  Cross-refs in `html` are `<a data-ref="ID">`.
- `sources` — provenance for the credit line (CC BY-SA markup).

Only authored data is stored. `site/generator/lib/reference-grammar.js` derives
the rest — chapter, group headings, prev/next, xrefs, section → page — and
every consumer uses it:

- **Standalone document** (`build-reference-grammar.js`) under
  `docs/_language/latin/reference/` — one page per chapter, each section
  anchored `id="sec-ID"`, credit footer on every page. Listed in the library as
  "Reference Grammar".
- **In-popover entries** (`build-reference-notes.js`) →
  `docs/assets/latin-reference-notes.json` — the same sections (plus the toc and
  derived prev/next/chapter), so `ag:`/`ref:` links open in-flow in any Latin
  text (see the [navigation doc](navigation-and-popovers.md)).

Checks, independent of any text: invariants R0–R12 in `make validate` (schema,
toc ⇄ sections, cross-refs, an HTML allow-list, URL stability against
`site/generator/validate/reference-urls.baseline.json` — rerun
`npm run reference:baseline` only for an intended move), fixture rendering and
popover/page parity tests in `make node-test`, `make reference-check` over the
built pages (also in CI), and the proofreading checklist
`site/latin/reference-grammar-review.md` (`npm run reference:review`, keeps
ticks across regenerations).

The **Latin Reader's Guide** (`_language/latin/guide/`, `build-grammar-page.js`)
is the compact companion: the parse-code glossary (from `grammar.json`); its
old address `_language/latin/grammar/` redirects. Pronunciation (from
`pronunciation.md`) appears only in the texts: every page of a Latin book
carries it, with the grammar categories, as in-page guide notes (`guide:`
links, the Study hub).

## Pronunciation

Each card shows the pronunciation of the **tapped form** under that tab's
reading (a respelling with the stressed syllable capitalized, plus IPA) in
**Classical** or **Ecclesiastical**. It is computed in the reader:
`site/reader/latin-pron.js` reads vowel length from a macronized spelling
(consonantal *j* from the text's spelling), applies each system's rules, and
places the accent by the classical penult rule.

- **Form lengths:** `content/_language/latin/macrons.json` (generated by
  `make latin-macrons` → `site/latin/macronize_forms.py`) gives, per card, the
  macronized spelling of each attested form and parse, from the Wiktionary
  entry the audit matches the card to (or the form's own entries when every one
  agrees). The build attaches each card's slice to the runtime lexicon as
  `macrons`. Re-run after changing tokens or cards; it covers ~98% of token
  readings. When a token's parses leave length open (*vestra* nom. / *vestrā*
  abl.), the popover shows both in Classical; they collapse in Ecclesiastical.
- **Fallback:** a card opened without a token, or a form with no entry, shows
  the macronized `headword`. The line always names the word it pronounces.

- **Default per book:** front matter `latin_pronunciation: ecclesiastical`
  (inherited, Zod-validated) becomes `<meta name="latin-pronunciation">` on
  every page; Marvell sets it. The popover toggle overrides it, saved in
  `localStorage` per book.
- **Guide:** `content/_language/latin/pronunciation.md` is the Pronunciation
  section of the Latin Reader's Guide (`build-pronunciation-section.js`); the
  popover's "guide" link opens `_language/latin/guide/#pronunciation`. Its
  examples table is generated by `latin-pron.js` at build time.
- **Tests:** `__tests__/latin-pron.test.js` scores every card against
  Wiktionary's la-IPA (`__tests__/fixtures/latin-ipa.json`, regenerated by
  `python3 site/latin/extract_ipa_fixture.py` from the kaikki dump): about
  98.7% Classical and 99.4% Ecclesiastical. A rule change that drops below the
  floors fails `make node-test`.

## Derived artifacts

- **Glossary** (`build-glossary.js`) → `latin-glossary.json`: every surface form
  mapped to its candidate lemmas (multi-candidate forms flagged). Entries whose
  surface occurs in a text carry `attested: true`; the rest are
  paradigm-generated dictionary forms.
- **Concordance** (`build-concordance.js`) → `docs/assets/concordance/<text>.json`:
  a token index for each chapter-formatted text (`book{N}-{NN}.md`). Each span
  gets a stable `data-token-id` (`b{book}-{chapter}-{ordinal}`).

## Per-book vocabulary overlays

A book may add text-specific cards in its own `vocabulary/*.json` (e.g. Marvell's
Hortus vocabulary). These overlay the shared lexicon into the runtime
`lexicon.json` **and** into the derived glossary, so the C-invariants
cross-check overlay-backed tokens like any others. Because the runtime map is a single flat global namespace, the
build enforces: an overlay id may be defined by at most one book (unless
byte-identical), and must not shadow a *different* shared-lexicon entry —
genuinely shared vocabulary should be promoted into `lexicon.json` instead. The
`vocabulary` validation suite checks the same invariants.

## Validation

`make validate` runs the `grammar`, `lexicon`, `glossary`, `concordance`,
`reference`, and `vocabulary` suites. The concordance suite runs once per
text (every content directory with a `manuscript.latin.json`); the lexicon
and glossary suites see the *merged* shared+overlay lexicon — the same view
the build ships — while the vocabulary suite keeps the shared-only doc so its
shadowing check stays meaningful. Error-severity violations block the build;
warnings are the editorial backlog (see `remaining-validate.md` at the repo
root). The retired `audit_latin.py` gates now live entirely in this Node
framework. The parse-code vocabulary is closed under validation: every atom in
a lexicon cell key, glossary parse, or concordance parse must be defined in
`grammar.json` (invariants L10/Gl6/C12, shared helper
`site/generator/validate/parse-atoms.js`).

Validation checks the *current sources*, not the last build: the glossary is
always derived from the lexicon in memory, and the concordance from the chapter
markdown when present (CI, without it, falls back to the committed `docs/`).
Other guards worth knowing:

- **C13** (warning) enforces soft disambiguation: every lemma the glossary
  gives a surface must be offered by the token. Adding or regenerating a card
  can create new readings for existing tokens; the warning is the prompt to add
  them (as back tabs — the editorial choice stays in front).
- **V4**: a book's tokens may use only shared cards or that book's own
  `vocabulary/` overlay — the build resolves each page that way, so a token on
  another book's overlay card would abort the build. Promote shared vocabulary
  to `lexicon.json`.
- `build-manuscript-md` fails on a `selected_lemma_id` that isn't one of the
  token's readings (the concordance builder would otherwise drop it silently).

**Homograph ids.** Two lemmata with the same headword and part of speech take
Lewis & Short's homograph number on the second: `populus_n` (people) /
`populus2_n` (pōpulus, poplar), `os_n` (ōs, mouth) / `os2_n` (os, bone).

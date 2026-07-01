# Latin language and grammar support

The Latin apparatus is what makes Reading Room more than a markdown renderer.
Every Latin word in a study text is a tap-target; the popover gives its lemma,
principal parts or declension, a full inflection paradigm with the in-context
form highlighted, glosses, and deep links into a browsable Allen & Greenough
reference grammar. This doc covers the *data model and runtime*. For how the raw
text becomes annotated spans, see [../site/latin/README.md](../site/latin/README.md).

## The three language sources

All under `content/_language/latin/` (the `_` keeps them out of the book pass):

| file | role |
|------|------|
| `grammar.json` | the **parse-code vocabulary** — cases, numbers, genders, tenses, moods, voices, persons, parts of speech, and general grammar terms, each with a gloss and Allen & Greenough (`agRefs`) cross-references |
| `lexicon.json` | the **dictionary** — one card per lemma (headword, pos, principal parts / paradigm, glosses, notes). `lemmata[]`, keyed by stable id like `fero_v`, `animus_n` |
| `reference-grammar.json` | the **full A&G grammar** — 642 canonical §-sections with paradigm tables and cross-refs, ingested from vendored TEI |

`content/_latin-lexicon/<lemma>.json` holds the older per-lemma card files.
`lexicon.json` is now the source of truth; the per-lemma files are a legacy
fallback the build reads only when the consolidated file is absent.

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
- The card is **word-general**: passage-specific commentary belongs in the
  page's Notes section, not the card.

### Paradigm rendering

`renderParadigm()` / `renderSection()` in `cards.js` emit the paradigm as a
two-layer structure: a visually-hidden semantic `<table>` for accessibility, and
an aria-hidden CSS-subgrid visual grid with a shared row-label gutter. The
in-context form(s) get an `active-form` highlight, with fallbacks for
Morpheus/paradigm code mismatches (noun gender suffixes, vocative→nominative).
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

`reference-grammar.json` is ingested once from vendored Allen & Greenough TEI
(`site/latin/ingest_ag.py`). The build produces two things from it:

- **Browsable pages** (`build-reference-grammar.js`) under
  `docs/_language/latin/reference/` — one page per topical section (~50 pages),
  each § anchored `id="sec-N"`, with cross-refs rewritten to point at the page
  that holds the target §. Listed in the library as "Latin Reference Grammar".
- **In-popover notes** (`build-reference-notes.js`) →
  `docs/assets/latin-reference-notes.json` — the same sections as
  popover-renderable note bodies, so `ag:` links open in-flow (see the
  [navigation doc](navigation-and-popovers.md)). A separate parse-code grammar
  page ("Latin Grammar Reference") is rendered directly from `grammar.json`.

## Derived artifacts

- **Glossary** (`build-glossary.js`) → `latin-glossary.json`: every surface form
  mapped to its candidate lemmas (multi-candidate forms flagged).
- **Concordance** (`build-concordance.js`) → `docs/assets/concordance/<text>.json`:
  a token index for each chapter-formatted text (`book{N}-{NN}.md`). Each span
  gets a stable `data-token-id` (`b{book}-{chapter}-{ordinal}`).

## Per-book vocabulary overlays

A book may add text-specific cards in its own `vocabulary/*.json` (e.g. Marvell's
Hortus vocabulary). These overlay the shared lexicon into the runtime
`lexicon.json`. Because the runtime map is a single flat global namespace, the
build enforces: an overlay id may be defined by at most one book (unless
byte-identical), and must not shadow a *different* shared-lexicon entry —
genuinely shared vocabulary should be promoted into `lexicon.json` instead. The
`vocabulary` validation suite checks the same invariants.

## Validation

`make validate` runs the `grammar`, `lexicon`, `glossary`, `concordance`,
`reference`, and `vocabulary` suites. Error-severity violations block the build;
warnings are the editorial backlog (see `remaining-validate.md` at the repo
root). The retired `audit_latin.py` gates now live entirely in this Node
framework.

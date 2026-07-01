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
  (Ginn & Co., 1903) TEI, ingested by `ingest_ag.py` into
  `reference-grammar.json` (642 §-sections). PD underlying text; Perseus TEI
  markup CC BY-SA with Dickinson College Commentaries corrections.

### Provenance at a glance

| source | location | kind | feeds | accessor |
|--------|----------|------|-------|----------|
| Morpheus | sibling `morpheus/` clone (+ cached JSON) | rule-based parser | apparatus / spans | `morpheus.sh`, `seed.py` |
| Whitaker's WORDS | sibling `whitakers_words/` clone | dictionary + inflection tables | `lexicon.json` cards, paradigms | `seed_vocab.py`, `draft_placeholder_curation.py` |
| Stanza `la` model | `site/latin/.venv/` (gitignored) | neural (embeddings) | `data-stanza` reading, editorial QA | `stanza_editorial.py` |
| Lewis & Short | `sources/lewis-short-json/` (vendored git) | dictionary prose | gloss curation | `ls_lookup.py` |
| Ovid Latin TEI | `sources/…perseus-lat2.xml` | canonical text | `sources/cards/` | `ingest_perseus.py` |
| Ovid translation TEI | `sources/…perseus-eng3.xml` | translation | page scribing | `ingest_translation.py` |
| A&G grammar TEI | `sources/…perseus-eng1.xml` | reference grammar | `reference-grammar.json` | `ingest_ag.py` |

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

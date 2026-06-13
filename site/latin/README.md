# site/latin

Tooling for the Ovid Metamorphoses book. The pipeline runs from canonical TEI XML to curated, popover-rich markdown pieces plus shared lexicon cards.

## Pipeline

```text
sources/phi0959.phi006.perseus-lat2.xml            ingest_perseus.py
                                                     ↓
                                       sources/cards/book-NN-card-NN.json
                                                     ↓
card_text.py --card NN-card-NN | seed.py | trim_primary.py
                                                     ↓
                                        .tmp/latin-spans.md
                                                     ↓
                     extract_lemmas.py | seed_vocab.py (staging only)
                                                     ↓
                                site/latin/staging/lexicon/*.json
                                                     ↓
                                    promote_reviewed.py (reviewed=true only)
                                                     ↓
                                  content/_latin-lexicon/*.json
```

## Scripts

* **`ingest_perseus.py`** — parse the canonical TEI vendored at `sources/phi0959.phi006.perseus-lat2.xml`; emit one JSON intermediate per Perseus "card" to `sources/cards/book-NN-card-NN.json`. Run once; re-run after editing the canonical text.
* **`seed.py`** — reads Latin text from stdin, runs each token through Morpheus via `morpheus.sh`, emits a draft `<div class="latin-passage">` block on stdout.
* **`trim_primary.py`** — chooses a primary lemma per token by scoring candidates against known lexicon POS compatibility.
* **`seed_vocab.py`** — reads lemma names and writes vocabulary skeleton cards to `site/latin/staging/lexicon/`.
* **`promote_reviewed.py`** — moves only `reviewed: true` staging cards into `content/_latin-lexicon/`.
* **`audit_latin.py`** — QA gate for unresolved lemmas, card-shape problems, sparse paradigms, and parse/POS mismatches.
* **`morpheus.sh`** — single entry point for Morpheus invocations. Validates the local build, sets `MORPHLIB`, execs `cruncher -S -L`. All Morpheus calls in the project go through this wrapper.

## Setup

See [INSTALL.md](INSTALL.md) for the one-time Morpheus build (perseids-tools fork, clone alongside this repo at `~/Dev/github.com/mlitwin/morpheus`). The build takes ~30 seconds once flex is installed.

## Use

```sh
# One-time TEI ingest
python3 site/latin/ingest_perseus.py

# Per-card spans
make latin-spans CARD=01-card-07

# Seed skeleton vocab cards into staging
make latin-vocab SPANS=.tmp/latin-spans.md

# Promote only cards marked "reviewed": true
make latin-promote

# Full chain (spans + staging seed + reviewed promotion)
make latin-seed CARD=01-card-07

# Pipeline QA gate
make latin-audit
```

## Output format

Each surface form becomes one or two `<span data-matches="lemma1:p1,p2;lemma2:p3">word</span>` elements. `trim_primary.py` selects one primary lemma group per token for first-pass authoring, and trailing `-que`/`-ne`/`-ve` enclitics are split into adjacent spans.

## Cache

`sources/morpheus-cache.json` keys surface forms to their raw Morpheus `<NL>` analyses. Built incrementally as `seed.py` runs; committed to the repo so re-runs across pieces are zero-cost and the build is reproducible without re-querying Morpheus. Delete the file to force a fresh parse.

## Tests

`make test` runs the unittest suite under `site/latin/tests/`. Coverage spans the `<NL>` block parser, morphology → parse-code translation, enclitic detection, DICTLINE / INFLECTS parsers, lemma lookup with ending-disambiguation, paradigm generators for nouns / verbs / adjectives, and the TEI ingest pass. Tests that depend on the Morpheus binary or the Whitaker data files skip gracefully when the deps aren't present.

## v1 known limitations

* **Alias debt remains.** Some Morpheus canonical lemmas still map back to legacy card filenames via `LEMMA_ALIAS`.
* **Auto-seeded cards require explicit review.** Staged cards are intentionally not promoted until `reviewed: true` is set.
* **Audit failures are expected during curation.** `latin-audit` is strict by design and will flag sparse paradigms / unresolved entries until cards are cleaned.

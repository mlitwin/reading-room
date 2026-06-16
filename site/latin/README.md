# site/latin

Tooling for the Ovid Metamorphoses book. The pipeline runs from canonical TEI XML to curated, popover-rich markdown pieces plus shared lexicon cards.

## Pipeline

```text
sources/phi0959.phi006.perseus-lat2.xml            ingest_perseus.py
                                                     ↓
                                       sources/cards/book-NN-card-NN.json
                                                     ↓
card_text.py --card NN-card-NN | build_apparatus.py
                                                     ↓
                                      .tmp/latin-apparatus.json
                                                    ↓
                                        apparatus_to_spans.py
                                                    ↓
                                        .tmp/latin-spans.md
                                                     ↓
                     extract_lemmas.py | seed_vocab.py (staging only)
                                                     ↓
                                site/latin/staging/lexicon/*.json
                                                     ↓
                                      promote_staging.py
                                                     ↓
                                  content/_latin-lexicon/*.json
```

## Scripts

* **`ingest_perseus.py`** — parse the canonical TEI vendored at `sources/phi0959.phi006.perseus-lat2.xml`; emit one JSON intermediate per Perseus "card" to `sources/cards/book-NN-card-NN.json`. Run once; re-run after editing the canonical text.
* **`ingest_translation.py`** — parse the canonical Perseus eng3 translation XML and emit per-card translation JSON to `sources/translations/book-NN-card-NN.json`.
* **`build_apparatus.py`** — mechanical stage: tokenises a passage, gathers all Morpheus candidates, and emits an apparatus-criticus JSON with each token classified as unambiguous / ambiguous / unresolved.
* **`apparatus_to_spans.py`** — heuristic stage: picks one primary candidate from apparatus token candidates and emits `<div class="latin-passage">` spans.
* **`seed.py`** — low-level Morpheus integration and span helpers used by both stages.
* **`trim_primary.py`** — candidate scoring helpers used by `apparatus_to_spans.py`.
* **`seed_vocab.py`** — reads lemma names and writes vocabulary skeleton cards to `site/latin/staging/lexicon/`.
* **`promote_staging.py`** — moves staged cards into `content/_latin-lexicon/` when they do not already exist there.
* **`lexicon_corrections.json`** — explicit JSON overrides for cases where the mechanical stem lookup picks the wrong lemma/POS.
* **`scribe_book1_mechanical.py`** — generates first-pass Book 1 piece markdown files from card boundaries, spans, and ingested public-domain translation text.
* **`audit_latin.py`** — *(retired)* The QA gates that lived here moved to the Node validation framework in `site/generator/validate/`. Run `make validate` (or `npm run validate` from `site/generator/`) for the equivalent checks against grammar.json / lexicon.json / the derived glossary / per-text concordance — see `Plans/language-model-refactor.md` for the invariant catalog.
* **`assign_ids.py`** — *(retired)* A one-shot script that backfilled stable `{lemma_form}_{pos_abbrev}` IDs onto the pre-existing per-lemma JSON files. The current `content/_language/latin/lexicon.json` already carries IDs; new entries get them at editorial creation time. Kept on disk for historical reference.
* **`stanza_editorial.py`** — editorial pass helper that compares stanza-la output against current span annotations and lists correction candidates.
* **`morpheus.sh`** — single entry point for Morpheus invocations. Validates the local build, sets `MORPHLIB`, execs `cruncher -S -L`. All Morpheus calls in the project go through this wrapper.

## Setup

See [INSTALL.md](INSTALL.md) for the one-time Morpheus build (perseids-tools fork, clone alongside this repo at `~/Dev/github.com/mlitwin/morpheus`). The build takes ~30 seconds once flex is installed.

## Use

```sh
# One-time TEI ingest
python3 site/latin/ingest_perseus.py

# One-time translation ingest (Perseus eng3)
make latin-translate-ingest

# Per-card spans
make latin-spans CARD=01-card-07

# Per-card apparatus artifact (mechanical evidence layer)
make latin-apparatus CARD=01-card-07

# Seed skeleton vocab cards into staging
make latin-vocab SPANS=.tmp/latin-spans.md

# Promote staged cards into shared lexicon
make latin-promote

# Full chain (spans + staging seed + promotion)
make latin-seed CARD=01-card-07

# Auto-scribe first-pass Book 1 pages
make latin-scribe-book1

# Pipeline QA gate
make latin-audit

# Stanza editorial candidate pass (set STANZA_PYTHON to the venv interpreter)
make latin-stanza-editorial CARD=07 STANZA_PYTHON=/path/to/stanza-venv/bin/python
```

## Output format

Each surface form in apparatus carries all candidate lemmas/codes, then `apparatus_to_spans.py` selects one primary candidate for span rendering. This separates deterministic parsing/evidence collection from debatable disambiguation policy.

## Cache

`sources/morpheus-cache.json` keys surface forms to their raw Morpheus `<NL>` analyses. Built incrementally as `seed.py` runs; committed to the repo so re-runs across pieces are zero-cost and the build is reproducible without re-querying Morpheus. Delete the file to force a fresh parse.

## Tests

`make test` runs the unittest suite under `site/latin/tests/`. Coverage spans the `<NL>` block parser, morphology → parse-code translation, enclitic detection, DICTLINE / INFLECTS parsers, lemma lookup with ending-disambiguation, paradigm generators for nouns / verbs / adjectives, and the TEI ingest pass. Tests that depend on the Morpheus binary or the Whitaker data files skip gracefully when the deps aren't present.

## v1 known limitations

* **Alias debt remains.** Some Morpheus canonical lemmas still map back to legacy card filenames via `LEMMA_ALIAS`.
* **Auto-seeded cards may need post-promotion cleanup.** Review is done against the full built UI and audit feedback.
* **Audit failures are expected during curation.** `latin-audit` is strict by design and will flag sparse paradigms / unresolved entries until cards are cleaned.

# site/latin

Tooling for the Ovid Metamorphoses book. Three scripts cover the pipeline from canonical TEI XML to a curated, popover-rich markdown piece.

## Pipeline

```
sources/phi0959.phi006.perseus-lat2.xml         ingest_perseus.py
                                                  ↓
                                    sources/cards/book-NN-card-NN.json
                                                  ↓
                                            seed.py < text
                                                  ↓
                              <div class="latin-passage">…</div>
                                                  ↓
                                      hand-curate, drop into
                                  content/ovid-metamorphoses/*.md
```

## Scripts

* **`ingest_perseus.py`** — parse the canonical TEI vendored at `sources/phi0959.phi006.perseus-lat2.xml`; emit one JSON intermediate per Perseus "card" to `sources/cards/book-NN-card-NN.json`. Run once; re-run after editing the canonical text.
* **`seed.py`** — reads Latin text from stdin, runs each token through Morpheus via `morpheus.sh`, emits a draft `<div class="latin-passage">` block on stdout. Author hand-curates the result.
* **`morpheus.sh`** — single entry point for Morpheus invocations. Validates the local build, sets `MORPHLIB`, execs `cruncher -S -L`. All Morpheus calls in the project go through this wrapper.

## Setup

See [INSTALL.md](INSTALL.md) for the one-time Morpheus build (perseids-tools fork, clone alongside this repo at `~/Dev/github.com/mlitwin/morpheus`). The build takes ~30 seconds once flex is installed.

## Use

```sh
# One-time ingestion of the canonical text into per-card JSON.
python3 site/latin/ingest_perseus.py

# Seed a passage. Either pipe raw text:
echo "In nova fert animus mutatas dicere formas" | python3 site/latin/seed.py

# Or feed a Perseus card directly:
python3 -c "import json; d=json.load(open('site/latin/sources/cards/book-01-card-01.json'));
print('\n'.join(line['latin'] for line in d['text']))" | python3 site/latin/seed.py
```

## Output format

Each surface form becomes one or two `<span data-matches="lemma1:p1,p2;lemma2:p3">word</span>` elements, with multi-lemma ambiguity preserved verbatim. The author reorders to put the primary reading first and trims implausible alternatives during curation. Trailing `-que`/`-ne`/`-ve` enclitics are split into a second adjacent span.

## Cache

`sources/morpheus-cache.json` keys surface forms to their raw Morpheus `<NL>` analyses. Built incrementally as `seed.py` runs; committed to the repo so re-runs across pieces are zero-cost and the build is reproducible without re-querying Morpheus. Delete the file to force a fresh parse.

## Tests

`make test` runs the unittest suite under `site/latin/tests/`. Coverage spans the `<NL>` block parser, morphology → parse-code translation, enclitic detection, DICTLINE / INFLECTS parsers, lemma lookup with ending-disambiguation, paradigm generators for nouns / verbs / adjectives, and the TEI ingest pass. Tests that depend on the Morpheus binary or the Whitaker data files skip gracefully when the deps aren't present.

## v1 known limitations

* **Some lemmas need card renames.** Morpheus's canonical lemma differs from the existing card filename in a handful of cases (e.g. Morpheus says `tu` where we filed the plural pronoun under `vos.json`, `ad-spiro` vs our `aspiro.json`). `LEMMA_ALIAS` in `seed.py` rewrites these back. Long-term fix: adopt Morpheus's canonical lemma and rename the cards.
* **Proper nouns get no analysis.** Morpheus's stem dictionary covers the common-noun vocabulary; many proper names (Pyrrha, Lycaon) come back as `?:?` and are curated by hand.
* **Cards for new lemmas don't auto-emit yet.** Each new lemma a seed turns up needs a `content/_latin-lexicon/<lemma>.json` written by hand. The vocabulary-card seeder (`seed_vocab.py`) is Phase 3 of the completion plan.

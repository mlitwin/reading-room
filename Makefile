.PHONY: install build serve clean test validate node-test manuscript-md \
        latin-apparatus latin-spans latin-vocab latin-promote latin-clean-staging latin-seed latin-audit \
        latin-translate-ingest latin-scribe-book1 latin-stanza-editorial \
        latin-stanza-annotate latin-stanza-annotate-all latin-normalize-surface

install:
	cd site/generator && npm install

# Regenerate per-chapter markdown from the structured manuscript JSON
# (content/ovid-metamorphoses/manuscript.{latin,english}.json). The markdown
# is a derived build artifact — see Plans/manuscript-format-plan.md
# Decision 2 — and is gitignored at the destination. Downstream stages
# (validate, build) keep reading from content/{text_slug}/book*.md.
manuscript-md:
	cd site/generator && node build-manuscript-md.js --text=ovid-metamorphoses --out=../../content/ovid-metamorphoses
	cd site/generator && node build-manuscript-md.js --text=marvell-hortus --out=../../content/marvell-hortus

# build runs manuscript-md (regenerate markdown from JSON) before validate
# (any error-severity invariant aborts the build). Warnings (the editorial
# backlog) are reported but don't block.
build: manuscript-md validate
	cd site/generator && npm run build

serve:
	cd site/generator && npm run serve

# All four language-model validation suites. Defaults paths to the canonical
# locations; passes through to validate.js otherwise.
validate:
	cd site/generator && npm run --silent validate

# Node-side framework tests (Zod schemas + invariant runner).
node-test:
	cd site/generator && npm test

test:
	python3 -m unittest discover -s site/latin/tests

clean:
	rm -rf docs

# -- Latin pipeline ----------------------------------------------------------
# Per-card seeding: spans from a Perseus card → vocab skeletons → lexicon
# promotion. Each target is invokable on its own; `latin-seed CARD=...`
# chains them.
#
#   make latin-apparatus CARD=01-card-07
#   make latin-spans CARD=01-card-07
#   make latin-vocab SPANS=.tmp/latin-spans.md
#   make latin-promote
#   make latin-seed CARD=01-card-07     # the whole chain

.tmp:
	@mkdir -p .tmp

latin-apparatus: .tmp
	@if [ -z "$(CARD)" ]; then echo "usage: make latin-apparatus CARD=NN-card-NN" >&2; exit 1; fi
	@python3 site/latin/card_text.py --card "$(CARD)" \
	  | python3 site/latin/build_apparatus.py --card "$(CARD)" \
	  > .tmp/latin-apparatus.json
	@echo "wrote .tmp/latin-apparatus.json"

latin-spans: latin-apparatus
	@python3 site/latin/apparatus_to_spans.py .tmp/latin-apparatus.json \
	  > .tmp/latin-spans.md
	@echo "wrote .tmp/latin-spans.md"

latin-vocab:
	@SPANS=$${SPANS:-.tmp/latin-spans.md}; \
	if [ ! -f $$SPANS ]; then echo "spans file $$SPANS not found" >&2; exit 1; fi; \
	python3 site/latin/extract_lemmas.py "$$SPANS" \
	  | python3 site/latin/seed_vocab.py

latin-promote:
	@python3 site/latin/promote_staging.py

latin-clean-staging:
	@rm -f site/latin/staging/lexicon/*.json

latin-seed: latin-spans
	@$(MAKE) latin-vocab SPANS=.tmp/latin-spans.md
	@$(MAKE) latin-promote

latin-audit: validate
	@echo "latin-audit: now sourced from the Node validation framework (make validate)."
	@echo "             The legacy audit_latin.py is retired; see site/latin/README.md."

latin-translate-ingest:
	@python3 site/latin/ingest_translation.py

latin-scribe-book1:
	@python3 site/latin/scribe_book1_mechanical.py

latin-stanza-editorial:
	@STANZA_PYTHON=$${STANZA_PYTHON:-python3}; \
	if [ -z "$(CARD)" ]; then echo "usage: make latin-stanza-editorial CARD=NN [STANZA_PYTHON=/path/to/python]" >&2; exit 1; fi; \
	$$STANZA_PYTHON site/latin/stanza_editorial.py --card "$(CARD)"

latin-stanza-annotate:
	@STANZA_PYTHON=$${STANZA_PYTHON:-site/latin/.venv/bin/python3}; \
	if [ -z "$(CARD)" ]; then echo "usage: make latin-stanza-annotate CARD=NN [STANZA_PYTHON=/path/to/python]" >&2; exit 1; fi; \
	$$STANZA_PYTHON site/latin/annotate_stanza.py --card "$(CARD)"

latin-stanza-annotate-all:
	@STANZA_PYTHON=$${STANZA_PYTHON:-site/latin/.venv/bin/python3}; \
	for card in 1 2 3 4 5 6 7 8 9 10 11 12 13; do \
	  $$STANZA_PYTHON site/latin/annotate_stanza.py --card $$card 2>/dev/null; \
	done

latin-normalize-surface:
	@python3 site/latin/normalize_piece_surface.py

.PHONY: install build serve clean test \
        latin-spans latin-vocab latin-promote latin-clean-staging latin-seed latin-audit

install:
	cd site/generator && npm install

build:
	cd site/generator && npm run build

serve:
	cd site/generator && npm run serve

test:
	python3 -m unittest discover -s site/latin/tests

clean:
	rm -rf docs

# -- Latin pipeline ----------------------------------------------------------
# Per-card seeding: spans from a Perseus card → vocab skeletons → lexicon
# promotion. Each target is invokable on its own; `latin-seed CARD=...`
# chains them.
#
#   make latin-spans CARD=01-card-07
#   make latin-vocab SPANS=.tmp/latin-spans.md
#   make latin-promote
#   make latin-seed CARD=01-card-07     # the whole chain

.tmp:
	@mkdir -p .tmp

latin-spans: .tmp
	@if [ -z "$(CARD)" ]; then echo "usage: make latin-spans CARD=NN-card-NN" >&2; exit 1; fi
	@python3 site/latin/card_text.py --card "$(CARD)" \
	  | python3 site/latin/seed.py \
	  | python3 site/latin/trim_primary.py \
	  > .tmp/latin-spans.md
	@echo "wrote .tmp/latin-spans.md"

latin-vocab:
	@SPANS=$${SPANS:-.tmp/latin-spans.md}; \
	if [ ! -f $$SPANS ]; then echo "spans file $$SPANS not found" >&2; exit 1; fi; \
	python3 site/latin/extract_lemmas.py "$$SPANS" \
	  | python3 site/latin/seed_vocab.py

latin-promote:
	@python3 site/latin/promote_reviewed.py

latin-clean-staging:
	@rm -f site/latin/staging/lexicon/*.json

latin-seed: latin-spans
	@$(MAKE) latin-vocab SPANS=.tmp/latin-spans.md
	@$(MAKE) latin-promote

latin-audit:
	@python3 site/latin/audit_latin.py

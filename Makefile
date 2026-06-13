.PHONY: install build serve clean test \
        latin-apparatus latin-spans latin-vocab latin-promote latin-clean-staging latin-seed latin-audit

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
	@python3 site/latin/promote_reviewed.py

latin-clean-staging:
	@rm -f site/latin/staging/lexicon/*.json

latin-seed: latin-spans
	@$(MAKE) latin-vocab SPANS=.tmp/latin-spans.md
	@$(MAKE) latin-promote

latin-audit:
	@python3 site/latin/audit_latin.py

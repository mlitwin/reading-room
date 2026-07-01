---
title: Notes on the text
notes: true
---

## Texts and provenance
- **The Garden** — 9 stanzas × 8 lines, iambic tetrameter. *Miscellaneous Poems* (1681), via Wikisource. Public domain.
- **Hortus** — Latin hexameter, 58 lines (normalised), with a printed lacuna (*Desunt multa*) after line 48. Same edition/source.
- Raw sources and the normalization audit trail live in `downloads/marvell/` (`the-garden.txt`, `hortus.txt`, `hortus.normalized.txt`, `hortus.normalization-log.md`, `normalize_hortus.py`).

## Latin normalization
The 1681 print is normalised for the study apparatus: æ/œ ligatures expanded, `&` → `et`, whitespace collapsed, and a short list of printer's errors and detached enclitics corrected (e.g. *simplieis* → *simplicis*, *Hotrorum* → *Hortorum*, *Regum per que* → *Regumque per*, *vulner a* → *vulnera*, *temer a vero* → *temeravero*, *referuut* → *referunt*, *Ulnus* → *Ulmus*, spurious *Quiætis*/*Phæbus* ligatures → *Quietis*/*Phoebus*). Every change is logged in `hortus.normalization-log.md`.

## Correspondence structure
The two poems align movement-by-movement but with gaps on both sides — see `correspondences.json`:
- **Parallel**: Hortus 1–6 ↔ Garden I; 7–13 ↔ II; 20–30 ↔ III; 31–48 ↔ IV; 49–58 ↔ IX.
- **Latin-only** (no English): Hortus 14–19 — the "new citizen of the grove" conceit and the invocation of the Muses and Apollo.
- **Lacuna / English-only**: Garden V–VIII (lines 33–64) have no Latin. The Latin's *Desunt multa* falls here; the famous "green thought in a green shade" (VI), the soul-as-bird (VII), and solitary Adam (VIII) are all absent from Hortus.

## Apparatus status (build state)
- Tokenised via Morpheus (`build_apparatus.py`) with a per-text proper-noun overrides file (`latin-overrides.json`). All 384 tokens resolve to a candidate.
- Lemmas absent from the shared consolidated lexicon live as per-book cards under `vocabulary/`, **derived** from `lexicon-curation.json` by `site/marvell/build_manuscripts.py` (edit the curation source, never the cards). The curation pass has assigned correct POS (hence lemma id), gender, glosses, and dictionary heads/principal parts to all 110 cards, and corrected ~23 primary-lemma/parse-code mis-analyses via `surface_primary` (e.g. *Flores* → noun *flos*, *serta* → *sertum*, *opaca* → adj *opacus*, *rosae* → *rosa*, *virides* → *viridis*).
- **Paradigms**: every declinable lemma (102/102 non-defective) carries a full declension/conjugation table. Most are generated from Whitaker's WORDS (DICTLINE + INFLECTS) via `seed_vocab`; the ~20 that Whitaker misses (proper names, tree-nouns, *furor*-the-noun) or renders thin (3rd-declension adjectives, which its generator returns neuter-only) are hand-authored from a `paradigm_spec` (declension class + stem) in `lexicon-curation.json` and built by `build_manuscripts.py::manual_paradigm`. Compound verbs Whitaker lacks are reached via a base-lemma + prefix indirection (*implecto* ← *plecto* + "im"). *potis* is marked defective (it survives chiefly as the comparative *potior*); Greek *Chloe* is singular-only.
- **Remaining**: wire `correspondences.json` into an interactive facing-alignment view (today the pairing is per movement page) — held for now, per the current design being sufficient.

# Validation Backlog

`make validate` as of 2026-06-17: **0 errors, 100 warnings**

```
✓ grammar (G1–G3)
✓ lexicon (L1–L9, L8a)
✓ glossary (Gl1–Gl5)
! concordance: C2 (6), C11 (94)
```

---

## C2 — 6 violations (defective-verb surfaces)

`inquam_v` appears in the concordance on the surface `"in"` (5 tokens: b1-15-127, b1-18-048, b1-22-122, b1-23-234, + 1 more) and `ador_v` on `"aderis"` (b1-21-019). The glossary entry for `"in"` is dominated by `in_prep`; the glossary entry for `"aderis"` is dominated by `ad-sum_v`. These genuinely defective verbs form their 1sg/2sg differently from other paradigm cells, so no glossary candidate exists for their shortened forms.

**Resolution path:** Either (a) add the surface forms explicitly to the defective-verb paradigm cells so the glossary picks them up, or (b) promote these to C11 editorial tokens (add a `selected_lemma_id` to dismiss the spurious candidate).

---

## C11 — 94 violations (homograph disambiguation)

94 concordance tokens have 2–3 lemma candidates and no `selected_lemma_id` editorial selection. These require translator-level reading of the surrounding context to resolve (e.g. `loco` could be `locus_n` or `loco_v`; `summa` could be `summus_adj` or `summa_n`).

**Infrastructure in place:**
- `selected_lemma_id` field on `WordTokenSchema` (`manuscript.latin.json`)
- `data-selected-lemma` attribute in the markdown emitter (`build-manuscript-md.js`)
- `selected_lemma_id` propagation in `build-concordance.js`
- C4/C5 invariants validate selections once made

**Resolution path:** Build an interactive editorial script (plan step a.3) that walks multi-candidate tokens, prints the line context and candidate glosses, accepts a keyboard selection, and writes `selected_lemma_id` back to `manuscript.latin.json`. Re-run `make build` after each editorial session.

---

## Reusable migrate scripts

Three scripts remain in `site/generator/migrate/` that can be re-run as the lexicon or manuscript evolves:

### `prune-spurious-parses-json.js`
Removes parse codes from manuscript tokens when the candidate lemma's paradigm does not actually yield that surface. Run after authoring new paradigm cells that supersede old `noParadigmParse` codes (e.g., when a lemma gets its first real paradigm, the old `"noun"` or `"adj"` parse placeholder becomes spurious).

```
node site/generator/migrate/prune-spurious-parses-json.js [--dry-run]
```

### `split-enclitics-json.js`
Splits word tokens whose surface ends in `-que` or `-ve` into a host token + an enclitic token. Only splits when the host form is already a known glossary entry. Re-run after adding new lexicon entries for words that appear with enclitics in the text.

```
node site/generator/migrate/split-enclitics-json.js [--dry-run]
```

### `clean-pos-hints-json.js`
Aligns each token's `pos_hint` field with the actual POS of its first candidate lemma. Useful after bulk lexicon changes that alter POS assignments.

```
node site/generator/migrate/clean-pos-hints-json.js [--dry-run]
```

---

## Adding new lexicon entries

1. Edit `content/_language/latin/lexicon.json` directly (or write a targeted migrate script).
2. If the new lemma's surface appears in the text with an enclitic, re-run `split-enclitics-json.js`.
3. If existing manuscript tokens now have stale parse codes, re-run `prune-spurious-parses-json.js`.
4. Run `node site/generator/build.js` to rebuild all stored assets.
5. Run `make validate` to check invariants.

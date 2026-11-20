# Milton: *The History of Britain* importer

`import_britain.py` converts the Dartmouth John Milton Reading Room edition
(ed. Thomas H. Luxon, 1671 text) into `content/milton-history-of-britain/`:

```
python3 site/milton/import_britain.py --fetch   # download to .tmp/milton-britain/, then import
python3 site/milton/import_britain.py           # re-import from an existing download
make build
```

The imported markdown and `notes.json` are **committed and canonical**. The
importer is not part of `make build`. Run it again only to pick up upstream
corrections, and review the diff when you do. `index.md` is hand-written and
the importer never touches it.

## Mapping

| Source (MRR) | Here |
|---|---|
| `<span class="mi">` (Milton's italic) | `<i>` |
| `<span class="reversem">` (roman inside italic) | `<span class="roman">` |
| `<span class="tooltip" title>`, `<abbr title>` | `<span class="inline-gloss" data-gloss>` (tap or hover) |
| `<a id=K class="annotBtn">` + `annotation.js` | `[phrase](note:K)` + `notes.json` → note popover |
| `<h2>`/`<h3>` heading runs | `<div class="title-page">` block |
| `<blockquote>` verse | `<div class="verse">` with hard line breaks |

The Digression notes are prefixed `dms-` and the 1681 *Character* notes `chr-`,
which keeps all three annotation files in one namespace. Note bodies are reduced
to an allowlist (`a`, `i`, `b`, `cite`, `br`). Links to the Dartmouth bibliography
and other works become absolute; links to the Digression pages become local.

## Page breakdown

The 1671 text has no chapters and very long paragraphs (one in Book II runs to
~14k words). It also has no page numbers in this edition. Books I–IV are
therefore one page each. Books V–VI are divided by reign in the source, so each
of those books is a directory with a page per reign. The manuscript Digression
comes after Book III, where Milton's text leaves it out. L'Estrange's 1681
*Character* closes the book.

## Licence

CC BY-ND 3.0 US (Trustees of Dartmouth College). Copying is allowed but
adaptation isn't, so the text, glosses and annotations are reproduced verbatim
and only their presentation changes. The importer never adds glosses or edits
notes. Every page carries the required credit: `attribution` in the book's
`index.md` front matter is inherited, and `source` is written per page.
Milton's own text is public domain.

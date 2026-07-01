# Site generator (HTML / CSS build)

The static site is built by a small Node ESM program under `site/generator/`.
There is no framework and no bundler: it reads `content/`, renders HTML with
markdown-it, concatenates plain CSS, and writes everything to `docs/`. The
output works identically over `https://` (GitHub Pages) and `file://` (the iOS
WKWebView).

- Entry point: `site/generator/build.js` (`build()` — also runnable directly).
- Dev server: `site/generator/serve.js` (watch + rebuild + static serve with
  CORS open so the iOS simulator can read from it).
- Package scripts: `npm run build`, `npm run serve`, `npm run validate`,
  `npm test`. The repo `Makefile` wraps these (`make build`, `make serve`, …).

## Content model

`content/` is a tree. The build walks it in `loadPieces()` / `buildNode()`:

- A loose `content/<name>.md` is a **leaf piece** — a single-page library entry.
- A directory with an `index.md` is a **book** (a `node`). Its child `.md`
  files and sub-directories (each needing their own `index.md`) become pages,
  ordered by a numeric filename prefix (`03-foo.md` sorts before `10-bar.md`),
  then alphabetically. The prefix is stripped to form the URL slug.
- Names beginning with `_` are shared resources, not books: `_language/latin/`
  (grammar + lexicon + reference grammar) and `_latin-lexicon/` (per-lemma
  dictionary cards). They are skipped by the book-listing pass.

Each page produces one HTML file. A book also emits `docs/<slug>/nav.json`
(navigation chrome for the iOS app) and, for chapter-formatted Latin texts, a
concordance under `docs/assets/concordance/`.

## Front matter

Validated with Zod in `site/generator/schema.js`. Unknown keys pass through.

**Piece** (library entry — a loose `.md` or a book's `index.md`):

| key | type | notes |
|-----|------|-------|
| `title` | string | required |
| `author` | string | optional; inherited by child pages |
| `date` | string \| date | optional; sorts the library (newest first) |
| `tags` | string[] | optional; only on pieces, not sub-pages |
| `summary` | string | optional; shown in the library list |

**Node** (a book's sub-page — chapter or section `index.md`): same as Piece
minus `tags`, plus `notes: true` to mark the single page that holds the book's
editorial notes / glossary (see the navigation doc). At most one notes page per
book.

Chapter pages of the manuscript books also carry `lines: [start, end]`, but that
is written by the manuscript-md generator, not authored by hand.

## Rendering

`md` is a configured `markdown-it` instance with:

- **KaTeX** (`@vscode/markdown-it-katex`) for `$…$` / `$$…$$` math.
- **highlight.js** for fenced code blocks.
- `html: true` — the Latin-passage books inject a raw `<div class="latin-passage">`
  of `<span data-matches="…">` tokens straight into their markdown. The trust
  model is that only the author writes book markdown.
- A custom core rule `rewrite_md_links` that (a) rewrites inter-doc `*.md` links
  to `*.html` and strips the `^\d+-` ordering prefix, and (b) turns `note:` and
  `ag:` scheme links into popover triggers. See
  [navigation-and-popovers.md](navigation-and-popovers.md).

Templates are trivial `{{var}}` substitution (`applyTemplate`) over
`templates/page.html` and `templates/index.html`. There is no template engine.

## CSS

Authored as ordered partials in `site/reader/css/`, concatenated (no bundler,
numeric prefixes define cascade order) into a single `docs/assets/reader.css`:

| file | scope |
|------|-------|
| `01-base.css` | typography, layout, colour, the reading column |
| `02-index.css` | the library landing page |
| `03-navigation.css` | breadcrumb + prev/next chrome |
| `04-popover.css` | the `#popover-host` shell + chrome (back/up/close, context row) |
| `05-card-header.css` | lexicon-card header (lemma, pos chip, parse slot, tabs) |
| `06-paradigm.css` | the inflection paradigm grid — see [paradigm-grid-pattern.md](paradigm-grid-pattern.md) |
| `07-card-detail.css` | glosses, notes, card body detail |
| `08-reference-grammar.css` | the browsable A&G reference-grammar pages |

`highlight.css` and `cards.js` are copied verbatim into `docs/assets/`. The plain-CSS output is one `<link>` that works over both
transports; there is deliberately no build step for the client assets beyond the
concatenation.

## Emitted assets (`docs/assets/`)

The build produces, in addition to the per-page HTML:

- `reader.css`, `highlight.css`, `cards.js` — the client bundle.
- `katex.min.css` + `fonts/` — copied from the KaTeX package.
- `lexicon.json` / `lexicon.js` — the runtime Latin dictionary (shared lexicon
  plus per-book `vocabulary/` overlays). The `.js` wrapper sets
  `window.__readingRoomLexicon` for `file://` (WKWebView can't `fetch()` local
  files).
- `latin-grammar.json` / `.js` — parse-code grammar (drives chip labels).
- `latin-glossary.json` — surface-form → candidate-lemma index.
- `latin-reference-notes.json` — A&G sections as in-popover note bodies.
- `concordance/<text>.json` (+ `.source-tokens.json`) — per-text token index.
- `reading-room-data.js` / `.json` — combined bundle (grammar + glossary +
  concordances) for the iOS injection path.
- `index.json` — the library manifest (every piece, with `structure` for books).
- `assets.json` — sha256 + size for every file under `docs/`, consumed by the
  iOS sync to skip unchanged files.
- `.nojekyll` — disables Jekyll on Pages so the `_language/` tree isn't dropped.

## Validation

`make validate` (→ `site/generator/validate.js`) runs six invariant suites over
the Latin language model: `grammar`, `lexicon`, `glossary`, `concordance`,
`reference`, `vocabulary`. Error-severity violations fail the build; warnings are
the curation backlog (tracked in `remaining-validate.md`). The validator is
self-contained — it derives the glossary/concordance in memory when the built
artifacts aren't present, so it runs on a fresh checkout. Suite definitions live
in `site/generator/validate/*.invariants.js`; JSON shapes are enforced by Zod
schemas in `site/generator/schema/`.

`make node-test` runs the schema + runner unit tests, including a
manuscript-format round-trip test.

## Manuscript-format books

Ovid and Marvell are stored as structured JSON (`manuscript.latin.json`,
`manuscript.english.json`, `correspondences.json`) rather than hand-written
markdown. `make manuscript-md` (via `build-manuscript-md.js`) regenerates the
per-chapter `book*.md` from that JSON before every build; the markdown is
gitignored. This keeps line ranges, section notes, and the Latin/English
alignment canonical in one place. The Marvell "Hortus / The Garden"
parallel-poem book adds asymmetric line correspondences (gaps allowed on both
sides) recorded in `correspondences.json`.

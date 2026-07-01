# Reading Room

Personal markdown reading material, rendered as a static website and as a custom
iOS reader app. The distinguishing feature is a per-word study apparatus for
Latin texts: tap any Latin word to get its lemma, principal parts or declension,
a full inflection paradigm with the in-context form highlighted, a gloss list,
and deep links into a browsable Allen & Greenough reference grammar.

**Live site:** https://antoninus.org/reading-room/

The site is served by GitHub Pages out of `docs/`. The same `index.json`, asset
manifest, and per-page HTML that drive the web reader are what the iOS app syncs
and renders — there is one content pipeline and two front ends over it.

## Layout

```
content/                markdown + JSON sources (the canonical content)
  _language/latin/       grammar.json, lexicon.json, reference-grammar.json
  _latin-lexicon/        per-lemma dictionary cards (legacy, superseded by lexicon.json)
  <book>/                one directory per book (index.md, chapters, notes.md, …)
site/
  generator/            Node ESM static-site build (build.js, validate.js, schema/, …)
  reader/               client CSS (reader/css/*) + JS (cards.js) copied into docs/assets
  latin/                Python pipeline: TEI → spans → lexicon cards (Ovid)
  marvell/              manuscript builder for the Marvell parallel-poem book
  figures/              generated SVG figures for the math books
docs/                   generated output, served by GitHub Pages — committed, DO NOT hand-edit
app/                    iOS reader app (XcodeGen + SwiftUI + WKWebView)
development/            developer notes and reference docs (this directory)
```

Everything under `docs/` is a build artifact. Per-chapter markdown for the
manuscript-format books (`content/ovid-metamorphoses/book*.md`,
`content/marvell-hortus/book*.md`) is **also** a build artifact — regenerated
from the canonical `manuscript.*.json` and gitignored. Edit the JSON, not the
markdown.

## Quick start

```
make install    # one-time: install the generator's npm deps
make build      # regenerate manuscript markdown, validate, then rebuild docs/
make serve      # watch content/ + reader/, rebuild and serve at http://localhost:5173
make clean      # remove docs/
make validate   # run the Latin language-model validation suites
make node-test  # Node framework tests (Zod schemas + invariant runner)
make test       # Python tests for the Latin pipeline
```

`make build` runs three stages: `manuscript-md` (regenerate `book*.md` from
JSON) → `validate` (error-severity invariants abort the build; warnings are the
editorial backlog and don't block) → `npm run build`.

### Adding a plain piece

Drop a markdown file into `content/` with YAML front matter (`title`, `author`,
`date`, `tags`, `summary`), then `make build`. A directory with an `index.md`
becomes a multi-page "book"; child `.md` files and sub-directories become its
pages. See [development/site-generator.md](development/site-generator.md) for
the front-matter schema and directory conventions.

## Subsidiary documentation

| Topic | Doc |
|-------|-----|
| Static-site generator, front matter, HTML/CSS, assets | [development/site-generator.md](development/site-generator.md) |
| Navigation, inter-doc linking, and the popover system | [development/navigation-and-popovers.md](development/navigation-and-popovers.md) |
| Latin language + grammar support (lexicon, cards, reference grammar) | [development/latin-support.md](development/latin-support.md) |
| Latin content pipeline (TEI → spans → cards) | [site/latin/README.md](site/latin/README.md) |
| iOS reader app | [development/ios-app.md](development/ios-app.md) |
| Paradigm-grid layout pattern | [development/paradigm-grid-pattern.md](development/paradigm-grid-pattern.md) |
| Working conventions for agents/contributors | [AGENTS.md](AGENTS.md) |

## iOS app

Requires Xcode + `xcodegen` (`brew install xcodegen`). The app syncs from
whatever base URL is set in Settings (default `http://localhost:5173`, so leave
`make serve` running during development) and renders the synced HTML in a
WKWebView.

```
cd app
make run        # generate project, build, boot the simulator, install, launch
make build      # build for the simulator only
make generate   # regenerate ReadingRoom.xcodeproj from project.yml
make simulators # list available simulators
make clean      # remove build/ and the generated .xcodeproj
```

Override the target simulator with `make run SIMULATOR="iPhone 16 Pro" OS=18.5`.
See [development/ios-app.md](development/ios-app.md) for the sync model, the
WebView bridges, and the TestFlight/fastlane release flow.

## Continuous integration

`.github/workflows/validate.yml` runs the Node framework tests and the Latin
validation suites on every push and PR to `main`. It is read-only; structural
errors fail the job, editorial-backlog warnings do not. The Pages deploy is
handled separately (the committed `docs/` is served directly).

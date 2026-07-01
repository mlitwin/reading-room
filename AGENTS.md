# AGENTS.md

Working conventions for anyone (human or agent) editing this repo. Start with
[README.md](README.md); the per-topic docs under `development/` go deeper.

## Orientation

- **Two front ends, one pipeline.** `content/` → `site/generator/` → `docs/`.
  The web reader serves `docs/` directly; the iOS app (`app/`) syncs and renders
  the same `docs/`. Change behaviour in the generator or `site/reader/`, not in
  two places.
- Read the topic doc before working in an area: `development/site-generator.md`,
  `development/navigation-and-popovers.md`, `development/latin-support.md`,
  `development/ios-app.md`, and `site/latin/README.md`.

## What is canonical vs. generated

**Never hand-edit generated files.** They are overwritten on the next build.

| Generated (don't edit) | Canonical source |
|------------------------|------------------|
| everything under `docs/` | `content/` + `site/` |
| `content/ovid-metamorphoses/book*.md`, `content/marvell-hortus/book*.md` | the book's `manuscript.*.json` (+ `correspondences.json`) |
| `content/_language/latin/reference-grammar.json` | vendored A&G TEI via `site/latin/ingest_ag.py` |
| `docs/assets/*.json`, `nav.json`, `index.json`, `assets.json` | derived by `build.js` |
| `app/ReadingRoom.xcodeproj/` | `app/project.yml` (XcodeGen) |

`content/_language/latin/lexicon.json` is the source of truth for the dictionary;
`content/_latin-lexicon/*.json` is a legacy fallback. Manuscript `book*.md` is
gitignored — commit the JSON, not the markdown.

## Build, validate, test

```
make install     # one-time npm deps for the generator
make build       # manuscript-md → validate → build docs/
make serve       # watch + rebuild + serve http://localhost:5173 (CORS open for the simulator)
make validate    # Latin language-model invariants (errors block; warnings = backlog)
make node-test   # Node schema + runner tests
make test        # Python tests for the Latin pipeline (site/latin/tests)
```

- The build **fails on error-severity invariants**; warnings are the editorial
  backlog tracked in `remaining-validate.md`. Undefined `note:`/`ag:`/lemma
  references and slug collisions are hard build errors — fix them, don't work
  around them.
- CI (`.github/workflows/validate.yml`) runs `npm test` + `npm run validate` on
  every push/PR to `main`. It's read-only; keep it green.
- After changing content or the generator, run `make build` and **commit both
  `content/` and the regenerated `docs/`** — the live site and the iOS sync both
  read committed `docs/`.

## Content conventions

- Front matter is Zod-validated (`site/generator/schema.js`): pieces need
  `title`; `date` sorts the library; `notes: true` marks a book's single notes
  page. Files/dirs get a numeric `NN-` prefix for ordering (stripped from the
  slug); `_`-prefixed names are shared resources, not books.
- Latin study text is authored as `<span data-matches="lemma:parse,…">` tokens;
  cards stay **word-general** (passage commentary goes in the page's Notes, not
  the card). New lemmas go in `lexicon.json` (shared) or a book's `vocabulary/`
  overlay (text-specific, single global namespace — the build enforces no
  collisions/shadowing).
- The Latin content pipeline (TEI → apparatus → spans → cards) is Python under
  `site/latin/`, driven by the `latin-*` Make targets. See its README before
  running any stage; Morpheus setup is in `site/latin/INSTALL.md`.

## iOS

- Regenerate the project with `make generate` (or `make build`/`make run`) after
  editing `project.yml` — the `.xcodeproj` is gitignored.
- Bump the version via the fastlane `prep-*` / `bump_*` lanes (they edit
  `project.yml`, commit, and tag), not by hand.
- Release credentials are `op://` refs in `app/apple.env` (committed config, not
  secrets); TestFlight lanes need `op run`.

## Git

- Work on a branch; don't commit or push unless asked. Commit or push only what
  was requested.
- Keep `content/` edits and their regenerated `docs/` output in the same commit
  so the tree is always buildable and the site/app stay consistent.
- Ends commit messages with the Co-Authored-By trailer when committing on the
  user's behalf.

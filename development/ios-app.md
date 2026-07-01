# iOS reader app

`app/` is a SwiftUI + WKWebView reader for the same site the web build produces.
It doesn't re-implement rendering: it **syncs the generated `docs/` mirror** and
displays the per-page HTML in web views, so the reading experience, the Latin
popovers, and the grammar all match the web exactly. The project is generated
from `project.yml` by XcodeGen (the `.xcodeproj` is gitignored).

- Bundle id: `org.antoninus.readingroom.app` · Team `352K435X8J`
- Deployment target: iOS 18.5 · Swift 5.10 · portrait on iPhone
- App Store listing name: "Antoninus Reading Room"; in-app / home-screen name
  stays "Reading Room". App icon: a gold-tinted Ptolemy II tetradrachm reverse
  (ANS 1944.100.76124, public domain — see `art/app-icon/`).

## Build & run

```
cd app
make run          # generate → build → boot simulator → install → launch
make build        # build for the simulator
make generate     # regenerate ReadingRoom.xcodeproj from project.yml (needs xcodegen)
make simulators   # list available iPhone simulators
make clean        # remove build/ and the generated .xcodeproj
```

Override the target device with `make run SIMULATOR="iPhone 16 Pro" OS=18.5`.
During development, run `make serve` at the repo root and leave the app's base
URL at the default `http://localhost:5173`; `project.yml` declares an ATS
exception for `localhost` so the simulator can hit the dev server over plain
HTTP.

## Source layout (`app/ReadingRoom/`)

| file | role |
|------|------|
| `ReadingRoomApp.swift` | `@main`; `RootView` gates first-launch sync vs. usable library |
| `Models/Piece.swift` | `Piece` + `LibraryIndex` — decodes `index.json` |
| `Models/BookNav.swift` | `BookNav` / `NavEntry` / `Crumb` — decodes a book's `nav.json` |
| `Stores/LibraryStore.swift` | `@Observable` library state (the decoded index) |
| `Stores/SettingsStore.swift` | `@Observable` settings (base URL, …) |
| `Stores/ReadingPositionStore.swift` | UserDefaults map `slug → {page, scrollY}` for silent resume |
| `Network/SiteSync.swift` | the manifest-driven mirror sync (see below) |
| `Views/ReaderWebHost.swift` | one configured reader WKWebView + its JS bridges |
| `Views/PieceWebView.swift` | single-document reader (one web view) |
| `Views/BookPager.swift` | horizontal pager over a book's pages (one web view each) |
| `Views/BookTOCView.swift` | book table-of-contents sheet, rebuilt from `nav.json` |
| `Views/PieceDetailView.swift` | `BookViewState` + the reader chrome around a piece |
| `Views/LibraryView.swift` | the library list + search |
| `Views/SettingsView.swift` | settings screen |
| `Views/FirstLaunchSyncView.swift` | blocking first-launch sync UI |

## Sync model (`SiteSync`)

The app keeps a local mirror of `docs/` under Application Support and reads only
from it — the network is the sync's problem, never the WebView's.

- Fetches `assets.json` (the build's sha256+size manifest) and diffs it against
  the last-synced manifest to compute the download set (`computeDownloads`);
  unchanged files are trusted or hash-verified locally.
- Groups files by book for **atomic per-book swaps**: downloads into a staging
  dir, then `replaceItemAt` swaps it live, so a book is never half-updated.
  Site-level files (`index.json`, `assets/*`, root pieces) are written last, and
  `index.json` last of all, so the library never advertises a book not yet on
  disk.
- Re-entrant and cooperatively cancellable; partial per-book failures surface in
  `partialFailures` without aborting the whole sync. First launch is blocked by
  `FirstLaunchSyncView` until `index.json` exists; later launches sync in the
  background.

## Rendering & the WebView bridges (`ReaderWebHost`)

Each reader web view loads a `file://` page from the mirror with read access to
the mirror root (so `../assets` resolves). `ReaderWebHost` injects:

- **Chrome-hiding CSS** — the native app supplies its own nav, so the page's
  `header.site` / breadcrumb / prev-next are hidden.
- **popover bridge** — reports `#popover-host` open/close to native so the pager
  suspends horizontal paging while a popover is up.
- **scroll bridge** — debounced `scrollY` for resume.
- **refnotes bridge** — lazily reads `latin-reference-notes.json` off disk on the
  first `ag:` tap and injects it as a JS global (WKWebView can't `fetch()`
  `file://`).
- **lexicon injection** — for Latin books only (`nav.uses_latin`), sets
  `window.__readingRoomLexicon` from the mirror's `lexicon.json` at document
  start, again because `fetch()` is blocked on `file://`. Non-Latin books never
  pay the ~5 MB parse cost.

`PieceDetailView` renders WKWebView, not a native markdown view: an earlier
MarkdownView/FlowLayout attempt broke inline math in prose. The unified in-page
popover is the single popup surface — there is no separate native note sheet.

## Navigation model

- One context-aware leading chevron (Library ↔ Reading); a horizontal swipe is
  prev/next page (via `BookPager`), not history-back.
- The pager keeps only the current page and its neighbours alive, pre-warming
  neighbours off-screen so a swipe reveals already-parsed content.
- The "Open full section ↗" excursion navigates the web view to a reference page
  and relies on the `#g=` reading-state URL so native Back restores the popover.
  See [navigation-and-popovers.md](navigation-and-popovers.md).

## Release (fastlane)

Lanes are defined in `app/fastlane/Fastfile`; `Appfile` pins the team and bundle
id. App Store Connect API-key credentials are referenced as `op://` 1Password
paths in `app/apple.env` (config, committed — not secrets) and resolved at run
time via `op run`.

```
make install-fastlane   # bundle install
make bootstrap          # one-time: app id + cert + provisioning profile
make fastlane-archive   # build Release IPA locally (no creds)
make fastlane-alpha     # build + upload to TestFlight (needs op)
make prep-alpha         # generate release notes, commit, bump patch + tag
make prep-patch / prep-minor / prep-major
```

Version + build number live in `project.yml`
(`CFBundleShortVersionString` / `CFBundleVersion`); the `bump_*` lanes edit them,
commit, and tag. `ITSAppUsesNonExemptEncryption: false` is declared so
TestFlight uploads don't prompt for export compliance.

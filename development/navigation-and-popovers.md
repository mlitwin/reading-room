# Navigation, linking, and popovers

Three linking mechanisms and one unified popover surface. All of them are
authored in markdown/JSON and lowered to HTML by `site/generator/build.js`; the
runtime behaviour lives in `site/reader/cards.js`. The web and iOS front ends
share the same DOM and the same `cards.js` — there is a single popover host, no
native note sheet.

## Between-page navigation

- **Inter-doc links.** A markdown link to another source file (`[x](foo.md)` or
  `[x](sub/03-bar.md)`) is rewritten at build time: `.md` → `.html`, and the
  `^\d+-` ordering prefix is stripped from each path segment so hrefs match the
  slugified page tree. External/scheme links are left alone.
- **Breadcrumb + prev/next.** Every book page renders a breadcrumb
  (`Library › Book › Section`) and a prev/next bar, computed by linearizing the
  book tree (`navJsonFor`). Paths are page-relative in the HTML chrome and
  docs-root-relative in `nav.json` (which the iOS app consumes).
- **`nav.json`.** Per book, at `docs/<slug>/nav.json`: the linear page order,
  each page's breadcrumbs, prev/next, and a `uses_latin` flag (lets iOS gate the
  ~5 MB lexicon injection to Latin books only). Note bodies are **not** in
  nav.json — every client renders notes from in-page `.note-popover-source`
  elements.

## The popover link types

All of them resolve into the single `#popover-host` element and share its
chrome (home, prev/next, close, and the breadcrumb row). The reader stays in the
text: nothing below navigates away while JS runs.

### 1. Editorial notes — `note:` scheme

A book's notes page is a leaf with `notes: true` in front matter. Each `##`
heading becomes a note keyed by its slug; the tokens until the next `##` are the
note body (`extractNotes`). Anywhere in the book, `[phrase](note:the-slug)`
becomes a `<button class="note-link" popovertarget="note-the-slug">`. Undefined
note references are a **build error** (symmetric with the strictness below).
Note→note references are validated after extraction and pulled in via transitive
closure so a page only emits the note sources it can actually reach.

Notes can also come from a book's `notes.json` (`{ key → { title, html } }`),
merged into the same dictionary — used for imported apparatus too large for a
notes page (Milton's *History of Britain*: ~1,700 annotations). `note:` links in
the JSON HTML work the same way.

### Inline glosses (not a popover)

`<span class="inline-gloss" data-gloss="spoken">spok'n</span>` shows its gloss in
a small CSS bubble on hover, or on tap (`cards.js` toggles `.inline-gloss-open`).
It never touches `#popover-host`, so a short gloss (a modernised spelling, an
expanded abbreviation) doesn't push a stack entry. Inside a note link the note
wins.

### 2. Latin word cards — `data-matches` spans

Inside a `.latin-passage` block, each `<span data-matches="lemma:parse,…">word</span>`
is rewritten to `<button class="latin-token" data-lemma=… data-matches=…>`.
Tapping it opens the lexicon card for the primary lemma (first listed);
additional lemmas become "also-matches" tabs. Undefined lemma ids are a build
error. See [latin-support.md](latin-support.md) for the card contents. The card
HTML is rendered at runtime by `cards.js` from `lexicon.json`, not baked into the
page.

### 3. Reference Grammar links — `ag:` and `ref:` schemes

`[§N](ag:N)` cites an A&G § number; `ref:ID` is the general form — a section id
(§ number or `rr-…`), a chapter id (`ch-…`), or `contents`. Both work in piece
text, note bodies, grammar glosses, and the guide page. The build rewrites them
to an anchor carrying the in-flow hook — `data-ag="ID"` (a section) or
`data-ag-toc="ch-…"`/`""` (contents) — and a fallback `href` into the standalone
Reference Grammar (JS-off only). Tapping one, in the popover or in the text,
opens the section or contents *inside* the popover stack. An unknown id is a
build error.

A section entry ends with a footer — ‹ previous · chapter · next › in document
order. Previous/next *turn the page* (replace the current section); the chapter
link opens that chapter's contents (groups → sections), which links up to the
whole contents.

### 4. The Reader's Guide in the text — `guide:` scheme and the Study hub

Every page of a Latin book (`language: latin` front matter, or detected from
Latin-passage spans) carries the Reader's Guide as in-page notes, keyed
`guide-<id>` (`guideNotesDict` in `build.js`): `pronunciation`, `grammar` (the
categories), one per grammar category (`case`, `tense`, …), `terms`, `notes`
(this book's editorial notes as a list), and `study` — the **Study hub**. A
**Study** button in the page header opens the hub as a fresh stack: Notes,
Grammar, Pronunciation, Reference Grammar. `[x](guide:pronunciation)` links to
an entry like a `note:` link; unknown ids are build errors, and `guide:` is only
valid in Latin books. A card's pronunciation "guide" button opens the guide entry
the same way. (Pronunciation lives only here — the standalone guide page no
longer carries it.)

## The popover host and stack

One `<aside id="popover-host" popover>` per page (`popoverHostHtml()`), emitted
when the page has any popover content — always on Latin-book pages and on the
guide page. Its chrome is a control row — home (⌂), prev (‹), next (›), close
(×) — over a breadcrumb row; a `.popover-body` below is swapped on each
navigation. `cards.js` maintains a **stack** of entries:

```
card entry: { type:'card', lemma, matches, stanzaLemma, surface, activeLemma }
note entry: { type:'note', sourceId, label }   // editorial, grammar term, guide
ref  entry: { type:'ref',  id, label }         // a Reference Grammar section
toc  entry: { type:'toc',  id, label }         // its contents: '' or a chapter id
```

### Trail navigation

The stack is the trail of steps taken from the text.

- **Breadcrumb** — the page (tap to close), then every step to the current
  entry: *Proem › In › Preposition › §219 · Prepositions*. Tapping a crumb
  jumps back to that step. Long trails collapse their middle to "…" (sooner
  under 600px).
- **Prev / Next** — step back and forward along the trail.
- **Home (⌂)** — jump back to the origin entry.

Following a link from an earlier step drops the old forward steps; you descend by following a link. Each stack step
remembers its scroll offset (saved on leave, restored before paint).

### Shareable / restorable reading state

The whole stack (entries, per-step scroll, position) is serialized into
the URL hash as `#g=<base64url>` on every navigation (`persistState`). That makes
the open popover **shareable, bookmarkable, and reload-surviving**, and restores
it on Back after any navigation away. Restore fires on `pageshow` / `popstate` /
`hashchange` and on initial load.

## iOS integration

`app/.../ReaderWebHost.swift` injects three bridges into every reader WebView:

- **popover bridge** — posts `{open}` to native on `#popover-host` toggle, so
  the pager can suspend horizontal paging while a popover is open.
- **scroll bridge** — debounced `window.scrollY` reports for silent resume.
- **refnotes bridge** — on the first `ag:`/`ref:` tap, native reads
  `assets/latin-reference-notes.json` off disk (WKWebView can't `fetch()`
  `file://`) and injects `window.__readingRoomReferenceNotes` (plus `…Toc` and
  `…Title`), resolving the pending `cards.js` promise. Loaded lazily, never
  always-on.

Because the popover is pure DOM, every link type behaves identically on web and
iOS — the native layer only routes page-to-page jumps, lazy-loads the two big
`file://`-blocked assets (lexicon, reference notes), and offers a native
**Study** toolbar button (the web one is hidden) that calls
`window.readingRoom.openStudy()`.

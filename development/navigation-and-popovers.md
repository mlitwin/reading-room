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

## The three popover link types

All three resolve into the single `#popover-host` element and share its
back/up/prev/next chrome.

### 1. Editorial notes — `note:` scheme

A book's notes page is a leaf with `notes: true` in front matter. Each `##`
heading becomes a note keyed by its slug; the tokens until the next `##` are the
note body (`extractNotes`). Anywhere in the book, `[phrase](note:the-slug)`
becomes a `<button class="note-link" popovertarget="note-the-slug">`. Undefined
note references are a **build error** (symmetric with the strictness below).
Note→note references are validated after extraction and pulled in via transitive
closure so a page only emits the note sources it can actually reach.

### 2. Latin word cards — `data-matches` spans

Inside a `.latin-passage` block, each `<span data-matches="lemma:parse,…">word</span>`
is rewritten to `<button class="latin-token" data-lemma=… data-matches=…>`.
Tapping it opens the lexicon card for the primary lemma (first listed);
additional lemmas become "also-matches" tabs. Undefined lemma ids are a build
error. See [latin-support.md](latin-support.md) for the card contents. The card
HTML is rendered at runtime by `cards.js` from `lexicon.json`, not baked into the
page.

### 3. Reference-grammar deep links — `ag:` scheme

`[§N](ag:N)` (in piece text, note bodies, or grammar glosses) is rewritten to an
anchor carrying both `data-ag="N"` (the in-flow hook) and a resolved `href` (the
graceful fallback to the standalone reference page). Tapping it opens Allen &
Greenough §N *inside* the popover stack; JS-off or unresolved contexts fall back
to navigating the href. An unknown section id is a build error.

## The popover host and stack

One `<aside id="popover-host" popover>` per page, emitted only when the page has
any popover content. Its chrome — home (⌂), up (↑ with label), prev (‹), next
(›), close (×), and a context row — wraps a `.popover-body` whose innerHTML is
swapped on each navigation. `cards.js` maintains a **stack** of entries:

```
card entry: { type:'card', lemma, matches, stanzaLemma, surface, activeLemma }
note entry: { type:'note', sourceId, label }
ref  entry: { type:'ref',  id, label }        // an A&G §
```

### Context model

The flat stack is grouped into **contexts** — contiguous runs of the same
"family". Two families exist: `local` (cards + editorial notes opened from the
text) and `grammar` (A&G reference sections). A new context begins whenever the
family changes (e.g. tapping an `ag:` link from a card note). The chrome then
means:

- **Prev / Next** — move within the current context; disabled at its ends.
- **Up (↑)** — jump to the last entry of the previous context (labelled with its
  title).
- **Home (⌂)** — jump back to the origin entry.

There is no redo and no "down": you descend by following a link. Each stack step
remembers its scroll offset (saved on leave, restored before paint).

### Shareable / restorable reading state

The whole stack (entries, context, per-step scroll, position) is serialized into
the URL hash as `#g=<base64url>` on every navigation (`persistState`). That makes
the open popover **shareable, bookmarkable, reload-surviving**, and — crucially —
restorable on Back after the "Open full section ↗" excursion that navigates away
to the standalone reference page. Restore fires on `pageshow` / `popstate` /
`hashchange` and on initial load.

## iOS integration

`app/.../ReaderWebHost.swift` injects three bridges into every reader WebView:

- **popover bridge** — posts `{open}` to native on `#popover-host` toggle, so
  the pager can suspend horizontal paging while a popover is open.
- **scroll bridge** — debounced `window.scrollY` reports for silent resume.
- **refnotes bridge** — on the first `ag:` tap, native reads
  `assets/latin-reference-notes.json` off disk (WKWebView can't `fetch()`
  `file://`) and injects `window.__readingRoomReferenceNotes`, resolving the
  pending `cards.js` promise. Loaded lazily, never always-on.

Because the popover is pure DOM, all three link types behave identically on web
and iOS — the native layer only routes page-to-page jumps and lazy-loads the
two big `file://`-blocked assets (lexicon, reference notes).

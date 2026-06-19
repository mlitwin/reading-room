# Paradigm Grid Pattern

The layout pattern used to render inflection paradigms (verb conjugations,
noun/adjective declensions) in the lexicon cards. It replaces the old wide
`<table>` (which forced horizontal scroll) with a **wrapping grid of column
blocks** whose rows stay aligned via CSS **subgrid**, plus a **shared badge
gutter** for the row labels.

A live scratch implementation lives at `.tmp/paradigm-test.html` (gitignored)
for iterating on the CSS.

## Goals

- **No horizontal scroll.** Columns (one per tense·mood, or per case-set) wrap
  to the container width.
- **Aligned rows.** Within a wrapped band, every column shares the same row
  heights so `1 sg … 3 pl` (or `nom … abl`) line up across columns.
- **Row labels once per band**, in a left gutter, not repeated in every cell.
- **Generic + kind-specific.** One set of generic classes drives the layout;
  a kind modifier on the container supplies the row count (and any per-kind
  tweaks) so the same CSS serves verbs, nouns, adjectives, etc.

## DOM structure

Two layers: a **visually-hidden semantic `<table>`** that carries all the
accessibility semantics, and the **visual grid** (`aria-hidden`) that does the
presentation. Both are generated from the same paradigm data. See
[Accessibility](#accessibility-hidden-semantic-table) for the rationale.

```html
<!-- Accessibility layer: real table, clipped via an sr-only WRAPPER div
     (a <table> ignores width:1px, so the div does the clipping). -->
<div class="sr-only">
  <table>
    <caption>deduco — active voice</caption>
    <thead>
      <tr><td></td><th scope="col">Present Indicative</th> …</tr>
    </thead>
    <tbody>
      <tr><th scope="row">1 sg</th><td>dēdūcō</td> …</tr>
      …
    </tbody>
  </table>
</div>

<!-- Visual layer: presentation only, hidden from assistive tech.
     kind modifier sets --rows; see "Kinds" below -->
<div class="paradigm paradigm--verb" aria-hidden="true">

  <!-- Gutter spacer: a column of badge cells that only reserves width.
       Its contents are invisible; it pushes the grid right so the
       absolutely-positioned badges have a clear gutter to sit in. -->
  <div class="paradigm-gutter" aria-hidden="true">
    <span class="paradigm-badge">1 sg</span>
    <span class="paradigm-badge">2 sg</span>
    <span class="paradigm-badge">3 sg</span>
    <span class="paradigm-badge">1 pl</span>
    <span class="paradigm-badge">2 pl</span>
    <span class="paradigm-badge">3 pl</span>
  </div>

  <div class="paradigm-grid">
    <div class="paradigm-col">
      <div class="paradigm-col-head">Present Indicative</div>
      <div class="paradigm-cell">
        <span class="paradigm-badge">1 sg</span>
        <span class="paradigm-form">dēdūcō</span>
      </div>
      <!-- … one .paradigm-cell per row … -->
    </div>
    <!-- … one .paradigm-col per tense·mood (or case-set) … -->
  </div>

</div>
```

Each `.paradigm-col` has **`--rows` + 1 children**: the `col-head` plus one
`.paradigm-cell` per morphological row. A column that lacks a row (e.g. the
imperative has no `1 sg`) still emits an **empty placeholder cell** (with its
badge) so the row shape stays constant across columns:

```html
<div class="paradigm-cell paradigm-cell--empty">
  <span class="paradigm-badge">1 sg</span>
  <span class="paradigm-form">&#160;</span>
</div>
```

## How the layout works

### 1. Wrapping columns
`.paradigm-grid` is a grid with `auto-fill` columns, so it lays out as many
columns as fit the container width and wraps the rest to a new **band**.

### 2. Subgrid for row alignment
Each `.paradigm-col` is itself a grid that adopts the parent's row tracks with
`grid-template-rows: subgrid` and spans `--rows + 1` rows
(`grid-row: span calc(var(--rows) + 1)`). Because all columns in a band share
the same parent row tracks, the row heights equalize across the band — if one
column's form wraps to two lines, that row grows for every column in the band.

> **Tradeoff:** alignment holds *within* a band, not across the wrap boundary.
> Each band equalizes independently. This is inherent to wrapping.

> **Why `span N`, not `1 / -1`:** pinning every column to `grid-row: 1 / -1`
> places them all on the same rows and prevents wrapping (they just keep adding
> columns and overflow). `span (rows+1)` lets auto-placement push overflow
> columns onto new row bands.

### 3. The badge gutter
Row labels would otherwise repeat in every cell, wasting width. Instead:

- `.paradigm-badge` inside the grid is `position: absolute; left: 0; top: auto`.
  `left: 0` pins it to the container's left edge; `top: auto` keeps its natural
  (subgrid) vertical position. So every column's badge for a given row collapses
  onto the **same spot** in the left gutter — one visible label per band row.
- The `.paradigm-gutter` spacer reserves the horizontal room (its own badges are
  in normal flow, giving it intrinsic width) and shifts the grid right so the
  forms don't sit under the gutter.

> The container is `position: relative` so the absolute badges anchor to it, and
> `display: flex` so the gutter spacer and grid sit side by side.

## ⚠️ Opaque badge background (required) — verified

Within a band, **every column emits a badge at `left: 0`**, so up to *N*
identical badges (N = columns per band) stack on the exact same pixels.
Verified in the scratch page: 4 columns ⇒ 4 `1 sg` badges share an identical
bounding rect, and `elementsFromPoint` returns all four.

With transparent badges, the anti-aliased glyph **edges composite darker on
each pass** (a 50%-coverage edge pixel becomes ~94% black after 4 layers),
producing a subtle faux-bold "overstrike."

**Fix:** give `.paradigm-badge` an **opaque background matching the surface**
(`var(--bg)`). The topmost badge's fill occludes the ones beneath, so exactly
one crisp glyph renders. This also guards against any future case where a badge
overlaps form text.

## Kinds

The container modifier supplies the row count via the `--rows` custom property.
The column span is derived as `calc(var(--rows) + 1)` (the `+1` is the
`col-head` row), so changing `--rows` is all that's needed per kind.

```css
.paradigm--verb { --rows: 6; }  /* 1sg 2sg 3sg 1pl 2pl 3pl            */
.paradigm--noun { --rows: 6; }  /* nom voc gen dat acc abl            */
.paradigm--adj  { --rows: 6; }  /* same six cases (split per gender)  */
```

Set `--rows` (and emit the matching gutter badges) from the paradigm's `rows`
array in the generator. New kinds only need a modifier class + the right
gutter labels.

## Default styling (generic)

Matches the current card scheme. Borders/colors reference the existing CSS
custom properties (`--bg`, `--fg`, `--muted`, `--rule`, `--accent`).

```css
/* Accessibility layer: clip the semantic table without removing it from the
   a11y tree. Apply to a WRAPPER div, not the <table> (see Accessibility). */
.sr-only {
  position: absolute;
  width: 1px; height: 1px;
  margin: -1px; padding: 0; border: 0;
  overflow: hidden;
  clip: rect(0 0 0 0);
  clip-path: inset(50%);
  white-space: nowrap;
}

.paradigm {
  --rows: 6;                     /* overridden by the kind modifier */
  position: relative;            /* anchor for the absolute badges  */
  display: flex;
  align-items: flex-start;
}

/* Gutter: reserves badge-column width, pushes the grid right.
   NOTE: display:none reserves NO space — use visibility:hidden. */
.paradigm-gutter {
  visibility: hidden;
  display: flex;
  flex-direction: column;
}
.paradigm-gutter .paradigm-badge { position: static; } /* keep intrinsic width */

.paradigm-grid {
  flex: 1 1 auto;
  display: grid;
  /* min() floor guarantees >=2 columns down to ~320px without a media query
     (see "Phone width" below); use calc(50% - <half the gap>). */
  gap: .5rem;
  grid-template-columns: repeat(auto-fill, minmax(min(8rem, calc(50% - .25rem)), 1fr));
}

.paradigm-col {
  display: grid;
  grid-template-rows: subgrid;
  grid-row: span calc(var(--rows) + 1);  /* +1 for the col-head */
  border: 1px solid var(--rule);
  border-radius: 4px;
  overflow: hidden;
}

.paradigm-col-head {
  background: rgba(0, 0, 0, .03);
  border-bottom: 1px solid var(--rule);
  padding: .25rem .5rem;
  font-family: ui-sans-serif, sans-serif;
  font-size: .72rem; text-transform: uppercase; letter-spacing: .04em;
  color: var(--muted); text-align: center;
}

.paradigm-cell {
  display: flex;
  align-items: baseline;
  gap: .5rem;
  padding: .2rem .5rem;
}
.paradigm-cell + .paradigm-cell { border-top: 1px solid var(--rule); }

.paradigm-badge {
  position: absolute;            /* collapse to the shared left gutter */
  left: 0;
  top: auto;
  background: var(--bg);         /* REQUIRED — prevents overstrike (see above) */
  white-space: nowrap;
  font-family: ui-sans-serif, sans-serif;
  font-size: .68rem; text-transform: uppercase; letter-spacing: .03em;
  color: var(--muted);
}

.paradigm-form {
  flex: 1 1 auto;
  text-align: left;
  overflow-wrap: anywhere;       /* long forms wrap inside the cell */
}

/* active/highlighted form */
.paradigm-cell.active-form { background: var(--accent); }
.paradigm-cell.active-form .paradigm-form { color: var(--bg); font-weight: 600; }
```

## Accessibility (hidden semantic table)

The visual grid is **column-major** (column blocks of cells) and **wraps into
bands**, while ARIA's `table`/`grid` model is strictly **row-major** (rows
containing cells). That mismatch rules out the tempting shortcuts:

- **Don't add ARIA roles to the visual divs.** `role="table"` needs `role="row"`
  children containing the cells; our DOM groups cells by column, so there are no
  rows to mark up. Re-threading with `aria-owns` is fragile and poorly supported.
- **Don't style a real `<table>` into the grid.** Setting `display: grid/flex/
  contents` on table elements **strips their implicit table roles** in WebKit
  (and historically Chromium) — you'd lose exactly what you wanted.

Instead, ship **two layers** generated from the same data:

1. A real, semantic `<table>` — `<th scope="col">` for tense·mood, `<th
   scope="row">` for person/number, `<td>` for forms, `<caption>` for the
   lemma/voice. Visually hidden but kept in the accessibility tree.
2. The visual grid, marked `aria-hidden="true"`.

This gives native table navigation and header association for free, and frees
the visual layer from ARIA entirely — the stacked/absolute badges, the gutter,
and the wrapping all become invisible to AT (no more "1 sg" announced N times).
Wrapping is irrelevant to AT because the table describes the **logical**
(unwrapped) paradigm.

### Gotchas (verified)

- **Hide with clip, not `display:none`.** `display:none` (and `visibility:
  hidden`) remove the node from the accessibility tree. Use an `.sr-only` clip.
- **A `<table>` ignores `width: 1px`.** `display: table` shrink-wraps to content,
  so an `.sr-only` class applied directly to the `<table>` leaves it full-size
  and absolutely positioned — `clip-path` hides the paint, but the large
  invisible box can intercept pointer events over the grid. **Wrap the table in
  an `.sr-only` `<div>`** (a block honors `width:1px` + `overflow:hidden` and
  clips the table inside). Verified: wrapper clips to 1×1, pointer hits the
  visual cell, and the a11y tree still exposes `table › rowgroup › columnheader
  / rowheader / cell`.
- **Drop the visual layer's ARIA.** With the table carrying semantics, remove the
  `role="group"` / `aria-label` we previously put on `.paradigm-col`; the
  `aria-hidden` container makes them redundant noise.
- **Keep the two layers in sync** by emitting both from one generator template.

## Why per-cell badges (not a single gutter of labels)

Row labels appear in two places, by design:

- The `.paradigm-gutter` element — **invisible**, only reserves width.
- The per-cell `.paradigm-badge`s — the **visible** labels, collapsed to the
  left gutter via `position: absolute; left: 0`.

Per-cell badges are *not* replaceable by a single visible gutter column. When
columns wrap into multiple **bands**, each band sits on its own row tracks at
its own vertical position, so labels must appear at *each band's* rows. The
per-cell badges produce that automatically (every band's cells emit a badge →
each band gets its own label column for free). A single gutter element is one
DOM node and can label only the **first** band; bands 2…N would have none. You
can't pre-insert "one gutter per band" either, because band boundaries are
decided at **layout time** by available width — dynamic, not knowable in the
DOM. Hence the absolute-badge approach (and its opaque-background requirement,
since the badges must stack).

The generator should emit the gutter labels and the per-cell badges from the
same `rows` array.

## Phone width: `auto-fill` is deterministic, not fragile

`auto-fill`'s column count is "how many `min`-width tracks fit the container,"
so it keys off an **absolute length** (the 7rem floor) against available width.
This is fully deterministic — the viewport meta
(`width=device-width, initial-scale=1`, already set) is necessary for px↔device
mapping but does not change the arithmetic.

With rem = 18px (so 7rem = 126px) and popover content ≈ `92vw − 2×1.4rem`:

| Device | content width | natural auto-fill |
|---|---|---|
| iPhone 16 Pro (402px) | ~320px | 2 columns (breakpoint redundant) |
| iPhone SE (320px) | ~244px | 1 column (two 126px tracks + gap don't fit) |

So the `max-width: 480px` 2-up rule only matters on the narrowest phones. It is
**not** fundamental, and we can drop it.

### `min()` track floor (chosen — no media query)

```css
grid-template-columns: repeat(auto-fill, minmax(min(8rem, calc(50% - 6px)), 1fr));
```

The floor collapses to ~half-width (minus half the gap) on narrow screens so
**≥2 columns always fit**, while `8rem` wins on wider screens and more columns
appear. Use `calc(50% - <half the gap>)` so two columns plus the gap fit exactly.

**Verified** in `.tmp/paradigm-test.html` (no media query present):

| Viewport | Columns/band | Horizontal overflow |
|---|---|---|
| 320px (iPhone SE) | 2 | none |
| 402px (iPhone 16 Pro) | 2 | none |
| 1200px (desktop) | 8 | none |

### Container queries (alternative)

Sizing columns from the popover width (92vw) rather than the viewport is the
most *correct* fix, but it's more machinery than the `min()` floor needs.

## Other follow-ups

- **`calc()` in `grid-row: span`.** Verified working (resolves to `span 7` for
  `--rows: 6`). Keep an eye on older browser support if the target widens.

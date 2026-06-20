# Paradigm Grid Pattern

The layout pattern used to render inflection paradigms (verb conjugations,
noun/adjective declensions) in the lexicon cards. It replaces the old wide
`<table>` (which forced horizontal scroll) with a **wrapping grid of column
blocks** whose rows stay aligned via CSS **subgrid**, plus a **shared badge
gutter** for the row labels.

**Working demonstration:** [`paradigm-grid-demo.html`](./paradigm-grid-demo.html)
— a self-contained, dependency-free snapshot of the pattern as shipped (the
`deduco` active-voice paradigm). Open it directly in a browser and drag the
container-width slider to watch the columns wrap into bands. Its CSS is copied verbatim from
`site/reader/css/06-paradigm.css` (with the `.card-popover .card-paradigm` scope
rewritten to `.paradigm`) and its DOM matches what `site/reader/cards.js`
`renderSection()` emits, so it stays an accurate reference. Keep it in sync when
the pattern changes.

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

  <!-- Gutter spacer: ONE badge stack that only reserves width (= widest
       label). Invisible; pushes the grid right so the absolutely-positioned
       cell badges have a clear gutter to sit in. -->
  <div class="paradigm-gutter" aria-hidden="true">
    <span class="paradigm-badge">{badge stack}</span>
  </div>

  <div class="paradigm-grid">
    <div class="paradigm-col">
      <div class="paradigm-col-head">Present Indicative</div>
      <div class="paradigm-cell">
        <span class="paradigm-badge-box"><span class="paradigm-badge">{badge stack}</span></span>
        <span class="paradigm-form">dēdūcō</span>
      </div>
      <!-- … one .paradigm-cell per row … -->
    </div>
    <!-- … one .paradigm-col per tense·mood (or case-set) … -->
  </div>
  <!-- {badge stack} = every row label; the active row's is marked --shown:
       <span class="paradigm-badge-label paradigm-badge-label--shown">1 sg</span>
       <span class="paradigm-badge-label">2 sg</span> … (see "Uniform badge width").
       The gutter's copy marks none. -->


</div>
```

Each `.paradigm-col` has **`--rows` + 1 children**: the `col-head` plus one
`.paradigm-cell` per morphological row. A column that lacks a row (e.g. the
imperative has no `1 sg`) still emits an **empty placeholder cell** (with its
badge) so the row shape stays constant across columns:

```html
<div class="paradigm-cell paradigm-cell--empty">
  <span class="paradigm-badge-box"><span class="paradigm-badge">{badge stack}</span></span>
  <span class="paradigm-form">&#160;</span>
</div>
```

The `.paradigm-badge-box` wrapper is a zero-width **size container** that lets
each badge match its row height exactly — see
[Full-height row headers](#4-full-height-row-headers-container-query).

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

### 4. Full-height row headers (container query)

The badges read as row-header **cells** (header tint + border, the full row
height) rather than floating chips. Because a badge is absolutely positioned in
the gutter, it can't naturally inherit its row's height — so each badge is
wrapped in a `.paradigm-badge-box`:

```css
.paradigm-badge-box { width: 0; align-self: stretch; container-type: size; }
.paradigm-badge-box .paradigm-badge { height: 100cqh; }   /* = the row height */
```

#### Where the height actually comes from

The common confusion: "a size container is sized *as if it had no children*, so
how does it ever match a row that wraps to two lines?" The key is that **size
containment only makes an element ignore its own _contents_ when computing its
_intrinsic_ size. It does not make the element ignore a size imposed from
_outside_.** The badge-box's height is imposed entirely from outside — by the
parent cell's flex stretch. The chain (verified — see the table below):

1. **`.paradigm-cell` is `display: flex; align-items: stretch`** with two
   children: the `.paradigm-badge-box` and the `.paradigm-form`.
2. **The cell's height is set by the form.** Flex computes each child's
   hypothetical cross-size first:
   - `.paradigm-form` → its content height (1 line ≈ 28px, 2 lines ≈ 51px).
   - `.paradigm-badge-box` → **0**: it has `width: 0`, its only child
     (`.paradigm-badge`) is `position: absolute` (out of flow), *and* size
     containment tells the engine to size it as if empty. It contributes
     nothing.
   - The flex line takes the max → the **form's** height. (No circularity: the
     box is 0 *before* stretch, so it never inflates the row.)
3. **`align-items: stretch` pushes that height back down** onto both children,
   stretching the badge-box to the cell's cross-size. This external size
   overrides the box's contained (=0) intrinsic height — this is the step that's
   invisible if you only think about containment.
4. **`100cqh` reads that stretched height.** `container-type: size` makes the box
   a query container on the block axis; `cqh` = 1% of the container's *own
   laid-out height*, which is now the row height. The badge gets exactly the row
   height.

So containment is **not** what sets the height — flex stretch is. Containment
does two things only: it guarantees the box never *adds* height to the row
(step 2), and it unlocks block-axis container units (`cqh`). Proof: removing
`align-self: stretch` drops the box to **0** for every row, because then nothing
imposes a height and containment leaves no content-height to fall back on.

| Row | cell | form | badge-box | badge |
|---|---|---|---|---|
| 1-line | 28 | 28 | 28 | 28 |
| 2-line (`deduxerunt, deduxere`) | 51 | 51 | 51 | 51 |
| badge-box, `align-self: stretch` removed | — | — | **0** | — |

#### Isn't that circular? (why containment is required)

A fair worry: the box's height comes from the cell, the cell lays out the box's
children… so how does the cell know its height? Without containment it genuinely
*would* be circular:

```
box height        ⟵ (normal flow)  ⟵ box's children
box's children    ⟵ (100cqh)       ⟵ box height
```

`A` depends on `B` and `B` depends on `A` — unresolvable. **This is exactly why
container queries _require_ a container declaration:** `container-type` cuts the
top edge by making the box's size ignore its contents, turning the cycle into a
one-way chain:

```
box height        ⟵ (containment: ignore contents)  ✂  box's children
box's children    ⟵ (100cqh)                        ⟵ box height
```

Verified directly: injecting a **200px-tall in-flow child** into the box changes
the row height by **0px** while `container-type: size` is set, and by the full
**200px** once it's removed. The children genuinely cannot reach the outer
layout.

Also note the height source isn't even *inside* the box: the cell's height comes
from the `form`, which is the box's **sibling**, not its child. The box only ever
contributes its content-independent size (0) to the cell.

**So is it two layouts?** Conceptually yes — two *ordered, isolated scopes*, not
two passes of the same subtree converging to a fixed point:

1. **Outer scope.** Lay out the cell and its direct children, treating the box as
   a sealed, content-independent leaf. Flex takes the max cross-size (form = its
   text height, box = 0), then `align-items: stretch` writes that height onto the
   box. The box now has a definite size; nothing inside it was consulted.
2. **Inner scope.** With the box's size fixed as an input, lay out its subtree;
   `100cqh` resolves against that fixed height.

Because containment guarantees the inner scope can't change the box's size, one
outer pass + one inner pass is always sufficient and stable — no iteration. That
isolation is the whole point of containment (and what lets engines skip
re-laying-out a contained subtree when only the outside changes).

#### Other notes

- **The badge answers to two independent ancestor lookups.** As a
  `position: absolute` element it has both a *containing block* (nearest
  positioned ancestor = `.paradigm-body`, which is why every badge collapses into
  the shared gutter via `left: 0`) and a *query container* (nearest ancestor
  container = `.paradigm-badge-box`, which is why `100cqh` gives it its own row's
  height). Different ancestors, resolved separately — so the gutter-collapse and
  the full-height sizing don't interfere. (`container-type` does not establish a
  containing block, so it doesn't disturb the positioning chain.)
- Putting `container-type: size` on the cell itself would collapse the row: the
  cell would ignore the form's height too (≈11px observed). The zero-width box
  isolates containment to an element whose height is fed *externally* by stretch,
  while the cell keeps sizing to the form normally.
- The cell's row divider lives on the **form** (`.paradigm-cell + .paradigm-cell
  .paradigm-form { border-top }`), not on the cell. A cell `border-top` would
  push the badge's content box down 1px and misalign the badge dividers from the
  form's; on the form (border-box) both land on the cell boundary.

## ⚠️ Opaque badge background (required) — verified

Within a band, **every column emits a badge at `left: 0`**, so up to *N*
identical badges (N = columns per band) stack on the exact same pixels.
Verified in the scratch page: 4 columns ⇒ 4 `1 sg` badges share an identical
bounding rect, and `elementsFromPoint` returns all four.

With transparent badges, the anti-aliased glyph **edges composite darker on
each pass** (a 50%-coverage edge pixel becomes ~94% black after 4 layers),
producing a subtle faux-bold "overstrike."

**Fix:** give `.paradigm-badge` an **opaque background**. The topmost badge's
fill occludes the ones beneath, so exactly one crisp glyph renders. Use the same
opaque header tint as the col-head, via a shared custom property so the two
match in both light and dark mode (an `rgba(0,0,0,…)` tint would diverge in dark
mode):

```css
.paradigm { --paradigm-head-bg: color-mix(in srgb, var(--fg) 3%, var(--bg)); }
.paradigm-col-head,
.paradigm-badge { background: var(--paradigm-head-bg); }
```

## Uniform badge width (stacked labels — no magic number)

Each absolute badge content-sizes to *its own* label, and the labels differ
(`nom` vs `dat` vs `voc`), so badges would otherwise end at different x and leave
ragged gaps before the first column. The fix is **intrinsic, not a fixed width**:

Every badge holds the **full row-label stack** — one `.paradigm-badge-label` per
row, all in one grid cell (`grid-area: 1/1`) — and exactly one is marked
`--shown` (visible); the rest stay `visibility: hidden` (laid out, so they still
contribute width). Each badge therefore sizes to `max-content` of *all* labels =
the widest label, and they all match **with no cross-element transfer** and no
magic number. (This is the only thing that does — see the next section.)

```css
.paradigm-badge { display: grid; place-items: center; }   /* stack + center */
.paradigm-badge-label { grid-area: 1/1; white-space: nowrap; visibility: hidden; }
.paradigm-badge-label--shown { visibility: visible; }
```

The CSS is row-count-agnostic (two rules, no `:nth-child` ladder). The renderer
does the selection: each row's compact header is rendered once, then a per-row
badge is assembled by marking that row's label `--shown` and **cloned into every
column**; the gutter gets a copy with nothing marked, so it only reserves width.

> **Cost:** each cell badge carries every row label (~N× the badge nodes). It's
> transient (one card open at a time) and the simpler `min-width: <floor>` token
> is a fine alternative for a stable label set — but the stack auto-adapts to any
> label set with zero magic numbers.

### Why not a container query (the rejected alternatives)

The gutter already auto-sizes to the widest label, so it's tempting to make it a
container and have the badges read its width. It can't work, for two independent
reasons (both verified):

- **A container can't shrink-wrap.** `container-type: size`/`inline-size` makes
  an element's size *independent of its contents*, so the moment the gutter
  becomes a query container its width collapses (→ 0) — it can no longer be "the
  widest label" width. (Nesting the grid inside it, or making the grid
  `position: absolute`, doesn't escape this.)
- **Container units are ancestor-only.** Even with a sized container, `cqw`
  resolves against an *ancestor* container; the cell badges live in sibling
  `.paradigm-col` subtrees, so they could never read the gutter's size.

General rule: intrinsic (content) sizing flows **up** the tree, container queries
flow **down** — a descendant can't derive a length from an ancestor's
content-based size (it would be a cycle). So the only pure-CSS way to make every
badge the widest-label width is to give *each badge its own copy* of all the
labels — the stacked-label technique above. (A JS measure that writes a
`--badge-w` token is the other option; we chose the no-JS one.)

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
     (see "Phone width" below). With column-gap 0, the floor is exactly 50%. */
  grid-template-columns: repeat(auto-fill, minmax(min(8rem, 50%), 1fr));
  gap: .6rem 0;                  /* no column gap (classic table); row gap = bands */
}

/* Columns share single 1px gridlines: square corners, and margin-left:-1px
   collapses each column's left border onto the previous column's right border
   (works across wrapped bands since every column shifts equally). */
.paradigm-col {
  display: grid;
  grid-template-rows: subgrid;
  grid-row: span calc(var(--rows) + 1);  /* +1 for the col-head */
  row-gap: 0;                    /* cells touch within a column (band gap stays) */
  border: 1px solid var(--rule);
  margin-left: -1px;
  overflow: hidden;
}

.paradigm-col-head {
  background: var(--paradigm-head-bg);
  border-bottom: 1px solid var(--rule);
  padding: .25rem .5rem;
  font-family: ui-sans-serif, sans-serif;
  font-size: .72rem; text-transform: uppercase; letter-spacing: .04em;
  color: var(--muted); text-align: center;
}

/* Cell has no padding/border itself — the form carries both, so the badge can
   span the full row height and the row divider lands on the cell boundary. */
.paradigm-cell {
  display: flex;
  align-items: stretch;
  padding: 0;
}
.paradigm-cell + .paradigm-cell .paradigm-form { border-top: 1px solid var(--rule); }

/* Size-container box that stretches to the row height (see "Full-height row
   headers"). */
.paradigm-badge-box { width: 0; align-self: stretch; container-type: size; }

.paradigm-badge {
  position: absolute;            /* collapse to the shared left gutter */
  left: 0;
  top: auto;
  background: var(--paradigm-head-bg);  /* opaque — prevents overstrike (above) */
  border: 1px solid var(--rule);
  border-bottom-width: 0;        /* next badge's border-top is the divider */
  padding: 0 .4rem;
  display: grid; place-items: center;   /* stack all labels, reveal one */
  font-family: ui-sans-serif, sans-serif;
  font-size: .68rem; text-transform: uppercase; letter-spacing: .03em;
  color: var(--muted);
}
/* Uniform width with no magic number — see "Uniform badge width" below. */
.paradigm-badge-label { grid-area: 1 / 1; white-space: nowrap; visibility: hidden; }
.paradigm-badge-label--shown { visibility: visible; }
.paradigm-badge-box .paradigm-badge { height: 100cqh; }       /* = the row height */
.paradigm-col .paradigm-cell:last-child .paradigm-badge { border-bottom-width: 1px; }

.paradigm-form {
  flex: 1 1 auto;
  align-self: stretch;
  display: flex; align-items: center;    /* center text when the row is taller */
  padding: .2rem .5rem;
  text-align: left;
  overflow-wrap: anywhere;       /* long forms wrap inside the cell */
}

/* active/highlighted form */
.paradigm-cell.active-form { background: var(--accent); }
.paradigm-cell.active-form .paradigm-form { color: var(--bg); font-weight: 600; }
```

> Assumes a global `* { box-sizing: border-box }` reset (so the form's
> `border-top` adds no row height). The shipping rules also live under a
> `.card-popover .card-paradigm` scope and read `--rows` from an inline style —
> see [Implementation notes](#implementation-notes).

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
so it keys off an **absolute length** (the `8rem` floor) against available
width. This is fully deterministic — the viewport meta
(`width=device-width, initial-scale=1`, already set) is necessary for px↔device
mapping but does not change the arithmetic.

A fixed `8rem` floor alone would drop to 1 column on the narrowest phones (two
`8rem` tracks don't fit ~320px). The `min(8rem, 50%)` floor avoids that without
a media query (next section), so no `max-width` breakpoint is needed.

### `min()` track floor (chosen — no media query)

```css
grid-template-columns: repeat(auto-fill, minmax(min(8rem, 50%), 1fr));
```

The floor collapses to half-width on narrow screens so **≥2 columns always
fit**, while `8rem` wins on wider screens and more columns appear. With a
non-zero column gap, subtract half the gap (`calc(50% - <half-gap>)`) so two
columns plus the gap still fit; the shipping grid uses **column-gap 0**, so a
plain `50%` is exact.

**Verified** in the [demo](./paradigm-grid-demo.html) (no media query present):

| Viewport | Columns/band | Horizontal overflow |
|---|---|---|
| 320px (iPhone SE) | 2 | none |
| 402px (iPhone 16 Pro) | 2 | none |
| 1200px (desktop) | 8 | none |

### Container queries (alternative)

Sizing columns from the popover width (92vw) rather than the viewport is the
most *correct* fix, but it's more machinery than the `min()` floor needs.

## Implementation notes

How the shipping code (`site/reader/cards.js`, `site/reader/reader.css`) maps to
this reference:

- **Class scope / naming.** The CSS in this doc uses bare, generic `.paradigm-*`
  classes. The shipping rules are all scoped under `.card-popover .card-paradigm`
  and the container class is `.card-paradigm` (not `.paradigm` + a `--rows`
  kind modifier). `--rows` is set per section via an **inline `style`** by the
  renderer rather than a `.paradigm--verb` modifier.
- **Layout/theme separation (done via a token layer).** Rather than split the
  rules onto bare `.paradigm-*` selectors, `06-paradigm.css` defines a block of
  `--paradigm-*` theme tokens at the top (colors, fonts, and the layout knobs:
  `--paradigm-col-min`, `--paradigm-band-gap`, `--paradigm-rule`,
  `--paradigm-head-bg`, `--paradigm-label-font`, `--paradigm-form-font`). Every
  rule below consumes tokens, so the structural
  mechanics carry no hard-coded colors/fonts/magic sizes — re-theme (or reuse
  elsewhere) by overriding tokens, no selector changes needed. The
  `.card-popover .card-paradigm` scope is kept (no specificity risk).
- **Renderer.** `renderSection()` emits both layers (the `.sr-only` `<table>` and
  the `aria-hidden` visual) from one paradigm section. Each row's compact header
  is rendered once; a per-row badge (its label marked `--shown`) is assembled and
  cloned into every column, with a nothing-marked copy for the gutter (see
  "Uniform badge width").
- **Working demo.** `development/paradigm-grid-demo.html` mirrors this and is the
  place to eyeball changes; keep it in sync.

## Other follow-ups

- **`calc()` in `grid-row: span`.** Verified working (resolves to `span 7` for
  `--rows: 6`). Keep an eye on older browser support if the target widens.
- **Dead `.paradigm-cell--empty` modifier.** Emitted on placeholder cells as a
  semantic hook but currently unstyled.

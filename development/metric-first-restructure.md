# Metric-first restructure of the tensor-calculus book

Plan for three pieces of reader feedback on `content/tensor-calculus-on-manifolds`
(2026-10-05). It follows the merge recorded in
[tensor-mechanics-unification.md](tensor-mechanics-unification.md).

1. **The notation page is too long.** Split it. Keep on the page only what a reader
   needs on page one, and introduce the rest where it is first used, without losing
   rigour.
2. **Forward references ("below").** Fix the places that use an object before it is
   defined.
3. **Metric first.** Make a metric part of the main-line setting from the start,
   instead of building bare manifolds first with asides about a metric. Mark the
   results that hold without one.

## 1. Diagnosis

The current order is:

- Part I, bare manifolds: ch 1–5, with a one-page metric aside in 1.4.
- Part II, mechanics without a metric: ch 6–8.
- Part III, geometry: the sphere (9), tensors (10), the metric (11), connection (12).
- Part IV, natural systems: ch 13.
- Part V, relativity: ch 14–16.

This order postpones the metric, and that has a cost:

- **Duplication.** The metric is introduced three times: the 1.4 aside, ch 11, and the
  kinetic metric in ch 13. Signature and the lightcone are covered in both 1.4 and 11.1.
- **Back-patching.** Mechanics is built twice. Part II is metric-free, and ch 13 then
  re-reads it with a metric (the Legendre transform becomes ♭, Euler–Lagrange becomes
  covariant Newton, Noether becomes Killing). Most physical examples (particle on
  S², pendulum, rigid body) wait until ch 13.
- **Forward references.** Several early pages point ahead to objects they cannot yet
  use:
  - 9.3 draws dual covectors "via the metric (see below)";
  - 10.4 says its area form "will reappear with a metric explanation";
  - 1.3 previews the musical isomorphisms;
  - 9.2 quotes the metric matrix from ch 11.
- **Tensors come late.** Tensors (ch 10) follow forms (ch 3). Forms then have to be
  defined from scratch and re-identified as antisymmetric tensors later.

Most GR texts (Carroll, Wald, MTW) use the reverse order:

1. manifold, vectors and tensors;
2. metric;
3. forms and integration;
4. connection and curvature.

These texts flag the results that need no metric as they go. That order fits this
book's audience.

## 2. Convention: marking metric-free results

The main-line setting is a manifold with a metric, $(M, \tens{g})$. Many results
need less structure, and the text says so with one consistent device:

- **In running text:** a paragraph led by **Without a metric.** It states what
  survives and why. Examples:
  - the Lie bracket, $d$, Stokes's theorem and de Rham cohomology;
  - the Euler–Lagrange equations for an arbitrary $L$;
  - the symplectic form;
  - Noether's theorem for an arbitrary flow;
  - an affine connection with torsion.
- **In each chapter index:** one line, "Metric-free: …", listing those results.
- **On the book index:** a short table, "What needs the metric", shown in the sketch below.

  | Needs only the manifold | Needs $\tens{g}$ |
  |---|---|
  | vectors, covectors, tensors; flows, $[\,,]$, $\Lie$; forms, $d$, $\int$, Stokes; de Rham; Euler–Lagrange; Hamilton, $\tens{\omega}$, Poisson; Noether | lengths, angles, causal type; ♭/♯, grad, div; $\mathrm{vol}_g$, $\star$; Levi-Civita, geodesics, curvature; Killing fields; kinetic metric, covariant Newton; Einstein equations |

  Connections sit between the columns. An affine connection needs no metric, but
  the Levi-Civita connection does. Newton–Cartan is the worked case of a connection
  without a metric.

## 3. Target structure

The five parts are kept. Chapter count drops from 16 to 15, plus the notes page, and
no content is lost.

| New | Title | Pages (source) |
|---|---|---|
| | **Part I — Manifolds, tensors and the metric** | |
| 1 | Manifolds | charts & smooth maps (1.1); tangent space (1.2); cotangent space & bundles (1.3). The 1.4 aside is dissolved into ch 3 |
| 2 | Tensors | multilinear maps & type (10.1); components & transformation law (10.2); two languages (10.3). The area form leaves 10.4 for ch 6 |
| 3 | The metric | the metric tensor, signature, causal type, curve length, pullback/induced metric, existence (1.4 + 11.1); raising & lowering, grad, metric trace (11.2 minus volume/Hodge) |
| 4 | Coordinates on the sphere | the sphere & two charts (9.1); standard chart (9.2); skew chart (9.3); changing charts (9.4); vectors & covectors (9.5); round metric in three charts (11.4 minus Killing/rotation tail); $\tens{J}$ (10.4) |
| | **Part II — Calculus on manifolds** | |
| 5 | Vector fields and flows | vector fields (2.1); flows & bracket (2.2); Lie derivative (2.3), with $\Lie_{\tens{\xi}}\tens{g} = 0$ defining isometries |
| 6 | Differential forms | $k$-forms & wedge, now as antisymmetric tensors from ch 2 (3.1); $d$ & pullback (3.2); closed & exact (3.3) |
| 7 | Integration | orientation & integration (4.1); **new page:** metric volume form, $\int f\,\mathrm{vol}_g$, Hodge star, the area form on $S^2$ (from 11.2 and 10.4); Stokes, with the divergence theorem (4.2) |
| 8 | Connection and curvature | **reordered:** covariant derivative & Levi-Civita first (12.1 + 12.2, main line), with "Without a metric: affine connections" as a section; geodesics & parallel transport; **Killing vectors** (11.3 + sphere tail of 11.4); torsion & curvature (12.3); geodesic deviation (12.4); on the sphere (12.5) |
| 9 | De Rham cohomology | (5.1, 5.2), optional, metric-free throughout |
| | **Part III — Mechanics** | |
| 10 | Lagrangian mechanics | Newtonian (6.1); **configuration space & kinetic metric** (13.1); action & Euler–Lagrange, then covariant Newton & Jacobi metric (6.2 + 13.2); constraints as induced metrics, examples (6.3 + 13.1 constraints) |
| 11 | Hamiltonian mechanics | Legendre transform: ♭ for natural systems, fiber derivative in general (7.1 + 13.1); phase space & symplectic form (7.2, flagged metric-free) |
| 12 | Symmetry and Noether | the theorem (8.1, general); Killing symmetries, particle & pendulum on $S^2$ (13.3); classical examples (8.2); the rigid body (13.4) |
| | **Part IV — Relativity** | |
| 13–15 | Special relativity; fields & stress–energy; general relativity | unchanged apart from renumbered links (14–16) |
| 16 | Notes | (17) |

Effects of this structure:

- **Part IV (natural systems) disappears as a separate part.** Its content now
  leads the mechanics chapters instead of revisiting them. The dictionary table in
  13.0 moves to the ch 10 index as the summary of Part III.
- **Mechanics comes after curvature.** Covariant Newton needs the Levi-Civita
  connection, so the mechanics chapters follow ch 8. A mechanics-only reader needs:
  - ch 1–3 and 5;
  - the first half of ch 8 (connection, geodesics, Killing vectors).

  The reading paths say so. The cost is a longer path to the first mechanics page.
  The gain is that the examples arrive with the theory.
- **Killing vectors move into ch 8.** The Killing equation and the conserved
  $\xi_\mu \dot\gamma^\mu$ both need $\nabla$. Ch 5 only defines isometries through
  $\Lie_{\tens{\xi}} \tens{g} = 0$ and points ahead in one line. This removes the
  current page's "quotes one formula from chapter 12".
- **Tensors come before forms.** The forms chapter starts from "a $k$-form is an
  alternating $(0, k)$-tensor (ch 2)". It no longer re-derives multilinearity.

### Alternatives considered

- **Keep the order and promote 1.4 into a full chapter.** This option is cheaper,
  but mechanics still runs metric-free first and ch 13 still re-reads it, so it does
  not meet the feedback.
- **Put mechanics before the connection.** Mechanics would come right after
  integration, with Euler–Lagrange in coordinates and covariant Newton deferred.
  That reintroduces back-patching.
- **Move the sphere chapter to the front.** It would follow ch 1 directly, before
  tensors. But its pages use the components and transformation law from ch 2, and
  with the metric they can use $\tens{g}$ directly. After ch 3 is the natural
  place.

## 4. Notation page split (feedback 1)

The page keeps only what every chapter assumes:

- index families and summation;
- index position;
- typefaces;
- the signature convention;
- the Greek alphabet;
- a one-line pointer for each convention introduced later.

Everything else moves to a **Notation** section on the index page of the chapter
that first uses it. Each section holds a short table of that chapter's symbols in
the same format, Greek names spelled out.

| Item now on 00-notation | Moves to |
|---|---|
| Indices, summation, typefaces, Greek alphabet | stays |
| Signature row | stays: it is main line from ch 3 |
| Connection, torsion, Riemann, Ricci sign rows | ch 8 index |
| Einstein-equation sign class, units | ch 15 (GR) index; $c = 1$ to ch 13 |
| $k$-form component convention | ch 6 index |
| Symplectic and Poisson rows | ch 11 index |
| Symbol tables, one per topic | the matching chapter index (manifolds → 1, sphere → 4, …) |

The notation page ends with a short list of where each convention lives. Lookup
still works in one hop, and the notes page still defines every underlined term.

## 5. Forward references (feedback 2)

| Place | Fix |
|---|---|
| 1.2 "related … by the Jacobian (below)" | state the rule inline in the definition |
| 1.3 "section of the cotangent bundle $T^*M$ (below)" | move the bundle section above 1-form fields |
| 1.3 "a metric supplies one … next page / chapter 11" | becomes a pointer to ch 3, two chapters on |
| 9.1 / 9.5 "the angular chart below", "stereographic pair below" | name the section ("the standard chart, §2") or reorder |
| 9.3 "via the metric (see below)" | disappears: the metric precedes ch 4 |
| 10.4 "will reappear with a metric explanation" | disappears: the area form moves to the volume-form page |
| 12.2 "simplifies (below)" | give the Levi-Civita divergence where Levi-Civita is defined |
| 14.2 "nothing below depends on $\tens{g} = \tens{\eta}$" | wording only ("on this page") |

After the move, a sweep checks every `chapter N` and `../NN-` link for references to
a later chapter. Each one is kept only if it is a deliberate "where this lands"
pointer, not a use of an undefined object.

## 6. Steps

Each step builds green (`make build`, dead-link check) and is committed separately
on local `main`. Nothing is pushed until the final review.

1. **Move and renumber files** with `git mv`, then rewrite every relative link and
   "chapter N" reference with a mapping table. A script does the bulk, and the
   build's dead-link check catches misses. No prose changes yet.
2. **Ch 3, the metric.** Merge 1.4 with 11.1–11.2, and drop the duplicated
   signature and lightcone text.
3. **Ch 4, the sphere.** Fold in the round metric, and remove the metric
   forward references.
4. **Ch 6–7.** Forms start from tensors. Add the new volume-form and Hodge page.
5. **Ch 8, connection.** Put Levi-Civita on the main line and affine connections in a
   "Without a metric" section, and fold in the Killing page.
6. **Ch 10–12, mechanics.** Make natural systems the main line and distribute
   ch 13 across the three chapters. Each general, metric-free statement gets a
   "Without a metric" lead.
7. **Notation split** and chapter-index Notation sections.
8. **Forward-reference sweep** and the "What needs the metric" table. Update the
   book-index part list, the summary front matter and the reading paths.
9. **Notes page.** Update back-links and any note text that says "Part III" or
   "chapter 11".
10. **Review pass** of the whole book for flow, plus visual check.

## 7. Risks

- **Link churn.** About 60 pages change path. The build's dead-link check and the
  `note:` resolver make breakage loud, not silent.
- **Mechanics readers lose the short path.** Mitigated by the reading-path note
  and by keeping ch 8's first half self-contained.
- **Over-merging.** Some current asides exist because the material is genuinely
  metric-free. Those results keep their own sections under a "Without a metric"
  lead instead of being folded into metric statements.

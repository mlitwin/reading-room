# Unifying the tensor-calculus and classical-mechanics books

Plan for merging `content/classical-mechanics` into `content/tensor-calculus-on-manifolds` to make one tensor-based book. It runs from calculus on manifolds through classical mechanics to general relativity, and it notes the flat-space classical reductions (Euler–Lagrange in Cartesian coordinates, Newton's law, the Newtonian limit) where they fall out.

Status: **plan, not started** (2026-10-04). Conventions marked **Decided** are settled. Everything else is a proposal.

---

## 1. Verdict

**Feasible; recommended.**

- **Part I of the tensor book is already the language of mechanics.** It develops TQ, T\*Q, flows, the Lie derivative, the interior product, forms and pullback with no metric. Lagrangian and Hamiltonian mechanics and Noether's theorem are metric-free in exactly the same sense.
- **The books already cross-link** in three places: Killing vectors as Noether charges (both directions), the free particle on S² as geodesic motion, and the Schwarzschild orbit reduction, which mirrors Kepler.
- **The mechanics book is small** (~300 lines) and already uses manifold language. About 90% of the existing text can be reused.
- **The new writing is ~1000 lines.** Most of it is Part IV (natural systems), special relativity, and fields/stress–energy.
- **The real cost is notation and conventions, not mathematics.** Sections 3–5 deal with that.

## 2. The bridge: kinetic energy is a metric

The one idea that ties the books together: **T = ½ g_ij q̇^i q̇^j**. Neither book currently says so. Most of the dictionary follows from it.

| Mechanics | Geometry |
|---|---|
| T = ½ Σ_A m_A \|ṙ_A\|² | g = Σ_A m_A δ: mass-weighted Euclidean metric on ℝ^{3N} |
| p = ∂L/∂q̇ for L = T − V | p = q̇^♭: the Legendre transform *is* index lowering |
| H = ½ g^{ij} p_i p_j + V | the inverse metric |
| Euler–Lagrange equations | ∇_{q̇} q̇ = −grad V (Newton's law, covariant) |
| Free motion | geodesics |
| Cyclic coordinate; Noether symmetry | Killing vector ξ, charge ξ_i q̇^i |
| Holonomic constraint | induced metric on a submanifold (pullback) |
| Centrifugal and Coriolis terms in polar coordinates | Christoffel symbols (Γ^r_φφ = −r, Γ^φ_rφ = 1/r) |
| Conservative force F = −dV | exact 1-form; a force with circulation is the closed-not-exact form on the punctured plane |
| Liouville's theorem | £_{X_H} ω = d ι_{X_H}ω + ι_{X_H} dω = −d dH = 0 (Cartan's formula) |
| Kepler V_eff, Runge–Lenz | Schwarzschild V_eff; the −ML²/r³ term breaks Runge–Lenz conservation, giving precession |

### Flat-space reductions to note in the text

- **Cartesian ℝ^{3N}:** Γ = 0, so ∇_{q̇} → d/dt and the covariant law becomes m_A r̈_A = −∇_A V.
- **Polar or spherical coordinates on flat space:** the fictitious-force terms are Christoffel symbols. The space is still flat (R = 0); the chart is not.
- **Galilean limit of Minkowski space:** c → ∞.
- **Newtonian limit of GR:**
  - With g₀₀ ≈ −(1 + 2Φ), the geodesic equation becomes ẍ = −∇Φ.
  - The 00 component of the Einstein equations becomes ∇²Φ = 4πGρ.
  - Geodesic deviation gives the tidal tensor R^i{}_{0j0} ≈ ∂_i∂_jΦ.

## 3. Prior art: notation in the standard texts

| Source | Indices | Signature | Notable notation |
|---|---|---|---|
| Einstein 1916, *Die Grundlage der allgemeinen Relativitätstheorie* | Greek μ, ν, σ, τ run 1–4; coordinates written with **subscripts**, x_ν; x₄ is time | spatial terms negative (a unit spatial displacement has ds² = −1); time 4th | Introduces the summation convention. Christoffel symbols in brackets {μν, τ}. "Field components" **Γ^τ_{μν} = −{μν, τ}** (eq. 45), so the geodesic equation reads d²x_τ/ds² = **+**Γ^τ_{μν} ẋ_μ ẋ_ν (eq. 46). Matter energy tensor T. |
| Misner–Thorne–Wheeler, *Gravitation* (1973) | Greek 0–3, Latin 1–3 | (−,+,+,+) | **Bold** for index-free vectors and tensors (**u**, **g**, **T**). Tilde for 1-forms (σ̃, d̃f). **£_u** for the Lie derivative. The endpaper table classifies every text by three signs (metric, Riemann, Einstein): the "MTW convention" is (+,+,+). |
| Wald, *General Relativity* (1984) | Penrose abstract indices (Latin a, b = slots, not components); Greek for components | (−,+,+,+) | Killing fields written **ξ^a**. Riemann slot order R_{abc}{}^d (differs from MTW). |
| Carroll, *Spacetime and Geometry* (2004) | Greek 0–3, Latin 1–3 | (−,+,+,+) | Same Riemann formula as this book. Geodesic deviation uses T^μ (tangent), S^μ (separation). |
| Landau–Lifshitz, *Classical Theory of Fields* | **Latin i, k = 0–3, Greek α, β = 1–3** (the reverse of MTW) | (+,−,−,−) | The main "mostly-minus" tradition, shared with particle physics. |
| Goldstein, *Classical Mechanics* | q_i, p_i, all indices **down**; no up/down distinction | — | L, H, T, V, generalized force Q_j. |
| Arnold, *Mathematical Methods of Classical Mechanics* | q, p, components up/down | — | ω² = dp ∧ dq; X_H determined by ω and dH such that ι_{X_H} ω = −dH. Configuration space written M. |
| Abraham–Marsden, *Foundations of Mechanics*; Marsden–Ratiu | q^i, p_i | — | ω = dq ∧ dp with ι_{X_H} ω = **+**dH (opposite sign from Arnold; same equations). Momentum map **J**, infinitesimal generator ξ_Q. |
| ISO 80000-2 (typography standard) | — | — | Variables italic. Vectors **bold italic**. Tensors **bold sans-serif italic**. Differential "d" and constants upright. |
| Field theory (Peskin–Schroeder, Weinberg QFT, …) | — | (+,−,−,−) mostly | Lagrangian and Hamiltonian **densities** in calligraphic: 𝓛, 𝓗. |

Takeaways:

1. **Greek for spacetime goes back to Einstein** and is near-universal. The one notable dissenter is Landau–Lifshitz, which reverses Latin and Greek.
2. **Mostly-plus signature** is the GR-textbook majority (MTW, Wald, Carroll). This book already uses it.
3. **Bold for index-free geometric objects** has strong precedent: MTW in GR, ISO 80000-2 in general physics typography.
4. **No symplectic sign convention is "the" standard.** Arnold-type (dp ∧ dq, −dH) and Abraham–Marsden-type (dq ∧ dp, +dH) give the same Hamilton's equations. State the pair explicitly.
5. **Calligraphic 𝓛 is taken** by Lagrangian density in field theory. That is why MTW's £ for the Lie derivative is worth adopting once fields enter.
6. **Momentum map J and Killing/generator ξ** (Marsden–Ratiu, Wald) is a consistent pair: a Killing field *is* the generator of a Noether symmetry.

## 4. Conventions

### Decided

- **Indices:**
  - Latin i, j, k for configuration space Q (any dimension n).
  - Greek μ, ν, ρ, σ for spacetime (0–3), with Latin i, j as spatial 1–3 *when in spacetime context*.
  - **A, B** for particle labels (r_A, m_A, Σ_A).
  - Frame / tetrad indices stay a, b (Cartan formalism only).
- **Signature:** (−,+,+,+) whenever Lorentzian.
- **Riemann:**
  - R(X,Y)Z = ∇_X∇_Y Z − ∇_Y∇_X Z − ∇_{[X,Y]} Z.
  - R^ρ{}_{σμν} = ∂_μΓ^ρ_{νσ} − …, the MTW/Carroll convention.
  - R_μν = R^λ{}_{μλν}.
  - Einstein equations G + Λg = 8πG T.
  - This is MTW's (+,+,+).
- **Connection coefficients:** ∇_{∂_μ}∂_ν = Γ^ρ_{μν} ∂_ρ. The geodesic equation is ẍ^ρ + Γ^ρ_{μν} ẋ^μ ẋ^ν = 0 (note Einstein's opposite Γ sign, §3).
- **Symplectic:**
  - Tautological 1-form θ = p_i dq^i.
  - Symplectic form ω = dθ = dp_i ∧ dq^i.
  - Hamiltonian vector field: ι_{X_H} ω = −dH (Arnold-type).
  - Poisson bracket {f, g} = ∂_{q}f ∂_{p}g − ∂_{p}f ∂_{q}g, so {q^i, p_j} = δ^i_j.
- **Forms:** the 1/k! component convention with the determinant (Spivak) wedge, as now.
- **Summation convention** throughout, up/down pairs only. Goldstein's all-down mechanics notation is *not* used: momenta are p_i (down), velocities q̇^i (up).
- **No URL preservation.** Nothing outside this repo links to the book pages, so chapters and pages may be renamed or moved freely.
- **Retire `content/classical-mechanics`** entirely once its content is merged. Don't keep a stub piece.

- **Typography: option A** (§5), approved 2026-10-04. Index-free tensors are bold italic (`\boldsymbol`); scalars and components are italic. Recorded on the book's [notation page](../content/tensor-calculus-on-manifolds/00-notation.md). Applied to the existing chapters 2026-10-04 via the `\tens` macro.

- **Symbol reassignments (§6)**, approved 2026-10-04 and applied to the existing chapters: £_X (`\Lie`), ξ for Killing fields, u / S in geodesic deviation, Tor(X, Y), len(γ). J_ξ (Noether charge) and A, B particle labels apply when the mechanics material is merged.

## 5. Typography: making the two registers look distinct

The idea is to give classical-mechanics scalars and geometric tensors visibly different typefaces, so that the remaining letter collisions read correctly at a glance.

### What KaTeX 0.16.47 (the site's renderer) can actually do

| Command | Renders as | Latin lowercase | Greek | Notes |
|---|---|---|---|---|
| default | italic serif | ✓ | ✓ | current style |
| `\boldsymbol{}` (= `\bm{}`) | **bold italic serif** | ✓ | ✓ | the only bold style that covers both alphabets |
| `\mathbf{}` | bold upright | ✓ | ✗ (Greek falls back) | |
| `\mathsf{}` | sans upright | ✓ | ✗ | |
| `\mathsfit{}` | sans italic (not bold) | ✓ | ✗ | |
| `\boldsymbol{\mathsf{}}` | sans, **not bold** | | | KaTeX has no bold sans italic font, so ISO's tensor style is unavailable |
| `\mathcal{}` | calligraphic | **capitals only** | ✗ | lowercase silently falls back to italic |
| `\mathscr{}` | script | capitals only | ✗ | |
| `\mathfrak{}` | fraktur | ✓ | ✗ | |
| `\pounds` | £ | | | for the MTW Lie derivative |

**A "cursive for tensors" scheme doesn't work.** Script and calligraphic in KaTeX cover only capital Latin letters. Most tensors (g, ω, ξ, θ, η, Γ) are lowercase or Greek. Calligraphic is also wanted for field-theory densities (𝓛, 𝓗).

### Options

- **A. Bold register for index-free geometry (MTW / ISO-inspired).**
  - Index-free vectors, covectors, forms and tensors are **bold italic** (`\boldsymbol`): **g**, **X**, **ω**, **T**, **R**, **ξ**.
  - Scalars, functions, mechanical quantities (L, H, T, V, E, S) and *all components* (g_μν, T^μν, ω_i) stay plain italic.
  - Collisions it resolves by typeface alone:
    - L (Lagrangian) vs **L** (angular momentum vector).
    - T (kinetic energy) vs **T** (stress–energy tensor).
    - K (Gaussian curvature) vs **K** (contortion).
  - Cost: retypesetting index-free objects throughout Part I (X, Y, ω, η, v, …), which is mechanical but large. Pages look heavier.
- **B. Italic everywhere; resolve collisions by letter choice (§6) and page scope.** This is the current style and the cheapest. It relies on context, which mostly works.
- **C. Hybrid.** Bold only for physical vectors in mechanics (**r**, **p**, **L**, **F**, as in most physics texts) and for index-free *spacetime* tensors in Parts IV–V. Part I keeps the mathematician's italic. This splits the book into two looks.

**Recommendation: A**, implemented through **semantic macros** so the decision is reversible:

- Add a `macros` table to the KaTeX options in `site/generator/build.js`. `@vscode/markdown-it-katex` passes its options straight to KaTeX.
- Example macros:
  - `\tens{#1}` → `\boldsymbol{#1}` for index-free tensors.
  - `\Lie` → `\pounds` or `\mathcal{L}`.
  - `\dd` → `d`, or `\mathrm{d}` if upright-d (ISO) is ever wanted.
  - `\Lden` → `\mathcal{L}` for densities.
- Authoring with macros means switching between A, B or C later is a one-line change.
- Pilot before converting everything: apply A to one Part I page and one mechanics page, then compare.

### Other typeface rules (all options)

- **Upright (`\mathrm`/`\operatorname`):** named operators: tr, grad, div, sgn, Tor, vol, len; and labels used as subscripts (T_{\mathrm{matter}}, V_{\mathrm{eff}}).
- **Calligraphic:** densities 𝓛, 𝓗; the domain 𝒟 of a flow.
- **Blackboard:** number sets ℝ, ℂ, ℍⁿ (half-space), ℝP^k.
- **Fraktur:** 𝔛(M); Lie algebras 𝔤, 𝔰𝔬(3).
- **Differential d:** keep italic d (current style, common in mathematics). ISO's upright d is a possible later macro switch.

## 6. Symbol collisions and resolutions

| Symbol | Current uses | Proposed resolution |
|---|---|---|
| L | Lagrangian; angular momentum; curve length; Lie derivative (𝓛) | L = Lagrangian. **L** (bold) = angular momentum vector, L_i components. len(γ) or s for curve length. **£_X for the Lie derivative** (MTW), freeing 𝓛 for Lagrangian density. |
| T | kinetic energy; stress–energy; torsion; generic tensor; tangent in geodesic deviation | T = kinetic energy (scalar). T_μν / **T** = stress–energy. Torsion keeps components T^ρ{}_{μν} (three indices tell it apart); index-free torsion is Tor(X, Y). Tangent in geodesic deviation → u^μ (MTW 4-velocity). Generic tensors use S, U or other letters in examples. |
| Q | configuration space; Noether charge | Q = configuration space. Noether charge / momentum map → **J_ξ** (Marsden–Ratiu). |
| J | Jacobian matrix (ch. 6); complex structure (ch. 7); Jacobi field (ch. 9) | Keep the Jacobian J and complex structure J; both are page-local. Deviation vector → **S^μ** (Carroll). This frees J for the momentum map. |
| K | Killing vector; Gaussian curvature; contortion | Killing / symmetry generator → **ξ** (Wald, Marsden–Ratiu; it unifies with the Noether generator). K = Gaussian curvature. Contortion K^ρ{}_{μν} is confined to the Einstein–Cartan page. |
| H | Hamiltonian; de Rham cohomology H^k; half-space ℍⁿ | No change; scripts and typefaces already distinguish them. |
| p | point of M; momentum | No change. Mechanics pages name points q ∈ Q, so p is free for momentum there. |
| ω | generic form (Part I); symplectic form; spin connection ω^a{}_b | Generic forms in mechanics pages → α, β. ω = symplectic form in mechanics. Spin connection stays page-local (Cartan note). |
| S | action; spin density (EC); deviation vector (new) | S[q] action (functional brackets). S^μ deviation vector (one index). Spin density 𝒮^ρ{}_{μν} (calligraphic, EC page only). |
| Ω | orientation form (ch. 4) | No change (symplectic stays ω). |
| E | energy | Mechanics E (scalar). Schwarzschild E per unit mass; same meaning. |
| τ | torque; proper time | τ = proper time. Torque is written **N** or τ⃗; or simply avoid it: the angular-momentum page can state L̇ = Σ_A r_A × F_A directly. |
| a, b | particle labels (current CM text) | → A, B (decided). |

## 7. Target structure

Mechanics is split around the metric, so each part uses only machinery that has already been built.

1. **Part I: Calculus on manifolds.** Existing chapters 1–5. Additions:
   - Induced coordinates (q, q̇) on TQ and (q, p) on T\*Q.
   - The tautological 1-form θ.
   - Extended configuration space Q × ℝ for time-dependent systems.
2. **Part II: Mechanics without a metric.** New; absorbs `classical-mechanics` chapters 1–4.
   - Newton in ℝ^{3N} as the flat motivating case. Force is a 1-form (work F(v)); conservative F = −dV is exact.
   - The Lagrangian on TQ:
     - Coordinate invariance as the tensorial statement.
     - The Legendre transform as the fiber derivative FL: TQ → T\*Q.
     - Constraints as restriction to a submanifold.
   - Hamiltonian mechanics on T\*Q: θ, ω = dθ, X_H, Poisson brackets, canonical maps. Liouville's theorem via Cartan's formula.
   - Noether via flows and £: generator ξ, charge J_ξ = p_i ξ^i = θ(ξ̂); quasi-symmetries; time translation.
3. **Part III: Geometry.** Existing chapters 6–9, with small additions:
   - In ch. 8: a pointer forward to the kinetic metric.
   - In ch. 9: polar coordinates on ℝ² as the flat-space Christoffel example.
4. **Part IV: Mechanics with a metric (natural systems).** New.
   - T = ½g; covariant Newton ∇_{q̇} q̇ = −grad V.
   - Free motion = geodesics.
   - Constraints as the induced metric.
   - Killing ⇒ conserved charge.
   - Optional: the Jacobi (Maupertuis) metric; the rigid body as a left-invariant metric on SO(3).
   - Running example: free particle on S²; spherical pendulum (V = mgℓ cos θ); so(3) Killing fields → the angular-momentum vector.
   - Flat-reduction boxes.
5. **Part V: Relativity.**
   - **Special relativity** (new):
     - Minkowski space as the flat case.
     - Relativistic particle, L = −m√(−g_μν ẋ^μ ẋ^ν), proper time, 4-momentum.
     - Reparametrization invariance and the mass-shell constraint g^{μν} p_μ p_ν = −m².
   - **Fields and stress–energy** (new; the largest gap in both books). Keep it to what the Einstein equations need:
     - Lagrangian densities, field Euler–Lagrange equations, Noether currents.
     - T_μν from metric variation.
     - ∇_μT^{μν} = 0; the Killing current T^{μν}ξ_ν.
   - **Existing ch. 10:** Einstein equations, Schwarzschild (with Kepler side by side), Einstein–Cartan.
   - **Newtonian limit** (new page).

Reading paths, to put on the index page:

- **Mechanics:** ch. 1–3 → Part II → ch. 8 → Part IV.
- **GR:** everything except the optional ch. 5 (de Rham). Part II can be skimmed, but Part V depends on its Noether and Legendre material.

Book identity: the title "…with an Eye to General Relativity" should become broader, e.g. "Geometry, Mechanics, and Gravity". The `summary` front matter needs rewriting.

## 8. Steps

Each step builds and commits on its own. Commit `content/` together with regenerated `docs/`.

1. **Sign off on conventions.** Typography option (§5) and the symbol table (§6). Record them in the book's notes page as a "Conventions" entry.
2. **Tooling.**
   - Add a relative-link check to the build: the stale `09-…/04-on-the-sphere.md` link passed `make build` unnoticed.
   - Add the KaTeX `macros` table.
3. **Part I additions:** TQ / T\*Q coordinates, θ, extended configuration space.
4. **Part II.**
   - Move and rewrite `classical-mechanics` ch. 1–4 into the tensor book.
   - Apply the §6 renames.
   - Merge its six notes; none collide with existing note names.
   - Renumber chapter directories.
5. **Symbol pass on existing chapters:** K→ξ for Killing, T/J→u/S in geodesic deviation, Tor(X,Y), £ (if adopted). Then the typography pass (if A is adopted), pilot page first.
6. **Part IV** (natural systems), with S² mechanics examples and flat-reduction boxes. Add the polar-coordinates example to ch. 9.
7. **Part V new pages:** special relativity, fields and stress–energy, Newtonian limit. Rewire ch. 10 to use them; add the Kepler ↔ Schwarzschild comparison.
8. **Framing:** title, summary, index page with reading paths, running-example note, each chapter's "Where this lands" paragraph.
9. **Retire `content/classical-mechanics`.** Delete the piece and its `docs/` output, check the library index, run the full build and link check.

Steps 2–5 are the merge proper and add little new writing. Steps 6–7 hold most of the new material, roughly 600–900 lines.

## 9. Inline notes and back-links

The `note:` popover lets a reader recall a definition without losing their place, so it is the main tool for flow in a book this cross-referential. Conventions:

- **Every core concept has a recall note.** Each note gives a short definition and the key formula, and ends with a "Defined on [page]" link back to the full treatment. The 21 notes added 2026-10-04 cover the gap: chart, tangent and cotangent space, differential of a map, Lie bracket, differential form, exterior derivative, closed and exact forms, orientation, Stokes's theorem, de Rham cohomology, contraction, metric, affine connection, torsion, Riemann tensor, Ricci and Einstein tensors, sectional curvature, geodesic deviation, stress–energy tensor, Einstein equations. Before that, the notes covered mostly side terms.
- **Link the first use on each page** of a term defined on a *different* page. Don't link on the term's own defining page, and don't link every occurrence.
- **Notes link to notes** where a definition leans on another (tangent space → derivation, Einstein equations → stress–energy). The popover stack's ⌂ / ↑ / ‹ › chrome keeps the reader's place.
- **The notation page doubles as a hub.** Its symbol-table entries link to the corresponding notes.
- **The merged mechanics part** (step 4) gets the same treatment. The six mechanics notes join the notes page, and new recall notes are needed for Lagrangian, Euler–Lagrange equations, Hamiltonian, Poisson bracket, and Noether's theorem.

Possible generator features, not yet built:

- **"Used on" back-links.** For each note, list the pages that reference it. The build already computes note references per page, for the transitive closure.
- **A lint warning** when a page uses a noted term without linking it anywhere on the page.

## 10. Risks

- **Scope creep in Part V.** Field theory, the Hamiltonian constraint, rigid bodies and Newton–Cartan gravity can each grow without limit. Cap each at what the Einstein equations or the S² examples actually use, and mark extras optional.
- **Typography churn.** Option A touches most pages. The macro layer and the pilot step keep that reversible.
- **Convention drift.** Five sign conventions interact (signature, Γ, Riemann, Einstein, symplectic). The notes-page "Conventions" entry is the single source; pages link to it rather than restating.
- **Time.** Absolute time (L on TQ × ℝ) and parametrized time (λ, τ) need one explicit bridging page. Otherwise the jump from Part IV to Part V reads as a change of subject.

## Sources

- Einstein, *Die Grundlage der allgemeinen Relativitätstheorie*, Ann. Phys. 49 (1916): [scan](https://www.nssp.uni-saarland.de/lehre/Vorlesung/Kernphysik_SS19/History/Papers/Einstein_2.pdf). The summation-convention passage, eq. (45) Γ = −{ }, and eq. (46) were checked against this scan.
- [How Einstein Got His Field Equations (arXiv:1608.05752)](https://arxiv.org/pdf/1608.05752)
- [Sign convention (Wikipedia)](https://en.wikipedia.org/wiki/Sign_convention): the MTW three-sign classification, Landau–Lifshitz vs MTW signatures.
- [isomath package documentation (CTAN)](https://ctan.csail.mit.edu/macros/latex2e/contrib/isomath/isomath.pdf): ISO 80000-2 typefaces (vectors bold italic, tensors bold sans italic, upright d).
- [Hamiltonian vector field (Wikipedia)](https://en.wikipedia.org/wiki/Hamiltonian_vector_field) and [Marsden–Ratiu ch. 2](https://math.tecnico.ulisboa.pt/~jnatar/MG-03/Marsden/ms_book_ch2.pdf): symplectic sign conventions.
- [Sign conventions in symplectic geometry (Toronto notes)](https://www.math.utoronto.ca/mein/teaching/notes/signs.pdf)
- KaTeX 0.16.47 capabilities: tested locally against `site/generator/node_modules/katex`.
- From standard texts, not re-verified online: MTW (bold index-free notation, £, endpaper sign table), Wald (abstract indices, ξ for Killing fields), Carroll (T^μ / S^μ in geodesic deviation), Landau–Lifshitz (Latin 0–3), Goldstein, Arnold.

---
title: Notes
notes: true
---

Supplementary definitions referenced from the body of this book — terms the main text uses without expanding inline. Read as a standalone glossary, or popped up on demand from links in the chapters.

## Hausdorff

A topological space is **Hausdorff** if any two distinct points $p, q$ have disjoint open neighborhoods $U \ni p$, $V \ni q$ with $U \cap V = \emptyset$. Most spaces appearing in differential geometry are Hausdorff: $\mathbb{R}^n$, every metric space, every manifold, every Lie group. The non-Hausdorff cases are exotic — the "line with two origins" is the canonical example.

## Second countable

A topological space is **second countable** if its topology has a countable base: countably many open sets such that every open set is a union of some of them. Equivalently for metric spaces, $X$ has a countable dense subset and balls of rational radius centered on that subset form a base. This is what makes paracompactness and partition-of-unity arguments work on a manifold.

## Compact support

A function (or vector field, or differential form) has **compact support** if it vanishes outside some compact subset $K \subseteq M$. On a non-compact manifold this is the condition that makes $\int_M$ converge and that kills the boundary contributions at infinity — it is why Stokes's theorem and the integration of $n$-forms are stated for compactly supported forms. On a *compact* manifold every smooth function has compact support automatically, so the qualifier can be dropped.

## Embedded manifold

A **smooth submanifold** of $\mathbb{R}^N$ is a subset $M \subseteq \mathbb{R}^N$ that locally looks like the graph of a smooth function: around every $p \in M$ there is an open $U \subseteq \mathbb{R}^N$, an open $V \subseteq \mathbb{R}^n$, and a smooth embedding $\Phi: V \to U \cap M$ whose differential is everywhere injective. The image $\Phi(V)$ is an open piece of $M$, and the $n$ coordinates on $V$ are a chart on $M$.

The **embedded view** of differential geometry takes advantage of the ambient $\mathbb{R}^N$: tangent vectors are vectors in $\mathbb{R}^N$ (sitting in the affine tangent plane to $M$); the metric is the pullback of the Euclidean inner product; integration is over an embedded submanifold of $\mathbb{R}^N$. The Whitney embedding theorem says every smooth $n$-manifold can be embedded in $\mathbb{R}^{2n}$, so the embedded view loses no generality in principle. In practice it can be inconvenient — Lorentzian spacetimes do not embed isometrically in any flat ambient — which is why the abstract view is also needed.

## Abstract manifold

An **abstract smooth manifold** is a [Hausdorff](note:hausdorff), [second-countable](note:second-countable) topological space equipped with an atlas of charts $\varphi_\alpha: U_\alpha \to \mathbb{R}^n$ whose transition maps $\varphi_\beta \circ \varphi_\alpha^{-1}$ are smooth. No ambient space; the manifold is the chart-and-transition data, considered up to refinement of atlas.

All structures — tangent spaces, tensor fields, metrics, connections — are then built intrinsically. The geometry in this book is mostly abstract, with the embedded view brought in as the geometrically transparent special case.

## Derivation

For a commutative algebra $A$ over $\mathbb{R}$ (e.g., $A = C^\infty(M)$), a **derivation at $p \in M$** is an $\mathbb{R}$-linear map $D: A \to \mathbb{R}$ satisfying the **Leibniz rule**
$$D(fg) = f(p)\, D(g) + g(p)\, D(f).$$
Every derivation at $p$ is determined by its values on a coordinate system around $p$ — $D(x^\mu)$ for the chart $x = (x^1, \ldots, x^n)$ — and the space of derivations is an $n$-dimensional real vector space, isomorphic to $T_p M$.

The derivation viewpoint generalizes: a derivation of $A$ (with values in $A$) is a vector field; the Lie bracket of vector fields is the commutator of derivations.

## Dual space

For a vector space $V$ over a field $k$, the **dual space** is the space of $k$-linear functionals
$$V^* := \mathrm{Hom}_k(V, k).$$
For finite-dimensional $V$, $\dim V^* = \dim V$; a basis $\{e_i\}$ of $V$ induces a **dual basis** $\{e^i\}$ of $V^*$ defined by $e^i(e_j) = \delta^i_j$. The double dual is canonically isomorphic to $V$: $V^{**} \cong V$ via $v \mapsto (\omega \mapsto \omega(v))$. The cotangent space $T^*_p M$ is the dual of the tangent space $T_p M$.

## Lie algebra

A **Lie algebra** over $\mathbb{R}$ is a real vector space $\mathfrak{g}$ equipped with a bilinear antisymmetric bracket $[\cdot, \cdot]: \mathfrak{g} \times \mathfrak{g} \to \mathfrak{g}$ satisfying the **Jacobi identity**
$$[X, [Y, Z]] + [Y, [Z, X]] + [Z, [X, Y]] = 0.$$
Examples: $\mathfrak{gl}_n(\mathbb{R})$ — $n \times n$ real matrices with $[A, B] = AB - BA$; the tangent space at the identity of any Lie group; the vector fields on a manifold under the Lie bracket. The vector-fields Lie algebra $\mathfrak{X}(M)$ is infinite-dimensional and not the Lie algebra of any finite-dimensional Lie group.

## Tensor field

A **tensor field** of type $(r, s)$ on a smooth manifold $M$ is a smooth section of the bundle whose fiber at $p \in M$ is
$$T_p M^{\otimes r} \otimes T^*_p M^{\otimes s}.$$
Equivalently, a $C^\infty(M)$-multilinear map taking $r$ smooth $1$-forms and $s$ smooth vector fields and returning a smooth real-valued function. Vector fields are $(1, 0)$-tensor fields; $1$-forms are $(0, 1)$-tensor fields; $k$-forms are alternating $(0, k)$-tensor fields; the metric is a symmetric $(0, 2)$-tensor field. The Lie derivative and (given a connection) the covariant derivative extend to tensor fields of every type.

## Einstein summation

The convention, due to Einstein and unstated everywhere it's in force: a Greek (or Latin) index appearing exactly once *up* and exactly once *down* in the same monomial is summed over its range. So
$$v^\mu \omega_\mu := \sum_{\mu} v^\mu \omega_\mu, \qquad T^\mu{}_\nu\, S^\nu{}_\rho := \sum_{\nu} T^\mu{}_\nu\, S^\nu{}_\rho.$$

Two ramifications. First, repeated indices in the same vertical position ($v^\mu \omega^\mu$, $T_{\mu\mu}$) are almost always an error — there is no canonical pairing without a metric. Second, an index used as a dummy variable is *bound* and can be renamed: $v^\mu \omega_\mu = v^\nu \omega_\nu$. Be wary of dummy collisions when chaining contractions.

## Running example

The unit sphere
$$S^2 = \{ (X, Y, Z) \in \mathbb{R}^3 : X^2 + Y^2 + Z^2 = 1 \}$$
is the running example carried through Part II of this book. Two reasons it works:

- **Small enough to compute on by hand.** Two coordinates, one round metric, four-line Christoffel calculation, single Riemann component.
- **Big enough to break intuition.** Non-zero constant curvature; no global flat chart; non-trivial topology (Euler characteristic $2$); $SO(3)$ symmetry; closed orientable.

The drawback — $S^2$ is two-dimensional Riemannian, not four-dimensional Lorentzian — means it doesn't model spacetime. But every tensor construction in the book is dimension- and signature-agnostic; correctness on $S^2$ is correctness in general.

## Wedge convention

This book writes a $k$-form in the **$1/k!$ convention**:
$$\omega = \frac{1}{k!}\, \omega_{\mu_1 \cdots \mu_k}\, dx^{\mu_1} \wedge \cdots \wedge dx^{\mu_k},$$
with $\omega_{\mu_1 \cdots \mu_k}$ totally antisymmetric and the sum over all index tuples. The common alternative — the **strictly-increasing-index convention** —
$$\omega = \sum_{\mu_1 < \cdots < \mu_k} \omega_{\mu_1 \cdots \mu_k}\, dx^{\mu_1} \wedge \cdots \wedge dx^{\mu_k}$$
carries no combinatorial prefactor and sums only over ordered tuples. The two give the *same* component array on ordered tuples (e.g. $\omega_{\theta\varphi} = \sin\theta$ for the sphere's area form either way); they differ only in whether the basis is reduced to ordered tuples or the components are antisymmetrized and divided by $k!$. Watch for the factor when comparing formulas across textbooks.

## Levi-Civita

Three related but distinct objects share the name.

**Levi-Civita symbol.** The totally antisymmetric *symbol* $\varepsilon_{\mu_1 \cdots \mu_n}$ — not a tensor — defined by $\varepsilon_{1 \cdots n} = 1$ and antisymmetry under any pair swap. Coordinate-dependent: it transforms like a tensor density of weight $+1$. Used in the explicit formula for the Hodge star.

**Levi-Civita tensor.** The honest tensor $\epsilon_{\mu_1 \cdots \mu_n} := \sqrt{|\det g|}\, \varepsilon_{\mu_1 \cdots \mu_n}$. The factor of $\sqrt{|\det g|}$ converts the density into a tensor; this is the canonical volume form $\mathrm{vol}_g$.

**Levi-Civita connection.** The unique torsion-free metric-compatible connection of a pseudo-Riemannian manifold $(M, g)$. The connection assumed throughout standard GR. Christoffel symbols given by the formula in the [covariant-derivative page](09-connection-and-curvature/02-covariant-derivative.md).

Three different objects, one Italian mathematician. Context picks which is meant.

## Killing vector

A vector field $K \in \mathfrak{X}(M)$ on a pseudo-Riemannian manifold $(M, g)$ is a **Killing vector field** if its flow preserves the metric, i.e. if the Lie derivative
$$\mathcal{L}_K g = 0.$$
In components,
$$\nabla_\mu K_\nu + \nabla_\nu K_\mu = 0$$
(the **Killing equation**, equivalent to $\mathcal{L}_K g = 0$ for the Levi-Civita connection).

Killing fields are the infinitesimal generators of isometries: their flows are one-parameter families of isometries of $(M, g)$. On $S^2$ with the round metric, the three generators of $SO(3)$ give three Killing fields; in spherical coordinates, $\partial_\varphi$ is one of them (rotation about the $Z$-axis).

Along a geodesic $\gamma$, $K_\mu \dot\gamma^\mu$ is conserved — every Killing vector gives a conserved quantity for free-fall motion. This is the geodesic instance of Noether's theorem: a Killing vector is a continuous symmetry of the geodesic action $\int g_{\mu\nu}\dot x^\mu \dot x^\nu\, d\lambda$, and $K_\mu \dot\gamma^\mu$ is the Noether charge (the [`classical-mechanics`](../classical-mechanics/04-noether/01-noethers-theorem.md) review has the general theorem). In Schwarzschild, $\partial_t$ and $\partial_\varphi$ are Killing; the two conserved quantities they yield are the energy $E$ and angular momentum $L$ that drive the orbit calculation.

## Cochain complex

A **cochain complex** is a sequence of abelian groups (or vector spaces) and linear maps
$$\cdots \to C^{k-1} \xrightarrow{d^{k-1}} C^k \xrightarrow{d^k} C^{k+1} \to \cdots$$
with $d^k \circ d^{k-1} = 0$ for every $k$. The kernel of each $d^k$ ("cocycles") contains the image of the previous $d^{k-1}$ ("coboundaries"), and the quotient $\ker(d^k) / \mathrm{im}(d^{k-1})$ is the $k$-th *cohomology* of the complex. The complex $\Omega^0 \to \Omega^1 \to \Omega^2 \to \cdots$ with [exterior derivative](03-differential-forms/02-exterior-derivative-and-pullback.md) as $d$ is the **de Rham complex**.

## Singular cohomology

**Singular cohomology** $H^k(X; A)$ of a topological space $X$ with coefficients in an abelian group $A$ is built from the dual of the singular [chain complex](note:cochain-complex). A *singular $k$-simplex* in $X$ is a continuous map $\Delta^k \to X$; the free abelian group on these forms $C_k(X)$, with the boundary map $\partial_k: C_k \to C_{k-1}$. Then $C^k(X; A) := \mathrm{Hom}(C_k(X), A)$ and $d := \partial^*$. Cohomology depends only on the homotopy type of $X$, and for paracompact [Hausdorff](note:hausdorff) $X$ the singular and de Rham versions agree (de Rham's theorem).

## Contractible

Two smooth maps $F, G: M \to N$ are **(smoothly) homotopic**, written $F \simeq G$, if one can be deformed into the other: there is a smooth $H: M \times [0, 1] \to N$ with $H(\cdot, 0) = F$ and $H(\cdot, 1) = G$. A manifold $M$ is **contractible** if its identity map is homotopic to a constant map — $M$ can be continuously shrunk to a point. Convex and [star-shaped](note:star-shaped) subsets of $\mathbb{R}^n$ are contractible; $\mathbb{R}^n$ is, but $\mathbb{R}^n \setminus \{0\}$ and the sphere are not.

De Rham cohomology is a **homotopy invariant**: homotopic maps induce the same map on cohomology, so a contractible manifold has the cohomology of a point (all reduced groups vanish — the Poincaré lemma).

## Star-shaped

An open set $U \subseteq \mathbb{R}^n$ is **star-shaped about $p \in U$** if for every $q \in U$, the line segment $\{(1-t)p + tq : t \in [0, 1]\}$ from $p$ to $q$ lies entirely in $U$. Convex sets are star-shaped about any of their points. Star-shaped sets are contractible — the homotopy $H(q, t) = (1-t)q + tp$ retracts $U$ to $p$ — and this contraction is the ingredient that makes the cone-operator proof of the Poincaré lemma work.

## Sheaf

A **sheaf** of abelian groups on a topological space $X$ assigns to every open $U \subseteq X$ an abelian group $\mathcal{F}(U)$ ("sections over $U$") and to every inclusion $V \subseteq U$ a restriction map $\mathcal{F}(U) \to \mathcal{F}(V)$, subject to a **gluing axiom**: local sections that agree on overlaps glue uniquely to a section on the union.

The **constant sheaf** $\underline{A}$ assigns $A$ (with the discrete topology) to each connected open set. The sheaf $C^\infty_M$ assigns $C^\infty(U)$ to each $U$. **Sheaf cohomology** $H^k(X; \mathcal{F})$ generalizes singular cohomology; an **acyclic resolution** is a long exact sequence of sheaves that's nice enough to compute cohomology from. The de Rham complex is an acyclic resolution of $\underline{\mathbb{R}}$ on $M$, which is the abstract reason de Rham cohomology computes $H^*(M; \mathbb{R})$.

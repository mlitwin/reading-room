---
title: Notes
notes: true
---

Supplementary definitions referenced from the body of this book — terms the main text uses without expanding inline. Read as a standalone glossary or pop up on demand from links in the chapters.

## Embedded manifold

A **smooth submanifold** of $\mathbb{R}^N$ is a subset $M \subseteq \mathbb{R}^N$ that locally looks like the graph of a smooth function: around every $p \in M$ there is an open $U \subseteq \mathbb{R}^N$, an open $V \subseteq \mathbb{R}^n$, and a smooth embedding $\Phi: V \to U \cap M$ whose differential is everywhere injective. The image $\Phi(V)$ is an open piece of $M$, and the $n$ coordinates on $V$ are a chart on $M$.

The **embedded view** of differential geometry takes advantage of the ambient $\mathbb{R}^N$: tangent vectors are vectors in $\mathbb{R}^N$ (sitting in the affine tangent plane to $M$); the metric is the pullback of the Euclidean inner product; integration is over an embedded submanifold of $\mathbb{R}^N$. The Whitney embedding theorem says every smooth $n$-manifold can be embedded in $\mathbb{R}^{2n}$, so the embedded view loses no generality in principle. In practice it can be inconvenient — Lorentzian spacetimes do not embed isometrically in any flat ambient — which is why the abstract view is also needed.

## Abstract manifold

An **abstract smooth manifold** is a [Hausdorff](../calculus-on-manifolds/06-notes.md#hausdorff), second-countable topological space equipped with an atlas of charts $\varphi_\alpha: U_\alpha \to \mathbb{R}^n$ whose transition maps $\varphi_\beta \circ \varphi_\alpha^{-1}$ are smooth. No ambient space; the manifold is the chart-and-transition data, considered up to refinement of atlas.

All structures — tangent spaces, tensor fields, metrics, connections — are then built intrinsically. Differential geometry as developed in this book is mostly abstract, with the embedded view brought in as the geometrically transparent special case.

## Running example

The unit sphere
$$S^2 = \{ (X, Y, Z) \in \mathbb{R}^3 : X^2 + Y^2 + Z^2 = 1 \}$$
is the only example carried through every section of this book. Two reasons it works:

- **Small enough to compute on by hand.** Two coordinates, one round metric, four-line Christoffel calculation, single Riemann component.
- **Big enough to break intuition.** Non-zero constant curvature; no global flat chart; non-trivial topology (Euler characteristic $2$); $SO(3)$ symmetry; closed orientable.

The drawback — $S^2$ is two-dimensional Riemannian, not four-dimensional Lorentzian — means it doesn't model spacetime. But every tensor construction in the book is dimension- and signature-agnostic; correctness on $S^2$ is correctness in general.

## Einstein summation

The convention, due to Einstein and unstated everywhere it's in force: a Greek (or Latin) index appearing exactly once *up* and exactly once *down* in the same monomial is summed over its range. So
$$v^\mu \omega_\mu := \sum_{\mu=0}^{n-1} v^\mu \omega_\mu, \qquad T^\mu{}_\nu\, S^\nu{}_\rho := \sum_{\nu=0}^{n-1} T^\mu{}_\nu\, S^\nu{}_\rho.$$

Two ramifications. First, repeated indices in the same vertical position ($v^\mu \omega^\mu$, $T_{\mu\mu}$) are almost always an error — there is no canonical pairing in flat-space conventions, and in curved-space conventions you need a metric to make sense of the operation. Second, an index used as a dummy variable is *bound* and can be renamed: $v^\mu \omega_\mu = v^\nu \omega_\nu$. Be wary of dummy collisions when chaining contractions.

## Derivation

For a commutative algebra $A$ over $\mathbb{R}$ (e.g., $A = C^\infty(M)$), a **derivation at $p \in M$** is an $\mathbb{R}$-linear map $D: A \to \mathbb{R}$ satisfying the **Leibniz rule**
$$D(fg) = f(p)\, D(g) + g(p)\, D(f).$$
Every derivation at $p$ is determined by its values on a coordinate system around $p$ — $D(x^\mu)$ for the chart $x = (x^1, \ldots, x^n)$ — and the space of derivations is an $n$-dimensional real vector space, isomorphic to $T_p M$.

The derivation viewpoint generalizes: a derivation of $A$ (with values in $A$) is a vector field; the Lie bracket of vector fields is the commutator of derivations.

## Lie algebra

A **Lie algebra** over $\mathbb{R}$ is a real vector space $\mathfrak{g}$ equipped with a bilinear antisymmetric bracket $[\cdot, \cdot]: \mathfrak{g} \times \mathfrak{g} \to \mathfrak{g}$ satisfying the **Jacobi identity**
$$[X, [Y, Z]] + [Y, [Z, X]] + [Z, [X, Y]] = 0.$$
Examples: $\mathfrak{gl}_n(\mathbb{R})$ — $n \times n$ real matrices with $[A, B] = AB - BA$; the tangent space at the identity of any Lie group; the vector fields on a manifold under the Lie bracket. The vector-fields Lie algebra $\mathfrak{X}(M)$ is infinite-dimensional and not the Lie algebra of any finite-dimensional Lie group.

## Dual space

For a vector space $V$ over a field $k$, the **dual space** is the space of $k$-linear functionals
$$V^* := \mathrm{Hom}_k(V, k).$$
For finite-dimensional $V$, $\dim V^* = \dim V$; a basis $\{e_i\}$ of $V$ induces a **dual basis** $\{e^i\}$ of $V^*$ defined by $e^i(e_j) = \delta^i_j$. The double dual is canonically isomorphic to $V$: $V^{**} \cong V$ via $v \mapsto (\omega \mapsto \omega(v))$. The cotangent space $T^*_p M$ is the dual of the tangent space $T_p M$.

## Tensor field

A **tensor field** of type $(r, s)$ on a smooth manifold $M$ is a smooth section of the bundle whose fiber at $p \in M$ is
$$T_p M^{\otimes r} \otimes T^*_p M^{\otimes s}.$$
Equivalently, a $C^\infty(M)$-multilinear map taking $r$ smooth $1$-forms and $s$ smooth vector fields and returning a smooth real-valued function. Vector fields are $(1, 0)$-tensor fields; $1$-forms are $(0, 1)$-tensor fields; the metric is a symmetric $(0, 2)$-tensor field. See the [manifolds book](../calculus-on-manifolds/06-notes.md) for a bundle-flavored treatment.

## Levi-Civita

Two related but distinct objects share the name.

**Levi-Civita symbol.** The totally antisymmetric *symbol* $\varepsilon_{\mu_1 \cdots \mu_n}$ — not a tensor — defined by $\varepsilon_{1 \cdots n} = 1$ and antisymmetry under any pair swap. Coordinate-dependent: it transforms like a tensor density of weight $+1$, not like a tensor. Used in the explicit formula for the Hodge star.

**Levi-Civita tensor.** The honest tensor $\epsilon_{\mu_1 \cdots \mu_n} := \sqrt{|\det g|}\, \varepsilon_{\mu_1 \cdots \mu_n}$. The factor of $\sqrt{|\det g|}$ converts the density into a tensor; this is the canonical volume form $\mathrm{vol}_g$.

**Levi-Civita connection.** The unique torsion-free metric-compatible connection of a pseudo-Riemannian manifold $(M, g)$. The connection assumed throughout standard GR. Christoffel symbols given by the formula in the [covariant-derivative page](05-connection-and-curvature/02-covariant-derivative.md).

Three different objects, one Italian mathematician. Context picks which is meant.

## Wedge convention

Two conventions for writing a $k$-form in coordinates coexist in the literature; both books in this library use them, in different places.

**Strictly-increasing-index convention** (used in `calculus-on-manifolds`):
$$\omega = \sum_{i_1 < \cdots < i_k} \omega_{i_1 \cdots i_k}\, dx^{i_1} \wedge \cdots \wedge dx^{i_k},$$
with no combinatorial prefactor and the basis $dx^{i_1} \wedge \cdots \wedge dx^{i_k}$ taken only with indices in strict increasing order.

**$1/k!$ convention** (used here):
$$\omega = \frac{1}{k!}\, \omega_{\mu_1 \cdots \mu_k}\, dx^{\mu_1} \wedge \cdots \wedge dx^{\mu_k},$$
with $\omega_{\mu_1 \cdots \mu_k}$ totally antisymmetric and the sum over all index tuples (not just ordered ones).

The two give the same component array on the ordered tuples: e.g. $\omega_{\theta\varphi} = \sin\theta$ for the sphere's area form in either convention. They differ in whether the basis is reduced to ordered tuples (first form) or whether the components are antisymmetrized and divided by $k!$ (second form). Cross-references between the two books are convention-safe at the level of components on ordered tuples.

## Killing vector

A vector field $K \in \mathfrak{X}(M)$ on a pseudo-Riemannian manifold $(M, g)$ is a **Killing vector field** if its flow preserves the metric, i.e. if the Lie derivative
$$\mathcal{L}_K g = 0.$$
In components,
$$\nabla_\mu K_\nu + \nabla_\nu K_\mu = 0$$
(the **Killing equation**, equivalent to $\mathcal{L}_K g = 0$ for the Levi-Civita connection).

Killing fields are the infinitesimal generators of isometries: their flows are one-parameter families of isometries of $(M, g)$. On $S^2$ with the round metric, the three generators of $SO(3)$ — rotations about three perpendicular axes — give three Killing fields; in spherical coordinates, $\partial_\varphi$ is one of them (rotation about the $Z$-axis).

Along a geodesic $\gamma$, $K_\mu \dot\gamma^\mu$ is conserved — every Killing vector gives a conserved quantity for free-fall motion. In Schwarzschild, $\partial_t$ and $\partial_\varphi$ are Killing; the two conserved quantities they yield are the energy $E$ and angular momentum $L$ that drive the orbit calculation.

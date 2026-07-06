---
title: Notes
notes: true
---

Supplementary definitions referenced from the body of this book — terms the main text uses without expanding inline, plus quick-reference restatements of definitions the book does develop in full, so a later chapter can recall an earlier one without a detour. Read as a standalone glossary, or popped up on demand from links in the chapters.

## Hausdorff

A topological space is **Hausdorff** if any two distinct points $p, q$ have disjoint open neighborhoods $U \ni p$, $V \ni q$ with $U \cap V = \emptyset$. Most spaces appearing in differential geometry are Hausdorff: $\mathbb{R}^n$, every metric space, every [Lie group](note:lie-group) — and every manifold, because the definition of a manifold demands it. The non-Hausdorff cases are exotic — the "line with two origins" is the canonical example.

## Second countable

A topological space is **second countable** if its topology has a countable base: countably many open sets such that every open set is a union of some of them. Equivalently for metric spaces, $X$ has a countable dense subset and balls of rational radius centered on that subset form a base. This is what makes [paracompactness](note:paracompact) and [partition-of-unity](note:partition-of-unity) arguments work on a manifold.

## Paracompact

A topological space is **paracompact** if every open cover admits a *locally finite* open refinement — a cover by smaller sets, each inside some original set, such that every point has a neighborhood meeting only finitely many of them. For manifolds the property comes for free: [second-countable](note:second-countable) plus [Hausdorff](note:hausdorff) implies paracompact, and paracompactness is exactly what a [partition of unity](note:partition-of-unity) needs to exist. It is the weakest topological hypothesis under which the local-to-global constructions of differential geometry (gluing metrics, defining integration) go through.

## Partition of unity

A **partition of unity** subordinate to an open cover $\{U_\alpha\}$ of $M$ is a family of smooth functions $\rho_\alpha: M \to [0, 1]$, each supported inside the corresponding $U_\alpha$, locally finite (every point has a neighborhood meeting only finitely many supports), with $\sum_\alpha \rho_\alpha = 1$ everywhere. On a [second-countable](note:second-countable) [Hausdorff](note:hausdorff) smooth manifold, every open cover admits one — this is the lever that turns local constructions into global ones: integration is defined chart by chart and glued ($\int_M \omega = \sum_\alpha \int \rho_\alpha\, \omega$), Riemannian metrics are built by gluing chart-wise Euclidean ones, and local sections are extended globally.

## Compact support

A function (or vector field, or differential form) has **compact support** if it vanishes outside some compact subset $K \subseteq M$. On a non-compact manifold this is the condition that makes $\int_M$ converge and that kills the boundary contributions at infinity — it is why Stokes's theorem and the integration of $n$-forms are stated for compactly supported forms. On a *compact* manifold every smooth function has compact support automatically, so the qualifier can be dropped.

## Embedded manifold

A **smooth submanifold** of $\mathbb{R}^N$ is a subset $M \subseteq \mathbb{R}^N$ that locally looks like the graph of a smooth function: around every $p \in M$ there is an open $U \subseteq \mathbb{R}^N$, an open $V \subseteq \mathbb{R}^n$, and a smooth embedding $\Phi: V \to U \cap M$ whose differential is everywhere injective. The image $\Phi(V)$ is an open piece of $M$, and the $n$ coordinates on $V$ are a chart on $M$.

The **embedded view** of differential geometry takes advantage of the ambient $\mathbb{R}^N$: tangent vectors are vectors in $\mathbb{R}^N$ (sitting in the affine tangent plane to $M$); the metric is the pullback of the Euclidean inner product; integration is over an embedded submanifold of $\mathbb{R}^N$. The Whitney embedding theorem says every smooth $n$-manifold can be embedded in $\mathbb{R}^{2n}$, so the embedded view loses no generality in principle. In practice it can be inconvenient — Lorentzian spacetimes do not embed isometrically in any flat ambient — which is why the abstract view is also needed.

## Abstract manifold

An **abstract smooth manifold** is a [Hausdorff](note:hausdorff), [second-countable](note:second-countable) topological space equipped with an atlas of charts $\varphi_\alpha: U_\alpha \to \mathbb{R}^n$ whose transition maps $\varphi_\beta \circ \varphi_\alpha^{-1}$ are smooth. No ambient space; the manifold is the chart-and-transition data, considered up to refinement of atlas.

All structures — tangent spaces, tensor fields, metrics, connections — are then built intrinsically. The geometry in this book is mostly abstract, with the embedded view brought in as the geometrically transparent special case.

## Immersion

A smooth map $F: M \to N$ is an **immersion** if its differential $dF_p: T_p M \to T_{F(p)} N$ is injective at every point. (Compare: a **submersion** has surjective differential; an **embedding** is an injective immersion that is a homeomorphism onto its image.) Immersions are the maps through which *Riemannian* metrics [pull back](note:pullback) to metrics: for positive-definite $g$, $F^* g$ is non-degenerate exactly when $dF_p$ is injective. In indefinite signature injectivity is necessary but not sufficient — a null hyperplane in [Minkowski space](note:minkowski-space) is embedded, yet its induced metric is degenerate. An immersion can self-intersect (a figure-eight curve in the plane); an [embedded submanifold](note:embedded-manifold) cannot.

## Pullback

For a smooth map $F: M \to N$, the **pullback** carries covariant tensors on $N$ back to $M$ by feeding tangent vectors through the differential: for a $k$-form (or metric, or any $(0, k)$-tensor) $T$,
$$(F^* T)_p(v_1, \ldots, v_k) := T_{F(p)}(dF_p \cdot v_1, \ldots, dF_p \cdot v_k).$$
Pullback always exists — vector fields, by contrast, push forward only through diffeomorphisms — and satisfies $F^*(\omega \wedge \eta) = F^*\omega \wedge F^*\eta$, $F^*(d\omega) = d(F^*\omega)$, and $(F \circ G)^* = G^* \circ F^*$. Pulling back a metric through an [immersion](note:immersion) gives the induced metric on a submanifold; $F^* g = g$ is the [isometry](note:isometry) condition. Defined for forms on the [exterior-derivative page](03-differential-forms/02-exterior-derivative-and-pullback.md).

## Derivation

For the commutative algebra $A = C^\infty(M)$ of smooth functions on a manifold, a **derivation at $p \in M$** is an $\mathbb{R}$-linear map $D: A \to \mathbb{R}$ satisfying the **Leibniz rule**
$$D(fg) = f(p)\, D(g) + g(p)\, D(f).$$
Every derivation at $p$ is determined by its values on a coordinate system around $p$ — $D(x^\mu)$ for the chart $x = (x^1, \ldots, x^n)$ — and the space of derivations is an $n$-dimensional real vector space, isomorphic to $T_p M$.

The derivation viewpoint generalizes: a derivation of $A$ (with values in $A$) is a vector field; the Lie bracket of vector fields is the commutator of derivations.

## Dual space

For a vector space $V$ over a field $k$, the **dual space** is the space of $k$-linear functionals
$$V^* := \mathrm{Hom}_k(V, k).$$
For finite-dimensional $V$, $\dim V^* = \dim V$; a basis $\{e_i\}$ of $V$ induces a **dual basis** $\{e^i\}$ of $V^*$ defined by $e^i(e_j) = \delta^i_j$. The double dual is canonically isomorphic to $V$: $V^{**} \cong V$ via $v \mapsto (\omega \mapsto \omega(v))$. The cotangent space $T^*_p M$ is the dual of the tangent space $T_p M$.

## Musical isomorphism

The metric's canonical identification of vectors with covectors. On a bare manifold the tangent space and its [dual](note:dual-space) have the same dimension but no canonical isomorphism between them (contrast the double dual, where $V^{**} \cong V$ *is* canonical). A metric $g$ provides one — the **musical isomorphisms**
$$\flat: T_p M \to T^*_p M, \qquad v^\flat := g(v, \cdot), \qquad \sharp := \flat^{-1}: T^*_p M \to T_p M,$$
named for how they move the component index down ($v_\mu = g_{\mu\nu}\, v^\nu$) and up ($\omega^\mu = g^{\mu\nu}\, \omega_\nu$) — [raising and lowering](08-metric/02-raising-and-lowering.md) applied to a single index. Previewed pointwise in [Part I's aside](01-manifolds/04-metric-at-a-point.md).

The gradient is the standard illustration of the distinction $\sharp$ erases: the differential $df$ of a function is metric-free, but the **gradient** $\operatorname{grad} f := (df)^\sharp$ is not. In Euclidean coordinates on $\mathbb{R}^n$ the two have identical components, which is why elementary vector calculus never distinguishes them; in any non-orthonormal chart, or on any curved manifold, they differ.

## Lie algebra

A **Lie algebra** over $\mathbb{R}$ is a real vector space $\mathfrak{g}$ equipped with a bilinear antisymmetric bracket $[\cdot, \cdot]: \mathfrak{g} \times \mathfrak{g} \to \mathfrak{g}$ satisfying the **Jacobi identity**
$$[X, [Y, Z]] + [Y, [Z, X]] + [Z, [X, Y]] = 0.$$
Examples: $\mathfrak{gl}_n(\mathbb{R})$ — $n \times n$ real matrices with $[A, B] = AB - BA$; the tangent space at the identity of any [Lie group](note:lie-group); the vector fields on a manifold under the Lie bracket. The vector-fields Lie algebra $\mathfrak{X}(M)$ is infinite-dimensional and not the Lie algebra of any finite-dimensional Lie group.

## Lie group

A **Lie group** is a group that is also a smooth manifold, with multiplication and inversion smooth maps. Examples: $GL_n(\mathbb{R})$, the rotation groups $SO(n)$, the Poincaré group of [Minkowski space](note:minkowski-space), $\mathbb{R}^n$ under addition, the circle $S^1$. The tangent space at the identity, with the bracket inherited from left-invariant vector fields, is the group's [Lie algebra](note:lie-algebra). Isometry groups of pseudo-Riemannian manifolds are Lie groups — that is why counting [Killing vectors](note:killing-vector) counts a *dimension*.

## Flow

The **flow** of a vector field $X$ is the map $\theta_t(p)$ that follows the integral curve of $X$ from $p$ for parameter time $t$: $\theta_0 = \mathrm{id}$, $\frac{d}{dt}\theta_t(p) = X_{\theta_t(p)}$, with the group law $\theta_t \circ \theta_s = \theta_{t+s}$ where defined. Each $\theta_t$ is a diffeomorphism between open subsets — a flow is a one-parameter family of transformations of $M$, and every such family arises this way from its velocity field. A vector field whose flow is defined for all $t \in \mathbb{R}$ is **complete**; [compactly supported](note:compact-support) fields always are. Defined in full on the [flows page](02-vector-fields-and-flows/02-flows-and-lie-bracket.md).

## Lie derivative

The rate of change of a [tensor field](note:tensor-field) $T$ along the [flow](note:flow) $\theta_t$ of a vector field $X$:
$$\mathcal{L}_X T := \frac{d}{dt}\bigg|_{t=0} (\theta_t^* T),$$
with $\theta_t^*$ the [pullback](note:pullback). Specializations: on functions $\mathcal{L}_X f = X(f)$; on vector fields $\mathcal{L}_X Y = [X, Y]$, the Lie bracket; on a metric, $\mathcal{L}_K g = 0$ says the flow of $K$ preserves the metric — the [Killing](note:killing-vector) condition. On differential forms, **Cartan's magic formula** $\mathcal{L}_X \omega = \iota_X(d\omega) + d(\iota_X \omega)$ computes it from the exterior derivative and the [interior product](note:interior-product). Developed on the [Lie-derivative page](02-vector-fields-and-flows/03-lie-derivative.md).

## Interior product

The contraction of a vector field into the first slot of a $k$-form:
$$\iota_X: \Omega^k(M) \to \Omega^{k-1}(M), \qquad (\iota_X \omega)(Y_1, \ldots, Y_{k-1}) := \omega(X, Y_1, \ldots, Y_{k-1}).$$
A graded antiderivation: $\iota_X(\omega \wedge \eta) = (\iota_X \omega) \wedge \eta + (-1)^k\, \omega \wedge (\iota_X \eta)$ for $\omega \in \Omega^k$, and $\iota_X^2 = 0$. It appears in Cartan's magic formula $\mathcal{L}_X = \iota_X d + d\, \iota_X$ ([Lie derivative](note:lie-derivative)) and in the boundary-orientation rule $\iota_\nu \Omega$ of Stokes's theorem. Introduced on the [Lie-derivative page](02-vector-fields-and-flows/03-lie-derivative.md).

## Tensor field

A **tensor field** of type $(r, s)$ on a smooth manifold $M$ is a smooth section of the bundle whose fiber at $p \in M$ is
$$T_p M^{\otimes r} \otimes T^*_p M^{\otimes s}.$$
Equivalently, a $C^\infty(M)$-multilinear map taking $r$ smooth $1$-forms and $s$ smooth vector fields and returning a smooth real-valued function. Vector fields are $(1, 0)$-tensor fields; $1$-forms are $(0, 1)$-tensor fields; $k$-forms are alternating $(0, k)$-tensor fields; the metric is a symmetric $(0, 2)$-tensor field. The Lie derivative and (given a connection) the covariant derivative extend to tensor fields of every type.

## Einstein summation

The convention, due to Einstein and unstated everywhere it's in force: a Greek (or Latin) index appearing exactly once *up* and exactly once *down* in the same monomial is summed over its range. So
$$v^\mu \omega_\mu := \sum_{\mu} v^\mu \omega_\mu, \qquad T^\mu{}_\nu\, S^\nu{}_\rho := \sum_{\nu} T^\mu{}_\nu\, S^\nu{}_\rho.$$

Two ramifications. First, repeated indices in the same vertical position ($v^\mu \omega^\mu$, $T_{\mu\mu}$) are almost always an error — there is no canonical pairing without a metric. Second, an index used as a dummy variable is *bound* and can be renamed: $v^\mu \omega_\mu = v^\nu \omega_\nu$. Be wary of dummy collisions when chaining contractions.

## Tensor transformation law

Under a change of coordinates $x^\mu \mapsto x'^{\mu'}(x)$, the components of an $(r, s)$-tensor transform as
$$T'^{\mu'_1 \cdots \mu'_r}{}_{\nu'_1 \cdots \nu'_s} = \frac{\partial x'^{\mu'_1}}{\partial x^{\mu_1}} \cdots \frac{\partial x'^{\mu'_r}}{\partial x^{\mu_r}}\; \frac{\partial x^{\nu_1}}{\partial x'^{\nu'_1}} \cdots \frac{\partial x^{\nu_s}}{\partial x'^{\nu'_s}}\; T^{\mu_1 \cdots \mu_r}{}_{\nu_1 \cdots \nu_s}$$
— one forward Jacobian factor per upper index, one inverse Jacobian factor per lower index. A component array obeying this rule on every chart overlap *is* a tensor; an array that picks up extra inhomogeneous terms (the Christoffel symbols are the standard example) is not. Stated and unpacked on the [coordinate-components page](07-tensors/02-coordinate-components.md).

## Running example

The unit sphere
$$S^2 = \{ (X, Y, Z) \in \mathbb{R}^3 : X^2 + Y^2 + Z^2 = 1 \}$$
is the running example carried through Part II of this book. Two reasons it works:

- **Small enough to compute on by hand.** Two coordinates, one round metric, four-line Christoffel calculation, single Riemann component.
- **Big enough to break intuition.** Non-zero constant curvature; no global flat chart; non-trivial topology ([Euler characteristic](note:euler-characteristic) $2$); $SO(3)$ symmetry; closed orientable.

The drawback — $S^2$ is two-dimensional Riemannian, not four-dimensional Lorentzian — means it doesn't model spacetime. But every tensor construction in the book is dimension- and signature-agnostic; correctness on $S^2$ is correctness in general.

## Wedge convention

This book writes a $k$-form in the **$1/k!$ convention**:
$$\omega = \frac{1}{k!}\, \omega_{\mu_1 \cdots \mu_k}\, dx^{\mu_1} \wedge \cdots \wedge dx^{\mu_k},$$
with $\omega_{\mu_1 \cdots \mu_k}$ totally antisymmetric and the sum over all index tuples. The common alternative — the **strictly-increasing-index convention** —
$$\omega = \sum_{\mu_1 < \cdots < \mu_k} \omega_{\mu_1 \cdots \mu_k}\, dx^{\mu_1} \wedge \cdots \wedge dx^{\mu_k}$$
carries no combinatorial prefactor and sums only over ordered tuples. The two give the *same* component array on ordered tuples (e.g. $\omega_{\theta\varphi} = \sin\theta$ for the sphere's area form either way); they differ only in whether the basis is reduced to ordered tuples or the components are antisymmetrized and divided by $k!$. Watch for the factor when comparing formulas across textbooks.

## Levi-Civita

Three related but distinct objects share the name.

**Levi-Civita symbol.** The totally antisymmetric *symbol* $\varepsilon_{\mu_1 \cdots \mu_n}$ — not a tensor — defined by $\varepsilon_{1 \cdots n} = 1$ and antisymmetry under any pair swap. Coordinate-dependent: it transforms like a [tensor density](note:tensor-density) of weight $+1$. Used in the explicit formula for the Hodge star.

**Levi-Civita tensor.** The honest tensor $\epsilon_{\mu_1 \cdots \mu_n} := \sqrt{|\det g|}\, \varepsilon_{\mu_1 \cdots \mu_n}$. The factor of $\sqrt{|\det g|}$ converts the density into a tensor; this is the canonical [volume form](note:volume-form) $\mathrm{vol}_g$.

**Levi-Civita connection.** The unique torsion-free metric-compatible connection of a pseudo-Riemannian manifold $(M, g)$ — the connection assumed throughout standard GR. Its Christoffel symbols are
$$\Gamma^\rho{}_{\mu\nu} = \tfrac{1}{2}\, g^{\rho\sigma} \left( \partial_\mu g_{\nu\sigma} + \partial_\nu g_{\sigma\mu} - \partial_\sigma g_{\mu\nu} \right),$$
derived on the [covariant-derivative page](09-connection-and-curvature/02-covariant-derivative.md).

Three different objects, one Italian mathematician. Context picks which is meant.

## Tensor density

A **tensor density of weight $w$** is a component array that transforms by the [tensor law](note:tensor-transformation-law) times an extra factor $\bigl[\det(\partial x'/\partial x)\bigr]^w$ of the Jacobian determinant. Weight $0$ is an ordinary tensor. The [Levi-Civita](note:levi-civita) symbol (lower indices) has weight $+1$; $\sqrt{|\det g|}$ is a scalar density of weight $-1$; their product is an honest tensor — the general pattern, since multiplying by the appropriate power of $\sqrt{|\det g|}$ converts any density to a tensor. Densities appear wherever determinants do: volume elements, integrands, and the $\sqrt{|\det g|}$ factors of the variational formulas in chapter 10. (Sign conventions for $w$ vary across textbooks — some count powers of $\det(\partial x/\partial x')$ instead.)

## Volume form

On an oriented pseudo-Riemannian manifold, the canonical top-degree form
$$\mathrm{vol}_g = \sqrt{|\det g|}\; dx^1 \wedge \cdots \wedge dx^n$$
in any positively-oriented chart — chart-independent, because the Jacobian factors from $\det g$ and from the wedge cancel. It integrates scalars: $\int_M f\, \mathrm{vol}_g$ is well-defined for compactly supported $f$. As a tensor it is the [Levi-Civita](note:levi-civita) tensor. On the unit sphere, $\mathrm{vol}_g = \sin\theta\, d\theta \wedge d\varphi$, total area $4\pi$. Constructed on the [raising-and-lowering page](08-metric/02-raising-and-lowering.md).

## Covariant derivative

The derivative operator $\nabla$ of a connection, extended to all tensor fields: in components, one Christoffel correction per index,
$$\nabla_\mu v^\nu = \partial_\mu v^\nu + \Gamma^\nu{}_{\mu\rho}\, v^\rho, \qquad \nabla_\mu \omega_\nu = \partial_\mu \omega_\nu - \Gamma^\rho{}_{\mu\nu}\, \omega_\rho,$$
with $+\Gamma$ for every upper index and $-\Gamma$ for every lower one, and $\nabla_\mu f = \partial_\mu f$ on scalars. Unlike the bare partial derivative, $\nabla T$ is a genuine tensor. For the [Levi-Civita](note:levi-civita) connection of a metric $g$, the Christoffel symbols come from the **Christoffel formula**
$$\Gamma^\rho{}_{\mu\nu} = \tfrac{1}{2}\, g^{\rho\sigma} \left( \partial_\mu g_{\nu\sigma} + \partial_\nu g_{\sigma\mu} - \partial_\sigma g_{\mu\nu} \right),$$
and $\nabla g = 0$. Developed in full on the [covariant-derivative page](09-connection-and-curvature/02-covariant-derivative.md).

## Parallel transport

A vector field $V(t)$ along a curve $\gamma$ is **parallel-transported** if $\nabla_{\dot\gamma} V = 0$ — a linear ODE whose solutions define an isomorphism $P_\gamma: T_{\gamma(t_0)} M \to T_{\gamma(t_1)} M$ between tangent spaces along the curve. For a metric-compatible connection it preserves inner products. The transport depends on the *path*, not just the endpoints: carried around a small closed loop spanned by $u, v$, a vector returns rotated by $R(u, v)\, Z$ to first order — that failure *is* the Riemann curvature. Defined on the [covariant-derivative page](09-connection-and-curvature/02-covariant-derivative.md).

## Geodesic

A curve whose velocity is [parallel-transported](note:parallel-transport) along itself:
$$\nabla_{\dot\gamma} \dot\gamma = 0, \qquad \text{in coordinates} \quad \ddot\gamma^\rho + \Gamma^\rho{}_{\mu\nu}\, \dot\gamma^\mu \dot\gamma^\nu = 0.$$
For the Levi-Civita connection these are the locally length-extremizing curves — great circles on the sphere, straight lines in flat space. In GR, timelike geodesics are the worldlines of free-falling massive particles and null geodesics the worldlines of light. Along any geodesic, each [Killing vector](note:killing-vector) $K$ gives a conserved quantity $K_\mu \dot\gamma^\mu$. Developed on the [covariant-derivative page](09-connection-and-curvature/02-covariant-derivative.md).

## Riemann index convention

This book (following Misner–Thorne–Wheeler and Wald) writes
$$R^\rho{}_{\sigma\mu\nu} = \partial_\mu \Gamma^\rho{}_{\nu\sigma} - \partial_\nu \Gamma^\rho{}_{\mu\sigma} + \Gamma^\rho{}_{\mu\lambda}\, \Gamma^\lambda{}_{\nu\sigma} - \Gamma^\rho{}_{\nu\lambda}\, \Gamma^\lambda{}_{\mu\sigma},$$
matching $R(X, Y) Z := \nabla_X \nabla_Y Z - \nabla_Y \nabla_X Z - \nabla_{[X, Y]} Z$: the output index $\rho$ first, then the index $\sigma$ of the vector being transported, then the two antisymmetrized loop directions $\mu, \nu$. Mnemonic: [parallel transport](note:parallel-transport) of $Z$ around the loop spanned by $u, v$ changes it by $R(u, v)\, Z$. Other texts permute slots or flip the overall sign — check conventions before comparing formulas.

## Isometry

A diffeomorphism $F: M \to M$ with $F^* g = g$ — it preserves every length and angle the metric defines. The isometries of $(M, g)$ form a [Lie group](note:lie-group): $O(3)$ for the round sphere, the Poincaré group for [Minkowski space](note:minkowski-space). Continuous one-parameter families of isometries are the [flows](note:flow) of [Killing vector fields](note:killing-vector). Defined on the [Killing-vectors page](08-metric/03-killing-vectors.md).

## Killing vector

A vector field $K \in \mathfrak{X}(M)$ on a pseudo-Riemannian manifold $(M, g)$ is a **Killing vector field** if its [flow](note:flow) preserves the metric, i.e. if the [Lie derivative](note:lie-derivative)
$$\mathcal{L}_K g = 0.$$
In components,
$$\nabla_\mu K_\nu + \nabla_\nu K_\mu = 0$$
(the **Killing equation**, equivalent to $\mathcal{L}_K g = 0$ for the Levi-Civita connection).

Killing fields are the infinitesimal generators of [isometries](note:isometry): their flows are one-parameter families of isometries of $(M, g)$. Along a [geodesic](note:geodesic) $\gamma$, $K_\mu \dot\gamma^\mu$ is conserved — every Killing vector gives a conserved quantity for free-fall motion. The [Killing-vectors page](08-metric/03-killing-vectors.md) develops the isometry picture, the sphere's three fields, the Noether connection, and the Schwarzschild $E$ and $L$.

## Proper time

Along a timelike curve $\gamma$ in a Lorentzian manifold with signature $(-, +, +, +)$, the **proper time** is
$$\tau = \int \sqrt{-\, g_{\mu\nu}\, \dot\gamma^\mu \dot\gamma^\nu}\; d\lambda$$
— the timelike length of the curve, and physically the elapsed time read by a clock carried along it. Reparametrization-invariant. Between fixed events, free fall ([timelike geodesics](note:geodesic)) locally *maximizes* proper time — the twin who accelerates ages less. Introduced with curve length on [the metric-tensor page](08-metric/01-the-metric-tensor.md).

## Minkowski space

The spacetime of special relativity: $\mathbb{R}^4$ with the global flat Lorentzian metric
$$\eta = -dt^2 + dx^2 + dy^2 + dz^2$$
(signature $(-, +, +, +)$). All Christoffel symbols vanish in these coordinates, so [geodesics](note:geodesic) are straight lines and the Riemann tensor is zero — the "no gravity" special case that curved solutions approach asymptotically (Schwarzschild as $r \to \infty$). Its [isometry](note:isometry) group is the **Poincaré group**: translations plus Lorentz transformations. Every tangent space of a Lorentzian manifold is a copy of Minkowski space in miniature — the content of the [Part I aside](01-manifolds/04-metric-at-a-point.md).

## Lovelock's theorem

In four dimensions, every symmetric $(0, 2)$-tensor that is (i) built from the metric and at most its first and second derivatives and (ii) divergence-free is a linear combination
$$a\, G_{\mu\nu} + b\, g_{\mu\nu}$$
of the Einstein tensor and the metric. So the left-hand side of the Einstein equations — including the cosmological-constant term — is forced, not chosen, once a tensorial second-order theory of the metric is demanded. In dimension $n > 4$, additional "Lovelock terms" (Gauss–Bonnet and higher) become available, which is one reason higher-dimensional gravity theories are less rigid than $4$D GR.

## Cartan formalism

The **tetrad** (or **vielbein**) formulation of gravity. Replace the coordinate basis with an orthonormal coframe: $n$ one-forms $e^a$ with
$$g = \eta_{ab}\; e^a \otimes e^b,$$
where $\eta$ is the flat metric of the appropriate signature ("tetrad" when $n = 4$). The connection becomes the **spin connection** $\omega^a{}_b$, a matrix of one-forms, and torsion and curvature become the two-forms of the **Cartan structure equations**
$$T^a = de^a + \omega^a{}_b \wedge e^b, \qquad R^a{}_b = d\omega^a{}_b + \omega^a{}_c \wedge \omega^c{}_b.$$
The payoff: [spinor](note:spinor) fields on curved spacetime become definable (spinors transform under local frame rotations, which the coordinate-basis formalism has no handle on), and the [Einstein–Cartan](10-general-relativity/03-einstein-cartan.md) action becomes a polynomial in differential forms. Misner–Thorne–Wheeler (chapter 14) and Nakahara develop the formalism in full.

## Spinor

A field that transforms under the **Spin group** — the double cover of the rotation group $SO(n)$ (or, in Lorentzian signature, of the Lorentz group) — rather than under the group itself. The double-cover subtlety is physical: a spinor changes sign under a $2\pi$ rotation and returns to itself only after $4\pi$. Electrons, quarks, and all Standard-Model fermions are described by (Dirac) spinors. Spin representations do not extend to $GL_n$, so spinors cannot be defined from a coordinate basis alone — curved-spacetime spinors need an orthonormal frame and spin connection (the [Cartan formalism](note:cartan-formalism)). Their intrinsic angular momentum is the **spin density** that sources torsion in [Einstein–Cartan](10-general-relativity/03-einstein-cartan.md) gravity.

## Cochain complex

A **cochain complex** is a sequence of abelian groups (or vector spaces) and linear maps
$$\cdots \to C^{k-1} \xrightarrow{d^{k-1}} C^k \xrightarrow{d^k} C^{k+1} \to \cdots$$
with $d^k \circ d^{k-1} = 0$ for every $k$. The kernel of each $d^k$ ("cocycles") contains the image of the previous $d^{k-1}$ ("coboundaries"), and the quotient $\ker(d^k) / \mathrm{im}(d^{k-1})$ is the $k$-th *cohomology* of the complex. The complex $\Omega^0 \to \Omega^1 \to \Omega^2 \to \cdots$ with [exterior derivative](03-differential-forms/02-exterior-derivative-and-pullback.md) as $d$ is the **de Rham complex**.

A **chain complex** is the same structure with the maps *lowering* degree ($\partial_k: C_k \to C_{k-1}$, $\partial^2 = 0$); its quotients are *homology*. Dualizing a chain complex — $C^k := \mathrm{Hom}(C_k, A)$ with $d := \partial^*$ — produces a cochain complex, which is exactly how [singular cohomology](note:singular-cohomology) arises from the singular chain complex.

## Singular cohomology

**Singular cohomology** $H^k(X; A)$ of a topological space $X$ with coefficients in an abelian group $A$ is built from the dual of the singular [chain complex](note:cochain-complex). A *singular $k$-simplex* in $X$ is a continuous map $\Delta^k \to X$; the free abelian group on these forms $C_k(X)$, with the boundary map $\partial_k: C_k \to C_{k-1}$. Then $C^k(X; A) := \mathrm{Hom}(C_k(X), A)$ and $d := \partial^*$. Cohomology depends only on the homotopy type of $X$, and for [paracompact](note:paracompact) [Hausdorff](note:hausdorff) $X$ the singular and de Rham versions agree (de Rham's theorem).

## Contractible

Two smooth maps $F, G: M \to N$ are **(smoothly) homotopic**, written $F \simeq G$, if one can be deformed into the other: there is a smooth $H: M \times [0, 1] \to N$ with $H(\cdot, 0) = F$ and $H(\cdot, 1) = G$. A manifold $M$ is **contractible** if its identity map is homotopic to a constant map — $M$ can be continuously shrunk to a point. Convex and [star-shaped](note:star-shaped) subsets of $\mathbb{R}^n$ are contractible; $\mathbb{R}^n$ is, but $\mathbb{R}^n \setminus \{0\}$ and the sphere are not.

De Rham cohomology is a **homotopy invariant**: homotopic maps induce the same map on cohomology, so a contractible manifold has the cohomology of a point (all reduced groups vanish — the Poincaré lemma).

## Euler characteristic

The alternating sum of the dimensions of a space's cohomology groups (its Betti numbers):
$$\chi(M) := \sum_k (-1)^k \dim H^k(M; \mathbb{R})$$
— equivalently $V - E + F$ (and its higher-dimensional analogue) for any triangulation. A homotopy invariant. Values worth memorizing: $\chi(S^2) = 2$; $\chi(T^n) = 0$; $\chi = 0$ for every odd-dimensional closed manifold; a genus-$g$ surface has $\chi = 2 - 2g$. Two roles in this book: Gauss–Bonnet, $\int_M K\, \mathrm{vol}_g = 2\pi \chi(M)$, ties curvature to topology; and the Poincaré–Hopf theorem — a closed manifold admits a nowhere-vanishing vector field iff $\chi = 0$ — is why the sphere admits no Lorentzian metric but the torus does.

## Star-shaped

An open set $U \subseteq \mathbb{R}^n$ is **star-shaped about $p \in U$** if for every $q \in U$, the line segment $\{(1-t)p + tq : t \in [0, 1]\}$ from $p$ to $q$ lies entirely in $U$. Convex sets are star-shaped about any of their points. Star-shaped sets are contractible — the homotopy $H(q, t) = (1-t)q + tp$ retracts $U$ to $p$ — and this contraction is the ingredient that makes the cone-operator proof of the Poincaré lemma work.

## Sheaf

A **sheaf** of abelian groups on a topological space $X$ assigns to every open $U \subseteq X$ an abelian group $\mathcal{F}(U)$ ("sections over $U$") and to every inclusion $V \subseteq U$ a restriction map $\mathcal{F}(U) \to \mathcal{F}(V)$, subject to a **gluing axiom**: local sections that agree on overlaps glue uniquely to a section on the union.

The **constant sheaf** $\underline{A}$ assigns $A$ (with the discrete topology) to each connected open set. The sheaf $C^\infty_M$ assigns $C^\infty(U)$ to each $U$. **Sheaf cohomology** $H^k(X; \mathcal{F})$ generalizes singular cohomology; an **acyclic resolution** is a long exact sequence of sheaves that's nice enough to compute cohomology from. The de Rham complex is an acyclic resolution of $\underline{\mathbb{R}}$ on $M$, which is the abstract reason de Rham cohomology computes $H^*(M; \mathbb{R})$.

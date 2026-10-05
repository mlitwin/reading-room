---
title: Notes
notes: true
---

Short definitions behind the underlined terms in the chapters: terms the text uses without developing, and recaps of ones it does develop, each linked back to its full treatment. Read it as a glossary or open entries in place from the text.

## Hausdorff

A topological space is **Hausdorff** if any two distinct points $p, q$ have disjoint open neighborhoods $U \ni p$, $V \ni q$ with $U \cap V = \emptyset$. Most spaces appearing in differential geometry are Hausdorff: $\mathbb{R}^n$, every metric space, every [Lie group](note:lie-group) — and every manifold, because the definition of a manifold demands it. The non-Hausdorff cases are exotic — the "line with two origins" is the canonical example.

## Second countable

A topological space is **second countable** if its topology has a countable base: countably many open sets such that every open set is a union of some of them. For a metric space this is equivalent to having a countable dense subset: balls of rational radius about its points form a countable base. This is what makes [paracompactness](note:paracompact) and [partition-of-unity](note:partition-of-unity) arguments work on a manifold.

## Paracompact

A topological space is **paracompact** if every open cover admits a *locally finite* open refinement — a cover by smaller sets, each inside some original set, such that every point has a neighborhood meeting only finitely many of them. For manifolds the property comes for free: [second-countable](note:second-countable) plus [Hausdorff](note:hausdorff) implies paracompact, and paracompactness is exactly what a [partition of unity](note:partition-of-unity) needs to exist. It is the standard topological hypothesis under which the local-to-global constructions of differential geometry (gluing metrics, defining integration) go through.

## Partition of unity

A **partition of unity** subordinate to an open cover $\{U_\alpha\}$ of $M$ is a family of smooth functions $\rho_\alpha: M \to [0, 1]$, each supported inside the corresponding $U_\alpha$, locally finite (every point has a neighborhood meeting only finitely many supports), with $\sum_\alpha \rho_\alpha = 1$ everywhere. On a smooth manifold every open cover admits one (this uses [second countability](note:second-countable) and the [Hausdorff](note:hausdorff) property). It turns local constructions into global ones: integration is defined chart by chart and glued ($\int_M \tens{\omega} = \sum_\alpha \int \rho_\alpha\, \tens{\omega}$), Riemannian metrics are built by gluing chart-wise Euclidean ones, and local sections are extended globally.

## Compact support

A function (or vector field, or differential form) has **compact support** if it vanishes outside some compact subset $K \subseteq M$. On a non-compact manifold this is the condition that makes $\int_M$ converge and that kills the boundary contributions at infinity — it is why Stokes's theorem and the integration of $n$-forms are stated for compactly supported forms. On a *compact* manifold every smooth function has compact support automatically, so the qualifier can be dropped.

## Embedded manifold

A **smooth submanifold** of $\mathbb{R}^N$ is a subset $M \subseteq \mathbb{R}^N$ that is smoothly parametrized near each point: around every $p \in M$ there is an open $U \subseteq \mathbb{R}^N$, an open $V \subseteq \mathbb{R}^n$, and a smooth map $\Phi: V \to \mathbb{R}^N$ with everywhere-injective differential that is a homeomorphism onto $U \cap M$. The image $\Phi(V)$ is an open piece of $M$, and the $n$ coordinates on $V$ are a chart on $M$.

The **embedded view** of differential geometry takes advantage of the ambient $\mathbb{R}^N$: tangent vectors are vectors in $\mathbb{R}^N$ (spanning the tangent plane to $M$); the metric is the pullback of the Euclidean inner product; integration is over an embedded submanifold of $\mathbb{R}^N$. The Whitney embedding theorem says every smooth $n$-manifold can be embedded in $\mathbb{R}^{2n}$, so the embedded view loses no generality in principle. In practice the ambient space is excess baggage — isometric embeddings need many more dimensions (Nash), and a Lorentzian metric can only be induced from an indefinite-signature ambient space — which is why the abstract view is the working one.

## Abstract manifold

An **abstract smooth manifold** is a [Hausdorff](note:hausdorff), [second-countable](note:second-countable) topological space equipped with an atlas of charts $\varphi_\alpha: U_\alpha \to \mathbb{R}^n$ whose transition maps $\varphi_\beta \circ \varphi_\alpha^{-1}$ are smooth. No ambient space; the manifold is the chart-and-transition data, considered up to equivalence of atlases (equivalently, with a maximal atlas).

All structures — tangent spaces, tensor fields, metrics, connections — are then built intrinsically. The geometry in this book is mostly abstract, with the embedded view brought in as the geometrically transparent special case.

## Chart

A **chart** $(U, \varphi)$ is an open set $U \subseteq M$ with a homeomorphism $\varphi: U \to \varphi(U) \subseteq \mathbb{R}^n$; its components $x^i = \varphi^i$ are local coordinates. Two charts are compatible when the **transition map** $\psi \circ \varphi^{-1}$ is a diffeomorphism on the overlap. A covering family of compatible charts is an **atlas**, and a maximal atlas is a smooth structure. Chapter 4 works with the inverse direction, the parametrization $\Phi = \varphi^{-1}$. Defined on the [charts page](01-manifolds/01-charts-and-smooth-maps.md).

## Tangent space

$T_p M$ is the $n$-dimensional space of velocities of curves through $p$. Equivalently, it is the space of [derivations](note:derivation) at $p$. In a chart it has the basis $\partial_i = \partial/\partial x^i$, and a vector is $\tens{v} = v^i\, \partial_i$. Under a change of chart the components transform with the Jacobian, $v'^{i'} = (\partial x'^{i'}/\partial x^j)\, v^j$. The basis transforms with its inverse, which is why the index is up (contravariant). Defined on the [tangent-space page](01-manifolds/02-tangent-space.md).

## Differential of a map

For smooth $F: M \to N$, the **differential** (or **pushforward**) $dF_p = F_{*,p}: T_p M \to T_{F(p)} N$ is $(dF_p\, \tens{v})(g) = \tens{v}(g \circ F)$. Its matrix in coordinates is the Jacobian $\partial F^{i'}/\partial x^j$, and the chain rule reads $d(G \circ F) = dG \circ dF$. It is the dual of the [pullback](note:pullback). Defined on the [tangent-space page](01-manifolds/02-tangent-space.md).

## Cotangent space

$T^*_p M$ is the [dual](note:dual-space) of the [tangent space](note:tangent-space): the linear functionals on $T_p M$, called covectors or 1-forms at $p$. The dual basis $dx^i$ satisfies $dx^i(\partial_j) = \delta^i_j$, and a covector is $\tens{\omega} = \omega_i\, dx^i$. The components transform with the same matrix as $\partial_i$ (covariant, index down). The differential of a function is $df(\tens{v}) = \tens{v}(f)$, and the pairing $\tens{\omega}(\tens{v}) = \omega_i v^i$ is chart-independent. Defined on the [cotangent-space page](01-manifolds/03-cotangent-space.md).

## Immersion

A smooth map $F: M \to N$ is an **immersion** if its differential $dF_p: T_p M \to T_{F(p)} N$ is injective at every point. (Compare: a **submersion** has surjective differential; an **embedding** is an injective immersion that is a homeomorphism onto its image.) Immersions are the maps through which *Riemannian* metrics [pull back](note:pullback) to metrics: for positive-definite $\tens{g}$, $F^* \tens{g}$ is non-degenerate exactly when $dF_p$ is injective. In indefinite signature injectivity is necessary but not sufficient — a null hyperplane in [Minkowski space](note:minkowski-space) is embedded, yet its induced metric is degenerate. An immersion can self-intersect (a figure-eight curve in the plane); an [embedded submanifold](note:embedded-manifold) cannot.

## Pullback

For a smooth map $F: M \to N$, the **pullback** carries covariant tensors on $N$ back to $M$ by feeding tangent vectors through the differential: for a $k$-form (or metric, or any $(0, k)$-tensor) $\tens{T}$,
$$(F^* \tens{T})_p(\tens{v}_1, \ldots, \tens{v}_k) := \tens{T}_{F(p)}(dF_p \cdot \tens{v}_1, \ldots, dF_p \cdot \tens{v}_k).$$
Pullback always exists — vector fields, by contrast, push forward only through diffeomorphisms — and satisfies $F^*(\tens{\omega} \wedge \tens{\eta}) = F^*\tens{\omega} \wedge F^*\tens{\eta}$, $F^*(d\tens{\omega}) = d(F^*\tens{\omega})$, and $(F \circ G)^* = G^* \circ F^*$. Pulling back a metric through an [immersion](note:immersion) gives the induced metric on a submanifold; $F^* \tens{g} = \tens{g}$ is the [isometry](note:isometry) condition. Defined for forms on the [exterior-derivative page](06-differential-forms/02-exterior-derivative-and-pullback.md).

## Derivation

For the commutative algebra $A = C^\infty(M)$ of smooth functions on a manifold, a **derivation at $p \in M$** is an $\mathbb{R}$-linear map $D: A \to \mathbb{R}$ satisfying the **Leibniz rule**
$$D(fg) = f(p)\, D(g) + g(p)\, D(f).$$
Every derivation at $p$ is determined by its values on a coordinate system around $p$ — $D(x^i)$ for the chart $x = (x^1, \ldots, x^n)$ — and the space of derivations is an $n$-dimensional real vector space, isomorphic to $T_p M$.

The derivation viewpoint generalizes: a derivation of $A$ (with values in $A$) is a vector field; the Lie bracket of vector fields is the commutator of derivations.

## Dual space

For a vector space $V$ over a field $k$, the **dual space** is the space of $k$-linear functionals
$$V^* := \mathrm{Hom}_k(V, k).$$
For finite-dimensional $V$, $\dim V^* = \dim V$; a basis $\{e_i\}$ of $V$ induces a **dual basis** $\{e^i\}$ of $V^*$ defined by $e^i(e_j) = \delta^i_j$. The double dual is canonically isomorphic to $V$: $V^{**} \cong V$ via $\tens{v} \mapsto (\tens{\omega} \mapsto \tens{\omega}(\tens{v}))$. The cotangent space $T^*_p M$ is the dual of the tangent space $T_p M$.

## Musical isomorphism

The metric's canonical identification of vectors with covectors. On a bare manifold the tangent space and its [dual](note:dual-space) have the same dimension but no canonical isomorphism between them (contrast the double dual, where $V^{**} \cong V$ *is* canonical). A metric $\tens{g}$ provides one — the **musical isomorphisms**
$$\flat: T_p M \to T^*_p M, \qquad \tens{v}^\flat := \tens{g}(\tens{v}, \cdot), \qquad \sharp := \flat^{-1}: T^*_p M \to T_p M,$$
named for how they move the component index down ($v_\mu = g_{\mu\nu}\, v^\nu$) and up ($\omega^\mu = g^{\mu\nu}\, \omega_\nu$) — [raising and lowering](03-metric/02-raising-and-lowering.md) applied to a single index.

The gradient is the standard illustration of the distinction $\sharp$ erases: the differential $df$ of a function is metric-free, but the **gradient** $\operatorname{grad} f := (df)^\sharp$ is not. In Cartesian coordinates on $\mathbb{R}^n$ the two have identical components, which is why elementary vector calculus never distinguishes them; in any chart with $g_{\mu\nu} \neq \delta_{\mu\nu}$ they differ.

## Lie algebra

A **Lie algebra** over $\mathbb{R}$ is a real vector space $\mathfrak{g}$ equipped with a bilinear antisymmetric bracket $[\cdot, \cdot]: \mathfrak{g} \times \mathfrak{g} \to \mathfrak{g}$ satisfying the **Jacobi identity**
$$[\tens{X}, [\tens{Y}, \tens{Z}]] + [\tens{Y}, [\tens{Z}, \tens{X}]] + [\tens{Z}, [\tens{X}, \tens{Y}]] = 0.$$
Examples: $\mathfrak{gl}_n(\mathbb{R})$ — $n \times n$ real matrices with $[A, B] = AB - BA$; the tangent space at the identity of any [Lie group](note:lie-group); the vector fields on a manifold under the Lie bracket. The vector-fields Lie algebra $\mathfrak{X}(M)$ is infinite-dimensional and not the Lie algebra of any finite-dimensional Lie group.

## Lie group

A **Lie group** is a group that is also a smooth manifold, with multiplication and inversion smooth maps. Examples: $GL_n(\mathbb{R})$, the rotation groups $SO(n)$, the Poincaré group of [Minkowski space](note:minkowski-space), $\mathbb{R}^n$ under addition, the circle $S^1$. The tangent space at the identity, with the bracket inherited from left-invariant vector fields, is the group's [Lie algebra](note:lie-algebra). Isometry groups of pseudo-Riemannian manifolds are Lie groups — that is why counting [Killing vectors](note:killing-vector) counts a *dimension*.

## Flow

The **flow** of a vector field $\tens{X}$ is the map $\theta_t(p)$ that follows the integral curve of $\tens{X}$ from $p$ for parameter time $t$: $\theta_0 = \mathrm{id}$, $\frac{d}{dt}\theta_t(p) = \tens{X}_{\theta_t(p)}$, with the group law $\theta_t \circ \theta_s = \theta_{t+s}$ where defined. Each $\theta_t$ is a diffeomorphism between open subsets — a flow is a one-parameter family of transformations of $M$, and every such family arises this way from its velocity field. A vector field whose flow is defined for all $t \in \mathbb{R}$ is **complete**; [compactly supported](note:compact-support) fields always are. Defined in full on the [flows page](05-vector-fields-and-flows/02-flows-and-lie-bracket.md).

## Lie bracket

The vector field $[\tens{X}, \tens{Y}] f := \tens{X}(\tens{Y} f) - \tens{Y}(\tens{X} f)$, in components $[\tens{X}, \tens{Y}]^k = X^i \partial_i Y^k - Y^i \partial_i X^k$. It is bilinear over $\mathbb{R}$, antisymmetric, and satisfies the Jacobi identity, which makes $\mathfrak{X}(M)$ a [Lie algebra](note:lie-algebra). It is not $C^\infty(M)$-bilinear: $[\tens{X}, f\tens{Y}] = f[\tens{X}, \tens{Y}] + \tens{X}(f)\, \tens{Y}$. It vanishes exactly when the [flows](note:flow) of $\tens{X}$ and $\tens{Y}$ commute, and it equals $\Lie_{\tens{X}} \tens{Y}$. Defined on the [flows page](05-vector-fields-and-flows/02-flows-and-lie-bracket.md).

## Lie derivative

The rate of change of a [tensor field](note:tensor-field) $\tens{T}$ along the [flow](note:flow) $\theta_t$ of a vector field $\tens{X}$:
$$\Lie_{\tens{X}} \tens{T} := \frac{d}{dt}\bigg|_{t=0} (\theta_t^* \tens{T}),$$
with $\theta_t^*$ the [pullback](note:pullback). Specializations: on functions $\Lie_{\tens{X}} f = \tens{X}(f)$; on vector fields $\Lie_{\tens{X}} \tens{Y} = [\tens{X}, \tens{Y}]$, the Lie bracket; on a metric, $\Lie_{\tens{\xi}} \tens{g} = 0$ says the flow of $\tens{\xi}$ preserves the metric — the [Killing](note:killing-vector) condition. On differential forms, **Cartan's magic formula** $\Lie_{\tens{X}} \tens{\omega} = \iota_{\tens{X}}(d\tens{\omega}) + d(\iota_{\tens{X}} \tens{\omega})$ computes it from the exterior derivative and the [interior product](note:interior-product). Developed on the [Lie-derivative page](05-vector-fields-and-flows/03-lie-derivative.md).

## Interior product

The contraction of a vector field into the first slot of a $k$-form:
$$\iota_{\tens{X}}: \Omega^k(M) \to \Omega^{k-1}(M), \qquad (\iota_{\tens{X}} \tens{\omega})(\tens{Y}_1, \ldots, \tens{Y}_{k-1}) := \tens{\omega}(\tens{X}, \tens{Y}_1, \ldots, \tens{Y}_{k-1}).$$
A graded antiderivation: $\iota_{\tens{X}}(\tens{\omega} \wedge \tens{\eta}) = (\iota_{\tens{X}} \tens{\omega}) \wedge \tens{\eta} + (-1)^k\, \tens{\omega} \wedge (\iota_{\tens{X}} \tens{\eta})$ for $\tens{\omega} \in \Omega^k$, and $\iota_{\tens{X}}^2 = 0$. It appears in Cartan's magic formula $\Lie_{\tens{X}} = \iota_{\tens{X}} d + d\, \iota_{\tens{X}}$ ([Lie derivative](note:lie-derivative)) and in the boundary-orientation rule $\iota_{\tens{\nu}} \tens{\Omega}$ of Stokes's theorem. Introduced with [Cartan's formula](06-differential-forms/02-exterior-derivative-and-pullback.md).

## Differential form

A **$k$-form** at $p$ is an alternating multilinear map on $k$ tangent vectors. These form the space $\Lambda^k T^*_p M$, of dimension $\binom{n}{k}$. A differential $k$-form is a smooth field of them; the space of all of them is $\Omega^k(M)$. In coordinates, $\tens{\omega} = \tfrac{1}{k!}\, \omega_{i_1 \cdots i_k}\, dx^{i_1} \wedge \cdots \wedge dx^{i_k}$ ([convention](note:wedge-convention)). The **wedge product** is associative and graded-commutative, $\tens{\omega} \wedge \tens{\eta} = (-1)^{k\ell}\, \tens{\eta} \wedge \tens{\omega}$. Defined on the [$k$-forms page](06-differential-forms/01-k-forms-and-wedge.md).

## Exterior derivative

The unique $\mathbb{R}$-linear $d: \Omega^k \to \Omega^{k+1}$ satisfying three conditions:

- on functions it is the differential $df$;
- graded Leibniz: $d(\tens{\omega} \wedge \tens{\eta}) = d\tens{\omega} \wedge \tens{\eta} + (-1)^k\, \tens{\omega} \wedge d\tens{\eta}$;
- $d \circ d = 0$.

In coordinates, $d\tens{\omega} = \tfrac{1}{k!}\, \partial_j \omega_{i_1 \cdots i_k}\, dx^j \wedge dx^{i_1} \wedge \cdots \wedge dx^{i_k}$. It commutes with [pullback](note:pullback). Defined on the [exterior-derivative page](06-differential-forms/02-exterior-derivative-and-pullback.md).

## Closed and exact forms

A form is **closed** if $d\tens{\omega} = 0$ and **exact** if $\tens{\omega} = d\tens{\eta}$. Every exact form is closed, because $d^2 = 0$. The converse holds locally (on [contractible](note:contractible) sets, the Poincaré lemma) but fails globally. The standard example is $(-y\, dx + x\, dy)/(x^2 + y^2)$ on the punctured plane, which integrates to $2\pi$ around the origin. The gap is measured by [de Rham cohomology](note:de-rham-cohomology). Defined on the [closed-and-exact page](06-differential-forms/03-closed-and-exact.md).

## Orientation

An **orientation** of an $n$-manifold is a nowhere-vanishing $n$-form, taken up to multiplication by a positive function. A chart is positively oriented when $dx^1 \wedge \cdots \wedge dx^n$ agrees with it. An orientation is what makes $\int_M \tens{\omega}$ of an $n$-form well-defined: the change-of-variables Jacobian then always has positive sign. The Möbius strip and Klein bottle admit none. Defined on the [integration page](07-integration/01-orientation-and-integration.md).

## Stokes's theorem

For an [oriented](note:orientation) $n$-manifold $M$ with boundary and a compactly supported $(n-1)$-form $\tens{\omega}$,
$$\int_M d\tens{\omega} = \int_{\partial M} \tens{\omega},$$
with $\partial M$ given the outward-normal-first orientation. It contains the fundamental theorem of calculus, Green's theorem, the classical Stokes theorem, and the divergence theorem. It also underlies integration by parts in every variational derivation. Defined on the [Stokes page](07-integration/03-stokes-theorem.md).

## De Rham cohomology

$H^k_{dR}(M) := \{\text{closed } k\text{-forms}\} / \{\text{exact } k\text{-forms}\}$, a real vector space and a topological invariant. Examples:

- $H^0 \cong \mathbb{R}^{\#\text{components}}$;
- $H^k(\mathbb{R}^n) = 0$ for $k \geq 1$;
- $S^n$ has $H^0 = H^n = \mathbb{R}$.

De Rham's theorem identifies it with [singular cohomology](note:singular-cohomology) with real coefficients. Defined on the [cohomology page](09-de-rham/01-cohomology.md).

## Configuration space

The **configuration space** $Q$ of a mechanical system is the manifold of its possible positions, with holonomic constraints already enforced. Examples:

- $N$ free particles in $\mathbb{R}^3$: $Q = \mathbb{R}^{3N}$;
- a pendulum: $Q = S^1$;
- a rigid body: $Q = \mathbb{R}^3 \times SO(3)$, six-dimensional.

States live in the [tangent bundle](note:tangent-space) $TQ$ (positions and velocities, Lagrangian mechanics) or the [cotangent bundle](note:cotangent-space) $T^*Q$ (positions and momenta, Hamiltonian mechanics). Defined on the [Newtonian-mechanics page](10-lagrangian-mechanics/01-newtonian-mechanics.md).

## Holonomic constraint

A constraint expressible as $f(q, t) = 0$ on configuration space. It restricts motion to a submanifold, which moves if $f$ depends on $t$. Examples: a rigid distance $\lvert \tens{r}_A - \tens{r}_B \rvert^2 - \ell^2 = 0$, a bead on a wire, a particle on a surface. A constraint that involves velocities and is not integrable to a position constraint is **nonholonomic**. A disk rolling without slipping is the standard example: it restricts $\dot q$ without reducing the dimension of $Q$. Treated on the [constraints page](10-lagrangian-mechanics/05-constraints-and-examples.md).

## Functional and variation

A **functional** maps a space of functions to $\mathbb{R}$. The action $S[q] = \int L\, dt$ is a functional on paths. The **variation** of $S$ at $q$ in the direction $\delta q$ is
$$\delta S := \frac{d}{d\epsilon} S[q + \epsilon\, \delta q] \Big|_{\epsilon = 0}.$$
Setting $\delta S = 0$ for all admissible $\delta q$ is "set the derivative to zero" on an infinite-dimensional space. For actions it produces the [Euler–Lagrange equations](note:euler-lagrange-equations).

## Euler-Lagrange equations

The stationarity conditions of $S = \int L(q, \dot q, t)\, dt$:
$$\frac{d}{dt}\frac{\partial L}{\partial \dot q^i} - \frac{\partial L}{\partial q^i} = 0.$$
The left side transforms as a covector under changes of coordinates, so the equations hold in every chart. For a natural Lagrangian $\tfrac12 g_{ij}\dot q^i \dot q^j - V$ they are $\nabla_{\dot q}\dot q = -\operatorname{grad} V$, Newton's law written covariantly ([chapter 10](10-lagrangian-mechanics/04-covariant-newton.md)). Derived on the [action page](10-lagrangian-mechanics/03-action-and-euler-lagrange.md).

## Legendre transform

The **Legendre transform** of a strictly convex function $f(x)$ is
$$f^*(p) := \sup_x \bigl( p \cdot x - f(x) \bigr) = p \cdot x(p) - f(x(p)), \qquad p = f'(x).$$
It is an involution, $(f^*)^* = f$. In mechanics the Hamiltonian is the Legendre transform of the Lagrangian in the velocities, $H = p_i \dot q^i - L$. The map $(q, \dot q) \mapsto (q, p)$ is the fiber derivative $TQ \to T^*Q$; for a natural Lagrangian it is the musical isomorphism $\flat$. Developed on the [Legendre page](11-hamiltonian-mechanics/01-legendre-and-hamiltons-equations.md).

## Cyclic coordinate

A coordinate $q^k$ is **cyclic** (or ignorable) if $\partial L / \partial q^k = 0$. Its Euler–Lagrange equation says the conjugate momentum $p_k = \partial L / \partial \dot q^k$ is conserved. This is [Noether's theorem](note:noethers-theorem) for the coordinate vector field $\tens{\xi} = \partial_k$.

## Hamilton's equations

$$\dot q^i = \frac{\partial H}{\partial p_i}, \qquad \dot p_i = -\frac{\partial H}{\partial q^i},$$
first-order equations on phase space $T^*Q$, equivalent to the Euler–Lagrange equations for regular $L$. Equivalently, solutions are the integral curves of the vector field $\tens{X}_H$ defined by $\iota_{\tens{X}_H}\tens{\omega} = -dH$ (see [symplectic form](note:symplectic-form)), and $\dot f = \{f, H\}$ for any function $f$. Derived on the [Legendre page](11-hamiltonian-mechanics/01-legendre-and-hamiltons-equations.md).

## Symplectic form

A **symplectic form** on a manifold is a closed, non-degenerate 2-form $\tens{\omega}$. Non-degenerate means $\tens{X} \mapsto \iota_{\tens{X}} \tens{\omega}$ is an isomorphism from vector fields to 1-forms, which forces even dimension. The canonical example is phase space $T^*Q$, with $\tens{\omega} = d\tens{\theta} = dp_i \wedge dq^i$, where $\tens{\theta} = p_i\, dq^i$ is the tautological 1-form. By Darboux's theorem every symplectic form looks like this locally. A function $H$ determines $\tens{X}_H$ by $\iota_{\tens{X}_H}\tens{\omega} = -dH$ (Arnold's sign; Abraham–Marsden use $dq \wedge dp$ and $+dH$). Hamiltonian flows preserve $\tens{\omega}$ and hence phase-space volume (Liouville). Developed on the [symplectic-form page](11-hamiltonian-mechanics/02-phase-space-and-symplectic-form.md).

## Poisson bracket

$$\{f, g\} = \frac{\partial f}{\partial q^i}\frac{\partial g}{\partial p_i} - \frac{\partial f}{\partial p_i}\frac{\partial g}{\partial q^i} = \tens{X}_g(f),$$
with $\{q^i, p_j\} = \delta^i_j$. It is antisymmetric, satisfies the Jacobi identity, and is a derivation in each slot. Time evolution is $\dot f = \{f, H\} + \partial_t f$, so $f$ is conserved iff $\{f, H\} = 0$. Canonical transformations are exactly the maps that preserve all brackets. Defined on the [symplectic-form page](11-hamiltonian-mechanics/02-phase-space-and-symplectic-form.md).

## Noether's theorem

If the flow of a vector field $\tens{\xi}$ on $Q$ leaves $L$ invariant (or changes it by $\tfrac{d}{dt}F$), then
$$J_\xi = p_i\, \xi^i - F$$
is conserved along solutions. On phase space this is $\{J_\xi, H\} = 0$: conserved quantities and symmetries determine each other. Examples:

- time translation gives energy;
- spatial translations give momentum;
- rotations give angular momentum;
- for natural systems and geodesics, a [Killing field](note:killing-vector) gives the charge $\xi_\mu \dot x^\mu$;
- for fields, the conserved current is $T^{\mu\nu}\xi_\nu$.

Stated on the [Noether page](12-symmetry-and-noether/01-noethers-theorem.md).

## Tensor field

A **tensor field** of type $(r, s)$ on a smooth manifold $M$ is a smooth section of the bundle whose fiber at $p \in M$ is
$$T_p M^{\otimes r} \otimes T^*_p M^{\otimes s}.$$
Equivalently, a $C^\infty(M)$-multilinear map taking $r$ smooth $1$-forms and $s$ smooth vector fields and returning a smooth real-valued function. Vector fields are $(1, 0)$-tensor fields; $1$-forms are $(0, 1)$-tensor fields; $k$-forms are alternating $(0, k)$-tensor fields; the metric is a symmetric $(0, 2)$-tensor field. The Lie derivative and (given a connection) the covariant derivative extend to tensor fields of every type.

## Einstein summation

The convention, due to Einstein and assumed tacitly wherever it is in force: a Greek (or Latin) index appearing exactly once *up* and exactly once *down* in the same monomial is summed over its range. So
$$v^\mu \omega_\mu := \sum_{\mu} v^\mu \omega_\mu, \qquad T^\mu{}_\nu\, S^\nu{}_\rho := \sum_{\nu} T^\mu{}_\nu\, S^\nu{}_\rho.$$

Two ramifications. First, repeated indices in the same vertical position ($v^\mu \omega^\mu$, $T_{\mu\mu}$) are almost always an error — there is no canonical pairing without a metric. Second, an index used as a dummy variable is *bound* and can be renamed: $v^\mu \omega_\mu = v^\nu \omega_\nu$. Be wary of dummy collisions when chaining contractions.

## Tensor transformation law

Under a change of coordinates $x^\mu \mapsto x'^{\mu'}(x)$, the components of an $(r, s)$-tensor transform as
$$T'^{\mu'_1 \cdots \mu'_r}{}_{\nu'_1 \cdots \nu'_s} = \frac{\partial x'^{\mu'_1}}{\partial x^{\mu_1}} \cdots \frac{\partial x'^{\mu'_r}}{\partial x^{\mu_r}}\; \frac{\partial x^{\nu_1}}{\partial x'^{\nu'_1}} \cdots \frac{\partial x^{\nu_s}}{\partial x'^{\nu'_s}}\; T^{\mu_1 \cdots \mu_r}{}_{\nu_1 \cdots \nu_s}$$
— one forward Jacobian factor per upper index, one inverse Jacobian factor per lower index. A component array obeying this rule on every chart overlap *is* a tensor; an array that picks up extra inhomogeneous terms (the Christoffel symbols are the standard example) is not. Stated and unpacked on the [coordinate-components page](02-tensors/02-coordinate-components.md).

## Contraction

Pairing one upper index of a tensor with one lower index and summing, which turns an $(r, s)$-tensor into an $(r-1, s-1)$-tensor: $T^{\cdots\lambda\cdots}{}_{\cdots\lambda\cdots}$. It needs no metric. Examples: the pairing $\omega_\mu v^\mu$; the trace $T^\mu{}_\mu$ of a $(1, 1)$-tensor; the Ricci tensor $R^\lambda{}_{\mu\lambda\nu}$. Contracting two lower indices requires the inverse metric (the *metric trace* $g^{\mu\nu} T_{\mu\nu}$). Defined on the [multilinear-maps page](02-tensors/01-multilinear-and-rank.md).

## Metric

A smooth symmetric non-degenerate $(0, 2)$-[tensor field](note:tensor-field) $\tens{g} = g_{\mu\nu}\, dx^\mu \otimes dx^\nu$, with inverse $g^{\mu\nu}$ ($g^{\mu\rho} g_{\rho\nu} = \delta^\mu_\nu$). Its **signature** is the numbers of positive and negative eigenvalues:

- **Riemannian:** all positive; lengths and angles are defined.
- **Lorentzian:** $(-, +, +, +)$ in this book; it adds the timelike / null / spacelike classification.

It supplies the [musical isomorphisms](note:musical-isomorphism), the [volume form](note:volume-form), and the [Levi-Civita connection](note:levi-civita). Defined on the [metric-tensor page](03-metric/01-the-metric-tensor.md).

## Running example

The unit sphere
$$S^2 = \{ (X, Y, Z) \in \mathbb{R}^3 : X^2 + Y^2 + Z^2 = 1 \}$$
is the running example carried through Parts III–V of this book: charts, metric, curvature, and the mechanics of a particle and a pendulum on it. Two reasons it works:

- **Small enough to compute on by hand.** Two coordinates, one round metric, four-line Christoffel calculation, single Riemann component.
- **Big enough to break intuition.** Non-zero constant curvature; no global flat chart; non-trivial topology ([Euler characteristic](note:euler-characteristic) $2$); $SO(3)$ symmetry; closed orientable.

The drawback — $S^2$ is two-dimensional Riemannian, not four-dimensional Lorentzian — means it doesn't model spacetime. But every tensor construction in the book is dimension- and signature-agnostic, so the formulas exercised on $S^2$ are the ones used on spacetime.

## Wedge convention

This book writes a $k$-form in the **$1/k!$ convention**:
$$\tens{\omega} = \frac{1}{k!}\, \omega_{\mu_1 \cdots \mu_k}\, dx^{\mu_1} \wedge \cdots \wedge dx^{\mu_k},$$
with $\omega_{\mu_1 \cdots \mu_k}$ totally antisymmetric and the sum over all index tuples. The common alternative — the **strictly-increasing-index convention** —
$$\tens{\omega} = \sum_{\mu_1 < \cdots < \mu_k} \omega_{\mu_1 \cdots \mu_k}\, dx^{\mu_1} \wedge \cdots \wedge dx^{\mu_k}$$
carries no combinatorial prefactor and sums only over ordered tuples. The two give the *same* component array on ordered tuples (e.g. $\omega_{\theta\varphi} = \sin\theta$ for the sphere's area form either way); they differ only in whether the basis is reduced to ordered tuples or the components are antisymmetrized and divided by $k!$. Watch for the factor when comparing formulas across textbooks.

## Levi-Civita

Three related but distinct objects share the name.

**Levi-Civita symbol.** The totally antisymmetric *symbol* $\varepsilon_{\mu_1 \cdots \mu_n}$ — not a tensor — defined by $\varepsilon_{1 \cdots n} = 1$ and antisymmetry under any pair swap. Coordinate-dependent: it transforms like a [tensor density](note:tensor-density) of weight $+1$. Used in the explicit formula for the Hodge star.

**Levi-Civita tensor.** The honest tensor $\epsilon_{\mu_1 \cdots \mu_n} := \sqrt{|\det g|}\, \varepsilon_{\mu_1 \cdots \mu_n}$. The factor of $\sqrt{|\det g|}$ converts the density into a tensor; this is the canonical [volume form](note:volume-form) $\mathrm{vol}_g$.

**Levi-Civita connection.** The unique torsion-free metric-compatible connection of a pseudo-Riemannian manifold $(M, \tens{g})$ — the connection assumed throughout standard GR. Its Christoffel symbols are
$$\Gamma^\rho{}_{\mu\nu} = \tfrac{1}{2}\, g^{\rho\sigma} \left( \partial_\mu g_{\nu\sigma} + \partial_\nu g_{\sigma\mu} - \partial_\sigma g_{\mu\nu} \right),$$
derived on the [covariant-derivative page](08-connection-and-curvature/02-covariant-derivative.md).

Three different objects, one Italian mathematician. Context picks which is meant.

## Tensor density

A **tensor density of weight $w$** is a component array that transforms by the [tensor law](note:tensor-transformation-law) times an extra factor $\bigl[\det(\partial x'/\partial x)\bigr]^w$ of the Jacobian determinant. Weight $0$ is an ordinary tensor. The [Levi-Civita](note:levi-civita) symbol (lower indices) has weight $+1$; $\sqrt{|\det g|}$ is a scalar density of weight $-1$; their product is an honest tensor — the general pattern, since multiplying by the appropriate power of $\sqrt{|\det g|}$ converts any density to a tensor. Densities appear wherever determinants do: volume elements, integrands, and the $\sqrt{|\det g|}$ factors of the variational formulas in chapter 15. (Sign conventions for $w$ vary across textbooks — some count powers of $\det(\partial x/\partial x')$ instead.)

## Volume form

On an oriented pseudo-Riemannian manifold, the canonical top-degree form
$$\mathrm{vol}_g = \sqrt{|\det g|}\; dx^1 \wedge \cdots \wedge dx^n$$
in any positively-oriented chart — chart-independent, because the Jacobian factors from $\det g$ and from the wedge cancel. It integrates scalars: $\int_M f\, \mathrm{vol}_g$ is well-defined for compactly supported $f$. As a tensor it is the [Levi-Civita](note:levi-civita) tensor. On the unit sphere, $\mathrm{vol}_g = \sin\theta\, d\theta \wedge d\varphi$, total area $4\pi$. Constructed on the [raising-and-lowering page](03-metric/02-raising-and-lowering.md).

## Affine connection

An $\mathbb{R}$-bilinear $\nabla: (\tens{X}, \tens{Y}) \mapsto \nabla_{\tens{X}} \tens{Y}$ that is $C^\infty(M)$-linear in $\tens{X}$ and Leibniz in $\tens{Y}$: $\nabla_{\tens{X}}(f\tens{Y}) = \tens{X}(f)\, \tens{Y} + f\, \nabla_{\tens{X}} \tens{Y}$. It is the extra structure needed to compare tangent vectors at different points. Its coefficients in a chart, $\nabla_{\partial_\mu} \partial_\nu = \Gamma^\rho{}_{\mu\nu}\, \partial_\rho$ (the **Christoffel symbols**), are *not* a tensor: their transformation law has an inhomogeneous second-derivative term. The difference of two connections *is* a $(1, 2)$-tensor. Defined on the [affine-connection page](08-connection-and-curvature/01-the-connection.md).

## Covariant derivative

The derivative operator $\nabla$ of a connection, extended to all tensor fields: in components, one Christoffel correction per index,
$$\nabla_\mu v^\nu = \partial_\mu v^\nu + \Gamma^\nu{}_{\mu\rho}\, v^\rho, \qquad \nabla_\mu \omega_\nu = \partial_\mu \omega_\nu - \Gamma^\rho{}_{\mu\nu}\, \omega_\rho,$$
with $+\Gamma$ for every upper index and $-\Gamma$ for every lower one, and $\nabla_\mu f = \partial_\mu f$ on scalars. Unlike the bare partial derivative, $\nabla \tens{T}$ is a genuine tensor. For the [Levi-Civita](note:levi-civita) connection of a metric $\tens{g}$, the Christoffel symbols come from the **Christoffel formula**
$$\Gamma^\rho{}_{\mu\nu} = \tfrac{1}{2}\, g^{\rho\sigma} \left( \partial_\mu g_{\nu\sigma} + \partial_\nu g_{\sigma\mu} - \partial_\sigma g_{\mu\nu} \right),$$
and $\nabla \tens{g} = 0$. Developed in full on the [covariant-derivative page](08-connection-and-curvature/02-covariant-derivative.md).

## Parallel transport

A vector field $\tens{V}(t)$ along a curve $\gamma$ is **parallel-transported** if $\nabla_{\dot\gamma} \tens{V} = 0$ — a linear ODE whose solutions define an isomorphism $P_\gamma: T_{\gamma(t_0)} M \to T_{\gamma(t_1)} M$ between tangent spaces along the curve. For a metric-compatible connection it preserves inner products. The transport depends on the *path*, not just the endpoints: carried around a small parallelogram with sides $\varepsilon \tens{u}, \varepsilon \tens{v}$ ($\tens{u}$ first), a vector $\tens{Z}$ returns changed by $-\varepsilon^2 \tens{R}(\tens{u}, \tens{v})\, \tens{Z}$ to leading order — that failure *is* the Riemann curvature. Defined on the [covariant-derivative page](08-connection-and-curvature/02-covariant-derivative.md).

## Geodesic

A curve whose velocity is [parallel-transported](note:parallel-transport) along itself:
$$\nabla_{\dot\gamma} \dot\gamma = 0, \qquad \text{in coordinates} \quad \ddot\gamma^\rho + \Gamma^\rho{}_{\mu\nu}\, \dot\gamma^\mu \dot\gamma^\nu = 0.$$
For the Levi-Civita connection they are the critical curves of length: great circles on the sphere, straight lines in flat space. In GR, timelike geodesics are the worldlines of free-falling massive particles and null geodesics the worldlines of light. Along any geodesic, each [Killing vector](note:killing-vector) $\tens{\xi}$ gives a conserved quantity $\xi_\mu \dot\gamma^\mu$. Developed on the [covariant-derivative page](08-connection-and-curvature/02-covariant-derivative.md).

## Riemann index convention

This book (following Misner–Thorne–Wheeler and Carroll) writes
$$R^\rho{}_{\sigma\mu\nu} = \partial_\mu \Gamma^\rho{}_{\nu\sigma} - \partial_\nu \Gamma^\rho{}_{\mu\sigma} + \Gamma^\rho{}_{\mu\lambda}\, \Gamma^\lambda{}_{\nu\sigma} - \Gamma^\rho{}_{\nu\lambda}\, \Gamma^\lambda{}_{\mu\sigma},$$
matching $\tens{R}(\tens{X}, \tens{Y}) \tens{Z} := \nabla_{\tens{X}} \nabla_{\tens{Y}} \tens{Z} - \nabla_{\tens{Y}} \nabla_{\tens{X}} \tens{Z} - \nabla_{[\tens{X}, \tens{Y}]} \tens{Z}$: the output index $\rho$ first, then the index $\sigma$ of the vector being transported, then the two antisymmetrized loop directions $\mu, \nu$. Mnemonic: [parallel transport](note:parallel-transport) of $\tens{Z}$ around the small loop with sides $\varepsilon \tens{u}, \varepsilon \tens{v}$ ($\tens{u}$ first) changes it by $-\varepsilon^2 \tens{R}(\tens{u}, \tens{v})\, \tens{Z}$. Other texts permute slots or flip the overall sign — check conventions before comparing formulas.

## Torsion

The $(1, 2)$-tensor $\Tor(\tens{X}, \tens{Y}) = \nabla_{\tens{X}} \tens{Y} - \nabla_{\tens{Y}} \tens{X} - [\tens{X}, \tens{Y}]$ of a [connection](note:affine-connection). In components, $T^\rho{}_{\mu\nu} = \Gamma^\rho{}_{\mu\nu} - \Gamma^\rho{}_{\nu\mu}$. A torsion-free connection has Christoffel symbols symmetric in the lower pair; the [Levi-Civita connection](note:levi-civita) is torsion-free by definition. Torsion is allowed, and sourced by spin, in Einstein–Cartan gravity. Defined on the [torsion-and-curvature page](08-connection-and-curvature/04-torsion-and-curvature.md).

## Riemann tensor

The $(1, 3)$-tensor $\tens{R}(\tens{X}, \tens{Y}) \tens{Z} = \nabla_{\tens{X}} \nabla_{\tens{Y}} \tens{Z} - \nabla_{\tens{Y}} \nabla_{\tens{X}} \tens{Z} - \nabla_{[\tens{X}, \tens{Y}]} \tens{Z}$, with components $R^\rho{}_{\sigma\mu\nu}$ in the book's [index convention](note:riemann-index-convention). It measures the failure of [parallel transport](note:parallel-transport) around a small loop to return a vector to itself. For the Levi-Civita connection the lowered tensor $R_{\rho\sigma\mu\nu}$ has these symmetries:

- antisymmetric in each pair;
- symmetric under exchange of the pairs;
- satisfies the first Bianchi identity.

That leaves $n^2(n^2 - 1)/12$ independent components, 20 in four dimensions. Defined on the [torsion-and-curvature page](08-connection-and-curvature/04-torsion-and-curvature.md).

## Ricci and Einstein tensors

Contractions of the [Riemann tensor](note:riemann-tensor):

- the **Ricci tensor** $R_{\mu\nu} = R^\lambda{}_{\mu\lambda\nu}$, symmetric for Levi-Civita;
- the **scalar curvature** $R = g^{\mu\nu} R_{\mu\nu}$;
- the **Einstein tensor** $G_{\mu\nu} = R_{\mu\nu} - \tfrac{1}{2} R\, g_{\mu\nu}$.

The contracted Bianchi identity makes $G$ divergence-free, $\nabla^\mu G_{\mu\nu} = 0$, which is why it sits on the left of the [Einstein equations](note:einstein-equations). Ricci measures volume focusing of geodesics; the trace-free remainder of Riemann is the Weyl tensor. Defined on the [torsion-and-curvature page](08-connection-and-curvature/04-torsion-and-curvature.md).

## Sectional curvature

For a 2-plane spanned by $\tens{u}, \tens{v}$,
$$K(\tens{u}, \tens{v}) = \frac{\tens{g}(\tens{R}(\tens{u}, \tens{v})\, \tens{v},\; \tens{u})}{\tens{g}(\tens{u}, \tens{u})\, \tens{g}(\tens{v}, \tens{v}) - \tens{g}(\tens{u}, \tens{v})^2}.$$
It depends only on the plane. In two dimensions it is the **Gaussian curvature**, $1/a^2$ for a sphere of radius $a$. Its integral over a closed orientable surface is $2\pi\chi$ (Gauss–Bonnet; see [Euler characteristic](note:euler-characteristic)). Defined on the [torsion-and-curvature page](08-connection-and-curvature/04-torsion-and-curvature.md).

## Geodesic deviation

For a family of [geodesics](note:geodesic) with tangent $\tens{u}$ and deviation (Jacobi) field $\tens{S}$, the **Jacobi equation** is
$$\nabla_{\tens{u}} \nabla_{\tens{u}} \tens{S} = \tens{R}(\tens{u}, \tens{S})\, \tens{u}.$$
It gives the relative acceleration of neighbouring free-falling particles, i.e. tidal force, so the [Riemann tensor](note:riemann-tensor) is the measurable gravitational field. Positive curvature focuses geodesics (meridians on $S^2$ reconverge). Derived on the [geodesic-deviation page](08-connection-and-curvature/05-geodesic-deviation.md).

## Isometry

A diffeomorphism $F: M \to M$ with $F^* \tens{g} = \tens{g}$ — it preserves every length and angle the metric defines. The isometries of $(M, \tens{g})$ form a [Lie group](note:lie-group): $O(3)$ for the round sphere, the Poincaré group for [Minkowski space](note:minkowski-space). Continuous one-parameter families of isometries are the [flows](note:flow) of [Killing vector fields](note:killing-vector). Defined on the [Killing-vectors page](08-connection-and-curvature/03-killing-vectors.md).

## Killing vector

A vector field $\tens{\xi} \in \mathfrak{X}(M)$ on a pseudo-Riemannian manifold $(M, \tens{g})$ is a **Killing vector field** if its [flow](note:flow) preserves the metric, i.e. if the [Lie derivative](note:lie-derivative)
$$\Lie_{\tens{\xi}} \tens{g} = 0.$$
In components,
$$\nabla_\mu \xi_\nu + \nabla_\nu \xi_\mu = 0$$
(the **Killing equation**, equivalent to $\Lie_{\tens{\xi}} \tens{g} = 0$ for the Levi-Civita connection).

Killing fields are the infinitesimal generators of [isometries](note:isometry): their flows are one-parameter families of isometries of $(M, \tens{g})$. Along a [geodesic](note:geodesic) $\gamma$, $\xi_\mu \dot\gamma^\mu$ is conserved — every Killing vector gives a conserved quantity for free-fall motion. The [Killing-vectors page](08-connection-and-curvature/03-killing-vectors.md) develops the isometry picture, the sphere's three fields, the Noether connection, and the Schwarzschild $E$ and $L$.

## Proper time

Along a timelike curve $\gamma$ in a Lorentzian manifold with signature $(-, +, +, +)$, the **proper time** is
$$\tau = \int \sqrt{-\, g_{\mu\nu}\, \dot\gamma^\mu \dot\gamma^\nu}\; d\lambda$$
— the timelike length of the curve, and physically the elapsed time read by a clock carried along it. Reparametrization-invariant. Between fixed events, free fall ([timelike geodesics](note:geodesic)) locally *maximizes* proper time — the twin who accelerates ages less. Introduced with curve length on [the metric-tensor page](03-metric/01-the-metric-tensor.md).

## Minkowski space

The spacetime of special relativity: $\mathbb{R}^4$ with the global flat Lorentzian metric
$$\tens{\eta} = -dt^2 + dx^2 + dy^2 + dz^2$$
(signature $(-, +, +, +)$). All Christoffel symbols vanish in these coordinates, so [geodesics](note:geodesic) are straight lines and the Riemann tensor is zero — the "no gravity" special case that curved solutions approach asymptotically (Schwarzschild as $r \to \infty$). Its [isometry](note:isometry) group is the **Poincaré group**: translations plus Lorentz transformations. Every tangent space of a Lorentzian manifold is a copy of Minkowski space in miniature ([causal structure](03-metric/01-the-metric-tensor.md)).

## Stress-energy tensor

The symmetric $(0, 2)$-tensor $T_{\mu\nu}$ of matter and non-gravitational fields. Its components give energy density ($T_{00}$), momentum density, and stress. For a perfect fluid, $T_{\mu\nu} = (\rho + p)\, u_\mu u_\nu + p\, g_{\mu\nu}$. Field-theoretically it is the response of the matter action to a change of metric, $T_{\mu\nu} = -\tfrac{2}{\sqrt{|\det g|}}\, \delta(\sqrt{|\det g|}\, \mathcal{L}_{\mathrm{matter}}) / \delta g^{\mu\nu}$. Local conservation is $\nabla^\mu T_{\mu\nu} = 0$. Defined on the [stress–energy page](14-fields-and-stress-energy/02-stress-energy-tensor.md).

## Einstein equations

$$G_{\mu\nu} + \Lambda\, g_{\mu\nu} = 8\pi G\, T_{\mu\nu}$$
This sets the [Einstein tensor](note:ricci-and-einstein-tensors) of the metric equal to the [stress-energy](note:stress-energy-tensor) of matter, with cosmological constant $\Lambda$ (units $c = 1$). In vacuum with $\Lambda = 0$ they reduce to $R_{\mu\nu} = 0$. The left side is forced by [Lovelock's theorem](note:lovelocks-theorem), and the equations follow from the Einstein–Hilbert action $\int (R - 2\Lambda)\, \mathrm{vol}_g$. Defined on the [Einstein-equations page](15-general-relativity/01-einstein-equations.md).

## Lovelock's theorem

In four dimensions, every symmetric $(0, 2)$-tensor that is (i) built from the metric and at most its first and second derivatives and (ii) divergence-free is a linear combination
$$a\, G_{\mu\nu} + b\, g_{\mu\nu}$$
of the Einstein tensor and the metric. So the left-hand side of the Einstein equations — including the cosmological-constant term — is forced, not chosen, once a tensorial second-order theory of the metric is demanded. In dimension $n > 4$, additional "Lovelock terms" (Gauss–Bonnet and higher) become available, which is one reason higher-dimensional gravity theories are less rigid than $4$D GR.

## Cartan formalism

The **tetrad** (or **vielbein**) formulation of gravity. Replace the coordinate basis with an orthonormal coframe: $n$ one-forms $e^a$ with
$$\tens{g} = \eta_{ab}\; e^a \otimes e^b,$$
where $\tens{\eta}$ is the flat metric of the appropriate signature ("tetrad" when $n = 4$). The connection becomes the **spin connection** $\omega^a{}_b$, a matrix of one-forms, and torsion and curvature become the two-forms of the **Cartan structure equations**
$$T^a = de^a + \omega^a{}_b \wedge e^b, \qquad R^a{}_b = d\omega^a{}_b + \omega^a{}_c \wedge \omega^c{}_b.$$
The payoff: [spinor](note:spinor) fields on curved spacetime become definable (spinors transform under local frame rotations, which the coordinate-basis formalism has no handle on), and the [Einstein–Cartan](15-general-relativity/03-einstein-cartan.md) action becomes a polynomial in differential forms. Misner–Thorne–Wheeler (chapter 13) and Nakahara develop the formalism in full.

## Spinor

A field that transforms under the **Spin group** — the double cover of the rotation group $SO(n)$ (or, in Lorentzian signature, of the Lorentz group) — rather than under the group itself. The double-cover subtlety is physical: a spinor changes sign under a $2\pi$ rotation and returns to itself only after $4\pi$. Electrons, quarks, and all Standard-Model fermions are described by (Dirac) spinors. Spin representations do not extend to $GL_n$, so spinors cannot be defined from a coordinate basis alone — curved-spacetime spinors need an orthonormal frame and spin connection (the [Cartan formalism](note:cartan-formalism)). Their intrinsic angular momentum is the **spin density** that sources torsion in [Einstein–Cartan](15-general-relativity/03-einstein-cartan.md) gravity.

## Cochain complex

A **cochain complex** is a sequence of abelian groups (or vector spaces) and linear maps
$$\cdots \to C^{k-1} \xrightarrow{d^{k-1}} C^k \xrightarrow{d^k} C^{k+1} \to \cdots$$
with $d^k \circ d^{k-1} = 0$ for every $k$. The kernel of each $d^k$ ("cocycles") contains the image of the previous $d^{k-1}$ ("coboundaries"), and the quotient $\ker(d^k) / \mathrm{im}(d^{k-1})$ is the $k$-th *cohomology* of the complex. The complex $\Omega^0 \to \Omega^1 \to \Omega^2 \to \cdots$ with [exterior derivative](06-differential-forms/02-exterior-derivative-and-pullback.md) as $d$ is the **de Rham complex**.

A **chain complex** is the same structure with the maps *lowering* degree ($\partial_k: C_k \to C_{k-1}$, $\partial^2 = 0$); its quotients are *homology*. Dualizing a chain complex — $C^k := \mathrm{Hom}(C_k, A)$ with $d := \partial^*$ — produces a cochain complex, which is exactly how [singular cohomology](note:singular-cohomology) arises from the singular chain complex.

## Singular cohomology

**Singular cohomology** $H^k(X; A)$ of a topological space $X$ with coefficients in an abelian group $A$ is built from the dual of the singular [chain complex](note:cochain-complex). A *singular $k$-simplex* in $X$ is a continuous map $\Delta^k \to X$; the free abelian group on these forms $C_k(X)$, with the boundary map $\partial_k: C_k \to C_{k-1}$. Then $C^k(X; A) := \mathrm{Hom}(C_k(X), A)$ and $d := \partial^*$. Cohomology depends only on the homotopy type of $X$, and for a smooth manifold $X$, $H^k(X; \mathbb{R})$ agrees with de Rham cohomology (de Rham's theorem).

## Contractible

Two smooth maps $F, G: M \to N$ are **(smoothly) homotopic**, written $F \simeq G$, if one can be deformed into the other: there is a smooth $H: M \times [0, 1] \to N$ with $H(\cdot, 0) = F$ and $H(\cdot, 1) = G$. A manifold $M$ is **contractible** if its identity map is homotopic to a constant map — $M$ can be continuously shrunk to a point. Convex and [star-shaped](note:star-shaped) subsets of $\mathbb{R}^n$ are contractible; $\mathbb{R}^n$ is, but $\mathbb{R}^n \setminus \{0\}$ and the sphere are not.

De Rham cohomology is a **homotopy invariant**: homotopic maps induce the same map on cohomology, so a contractible manifold has the cohomology of a point (all reduced groups vanish — the Poincaré lemma).

## Euler characteristic

The alternating sum of the dimensions of a space's cohomology groups (its Betti numbers):
$$\chi(M) := \sum_k (-1)^k \dim H^k(M; \mathbb{R})$$
— equivalently $V - E + F$ (and its higher-dimensional analogue) for any triangulation. A homotopy invariant. Values worth memorizing: $\chi(S^2) = 2$; $\chi(T^n) = 0$; $\chi = 0$ for every odd-dimensional closed manifold; a genus-$g$ surface has $\chi = 2 - 2g$. Two roles in this book: Gauss–Bonnet, $\int_M K\, \mathrm{vol}_g = 2\pi \chi(M)$, ties curvature to topology; and the Poincaré–Hopf theorem with Hopf's converse — a closed connected manifold admits a nowhere-vanishing vector field iff $\chi = 0$ — is why the sphere admits no Lorentzian metric but the torus does.

## Star-shaped

An open set $U \subseteq \mathbb{R}^n$ is **star-shaped about $p \in U$** if for every $q \in U$, the line segment $\{(1-t)p + tq : t \in [0, 1]\}$ from $p$ to $q$ lies entirely in $U$. Convex sets are star-shaped about any of their points. Star-shaped sets are contractible — the homotopy $H(q, t) = (1-t)q + tp$ retracts $U$ to $p$ — and this contraction is the ingredient that makes the cone-operator proof of the Poincaré lemma work.

## Sheaf

A **sheaf** of abelian groups on a topological space $X$ assigns to every open $U \subseteq X$ an abelian group $\mathcal{F}(U)$ ("sections over $U$") and to every inclusion $V \subseteq U$ a restriction map $\mathcal{F}(U) \to \mathcal{F}(V)$, subject to a **gluing axiom**: local sections that agree on overlaps glue uniquely to a section on the union.

The **constant sheaf** $\underline{A}$ assigns $A$ (with the discrete topology) to each connected open set. The sheaf $C^\infty_M$ assigns $C^\infty(U)$ to each $U$. **Sheaf cohomology** $H^k(X; \mathcal{F})$ generalizes singular cohomology. It can be computed from any **acyclic resolution** — an exact sequence $0 \to \mathcal{F} \to \mathcal{A}^0 \to \mathcal{A}^1 \to \cdots$ of sheaves with no higher cohomology — as the cohomology of the complex of global sections. The de Rham complex is such a resolution of $\underline{\mathbb{R}}$ on $M$, which is the abstract reason de Rham cohomology computes $H^*(M; \mathbb{R})$.

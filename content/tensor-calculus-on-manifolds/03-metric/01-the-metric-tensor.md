---
title: The metric tensor
---

A **metric** on $M$ is a smooth $(0, 2)$-[tensor field](note:tensor-field) $\tens{g}$ that is, at every point $p$:

- **symmetric:** $\tens{g}(\tens{v}, \tens{w}) = \tens{g}(\tens{w}, \tens{v})$ for all $\tens{v}, \tens{w} \in T_p M$;
- **non-degenerate:** if $\tens{g}(\tens{v}, \tens{w}) = 0$ for every $\tens{w}$, then $\tens{v} = 0$.

In components $\tens{g} = g_{\mu\nu}\, dx^\mu \otimes dx^\nu$, with $g_{\mu\nu} = g_{\nu\mu}$ and $[g_{\mu\nu}]$ invertible at every point. The entries of the inverse matrix are written $g^{\mu\nu}$, so $g^{\mu\rho} g_{\rho\nu} = \delta^\mu_\nu$. The inverse is itself a tensor field, of type $(2, 0)$. A manifold with a metric is written $(M, \tens{g})$.

At a single point, $\tens{g}_p$ is a non-degenerate symmetric bilinear form on one vector space, $T_p M$. Everything on this page except curve length, pullback and existence is linear algebra at that one point.

## Signature

By Sylvester's law of inertia, $T_p M$ has a basis in which $[g_{\mu\nu}]$ is diagonal with entries $\pm 1$. The number of each sign, the **signature** $(n_+, n_-)$ with $n_+ + n_- = n$, does not depend on the basis. Non-degeneracy keeps eigenvalues from crossing zero, so the signature is constant on a connected manifold. Three cases come up:

- **Riemannian**, signature $(n, 0)$: $\tens{g}$ is positive-definite, an ordinary inner product on each tangent space.
- **Lorentzian**, one negative sign. This book uses $(-, +, +, +)$, as do MTW, Wald and Carroll; Landau–Lifshitz and particle physics use $(+, -, -, -)$.
- **Pseudo-Riemannian**: any signature, covering both.

## Causal structure

A Lorentzian metric sorts the tangent vectors at each point into three classes:

- **timelike** if $\tens{g}(\tens{v}, \tens{v}) < 0$: inside the lightcone;
- **null** (lightlike) if $\tens{g}(\tens{v}, \tens{v}) = 0$, $\tens{v} \neq 0$: on the lightcone;
- **spacelike** if $\tens{g}(\tens{v}, \tens{v}) > 0$: outside it.

The null vectors form a double cone, the **lightcone**. A **time orientation** is a continuous choice of the future half of the lightcone at each point. Lorentzian manifolds that admit one are **time-orientable**; not all do.

In relativity, $T_p M$ with a Lorentzian $\tens{g}_p$ is the local inertial frame at the event $p$. Four-velocities of massive particles are timelike and light rays are null. Everything special relativity says about one observer at one event is linear algebra in this tangent space. Gravity enters only through the variation of $\tens{g}_p$ with $p$, which the [connection and curvature](../08-connection-and-curvature/index.md) measure.

## Lengths and angles

For $\tens{v}, \tens{w} \in T_p M$,
$$\tens{g}(\tens{v}, \tens{w}) = g_{\mu\nu}\, v^\mu w^\nu, \qquad |\tens{v}|^2 := \tens{g}(\tens{v}, \tens{v}).$$
In the Riemannian case $|\tens{v}| \ge 0$ is a length, and the angle between non-zero vectors is given by $\cos\angle(\tens{v}, \tens{w}) = \tens{g}(\tens{v}, \tens{w}) / (|\tens{v}|\, |\tens{w}|)$. In the Lorentzian case there is no useful angle involving null vectors.

The **length** of a curve $\gamma: [a, b] \to M$ is
$$\operatorname{len}(\gamma) := \int_a^b \sqrt{|g_{\mu\nu}\, \dot\gamma^\mu \dot\gamma^\nu|}\; dt.$$
It does not depend on the parametrization. The absolute value is for the Lorentzian case: spacelike and timelike curves have positive length, and the length of a timelike curve is its [proper time](note:proper-time). Null curves have length zero.

## Pullback and induced metrics

For a smooth $F: N \to M$, the [pullback](note:pullback) $F^* \tens{g}$ is a *candidate* metric on $N$:
$$(F^* \tens{g})_p(\tens{v}, \tens{w}) := \tens{g}_{F(p)}(dF_p \cdot \tens{v}, dF_p \cdot \tens{w}).$$
It is always symmetric but need not be non-degenerate. For that, $F$ must be an [immersion](note:immersion) ($dF_p$ injective at every $p$). When $\tens{g}$ is Riemannian this condition is also sufficient. This is how a submanifold gets its **induced metric**: $S^2 \subseteq \mathbb{R}^3$ inherits one by pulling back the Euclidean inner product through the inclusion ([chapter 4](../04-coordinate-systems/06-the-round-metric.md)). In indefinite signature an immersion is not enough: a null hyperplane in [Minkowski space](note:minkowski-space) is embedded, but the pulled-back metric on it is degenerate.

An **isometry** is a diffeomorphism $F: M \to M$ with $F^* \tens{g} = \tens{g}$. Its infinitesimal version, the Killing field, is defined in [chapter 8](../08-connection-and-curvature/03-killing-vectors.md).

## Existence

Every manifold admits a Riemannian metric: glue local Euclidean metrics with a [partition of unity](note:partition-of-unity). Lorentzian metrics are more restrictive. A closed (compact, boundaryless) manifold admits one iff it has a nowhere-vanishing vector field, equivalently iff its [Euler characteristic](note:euler-characteristic) vanishes. Among closed surfaces only the torus and the Klein bottle qualify; $S^2$, with $\chi = 2$, does not. GR is set on non-compact spacetimes for a causal reason: every compact Lorentzian manifold contains a closed timelike curve.

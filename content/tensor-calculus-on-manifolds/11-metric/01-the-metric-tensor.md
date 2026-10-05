---
title: The metric tensor
---

A **metric** on $M$ is a smooth $(0, 2)$-tensor field $\tens{g}$ that is **symmetric** and **non-degenerate** at every point:

- *Symmetry.* $\tens{g}(\tens{v}, \tens{w}) = \tens{g}(\tens{w}, \tens{v})$ for all $\tens{v}, \tens{w} \in T_p M$.
- *Non-degeneracy.* If $\tens{g}(\tens{v}, \tens{w}) = 0$ for every $\tens{w}$, then $\tens{v} = 0$.

In components $\tens{g} = g_{\mu\nu}\, dx^\mu \otimes dx^\nu$ with $g_{\mu\nu} = g_{\nu\mu}$, and the matrix $[g_{\mu\nu}]$ is invertible at every point. We write $g^{\mu\nu}$ for the entries of the inverse matrix, so $g^{\mu\rho} g_{\rho\nu} = \delta^\mu_\nu$. The inverse is itself a tensor field, of type $(2, 0)$.

## Signature

Up to choice of basis, $\tens{g}_p$ is classified by its **signature** $(n_+, n_-)$, $n_+ + n_- = n$: the numbers of positive and negative eigenvalues. The pointwise linear algebra (Sylvester's law, the lightcone at one event) is previewed in the [Part I aside](../01-manifolds/04-metric-at-a-point.md). Three cases come up:

- **Riemannian:** signature $(n, 0)$, i.e. $\tens{g}$ is positive-definite. $\tens{g}(\tens{v}, \tens{v}) > 0$ for $\tens{v} \neq 0$. Every $\tens{v}$ has a positive length $\sqrt{\tens{g}(\tens{v}, \tens{v})}$.
- **Lorentzian:** signature $(1, n-1)$ or $(n-1, 1)$ depending on convention; one direction is timelike and the rest spacelike. This book uses $(-, +, +, +)$, so timelike vectors have $\tens{g}(\tens{v}, \tens{v}) < 0$; Landau–Lifshitz and particle physics use $(+, -, -, -)$.
- **Pseudo-Riemannian:** any non-degenerate signature, generalizing both above.

Non-degeneracy keeps eigenvalues from crossing zero, so the signature is constant on a connected manifold. A Lorentzian metric distinguishes three classes of tangent vector at each point:

- **Timelike** if $\tens{g}(\tens{v}, \tens{v}) < 0$ (in mostly-plus convention) — inside the lightcone (future or past).
- **Null** (or *lightlike*) if $\tens{g}(\tens{v}, \tens{v}) = 0$ — on the lightcone.
- **Spacelike** if $\tens{g}(\tens{v}, \tens{v}) > 0$ — outside the lightcone.

Physics also needs a **time orientation**: a continuous choice of the "future" half of the lightcone at each point. Lorentzian manifolds that admit one are **time-orientable**; not all do.

## Inner product on $T_p M$

A metric gives the tangent space an **inner product** (Riemannian) or **scalar product** (Lorentzian). For $\tens{v}, \tens{w} \in T_p M$ with components $v^\mu, w^\mu$,
$$\tens{g}(\tens{v}, \tens{w}) = g_{\mu\nu}\, v^\mu w^\nu.$$
Length squared: $|\tens{v}|^2 := \tens{g}(\tens{v}, \tens{v})$. Length of a curve $\gamma: [a, b] \to M$:
$$\operatorname{len}(\gamma) := \int_a^b \sqrt{|g_{\mu\nu}\, \dot\gamma^\mu \dot\gamma^\nu|}\, dt.$$
The absolute value is needed in the Lorentzian case; spacelike and timelike curves have positive lengths under this definition, with the timelike length being [**proper time**](note:proper-time) along the curve. Null curves have zero length.

In the Riemannian case, the angle between $\tens{v}$ and $\tens{w}$ is given by $\cos\angle(\tens{v}, \tens{w}) = \tens{g}(\tens{v}, \tens{w}) / (|\tens{v}|\, |\tens{w}|)$. In the Lorentzian case there is no useful angle involving null vectors.

## Pullback of a metric

Given a smooth $F: N \to M$ and a metric $\tens{g}$ on $M$, the [pullback](note:pullback) $F^* \tens{g}$ is a *candidate* metric on $N$:
$$(F^* \tens{g})_p(\tens{v}, \tens{w}) := \tens{g}_{F(p)}(dF_p \cdot \tens{v}, dF_p \cdot \tens{w}).$$
It is always symmetric, but need not be non-degenerate. Injectivity of $dF_p$ at every $p$ — $F$ an [immersion](note:immersion) — is necessary, and when $\tens{g}$ is *Riemannian* it is also sufficient. This is exactly how **induced metrics** on submanifolds arise: an embedded $S^2 \subseteq \mathbb{R}^3$ inherits a metric by pulling back the Euclidean inner product through the inclusion. In indefinite signature injectivity is not enough — a null hyperplane in [Minkowski space](note:minkowski-space) is embedded, yet the pulled-back metric on it is degenerate.

## Existence

Every manifold admits a Riemannian metric: glue local Euclidean metrics with a [partition of unity](note:partition-of-unity). (This uses [paracompactness](note:paracompact), automatic for second-countable Hausdorff spaces.) Lorentzian metrics are much more restrictive: a closed (compact, boundaryless) manifold admits a Lorentzian metric iff it has a nowhere-vanishing vector field, equivalently iff its [Euler characteristic](note:euler-characteristic) vanishes. Among compact $2$-manifolds, only the torus and Klein bottle admit Lorentzian metrics; the sphere does not. ($S^2$ has Euler characteristic $2$.)

GR is set on non-compact spacetimes for a causal reason: every compact Lorentzian manifold contains a closed timelike curve.

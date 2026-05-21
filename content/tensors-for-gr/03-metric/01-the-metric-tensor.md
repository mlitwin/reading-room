---
title: The metric tensor
---

A **metric** on $M$ is a smooth $(0, 2)$-tensor field $g$ that is **symmetric** and **non-degenerate** at every point:

- *Symmetry.* $g(v, w) = g(w, v)$ for all $v, w \in T_p M$.
- *Non-degeneracy.* If $g(v, w) = 0$ for every $w$, then $v = 0$.

In components $g = g_{\mu\nu}\, dx^\mu \otimes dx^\nu$ with $g_{\mu\nu} = g_{\nu\mu}$, and the matrix $[g_{\mu\nu}]$ is invertible at every point. We write $g^{\mu\nu}$ for the entries of the inverse matrix, so $g^{\mu\rho} g_{\rho\nu} = \delta^\mu_\nu$. The inverse is itself a tensor field, of type $(2, 0)$.

## Signature

The symmetric bilinear form $g_p$ at a point is classified up to choice of basis by its **signature** $(p, q)$ with $p + q = n$ — the number of positive and negative eigenvalues. Three cases come up:

- **Riemannian:** signature $(n, 0)$, i.e. $g$ is positive-definite. $g(v, v) > 0$ for $v \neq 0$. Every $v$ has a positive length $\sqrt{g(v, v)}$.
- **Lorentzian:** signature $(1, n-1)$ or $(n-1, 1)$ depending on convention; one direction is "timelike" and the rest are "spacelike." General relativity uses Lorentzian signature on a $4$-manifold with convention $(-, +, +, +)$ (so timelike vectors have $g(v, v) < 0$) or $(+, -, -, -)$ (the opposite).
- **Pseudo-Riemannian:** any non-degenerate signature, generalizing both above.

The signature is a discrete invariant — it cannot change continuously over a connected manifold. A Lorentzian metric distinguishes three classes of tangent vector at each point:

- **Timelike** if $g(v, v) < 0$ (in mostly-plus convention) — into the future or past lightcone.
- **Null** (or *lightlike*) if $g(v, v) = 0$ — on the lightcone.
- **Spacelike** if $g(v, v) > 0$ — outside the lightcone.

A Lorentzian manifold also needs a **time orientation** — a continuous choice of "future" lightcone at each point — to do physics. Not every Lorentzian manifold admits one; those that do are called **time-orientable**.

## Inner product on $T_p M$

A metric gives the tangent space an **inner product** (Riemannian) or **scalar product** (Lorentzian). For $v, w \in T_p M$ with components $v^\mu, w^\mu$,
$$g(v, w) = g_{\mu\nu}\, v^\mu w^\nu.$$
Length squared: $|v|^2 := g(v, v)$. Length of a curve $\gamma: [a, b] \to M$:
$$L(\gamma) := \int_a^b \sqrt{|g_{\mu\nu}\, \dot\gamma^\mu \dot\gamma^\nu|}\, dt.$$
The absolute value is needed in the Lorentzian case; spacelike and timelike curves have positive lengths under this definition, with the timelike length being **proper time** along the curve. Null curves have zero length.

Angles between $v, w$ are defined (in the Riemannian case) by $\cos\theta = g(v, w) / (|v|\, |w|)$. There is no useful angle notion for null vectors in the Lorentzian case.

## Pullback of a metric

Given a smooth $F: N \to M$ and a metric $g$ on $M$, the pullback $F^* g$ is a *candidate* metric on $N$:
$$(F^* g)_p(v, w) := g_{F(p)}(dF_p \cdot v, dF_p \cdot w).$$
It is always symmetric, but is non-degenerate (hence a true metric) only when $dF_p$ is injective at every $p$ — i.e., when $F$ is an immersion. This is exactly how **induced metrics** on submanifolds arise: an embedded $S^2 \subseteq \mathbb{R}^3$ inherits a metric by pulling back the Euclidean inner product through the inclusion.

## Existence

Any paracompact manifold admits a Riemannian metric — partition-of-unity construction. Lorentzian metrics are much more restrictive: a closed orientable $n$-manifold admits a Lorentzian metric iff it has a nowhere-vanishing vector field, equivalently iff its Euler characteristic vanishes. Among compact $2$-manifolds, only the torus and Klein bottle admit Lorentzian metrics; the sphere does not. ($S^2$ has Euler characteristic $2$.)

This is one reason GR is set on non-compact spacetimes (open $4$-manifolds, asymptotically flat or otherwise), or on compact $4$-manifolds with non-zero Euler-characteristic obstructions handled by topology.

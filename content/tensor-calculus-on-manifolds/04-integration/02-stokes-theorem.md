---
title: Stokes's theorem
---

A **manifold with boundary** is a topological space modeled locally on $\mathbb{R}^n$ (interior points) or on $\mathbb{H}^n := \{x \in \mathbb{R}^n : x^n \geq 0\}$ (boundary points). The **boundary** $\partial M$ is the set of points mapped to $\{x^n = 0\}$ by some (hence every) chart; it's itself a smooth $(n-1)$-manifold (without boundary).

**Boundary orientation.** If $M$ is oriented with form $\Omega$ and $\nu$ is an outward-pointing vector field along $\partial M$, the induced orientation on $\partial M$ is represented by $\iota_\nu \Omega|_{\partial M}$. ("Outward normal first" convention.)

**Stokes's theorem.** Let $M$ be a smooth oriented $n$-manifold with boundary, and let $\omega \in \Omega^{n-1}(M)$ have compact support. Then
$$\boxed{\quad \int_M d\omega \;=\; \int_{\partial M} \omega \quad}$$
with $\partial M$ given the induced orientation. (If $M$ has no boundary, both sides vanish when $\omega$ has compact support.)

**Specializations.**

| Setting | Stokes becomes |
|---|---|
| $n = 1$, $M = [a, b]$, $\omega = f$ | Fundamental theorem: $\int_a^b f'\, dx = f(b) - f(a)$ |
| $n = 2$, $M \subseteq \mathbb{R}^2$ | Green's theorem |
| 2-surface in $\mathbb{R}^3$ | Classical Stokes (curl theorem) |
| $n = 3$, $M \subseteq \mathbb{R}^3$ | Divergence theorem (Gauss) |

All four are the same statement with different test forms and different identifications of forms with vector-field operations under the Euclidean metric.

**Consequences.**

- If $\omega$ is closed and $M$ has no boundary, $\int_M \omega$ is a homotopy invariant of $\omega$ (depends only on cohomology class).
- For a compact manifold without boundary, an exact $n$-form integrates to zero. Hence a volume form is never exact on a compact orientable closed manifold — proving that $H^n_{dR}(M) \neq 0$ for such $M$.

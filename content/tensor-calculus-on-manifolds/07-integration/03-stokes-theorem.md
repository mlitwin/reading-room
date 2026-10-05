---
title: Stokes's theorem
---

A **manifold with boundary** is defined like a smooth manifold, but with charts valued in the half-space $\mathbb{H}^n := \{x \in \mathbb{R}^n : x^n \geq 0\}$. The **boundary** $\partial M$ is the set of points mapped to $\{x^n = 0\}$ by some (hence every) chart. It is a smooth $(n-1)$-manifold without boundary.

**Boundary orientation.** If $M$ is oriented with form $\tens{\Omega}$ and $\tens{\nu}$ is an outward-pointing vector field along $\partial M$, the induced orientation on $\partial M$ is represented by the [interior product](note:interior-product) $\iota_{\tens{\nu}} \tens{\Omega}|_{\partial M}$. This is the "outward normal first" convention.

**Stokes's theorem.** Let $M$ be a smooth oriented $n$-manifold with boundary, and let $\tens{\omega} \in \Omega^{n-1}(M)$ have [compact support](note:compact-support). Then
$$\boxed{\quad \int_M d\tens{\omega} \;=\; \int_{\partial M} \tens{\omega} \quad}$$
with $\partial M$ given the induced orientation. (If $M$ has no boundary, both sides vanish when $\tens{\omega}$ has compact support.)

**Specializations.**

| Setting | Stokes becomes |
|---|---|
| $n = 1$, $M = [a, b]$, $\tens{\omega} = f$ | Fundamental theorem: $\int_a^b f'\, dx = f(b) - f(a)$ |
| $n = 2$, $M \subseteq \mathbb{R}^2$ | Green's theorem |
| 2-surface in $\mathbb{R}^3$ | Classical Stokes (curl theorem) |
| $n = 3$, $M \subseteq \mathbb{R}^3$ | Divergence theorem (Gauss) |

The four differ only in the degree of the form and in how the Euclidean metric identifies forms with the vector-calculus operations grad, curl and div.

**Consequences.**

- If $M$ has no boundary, the integral of a compactly supported $n$-form is unchanged by adding $d\tens{\eta}$ ($\tens{\eta}$ compactly supported), since $\int_M d\tens{\eta} = 0$: it depends only on the [cohomology class](note:de-rham-cohomology).
- On a closed (compact, boundaryless) oriented $M$, an exact $n$-form integrates to zero while a volume form integrates to a positive number. So a volume form is never exact, and $H^n_{dR}(M) \neq 0$.

---
title: Tangent vectors
---

A **tangent vector** at a point $p$ of a manifold $M$ is an arrow at $p$ — a velocity that a curve through $p$ could have. The tangent space $T_p M$ is the $n$-dimensional vector space of all such arrows.

## Two views

**Embedded view.** If $M \subseteq \mathbb{R}^N$ is a smooth submanifold and $\gamma: (-\varepsilon, \varepsilon) \to M$ is a smooth curve with $\gamma(0) = p$, the tangent vector is the ordinary derivative
$$v = \gamma'(0) \in \mathbb{R}^N.$$
This automatically lies in the affine tangent plane to $M$ at $p$. Different curves with the same derivative at $0$ give the same tangent vector; $T_p M$ is the linear span of all such $\gamma'(0)$.

**Abstract view.** Without an embedding, a tangent vector is a [derivation](note:derivation) at $p$: an $\mathbb{R}$-linear map $v: C^\infty(M) \to \mathbb{R}$ satisfying the Leibniz rule
$$v(fg) = f(p)\, v(g) + g(p)\, v(f).$$
Equivalently, an equivalence class of curves through $p$ with the same first-order behavior in any chart. (See the [manifolds book](../../calculus-on-manifolds/01-manifolds/02-tangent-space.md) for the full three-definitions taxonomy.)

The two views agree wherever both apply: a curve $\gamma$ in the embedded picture acts on $f \in C^\infty(M)$ by $v(f) = (f \circ \gamma)'(0)$, recovering the derivation.

## Components

In a chart $\varphi = (x^1, \ldots, x^n)$ around $p$, the **coordinate basis** of $T_p M$ is
$$\partial_\mu\big|_p := \frac{\partial}{\partial x^\mu}\bigg|_p, \qquad \mu = 1, \ldots, n,$$
where $\partial_\mu|_p$ is the derivation $f \mapsto (\partial f / \partial x^\mu)(p)$. An arbitrary tangent vector is
$$v = v^\mu\, \partial_\mu\big|_p,$$
with $v^\mu \in \mathbb{R}$. The numbers $v^\mu$ are the **contravariant components** of $v$ — "contravariant" because of how they transform (next).

## Transformation rule

Under a change of coordinates $x^\mu \mapsto x'^{\mu'}(x)$, the new basis vectors and components are
$$\partial_{\mu'}' = \frac{\partial x^\nu}{\partial x'^{\mu'}}\, \partial_\nu, \qquad v'^{\mu'} = \frac{\partial x'^{\mu'}}{\partial x^\nu}\, v^\nu.$$
The components transform with the *inverse* Jacobian of the basis — opposite ("contra") to the basis. This is the defining property of a contravariant index.

**Index notation:** $v^\mu$ with the index up, transforming as above.  
**Coordinate-free:** $v \in T_p M$, no indices, no chart.

## Vector fields

A **vector field** $X$ on $M$ assigns a tangent vector $X_p \in T_p M$ to each $p$, smoothly. In coordinates
$$X = X^\mu(x)\, \partial_\mu,$$
with $X^\mu \in C^\infty(U)$ on the chart's domain $U$. Vector fields act on functions: $X(f)(p) := X_p(f)$.

The space of smooth vector fields on $M$ is $\mathfrak{X}(M)$. It's a [Lie algebra](note:lie-algebra) under the bracket $[X, Y]f = X(Y f) - Y(X f)$.

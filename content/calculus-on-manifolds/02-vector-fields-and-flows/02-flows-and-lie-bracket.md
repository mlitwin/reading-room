---
title: Flows and the Lie bracket
---

An **integral curve** of $X$ through $p$ is a smooth curve $\gamma: I \to M$ on an open interval $I \ni 0$ with
$$\gamma(0) = p, \qquad \gamma'(t) = X_{\gamma(t)} \text{ for all } t \in I.$$
Local existence and uniqueness follow from the standard ODE theorems applied in a chart.

The **flow** of $X$ is the map $\theta$ defined on the maximal open set $\mathcal{D} \subseteq \mathbb{R} \times M$ for which the integral curves exist; we write $\theta_t(p) := \theta(t, p)$. The flow satisfies the **flow group laws**:
$$\theta_0 = \mathrm{id}_M, \qquad \theta_t \circ \theta_s = \theta_{t+s} \quad \text{where defined.}$$

A vector field with $\mathcal{D} = \mathbb{R} \times M$ is **complete** — its flow is defined for all time. Vector fields with compact support are always complete; on a compact $M$, every vector field is complete.

**Lie bracket.** The **Lie bracket** of $X, Y \in \mathfrak{X}(M)$ is the vector field
$$[X, Y]f := X(Y(f)) - Y(X(f)), \qquad f \in C^\infty(M).$$

In coordinates,
$$[X, Y]^k = X^i\, \partial_i Y^k - Y^i\, \partial_i X^k.$$

Properties:

- **$\mathbb{R}$-bilinear**.
- **Antisymmetric**: $[X, Y] = -[Y, X]$.
- **Jacobi identity**: $[X, [Y, Z]] + [Y, [Z, X]] + [Z, [X, Y]] = 0$.
- **Not** $C^\infty(M)$-bilinear: $[X, fY] = f[X, Y] + X(f)\, Y$.

These three identities make $\mathfrak{X}(M)$ an (infinite-dimensional) **Lie algebra** over $\mathbb{R}$.

**Geometric meaning.** $[X, Y] = 0$ identically iff the flows of $X$ and $Y$ commute:
$$\theta^X_t \circ \theta^Y_s = \theta^Y_s \circ \theta^X_t$$
on a neighborhood where both sides are defined.

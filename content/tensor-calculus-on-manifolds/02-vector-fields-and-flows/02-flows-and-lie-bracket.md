---
title: Flows and the Lie bracket
---

An **integral curve** of $\tens{X}$ through $p$ is a smooth curve $\gamma: I \to M$ on an open interval $I \ni 0$ with
$$\gamma(0) = p, \qquad \gamma'(t) = \tens{X}_{\gamma(t)} \text{ for all } t \in I.$$
Local existence and uniqueness follow from the standard ODE theorems applied in a chart.

The **flow** of $\tens{X}$ is the map $\theta$ defined on the maximal open set $\mathcal{D} \subseteq \mathbb{R} \times M$ for which the integral curves exist; we write $\theta_t(p) := \theta(t, p)$. The flow satisfies the **flow group laws**:
$$\theta_0 = \mathrm{id}_M, \qquad \theta_t \circ \theta_s = \theta_{t+s} \quad \text{where defined.}$$

A vector field with $\mathcal{D} = \mathbb{R} \times M$ is **complete** — its flow is defined for all time. Vector fields with [compact support](note:compact-support) are always complete; on a compact $M$, every vector field is complete.

**Lie bracket.** The **Lie bracket** of $\tens{X}, \tens{Y} \in \mathfrak{X}(M)$ is the vector field
$$[\tens{X}, \tens{Y}]f := \tens{X}(\tens{Y}(f)) - \tens{Y}(\tens{X}(f)), \qquad f \in C^\infty(M).$$

In coordinates,
$$[\tens{X}, \tens{Y}]^k = X^i\, \partial_i Y^k - Y^i\, \partial_i X^k.$$

Properties:

- **$\mathbb{R}$-bilinear**.
- **Antisymmetric**: $[\tens{X}, \tens{Y}] = -[\tens{Y}, \tens{X}]$.
- **Jacobi identity**: $[\tens{X}, [\tens{Y}, \tens{Z}]] + [\tens{Y}, [\tens{Z}, \tens{X}]] + [\tens{Z}, [\tens{X}, \tens{Y}]] = 0$.
- **Not** $C^\infty(M)$-bilinear: $[\tens{X}, f\tens{Y}] = f[\tens{X}, \tens{Y}] + \tens{X}(f)\, \tens{Y}$.

The first three properties make $\mathfrak{X}(M)$ an (infinite-dimensional) [Lie algebra](note:lie-algebra) over $\mathbb{R}$; the fourth is the price of trading $\mathbb{R}$ for $C^\infty(M)$ as scalars.

**Geometric meaning.** $[\tens{X}, \tens{Y}] = 0$ identically iff the flows of $\tens{X}$ and $\tens{Y}$ commute:
$$\theta^{\tens{X}}_t \circ \theta^{\tens{Y}}_s = \theta^{\tens{Y}}_s \circ \theta^{\tens{X}}_t$$
on a neighborhood where both sides are defined.

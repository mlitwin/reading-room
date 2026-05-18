---
title: Tangent space
---

The **tangent space at $p$**, denoted $T_p M$, is the $n$-dimensional vector space of "directions" at $p$. Three equivalent definitions:

1. **Curves modulo first-order tangency.** Equivalence classes of smooth curves $\gamma: (-\varepsilon, \varepsilon) \to M$ with $\gamma(0) = p$ under $\gamma_1 \sim \gamma_2 \iff (\varphi \circ \gamma_1)'(0) = (\varphi \circ \gamma_2)'(0)$ for some (equivalently, any) chart.

2. **Derivations at $p$.** Linear maps $v: C^\infty(M) \to \mathbb{R}$ satisfying Leibniz:
$$v(fg) = f(p)\, v(g) + g(p)\, v(f).$$

3. **Coordinate $n$-tuples that transform.** Tuples $(v^1, \ldots, v^n) \in \mathbb{R}^n$ assigned to each chart, related across charts by the Jacobian of the transition map.

In coordinates the basis vectors are the partial-derivative operators
$$\partial_i\big|_p := \frac{\partial}{\partial x^i}\bigg|_p,$$
and an arbitrary tangent vector is $v = v^i\, \partial_i|_p$.

**Differential of a smooth map.** For $F: M \to N$, the differential at $p$ is the linear map
$$dF_p: T_p M \to T_{F(p)} N, \qquad (dF_p \cdot v)(g) := v(g \circ F).$$
Also called the **pushforward** and written $F_{*,p}$. The chain rule reads $d(G \circ F)_p = dG_{F(p)} \circ dF_p$.

**Tangent bundle.** $TM := \bigsqcup_p T_p M$ is itself a smooth manifold of dimension $2n$, with projection $\pi: TM \to M$ and natural smooth structure coming from the charts on $M$.

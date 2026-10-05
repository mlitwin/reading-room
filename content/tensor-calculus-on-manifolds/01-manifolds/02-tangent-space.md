---
title: Tangent space
---

The **tangent space at $p$**, denoted $T_p M$, is the $n$-dimensional vector space of "directions" at $p$ — the velocities a curve through $p$ could have.

## Three equivalent definitions

1. **Curves modulo first-order tangency.** Equivalence classes of smooth curves $\gamma: (-\varepsilon, \varepsilon) \to M$ with $\gamma(0) = p$ under $\gamma_1 \sim \gamma_2 \iff (\varphi \circ \gamma_1)'(0) = (\varphi \circ \gamma_2)'(0)$ for some (equivalently, any) chart.

2. **[Derivations](note:derivation) at $p$.** Linear maps $\tens{v}: C^\infty(M) \to \mathbb{R}$ satisfying Leibniz:
$$\tens{v}(fg) = f(p)\, \tens{v}(g) + g(p)\, \tens{v}(f).$$

3. **Coordinate $n$-tuples that transform.** Tuples $(v^1, \ldots, v^n) \in \mathbb{R}^n$ assigned to each chart, related across charts by the Jacobian of the transition map, $v'^{i'} = (\partial x'^{i'} / \partial x^j)\, v^j$.

The three define the same space; which is most convenient depends on the construction at hand.

## Embedded view

When $M \subseteq \mathbb{R}^N$ is a smooth [submanifold](note:embedded-manifold), the definitions become concrete: the tangent vector of a curve $\gamma$ with $\gamma(0) = p$ is the ordinary derivative $\gamma'(0) \in \mathbb{R}^N$, lying in the tangent plane to $M$ at $p$ (a linear subspace of $\mathbb{R}^N$). The curve acts on $f \in C^\infty(M)$ by $\tens{v}(f) = (f \circ \gamma)'(0)$, recovering the derivation. The abstract definitions are what survive when no ambient $\mathbb{R}^N$ is available.

## Coordinate basis and components

In a chart $\varphi = (x^1, \ldots, x^n)$ the basis vectors are the partial-derivative operators
$$\partial_i\big|_p := \frac{\partial}{\partial x^i}\bigg|_p, \qquad \partial_i|_p : f \mapsto \frac{\partial f}{\partial x^i}(p),$$
and an arbitrary tangent vector is
$$\tens{v} = v^i\, \partial_i\big|_p, \qquad v^i \in \mathbb{R}.$$
The numbers $v^i$ are the **contravariant components** of $\tens{v}$ — index up, the name justified by how they transform.

## Transformation rule

Under a change of coordinates $x^i \mapsto x'^{i'}(x)$, the basis and components transform oppositely:
$$\partial_{i'}' = \frac{\partial x^j}{\partial x'^{i'}}\, \partial_j, \qquad v'^{i'} = \frac{\partial x'^{i'}}{\partial x^j}\, v^j.$$
The components use the inverse of the basis's matrix ("contra" to it). The opposite transformations keep $\tens{v}$ itself chart-independent while its component array changes.

**Index notation:** $v^i$, index up. **Coordinate-free:** $\tens{v} \in T_p M$, no chart.

## Differential of a smooth map

For $F: M \to N$, the differential at $p$ is the linear map
$$dF_p: T_p M \to T_{F(p)} N, \qquad (dF_p \cdot \tens{v})(g) := \tens{v}(g \circ F).$$
Also called the **pushforward** and written $F_{*,p}$; in components $(F_* \tens{v})^{i'} = \frac{\partial F^{i'}}{\partial x^j}\, v^j$. The chain rule reads $d(G \circ F)_p = dG_{F(p)} \circ dF_p$.

## Tangent bundle

$TM := \bigsqcup_p T_p M$ is itself a smooth manifold of dimension $2n$, with projection $\pi: TM \to M$ and natural smooth structure coming from the charts on $M$.

**Induced coordinates.** A chart $(x^i)$ on $U \subseteq M$ gives coordinates $(x^i, v^i)$ on $\pi^{-1}(U) \subseteq TM$. They assign to $\tens{v} = v^i\, \partial_i|_p$ the $2n$ numbers $(x^i(p), v^i)$. Under a change of chart, $x^i$ transforms as a coordinate and $v^i$ by the Jacobian. In mechanics $TM$ is the space of positions and velocities, with these coordinates written $(q^i, \dot q^i)$ ([chapter 10](../10-lagrangian-mechanics/03-action-and-euler-lagrange.md)).

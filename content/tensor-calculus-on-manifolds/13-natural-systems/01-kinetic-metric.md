---
title: The kinetic metric
---

## Kinetic energy as a metric

For $N$ particles in $\mathbb{R}^3$, the kinetic energy is
$$T = \tfrac12 \sum_A m_A\, \lvert \dot{\tens{r}}_A \rvert^2 = \tfrac12\, g_{ij}\, \dot q^i \dot q^j, \qquad \tens{g} = \sum_A m_A \bigl(dx_A^2 + dy_A^2 + dz_A^2\bigr),$$
a flat, **mass-weighted Euclidean [metric](note:metric)** on $Q = \mathbb{R}^{3N}$. In other coordinates the same metric has other components. In polar coordinates on $\mathbb{R}^2$, $\tens{g} = m\,(dr^2 + r^2\, d\varphi^2)$.

In general, a **natural system** is a manifold $Q$ with a Riemannian metric $\tens{g}$ (the kinetic metric) and a function $V$, with
$$L = \tfrac12\, \tens{g}(\dot q, \dot q) - V(q) = \tfrac12\, g_{ij}(q)\, \dot q^i \dot q^j - V(q).$$
Positive kinetic energy is what makes $\tens{g}$ Riemannian. A rigid body is the classic case with a non-flat kinetic metric: $Q = \mathbb{R}^3 \times SO(3)$, with a left-invariant metric on $SO(3)$ given by the inertia tensor.

## The Legendre transform is index lowering

The momentum is
$$p_i = \frac{\partial L}{\partial \dot q^i} = g_{ij}\, \dot q^j, \qquad p = \dot q^\flat.$$
The fiber derivative of [chapter 7](../07-hamiltonian-mechanics/01-legendre-and-hamiltons-equations.md) is exactly the [musical isomorphism](note:musical-isomorphism) $\flat: TQ \to T^*Q$. In particular it is a global diffeomorphism, so natural Lagrangians are hyperregular. The Hamiltonian uses the inverse metric:
$$H = \tfrac12\, g^{ij}\, p_i p_j + V.$$
The velocity–momentum distinction that the [notation](../00-notation.md) keeps (index up vs down) is exactly the distinction a metric removes. In Cartesian coordinates with unit masses, $p_i = \dot q^i$ numerically, which is why elementary mechanics never needs to make it.

## Constraints are induced metrics

A holonomic constraint confines $Q$ to a submanifold $\iota: Q' \hookrightarrow Q$ ([chapter 6](../06-lagrangian-mechanics/03-constraints-and-examples.md)). Restricting $L$ to $TQ'$ replaces $\tens{g}$ by its [pullback](note:pullback) $\iota^* \tens{g}$, the induced metric. The constraint-free system on $Q'$ is again natural, with kinetic metric $\iota^*\tens{g}$ and potential $V \circ \iota$.

Example: a particle of mass $m$ confined to the sphere of radius $R$ in $\mathbb{R}^3$. The induced metric is
$$\iota^* \tens{g} = m R^2 \bigl(d\theta^2 + \sin^2\theta\, d\varphi^2\bigr),$$
which is $m R^2$ times the round metric of [chapter 11](../11-metric/04-on-the-sphere.md).

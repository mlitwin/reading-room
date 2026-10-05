---
title: Constraints and examples
---

## Holonomic constraints

A [holonomic constraint](note:holonomic-constraint) $f(q, t) = 0$ cuts $Q$ down to a submanifold $Q' \subset Q$, which moves if $f$ depends on $t$. Let $\iota: Q' \hookrightarrow Q$ be the inclusion. The reduced Lagrangian is the restriction of $L$ to velocities tangent to $Q'$:
$$L' := L \circ d\iota: TQ' \times \mathbb{R} \to \mathbb{R}.$$
In coordinates $\tilde q^1, \ldots, \tilde q^{n'}$ on $Q'$ ($n' = n - 1$ for one constraint), this is $L$ with $q = q(\tilde q, t)$ substituted. $L'$ has its own Euler–Lagrange equations on $Q'$, and for ideal (workless) constraints the constraint forces never appear.

**Constraints are induced metrics.** For a natural system and a fixed constraint, restricting $T$ replaces $\tens{g}$ by its [pullback](note:pullback) $\iota^* \tens{g}$, the [induced metric](../03-metric/01-the-metric-tensor.md). The constrained system is again natural, with kinetic metric $\iota^*\tens{g}$ and potential $V \circ \iota$. For a particle of mass $m$ confined to the sphere of radius $R$ in $\mathbb{R}^3$,
$$\iota^* \tens{g} = m R^2 \bigl(d\theta^2 + \sin^2\theta\, d\varphi^2\bigr),$$
which is $m R^2$ times the [round metric](../04-coordinate-systems/06-the-round-metric.md).

**Lagrange multipliers.** Alternatively, stay on $Q$ and enforce $f = 0$ alongside
$$\frac{d}{dt}\frac{\partial L}{\partial \dot q^i} - \frac{\partial L}{\partial q^i} = \lambda\, \frac{\partial f}{\partial q^i}.$$
The right-hand side is the generalized constraint force, the 1-form $\lambda\, df$. It annihilates every velocity tangent to the constraint surface, which is what "workless" means. For a nonholonomic constraint $a_i(q, t)\, \dot q^i = 0$, replace $\partial f / \partial q^i$ by $a_i$.

## Cyclic coordinates

If $\partial L / \partial q^k = 0$ for some coordinate $q^k$ (a [cyclic coordinate](note:cyclic-coordinate)), its Euler–Lagrange equation is $\frac{d}{dt}(\partial L / \partial \dot q^k) = 0$. The conjugate momentum $p_k$ is conserved. This is the simplest case of [Noether's theorem](../12-symmetry-and-noether/01-noethers-theorem.md): $L$ is invariant under translations of $q^k$.

## Examples

**Pendulum.** A mass $m$ on a rigid rod of length $\ell$ in a uniform field $g$. The configuration space is the circle, $Q = S^1$, with angle $\theta$ from the downward vertical:
$$L = \tfrac12 m \ell^2 \dot\theta^2 - m g \ell\, (1 - \cos\theta), \qquad \ell \ddot\theta + g \sin\theta = 0.$$
The tension in the rod never enters.

**Free particle on a sphere.** On $Q = S^2$ of radius $R$,
$$L = \tfrac12 m R^2 \bigl(\dot\theta^2 + \sin^2\theta\, \dot\varphi^2\bigr),$$
the kinetic energy of the induced metric above. The Euler–Lagrange equations are
$$\ddot\theta - \sin\theta\cos\theta\, \dot\varphi^2 = 0, \qquad \ddot\varphi + 2\cot\theta\, \dot\theta\dot\varphi = 0,$$
which is $\nabla_{\dot q}\dot q = 0$ for the round metric: the motion is geodesic, along great circles at constant speed ([chapter 8](../08-connection-and-curvature/06-on-the-sphere.md)). The azimuth $\varphi$ is cyclic, so $p_\varphi = m R^2 \sin^2\theta\, \dot\varphi$ is conserved: it is the angular momentum about the $Z$-axis.

**Spherical pendulum.** Add gravity along $-Z$, $V = m g R \cos\theta$, with $\theta$ the polar angle from $+Z$. The $\theta$ equation gains a term $-(g/R)\sin\theta$. The azimuth is still cyclic, so $p_\varphi$ is still conserved. Of the round sphere's three rotational symmetries, gravity leaves only the one about the vertical ([chapter 12](../12-symmetry-and-noether/02-symmetry-and-the-sphere.md)).

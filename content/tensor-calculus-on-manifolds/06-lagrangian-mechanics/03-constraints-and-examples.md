---
title: Constraints and examples
---

## Holonomic constraints

A [holonomic constraint](note:holonomic-constraint) $f(q, t) = 0$ cuts $Q$ down to a submanifold $Q' \subset Q$, which moves if $f$ depends on $t$. Let $\iota: Q' \hookrightarrow Q$ be the inclusion. The reduced Lagrangian is the restriction of $L$ to velocities tangent to $Q'$:
$$L' := L \circ d\iota: TQ' \times \mathbb{R} \to \mathbb{R}.$$
In coordinates $\tilde q^1, \ldots, \tilde q^{n'}$ on $Q'$ ($n' = n - 1$ for one constraint), this is just $L$ with $q = q(\tilde q, t)$ substituted. $L'$ has its own Euler–Lagrange equations on $Q'$. For ideal (workless) constraints, the constraint forces never appear. When $L = T - V$, restricting $T$ amounts to [pulling back](note:pullback) the kinetic quadratic form to $Q'$. [Chapter 13](../13-natural-systems/index.md) reads that as the induced metric.

**Lagrange multipliers.** Alternatively, stay on $Q$ and enforce $f = 0$ alongside
$$\frac{d}{dt}\frac{\partial L}{\partial \dot q^i} - \frac{\partial L}{\partial q^i} = \lambda\, \frac{\partial f}{\partial q^i}.$$
The right-hand side is the generalized constraint force, the 1-form $\lambda\, df$. It annihilates every velocity tangent to the constraint surface, which is what "workless" means. For a nonholonomic constraint $a_i(q, t)\, \dot q^i = 0$, replace $\partial f / \partial q^i$ by $a_i$.

## Cyclic coordinates

If $\partial L / \partial q^k = 0$ for some coordinate $q^k$ (a [cyclic coordinate](note:cyclic-coordinate)), its Euler–Lagrange equation is $\frac{d}{dt}(\partial L / \partial \dot q^k) = 0$. The conjugate momentum $p_k$ is conserved. This is the simplest case of [Noether's theorem](../08-symmetry-and-noether/01-noethers-theorem.md): $L$ is invariant under translations of $q^k$.

## Examples

**Pendulum.** A mass $m$ on a rigid rod of length $\ell$ in a uniform field $g$. The configuration space is the circle, $Q = S^1$, with angle $\theta$ from the downward vertical:
$$L = \tfrac12 m \ell^2 \dot\theta^2 - m g \ell\, (1 - \cos\theta), \qquad \ell \ddot\theta + g \sin\theta = 0.$$
The tension in the rod never enters.

**Free particle on a sphere.** On $Q = S^2$ of radius $R$,
$$L = \tfrac12 m R^2 \bigl(\dot\theta^2 + \sin^2\theta\, \dot\varphi^2\bigr),$$
and the Euler–Lagrange equations are
$$\ddot\theta - \sin\theta\cos\theta\, \dot\varphi^2 = 0, \qquad \ddot\varphi + 2\cot\theta\, \dot\theta\dot\varphi = 0.$$
These are the geodesic equations of the round metric ([chapter 12](../12-connection-and-curvature/05-on-the-sphere.md)), whose solutions are great circles. The azimuth $\varphi$ is cyclic, so $p_\varphi = m R^2 \sin^2\theta\, \dot\varphi$ is conserved: it is the angular momentum about the $Z$-axis.

**Spherical pendulum.** Add gravity along $-Z$, $V = m g R \cos\theta$, with $\theta$ the polar angle from $+Z$. The $\theta$ equation gains a term $-(g/R)\sin\theta$. The azimuth is still cyclic, so $p_\varphi$ is still conserved. Of the round sphere's three rotational symmetries, gravity leaves only the one about the vertical.

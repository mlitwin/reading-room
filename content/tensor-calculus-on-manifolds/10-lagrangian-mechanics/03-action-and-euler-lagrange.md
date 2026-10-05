---
title: Action and the Euler–Lagrange equations
---

**Without a metric.** Everything on this page holds for an arbitrary Lagrangian; the kinetic metric returns on the [next page](04-covariant-newton.md).

A mechanical system on an $n$-dimensional [configuration space](note:configuration-space) $Q$ is specified by a smooth **Lagrangian**
$$L: TQ \times \mathbb{R} \to \mathbb{R}, \qquad (q, \dot q, t) \mapsto L(q, \dot q, t),$$
a function of position, velocity and (possibly) time. Here $(q^i, \dot q^i)$ are the [induced coordinates](../01-manifolds/02-tangent-space.md) on the [tangent bundle](note:tangent-space). For a natural system, $L = T - V$ with $T = \tfrac12\, g_{ij}\, \dot q^i \dot q^j$ ([previous page](02-kinetic-metric.md)).

**Action.** For a smooth path $q: [t_1, t_2] \to Q$,
$$S[q] := \int_{t_1}^{t_2} L\bigl(q(t), \dot q(t), t\bigr)\, dt,$$
a [functional](note:functional-and-variation) on paths with fixed endpoints.

**Hamilton's principle.** Physical motions are the stationary points of $S$. A variation $\delta q$ that vanishes at the endpoints leaves $S$ unchanged to first order.

## The Euler–Lagrange equations

For $q \mapsto q + \delta q$,
$$\delta S = \int_{t_1}^{t_2} \left( \frac{\partial L}{\partial q^i} - \frac{d}{dt}\frac{\partial L}{\partial \dot q^i} \right) \delta q^i\, dt + \left[ \frac{\partial L}{\partial \dot q^i}\, \delta q^i \right]_{t_1}^{t_2}.$$
The boundary term vanishes for fixed endpoints. Requiring $\delta S = 0$ for every interior $\delta q$ gives
$$\boxed{\quad E_i := \frac{d}{dt}\frac{\partial L}{\partial \dot q^i} - \frac{\partial L}{\partial q^i} = 0, \qquad i = 1, \ldots, n. \quad}$$
With non-conservative generalized forces $\tens{F} = F_i\, dq^i$ ([page 1](01-newtonian-mechanics.md)), the equations become $E_i = F_i$.

**Regularity.** The Euler–Lagrange equations are $n$ second-order ODEs. When the velocity Hessian $\partial^2 L / \partial \dot q^i \partial \dot q^j$ is invertible, they can be solved for $\ddot q$, and solutions are locally unique given $(q, \dot q)$ at one instant. For a natural system the Hessian is $g_{ij}$, invertible by definition.

## Why the equations are tensorial

Under a change of coordinates $q \mapsto \tilde q(q)$:

- the velocity transforms as a [tangent vector](note:tangent-space), $\dot{\tilde q}^i = (\partial \tilde q^i / \partial q^j)\, \dot q^j$;
- the Lagrangian is a scalar, $\tilde L(\tilde q, \dot{\tilde q}, t) = L(q, \dot q, t)$;
- the variation $\delta q^i$ is a vector.

The integrand of $\delta S$, $-E_i\, \delta q^i$, is chart-independent. So the $E_i$ transform as **covector** components:
$$\tilde E_i = \frac{\partial q^j}{\partial \tilde q^i}\, E_j.$$
"$E_i = F_i$" is therefore an equation between two covectors, valid in every chart. That is the structural advantage over writing $F = ma$ component by component. Momenta $p_i := \partial L / \partial \dot q^i$ are covector components too, which is why phase space is the *cotangent* bundle ([chapter 11](../11-hamiltonian-mechanics/index.md)).

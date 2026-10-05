---
title: Lagrangian mechanics
---

A mechanical system is a [configuration space](note:configuration-space) $Q$, an $n$-manifold of positions, together with a Lagrangian on its tangent bundle $TQ$. The physical motions are the stationary points of the [action](note:functional-and-variation). The main line is the **natural system**: $Q$ carries the **kinetic metric** $\tens{g}$, with kinetic energy $T = \tfrac12\, g_{ij}\, \dot q^i \dot q^j$, and $L = T - V$. The metric then turns each piece of mechanics into a piece of geometry:

| Mechanics | Geometry |
|---|---|
| kinetic energy $T$ | metric $\tens{g}$ on $Q$ |
| Euler–Lagrange equations | $\nabla_{\dot q} \dot q = -\operatorname{grad} V$ |
| free motion | [geodesics](note:geodesic) |
| fictitious forces in curvilinear coordinates | [Christoffel symbols](note:affine-connection) |
| holonomic constraint | induced metric on a submanifold |
| momentum $p_i = \partial L / \partial \dot q^i$ | $p = \dot q^\flat$: the Legendre transform lowers the index ([chapter 11](../11-hamiltonian-mechanics/01-legendre-and-hamiltons-equations.md)) |
| Noether symmetry | [Killing field](note:killing-vector) $\tens{\xi}$ with $\tens{\xi}(V) = 0$; charge $\tens{g}(\tens{\xi}, \dot q)$ ([chapter 12](../12-symmetry-and-noether/02-symmetry-and-the-sphere.md)) |

Five pages:

1. [Newtonian mechanics](01-newtonian-mechanics.md): the flat case; forces as 1-forms; the classical conservation laws.
2. [The kinetic metric](02-kinetic-metric.md): kinetic energy as a metric; natural systems.
3. [Action and the Euler–Lagrange equations](03-action-and-euler-lagrange.md): Hamilton's principle and why the equations are tensorial, for any Lagrangian.
4. [Covariant Newton](04-covariant-newton.md): $\nabla_{\dot q}\dot q = -\operatorname{grad} V$, flat reductions, the Jacobi metric.
5. [Constraints and examples](05-constraints-and-examples.md): constraints as induced metrics, multipliers, cyclic coordinates, the pendulum and the sphere.

Prerequisites: chapters 1–3 and 5, and pages 1–2 of [chapter 8](../08-connection-and-curvature/index.md).

**Without a metric:** Hamilton's principle, the Euler–Lagrange equations and their tensoriality hold for any Lagrangian on $TQ$, quadratic in the velocities or not (page 3). The relativistic particle of [chapter 13](../13-special-relativity/02-relativistic-particle.md) is a case where $L$ is not of the form $T - V$.

**Where this lands in GR.** Take $Q$ to be spacetime, $\tens{g}$ Lorentzian, and $V = 0$. Covariant Newton becomes the geodesic equation of free fall, and gravity is no longer a force term: it has moved into the metric.

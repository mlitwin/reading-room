---
title: Natural systems
---

Part II ran mechanics without a metric. Part III built metrics, connections and curvature. This chapter joins them through one observation: **kinetic energy is a metric**. Write $T = \tfrac12\, g_{ij}\, \dot q^i \dot q^j$. A *natural* mechanical system is a Riemannian manifold $(Q, \tens{g})$ with a potential $V$, and $L = T - V$. Then:

| Mechanics | Geometry |
|---|---|
| kinetic energy $T$ | metric $\tens{g}$ on $Q$ |
| momentum $p_i = \partial L / \partial \dot q^i$ | $p = \dot q^\flat$: the Legendre transform lowers the index |
| $H = \tfrac12 g^{ij} p_i p_j + V$ | the inverse metric on $T^*Q$ |
| Euler–Lagrange equations | $\nabla_{\dot q} \dot q = -\operatorname{grad} V$ |
| free motion | [geodesics](note:geodesic) |
| fictitious forces in curvilinear coordinates | [Christoffel symbols](note:affine-connection) |
| holonomic constraint | induced metric on a submanifold |
| Noether symmetry | [Killing field](note:killing-vector) $\tens{\xi}$ with $\tens{\xi}(V) = 0$; charge $\xi_i\, \dot q^i$ |

Four pages:

1. [The kinetic metric](02-kinetic-metric.md): mass-weighted metrics, the Legendre transform as $\flat$, constraints as induced metrics.
2. [Covariant Newton](04-covariant-newton.md): the Euler–Lagrange equations as $\nabla_{\dot q}\dot q = -\operatorname{grad} V$, flat reductions, the Jacobi metric.
3. [Symmetry and the sphere](../12-symmetry-and-noether/02-symmetry-and-the-sphere.md): Killing fields as conserved charges; the particle and the spherical pendulum on $S^2$.
4. [The rigid body](../12-symmetry-and-noether/04-rigid-body.md): a curved kinetic metric on $SO(3)$, Euler's equations, the heavy top.

**Where this lands in GR.** Take $Q$ to be spacetime, $\tens{g}$ Lorentzian, and $V = 0$. Covariant Newton becomes the geodesic equation, and Killing charges become the conserved energy and angular momentum of orbits ([chapter 15](../15-general-relativity/02-schwarzschild.md)). Gravity is no longer a force term: it has moved into the metric.

---
title: The kinetic metric
---

Kinetic energy is quadratic in the velocities. A quadratic form on each tangent space is a metric, so a mechanical system's kinetic energy *is* a metric on its configuration space.

For $N$ particles in $\mathbb{R}^3$, the kinetic energy is
$$T = \tfrac12 \sum_A m_A\, \lvert \dot{\tens{r}}_A \rvert^2 = \tfrac12\, g_{ij}\, \dot q^i \dot q^j, \qquad \tens{g} = \sum_A m_A \bigl(dx_A^2 + dy_A^2 + dz_A^2\bigr),$$
a flat, **mass-weighted Euclidean [metric](note:metric)** on $Q = \mathbb{R}^{3N}$. In other coordinates the same metric has other components. In polar coordinates on $\mathbb{R}^2$, $\tens{g} = m\,(dr^2 + r^2\, d\varphi^2)$.

In general, a **natural system** is a manifold $Q$ with a Riemannian metric $\tens{g}$ (the kinetic metric) and a function $V$, with
$$L = \tfrac12\, \tens{g}(\dot q, \dot q) - V(q) = \tfrac12\, g_{ij}(q)\, \dot q^i \dot q^j - V(q).$$
Positive kinetic energy is what makes $\tens{g}$ Riemannian. A rigid body is the classic case with a non-flat kinetic metric: $Q = \mathbb{R}^3 \times SO(3)$, with a left-invariant metric on $SO(3)$ given by the inertia tensor ([chapter 12](../12-symmetry-and-noether/04-rigid-body.md)).

The rest of the chapter, and chapters 11–12, take a natural system as the standing example:

- the Euler–Lagrange equations become $\nabla_{\dot q} \dot q = -\operatorname{grad} V$ ([page 4](04-covariant-newton.md));
- the momentum is $p = \dot q^\flat$ and the Hamiltonian is $\tfrac12\, g^{ij} p_i p_j + V$ ([chapter 11](../11-hamiltonian-mechanics/01-legendre-and-hamiltons-equations.md));
- a holonomic constraint replaces $\tens{g}$ by an induced metric ([page 5](05-constraints-and-examples.md));
- symmetries are Killing fields of $\tens{g}$ that preserve $V$ ([chapter 12](../12-symmetry-and-noether/02-symmetry-and-the-sphere.md)).

**Lorentzian kinetic metrics.** Positive kinetic energy makes $\tens{g}$ Riemannian. A relativistic particle has a Lorentzian "kinetic metric", spacetime's own $\tens{g}$, and no potential. Free fall is then its geodesic motion ([chapter 13](../13-special-relativity/02-relativistic-particle.md)).

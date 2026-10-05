---
title: Hamiltonian mechanics
---

The Hamiltonian formulation trades the second-order Euler–Lagrange equations on $TQ$ for a first-order system on phase space, the cotangent bundle $T^*Q$. The two are related by the Legendre transform. Phase space carries a canonical closed 2-form, the symplectic form $\tens{\omega} = d\tens{\theta}$, built from the [tautological 1-form](../01-manifolds/03-cotangent-space.md) of chapter 1. [Poisson brackets](note:poisson-bracket), canonical transformations and Liouville's theorem are all statements about it.

Two pages:

1. [Legendre transform and Hamilton's equations](01-legendre-and-hamiltons-equations.md): momenta as covectors, the Legendre transform as $\flat$, the general fiber derivative, Hamilton's equations.
2. [Phase space and the symplectic form](02-phase-space-and-symplectic-form.md): $\tens{\theta}$, $\tens{\omega}$, Hamiltonian vector fields, Poisson brackets, canonical maps, Liouville.

**Without a metric:** the fiber derivative, Hamilton's equations and the whole of page 2. The symplectic form is canonical on every cotangent bundle; for a natural system the metric enters only through $H$.

**Where this lands in GR.** A relativistic particle's Hamiltonian is $\tfrac12 g^{\mu\nu} p_\mu p_\nu$ on $T^*M$. The inverse metric appears because the Legendre transform of a quadratic Lagrangian is index lowering ([page 1](01-legendre-and-hamiltons-equations.md)), and the mass shell is the level set $g^{\mu\nu} p_\mu p_\nu = -m^2$ ([chapter 13](../13-special-relativity/index.md)).

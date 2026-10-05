---
title: Hamiltonian mechanics
---

The Hamiltonian formulation trades the second-order Euler–Lagrange equations on $TQ$ for a first-order system on phase space, the cotangent bundle $T^*Q$. The two are related by the Legendre transform. Phase space carries a canonical closed 2-form, the symplectic form $\tens{\omega} = d\tens{\theta}$, built from the [tautological 1-form](../01-manifolds/03-cotangent-space.md) of Part I. [Poisson brackets](note:poisson-bracket), canonical transformations and Liouville's theorem are all statements about it. Like the Lagrangian chapter, this one uses no metric.

Two pages:

1. [Legendre transform and Hamilton's equations](01-legendre-and-hamiltons-equations.md): momenta as covectors, the fiber derivative $TQ \to T^*Q$, Hamilton's equations.
2. [Phase space and the symplectic form](02-phase-space-and-symplectic-form.md): $\tens{\theta}$, $\tens{\omega}$, Hamiltonian vector fields, Poisson brackets, canonical maps, Liouville.

**Where this lands in GR.** A relativistic particle's Hamiltonian is $\tfrac12 g^{\mu\nu} p_\mu p_\nu$ on $T^*M$. The inverse metric appears because the Legendre transform of a quadratic Lagrangian is index lowering ([chapter 13](../13-natural-systems/index.md)), and the mass shell is the level set $g^{\mu\nu} p_\mu p_\nu = -m^2$ ([chapter 14](../14-special-relativity/index.md)).

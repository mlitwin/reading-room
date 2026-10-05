---
title: The theorem
---

## Symmetries as flows

Let $\phi_s$ be a one-parameter group of diffeomorphisms of $Q$: the [flow](note:flow) of a vector field $\tens{\xi} = \xi^i\, \partial_i$ (the **generator**). It acts on paths by $q(t) \mapsto \phi_s(q(t))$ and on velocities by the [differential](note:differential-of-a-map), $\dot q \mapsto d\phi_s \cdot \dot q$. Infinitesimally, $\delta q^i = \xi^i(q)$ and $\delta \dot q^i = \partial_j \xi^i\, \dot q^j$.

The flow is a **symmetry** of $L$ if
$$L\bigl(\phi_s(q),\, d\phi_s \cdot \dot q,\, t\bigr) = L(q, \dot q, t), \qquad \text{infinitesimally } \delta L = 0.$$
It is a **quasi-symmetry** if instead $\delta L = \tfrac{d}{dt} F(q, t)$ for some function $F$. In that case the action changes only by boundary terms, and the equations of motion are unchanged.

## Noether's theorem

For a (quasi-)symmetry with generator $\tens{\xi}$, the **Noether charge**
$$\boxed{\quad J_\xi := p_i\, \xi^i - F, \qquad p_i = \frac{\partial L}{\partial \dot q^i} \quad}$$
is constant along every solution of the [Euler–Lagrange equations](note:euler-lagrange-equations) ($F = 0$ for a strict symmetry).

*Proof.* By the chain rule,
$$\delta L = \frac{\partial L}{\partial q^i}\, \xi^i + \frac{\partial L}{\partial \dot q^i}\, \frac{d\xi^i}{dt}.$$
On a solution, $\partial L / \partial q^i = \dot p_i$ (Euler–Lagrange), so $\delta L = \tfrac{d}{dt}(p_i \xi^i)$. Setting this equal to $\tfrac{d}{dt}F$ gives $\tfrac{d}{dt} J_\xi = 0$. $\square$

**Geometric reading.** $J_\xi = \langle p, \tens{\xi} \rangle$ pairs the momentum [covector](note:cotangent-space) with the generator. No metric is involved, and the expression is chart-independent. If $\tens{\xi} = \partial_k$ is a coordinate vector field, $J_\xi = p_k$, which recovers the [cyclic-coordinate](note:cyclic-coordinate) rule.

## Time translation

If $\partial L / \partial t = 0$, the system is invariant under $t \mapsto t + \epsilon$. The corresponding charge is the energy,
$$E = p_i\, \dot q^i - L = H,$$
and directly $\tfrac{d}{dt}(p_i \dot q^i - L) = -\partial L / \partial t = 0$ on solutions. Symmetries that move $t$ as well as $q$ are handled by treating $t$ as a coordinate on the extended configuration space $Q \times \mathbb{R}$.

## Hamiltonian form

On phase space, $J_\xi(q, p) = p_i\, \xi^i(q)$ is a function. Its [Hamiltonian vector field](../07-hamiltonian-mechanics/02-phase-space-and-symplectic-form.md) is
$$\tens{X}_{J_\xi} = \xi^i\, \frac{\partial}{\partial q^i} - p_j\, \frac{\partial \xi^j}{\partial q^i}\, \frac{\partial}{\partial p_i},$$
which is the **cotangent lift** of $\phi_s$: the flow carries points by $\phi_s$ and covectors by the inverse transpose. Noether's theorem becomes
$$\frac{dJ_\xi}{dt} = \{J_\xi, H\} = -\tens{X}_{J_\xi}(H).$$
$J_\xi$ is conserved exactly when $H$ is invariant under the flow it generates. Read left to right, a conserved quantity generates a symmetry; read right to left, a symmetry gives a conserved quantity. Abstractly, $J$ is the **momentum map** of the symmetry group's action.

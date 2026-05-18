---
title: Legendre transform and Hamilton's equations
---

**Conjugate momenta.** Given a Lagrangian $L(q, \dot q, t)$, the **conjugate momentum** to $q^i$ is
$$p_i := \frac{\partial L}{\partial \dot q^i}.$$
Assume $L$ is *regular*: the map $\dot q \mapsto p$ at fixed $(q, t)$ is invertible. Then we can solve $p_i = \partial L / \partial \dot q^i$ for $\dot q$ as a function of $(q, p, t)$.

**Hamiltonian.** The **Hamiltonian** is the [Legendre transform](note:legendre-transform) of $L$ with respect to $\dot q$:
$$H(q, p, t) := p_i \dot q^i(q, p, t) - L(q, \dot q(q, p, t), t).$$

For $L = T(q, \dot q) - V(q)$ with $T$ a positive-definite quadratic form in $\dot q$ (the typical case), $H$ equals $T + V$ — total energy — when the constraints are time-independent.

**Hamilton's equations.** Differentiating the definition of $H$ and using the EL equations,
$$\boxed{\quad \dot q^i = \frac{\partial H}{\partial p_i}, \qquad \dot p_i = -\frac{\partial H}{\partial q^i}. \quad}$$
A system of $2n$ first-order ODEs on **phase space** $(q, p) \in T^* Q$ (the cotangent bundle of configuration space).

**Equivalence to Lagrangian.** Trajectories satisfying Hamilton's equations correspond bijectively to trajectories satisfying the Euler–Lagrange equations via the Legendre transform. The two formulations describe the same dynamics; they emphasize different geometric structures.

**Time evolution of $H$.** Differentiating:
$$\frac{dH}{dt} = \frac{\partial H}{\partial q^i} \dot q^i + \frac{\partial H}{\partial p_i} \dot p_i + \frac{\partial H}{\partial t} = \frac{\partial H}{\partial t}.$$
If $H$ has no explicit time dependence, $H$ is conserved along solutions — energy conservation.

**Example: free particle.** $L = \tfrac{1}{2} m |\dot q|^2$, $p = m\dot q$, $H = |p|^2 / (2m)$. Hamilton: $\dot q = p/m$, $\dot p = 0$. Straight-line motion at constant velocity.

**Example: harmonic oscillator.** $L = \tfrac{1}{2} m \dot q^2 - \tfrac{1}{2} k q^2$, $p = m\dot q$, $H = p^2/(2m) + \tfrac{1}{2} k q^2$. Hamilton: $\dot q = p/m$, $\dot p = -kq$. Sinusoidal solutions; phase-space orbits are ellipses.

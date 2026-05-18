---
title: Newton's laws
---

**N1** (inertia). A particle subject to no net force moves with constant velocity. Equivalently: there exist *inertial* reference frames in which N2 holds.

**N2** (force = rate of change of momentum). For a particle of momentum $p_a = m_a \dot r_a$ subject to net force $F_a$,
$$\dot p_a = F_a.$$
For constant mass, $F_a = m_a \ddot r_a$.

**N3** (action and reaction). The force exerted by particle $a$ on particle $b$ is equal in magnitude and opposite in direction to the force exerted by $b$ on $a$, along the line connecting them.

**Force types.**

- *Conservative*: $F_a = -\nabla_{r_a} V(r_1, \ldots, r_N)$ for some smooth potential $V$.
- *Gravitational, electrostatic*: conservative central forces.
- *Frictional / dissipative*: not derivable from a potential.

**Configuration.** The system's instantaneous state is a point in [configuration space](note:configuration-space) $Q \subseteq \mathbb{R}^{3N}$. For $N$ free particles, $Q = \mathbb{R}^{3N}$; constraints reduce its dimension.

**Constraints.** A [holonomic constraint](note:holonomic-constraint) is one expressible as a smooth equation $f(r_1, \ldots, r_N, t) = 0$. Examples: a rigid rod ($|r_a - r_b| = \ell$); a bead on a wire; the surface of a planet. *Nonholonomic* constraints involve velocities (e.g., a rolling disk's no-slip condition) and aren't integrable to a position constraint. The Lagrangian formalism handles holonomic constraints natively by working on the reduced manifold.

**Equation of motion.** The trajectory satisfies the second-order ODE system
$$m_a \ddot r_a = F_a(r_1, \ldots, r_N, \dot r_1, \ldots, \dot r_N, t).$$
For $N$ particles, this is $3N$ second-order equations; equivalently, a first-order system of dimension $6N$ on $\mathbb{R}^{3N} \times \mathbb{R}^{3N}$.

**Initial data.** Positions $\{r_a(0)\}$ and velocities $\{\dot r_a(0)\}$ determine the trajectory uniquely (Picard–Lindelöf, given regularity of $F$).
